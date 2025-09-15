"use client";
import { useMemo, useState } from "react";
import { allLanguages } from "@/lib/languages";

type Item = { lang: string; level: "Basic" | "Conversational" | "Fluent" | "Native" };

export default function LanguageMulti({
  value,
  onChange,
}: {
  value: Item[];
  onChange: (items: Item[]) => void;
}) {
  const LANGS = useMemo(() => allLanguages(), []);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Item["level"]>("Conversational");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LANGS;
    return LANGS.filter(
      (l) => l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s)
    );
  }, [q, LANGS]);

  function add(code: string) {
    if (!code) return;
    if (value.some((v) => v.lang === code)) return;
    onChange([...value, { lang: code, level }]);
    setQ("");
  }
  function setItemLevel(code: string, lvl: Item["level"]) {
    onChange(value.map((v) => (v.lang === code ? { ...v, level: lvl } : v)));
  }
  function remove(code: string) {
    onChange(value.filter((v) => v.lang !== code));
  }

  return (
    <div className="space-y-4">
      {/* English row (always present) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-700">English</label>
          <input
            type="text"
            value="English"
            readOnly
            className="mt-1 w-full rounded border border-slate-300 bg-slate-100 p-2 text-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Level (required)</label>
          <select
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={value.find((v) => v.lang === "en")?.level ?? level}
            onChange={(e) => {
              const lvl = e.target.value as Item["level"];
              setLevel(lvl);
              if (value.some((v) => v.lang === "en")) {
                setItemLevel("en", lvl);
              } else {
                onChange([{ lang: "en", level: lvl }, ...value]);
              }
            }}
          >
            <option>Basic</option>
            <option>Conversational</option>
            <option>Fluent</option>
            <option>Native</option>
          </select>
        </div>
      </div>

      {/* Add other languages */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-700">Other language</label>
          <div className="grid gap-2 sm:grid-cols-[1fr_16rem]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded border border-slate-300 p-2"
              placeholder="Search language…"
            />
            <select
              className="rounded border border-slate-300 p-2"
              onChange={(e) => add(e.target.value)}
              value=""
            >
              <option value="" disabled>
                Select language
              </option>
              {filtered.slice(0, 50).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-700">Level</label>
          <select
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={level}
            onChange={(e) => setLevel(e.target.value as Item["level"])}
          >
            <option>Basic</option>
            <option>Conversational</option>
            <option>Fluent</option>
            <option>Native</option>
          </select>
        </div>
      </div>

      {/* Display selected other languages */}
      <div className="flex flex-wrap gap-2">
        {value
          .filter((v) => v.lang !== "en")
          .map((v) => (
            <div
              key={v.lang}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1"
            >
              <span className="font-medium">{v.lang.toUpperCase()}</span>
              <select
                value={v.level}
                onChange={(e) =>
                  setItemLevel(v.lang, e.target.value as Item["level"])
                }
                className="text-xs"
              >
                <option>Basic</option>
                <option>Conversational</option>
                <option>Fluent</option>
                <option>Native</option>
              </select>
              <button
                type="button"
                onClick={() => remove(v.lang)}
                className="text-xs text-slate-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
