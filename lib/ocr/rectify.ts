/* eslint-disable @typescript-eslint/no-explicit-any */
// Perspective-correct the card to a fronto-parallel crop using OpenCV.js
export async function rectifyWithOpenCV(
  srcCanvas: HTMLCanvasElement,
  outW = 1600,
  outH = 1000
) {
  const cvAny = (window as any).cv;
  if (!cvAny) throw new Error("OpenCV not loaded");
  const cv = cvAny;

  // Work from the original frame (not pre-thresholded)
  const src = cv.imread(srcCanvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  const edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.dilate(edges, edges, kernel);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let best: { pts: number[]; area: number; ratio: number } | null = null;
  const imgArea = src.rows * src.cols;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
    if (approx.rows === 4 && cv.isContourConvex(approx)) {
      // CORRECT way to read points in OpenCV.js
      const p = approx.data32S;
      const quad = [
        { x: p[0], y: p[1] },
        { x: p[2], y: p[3] },
        { x: p[4], y: p[5] },
        { x: p[6], y: p[7] },
      ];

      // order tl,tr,br,bl
      quad.sort((a, b) => a.y - b.y);
      const t1 = quad[0]!; const t2 = quad[1]!; const b1 = quad[2]!; const b2 = quad[3]!;
      const [tl, tr] = t1.x < t2.x ? [t1, t2] : [t2, t1];
      const [bl, br] = b1.x < b2.x ? [b1, b2] : [b2, b1];

      // sanity checks (area %, aspect ratio)
      const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
      const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
      const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
      const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);
      const avgW = (widthTop + widthBottom) / 2;
      const avgH = (heightLeft + heightRight) / 2;
      const ratio = avgW / Math.max(1, avgH);

      const area =
        Math.abs(
          tl.x * tr.y - tr.x * tl.y +
          tr.x * br.y - br.x * tr.y +
          br.x * bl.y - bl.x * br.y +
          bl.x * tl.y - tl.x * bl.y
        ) / 2;

      const areaPct = area / imgArea;
      const ratioOk = ratio > 1.2 && ratio < 1.9;      // ID cards ~1.58; licences similar
      const areaOk  = areaPct > 0.20 && areaPct < 0.95; // covers a decent chunk, not the whole frame

      if (ratioOk && areaOk) {
        if (!best || area > best.area) {
          best = { pts: [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y], area, ratio };
        }
      }
    }
    approx.delete();
  }

  if (!best) {
    // Fallback: no warp; use the original canvas (prevents black output)
    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete(); kernel.delete(); src.delete();
    return srcCanvas;
  }

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, new Float32Array(best.pts));
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, new Float32Array([0, 0, outW, 0, outW, outH, 0, outH]));
  const M = cv.getPerspectiveTransform(srcTri, dstTri);

  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(outW, outH), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW; outCanvas.height = outH;
  cv.imshow(outCanvas, dst);

  // cleanup
  src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete(); kernel.delete();
  srcTri.delete(); dstTri.delete(); M.delete(); dst.delete();

  return outCanvas;
}
