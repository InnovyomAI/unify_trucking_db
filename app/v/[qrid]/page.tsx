"use client";

import { useEffect, useMemo, useState } from "react";
import { loadSnapshotRemote } from "@/lib/demo-store-remote";

type Stage = "auth" | "view" | "expired";

export default function VerifyPage({ params }: { params: { qrid: string } }) {
  const qrid = params.qrid;
  const [stage, setStage] = useState<Stage>("auth");
  const [orgId, setOrgId] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [snap, setSnap] = useState<Awaited<ReturnType<typeof loadSnapshotRemote>> | null>(null);
  const [seconds, setSeconds] = useState(90);

  // Simple demo credentials (avoid secrets; this is a local demo)
  function verifyCreds(id: string, p: string) {
    return id.trim().toLowerCase() === "demo" && p.trim() === "demo";
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!verifyCreds(orgId, pass)) {
      setErr("Invalid credentials. (Use demo/demo for this MVP.)");
      return;
    }
    const s = await loadSnapshotRemote(qrid);
    if (!s) {
      setErr("No record found for this QR in the demo store. Ask the driver to reissue the card.");
      return;
    }
    setSnap(s);
    setStage("view");
    setSeconds(90);
  }

  // 90-second view timer
  useEffect(() => {
    if (stage !== "view") return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          setStage("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  // Anti-screenshot guards (best-effort)
  useEffect(() => {
    if (stage !== "view") return;
    const onCtx = (e: Event) => e.preventDefault();
    const onCopy = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "s")) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };
    const onVis = () => {
      if (document.hidden) setStage("expired");
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stage]);

  const mmss = useMemo(() => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  return (
    <main className="mx-auto max-w-xl px-4 py-8 select-none">
      <style jsx global>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Verifier Portal</h1>
        <p className="text-slate-600">
          Scanned QR: <span className="font-mono">{qrid.slice(0, 8)}…</span>
        </p>
      </header>

      {stage === "auth" && (
        <form onSubmit={handleAuth} className="space-y-4 rounded border border-slate-200 p-4">
          <p className="text-sm text-slate-600">
            Enter your organisation credentials to view the driver snapshot. <b>Demo:</b> org ID <code>demo</code>, passcode <code>demo</code>.
          </p>
          <label className="block">
            <span className="block text-sm text-slate-700">Organisation ID</span>
            <input value={orgId} onChange={(e) => setOrgId(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2" />
          </label>
          <label className="block">
            <span className="block text-sm text-slate-700">Passcode</span>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2" />
          </label>
          {err && (
            <p className="text-xs text-rose-600" aria-live="polite">
              {err}
            </p>
          )}
          <button className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Authenticate</button>
        </form>
      )}

      {stage === "view" && snap && (
        <div className="relative overflow-hidden rounded border border-emerald-300 bg-white p-4 shadow" onContextMenu={(e) => e.preventDefault()}>
          {/* moving watermark */}
          <div className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(45deg,_transparent,_transparent_40px,_#05966933_40px,_#05966933_80px)]" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-emerald-800/30 text-2xl font-bold">
            {orgId.toUpperCase()} • {new Date().toLocaleString()}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Driver snapshot</h2>
            <span className="rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-700">Expires in {mmss}</span>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KV k="Name" v={snap.name} />
            <KV k="Jurisdiction" v={snap.jurisdiction} />
            <KV k="Licence #" v={snap.licenseNo} />
            <KV k="Class" v={snap.licenseClass} />
            <KV k="Expiry" v={snap.licenseExpiry} />
            <KV k="QR Issued" v={new Date(snap.issuedAt).toLocaleString()} />
          </dl>

          <p className="mt-3 text-xs text-slate-600">
            Best-effort protections enabled (no print/save/context menu; watermark; auto-expire). Screenshots cannot be fully prevented on all devices.
          </p>
        </div>
      )}

      {stage === "expired" && (
        <div className="rounded border border-slate-200 p-4">
          <h2 className="mb-2 text-lg font-semibold">View expired</h2>
          <p className="text-sm text-slate-700">
            This snapshot is no longer available. Ask the driver to present the QR again to start a new 90-second view.
          </p>
        </div>
      )}
    </main>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded border border-slate-100 p-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
      <div className="font-medium text-slate-900">{v || "—"}</div>
    </div>
  );
}
