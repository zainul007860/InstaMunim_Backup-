"use client";

export const dynamic = 'force-dynamic';

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ShoppingBag, CheckCircle2, QrCode, Phone, MapPin, Sparkles, Loader2, Plus, Minus, ArrowRight, ShieldCheck, RefreshCw, Smartphone, Search, UtensilsCrossed, ChevronRight, X, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
  is_veg?: boolean;
}

interface CartItem {
  item: MenuItem;
  qty: number;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store") || searchParams.get("o") || "";
  const tableParam = searchParams.get("table") || searchParams.get("tbl") || "1";

  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer Details Form
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [tableNumber, setTableNumber] = useState(tableParam);

  // Order & Payment State
  const [step, setStep] = useState<"menu" | "checkout" | "success">("menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>("");

  useEffect(() => {
    if (tableParam) setTableNumber(tableParam);
  }, [tableParam]);

  // Fetch Store Profile & Menu from Supabase
  useEffect(() => {
    async function fetchStoreAndMenu() {
      if (!storeParam) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        let query = supabase.from("stores").select("*");
        if (storeParam.includes("-") && storeParam.length > 20) {
          query = query.eq("id", storeParam);
        } else {
          query = query.eq("owner_mobile", storeParam);
        }
        const { data: storeData, error: storeErr } = await query.single();

        if (storeErr || !storeData) {
          console.error("Store not found:", storeErr);
          setLoading(false);
          return;
        }

        setStoreInfo(storeData);

        // Fetch Menu Items
        const { data: menuData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("store_id", storeData.id)
          .order("name", { ascending: true });

        if (menuData) {
          setMenuItems(menuData);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreAndMenu();
  }, [storeParam]);

  // Clean item name (stripping quotes)
  const cleanName = (name: string) => {
    if (!name) return "";
    return name.replace(/^["']|["']$/g, '').trim();
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(c => c.item.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.item.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, c) => sum + (c.item.price * c.qty), 0);
  const totalItemsCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const rawCategories = Array.from(new Set(menuItems.map(m => cleanName(m.category || "Main Course"))));
  const categories = ["All", ...rawCategories.filter(Boolean)];

  const filteredMenu = menuItems.filter(m => {
    const nameMatch = cleanName(m.name).toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = selectedCategory === "All" || cleanName(m.category || "Main Course") === selectedCategory;
    return nameMatch && catMatch;
  });

  // Parse custom store config if stored in JSON_CFG format inside store_logo
  let customUpiId = "";
  let customUpiName = "";
  let displayLogo = "";

  if (storeInfo?.store_logo) {
    if (storeInfo.store_logo.startsWith("JSON_CFG:")) {
      try {
        const parsed = JSON.parse(storeInfo.store_logo.replace("JSON_CFG:", ""));
        customUpiId = parsed.upiId || "";
        customUpiName = parsed.upiName || "";
        displayLogo = parsed.logo || "";
      } catch (e) {
        console.warn("Could not parse JSON_CFG:", e);
      }
    } else {
      displayLogo = storeInfo.store_logo;
    }
  }

  // Store UPI details
  const upiId = customUpiId || storeInfo?.upi_id || `${storeInfo?.owner_mobile}@ptaxis`;
  const storeName = customUpiName || storeInfo?.store_name || "Restaurant";
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Table ${tableNumber} Order`)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`;

  // Handle Order Placement & Cloud Sync
  const handleConfirmOrder = async () => {
    if (!customerName.trim()) {
      alert("Kripya apna naam enter karein!");
      return;
    }
    if (!customerMobile.trim() || customerMobile.length < 10) {
      alert("Kripya valid 10-digit mobile number enter karein!");
      return;
    }
    if (cart.length === 0) {
      alert("Cart empty hai!");
      return;
    }

    try {
      setIsSubmitting(true);

      const itemBreakdown = cart
        .map(c => `${c.qty} x ${cleanName(c.item.name)} (₹${c.item.price * c.qty})`)
        .join("\n") + `\n[TABLE:${tableNumber}]`;

      const orderPayload = {
        store_id: storeInfo.id,
        customer_name: `${customerName.trim()} (T-${tableNumber})`,
        mobile: customerMobile.trim(),
        total_price: totalAmount,
        payment_type: "Table QR UPI",
        items: itemBreakdown
      };

      const { data, error } = await supabase.from("sales").insert([orderPayload]).select();

      if (error) {
        console.error("Order insertion error:", error);
        alert(`Order place karne me dikkat aayi: ${error.message || "Database error"}`);
        setIsSubmitting(false);
        return;
      }

      setPlacedOrderId(data?.[0]?.id || `ORD-${Date.now().toString().slice(-4)}`);
      setStep("success");
    } catch (e: any) {
      console.error("Order submission exception:", e);
      alert("Connection error! Internet check karein.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <UtensilsCrossed className="w-6 h-6 text-orange-500 absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black uppercase tracking-widest text-white">Loading Menu</p>
          <p className="text-xs text-zinc-400 font-medium">Getting fresh dining specials...</p>
        </div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
          <ShoppingBag className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight">Restaurant Not Found</h2>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          QR Code invalid ho sakta hai ya store active nahi hai. Counter par sampark karein.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 font-sans antialiased overflow-y-auto selection:bg-orange-500 selection:text-white">
      
      {/* 1. RESTAURANT HERO BANNER & HEADER */}
      <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-6 pt-5 px-4 sticky top-0 z-40 shadow-2xl border-b border-zinc-800/80">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Top Row: Brand & Table Tag */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative group shrink-0">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 shadow-lg shadow-orange-500/30">
                  <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center text-white font-black text-xl overflow-hidden">
                    {displayLogo && displayLogo.startsWith("http") ? (
                      <img src={displayLogo} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="bg-gradient-to-tr from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {storeInfo.store_name?.charAt(0)?.toUpperCase() || "R"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight leading-tight uppercase truncate text-white">
                    {storeInfo.store_name}
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[9px] font-black tracking-wider uppercase border border-amber-500/30">
                    5★ Dining
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
                  <span>{storeInfo.store_address || "Smart Table Dining Experience"}</span>
                </p>
              </div>
            </div>

            {/* Table Badge */}
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white font-black text-xs px-3.5 py-2 rounded-2xl uppercase shadow-lg shadow-orange-600/30 shrink-0 flex flex-col items-center justify-center border border-white/20 leading-none">
              <span className="text-[9px] text-orange-200 font-bold">TABLE</span>
              <span className="text-sm font-black mt-0.5">#{tableNumber}</span>
            </div>
          </div>

          {/* Search Bar & Veg-Only Filter Bar */}
          {step === "menu" && (
            <div className="space-y-2.5 pt-1">
              <div className="relative">
                <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dishes, beverages, combos..."
                  className="w-full h-11 pl-10 pr-9 bg-zinc-900/90 text-white placeholder-zinc-500 rounded-2xl text-xs font-bold border border-zinc-700/60 focus:outline-none focus:border-orange-500 focus:ring-2 ring-orange-500/20 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CATEGORY HORIZONTAL PILLS SCROLLER */}
      {step === "menu" && (
        <div className="sticky top-[148px] z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-3 px-4 shadow-sm">
          <div className="max-w-md mx-auto flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map(cat => {
              const count = cat === "All" ? menuItems.length : menuItems.filter(m => cleanName(m.category || "Main Course") === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl font-black text-xs whitespace-nowrap transition-all uppercase tracking-wider flex items-center gap-2 shrink-0 active:scale-95 ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/20 border border-zinc-800"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 border border-transparent"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MENU ITEMS LIST (SWIGGY / ZOMATO PRO LUXURY CARDS) */}
      {step === "menu" && (
        <main className="max-w-md mx-auto p-4 pb-36 space-y-3.5">
          {filteredMenu.map(item => {
            const inCart = cart.find(c => c.item.id === item.id);
            const itemName = cleanName(item.name);
            const isVeg = item.is_veg !== false;

            return (
              <div
                key={item.id}
                className="group bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-orange-200/80 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden"
              >
                {/* Left Subtle Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />

                {/* Left: Item Info */}
                <div className="flex-1 min-w-0 space-y-1 pl-1">
                  {/* Veg / Non-Veg Indicator & Category */}
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      isVeg ? "border-emerald-600" : "border-red-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isVeg ? "bg-emerald-600" : "bg-red-600"
                      }`} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 truncate">
                      {cleanName(item.category || "Specialty")}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      ★ 4.8
                    </span>
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-black text-sm text-zinc-900 leading-snug uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                    {itemName}
                  </h3>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-lg font-black text-zinc-950">₹{item.price}</span>
                    <span className="text-[10px] text-zinc-400 font-bold">per portion</span>
                  </div>
                </div>

                {/* Right: Modern Add / Qty Controller */}
                <div className="shrink-0">
                  {inCart ? (
                    <div className="flex items-center bg-zinc-950 text-white rounded-2xl shadow-xl shadow-zinc-950/20 border border-zinc-800 p-1">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center active:scale-90 text-white transition-all"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-black text-xs px-3 min-w-[28px] text-center font-mono">{inCart.qty}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 flex items-center justify-center active:scale-90 text-white transition-all shadow-md shadow-orange-600/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="h-11 px-6 bg-gradient-to-b from-white to-orange-50/50 hover:bg-orange-50 text-orange-600 border-2 border-orange-500/80 hover:border-orange-500 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 group-hover:bg-orange-600 group-hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" /> ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMenu.length === 0 && (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto text-orange-500">
                <Search className="h-7 w-7" />
              </div>
              <p className="text-sm font-black uppercase text-zinc-900">No dishes found</p>
              <p className="text-xs text-zinc-400 font-bold">Try searching for a different dish name or category.</p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="h-11 px-5 bg-zinc-950 text-white text-xs font-black uppercase rounded-2xl shadow-md"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      )}

      {/* 4. STEP 2: PREMIUM CHECKOUT & LUXURY UPI DESK */}
      {step === "checkout" && (
        <main className="max-w-md mx-auto p-4 pb-28 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header Back Link */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setStep("menu")}
              className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full uppercase tracking-wider transition-all active:scale-95"
            >
              ← Edit Menu
            </button>
            <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">
              Table #{tableNumber}
            </span>
          </div>

          {/* Luxury Bill Summary Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-6 shadow-2xl border border-zinc-800/80">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm">
                    🍽️
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide">Dining Bill Summary</h3>
                    <p className="text-[10px] text-zinc-400 font-semibold">{totalItemsCount} items selected</p>
                  </div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase px-2.5 py-0.5">
                  Live KOT
                </Badge>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 divide-y divide-zinc-800/40">
                {cart.map(c => (
                  <div key={c.item.id} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-zinc-800 text-orange-400 font-black text-[11px] flex items-center justify-center border border-zinc-700">
                        {c.qty}
                      </span>
                      <span className="font-bold text-zinc-200 uppercase tracking-tight">{cleanName(c.item.name)}</span>
                    </div>
                    <span className="font-black text-zinc-100">₹{c.item.price * c.qty}</span>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Grand Total</span>
                <div className="text-right">
                  <span className="text-3xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    ₹{totalAmount}
                  </span>
                  <p className="text-[9px] text-zinc-500 font-bold">Inclusive of all taxes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-zinc-200/90 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Diner Details (For E-Bill & KOT)
              </p>
            </div>
            
            <div className="space-y-2.5">
              <div className="relative">
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Your Full Name (e.g. Rahul Sharma)"
                  className="h-12 rounded-2xl bg-zinc-50/80 border border-zinc-200 font-bold text-xs pl-4 focus:bg-white focus:ring-2 ring-orange-500/20 transition-all shadow-inner"
                />
              </div>
              <div className="relative">
                <Input
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  type="tel"
                  placeholder="10-Digit Mobile (For digital receipt)"
                  className="h-12 rounded-2xl bg-zinc-50/80 border border-zinc-200 font-bold text-xs pl-4 focus:bg-white focus:ring-2 ring-orange-500/20 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Luxury Payment Desk */}
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-5 space-y-4 shadow-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Instant UPI Pay</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">Auto-verification on POS</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
                Zero Fees
              </Badge>
            </div>

            {/* Direct 1-Tap App Triggers */}
            <div className="space-y-2">
              <a
                href={upiPayUrl}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 transition-all text-center border border-white/20"
              >
                <Smartphone className="h-5 w-5" /> Pay ₹{totalAmount} (All UPI Apps)
              </a>

              {/* 3 Iconic App Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a
                  href={`paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Table ${tableNumber} Order`)}`}
                  className="py-3 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-sky-500/30 hover:border-sky-400/60 rounded-2xl text-center text-xs font-black uppercase text-sky-400 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-[13px]">🔵</span>
                  <span className="text-[10px] tracking-wider">Paytm</span>
                </a>
                <a
                  href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Table ${tableNumber} Order`)}`}
                  className="py-3 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl text-center text-xs font-black uppercase text-emerald-400 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-[13px]">🟢</span>
                  <span className="text-[10px] tracking-wider">GPay</span>
                </a>
                <a
                  href={`phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Table ${tableNumber} Order`)}`}
                  className="py-3 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl text-center text-xs font-black uppercase text-purple-400 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-[13px]">🟣</span>
                  <span className="text-[10px] tracking-wider">PhonePe</span>
                </a>
              </div>
            </div>

            {/* Clickable Luxury QR Card */}
            <a
              href={upiPayUrl}
              className="block bg-gradient-to-b from-white to-zinc-50 p-5 rounded-3xl text-center hover:bg-zinc-100 active:scale-[0.98] transition-all cursor-pointer shadow-xl border-2 border-white/40 group relative overflow-hidden"
              title="Tap QR to pay directly"
            >
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                Instant Tap
              </div>
              <div className="p-2 bg-white rounded-2xl inline-block shadow-md border border-zinc-200 group-hover:scale-105 transition-transform duration-300">
                <img src={qrImageUrl} alt="UPI QR" className="w-48 h-48 object-contain rounded-xl mx-auto" />
              </div>
              <div className="mt-3 space-y-0.5">
                <p className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">
                  Tap QR or Scan from Any Phone
                </p>
                <p className="text-[10px] text-zinc-500 font-mono font-bold">
                  {storeName} • {upiId}
                </p>
              </div>
            </a>

            {/* Confirm and Place Order Button */}
            <Button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full h-15 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-600/40 active:scale-95 transition-all flex items-center justify-center gap-2 border-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Transmitting Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Paid / Place Order 🚀
                </>
              )}
            </Button>
          </div>
        </main>
      )}

      {/* 5. STEP 3: ORDER SUCCESS */}
      {step === "success" && (
        <main className="max-w-md mx-auto p-6 text-center space-y-6 animate-in zoom-in-95 pt-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
              <CheckCircle2 className="h-14 w-14" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-zinc-800">
              TBL #{tableNumber}
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Order Received! 🍽️</h2>
            <p className="text-xs font-bold text-zinc-500 leading-relaxed max-w-xs mx-auto">
              The kitchen team has received your order for <strong>Table #{tableNumber}</strong>. Hot food is being prepared!
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-zinc-200/90 p-5 space-y-3 text-left text-xs shadow-sm">
            <div className="flex justify-between font-black text-zinc-400 uppercase tracking-widest text-[9px] pb-2 border-b border-zinc-100">
              <span>Order Reference</span>
              <span className="font-mono text-zinc-900 font-black">#{placedOrderId.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between font-black text-zinc-900 text-sm">
              <span>Amount Paid</span>
              <span className="text-emerald-600 font-black text-base">₹{totalAmount}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setCart([]);
              setStep("menu");
            }}
            className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            Order More Dishes
          </Button>
        </main>
      )}

      {/* 6. FLOATING BOTTOM CART BAR (SWIGGY / ZOMATO STYLE) */}
      {step === "menu" && totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-4">
          <Button
            onClick={() => setStep("checkout")}
            className="w-full h-16 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-3xl font-black text-sm shadow-2xl shadow-orange-600/40 flex items-center justify-between px-6 active:scale-95 transition-all border-0 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center font-black text-sm shadow-inner">
                {totalItemsCount}
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] text-orange-100 font-bold uppercase tracking-wider">Table #{tableNumber}</p>
                <p className="text-base font-black">₹{totalAmount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 uppercase tracking-wider text-xs font-black">
              <span>View Cart & Pay</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading Dining Experience...</p>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
