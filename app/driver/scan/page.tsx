"use client";

import Script from "next/script";
import LicenseScanner from "@/components/ocr/LicenseScanner";

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Script src="https://docs.opencv.org/4.x/opencv.js" strategy="afterInteractive" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Scan your licence (front)</h1>
        <p className="text-slate-600">
          On-device extraction of your name, licence number, date of birth, expiry, and issuing authority. Nothing is uploaded.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          <li>Place the card inside the frame; reduce glare.</li>
          <li>Tap <b>Capture &amp; Extract</b> or upload a photo.</li>
          <li>Review &amp; edit the extracted fields.</li>
        </ul>
      </header>
      <LicenseScanner />
    </main>
  );
}
