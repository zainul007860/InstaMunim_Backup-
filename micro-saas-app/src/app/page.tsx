"use client";

import { useState, useEffect } from "react";
import { 
  Download, Shield, ShieldCheck, ArrowRight, CheckCircle2, Check, X,
  RefreshCw, Heart, Zap, BarChart3, Camera, CreditCard, Lock,
  Users, HelpCircle, ChevronDown, MessageSquare, Star, Eye,
  Receipt, Wallet, Scan, Home, Wand2, Cpu, Smartphone
} from "lucide-react";
import { Capacitor } from '@capacitor/core';
import Dashboard from "./dashboard/page";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isApp, setIsApp] = useState<boolean | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: number;
    originalPrice?: number;
    savings?: number;
    cycle: 'monthly' | 'yearly';
    planKey: 'starter' | 'pro' | 'vip';
  } | null>(null);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [ownerMobileInput, setOwnerMobileInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

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
    // Check if running inside mobile web wrapper (native Android/iOS app)
    const checkApp = Capacitor.isNativePlatform();
    setIsApp(checkApp);

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

  if (isApp) {
    return <Dashboard />;
  }

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
        <span className="bg-orange-500 text-black px-2 py-0.5 rounded text-[9px] font-black mr-2 animate-pulse">LIVE</span>
        <span>🇮🇳 NOW LIVE ON GOOGLE PLAY STORE</span>
        <span className="opacity-30">|</span>
        <span className="text-orange-400">🔥 DOWNLOAD INSTAMUNIM APP DIRECTLY FROM PLAY STORE NOW</span>
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
            <a href="#ai-scanner" className="hover:text-orange-600 transition-colors">AI rate Scanner</a>
            <a href="#reviews" className="hover:text-orange-600 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="border border-zinc-200 hover:border-orange-500 text-zinc-700 hover:text-orange-600 px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors">
              LOG IN
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.zainul.instamunimpos" target="_blank" rel="noopener noreferrer" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 active:scale-95">
              <Smartphone className="w-3.5 h-3.5" /> GET IT ON PLAY STORE
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

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <a 
                href="https://play.google.com/store/apps/details?id=com.zainul.instamunimpos" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-all active:scale-95 hover:opacity-90 inline-block"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Download InstaMunim from Google Play Store" 
                  className="h-16 w-auto object-contain" 
                />
              </a>
              <a href="/dashboard" className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 h-[48px]">
                FREE WEB TRIAL <ArrowRight className="w-4 h-4 text-orange-500" />
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> NO SETUP CHARGES</span>
              <span className="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> 30-DAY FREE PREMIUM TRIAL</span>
              <span className="flex items-center gap-1.5"><Check className="text-orange-500 w-4 h-4" /> CANCEL ANYTIME</span>
            </div>
          </div>

          {/* Right side Interactive POS Simulator mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-100 rounded-full -z-10 blur-xl opacity-80"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-200 rounded-full -z-10 blur-2xl opacity-60"></div>
              
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-4 shadow-xl">
                <div className="bg-zinc-50 rounded-[2rem] p-5 border border-zinc-150 relative">
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
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Deep business metrics dashboard. Thermal printer settings, staff role permissions configure options.</p>
                  
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
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6"><RefreshCw className="w-6 h-6" /></div>
              <h4 className="font-bold text-lg text-zinc-950 mb-2">Automatic Cloud Backup</h4>
              <p className="text-xs font-medium text-zinc-500 leading-relaxed">Your data is safe even if your phone is broken or stolen! Log in on any new Android device to recover your database.</p>
            </div>

            <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-200/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6"><Heart className="w-6 h-6" /></div>
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
              <h4 className="text-base font-bold text-zinc-950 mb-2">3-Second Fast Invoices</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Speed up your billing counter. Add items to cart via click or search, then print or share invoices.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><BarChart3 className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-zinc-950 mb-2">Profit & Cost Monitoring</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Inventory costs, gross margins, and expenses are automatically deducted to calculate daily net profits.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><Camera className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-zinc-950 mb-2">AI Menu Scanner</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Gemini AI model automatically parses printed rate cards. Save time spent manually typing menu items and prices.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><CreditCard className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-zinc-950 mb-2">Rent & Commissions Tracker</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Manage rent cycles, security deposits, and broker details securely inside our cloud-synced system.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><Lock className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-zinc-950 mb-2">Staff Access Permissions</h4>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Lock staff log permissions to keep billing and security details completely secure.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-zinc-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5"><RefreshCw className="w-5 h-5" /></div>
              <h4 className="text-base font-bold text-zinc-950 mb-2">1-Click Full Cloud Sync</h4>
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
                <span className="text-[11px] text-zinc-500 font-semibold leading-normal">Verify the list and click save to update your menu instantly</span>
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
                    <span className="text-orange-500 font-extrabold">₹180.00</span>
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
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80" alt="Zaid Khan Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <p className="font-extrabold text-xs text-zinc-950 flex items-center gap-1.5">
                    Zaid Khan 
                    <span className="inline-flex items-center bg-green-50 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0">
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
                    <span className="inline-flex items-center bg-green-50 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0">
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
      <section id="pricing" className="py-24 bg-gradient-to-b from-zinc-50 via-white to-zinc-50 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100/55">Subscription Plans</span>
            <h2 className="text-4xl font-extrabold text-zinc-900 mt-4 mb-3 tracking-tighter">Choose the Perfect Plan for Your Business</h2>
            <p className="text-zinc-500 text-xs font-semibold">Scale smoothly with transparent pricing. No hidden fees or commissions.</p>
          </div>

          {/* Monthly/Yearly Toggle Switch */}
          <div className="flex items-center justify-center gap-3 mb-16">
            <span className={`text-xs font-black uppercase transition-colors ${!isYearly ? 'text-zinc-900' : 'text-zinc-400'}`}>Monthly Plans</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="w-14 h-8 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-full p-1 transition-colors flex items-center relative cursor-pointer border border-zinc-200/55 dark:border-zinc-700/55"
            >
              <div className={`w-6 h-6 bg-orange-500 rounded-full shadow-md transition-transform duration-300 transform ${isYearly ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black uppercase transition-colors ${isYearly ? 'text-zinc-900' : 'text-zinc-400'}`}>Yearly Super Offer</span>
              <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">Save Up To ₹4,488</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* STARTER PLAN */}
            <div className="bg-white border border-zinc-200/60 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-sm hover:shadow-md hover:border-zinc-300 transition-all text-left">
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">Starter Pack</span>
                  <h3 className="text-xl font-black text-zinc-950 mt-3">Starter Plan</h3>
                  <p className="text-zinc-450 text-[10px] font-bold mt-1">Best for Street Food, Juice Stalls & Cart Vendors</p>
                </div>
                
                <div className="flex flex-col py-1">
                  {isYearly ? (
                    <div>
                      <span className="line-through text-zinc-400 text-xs font-black tracking-wider block">₹199 × 12 = ₹2,388</span>
                      <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-zinc-900 tracking-tight">₹2,000</span>
                        <span className="text-zinc-400 text-xs font-bold">/ year</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1">Save ₹388</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black text-zinc-900 tracking-tight">₹199</span>
                      <span className="text-zinc-400 text-xs font-bold">/ month</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-zinc-100 pt-6 space-y-4 text-xs font-semibold text-zinc-600">
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Unlimited Invoicing & Sales bills</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> 1 Device Connection Limit</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> WhatsApp Receipts (With watermark)</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Basic Offline Mode</div>
                  <div className="flex items-center gap-2.5 opacity-40"><X className="text-red-400 w-4 h-4 shrink-0" /> GST Billing Support</div>
                  <div className="flex items-center gap-2.5 opacity-40"><X className="text-red-400 w-4 h-4 shrink-0" /> Stock & Inventory Management</div>
                  <div className="flex items-center gap-2.5 opacity-40"><X className="text-red-400 w-4 h-4 shrink-0" /> Staff Commission Tracking</div>
                  <div className="flex items-center gap-2.5 opacity-40"><X className="text-red-400 w-4 h-4 shrink-0" /> Priority Support & Setup</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedPlan({
                    name: 'Starter Plan',
                    price: isYearly ? 2000 : 199,
                    originalPrice: isYearly ? 2388 : undefined,
                    savings: isYearly ? 388 : undefined,
                    cycle: isYearly ? 'yearly' : 'monthly',
                    planKey: 'starter'
                  });
                  setPaymentModalOpen(true);
                }}
                className="w-full bg-zinc-900 hover:bg-black text-white font-black py-4 rounded-2xl text-xs mt-8 transition-all text-center uppercase tracking-widest border-0 cursor-pointer shadow-md active:scale-95"
              >
                ACTIVATE STARTER
              </button>
            </div>

            {/* PRO BUSINESS PLAN */}
            <div className="bg-white border-2 border-orange-500 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-xl text-left relative transform md:-translate-y-2 hover:scale-[1.01] transition-all">
              <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-wider shadow-md animate-pulse">Most Popular</div>
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Growth Pack</span>
                  <h3 className="text-xl font-black text-zinc-950 mt-3">Pro Business</h3>
                  <p className="text-orange-600/80 text-[10px] font-bold mt-1">Ideal for Cafes, Restaurants & Retail Shops</p>
                </div>
                
                <div className="flex flex-col py-1">
                  {isYearly ? (
                    <div>
                      <span className="line-through text-zinc-400 text-xs font-black tracking-wider block">₹399 × 12 = ₹4,788</span>
                      <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-zinc-900 tracking-tight">₹3,500</span>
                        <span className="text-zinc-400 text-xs font-bold">/ year</span>
                        <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1">Save ₹1,288</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black text-zinc-900 tracking-tight">₹399</span>
                      <span className="text-zinc-400 text-xs font-bold">/ month</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-zinc-100 pt-6 space-y-4 text-xs font-semibold text-zinc-650">
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Unlimited Invoicing & Sales bills</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> 3 Devices Connection Limit</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> WhatsApp Receipts (No watermark)</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> GST Billing & Custom Taxes</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Stock & Inventory Management</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Staff Commission Tracking</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Advanced Sales Analytics</div>
                  <div className="flex items-center gap-2.5 opacity-40"><X className="text-red-400 w-4 h-4 shrink-0" /> Priority 24/7 Setup & Phone Support</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedPlan({
                    name: 'Pro Business Plan',
                    price: isYearly ? 3500 : 399,
                    originalPrice: isYearly ? 4788 : undefined,
                    savings: isYearly ? 1288 : undefined,
                    cycle: isYearly ? 'yearly' : 'monthly',
                    planKey: 'pro'
                  });
                  setPaymentModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-2xl text-xs mt-8 transition-all text-center uppercase tracking-widest shadow-md shadow-orange-500/10 border-0 cursor-pointer active:scale-95"
              >
                ACTIVATE PRO
              </button>
            </div>

            {/* ENTERPRISE PLAN */}
            <div className="bg-white border border-zinc-200/60 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-sm hover:shadow-md hover:border-zinc-300 transition-all text-left">
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Enterprise Pack</span>
                  <h3 className="text-xl font-black text-zinc-950 mt-3">Enterprise & VIP</h3>
                  <p className="text-zinc-400 text-[10px] font-bold mt-1">For Showrooms, Salons & Multi-outlets</p>
                </div>
                
                <div className="flex flex-col py-1">
                  {isYearly ? (
                    <div>
                      <span className="line-through text-zinc-400 text-xs font-black tracking-wider block">₹999 × 12 = ₹11,988</span>
                      <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-zinc-900 tracking-tight">₹7,500</span>
                        <span className="text-zinc-400 text-xs font-bold">/ year</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1">Save ₹4,488</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black text-zinc-900 tracking-tight">₹999</span>
                      <span className="text-zinc-400 text-xs font-bold">/ month</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-zinc-100 pt-6 space-y-4 text-xs font-semibold text-zinc-650">
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Unlimited Devices Connection</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Customized Receipt Branding</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> High-Speed Barcode Checkout</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> AI Menu Card Scanner</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Auto Multi-outlet Cloud Sync</div>
                  <div className="flex items-center gap-2.5"><Check className="text-emerald-500 w-4 h-4 shrink-0" /> Dedicated Menu Setup Manager</div>
                  <div className="flex items-center gap-2.5 text-indigo-600 font-black"><Check className="text-indigo-500 w-4 h-4 shrink-0" /> Priority 24/7 Direct Phone Support</div>
                  <div className="flex items-center gap-2.5 text-indigo-600 font-black"><Check className="text-indigo-500 w-4 h-4 shrink-0" /> 1-on-1 Business Scaling Consultation</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedPlan({
                    name: 'Enterprise & VIP Plan',
                    price: isYearly ? 7500 : 999,
                    originalPrice: isYearly ? 11988 : undefined,
                    savings: isYearly ? 4488 : undefined,
                    cycle: isYearly ? 'yearly' : 'monthly',
                    planKey: 'vip'
                  });
                  setPaymentModalOpen(true);
                }}
                className="w-full bg-zinc-900 hover:bg-black text-white font-black py-4 rounded-2xl text-xs mt-8 transition-all text-center uppercase tracking-widest border-0 cursor-pointer shadow-md active:scale-95"
              >
                ACTIVATE VIP
              </button>
            </div>
          </div>

          <div className="mt-14 text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Looking for Freemium? <a href="https://play.google.com/store/apps/details?id=com.zainul.instamunimpos" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline hover:text-orange-600">Get 14-day free trial on Play Store</a>
            </p>
          </div>
        </div>
      </section>

      {/* SECURED UPI PAYMENT MODAL */}
      {paymentModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            {/* Close Button */}
            <button 
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors border-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% SECURED UPI PAYMENT
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">Activate {selectedPlan.name}</h3>
              <p className="text-xs font-bold text-zinc-400">Scan QR Code or copy UPI ID to complete payment</p>
            </div>

            {/* Selected Plan Price Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{selectedPlan.cycle === 'yearly' ? 'Yearly Package' : 'Monthly Subscription'}</p>
                <p className="text-lg font-black">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                {selectedPlan.originalPrice && (
                  <p className="text-xs font-bold line-through opacity-75">₹{selectedPlan.originalPrice.toLocaleString('en-IN')}</p>
                )}
                <p className="text-3xl font-black">₹{selectedPlan.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* QR Code Scanner Section */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-700/50 text-center space-y-4 mb-6">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-zinc-100">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`upi://pay?pa=7838229178@paytm&pn=InstaMunim%20POS&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(selectedPlan.name)}`)}&size=220x220`}
                  alt="InstaMunim Payment QR Scanner" 
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ACCEPTED VIA ALL UPI APPS</p>
                <p className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">GPay • PhonePe • Paytm • BHIM • AmazonPay</p>
              </div>

              {/* Copy UPI ID Button */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl text-xs font-black text-zinc-900 dark:text-white select-all">
                  7838229178@paytm
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText("7838229178@paytm");
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2500);
                  }}
                  className="bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 font-bold px-3 py-2 rounded-xl text-xs transition-colors border-0 cursor-pointer flex items-center gap-1"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                  {copiedUpi ? 'COPIED!' : 'COPY UPI'}
                </button>
              </div>
            </div>

            {/* Input details for Activation */}
            <div className="space-y-3 mb-6 text-left">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 block mb-1">Your Store / Business Name</label>
                <input 
                  type="text" 
                  value={storeNameInput} 
                  onChange={e => setStoreNameInput(e.target.value)} 
                  placeholder="e.g. Zaika Cafe & Biryani" 
                  className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 block mb-1">Owner Mobile Number</label>
                <input 
                  type="tel" 
                  value={ownerMobileInput} 
                  onChange={e => setOwnerMobileInput(e.target.value)} 
                  placeholder="e.g. 9876543210" 
                  className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Security Clauses & Guarantees */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 text-left space-y-2 mb-6 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant Account Activation within 15 Minutes of Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No Auto-Debit Mandate • No Hidden Renewal Charges</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Money-Back Guarantee if setup is not completed</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Button */}
            <a 
              href={`https://wa.me/917838229178?text=${encodeURIComponent(`Hi InstaMunim Team, I have made the payment of ₹${selectedPlan.price} for ${selectedPlan.name} (${selectedPlan.cycle}). 🚀\n\nStore Name: ${storeNameInput || '[Not Entered]'}\nOwner Mobile: ${ownerMobileInput || '[Not Entered]'}\n\nPlease verify my payment and activate my account.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest text-center shadow-lg shadow-emerald-600/20 block border-0 active:scale-95 transition-all"
            >
              I HAVE PAID — SEND RECEIPT ON WHATSAPP
            </a>
          </div>
        </div>
      )}

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
                <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="/delete-account" className="hover:text-white transition-colors">Delete Account</a>
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
                  <a href="https://www.facebook.com/share/1D9WZHmjNw/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-400 transition-colors flex items-center" title="Facebook Page">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="h-5.5 w-5.5">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
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
              <a href="#" className="hover:text-orange-400 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
