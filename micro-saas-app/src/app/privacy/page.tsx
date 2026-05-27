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
              Privacy Policy
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last Updated: May 22, 2026
            </p>
          </div>

          <div className="prose prose-invert prose-emerald max-w-none space-y-6 text-slate-300 leading-relaxed">
            <p>
              Welcome to <strong>InstaMunim</strong> ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our POS application (the "Service") hosted online or downloaded as an Android application.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information that you voluntarily provide to us when you register for an account, setup your store profile, or interact with our services:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Account Credentials:</strong> Mobile phone numbers and passwords used to secure and log in to your account.</li>
              <li><strong>Business Information:</strong> Store name, store address, monthly rent, business logo, website, and GSTIN to generate invoices and bills.</li>
              <li><strong>Transaction Data:</strong> Customer contact details (mobile numbers), names, billing items, total transaction amounts, and payment types (Cash, Online, Swiggy, Zomato, Udhaar).</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              2. Device Permissions
            </h2>
            <p>
              Our Android application may request the following device permissions to provide core features:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Camera Access:</strong> Used exclusively to scan barcode labels on items to fetch details instantly during checkout. Camera frames are processed locally on your device and are never sent to external servers.</li>
              <li><strong>Local Storage:</strong> Used to temporarily cache store settings, sales data, and UI preferences to ensure fast load times.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              3. How We Use Your Information
            </h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>To provide, maintain, and support the core POS billing system.</li>
              <li>To calculate monthly metrics, swiggy/zomato commissions, rent targets, and generate business insights.</li>
              <li>To allow you to send digital receipts to customers via external apps (such as WhatsApp).</li>
              <li>To prevent fraudulent activities and secure your login session via database verification.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              4. Data Sharing and Third-Party Services
            </h2>
            <p>
              We do not sell, trade, or share your personal data with third-parties. Your business transactions are secure. We utilize:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Supabase:</strong> A secure cloud database infrastructure to store and sync your store sales and credentials.</li>
              <li><strong>Open Food Facts API:</strong> A public service queried to fetch product names based on barcode numbers. No user data is sent during this query.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              5. Data Retention & Account Deletion
            </h2>
            <p>
              We retain your business data for as long as your account is active. We believe in complete data transparency and user control:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li><strong>Account Deletion:</strong> You can delete your account and all associated data at any time directly within the application by navigating to <strong>Settings &gt; Account Security &gt; Danger Zone</strong>.</li>
              <li><strong>Immediate Purge:</strong> When you execute the deletion command, your store profile, sales invoices, expenses, menu/inventory lists, and account credentials are permanently and immediately purged from our Supabase database. This action is irreversible.</li>
              <li><strong>Web Deletion Requests:</strong> If you are unable to access the app and want your account deleted, you may also email us at the address below with your registered mobile number.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 border-l-2 border-emerald-500 pl-3">
              6. Contact Us
            </h2>
            <p>
              If you have any questions or feedback about this Privacy Policy, please feel free to reach out to us:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <p><strong>Support Email:</strong> support@instamunim.in</p>
              <p><strong>Website:</strong> https://instamunim.vercel.app</p>
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
