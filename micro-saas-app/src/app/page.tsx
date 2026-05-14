"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Shield, Smartphone, BarChart3, ChevronRight, 
  Download, CheckCircle2, MessageSquare, Star, ArrowRight,
  LayoutDashboard, ShoppingCart, Users, Globe
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/20">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">INSTAMUNIM</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-orange-500 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/dashboard" className="hidden sm:block text-sm font-bold hover:text-orange-500 transition-colors">MERCHANT LOGIN</a>
            <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              download
              className="bg-orange-500 hover:bg-orange-600 px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Download size={18} /> DOWNLOAD APK
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent -z-10" />
        
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full text-orange-500 text-xs font-black tracking-widest mb-8 animate-bounce">
            <Star size={14} className="fill-orange-500" /> #1 SMART POS FOR SMALL BUSINESS
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
            BILLING FAST <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 italic">BUSINESS SMART.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl mb-12 font-medium">
            Transform your shop with India's most powerful Smart POS. No bulky hardware needed. Just your phone and InstaMunim.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
             <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              download
              className="w-full sm:w-auto bg-white text-black hover:bg-orange-500 hover:text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 group"
            >
              DOWNLOAD FREE TRIAL <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3">
              WATCH DEMO <MessageSquare size={20} className="text-orange-500" />
            </button>
          </div>

          {/* App Preview Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-[40px] blur-2xl opacity-20 -z-10 animate-pulse" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-4 shadow-2xl overflow-hidden aspect-video relative">
              <div className="w-full h-full bg-black rounded-[20px] flex items-center justify-center border border-zinc-800 relative overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=2000" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 text-left">
                  <div className="flex gap-2 mb-4">
                    {[1,2,3].map(i => <div key={i} className="w-32 h-4 bg-orange-500/20 rounded-full animate-pulse" style={{ animationDelay: `${i*200}ms` }} />)}
                  </div>
                  <h3 className="text-3xl font-black italic">COMMAND CENTER LIVE</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-zinc-950 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 italic">POWER IN YOUR POCKET.</h2>
              <p className="text-zinc-400 text-lg font-medium">Everything you need to run your store like a pro, minus the complexity and high costs.</p>
            </div>
            <div className="bg-orange-500 px-6 py-3 rounded-2xl font-black text-black rotate-2 shadow-xl shadow-orange-500/20">MADE IN INDIA 🇮🇳</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Lightning Billing", desc: "Create invoices in under 5 seconds. Speed is our superpower." },
              { icon: BarChart3, title: "Deep Insights", desc: "Daily, Weekly, Monthly sales reports. Know your profit, instantly." },
              { icon: Smartphone, title: "Pure Mobile", desc: "No PC needed. Manage your entire shop from any Android phone." },
              { icon: Shield, title: "Cloud Security", desc: "Your data is encrypted and backed up 24/7 on our secure servers." },
              { icon: Users, title: "Staff Roles", desc: "Add staff with limited permissions. Secure and accountable." },
              { icon: Globe, title: "Multi-Store", desc: "Manage multiple outlets from a single master dashboard." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-all hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                  <f.icon className="text-orange-500 group-hover:text-white transition-colors" size={28} />
                </div>
                <h4 className="text-xl font-black mb-3 italic">{f.title}</h4>
                <p className="text-zinc-400 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 italic">NO HIDDEN FEES.</h2>
            <p className="text-zinc-400 text-lg font-medium">Simple, honest pricing for honest business owners.</p>
          </div>

          <div className="max-w-lg mx-auto bg-zinc-900 border-2 border-orange-500 p-10 rounded-[40px] relative shadow-2xl shadow-orange-500/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-black px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">MOST POPULAR</div>
            
            <div className="text-center mb-10">
              <h4 className="text-zinc-400 font-black mb-4 tracking-widest">SMART BUSINESS</h4>
              <div className="flex justify-center items-end gap-2">
                <span className="text-6xl font-black italic tracking-tighter">₹399</span>
                <span className="text-zinc-400 font-bold text-xl mb-2">/month</span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {[
                "Unlimited Billing",
                "Advanced Inventory Manager",
                "Expense Tracking",
                "Rent Target Tracker",
                "Staff Management",
                "WhatsApp Support",
                "Automated Cloud Backup"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-orange-500 flex-shrink-0" />
                  <span className="font-bold text-zinc-300">{item}</span>
                </div>
              ))}
            </div>

            <a 
              href="https://wa.me/917838229178?text=Hello,%20I%20want%20to%20buy%20InstaMunim%20Subscription!" 
              target="_blank"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3"
            >
              GET STARTED NOW <ChevronRight size={20} />
            </a>
            <p className="text-center text-zinc-500 mt-6 text-sm font-bold tracking-tight">FREE 7-DAY TRIAL • NO CREDIT CARD NEEDED</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 overflow-hidden relative">
        <div className="container mx-auto px-6 bg-orange-500 rounded-[50px] p-20 relative overflow-hidden text-center text-black">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 rotate-12"><LayoutDashboard size={100} /></div>
            <div className="absolute bottom-10 right-10 -rotate-12"><ShoppingCart size={100} /></div>
          </div>
          
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-10">
            STOP STRESSING.<br />
            START SELLING.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="/InstaMunimSmartPOS_v1.1.apk" 
              download
              className="w-full sm:w-auto bg-black text-white hover:bg-zinc-900 px-12 py-6 rounded-3xl font-black text-2xl transition-all shadow-2xl"
            >
              DOWNLOAD APP 📱
            </a>
            <a 
              href="https://wa.me/917838229178" 
              target="_blank"
              className="w-full sm:w-auto bg-white/20 backdrop-blur-md border border-black/10 hover:bg-white/30 px-12 py-6 rounded-3xl font-black text-2xl transition-all"
            >
              CONTACT SALES 💬
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale">
            <Zap className="text-white fill-white" size={24} />
            <span className="text-xl font-black tracking-tighter italic">INSTAMUNIM</span>
          </div>
          <p className="text-zinc-500 font-bold text-sm">© 2026 INSTAMUNIM SMART POS. BEYOND BILLING.</p>
          <div className="flex gap-6 text-sm font-black text-zinc-400">
            <a href="#" className="hover:text-orange-500">PRIVACY</a>
            <a href="#" className="hover:text-orange-500">TERMS</a>
            <a href="#" className="hover:text-orange-500">SUPPORT</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
