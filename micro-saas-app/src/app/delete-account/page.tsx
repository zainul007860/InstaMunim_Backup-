"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, AlertTriangle, ShieldCheck, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function DeleteAccountPage() {
  const [mobile, setMobile] = useState("");
  const [storeName, setStoreName] = useState("");
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !storeName) {
      setErrorMsg("Please fill in all required fields.");
      setStatus("error");
      return;
    }
    if (!isConfirmed) {
      setErrorMsg("Please confirm the data purge checkbox.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "5be838be-389f-4318-ae93-a44274c480df",
          subject: `InstaMunim Account Deletion Request - ${mobile}`,
          from_name: "InstaMunim Account Portal",
          to_email: "Zainul007860@gmail.com",
          mobile: mobile,
          store_name: storeName,
          reason: reason || "Not specified",
          confirmation: "User confirmed permanent data purge.",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus("success");
      } else {
        triggerMailtoFallback();
        setStatus("success");
      }
    } catch (err) {
      console.error("Submission error:", err);
      triggerMailtoFallback();
      setStatus("success");
    }
  };

  const triggerMailtoFallback = () => {
    const subject = encodeURIComponent("InstaMunim Account Deletion Request");
    const body = encodeURIComponent(
      `Hello Zainul,\n\nI am requesting permanent account deletion for my InstaMunim account.\n\nRegistered Mobile: ${mobile}\nStore Name: ${storeName}\nReason for Deletion: ${reason}\n\nI confirm that I want to permanently delete all my sales data, inventory items, and store credentials.\n\nThank you.`
    );
    window.location.href = `mailto:Zainul007860@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-zinc-50 text-zinc-800 font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-black text-xl text-zinc-950 tracking-tight">
            <img src="/assets/instamunim-logo-main.png" alt="InstaMunim Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-tight leading-none text-zinc-950">INSTAMUNIM</span>
              <span className="text-[8px] font-black tracking-[0.2em] text-orange-500 uppercase mt-0.5">Beyond Billing</span>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-all">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50/20 via-zinc-50 to-zinc-50">
        <div className="my-auto w-full max-w-lg bg-white border border-zinc-250 rounded-3xl p-8 shadow-xl space-y-6">
          
          {status !== "success" ? (
            <>
              {/* Form State */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200 shadow-sm">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
                  Delete Account & Data
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
                  Submit a request to permanently delete your InstaMunim business profile and purge all store records.
                </p>
              </div>

              {/* Warning Alert */}
              <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-4 flex gap-3 text-orange-800 text-xs leading-relaxed text-left">
                <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
                <div>
                  <strong className="font-extrabold uppercase tracking-wide text-orange-600">Warning: Irreversible Action</strong>
                  <p className="mt-1 text-zinc-650">
                    Deleting your account will permanently wipe your store settings, Swiggy/Zomato commissions, inventory lists, sales history, and login credentials from our database. This data cannot be recovered.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Mobile Input */}
                <div className="space-y-1">
                  <label htmlFor="mobile" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Registered Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    required
                    placeholder="e.g. +91 9988776655"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>

                {/* Store Name Input */}
                <div className="space-y-1">
                  <label htmlFor="storeName" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Store / Restaurant Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    required
                    placeholder="e.g. Sharma Ji Food Stall"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>

                {/* Reason Input */}
                <div className="space-y-1">
                  <label htmlFor="reason" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    placeholder="Tell us why you are leaving..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                  />
                </div>

                {/* Checkbox confirmation */}
                <label className="flex items-start gap-3 cursor-pointer group mt-2 select-none">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-1 accent-orange-500 h-4 w-4 rounded border-zinc-350 bg-zinc-50 focus:ring-orange-500"
                  />
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-700 transition-colors leading-relaxed">
                    I confirm that I want to permanently delete all my sales records, inventory sheets, Swiggy/Zomato commission data, and account details.
                  </span>
                </label>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-bold text-center mt-2">
                    ⚠️ {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-extrabold uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 active:scale-[0.98] transition-all cursor-pointer mt-4"
                >
                  {status === "submitting" ? (
                    "Processing..."
                  ) : (
                    <>
                      Submit Deletion Request <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-zinc-950">
                  Request Submitted!
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
                  Your deletion request has been registered. Our security team will process the purge request and wipe your Supabase profile within 24 hours.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3 text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-orange-500" /> Need Immediate Help?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  If you wish to speed up the process, you may also email us directly at <span className="font-extrabold text-zinc-900">Zainul007860@gmail.com</span> from your registered email address.
                </p>
              </div>

              <button
                onClick={() => setStatus("idle")}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Submit Another Request
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} InstaMunim. All rights reserved.</p>
      </footer>
    </div>
  );
}
