"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Shield, Smartphone, BarChart3, ChevronRight, 
  Download, CheckCircle2, MessageSquare, Star, ArrowRight,
  LayoutDashboard, ShoppingCart, Users, Globe,
  Camera, Play, MapPin
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white scroll-smooth">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/assets/logo-dark.png" alt="InstaMunim" className="w-10 h-10 object-contain" />
            <span className="text-xl md:text-2xl font-black tracking-tighter italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">INSTAMUNIM</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-widest text-zinc-400">
            <a href="#features" className="hover:text-orange-500 transition-colors uppercase">Features</a>
            <a href="#trust" className="hover:text-orange-500 transition-colors uppercase">Network</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors uppercase">Pricing</a>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <a href="/dashboard" className="hidden sm:block text-[11px] font-black tracking-widest hover:text-orange-500 transition-colors uppercase border-b border-orange-500/0 hover:border-orange-500">LOGIN</a>
            <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              className="bg-orange-500 hover:bg-orange-600 px-5 md:px-7 py-2.5 rounded-full font-black text-[12px] md:text-[13px] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Download size={16} /> DOWNLOAD APK
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-orange-500/10 via-transparent to-transparent -z-10" />
        
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-5 py-2.5 rounded-full text-orange-500 text-[10px] md:text-[11px] font-black tracking-[0.2em] mb-10 backdrop-blur-sm">
            <Star size={14} className="fill-orange-500" /> JOIN 100+ SMART MERCHANTS
          </div>
          
          <h1 className="text-5xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10">
            BILLING <span className="italic text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600">FAST</span> <br />
            BUSINESS <span className="italic">PRO.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-base md:text-xl mb-14 font-medium leading-relaxed px-4">
            India's most powerful Smart POS. No bulky hardware needed. Turn your smartphone into a high-speed billing machine.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-24 px-6">
             <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              className="w-full sm:w-auto bg-white text-black hover:bg-orange-500 hover:text-white px-10 py-5 rounded-2xl font-black text-lg md:text-xl transition-all flex items-center justify-center gap-3 group shadow-2xl"
            >
              GET STARTED FREE <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="https://wa.me/917838229178"
              className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-10 py-5 rounded-2xl font-black text-lg md:text-xl transition-all flex items-center justify-center gap-3"
            >
              WATCH DEMO <MessageSquare size={22} className="text-orange-500" />
            </a>
          </div>

          {/* Social Proof Bar */}
          <div id="trust" className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/5 py-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex flex-col items-center gap-1"><span className="text-3xl font-black italic">100+</span><span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Merchants</span></div>
            <div className="flex flex-col items-center gap-1"><span className="text-3xl font-black italic">50K+</span><span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Bills Daily</span></div>
            <div className="flex flex-col items-center gap-1"><span className="text-3xl font-black italic">4.9/5</span><span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">User Rating</span></div>
            <div className="flex flex-col items-center gap-1"><span className="text-3xl font-black italic">99.9%</span><span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Uptime</span></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-zinc-950 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 italic">SMARTER BILLING.</h2>
            <p className="text-zinc-500 text-lg font-medium">Everything you need to run your store like a pro, minus the complexity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: Zap, title: "Lightning Billing", desc: "Create professional invoices in under 5 seconds. Speed is our DNA." },
              { icon: BarChart3, title: "Profit Analytics", desc: "Daily and monthly sales reports. Know your profit margins instantly." },
              { icon: Smartphone, title: "Purely Mobile", desc: "Manage your entire shop from any Android phone. Truly portable." },
              { icon: Shield, title: "Secure Cloud", desc: "Your data is encrypted and backed up 24/7. Never lose a record again." },
              { icon: Users, title: "Staff Control", desc: "Add staff with limited permissions. Keep your business secure." },
              { icon: Globe, title: "Global Access", desc: "Monitor your shop from anywhere in the world, in real-time." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/30 border border-white/5 p-8 md:p-10 rounded-[32px] hover:bg-zinc-900 transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 transition-all duration-500">
                  <f.icon className="text-orange-500 group-hover:text-white transition-colors" size={32} />
                </div>
                <h4 className="text-2xl font-black mb-4 italic tracking-tight">{f.title}</h4>
                <p className="text-zinc-500 font-semibold leading-relaxed text-sm md:text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 italic underline decoration-orange-500 decoration-8 underline-offset-[10px]">SIMPLE PRICING.</h2>
          </div>

          <div className="max-w-xl mx-auto bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-10 md:p-16 rounded-[50px] relative shadow-2xl">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-8 py-3 rounded-full font-black text-[12px] uppercase tracking-[0.2em] shadow-xl">ELITE BUSINESS</div>
            
            <div className="text-center mb-12">
              <div className="flex justify-center items-end gap-2 mb-2">
                <span className="text-7xl md:text-9xl font-black italic tracking-tighter italic">₹399</span>
                <span className="text-zinc-500 font-bold text-2xl mb-4">/mo</span>
              </div>
              <p className="text-orange-500 font-black tracking-widest text-xs uppercase">Billed Monthly • No Commitment</p>
            </div>

            <div className="space-y-5 mb-14">
              {[
                "Unlimited Digital Invoicing",
                "Advanced Inventory Control",
                "Expense & Profit Tracker",
                "Staff Management System",
                "24/7 WhatsApp Priority Support",
                "Automatic Cloud Backup"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500 transition-all">
                    <CheckCircle2 size={14} className="text-orange-500 group-hover:text-white" />
                  </div>
                  <span className="font-bold text-zinc-300 text-base md:text-lg">{item}</span>
                </div>
              ))}
            </div>

            <a 
              href="https://wa.me/917838229178?text=Hello,%20I%20want%20to%20activate%20my%20InstaMunim%20Subscription!" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-3xl font-black text-xl md:text-2xl transition-all flex items-center justify-center gap-4 shadow-xl shadow-orange-500/20"
            >
              ACTIVATE NOW <ChevronRight size={24} />
            </a>
            <p className="text-center text-zinc-500 mt-8 text-[11px] font-black tracking-widest uppercase">7-DAY FREE TRIAL INCLUDED • NO CARDS</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-12 border-t border-white/5 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <img src="/assets/logo-dark.png" alt="InstaMunim" className="w-10 h-10 grayscale brightness-200" />
                <span className="text-2xl font-black tracking-tighter italic">INSTAMUNIM</span>
              </div>
              <p className="text-zinc-500 font-bold leading-relaxed">The future of retail management in the palm of your hand. Built for the modern Indian merchant.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <h5 className="font-black tracking-widest text-[11px] text-zinc-500 uppercase mb-8">Follow Our Journey</h5>
              <div className="flex gap-6">
                <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"><Camera size={24} /></a>
                <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"><MessageSquare size={24} /></a>
                <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"><Play size={24} /></a>
                <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300"><MapPin size={24} /></a>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
               <h5 className="font-black tracking-widest text-[11px] text-zinc-500 uppercase mb-8">Ready to Scale?</h5>
               <a href="/InstaMunimSmartPOS_v1.1.apk" className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-orange-500 hover:text-white transition-all">
                  <Download size={20} /> GET THE APP
               </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 pt-12">
            <p className="text-zinc-600 font-bold text-xs">© 2026 INSTAMUNIM SMART POS. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8 text-[11px] font-black text-zinc-500 tracking-widest uppercase">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
