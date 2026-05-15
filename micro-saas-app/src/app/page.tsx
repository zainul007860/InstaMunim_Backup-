"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Shield, Smartphone, BarChart3, ChevronRight, 
  Download, CheckCircle2, MessageSquare, Star, ArrowRight,
  LayoutDashboard, ShoppingCart, Users, Globe,
  Camera, Play, Info, Video, MessageCircle, Send, MapPin,
  Clock, CreditCard, PieChart, Share2
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

  if (isApp === null) return <div className="bg-black min-h-screen" />; // Black screen during check

  return (
    <div className="bg-black text-white font-sans selection:bg-orange-500 selection:text-white scroll-smooth overflow-x-hidden min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? "bg-zinc-950 border-b border-white/10 py-2 shadow-2xl" : "bg-transparent py-4"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/assets/instamunim-logo-main.png" alt="InstaMunim" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
             <div className="flex flex-col -ml-2">
                <span className="text-xl md:text-3xl font-black tracking-tighter italic leading-none">INSTAMUNIM</span>
                <span className="text-[9px] md:text-[11px] font-black tracking-[0.4em] text-orange-500 italic uppercase ml-1">Beyond Billing</span>
             </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black tracking-widest text-zinc-400">
            <a href="#features" className="hover:text-orange-500 transition-colors uppercase">Features</a>
            <a href="#plans" className="hover:text-orange-500 transition-colors uppercase">Pricing</a>
            <a href="#about" className="hover:text-orange-500 transition-colors uppercase">About</a>
          </div>

          {/* Header Button Removed */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 md:pt-60 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent -z-10" />
        
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500 text-black px-6 py-2 rounded-full font-black text-[10px] md:text-[12px] uppercase tracking-widest mb-10 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
             7 DAYS FREE TRIAL • NO CREDIT CARD
          </div>

          <h1 className="text-5xl md:text-[120px] font-black tracking-tighter leading-[0.8] mb-12">
            BILLING <span className="italic text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600">FAST</span> <br />
            BUSINESS <span className="italic">PRO.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-3xl mb-16 font-medium leading-relaxed">
            Turn your smartphone into a high-speed billing machine.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32">
             <a 
              href="/dashboard" 
              className="w-full sm:w-auto bg-white text-black hover:bg-orange-500 hover:text-white px-12 py-6 rounded-3xl font-black text-xl md:text-2xl transition-all flex items-center justify-center gap-4 group"
            >
              DOWNLOAD APP <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </a>
            <a 
              href="https://wa.me/917838229178"
              className="w-full sm:w-auto bg-zinc-900 border-2 border-zinc-800 hover:border-orange-500 px-12 py-6 rounded-3xl font-black text-xl md:text-2xl transition-all flex items-center justify-center gap-4"
            >
              WATCH DEMO <MessageSquare size={24} className="text-orange-500" />
            </a>
          </div>

          {/* STRETCHED COLORFUL TRUST SECTION */}
          <div className="max-w-7xl mx-auto py-12 px-6 bg-gradient-to-r from-orange-600/20 to-orange-400/20 rounded-[40px] border border-orange-500/30 backdrop-blur-md overflow-hidden relative shadow-[0_0_50px_rgba(249,115,22,0.1)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl md:text-6xl font-black italic text-orange-500">100+</span>
                <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] text-white/80 uppercase">Merchants</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl md:text-6xl font-black italic text-white">50K+</span>
                <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] text-white/80 uppercase">Invoices</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl md:text-6xl font-black italic text-orange-500">4.9/5</span>
                <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] text-white/80 uppercase">Rating</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl md:text-6xl font-black italic text-white">100%</span>
                <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] text-white/80 uppercase">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAKE IN INDIA BANNER */}
      <section className="py-10 bg-gradient-to-r from-orange-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="bg-white text-orange-600 px-6 py-2 rounded-full font-black text-xs md:text-sm uppercase tracking-[0.3em] shadow-xl">
              MAKE IN INDIA 🇮🇳
            </div>
            <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
              AB INDIA KA HAR DUKANDAR <span className="text-black">BANEGA DIGITAL</span>
            </h2>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-zinc-950 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-24 gap-10">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic leading-none">SHOP CONTROL.</h2>
              <p className="text-zinc-500 text-xl font-medium">Manage billing, stock, and staff from anywhere.</p>
            </div>
            <div className="bg-orange-500 px-10 py-5 rounded-3xl font-black text-black text-xl shadow-2xl shadow-orange-500/20 uppercase tracking-widest">MAKE IN INDIA 🇮🇳</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Speedy Billing", desc: "Create bills in seconds. Keep customers moving." },
              { icon: BarChart3, title: "Daily Reports", desc: "Know profit and expense at day end." },
              { icon: Smartphone, title: "Mobile POS", desc: "No PC needed. Your phone is your POS." },
              { icon: Shield, title: "Cloud Backup", desc: "Data always safe and accessible." },
              { icon: Users, title: "Staff Mgmt", desc: "Limited access for extra security." },
              { icon: Globe, title: "Multi-Outlet", desc: "Control all branches from one place." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[40px] hover:bg-zinc-900 transition-all group">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 transition-all duration-500">
                  <f.icon className="text-orange-500 group-hover:text-white transition-colors" size={28} />
                </div>
                <h4 className="text-2xl font-black mb-4 italic">{f.title}</h4>
                <p className="text-zinc-500 font-bold leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS SECTION */}
      <section id="plans" className="py-32 relative overflow-hidden bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic underline decoration-orange-500 decoration-8 underline-offset-8 uppercase">PLANS.</h2>
          </div>

          <div className="max-w-xl mx-auto bg-gradient-to-b from-zinc-900/80 to-black border-2 border-orange-500/50 p-10 md:p-16 rounded-[60px] relative shadow-[0_0_100px_rgba(249,115,22,0.1)]">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-10 py-3 rounded-full font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl animate-pulse">LIMITED OFFER</div>
            
            <div className="text-center mb-12">
              <div className="flex justify-center items-end gap-3 mb-4">
                <span className="text-7xl md:text-[120px] font-black italic tracking-tighter leading-none">₹399</span>
                <span className="text-zinc-500 font-black text-xl md:text-2xl mb-4 md:mb-6">/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 mb-12">
              {[
                "Unlimited Digital Accounting",
                "Advanced Rent Tracker",
                "Automated Expense Manager",
                "WhatsApp Marketing Features",
                "Unlimited Billing & Invoices",
                "Staff Permissions & Roles",
                "Automatic Cloud Backup"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <CheckCircle2 size={18} className="text-orange-500" />
                  <span className="font-black text-zinc-300 text-sm md:text-lg">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <a 
                href={`https://wa.me/917838229178?text=${encodeURIComponent("Hi InstaMunim Team, I want to activate the Smart Business Plan (₹399/mo) for my store. 🚀\n\nStore Name: \nOwner Name: \n\nPlease guide me with the payment and activation process. 📈")}`}
                className="w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 md:px-12 py-5 md:py-6 rounded-3xl font-black text-lg md:text-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-orange-500/30"
              >
                ACTIVATE NOW <ChevronRight size={24} />
              </a>
            </div>
            <p className="text-center text-orange-500 mt-8 font-black text-sm tracking-widest italic animate-pulse">7 DAYS FREE TRIAL AVAILABLE</p>
          </div>
        </div>
      </section>

      {/* LIGHT COOL FOOTER */}
      <footer id="about" className="py-20 bg-zinc-950 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
            <div className="max-w-sm">
              <div className="flex items-center gap-4 mb-6">
                <img src="/assets/instamunim-logo-main.png" alt="InstaMunim" className="w-20 h-20 object-contain" />
                <div className="flex flex-col">
                   <span className="text-xl font-black italic tracking-tighter">INSTAMUNIM</span>
                   <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Beyond Billing</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold text-sm leading-relaxed">
                Empowering small merchants across India with the fastest smart POS solution.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
              <div className="flex flex-col gap-6">
                <h5 className="font-black text-orange-500 text-[10px] tracking-widest uppercase">Company</h5>
                <a href="#" className="text-zinc-400 font-bold text-sm hover:text-white transition-colors">About Us</a>
                <a href="#features" className="text-zinc-400 font-bold text-sm hover:text-white transition-colors">Features</a>
              </div>
              <div className="flex flex-col gap-6">
                <h5 className="font-black text-orange-500 text-[10px] tracking-widest uppercase">Connect</h5>
                <div className="flex gap-5">
                   <a href="#" className="text-zinc-500 hover:text-orange-500"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
                   <a href="#" className="text-zinc-500 hover:text-orange-500"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                   <a href="#" className="text-zinc-500 hover:text-orange-500"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h5 className="font-black text-orange-500 text-[10px] tracking-widest uppercase">Support</h5>
                <a href="https://wa.me/917838229178" className="text-zinc-400 font-bold text-sm hover:text-white transition-colors">WhatsApp</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/10 pt-10">
            <p className="text-white font-black text-[11px] tracking-widest uppercase italic">© 2026 INSTAMUNIM SMART POS • BEYOND BILLING • ALL RIGHTS RESERVED</p>
            <div className="flex gap-10 text-[10px] font-black text-zinc-500 tracking-widest uppercase italic">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
