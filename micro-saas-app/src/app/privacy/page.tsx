"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-emerald-400 tracking-tight">
            <span>✨</span> InstaMunim
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">
            Go to Dashboard &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Privacy Policy & Terms of Service
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last Updated: July 20, 2026 | Compliant with DPDP Act 2023 & Google Play Developer Policy
            </p>
          </div>

          <div className="prose prose-invert prose-emerald max-w-none space-y-6 text-slate-300 leading-relaxed">
            <p>
              Welcome to <strong>InstaMunim</strong> ("we," "our," "us"). We provide an AI-powered Smart POS & Billing Solution designed for micro-retailers, restaurants, cafes, kirana stores, and small businesses (the "Service"). This Privacy Policy explains how we collect, use, safeguard, and disclose your business and personal information when you access our Web application or Android mobile application.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information provided voluntarily by merchant owners during account setup and routine daily POS billing usage:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Account & Owner Details:</strong> Mobile phone number, business name, store logo, address, and login security credentials.</li>
              <li><strong>Business & Tax Details:</strong> GSTIN number, custom item prices, category settings, and UPI ID for payment QR code generation.</li>
              <li><strong>Transaction & Customer Ledger Data:</strong> Customer contact numbers, customer names, billing item lists, prices, payment types (Cash, Online, Swiggy, Zomato, Udhaar), and expense ledgers.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              2. Device Permissions
            </h2>
            <p>
              Our Android mobile app and Web application request specific browser and device permissions strictly to operate core application features:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Camera Access:</strong> Used exclusively for real-time barcode scanning of retail items and QR code parsing for instant checkout. Camera video feeds are processed locally in memory on your device and are never recorded, saved, or uploaded to external servers.</li>
              <li><strong>Local Storage:</strong> Used to temporarily store offline cart sessions, UI preference tokens, and login states for fast application loading.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              3. Data Security & Encryption Standards
            </h2>
            <p>
              We implement industry-standard technical and organizational security measures to prevent unauthorized access, data loss, or disclosure:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Encryption in Transit:</strong> All data transmissions between your app and cloud servers are encrypted using 256-bit SSL/TLS (HTTPS).</li>
              <li><strong>Encryption at Rest:</strong> Account databases and sales ledgers hosted on cloud enterprise infrastructure (Supabase PostgreSQL) are encrypted at rest using AES-256 encryption.</li>
              <li><strong>Row-Level Security (RLS):</strong> Strict database policy isolation ensures that each merchant's data is only accessible via their authenticated store credentials.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              4. Third-Party Services & Ad Networks
            </h2>
            <p>
              We do not sell, rent, or trade merchant business records or customer transaction data to third-party data brokers. We integrate with select trusted infrastructure and monetization SDKs:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Supabase Cloud Infrastructure:</strong> Database and authentication service to securely store, back up, and sync store data across devices.</li>
              <li><strong>Google AdMob / Advertising Partners:</strong> Free tiers of our mobile application may display non-intrusive advertisements served by Google AdMob. Ad providers may collect anonymous device advertising identifiers (GAID) and IP addresses to serve personalized or contextual ads in compliance with Google Play Policies.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              5. Data Retention & Instant Account Deletion
            </h2>
            <p>
              You maintain 100% control over your store data. Data is retained as long as your account remains active.
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>In-App Self Account Deletion:</strong> You can permanently delete your store account and erase all transaction data at any time inside the app by going to <strong>Settings &gt; Account Security &gt; Delete Account</strong>.</li>
              <li><strong>Immediate Hard Purge:</strong> Executing an account deletion permanently purges all store profiles, sales receipts, customer ledgers, inventory lists, and mobile credentials from our servers. This action is irreversible.</li>
              <li><strong>Web Account Deletion Link:</strong> Users can also request account deletion on our website or by contacting support at <a href="mailto:Instamunim@gmail.com" className="text-emerald-400 underline">Instamunim@gmail.com</a>.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              6. Limitation of Liability & Disclaimer of Warranties
            </h2>
            <p>
              InstaMunim is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>InstaMunim shall not be held liable for indirect, incidental, special, or consequential damages resulting from data loss, network outages, device hardware failures, or user-initiated data resets.</li>
              <li>Merchants are encouraged to regularly export monthly sales reports and customer ledgers as PDF/Excel backups for offline record retention.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              7. Children's Privacy
            </h2>
            <p>
              Our Service is intended exclusively for commercial business owners and individuals aged 18 years and older. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              8. Contact Us
            </h2>
            <p>
              If you have any questions, security inquiries, or data protection requests regarding this policy, please contact us:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-sm font-medium">
              <p><strong>Support Email:</strong> Instamunim@gmail.com</p>
              <p><strong>Website:</strong> https://instamunim.com</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} InstaMunim. All rights reserved.</p>
      </footer>
    </div>
  );
}
