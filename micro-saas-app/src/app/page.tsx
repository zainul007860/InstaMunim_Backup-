"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Shield, Smartphone, BarChart3, ChevronRight, 
  Download, CheckCircle2, MessageSquare, Star, ArrowRight,
  LayoutDashboard, ShoppingCart, Users, Globe,
  Camera, Play, Info, Video, MessageCircle, Send, MapPin
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-black text-white font-sans selection:bg-orange-500 selection:text-white scroll-smooth overflow-x-hidden min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5 py-2" : "bg-transparent py-4 md:py-6"}`}>
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img src="/assets/logo-light.png" alt="InstaMunim" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
             <div className="flex flex-col -gap-1">
                <span className="text-xl md:text-3xl font-black tracking-tighter italic leading-none">INSTAMUNIM</span>
                <span className="text-[10px] md:text-[12px] font-black tracking-[0.3em] text-orange-500 italic uppercase">Beyond Billing</span>
             </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-black tracking-widest text-zinc-400">
            <a href="#features" className="hover:text-orange-500 transition-colors uppercase">Features</a>
            <a href="#plans" className="hover:text-orange-500 transition-colors uppercase">Plans</a>
            <a href="#about" className="hover:text-orange-500 transition-colors uppercase">About Us</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/dashboard" className="hidden sm:block text-[11px] font-black tracking-widest hover:text-orange-500 transition-colors uppercase">LOGIN</a>
            <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              className="bg-orange-500 hover:bg-orange-600 px-4 md:px-8 py-2 md:py-3.5 rounded-full font-black text-[11px] md:text-[14px] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/30"
            >
              <Download size={18} /> DOWNLOAD
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-56 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent -z-10" />
        
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-12">
            BILLING <span className="italic text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600">FAST</span> <br />
            BUSINESS <span className="italic">PRO.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-2xl mb-16 font-medium leading-relaxed">
            Turn your smartphone into a high-speed billing machine. Built for the modern Indian merchant.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32">
             <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              className="w-full sm:w-auto bg-white text-black hover:bg-orange-500 hover:text-white px-12 py-6 rounded-3xl font-black text-xl md:text-2xl transition-all flex items-center justify-center gap-4 group shadow-2xl"
            >
              GET FREE TRIAL <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </a>
            <a 
              href="https://wa.me/917838229178"
              className="w-full sm:w-auto bg-zinc-900 border-2 border-zinc-800 hover:border-orange-500 px-12 py-6 rounded-3xl font-black text-xl md:text-2xl transition-all flex items-center justify-center gap-4 group"
            >
              WATCH DEMO <MessageSquare size={24} className="text-orange-500 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          {/* COLORFUL TRUST SECTION */}
          <div className="relative max-w-5xl mx-auto py-16 px-8 bg-gradient-to-r from-orange-600/30 to-orange-400/30 rounded-[40px] border border-orange-500/50 backdrop-blur-md overflow-hidden group shadow-[0_0_50px_rgba(249,115,22,0.2)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent opacity-50" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
              <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 duration-500">
                <span className="text-5xl md:text-7xl font-black italic text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">100+</span>
                <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em] text-white uppercase">Active Merchants</span>
              </div>
              <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 duration-500">
                <span className="text-5xl md:text-7xl font-black italic text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">50K+</span>
                <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em] text-white/80 uppercase">Daily Invoices</span>
              </div>
              <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 duration-500">
                <span className="text-5xl md:text-7xl font-black italic text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">4.9/5</span>
                <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em] text-white uppercase">User Rating</span>
              </div>
              <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 duration-500">
                <span className="text-5xl md:text-7xl font-black italic text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">100%</span>
                <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em] text-white/80 uppercase">Data Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-zinc-950 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic">SHOP CONTROL.</h2>
              <p className="text-zinc-500 text-xl font-medium leading-relaxed">Everything you need to run your store like a pro. Manage billing, stock, and staff from anywhere.</p>
            </div>
            <div className="bg-orange-500 px-10 py-5 rounded-3xl font-black text-black rotate-2 text-xl shadow-2xl shadow-orange-500/20">MAKE IN INDIA 🇮🇳</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Speedy Billing", desc: "Create bills in seconds. Keep your customers happy and moving." },
              { icon: BarChart3, title: "Daily Reports", desc: "Know your exact profit and expense at the end of every day." },
              { icon: Smartphone, title: "Mobile First", desc: "No PC or bulky hardware. Your phone is your POS." },
              { icon: Shield, title: "Cloud Backup", desc: "Your data is always safe and accessible. Never lose a bill." },
              { icon: Users, title: "Staff Mgmt", desc: "Add staff members with limited access for extra security." },
              { icon: Globe, title: "Multi-Outlet", desc: "Control all your shop branches from one single master dashboard." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[40px] hover:bg-zinc-900 transition-all hover:-translate-y-3 group">
                <div className="w-16 h-16 bg-orange-500/10 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-orange-500 transition-all duration-500 shadow-lg group-hover:shadow-orange-500/20">
                  <f.icon className="text-orange-500 group-hover:text-white transition-colors" size={32} />
                </div>
                <h4 className="text-3xl font-black mb-5 italic">{f.title}</h4>
                <p className="text-zinc-500 font-bold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS SECTION */}
      <section id="plans" className="py-32 relative overflow-hidden bg-black">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-orange-500/5 blur-[120px] -z-10" />
        
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic underline decoration-orange-500 decoration-8 underline-offset-8">SIMPLE PLAN.</h2>
            <p className="text-zinc-500 text-xl font-medium mt-12">Clear pricing. No hidden costs. Pure value.</p>
          </div>

          <div className="max-w-2xl mx-auto bg-gradient-to-b from-zinc-900/80 to-black border-2 border-orange-500/50 p-12 md:p-20 rounded-[60px] relative shadow-[0_0_100px_rgba(249,115,22,0.2)]">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-10 py-3 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-2xl">SMART BUSINESS</div>
            
            <div className="text-center mb-16">
              <div className="flex justify-center items-end gap-3 mb-4">
                <span className="text-8xl md:text-[150px] font-black italic tracking-tighter leading-none">₹399</span>
                <span className="text-zinc-500 font-black text-2xl md:text-3xl mb-4 md:mb-8">/mo</span>
              </div>
              <p className="text-orange-500 font-black tracking-[0.4em] text-[10px] md:text-[12px] uppercase bg-orange-500/10 inline-block px-4 py-1.5 rounded-full">Automated Billing • Cloud Sync</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {[
                "Unlimited Billing",
                "Inventory Manager",
                "Daily Profit Reports",
                "Expense Tracker",
                "Staff Permissions",
                "WhatsApp Support",
                "Lifetime Updates",
                "Cloud Backup"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-orange-500" />
                  </div>
                  <span className="font-black text-zinc-300 text-sm md:text-base">{item}</span>
                </div>
              ))}
            </div>

            <a 
              href="https://wa.me/917838229178?text=Hello,%20I%20want%20to%20activate%20my%20InstaMunim%20Subscription!" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-8 rounded-[30px] font-black text-2xl md:text-3xl transition-all flex items-center justify-center gap-5 shadow-2xl shadow-orange-500/40 hover:scale-[1.02]"
            >
              ACTIVATE NOW <ChevronRight size={30} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER & ABOUT */}
      <footer id="about" className="pt-32 pb-16 bg-zinc-950 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="md:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                <img src="/assets/logo-light.png" alt="InstaMunim" className="w-16 h-16 grayscale brightness-200" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black italic tracking-tighter">INSTAMUNIM</span>
                  <span className="text-[12px] font-black tracking-widest text-orange-500 uppercase">Beyond Billing</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold leading-relaxed mb-8 text-lg">We are on a mission to digitize every small shop in India. InstaMunim is simple, fast, and secure. Built for the modern era.</p>
              
              <div className="flex gap-4">
                {/* SVG Icons for stability */}
                <a href="#" className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-all">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-all">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-all">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-black text-orange-500 tracking-[0.2em] text-[12px] uppercase mb-10 italic underline decoration-4 underline-offset-8">ABOUT US</h5>
              <p className="text-zinc-500 font-bold leading-relaxed text-lg">InstaMunim was built with one goal: Speed. We believe that shop owners should spend more time selling and less time billing. Our team is dedicated to providing the best POS experience in India.</p>
            </div>

            <div>
              <h5 className="font-black text-orange-500 tracking-[0.2em] text-[12px] uppercase mb-10 italic underline decoration-4 underline-offset-8">QUICK LINKS</h5>
              <ul className="space-y-4 text-zinc-400 font-black text-lg">
                <li><a href="#features" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight size={16} /> Features</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight size={16} /> Pricing Plans</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight size={16} /> Merchant Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight size={16} /> Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-orange-500 tracking-[0.2em] text-[12px] uppercase mb-10 italic underline decoration-4 underline-offset-8">SUPPORT</h5>
              <div className="flex flex-col gap-6 text-zinc-400 font-black text-lg">
                <a href="https://wa.me/917838229178" className="flex items-center gap-3 hover:text-white transition-colors">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center"><MessageSquare size={20} className="text-orange-500" /></div> WhatsApp Support
                </a>
                <p className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center"><Globe size={20} className="text-orange-500" /></div> All India Service
                </p>
                <a href="/InstaMunimSmartPOS_v1.1.apk" className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl hover:bg-white/10 transition-all border border-white/5">
                  <Download size={24} className="text-orange-500 animate-bounce" /> 
                  <div className="flex flex-col">
                    <span className="text-white text-sm">GET LATEST APK</span>
                    <span className="text-zinc-500 text-[10px]">v1.1 Stable Build</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-16 opacity-50">
            <p className="text-zinc-600 font-black text-[11px] tracking-widest uppercase italic">© 2026 INSTAMUNIM SMART POS • BEYOND BILLING • MADE WITH ❤️ IN INDIA</p>
            <div className="flex gap-10 text-[11px] font-black text-zinc-500 tracking-widest uppercase italic">
              <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
