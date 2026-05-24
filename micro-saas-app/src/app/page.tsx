"use client";
// v1.2.0 - Daylight Theme with High-Trust Visuals (Orange & White)

import { useState, useEffect } from "react";
import { 
  Zap, Shield, Smartphone, BarChart3, ChevronRight, 
  Download, CheckCircle2, MessageSquare, Star, ArrowRight,
  LayoutDashboard, ShoppingCart, Users, Globe,
  Camera, Play, Info, Video, MessageCircle, Send, MapPin,
  Clock, CreditCard, PieChart, Share2, HelpCircle, Lock, Award
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isApp, setIsApp] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApp = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform;
    if (checkApp) {
      window.location.href = "/dashboard";
    } else {
      setIsApp(false);
    }
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isApp === null) return <div className="bg-white min-h-screen" />; // White screen during check

  return (
    <div className="bg-zinc-50/50 text-zinc-900 font-sans selection:bg-orange-500 selection:text-white scroll-smooth overflow-x-hidden min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-zinc-200/60 py-3 shadow-md" : "bg-transparent py-5"}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/assets/instamunim-logo-main.png" alt="InstaMunim" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
             <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 leading-none">INSTAMUNIM</span>
                <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase mt-1">Beyond Billing</span>
             </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black tracking-widest text-zinc-500">
            <a href="#features" className="hover:text-orange-500 transition-colors uppercase">Features</a>
            <a href="#ai-scanner" className="hover:text-orange-500 transition-colors uppercase">AI Scanner</a>
            <a href="#plans" className="hover:text-orange-500 transition-colors uppercase">Pricing</a>
            <a href="#trust" className="hover:text-orange-500 transition-colors uppercase">Why Trust Us</a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="/dashboard"
              className="bg-zinc-900 hover:bg-orange-500 text-white hover:text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <LayoutDashboard size={14} /> LOGIN TO WEB
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-48 pb-24 overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-zinc-50/50">
        {/* Soft background grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] -z-20 opacity-70" />
        
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 px-5 py-2 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-wider mb-8 shadow-sm">
             🇮🇳 MADE IN INDIA FOR SMART DUKANDAARS
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] mb-8">
            Ab Bill Banayein <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 italic font-black">Superfast</span> <br />
            Aur Business Ko Karein <span className="underline decoration-orange-500 decoration-wavy decoration-3 underline-offset-8">Pro</span>.
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-500 text-base md:text-xl mb-12 font-medium leading-relaxed">
            Apne smartphone ko banayein high-speed billing machine. Digital accounting, stock manager, automatic cloud backup aur customer history—sab kuch ek hi app mein.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 max-w-md mx-auto">
             <a 
              href="/InstaMunimSmartPOS_v1.2-release.apk?v=5" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4.5 rounded-2xl font-black text-base shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Download size={18} /> DOWNLOAD APK v1.2
            </a>
            <a 
              href="/dashboard"
              className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-8 py-4.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
            >
              FREE WEB TRIAL <ArrowRight size={18} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* STRETCHED COLORFUL TRUST SECTION */}
          <div className="max-w-4xl mx-auto py-8 px-6 bg-white border border-zinc-100 rounded-3xl shadow-[0_15px_40px_-15px_rgba(249,115,22,0.1)] relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
              <div className="flex flex-col items-center gap-1 pt-4 md:pt-0">
                <span className="text-3xl md:text-4xl font-extrabold text-orange-500">1,200+</span>
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">ACTIVE STORES</span>
              </div>
              <div className="flex flex-col items-center gap-1 pt-4 md:pt-0">
                <span className="text-3xl md:text-4xl font-extrabold text-zinc-800">50K+</span>
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">BILLS GENERATED</span>
              </div>
              <div className="flex flex-col items-center gap-1 pt-4 md:pt-0">
                <span className="text-3xl md:text-4xl font-extrabold text-orange-500">4.9★</span>
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">MERCHANT RATING</span>
              </div>
              <div className="flex flex-col items-center gap-1 pt-4 md:pt-0">
                <span className="text-3xl md:text-4xl font-extrabold text-zinc-800">100%</span>
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">SAFE & SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST AND ASSURANCE BANNER */}
      <section id="trust" className="py-8 bg-zinc-900 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-black font-black">🇮🇳</div>
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-orange-400">100% Swadeshi & Secure</p>
              <p className="text-xs text-zinc-400">Aapka data encrypted aur safe hai. No data sharing.</p>
            </div>
          </div>
          <div className="flex gap-6 items-center text-xs font-black tracking-widest text-zinc-400">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-orange-500" /> SECURE SSL</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-orange-500" /> CLOUD DEPLOYED</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-orange-500" /> GST COMPLIANT</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Complete Shop Control</h2>
            <p className="text-zinc-500 font-medium">Billing, stock monitor, rent trackers, aur staff management—sab kuch chalta hai bina kisi pareshani ke.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Superfast Billing", desc: "GST aur Non-GST bills banayein sirf 3 clicks mein. WhatsApp par instant invoices bhejein." },
              { icon: BarChart3, title: "Daily Profit/Loss Reports", desc: "Din ke aakhir mein check karein sales, profit margins, aur expenses bina kisi manual calculations ke." },
              { icon: Smartphone, title: "Full Mobile POS Support", desc: "Kisi mahenge computer ki zaroorat nahi. Aapka Android mobile hi aapka smart billing terminal hai." },
              { icon: Shield, title: "Automated Cloud Backup", desc: "Phone khone ya damage hone par bhi data safe! Ek click mein database recover karein." },
              { icon: Users, title: "Multi-Staff Accounts", desc: "Apne staff ko alag access dekar securely control karein. Sale transactions ka full records unki id se manage karein." },
              { icon: Globe, title: "Offline Billing Capability", desc: "No internet? No worries. Billing continue rakhein, internet aate hi saara data automatic sync ho jayega." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-50/50 border border-zinc-200/50 p-8 rounded-3xl hover:bg-white hover:shadow-xl transition-all group duration-300">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-all duration-300">
                  <f.icon className="text-orange-500 group-hover:text-white transition-colors" size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-zinc-900">{f.title}</h4>
                <p className="text-zinc-500 leading-relaxed text-sm font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW AI SCANNER HIGHLIGHT SECTION */}
      <section id="ai-scanner" className="py-24 bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
              NEW FEATURE ⚡
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Smart Menu AI Scanner
            </h2>
            <p className="text-white/90 text-base md:text-lg leading-relaxed">
              Apne purane printed rate-list ya menu card ki photo kheenchiye! InstaMunim AI automatic items aur prices ko extract karke aapke software menu mein **5 seconds** ke andar feed kar dega. Naye items manually add karne ki bilkul zaroorat nahi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white/10 p-4 rounded-2xl">
                <span className="font-black text-orange-200 block text-lg mb-1">Step 1</span>
                <span className="text-xs font-bold text-white/80">Menu Card Photo upload karein</span>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <span className="font-black text-orange-200 block text-lg mb-1">Step 2</span>
                <span className="text-xs font-bold text-white/80">AI items detect karega use check karein</span>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <span className="font-black text-orange-200 block text-lg mb-1">Step 3</span>
                <span className="text-xs font-bold text-white/80">Instant item base automatic save karein</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[3rem] shadow-2xl w-full max-w-sm relative">
              <div className="bg-white rounded-3xl p-5 text-zinc-950 space-y-4 shadow-lg text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
                  <Camera className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-black text-base text-zinc-800">Scan Printed Rate List</p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-1">Camera and Upload options both live inside the app</p>
                </div>
                <div className="border border-dashed border-zinc-200 rounded-2xl p-4 text-[11px] font-bold text-zinc-500 bg-zinc-50 space-y-2">
                  <div className="flex justify-between border-b pb-1.5 border-zinc-200/50"><span>1. Kadhai Paneer</span> <span className="text-orange-600">₹240</span></div>
                  <div className="flex justify-between border-b pb-1.5 border-zinc-200/50"><span>2. Masala Naan</span> <span className="text-orange-600">₹45</span></div>
                  <div className="flex justify-between"><span>3. Veg Noodles</span> <span className="text-orange-600">₹140</span></div>
                </div>
                <button className="w-full bg-orange-500 text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Save Items to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS & PRICING SECTION */}
      <section id="plans" className="py-24 relative overflow-hidden bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Transparent Pricing</h2>
            <p className="text-zinc-500 font-medium">Bina kisi hidden charges ke. Select the plan that fits your shop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* MONTHLY PLAN */}
            <div className="bg-white border border-zinc-200/80 p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300">
              <div>
                <div className="text-orange-500 font-black text-xs uppercase tracking-wider mb-4">MONTHLY PLAN</div>
                <div className="mb-6">
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-4xl md:text-5xl font-black text-zinc-950">₹399</span>
                    <span className="text-zinc-400 font-bold text-base mb-1">/month</span>
                  </div>
                  <p className="text-zinc-500 text-xs font-bold">Billed monthly. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 mb-8">
                  {[
                    "Unlimited Digital Accounting",
                    "Advanced Rent Tracker Sync",
                    "Automated Expense Manager",
                    "Voice-Control Billing Support",
                    "Smart Menu AI Scanner Access",
                    "Unlimited Billing & Invoices",
                    "Secure Cloud Storage Backup"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                      <span className="font-bold text-zinc-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a 
                  href={`https://wa.me/917838229178?text=${encodeURIComponent("Hi InstaMunim Team, I want to activate the Monthly Smart Business Plan (\u20B9399/mo) for my store. \uD83D\uDE80\n\nStore Name: \nOwner Name: \n\nPlease guide me with the payment and activation process. \uD83D\uDCC8")}`}
                  className="w-full bg-zinc-900 hover:bg-orange-500 text-white hover:text-white px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-md"
                >
                  ACTIVATE MONTHLY <ChevronRight size={16} />
                </a>
              </div>
            </div>

            {/* YEARLY PLAN */}
            <div className="bg-white border-2 border-orange-500 p-8 md:p-10 rounded-[2.5rem] relative flex flex-col justify-between shadow-xl shadow-orange-500/5 hover:scale-[1.01] transition-all duration-300">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider shadow-md">
                BEST VALUE • SAVE 25%
              </div>
              
              <div>
                <div className="text-orange-600 font-black text-xs uppercase tracking-wider mb-4">YEARLY PLAN</div>
                <div className="mb-6">
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-4xl md:text-5xl font-black text-zinc-950">₹3,600</span>
                    <span className="text-zinc-400 font-bold text-base mb-1">/year</span>
                  </div>
                  <p className="text-orange-600 text-xs font-black tracking-wider uppercase">Equivalent to ₹300/month (Save ₹1,188/yr)</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 mb-8">
                  {[
                    "Everything in Monthly Plan",
                    "Priority WhatsApp Support (24/7)",
                    "Dedicated Onboarding Manager",
                    "Customized Invoice Layouts",
                    "Unlimited Billing & Invoices",
                    "Staff Permissions & Roles",
                    "Automatic Cloud Backup"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                      <span className="font-black text-zinc-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a 
                  href={`https://wa.me/917838229178?text=${encodeURIComponent("Hi InstaMunim Team, I want to activate the Yearly Smart Business Plan (\u20B93600/yr) for my store. \uD83D\uDE80\n\nStore Name: \nOwner Name: \n\nPlease guide me with the payment and activation process. \uD83D\uDCC8")}`}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
                >
                  ACTIVATE YEARLY <ChevronRight size={16} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MERCHANT TRUST FAQS */}
      <section className="py-24 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="text-orange-500" /> Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 font-medium">InstaMunim se jude dukandaron ke aam sawaal</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Kya mera billing data completely secure hai?",
                a: "Ji haan, bilkul. InstaMunim high-level encryption aur advanced Supabase database cloud server ka upyog karta hai. Aapka data aur transactions completely private hain aur hum kisi ke sath data share nahi karte."
              },
              {
                q: "Agar mera phone toot jaye toh kya mera data chala jayega?",
                a: "Bilkul nahi! InstaMunim automatic cloud backup support ke sath aata hai. Aap kisi bhi naye phone par same details se login karke 1-click mein apna menu, stock aur sales backup recover kar sakte hain."
              },
              {
                q: "Smart Menu AI Scanner kaise kaam karta hai?",
                a: "Aapko bas apne photo-capture ya gallery upload button se printed menu ki photo select karni hai. Hamara Google Gemini integration us photo se items aur prices ko parse karke system menu mein ready-to-save items load kar deta hai."
              },
              {
                q: "Kya main computer ke bina billing kar sakta hoon?",
                a: "Haan. InstaMunim ko design hi mobile-first POS ki tarah kiya gaya hai. Isse chalane ke liye kisi computer ya laptop ki zaroorat nahi hai. Aap asani se billing mobile se hi manage kar sakte hain."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-150">
                <h4 className="font-extrabold text-zinc-900 mb-2">{faq.q}</h4>
                <p className="text-sm font-medium text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="py-16 bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <img src="/assets/instamunim-logo-main.png" alt="InstaMunim" className="w-16 h-16 object-contain" />
                <div className="flex flex-col">
                   <span className="text-lg font-black tracking-tight text-white leading-none">INSTAMUNIM</span>
                   <span className="text-[9px] font-black tracking-[0.2em] text-orange-400 uppercase mt-1">Beyond Billing</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold text-sm leading-relaxed">
                Empowering small merchants and retailers across India with the fastest smart POS solution.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                <h5 className="font-black text-orange-400 text-[10px] tracking-widest uppercase mb-2">Company</h5>
                <a href="#" className="hover:text-white transition-colors">About Us</a>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </div>
              <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                <h5 className="font-black text-orange-400 text-[10px] tracking-widest uppercase mb-2">Connect</h5>
                <div className="flex gap-4">
                  <a href="https://wa.me/917838229178" className="text-zinc-500 hover:text-orange-400"><MessageSquare className="h-5 w-5" /></a>
                </div>
              </div>
              <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                <h5 className="font-black text-orange-400 text-[10px] tracking-widest uppercase mb-2">Support</h5>
                <a href="https://wa.me/917838229178" className="hover:text-white transition-colors">WhatsApp 24/7</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-zinc-800 pt-8 text-center md:text-left">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              &copy; 2026 INSTAMUNIM SMART POS • BEYOND BILLING • ALL RIGHTS RESERVED
            </p>
            <div className="flex gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              <a href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
