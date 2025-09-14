"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import type TesseractNS from "tesseract.js";
import { grabFrameToCanvas, toGrayscale, simpleThreshold } from "@/lib/ocr/preprocess";
import { rectifyWithOpenCV } from "@/lib/ocr/rectify";
import { fuseField, clearFusion } from "@/lib/ocr/fuse";

type Fields = {
  legalName?: string;
  licenseNo?: string;
  dob?: string;
  licenseExpiry?: string;
  issuingAuthority?: string;
  licenseClass?: string;
};

const AUTHORITIES = [
  "Manitoba", "Ontario", "Saskatchewan", "Alberta", "British Columbia", "Quebec",
  "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
  "Yukon", "Nunavut", "Northwest Territories",
  "California", "New York", "Texas", "Florida", "Washington"
];

export default function LicenseScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields | null>(null);
  const workerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null);

  useEffect(() => {
    const localVideo: HTMLVideoElement | null = videoRef.current;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (localVideo) { localVideo.srcObject = s; await localVideo.play(); }
      } catch { setStreamErr("Camera unavailable or denied. Use the upload option below."); }
    })();
    return () => {
      const s = (localVideo?.srcObject as MediaStream | undefined);
      s?.getTracks().forEach((t) => t.stop());
      (async () => { if (workerRef.current) await workerRef.current.terminate(); })();
      clearFusion();
    };
  }, []);

  async function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = await createWorker("eng", 1, { logger: () => {} });
    }
    return workerRef.current;
  }

  function bestAuthority(s: string) {
    const hit = AUTHORITIES
      .map((a) => [a, s.toLowerCase().indexOf(a.toLowerCase())] as const)
      .filter(([, i]) => i >= 0)
      .sort((a, b) => b[0].length - a[0].length)[0];
    return hit?.[0];
  }

  async function captureAndExtract() {
    if (!videoRef.current) return;
    setBusy(true); setFields(null); clearFusion();
    try {
      // Collect frames for fusion (rectify raw -> then preprocess)
      const frames = 5;
      const rectifiedCanvases: HTMLCanvasElement[] = [];

      for (let i = 0; i < frames; i++) {
        const raw = grabFrameToCanvas(videoRef.current, 1600);
        let rect: HTMLCanvasElement;
        try {
          rect = await rectifyWithOpenCV(raw, 1600, 1000);
        } catch {
          rect = raw; // fallback if OpenCV fails
        }
        if (i === 0) setPreviewUrl(rect.toDataURL("image/png"));
        let c = toGrayscale(rect);
        c = simpleThreshold(c, 185);
        rectifiedCanvases.push(c);
        // small pause between frames
        await new Promise((r) => setTimeout(r, 120));
      }

      const firstOcrCanvas = rectifiedCanvases[0];
      if (!firstOcrCanvas) throw new Error("No frames captured");

      const worker = await ensureWorker();

      // Pass 1: find anchors on first rectified frame
      const pass1Url = firstOcrCanvas.toDataURL("image/png");
      await worker.setParameters({ tessedit_pageseg_mode: "6" as unknown as TesseractNS.PSM });
      const pass1 = await worker.recognize(pass1Url, { rotateAuto: true });
      const words = pass1.data.words || [];

      const findAnchor = (regex: RegExp) => {
        const hit = words.find((w: TesseractNS.Word) => regex.test(w.text));
        if (!hit) return null;
        const { x0, y0, x1, y1 } = hit.bbox;
        return { x0, y0, x1, y1 };
      };

      const aDOB = findAnchor(/^(DOB|Date of Birth|Naissance|N[ée]\s? le)$/i);
      const aEXP = findAnchor(/^(EXP|Expiry|Expires|Expiration|Expire|Date d['’]expiration)$/i);
      const aCLASS = findAnchor(/^(CLASS|CL|Classe|Cat[ée]gorie)$/i);
      const aDL = findAnchor(/^(DL|LIC|Licence|License|No\.?|N[oº]\.?|Num[eé]ro)$/i);

      const outW = firstOcrCanvas.width; const outH = firstOcrCanvas.height;
      function roiToRight(a: { x0: number; y0: number; x1: number; y1: number } | null, W: number) {
        if (!a) return null;
        return { x: Math.min(W - 1, a.x1 + 8), y: Math.max(0, a.y0 - 8),
                 w: Math.min(Math.floor(W * 0.45), W - (a.x1 + 8)), h: Math.max(24, a.y1 - a.y0 + 16) };
      }
      function roiBelow(a: { x0: number; y0: number; x1: number; y1: number } | null, W: number, H: number) {
        if (!a) return null;
        return { x: Math.max(0, a.x0 - 8), y: Math.min(H - 1, a.y1 + 6),
                 w: Math.min(Math.floor(W * 0.6), W - (a.x0 - 8)), h: Math.max(24, Math.floor(H * 0.08)) };
      }

      const roiDOB_R = roiToRight(aDOB, outW); const roiDOB_B = roiBelow(aDOB, outW, outH);
      const roiEXP_R = roiToRight(aEXP, outW); const roiEXP_B = roiBelow(aEXP, outW, outH);
      const roiCLASS_R = roiToRight(aCLASS, outW); const roiCLASS_B = roiBelow(aCLASS, outW, outH);
      const roiDL_R = roiToRight(aDL, outW); const roiDL_B = roiBelow(aDL, outW, outH);

      const acc: Fields = {};

      async function ocrROI(canvas: HTMLCanvasElement, roi: { x: number; y: number; w: number; h: number } | null, params: Partial<TesseractNS.WorkerParams>) {
        if (!roi) return { text: "", confs: [] as number[] };
        const cx = document.createElement("canvas");
        cx.width = roi.w; cx.height = roi.h;
        const ctx = cx.getContext("2d");
        if (!ctx) return { text: "", confs: [] };
        ctx.drawImage(canvas, roi.x, roi.y, roi.w, roi.h, 0, 0, roi.w, roi.h);
        const url = cx.toDataURL("image/png");
        await worker.setParameters(params);
        const res = await worker.recognize(url, { rotateAuto: false });
        const t = (res.data.text || "").replace(/\n/g, " ").trim();
        const confs = (res.data.symbols || []).map((s) => s.confidence ?? 1);
        return { text: t, confs };
      }

      function avg(arr: number[]) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
      function pickBest(aText: string, aConfs: number[], bText: string, bConfs: number[], validRe: RegExp) {
        const aValid = (aText.match(validRe) || []).join("").length;
        const bValid = (bText.match(validRe) || []).join("").length;
        if (aValid !== bValid) return aValid > bValid ? { text: aText, confs: aConfs } : { text: bText, confs: bConfs };
        return avg(aConfs) >= avg(bConfs) ? { text: aText, confs: aConfs } : { text: bText, confs: bConfs };
      }

      for (const c of rectifiedCanvases) {
        // Licence number (A-Z0-9)
        {
          const r1 = await ocrROI(c, roiDL_R, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
          });
          const r2 = await ocrROI(c, roiDL_B, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
          });
          const { text, confs: _confs } = pickBest(r1.text, r1.confs, r2.text, r2.confs, /[A-Z0-9-]/g);
          const cleaned = (text || "").replace(/[^A-Z0-9-]/gi, "");
          if (cleaned) acc.licenseNo = fuseField("licenseNo", cleaned);
        }
        // DOB
        {
          const r1 = await ocrROI(c, roiDOB_R, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "0123456789/-. ",
          });
          const r2 = await ocrROI(c, roiDOB_B, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "0123456789/-. ",
          });
          const chosen = pickBest(r1.text, r1.confs, r2.text, r2.confs, /[0-9/\-.]/g);
          const dob = chosen.text.match(/(\d{4}[\/\-.]\d{2}[\/\-.]\d{2}|(?:\d{1,2}[\/\-.]){2}\d{2,4})/)?.[1] ?? "";
          if (dob) acc.dob = fuseField("dob", dob);
        }
        // Expiry
        {
          const r1 = await ocrROI(c, roiEXP_R, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "0123456789/-. ",
          });
          const r2 = await ocrROI(c, roiEXP_B, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "0123456789/-. ",
          });
          const chosen = pickBest(r1.text, r1.confs, r2.text, r2.confs, /[0-9/\-.]/g);
          const exp = chosen.text.match(/(\d{4}[\/\-.]\d{2}[\/\-.]\d{2}|(?:\d{1,2}[\/\-.]){2}\d{2,4})/)?.[1] ?? "";
          if (exp) acc.licenseExpiry = fuseField("licenseExpiry", exp);
        }
        // Class
        {
          const r1 = await ocrROI(c, roiCLASS_R, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          });
          const r2 = await ocrROI(c, roiCLASS_B, {
            tessedit_pageseg_mode: "7" as unknown as TesseractNS.PSM,
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          });
          const { text } = pickBest(r1.text, r1.confs, r2.text, r2.confs, /[A-Z0-9]/g);
          const cls = (text.match(/[A-Z0-9]{1,3}/)?.[0] ?? "").toUpperCase();
          if (cls) acc.licenseClass = fuseField("licenseClass", cls);
        }
      }

      // Authority + Name on first frame full text
      {
        await worker.setParameters({ tessedit_pageseg_mode: "6" as unknown as TesseractNS.PSM });
        const res = await worker.recognize(firstOcrCanvas.toDataURL("image/png"), { rotateAuto: false });
        const txt = res.data.text || "";
        const auth = bestAuthority(txt);
        if (auth) acc.issuingAuthority = auth;
        const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const isCaps = (s: string) => s.replace(/[^A-Z\s\-']/g, '').length / Math.max(1, s.length) > 0.6;
        for (let i = 0; i < Math.min(8, lines.length - 1); i++) {
          const a = lines[i] ?? ""; const b = lines[i + 1] ?? "";
          if (isCaps(a) && isCaps(b) && a.length > 2 && b.length > 2) { acc.legalName = `${a} ${b}`; break; }
        }
      }

      setFields({
        legalName: acc.legalName?.replace(/\s+/g, " ").trim(),
        licenseNo: acc.licenseNo,
        dob: normalizeDate(acc.dob),
        licenseExpiry: normalizeDate(acc.licenseExpiry),
        issuingAuthority: acc.issuingAuthority,
        licenseClass: acc.licenseClass,
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed. Improve lighting and try again.";
      setStreamErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const raw = document.createElement("canvas");
    raw.width = img.width; raw.height = img.height;
    const ctx = raw.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    let rect: HTMLCanvasElement;
    try { rect = await rectifyWithOpenCV(raw, 1600, 1000); } catch { rect = raw; }
    setPreviewUrl(rect.toDataURL("image/png"));
    let proc = toGrayscale(rect);
    proc = simpleThreshold(proc, 185);
    await captureAndExtractFromCanvas(proc);
  }

  async function captureAndExtractFromCanvas(canvas: HTMLCanvasElement) {
    setBusy(true); setFields(null); clearFusion();
    try {
      const worker = await ensureWorker();
      await worker.setParameters({ tessedit_pageseg_mode: "6" as unknown as TesseractNS.PSM });
      const pass1 = await worker.recognize(canvas.toDataURL("image/png"), { rotateAuto: true });
      const words = pass1.data.words || [];
      const findAnchor = (regex: RegExp) => {
        const hit = words.find((w: TesseractNS.Word) => regex.test(w.text));
        if (!hit) return null;
        const { x0, y0, x1, y1 } = hit.bbox;
        return { x0, y0, x1, y1 };
      };
      const aDOB = findAnchor(/^(DOB|Date of Birth|Naissance|N[ée]\s? le)$/i);
      const aEXP = findAnchor(/^(EXP|Expiry|Expires|Expiration|Expire|Date d['’]expiration)$/i);
      const aCLASS = findAnchor(/^(CLASS|CL|Classe|Cat[ée]gorie)$/i);
      const aDL = findAnchor(/^(DL|LIC|Licence|License|No\.?|N[oº]\.?|Num[eé]ro)$/i);

      const outW = canvas.width; const outH = canvas.height;
      function roiToRight(a: { x0: number; y0: number; x1: number; y1: number } | null, W: number) {
        if (!a) return null;
        return { x: Math.min(W - 1, a.x1 + 8), y: Math.max(0, a.y0 - 8),
                 w: Math.min(Math.floor(W * 0.45), W - (a.x1 + 8)), h: Math.max(24, a.y1 - a.y0 + 16) };
      }
      function roiBelow(a: { x0: number; y0: number; x1: number; y1: number } | null, W: number, H: number) {
        if (!a) return null;
        return { x: Math.max(0, a.x0 - 8), y: Math.min(H - 1, a.y1 + 6),
                 w: Math.min(Math.floor(W * 0.6), W - (a.x0 - 8)), h: Math.max(24, Math.floor(H * 0.08)) };
      }

      const roiDOB_R = roiToRight(aDOB, outW); const roiDOB_B = roiBelow(aDOB, outW, outH);
      const roiEXP_R = roiToRight(aEXP, outW); const roiEXP_B = roiBelow(aEXP, outW, outH);
      const roiCLASS_R = roiToRight(aCLASS, outW); const roiCLASS_B = roiBelow(aCLASS, outW, outH);
      const roiDL_R = roiToRight(aDL, outW); const roiDL_B = roiBelow(aDL, outW, outH);

      const workerParams = async (psm: TesseractNS.PSM, whitelist: string) => {
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          tessedit_char_whitelist: whitelist,
        });
      };
      async function ocrROI(roi: { x: number; y: number; w: number; h: number } | null, psm: TesseractNS.PSM, whitelist: string) {
        if (!roi) return { text: "", confs: [] as number[] };
        const cx = document.createElement("canvas");
        cx.width = roi.w; cx.height = roi.h;
        const ctx = cx.getContext("2d");
        if (!ctx) return { text: "", confs: [] };
        ctx.drawImage(canvas, roi.x, roi.y, roi.w, roi.h, 0, 0, roi.w, roi.h);
        const url = cx.toDataURL("image/png");
        await workerParams(psm, whitelist);
        const res = await worker.recognize(url, { rotateAuto: false });
        const t = (res.data.text || "").replace(/\n/g, " ").trim();
        const confs = (res.data.symbols || []).map((s) => s.confidence ?? 1);
        return { text: t, confs };
      }

      const dlR = await ocrROI(roiDL_R, "7" as unknown as TesseractNS.PSM, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-");
      const dlB = await ocrROI(roiDL_B, "7" as unknown as TesseractNS.PSM, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-");
      const { text: dlText } = ((() => { const a = dlR, b = dlB; const av = (a.text.match(/[A-Z0-9-]/g) || []).length; const bv = (b.text.match(/[A-Z0-9-]/g) || []).length; return av>=bv ? a : b; })());

      const dobR = await ocrROI(roiDOB_R, "7" as unknown as TesseractNS.PSM, "0123456789/-. ");
      const dobB = await ocrROI(roiDOB_B, "7" as unknown as TesseractNS.PSM, "0123456789/-. ");
      const dobText = ((() => { const a = dobR, b = dobB; const av = (a.text.match(/[0-9/\-.]/g) || []).length; const bv = (b.text.match(/[0-9/\-.]/g) || []).length; return (av>=bv ? a.text : b.text); })());

      const expR = await ocrROI(roiEXP_R, "7" as unknown as TesseractNS.PSM, "0123456789/-. ");
      const expB = await ocrROI(roiEXP_B, "7" as unknown as TesseractNS.PSM, "0123456789/-. ");
      const expText = ((() => { const a = expR, b = expB; const av = (a.text.match(/[0-9/\-.]/g) || []).length; const bv = (b.text.match(/[0-9/\-.]/g) || []).length; return (av>=bv ? a.text : b.text); })());

      const clsR = await ocrROI(roiCLASS_R, "7" as unknown as TesseractNS.PSM, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
      const clsB = await ocrROI(roiCLASS_B, "7" as unknown as TesseractNS.PSM, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
      const clsText = ((() => { const a = clsR, b = clsB; const av = (a.text.match(/[A-Z0-9]/g) || []).length; const bv = (b.text.match(/[A-Z0-9]/g) || []).length; return (av>=bv ? a.text : b.text); })());

      const full = pass1.data.text || "";
      const auth = bestAuthority(full);
      const name = guessName(full);

      const expMatch = expText.match(/(\d{4}[\/\-.]\d{2}[\/\-.]\d{2}|(?:\d{1,2}[\/\-.]){2}\d{2,4})/)?.[1] ?? "";
      const dobMatch = dobText.match(/(\d{4}[\/\-.]\d{2}[\/\-.]\d{2}|(?:\d{1,2}[\/\-.]){2}\d{2,4})/)?.[1] ?? "";

      setFields({
        legalName: name,
        licenseNo: (dlText || "").replace(/[^A-Z0-9-]/gi, ""),
        dob: normalizeDate(dobMatch),
        licenseExpiry: normalizeDate(expMatch),
        issuingAuthority: auth,
        licenseClass: (clsText || "").toUpperCase(),
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed.";
      setStreamErr(msg);
    } finally { setBusy(false); }
  }

  function guessName(txt: string) {
    const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const isCaps = (s: string) => s.replace(/[^A-Z\s\-']/g, '').length / Math.max(1, s.length) > 0.6;
    for (let i = 0; i < Math.min(8, lines.length - 1); i++) {
      const a = lines[i] ?? ""; const b = lines[i + 1] ?? "";
      if (isCaps(a) && isCaps(b) && a.length > 2 && b.length > 2) return `${a} ${b}`.replace(/\s+/g, " ").trim();
    }
    return lines.find((l) => isCaps(l) && l.length > 3) || "";
  }

  function normalizeDate(s?: string) {
    if (!s) return s;
    const ymd = s.match(/^\d{4}[\/\-.]\d{2}[\/\-.]\d{2}$/);
    if (ymd) return s.replace(/[\/.]/g, "-");
    const mdy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (mdy) {
      const mm = mdy[1] ?? "";
      const dd = mdy[2] ?? "";
      const yy = mdy[3] ?? "";
      const y = yy.length === 2 ? (+yy > 30 ? `19${yy}` : `20${yy}`) : yy;
      return `${(y ?? "").padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (dmy) {
      const dd = dmy[1] ?? "";
      const mm = dmy[2] ?? "";
      const yy = dmy[3] ?? "";
      const y = yy.length === 2 ? (+yy > 30 ? `19${yy}` : `20${yy}`) : yy;
      return `${(y ?? "").padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return s;
  }

  return (
    <div className="space-y-6">
      <div className="relative mx-auto aspect-[3/2] w-full max-w-md overflow-hidden rounded border border-slate-300 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 m-6 rounded-md border-2 border-emerald-400/70"></div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={captureAndExtract}
          disabled={busy}
          className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Extracting…" : "Capture & Extract (wallet-style)"}
        </button>
        <label className="text-sm text-slate-700">
          or upload a photo
          <input
            type="file"
            accept="image/*"
            className="ml-3 inline-block text-sm"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          />
        </label>
      </div>

      {streamErr && <p className="text-sm text-rose-600" aria-live="polite">{streamErr}</p>}

      {previewUrl && (
        <div>
          <h3 className="text-sm font-medium text-slate-700">Rectified preview used for OCR</h3>
          <img src={previewUrl} alt="Captured preview" className="mt-2 max-h-56 rounded border border-slate-200" />
        </div>
      )}

      {fields && (
        <div className="rounded border border-slate-200 p-4">
          <h3 className="mb-2 text-base font-semibold">Extracted Fields (editable)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={fields.legalName || ""} onChange={(v) => setFields({ ...fields, legalName: v })} />
            <Field label="Licence #" value={fields.licenseNo || ""} onChange={(v) => setFields({ ...fields, licenseNo: v })} />
            <Field label="DOB (YYYY-MM-DD)" value={fields.dob || ""} onChange={(v) => setFields({ ...fields, dob: v })} />
            <Field label="Expiry (YYYY-MM-DD)" value={fields.licenseExpiry || ""} onChange={(v) => setFields({ ...fields, licenseExpiry: v })} />
            <Field label="Issuing authority" value={fields.issuingAuthority || ""} onChange={(v) => setFields({ ...fields, issuingAuthority: v })} />
          </div>
          <p className="mt-3 text-xs text-slate-600">Tip: If anything looks off, edit it here before saving.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded border border-slate-300 p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
