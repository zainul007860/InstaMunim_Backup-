"use client";

import { useState, useEffect } from "react";
import { 
  Download, Shield, ShieldCheck, ArrowRight, CheckCircle2, Check, X,
  RefreshCw, Heart, Zap, BarChart3, Camera, CreditCard, Lock,
  Users, HelpCircle, ChevronDown, MessageSquare, Star, Eye,
  Receipt, Wallet, Scan, Home, Wand2, Cpu
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isApp, setIsApp] = useState<boolean | null>(null);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // POS Simulator state
  const [simCart, setSimCart] = useState<Record<string, { price: number; active: boolean }>>({
    'Paneer Tikka': { price: 180, active: true },
    'Cold Coffee': { price: 70, active: true },
    'Veg Burger': { price: 120, active: false },
    'Masala Chai': { price: 20, active: false }
  });
  const [simBillStatus, setSimBillStatus] = useState("Generate Bill");

  // App Tour state
  const tourData = {
    billing: {
      screens: [
        { path: '/assets/screen_dashboard.jpg', name: 'assets/screen_dashboard.jpg' },
        { path: '/assets/screen_cash_entry_1.jpg', name: 'assets/screen_cash_entry_1.jpg' },
        { path: '/assets/screen_cash_entry_2.jpg', name: 'assets/screen_cash_entry_2.jpg' }
      ]
    },
    udhaar: {
      screens: [
        { path: '/assets/screen_udhaar_khata.jpg', name: 'assets/screen_udhaar_khata.jpg' }
      ]
    },
    'ai-stock': {
      screens: [
        { path: '/assets/screen_ai_advisor.jpg', name: 'assets/screen_ai_advisor.jpg' },
        { path: '/assets/screen_stock_diary.jpg', name: 'assets/screen_stock_diary.jpg' },
        { path: '/assets/screen_inventory.jpg', name: 'assets/screen_inventory.jpg' }
      ]
    },
    crm: {
      screens: [
        { path: '/assets/screen_crm.jpg', name: 'assets/screen_crm.jpg' }
      ]
    },
    rent: {
      screens: [
        { path: '/assets/screen_rent_mission.jpg', name: 'assets/screen_rent_mission.jpg' }
      ]
    },
    'analytics-settings': {
      screens: [
        { path: '/assets/screen_business_analytics.jpg', name: 'assets/screen_business_analytics.jpg' },
        { path: '/assets/screen_analytics.jpg', name: 'assets/screen_analytics.jpg' },
        { path: '/assets/screen_settings.jpg', name: 'assets/screen_settings.jpg' },
        { path: '/assets/screen_more_options.jpg', name: 'assets/screen_more_options.jpg' },
        { path: '/assets/screen_login.jpg', name: 'assets/screen_login.jpg' }
      ]
    }
  };

  const [activeTourTab, setActiveTourTab] = useState<keyof typeof tourData>('billing');
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [fadeScreen, setFadeScreen] = useState(false);
  const [phoneTime, setPhoneTime] = useState("01:43");

  useEffect(() => {
    // Check if running inside mobile web wrapper
    const checkApp = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform;
    if (checkApp) {
      window.location.href = "/dashboard";
    } else {
      setIsApp(false);
    }

    // Scroll listener
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Live phone clock
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      setPhoneTime(`${hours}:${minutes}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 60000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(clockInterval);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const toggleSimItem = (name: string) => {
    setSimCart(prev => ({
      ...prev,
      [name]: { ...prev[name], active: !prev[name].active }
    }));
    setSimBillStatus("Generate Bill");
  };

  const generateSimBill = () => {
    const activeItemsCount = Object.values(simCart).filter(item => item.active).length;
    if (activeItemsCount === 0) {
      setSimBillStatus("Empty Cart!");
      return;
    }
    setSimBillStatus("Bill Printed! 🖨️");
  };

  const handleTourTabChange = (tabKey: keyof typeof tourData) => {
    setFadeScreen(true);
    setTimeout(() => {
      setActiveTourTab(tabKey);
      setActiveSubIndex(0);
      setFadeScreen(false);
    }, 100);
  };

  const handleSubTabChange = (index: number) => {
    setFadeScreen(true);
    setTimeout(() => {
      setActiveSubIndex(index);
      setFadeScreen(false);
    }, 100);
  };

  if (isApp === null) return <div className="bg-white min-h-screen" />;

  const cartItems = Object.entries(simCart).filter(([_, item]) => item.active);
  const simTotal = cartItems.reduce((sum, [_, item]) => sum + item.price, 0);

  const activeScreen = tourData[activeTourTab].screens[activeSubIndex] || tourData[activeTourTab].screens[0];

  const gridPatternStyle = {
    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  };

  const darkGridPatternStyle = {
    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  };

  return (
    <div className="bg-white text-zinc-900 overflow-x-hidden scroll-smooth selection:bg-orange-500 selection:text-white min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}} />

      {/* TOP INFO BAR */}
      <div className="bg-zinc-950 text-white text-[11px] font-extrabold tracking-widest py-2.5 px-4 text-center flex items-center justify-center gap-2">
        <span className="bg-orange-500 text-black px-2 py-0.5 rounded text-[9px] font-black mr-2 animate-pulse">NEW</span>
        <span>🇮🇳 MAKE IN INDIA FOR LOCAL MERCHANT STORES</span>
        <span class="opacity-30">|</span>
        <span className="text-orange-400">🔥 7-DAY UNLIMITED FREE TRIAL AVAILABLE</span>
      </div>

      {/* NAVIGATION */}
      <nav className={`sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-zinc-150 py-4 shadow-sm transition-all duration-300`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img src="/assets/instamunim-logo-main.png" alt="InstaMunim Logo" className="h-28 w-auto object-contain -my-6" />
          </div>
          
          {/* Nav Menu Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-wider text-zinc-500 uppercase">
            <a href="#about" className="hover:text-orange-600 transition-colors">Why POS</a>
            <a href="#features" className="hover:text-orange-600 transition-colors">Core Systems</a>
            <a href="#ai-scanner" class="hover:text-orange-600 transition-colors">AI rate Scanner</a>
            <a href="#reviews" className="hover:text-orange-600 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="border border-zinc-200 hover:border-orange-500 text-zinc-700 hover:text-orange-600 px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors">
              LOG IN
            </a>
            <a href="/InstaMunimSmartPOS_v1.2-release.apk?v=5" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 active:scale-95">
              <Download className="w-3.5 h-3.5" /> DOWNLOAD APP
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-orange-50/50 via-white to-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-70" style={gridPatternStyle}></div>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(249,115,22,0.06)_0%,_transparent_60%)] -z-10"></div>

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left side text & stats */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 px-4.5 py-1.5 rounded-full font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-orange-500" /> Cloud Synced Database • 256-Bit Encrypted Data
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-950 leading-[1.12]">
              Ab Bill Banayein <br />
              <span className="text-orange-500 italic">Fast & Smart</span>.
            </h1>
            
            <p className="text-zinc-500 text-base md:text-lg leading-relaxed font-medium">
              India's most trusted POS solution built for shopkeepers. Create high-speed receipts, sync material inventory, and manage daily profits automatically right on your mobile phone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a href="/InstaMunimSmartPOS_v1.2-release.apk?v=5" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 active:scale-95">
                <Download className="w-5 h-5" /> DOWNLOAD APP v1.2
              </a>
              <a href="/dashboard" className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-8 py-4.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                FREE WEB TRIAL <ArrowRight className="w-4 h-4 text-orange-500" />
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> NO SETUP CHARGES</span>
              <span class="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> 7-DAY FREE TRIAL</span>
              <span class="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> CANCEL ANYTIME</span>
            </div>
          </div>

          {/* Right side Interactive POS Simulator mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-100 rounded-full -z-10 blur-xl opacity-80"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-200 rounded-full -z-10 blur-2xl opacity-60"></div>
              
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-4 shadow-xl">
                <div class="bg-zinc-50 rounded-[2rem] p-5 border border-zinc-150 relative">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-extrabold text-[9px] text-zinc-400 uppercase tracking-widest">LIVE POS SIMULATOR</h4>
                      <span className="text-2xl font-black text-zinc-900 tracking-tight" id="sim-total">₹{simTotal.toFixed(2)}</span>
                    </div>
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">CLICK TO TEST</span>
                  </div>

                  {/* Interactive simulator dishes list */}
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2.5">Menu Items (Click to Add/Remove)</p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {Object.entries(simCart).map(([name, item]) => (
                      <button 
                        key={name}
                        onClick={() => toggleSimItem(name)} 
                        className={`p-2.5 bg-white border-2 rounded-2xl text-left transition-all hover:shadow-sm ${item.active ? 'border-orange-500' : 'border-zinc-200'}`}
                      >
                        <p className="text-xs font-black text-zinc-800">{name}</p>
                        <p className={`text-[10px] font-extrabold ${item.active ? 'text-orange-600' : 'text-zinc-400'}`}>₹{item.price}</p>
                      </button>
                    ))}
                  </div>

                  {/* Cart list items display */}
                  <div className="space-y-2 mb-6">
                    {cartItems.map(([name, item]) => (
                      <div key={name} className="bg-white p-2.5 rounded-xl border border-zinc-200/50 flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-700">{name}</span>
                        <span className="font-black text-zinc-950">₹{item.price}.00</span>
                      </div>
                    ))}
                    {cartItems.length === 0 && (
                      <div className="p-4 text-center text-zinc-400 text-xs font-semibold">Cart is empty. Click items above to add.</div>
                    )}
                  </div>

                  {/* Bill output */}
                  <button 
                    className="w-full bg-zinc-950 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg transition-transform duration-300 active:scale-95 text-left" 
                    onClick={generateSimBill}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-orange-500 w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{simBillStatus}</span>
                    </div>
                    <span className="text-xs font-extrabold text-orange-500">₹{simTotal.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS STRIP */}
      <div className="bg-zinc-50 border-y border-zinc-150 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.25em] mb-4">TRUSTED BY 500+ MERCHANTS ACROSS INDIA</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 font-black text-sm italic tracking-tighter text-zinc-500">
            <span>🌶️ RESTAURANTS</span>
            <span>🍕 CAFE CHAINS</span>
            <span>🥛 DAIRY OUTLETS</span>
            <span>🛍️ RETAIL COUNTERS</span>
            <span>🍞 BAKERY SHOPS</span>
          </div>
        </div>
      </div>

      {/* APP SCREEN SHOWCASE (VISUAL TOUR) */}
      <section className="py-20 bg-white border-b border-zinc-150">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 px-4 py-1 rounded-full font-bold text-xs mb-3">
              <Eye className="w-3.5 h-3.5" /> VISUAL WALKTHROUGH
            </div>
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">One Simple App for All Your Shop Tasks</h2>
            <p className="text-zinc-500 text-sm font-medium">Take a visual tour of the InstaMunim POS app screens and features.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Side: Interactive Module Navigation */}
            <div className="lg:col-span-7 space-y-3">
              {/* Tab 1: Billing & POS */}
              <div 
                onClick={() => handleTourTabChange('billing')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'billing' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'billing' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'billing' ? 'text-zinc-950' : 'text-zinc-800'}`}>Billing & POS Counter</h4>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Super-fast billing entry, item selection, dynamic bill cart summary, and quick payments receipts.</p>
                  
                  {activeTourTab === 'billing' && (
                    <div className="tour-subtabs mt-2.5 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                      {tourData.billing.screens.map((scr, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSubTabChange(idx)} 
                          className={`border px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${activeSubIndex === idx ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
                        >
                          {idx === 0 ? "Dashboard" : idx === 1 ? "Quick Cash Entry" : "Bill Cart Details"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tab 2: Udhaar Khata */}
              <div 
                onClick={() => handleTourTabChange('udhaar')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'udhaar' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'udhaar' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'udhaar' ? 'text-zinc-950' : 'text-zinc-800'}`}>Udhaar Khata (Credit Ledger)</h4>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Manage pending credits of your customers. Automatic ledger logs and 1-click 'Mark as Paid' system.</p>
                </div>
              </div>

              {/* Tab 3: AI Scanner & Stock Diary */}
              <div 
                onClick={() => handleTourTabChange('ai-stock')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'ai-stock' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'ai-stock' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <Scan className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'ai-stock' ? 'text-zinc-950' : 'text-zinc-800'}`}>AI Scanner & Stock Diary</h4>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Scan paper menu lists automatically. Record daily stock updates and inventory details in the Stock Diary.</p>
                  
                  {activeTourTab === 'ai-stock' && (
                    <div className="tour-subtabs mt-2.5 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                      {tourData['ai-stock'].screens.map((scr, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSubTabChange(idx)} 
                          className={`border px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${activeSubIndex === idx ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
                        >
                          {idx === 0 ? "AI Scanner" : idx === 1 ? "Stock Diary" : "Inventory List"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tab 4: Smart CRM */}
              <div 
                onClick={() => handleTourTabChange('crm')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'crm' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'crm' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'crm' ? 'text-zinc-950' : 'text-zinc-800'}`}>Smart CRM & Retention</h4>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Send WhatsApp discounts using retention marketing templates and invite your regular customers back.</p>
                </div>
              </div>

              {/* Tab 5: Rent Mission */}
              <div 
                onClick={() => handleTourTabChange('rent')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'rent' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'rent' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'rent' ? 'text-zinc-950' : 'text-zinc-800'}`}>Rent & Cost Control</h4>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Track your shop's fixed costs and daily targets. Monitor daily carry-over costs with the progress meter.</p>
                </div>
              </div>

              {/* Tab 6: Analytics & Settings */}
              <div 
                onClick={() => handleTourTabChange('analytics-settings')} 
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex gap-4 items-start border-2 ${activeTourTab === 'analytics-settings' ? 'bg-orange-50/80 border-orange-500 shadow-sm shadow-orange-500/5' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTourTab === 'analytics-settings' ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-200 text-zinc-600'}`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="space-y-1 grow">
                  <h4 className={`font-extrabold text-sm md:text-base ${activeTourTab === 'analytics-settings' ? 'text-zinc-950' : 'text-zinc-800'}`}>Analytics & Admin Settings</h4>
                  <p class="text-zinc-500 text-xs font-semibold leading-relaxed">Deep business metrics dashboard. Thermal printer settings, staff role permissions configure options.</p>
                  
                  {activeTourTab === 'analytics-settings' && (
                    <div className="tour-subtabs mt-2.5 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                      {tourData['analytics-settings'].screens.map((scr, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSubTabChange(idx)} 
                          className={`border px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${activeSubIndex === idx ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
                        >
                          {idx === 0 ? "Business Analytics" : idx === 1 ? "Analytics Overview" : idx === 2 ? "Store Settings" : idx === 3 ? "More Options" : "Account Login"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Phone Mockup Container */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center">
              <div className="relative w-full max-w-[310px]">
                <div className="absolute inset-0 bg-orange-500/10 rounded-[2.75rem] blur-2xl -z-10"></div>
                <div className="bg-zinc-950 rounded-[3rem] p-3 shadow-2xl border-4 border-zinc-800">
                  <div className="relative bg-zinc-900 rounded-[2.5rem] overflow-hidden aspect-[9/19.5] border-2 border-zinc-700/50 flex flex-col">
                    {/* Top Status Bar Mockup */}
                    <div className="h-6 bg-zinc-900 text-white px-5 flex justify-between items-center text-[10px] font-bold z-20 shrink-0">
                      <span>{phoneTime}</span>
                      <div className="w-14 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-zinc-850 rounded-full border border-zinc-700"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-zinc-300 fill-current" viewBox="0 0 24 24"><path d="M12 21l-12-18h24z"/></svg>
                        <svg className="w-3.5 h-3.5 text-zinc-300 fill-current" viewBox="0 0 24 24"><path d="M17 5H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>
                      </div>
                    </div>
                    
                    {/* Screen Content Area */}
                    <div className="grow relative bg-zinc-50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={activeScreen.path} 
                        alt="InstaMunim App Screenshot" 
                        className={`w-full h-full object-cover select-none transition-opacity duration-350 ${fadeScreen ? 'opacity-0' : 'opacity-100'}`} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <span className="bg-zinc-100 text-zinc-500 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-zinc-200">
                    File: {activeScreen.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SHIELD SECTION */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">Secure & Reliable Infrastructure</h2>
            <p className="text-zinc-500 text-sm font-medium">Protecting and backing up your shop database on the cloud is our top priority.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-200/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6"><Shield className="w-6 h-6" /></div>
              <h4 className="font-bold text-lg text-zinc-950 mb-2">High-Grade RLS Encryption</h4>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed">Your sales, margin profits, and personal account are completely secure. Row-Level Security (RLS) policies protect client data access.</p>
            </div>
            
            <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-200/50 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6"><RefreshCw className="w-6 h-6" /></div>
              <h4 className="font-bold text-lg text-zinc-950 mb-2">Automatic Cloud Backup</h4>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed">Your data is safe even if your phone is broken or stolen! Log in on any new Android device to recover your database.</p>
            </div>

            <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-200/50 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6"><Heart className="w-6 h-6" /></div>
              <h4 className="font-bold text-lg text-zinc-950 mb-2">Zero Commission POS</h4>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed">InstaMunim is a digital software subscription. We do not take any transaction volume percentage cut from your sales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES LIST */}
      <section id="features" className="py-20 bg-zinc-50 border-t border-zinc-150">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">Complete Shop Management</h2>
            <p className="text-zinc-500 text-sm font-medium">All shop management tools remain synced inside a single dashboard panel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><Zap className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">3-Second Fast Invoices</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Speed up your billing counter. Add items to cart via click or search, then print or share invoices.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><BarChart3 className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">Profit & Cost Monitoring</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Inventory costs, gross margins, and expenses are automatically deducted to calculate daily net profits.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><Camera className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">AI Menu Scanner</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Gemini AI model automatically parses printed rate cards. Save time spent manually typing menu items and prices.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><CreditCard className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">Rent & Commissions Tracker</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Manage rent cycles, security deposits, and broker details securely inside our cloud-synced system.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><Lock className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">Staff Access Permissions</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Lock staff log permissions to keep billing and security details completely secure.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><RefreshCw className="w-5 h-5" /></div>
              <h4 class="text-base font-bold text-zinc-950 mb-2">1-Click Full Cloud Sync</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Your database creates automatic updates. Supabase backup servers dynamically store all your shop data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI RATE CARD SCANNER FEATURE */}
      <section id="ai-scanner" className="py-24 bg-zinc-950 text-white relative overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={darkGridPatternStyle}></div>
        
        {/* Neon Glowing Radial Highlights */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(249,115,22,0.15)_0%,_transparent_65%)] pointer-events-none blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(249,115,22,0.1)_0%,_transparent_65%)] pointer-events-none blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left text area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 px-4 py-1.5 rounded-full tracking-widest uppercase text-[10px] font-black">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              Gemini AI Engine ⚡
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Smart Rate List Scanner
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-semibold">
              Upload a photo of your menu card or rate list! The Gemini 2.5-flash AI model will automatically detect items and prices, loading them into your POS database in 5 seconds.
            </p>
            
            {/* Interactive Steps Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              {/* Step 1 */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/[0.02] transition-all duration-305 group">
                <div className="w-9 h-9 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-zinc-300 text-sm block mb-1">1. Snap a Photo</span>
                <span className="text-[11px] text-zinc-500 font-semibold leading-normal">Take a picture or select a rate list from your phone gallery</span>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/[0.02] transition-all duration-305 group">
                <div className="w-9 h-9 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-zinc-300 text-sm block mb-1">2. AI Scan Preview</span>
                <span className="text-[11px] text-zinc-500 font-semibold leading-normal">Item names and prices are automatically detected and listed</span>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/[0.02] transition-all duration-305 group">
                <div className="w-9 h-9 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-zinc-300 text-sm block mb-1">3. Instant Save</span>
                <span class="text-[11px] text-zinc-500 font-semibold leading-normal">Verify the list and click save to update your menu instantly</span>
              </div>
            </div>
          </div>
          
          {/* Right Scanner visual simulation card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Backside decorative glows */}
              <div className="absolute inset-0 bg-orange-500/20 rounded-3xl blur-2xl -z-10"></div>
              
              {/* Glass Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                {/* Simulated Scanning Red laser line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-85 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-scan z-10"></div>

                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto text-orange-500 mb-4 border border-orange-500/20">
                  <Wand2 className="w-7 h-7" />
                </div>
                
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="font-black text-sm text-zinc-200 uppercase tracking-widest">Gemini AI Scanner</h4>
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-orange-500 tracking-wider">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Live Scan
                  </span>
                </div>
                <p className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider mb-4 border-b border-zinc-850 pb-2.5">Auto-parsed list demo</p>
                
                <div className="border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-zinc-400 bg-zinc-950/60 backdrop-blur-md space-y-2.5 mb-5 relative overflow-hidden">
                  <div className="flex justify-between border-b pb-1.5 border-zinc-900">
                    <span>Paneer Butter Masala</span> 
                    <span className="text-orange-500 font-extrabold">₹220.00</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 border-zinc-900">
                    <span>Tandoori Roti</span> 
                    <span className="text-orange-500 font-extrabold">₹15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dal Makhani</span> 
                    <span class="text-orange-500 font-extrabold">₹180.00</span>
                  </div>
                </div>
                
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4" /> SAVE TO SYSTEM MENU
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MERCHANT TESTIMONIALS WITH HUMAN PICTURES */}
      <section id="reviews" className="py-20 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 px-4 py-1 rounded-full font-bold text-xs mb-3">
              <Users className="w-3.5 h-3.5" /> MERCHANT REVIEWS
            </div>
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">Trusted by 100+ Local Businesses</h2>
            <p className="text-zinc-500 text-sm font-medium">Merchant feedback aur real-world testimonials from active store owners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex text-orange-500 gap-0.5 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-zinc-655 text-xs font-semibold leading-relaxed mb-6">"Bohot badhiya software hai! AI rate card scanner se rate card scan ho gaya aur menu 1 min me ready. Mobile par hi full billing chal rahi hai."</p>
              <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" alt="Amit Sharma Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <p className="font-extrabold text-xs text-zinc-950 flex items-center gap-1.5">
                    Amit Sharma 
                    <span className="inline-flex items-center bg-green-50 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0">
                      <Check className="w-2.5 h-2.5 mr-0.5 text-green-600" /> VERIFIED
                    </span>
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Ganga Dhaba & Sweets</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex text-orange-500 gap-0.5 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-zinc-655 text-xs font-semibold leading-relaxed mb-6">"Automatic database backup feature best hai. Mera phone toat gaya tha par naye phone me log in krte hi menu aur sales data wapas mil gaya."</p>
              <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80" alt="Zainul Khan Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <p className="font-extrabold text-xs text-zinc-950 flex items-center gap-1.5">
                    Zainul Khan 
                    <span class="inline-flex items-center bg-green-50 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0">
                      <Check className="w-2.5 h-2.5 mr-0.5 text-green-600" /> VERIFIED
                    </span>
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Zaika Biryani Point</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex text-orange-500 gap-0.5 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-zinc-655 text-xs font-semibold leading-relaxed mb-6">"Humare cafe me staff billing control krne ke liye humne ise install kiya. Security aur restrictions settings bohot useful aur reliable hain."</p>
              <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" alt="Preeti Singh Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <p className="font-extrabold text-xs text-zinc-950 flex items-center gap-1.5">
                    Preeti Singh 
                    <span class="inline-flex items-center bg-green-50 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0">
                      <Check className="w-2.5 h-2.5 mr-0.5 text-green-600" /> VERIFIED
                    </span>
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Cafe Chillum & Grill</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING OPTIONS */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-500 text-sm font-medium">Flat subscription model. No hidden charges or transaction commissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* FREE PLAN */}
            <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex flex-col justify-between shadow-sm text-left hover:border-zinc-300 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Freemium Plan</span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-zinc-900">₹0</span>
                  <span className="text-zinc-400 text-xs font-bold">/ forever</span>
                </div>
                <p className="text-zinc-500 text-xs font-bold">Launch your business at zero cost.</p>
                <div className="border-t border-zinc-100 pt-4 space-y-3.5 text-xs font-semibold text-zinc-650">
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> 40 sales bills / day limit</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Smart CRM (10 contacts limit)</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> WhatsApp Receipts (with watermark)</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> Daily Stock Diary & Inventory</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> Rent & Commission Tracker</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> High-Speed Barcode Checkout</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> AI Menu Card Scanner</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> Premium Dark Mode Theme</div>
                  <div className="flex items-center gap-2 opacity-50"><X className="text-red-500 w-4 h-4 shrink-0" /> Ad-Free App Experience</div>
                </div>
              </div>
              <a 
                href="/InstaMunimSmartPOS_v1.2-release.apk?v=5"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold py-3.5 rounded-xl text-xs mt-8 transition-colors text-center uppercase tracking-widest border border-zinc-200 shadow-sm"
              >
                Download Free APP
              </a>
            </div>

            {/* MONTHLY */}
            <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex flex-col justify-between shadow-sm text-left hover:border-zinc-300 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Monthly Smart Plan</span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-zinc-900">₹299</span>
                  <span className="text-zinc-400 text-xs font-bold">/ month</span>
                </div>
                <p className="text-zinc-500 text-xs font-bold">Billed monthly. Cancel anytime.</p>
                <div className="border-t border-zinc-100 pt-4 space-y-3.5 text-xs font-semibold text-zinc-650">
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Unlimited Invoicing & Sales Bills</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Smart CRM (Unlimited Outreach)</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> WhatsApp Receipts (No watermark)</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Daily Stock Diary & Inventory</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Rent & Commission Tracker</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> High-Speed Barcode Checkout</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> AI Menu Card Scanner</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Premium Dark Mode Theme</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Ad-Free App Experience</div>
                </div>
              </div>
              <a 
                href={`https://wa.me/917838229178?text=${encodeURIComponent("Hi InstaMunim Team, I want to activate the Monthly Smart Business Plan (\u20B9299/mo) for my store. \uD83D\uDE80\n\nStore Name: \nOwner Name: \n\nPlease guide me with the payment and activation process. \uD83D\uDCC8")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-zinc-900 hover:bg-orange-500 text-white font-extrabold py-3.5 rounded-xl text-xs mt-8 transition-colors text-center uppercase tracking-widest"
              >
                ACTIVATE MONTHLY
              </a>
            </div>

            {/* YEARLY */}
            <div className="bg-white border-2 border-orange-500 p-8 rounded-3xl flex flex-col justify-between shadow-md text-left relative hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute -top-3.5 right-6 bg-orange-500 text-white px-3.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider shadow-md animate-bounce">SAVE 25%</div>
              <div className="space-y-4">
                <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Yearly Smart Plan</span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-zinc-900">₹3,600</span>
                  <span className="text-zinc-400 text-xs font-bold">/ year</span>
                </div>
                <p className="text-orange-600 text-xs font-black uppercase">Equivalent to ₹300/mo (Save ₹1,188/yr)</p>
                <div className="border-t border-zinc-100 pt-4 space-y-3.5 text-xs font-semibold text-zinc-750">
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Unlimited Invoicing & Sales Bills</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Smart CRM (Unlimited Outreach)</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> WhatsApp Receipts (No watermark)</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Daily Stock Diary & Inventory</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Rent & Commission Tracker</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> High-Speed Barcode Checkout</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> AI Menu Card Scanner</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Premium Dark Mode Theme</div>
                  <div className="flex items-center gap-2"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Ad-Free App Experience</div>
                  <div className="flex items-center gap-2 text-orange-600 font-extrabold"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Customized Invoice Templates</div>
                  <div className="flex items-center gap-2 text-orange-600 font-extrabold"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Free Dedicated Setup Manager</div>
                  <div className="flex items-center gap-2 text-orange-600 font-extrabold"><Check className="text-orange-500 w-4 h-4 shrink-0" /> 24/7 Priority Support & New Modules</div>
                </div>
              </div>
              <a 
                href={`https://wa.me/917838229178?text=${encodeURIComponent("Hi InstaMunim Team, I want to activate the Yearly Smart Business Plan (\u20B93600/yr) for my store. \uD83D\uDE80\n\nStore Name: \nOwner Name: \n\nPlease guide me with the payment and activation process. \uD83D\uDCC8")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-xl text-xs mt-8 transition-colors shadow-md shadow-orange-500/10 text-center uppercase tracking-widest"
              >
                ACTIVATE YEARLY
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-150">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">Common Questions</h2>
            <p className="text-zinc-500 text-sm font-medium">Frequently asked questions by shopkeepers (Click to Expand)</p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm cursor-pointer p-6" onClick={() => toggleFaq(0)}>
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-zinc-950 text-sm md:text-base flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-orange-500" /> Is my shop database secure?
                </h4>
                <ChevronDown className={`w-4.5 h-4.5 text-zinc-400 transition-transform duration-300 ${activeFaq === 0 ? 'rotate-180' : ''}`} />
              </div>
              <div className={`faq-answer text-xs font-semibold text-zinc-500 leading-relaxed pl-7 transition-all duration-300 overflow-hidden ${activeFaq === 0 ? 'max-h-40 pt-3' : 'max-h-0'}`}>
                Yes, absolutely. InstaMunim uses a secure cloud database integrated with Supabase. Your transaction and invoice logs are encrypted and protected from unauthorized access.
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm cursor-pointer p-6" onClick={() => toggleFaq(1)}>
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-zinc-950 text-sm md:text-base flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-orange-500" /> How do I recover data if my phone is damaged?
                </h4>
                <ChevronDown className={`w-4.5 h-4.5 text-zinc-400 transition-transform duration-300 ${activeFaq === 1 ? 'rotate-180' : ''}`} />
              </div>
              <div className={`faq-answer text-xs font-semibold text-zinc-500 leading-relaxed pl-7 transition-all duration-300 overflow-hidden ${activeFaq === 1 ? 'max-h-40 pt-3' : 'max-h-0'}`}>
                As soon as you bill a customer, data is automatically synced to the cloud. You can log in on any new Android phone to restore your menu and sales history with one click.
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm cursor-pointer p-6" onClick={() => toggleFaq(2)}>
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-zinc-950 text-sm md:text-base flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-orange-500" /> How does the AI Rate Scanner work?
                </h4>
                <ChevronDown className={`w-4.5 h-4.5 text-zinc-400 transition-transform duration-300 ${activeFaq === 2 ? 'rotate-180' : ''}`} />
              </div>
              <div className={`faq-answer text-xs font-semibold text-zinc-500 leading-relaxed pl-7 transition-all duration-300 overflow-hidden ${activeFaq === 2 ? 'max-h-40 pt-3' : 'max-h-0'}`}>
                Just capture or upload a photo of your menu card. The Google Gemini AI scanner automatically reads the text, identifies items and prices, and lists them on screen for you to review and save.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <img src="/assets/instamunim-logo-main.png" alt="InstaMunim Logo" className="w-12 h-12 object-contain" />
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
                <div className="flex items-center gap-4">
                  <a href="https://wa.me/917838229178" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-400 transition-colors flex items-center" title="WhatsApp Chat"><MessageSquare className="h-5.5 w-5.5" /></a>
                  <a href="https://www.instagram.com/instamunim?igsh=MTB3ZjFkdHVhaXNweg==" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-400 transition-colors flex items-center" title="Instagram Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="h-5.5 w-5.5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                <h5 className="font-black text-orange-400 text-[10px] tracking-widest uppercase mb-2">Support</h5>
                <a href="https://wa.me/917838229178" className="hover:text-white transition-colors">WhatsApp 24/7</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-zinc-850 pt-8 text-center md:text-left">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              &copy; 2026 INSTAMUNIM SMART POS • BEYOND BILLING • ALL RIGHTS RESERVED
            </p>
            <div className="flex gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
