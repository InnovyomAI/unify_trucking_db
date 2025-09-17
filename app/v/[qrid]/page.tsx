"use client";
import { use } from "react";
import { useEffect, useMemo, useState } from "react";
import { loadSnapshotRemote, type DriverSnapshot } from "@/lib/demo-store-remote";
import { verifyPin } from "@/lib/security"; // assumes you have a helper to check hash

type Stage = "auth" | "view" | "expired" | "basic" | "full";
type Params = Promise<{ qrid: string }>;

export default function VerifyPage(props: { params: Params }) {
  const { qrid } = use(props.params); // unwrap the Promise
  const [stage, setStage] = useState<Stage>("auth");
  const [orgId, setOrgId] = useState("");
  const [pass, setPass] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [snap, setSnap] = useState<DriverSnapshot | null>(null);
  const [seconds, setSeconds] = useState(90);
  // Verifier comment (demo-only; not persisted)
  const [comment, setComment] = useState("");
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentSubmitted(true);
}


  // simple demo creds (replace later with real auth)
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
      setErr("No record found for this QR. Ask the driver to reissue.");
      return;
    }
    setSnap(s);
    setStage("basic");
    setSeconds(90);
  }

  async function handleFullDetails(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!snap) return;

    const ok = await verifyPin(pinInput, snap.pinHash);
    if (!ok) {
      setErr("Invalid PIN. Please try again.");
      return;
    }
    setStage("full");
    setSeconds(90);
  }

  // 90-second auto-expire
  useEffect(() => {
    if (stage !== "basic" && stage !== "full") return;
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

  // anti-screenshot best-effort
  useEffect(() => {
    if (stage !== "basic" && stage !== "full") return;
    const onCtx = (e: Event) => e.preventDefault();
    const onCopy = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["p", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") e.preventDefault();
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
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 select-none">
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Verifier Portal</h1>
        <p className="text-slate-600">
          Scanned QR: <span className="font-mono">{qrid.slice(0, 8)}…</span>
        </p>
      </header>

      {/* --- ORG LOGIN --- */}
      {stage === "auth" && (
        <form
          onSubmit={handleAuth}
          className="space-y-4 rounded border border-slate-200 p-4"
        >
          <p className="text-sm text-slate-600">
            Enter organisation credentials. <b>Demo:</b> <code>demo/demo</code>
          </p>
          <label className="block">
            <span className="text-sm text-slate-700">Organisation ID</span>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-700">Passcode</span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          <button className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Authenticate
          </button>
        </form>
      )}

      {/* --- BASIC SNAPSHOT --- */}
      {stage === "basic" && snap && (
        <div className="relative overflow-hidden rounded border border-emerald-300 bg-white p-4 shadow">
          <Watermark orgId={orgId} />

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Driver snapshot</h2>
            <span className="rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-700">
              Expires in {mmss}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KV k="Name" v={snap.name} />
            <KV k="Jurisdiction" v={snap.jurisdiction} />
            <KV k="Licence #" v={snap.licenseNo} />
            <KV k="Class" v={snap.licenseClass} />
            <KV k="Expiry" v={snap.licenseExpiry} />
            <KV k="QR Issued" v={new Date(snap.issuedAt).toLocaleString()} />
          </dl>

          <form onSubmit={handleFullDetails} className="mt-4 space-y-2">
            <label className="block">
              <span className="text-sm text-slate-700">
                Enter driver PIN for full details
              </span>
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 font-mono"
              />
            </label>
            {err && <p className="text-xs text-rose-600">{err}</p>}
            <button className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
              View Full Details
            </button>
          </form>
        </div>
      )}

      {/* --- FULL SNAPSHOT --- */}
      {stage === "full" && snap && (
        <div className="relative overflow-hidden rounded border border-emerald-300 bg-white p-4 shadow">
          <Watermark orgId={orgId} />

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Full Driver Details</h2>
            <span className="rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-700">
              Expires in {mmss}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KV k="Name" v={snap.name} />
            <KV k="DOB" v={snap.dob} />
            <KV k="Citizenship" v={snap.citizenship} />
            <KV k="Residency" v={snap.residencyCA} />

            <KV k="Jurisdiction" v={snap.jurisdiction} />
            <KV k="Licence #" v={snap.licenseNo} />
            <KV k="Class" v={snap.licenseClass} />
            <KV k="Expiry" v={snap.licenseExpiry} />

            <KV k="Email" v={snap.email} />
            <KV k="Phone" v={snap.phone} />
            <KV k="Postal" v={snap.postal} />
            <KV k="Country" v={snap.country} />
            <KV k="Region" v={snap.region} />
            <KV k="City" v={snap.city} />
            <KV k="Address1" v={snap.address1} />
            <KV k="Address2" v={snap.address2} />

            <KV k="PR #" v={snap.prNumber} />
            <KV k="Permit Type" v={snap.permitType} />
            <KV k="UCI" v={snap.uci} />
            <KV k="Permit Expiry" v={snap.permitExpiry} />

            <KV k="Passport Country" v={snap.passportCountry} />
            <KV k="Passport #" v={snap.passportNumber} />

            <KV k="English Level" v={snap.englishLevel} />
            {snap.otherLanguages?.map((l, i) => (
              <KV
                key={i}
                k={`Other Language ${i + 1}`}
                v={`${l.language} (${l.level})`}
              />
            ))}

            <KV k="Consent Name" v={snap.consentName} />
            <KV k="Consent Date" v={snap.consentDate} />
            <KV k="Consent Abstract" v={snap.consentAbstract ? "Yes" : "No"} />
            <KV k="Certify Accurate" v={snap.certifyAccurate ? "Yes" : "No"} />
          </dl>

          {/* Work experience */}
          {snap.work && snap.work.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold">Work Experience</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {snap.work.map((w, i) => (
                  <li key={i} className="rounded border p-2">
                    <div className="font-medium">{w.company}</div>
                    <div>{w.role}</div>
                    <div className="text-slate-600 text-xs">
                      {w.start} → {w.end || "Present"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* --- Verifier Comment Box (demo only) --- */}
          <div className="mt-6">
            <h3 className="text-base font-semibold">Verifier Comment</h3>
            {!commentSubmitted ? (
              <form onSubmit={handleCommentSubmit} className="mt-2 space-y-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your comment on this driver’s profile…"
                  className="w-full rounded border border-slate-300 p-2"
                  rows={4}
                />
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                >
                  Submit Comment
                </button>
              </form>
            ) : (
              <p className="mt-2 rounded border border-slate-200 bg-emerald-50 p-2 text-sm text-emerald-700">
                ✅ Comment submitted (not saved — demo only).
              </p>
            )}
          </div>
        </div>
      )}

      {/* --- EXPIRED --- */}
      {stage === "expired" && (
        <div className="rounded border border-slate-200 p-4">
          <h2 className="mb-2 text-lg font-semibold">View expired</h2>
          <p className="text-sm text-slate-700">
            Snapshot expired. Ask the driver to re-scan the QR.
          </p>
        </div>
      )}
    </main>
  );
}

function KV({ k, v }: { k: string; v?: string | boolean }) {
  return (
    <div className="rounded border border-slate-100 p-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
      <div className="font-medium text-slate-900">
        {v !== undefined && v !== "" ? String(v) : "—"}
      </div>
    </div>
  );
}

function Watermark({ orgId }: { orgId: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-20 
        [background:repeating-linear-gradient(45deg,_transparent,_transparent_40px,_#05966933_40px,_#05966933_80px)]" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center 
        text-emerald-800/30 text-2xl font-bold">
        {orgId.toUpperCase()} • {new Date().toLocaleString()}
      </div>
    </>
  );
}
