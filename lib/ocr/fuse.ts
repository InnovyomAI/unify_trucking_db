// lib/ocr/fuse.ts
type Char = { c: string; conf: number };
const memory: Record<string, Char[][]> = {};

export function fuseField(field: string, text: string, confs?: number[], maxFrames = 8) {
  const rows = memory[field] || [];
  const chars: Char[] = text.split("").map((c, i) => ({ c, conf: confs?.[i] ?? 1 }));
  rows.push(chars);
  if (rows.length > maxFrames) rows.shift();
  memory[field] = rows;

  const maxLen = rows.length ? Math.max(...rows.map((r) => r.length)) : 0;
  let out = "";
  for (let i = 0; i < maxLen; i++) {
    const bucket = rows.map((r) => r[i]).filter(Boolean) as Char[];
    if (!bucket.length) continue;
    const byChar = new Map<string, number>();
    for (const { c, conf } of bucket) byChar.set(c, (byChar.get(c) ?? 0) + conf);
    const top = [...byChar.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top) continue;
    out += top[0];
  }
  return out;
}

export function clearFusion(field?: string) {
  if (field) delete memory[field];
  else Object.keys(memory).forEach((k) => delete memory[k]);
}
