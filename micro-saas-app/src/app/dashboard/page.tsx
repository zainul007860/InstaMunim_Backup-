"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format, isBefore, isAfter } from "date-fns";
import jsQR from "jsqr";
import {
  LayoutDashboard, FileText, Settings, LogOut, Search,
  PlusCircle, Loader2, Book, Trash2, Send, ShoppingCart, Package,
  TrendingUp, Users, Smartphone, PieChart, ArrowUpRight, CheckCircle2, Mic, MessageCircle, ArrowRight, Sun, Moon, Cloud, RefreshCw, Lock, ShieldCheck, ShieldAlert, Eye, EyeOff, LayoutPanelLeft, Clock, History, CreditCard, ChevronRight, Download, Upload, Filter, Share2, Printer, X, ChevronDown, Plus, Minus, Check, Camera, Volume2, Globe, Wand2, Copy, Keyboard, Megaphone, MessageSquare, AlertTriangle, ExternalLink, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { trackEvent } from "@/lib/firebase";
import { EnquiriesView } from "./EnquiriesView";
import { sendDiscordAlert } from "@/lib/discord";
import InventoryDiary, { INVENTORY_CATEGORY_CONFIGS, getItemStockMeta, buildCategoryString } from "./InventoryDiary";

const getDisplayCategory = (cat: string) => {
  if (!cat) return "General";
  let clean = cat;
  if (clean.includes("|Barcode:")) {
    clean = clean.split("|Barcode:")[0];
  }
  if (clean.includes("|IMEIs:")) {
    clean = clean.split("|IMEIs:")[0];
  }
  if (clean.startsWith("Barcode:")) return "General";
  return clean || "General";
};

const getImeis = (cat: string): string[] => {
  if (!cat) return [];
  if (cat.includes("|IMEIs:")) {
    const rawStr = cat.split("|IMEIs:")[1];
    return rawStr.split(",").filter(Boolean).map(item => {
      let clean = item;
      if (clean.includes("{")) {
        clean = clean.split("{")[0];
      }
      if (clean.startsWith("IMEI:")) {
        clean = clean.replace("IMEI:", "");
      }
      return clean.trim();
    }).filter(Boolean);
  }
  return [];
};

const parseUnitDetailsFromCategory = (catStr: string) => {
  if (!catStr || !catStr.includes("|IMEIs:")) return [];
  const rawStr = catStr.split("|IMEIs:")[1];
  if (!rawStr) return [];

  return rawStr.split(",").filter(Boolean).map(item => {
    let imei = item.trim();
    let color = "";
    let purchaseRate = "";
    let hsnCode = "8517";
    let supplierName = "";

    if (imei.includes("{") && imei.includes("}")) {
      const match = imei.match(/^(.*?)\{(.*?)\}$/);
      if (match) {
        imei = match[1].replace("IMEI:", "").trim();
        const metaStr = match[2];
        metaStr.split(";").forEach(pair => {
          const [k, v] = pair.split(":");
          if (k === "Color") color = v || "";
          if (k === "Cost") purchaseRate = v || "";
          if (k === "HSN") hsnCode = v || "8517";
          if (k === "Supplier") supplierName = v || "";
        });
      }
    } else {
      if (imei.startsWith("IMEI:")) imei = imei.replace("IMEI:", "");
    }

    return { imei, color, purchaseRate, hsnCode, supplierName };
  }).filter(u => u.imei);
};

interface BarcodeScannerResult {
  barcode: string;
  format?: string;
  cancelled?: boolean;
}

const ImeiInput = ({
  value,
  onChange,
  placeholder,
  className,
  onScan,
  onCancel
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  onScan?: (scanned: BarcodeScannerResult) => void;
  onCancel?: () => void;
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleNativeScan = async () => {
    setScanError(null);
    try {
      if (!Capacitor.isNativePlatform()) {
        alert("Native Barcode Scanner is only available inside the Android App WebView.");
        return;
      }

      // Check and request camera permissions natively
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
        const req = await BarcodeScanner.requestPermissions();
        if (req.camera !== 'granted') {
          setScanError("Camera permission denied.");
          return;
        }
      }

      // Check if Google Barcode Scanner module is available on Android
      if (Capacitor.getPlatform() === 'android') {
        try {
          const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          if (!available) {
            await BarcodeScanner.installGoogleBarcodeScannerModule();
          }
        } catch (moduleErr) {
          console.warn("Google Barcode Module error:", moduleErr);
        }
      }

      // Start full-screen native scan overlay (Google ML Kit)
      const { barcodes } = await BarcodeScanner.scan({
        formats: ['codabar', 'code_39', 'code_93', 'code_128', 'ean_8', 'ean_13', 'itf', 'pdf417', 'upc_a', 'upc_e']
      });

      if (barcodes && barcodes.length > 0) {
        // Find if any barcode contains a 14-16 digit sequence, and clean it
        let scannedValue = "";
        const imeiBarcode = barcodes.find(b => /\d{14,16}/.test(b.rawValue));
        if (imeiBarcode) {
          const match = imeiBarcode.rawValue.match(/\d{14,16}/);
          scannedValue = match ? match[0] : imeiBarcode.rawValue.trim();
        } else {
          // If no IMEI pattern is found, clean it if it contains 14-16 digits anyway, else fallback to raw
          const rawVal = barcodes[0].rawValue.trim();
          const match = rawVal.match(/\d{14,16}/);
          scannedValue = match ? match[0] : rawVal;
        }
        onChange(scannedValue);
        setLocalVal(scannedValue);
        onScan?.({ barcode: scannedValue });
      }
    } catch (err: any) {
      console.error("ML Kit Scan Error:", err);
      setScanError(err.message || "Failed to scan barcode.");
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Input
          placeholder={placeholder}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={() => onChange(localVal)}
          className={`${className} pr-12`}
        />

        <button
          type="button"
          onClick={handleNativeScan}
          className="absolute right-2 h-8 w-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200 transition-all active:scale-95 z-10"
          title="Scan barcode natively"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {scanError && (
        <div className="absolute top-full mt-2 left-0 right-0 flex justify-center z-30">
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md border border-red-200 dark:border-red-900/50">
            <button
              type="button"
              onClick={() => setScanError(null)}
              className="hover:opacity-85 active:scale-90 flex items-center justify-center p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-900/40 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span>{scanError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PARTNER_NAMES: Record<string, { swiggy: string; zomato: string; swiggyIcon: string; zomatoIcon: string; swiggyColor: string; zomatoColor: string }> = {
  "Restaurant/Cafe": {
    swiggy: "Swiggy",
    zomato: "Zomato",
    swiggyIcon: "S",
    zomatoIcon: "Z",
    swiggyColor: "bg-orange-500 text-white",
    zomatoColor: "bg-red-600 text-white"
  },
  "Kirana/Grocery": {
    swiggy: "Blinkit",
    zomato: "Zepto",
    swiggyIcon: "B",
    zomatoIcon: "Z",
    swiggyColor: "bg-yellow-500 text-black",
    zomatoColor: "bg-purple-600 text-white"
  },
  "Saloon/Spa": {
    swiggy: "Urban Company",
    zomato: "Justdial",
    swiggyIcon: "U",
    zomatoIcon: "J",
    swiggyColor: "bg-zinc-900 text-white",
    zomatoColor: "bg-blue-500 text-white"
  },
  "Clothing/Retail": {
    swiggy: "Amazon",
    zomato: "Myntra",
    swiggyIcon: "A",
    zomatoIcon: "M",
    swiggyColor: "bg-amber-500 text-white",
    zomatoColor: "bg-pink-500 text-white"
  },
  "Laundry": {
    swiggy: "Urban Company",
    zomato: "Local Delivery",
    swiggyIcon: "U",
    zomatoIcon: "L",
    swiggyColor: "bg-zinc-900 text-white",
    zomatoColor: "bg-teal-500 text-white"
  },
  "Electric": {
    swiggy: "IndiaMART",
    zomato: "Justdial",
    swiggyIcon: "I",
    zomatoIcon: "J",
    swiggyColor: "bg-teal-600 text-white",
    zomatoColor: "bg-blue-500 text-white"
  },
  "Automobile": {
    swiggy: "IndiaMART",
    zomato: "Local Mechanic",
    swiggyIcon: "I",
    zomatoIcon: "M",
    swiggyColor: "bg-teal-600 text-white",
    zomatoColor: "bg-red-500 text-white"
  },
  "Gym": {
    swiggy: "Cult.fit",
    zomato: "Fitpass",
    swiggyIcon: "C",
    zomatoIcon: "F",
    swiggyColor: "bg-zinc-900 text-white",
    zomatoColor: "bg-blue-600 text-white"
  },
  "Cosmetic": {
    swiggy: "Nykaa",
    zomato: "Purplle",
    swiggyIcon: "N",
    zomatoIcon: "P",
    swiggyColor: "bg-pink-600 text-white",
    zomatoColor: "bg-purple-500 text-white"
  },
  "Stationary": {
    swiggy: "Amazon",
    zomato: "Jiomart",
    swiggyIcon: "A",
    zomatoIcon: "J",
    swiggyColor: "bg-amber-500 text-white",
    zomatoColor: "bg-blue-600 text-white"
  },
  "Mobile/Electronics": {
    swiggy: "Amazon",
    zomato: "Flipkart",
    swiggyIcon: "A",
    zomatoIcon: "F",
    swiggyColor: "bg-amber-500 text-black",
    zomatoColor: "bg-blue-600 text-white"
  }
};

export const getPartnerConfig = (businessType: string) => {
  return PARTNER_NAMES[businessType] || PARTNER_NAMES["Restaurant/Cafe"];
};

export const getPartnerName = (businessType: string, type: string) => {
  const cfg = getPartnerConfig(businessType);
  if (type === "Swiggy") return cfg.swiggy;
  if (type === "Zomato") return cfg.zomato;
  return type;
};

export const BUSINESS_CATEGORIES: Record<string, {
  name: string;
  item: string;
  items: string;
  location: string;
  presets: { name: string; price: number }[];
  templates: { label: string; msg: string }[];
  categories: string[];
}> = {
  "Restaurant/Cafe": {
    name: "Restaurant / Cafe / Food Stall",
    item: "Dish",
    items: "Menu Items",
    location: "Table No",
    presets: [
      { name: "Paneer Tikka", price: 180 },
      { name: "Cold Coffee", price: 70 },
      { name: "Veg Burger", price: 120 },
      { name: "Masala Chai", price: 20 }
    ],
    templates: [
      { label: "20% OFF", msgEn: "Hi [NAME], we miss you at [SHOP]! 🍕 Get 20% OFF on your next order today! Use code: MISSYOU20", msgHi: "नमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 🍕 आज ही ऑर्डर पर 20% की छूट पाएं! कोड: MISSYOU20", msg: "Hi [NAME], we miss you at [SHOP]! 🍕 Get 20% OFF on your next order today! Use code: MISSYOU20\n\nनमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 🍕 आज ही ऑर्डर पर 20% की छूट पाएं! कोड: MISSYOU20" },
      { label: "BOGO Offer", msgEn: "Weekend Special at [SHOP]! 🍔 Buy 1 Get 1 FREE on all large orders! Valid only for today.", msgHi: "वीकेंड स्पेशल [SHOP] पर! 🍔 1 खरीदें और 1 मुफ़्त पाएं! ऑफर सिर्फ आज के लिए मान्य है।", msg: "Weekend Special at [SHOP]! 🍔 Buy 1 Get 1 FREE on all large orders! Valid only for today.\n\nवीकेंड स्पेशल [SHOP] पर! 🍔 1 खरीदें और 1 मुफ़्त पाएं! ऑफर सिर्फ आज के लिए मान्य है।" },
      { label: "New Menu", msgEn: "Hi [NAME], check out our NEW items at [SHOP]! 😋 Try our delicious dishes & fresh beverages today!", msgHi: "नमस्ते [NAME], [SHOP] में नए स्वादिष्‍ट डिश और ड्रिंक्स आ चुके हैं! 😋 आज ही आकर ट्राई करें!", msg: "Hi [NAME], check out our NEW items at [SHOP]! 😋 Try our delicious dishes & fresh beverages today!\n\nनमस्ते [NAME], [SHOP] में नए स्वादिष्‍ट डिश और ड्रिंक्स आ चुके हैं! 😋 आज ही आकर ट्राई करें!" },
      { label: "Free Delivery", msgEn: "Hungry [NAME]? 🚚 Free Delivery for you from [SHOP] for the next 2 hours! Order now.", msgHi: "भूख लगी है [NAME]? 🚚 [SHOP] से अगले 2 घंटे में पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।", msg: "Hungry [NAME]? 🚚 Free Delivery for you from [SHOP] for the next 2 hours! Order now.\n\nभूख लगी है [NAME]? 🚚 [SHOP] से अगले 2 घंटे में पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।" },
      { label: "Weekend", msgEn: "Happy Weekend [NAME]! 🎉 Relax and enjoy a delicious meal from [SHOP]. Special treats waiting!", msgHi: "हैप्पी वीकेंड [NAME]! 🎉 आज [SHOP] से अपने पसंदीदा खाने का आनंद लें। खास ट्रीट आपका इंतज़ार कर रही है!", msg: "Happy Weekend [NAME]! 🎉 Relax and enjoy a delicious meal from [SHOP]. Special treats waiting!\n\nहैप्पी वीकेंड [NAME]! 🎉 आज [SHOP] से अपने पसंदीदा खाने का आनंद लें। खास ट्रीट आपका इंतज़ार कर रही है!" }
    ],
    categories: ["Main Course", "Starters", "Chinese", "Beverages", "Snacks", "Breads", "Desserts/Sweets", "Others"]
  },
  "Kirana/Grocery": {
    name: "Kirana / Grocery / General Store",
    item: "Product",
    items: "Products & Stock",
    location: "Rack / Section",
    presets: [
      { name: "Mustard Oil 1L", price: 180 },
      { name: "Basmati Rice 1kg", price: 110 },
      { name: "Tata Salt 1kg", price: 28 },
      { name: "Maggi 2-Min Noodles", price: 14 }
    ],
    templates: [
      { label: "20% OFF", msgEn: "Hi [NAME], we miss you at [SHOP]! 🛒 Get 20% OFF on your grocery billing today! Use code: KIRANA20", msgHi: "नमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 🛒 आज ही राशन बिलिंग पर 20% की छूट पाएं! कोड: KIRANA20", msg: "Hi [NAME], we miss you at [SHOP]! 🛒 Get 20% OFF on your grocery billing today! Use code: KIRANA20\n\nनमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 🛒 आज ही राशन बिलिंग पर 20% की छूट पाएं! कोड: KIRANA20" },
      { label: "Special Deal", msgEn: "Special Deal at [SHOP]! 🌾 Basmati Rice & Mustard Oil at discount prices! Valid till stocks last.", msgHi: "स्पेशल ऑफर [SHOP] पर! 🌾 बासमती चावल और सरसों तेल पर भारी छूट! स्टॉक रहने तक मान्य।", msg: "Special Deal at [SHOP]! 🌾 Basmati Rice & Mustard Oil at discount prices! Valid till stocks last.\n\nस्पेशल ऑफर [SHOP] पर! 🌾 बासमती चावल और सरसों तेल पर भारी छूट! स्टॉक रहने तक मान्य।" },
      { label: "New Stock", msgEn: "Hi [NAME], new fresh stock has arrived at [SHOP]! 🍎 Visit us today for all your daily needs!", msgHi: "नमस्ते [NAME], [SHOP] में नया ताज़ा राशन का सामान आ चुका है! 🍎 दैनिक ज़रूरतों के लिए आज ही आएं!", msg: "Hi [NAME], new fresh stock has arrived at [SHOP]! 🍎 Visit us today for all your daily needs!\n\nनमस्ते [NAME], [SHOP] में नया ताज़ा राशन का सामान आ चुका है! 🍎 दैनिक ज़रूरतों के लिए आज ही आएं!" },
      { label: "Free Delivery", msgEn: "Need groceries [NAME]? 🚚 Free Home Delivery from [SHOP] for orders above ₹500! Order now.", msgHi: "राशन चाहिए [NAME]? 🚚 ₹500 से ऊपर के ऑर्डर पर [SHOP] से पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।", msg: "Need groceries [NAME]? 🚚 Free Home Delivery from [SHOP] for orders above ₹500! Order now.\n\nराशन चाहिए [NAME]? 🚚 ₹500 से ऊपर के ऑर्डर पर [SHOP] से पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।" },
      { label: "Weekly Deal", msgEn: "Happy Weekend [NAME]! 🛍️ Restock your pantry from [SHOP] with flat discounts on monthly essentials!", msgHi: "हैप्पी वीकेंड [NAME]! 🛍️ [SHOP] से महीने का राशन खरीदें और पाएं विशेष छूट!", msg: "Happy Weekend [NAME]! 🛍️ Restock your pantry from [SHOP] with flat discounts on monthly essentials!\n\nहैप्पी वीकेंड [NAME]! 🛍️ [SHOP] से महीने का राशन खरीदें और पाएं विशेष छूट!" }
    ],
    categories: ["Daily Essentials", "Staples & Grains", "Snacks & Drinks", "Personal Care", "Household", "Packaged Foods", "Others"]
  },
  "Saloon/Spa": {
    name: "Saloon / Spa / Beauty Parlour",
    item: "Service",
    items: "Services & Packages",
    location: "Chair / Stylist",
    presets: [
      { name: "Haircut", price: 150 },
      { name: "Beard Trim", price: 80 },
      { name: "Facial Massage", price: 350 },
      { name: "Hair Color", price: 600 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 💇‍♂️ Get 20% OFF on any grooming service today! Use code: SHINE20" },
      { label: "Combo Offer", msg: "Weekend Special at [SHOP]! 💆‍♂️ Haircut + Facial Massage combo at flat 30% OFF! Book today." },
      { label: "New Services", msg: "Hi [NAME], check out our new styling & spa packages at [SHOP]! ✨ Pamper yourself this week!" },
      { label: "Priority Slot", msg: "Hi [NAME]! 📅 Book your premium styling slot at [SHOP] today and skip the weekend rush!" },
      { label: "Self Care", msg: "Happy Weekend [NAME]! 💅 Treat yourself to a relaxing service at [SHOP]. You deserve this premium care!" }
    ],
    categories: ["Hair Services", "Facial & Skin", "Shaving & Beard", "Massage & Spa", "Bridal & Makeup", "Packages", "Others"]
  },
  "Clothing/Retail": {
    name: "Clothing / Footwear / Retail Shop",
    item: "Apparel / Item",
    items: "Apparel & Inventory",
    location: "Aisle / Section",
    presets: [
      { name: "Cotton T-Shirt", price: 499 },
      { name: "Blue Jeans", price: 999 },
      { name: "Casual Shoes", price: 1200 },
      { name: "Leather Belt", price: 350 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 👕 Get 20% OFF on our new summer clothing collection today! Use code: STYLE20" },
      { label: "Special Deal", msg: "Special Deal at [SHOP]! 👖 Buy any Jeans and get a Cotton T-shirt at 50% OFF! Limited time." },
      { label: "New Arrival", msg: "Hi [NAME], fresh fashion arrivals have landed at [SHOP]! 👟 Step up your style with our latest collection!" },
      { label: "Free Delivery", msg: "Shopping from home [NAME]? 🚚 Free Shipping from [SHOP] for orders above ₹999! Shop online now." },
      { label: "Weekend Sale", msg: "Happy Weekend [NAME]! 🛍️ Flat 15% OFF storewide at [SHOP] this Saturday and Sunday! Upgrade your wardrobe!" }
    ],
    categories: ["Menswear", "Womenswear", "Kidswear", "Footwear", "Accessories", "Winterwear", "Others"]
  },
  "Laundry": {
    name: "Laundry Business",
    item: "Wash Service",
    items: "Dry Clean & Laundry",
    location: "Hanger / Rack No",
    presets: [
      { name: "Shirt Dry Clean", price: 60 },
      { name: "Suit Dry Clean", price: 250 },
      { name: "Normal Wash & Iron", price: 15 },
      { name: "Only Ironing", price: 7 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 🧺 Get 20% OFF on your next dry cleaning & laundry bill! Use code: CLEAN20" },
      { label: "Special Deal", msg: "Special Deal at [SHOP]! 👔 Suit Dry Clean + 2 Shirts Dry Clean combo at just ₹300! Valid this week." },
      { label: "Express Wash", msg: "Hi [NAME], need clothes fast? ⚡ Get Express 24-Hour Delivery on laundry from [SHOP] at no extra cost!" },
      { label: "Pick & Drop", msg: "Too busy [NAME]? 🚚 Free Pick-up & Drop-off service from [SHOP]! Just reply to schedule." },
      { label: "Fresh Clothes", msg: "Happy Weekend [NAME]! 🧼 Let us handle the laundry this weekend while you relax. Book now at [SHOP]!" }
    ],
    categories: ["Washing", "Dry Cleaning", "Ironing & Press", "Premium Care", "Shoes & Bags", "Others"]
  },
  "Electric": {
    name: "Electric Shop",
    item: "Component",
    items: "Electrical Inventory",
    location: "Shelf / Bin No",
    presets: [
      { name: "LED Bulb 9W", price: 90 },
      { name: "Extension Board", price: 250 },
      { name: "Copper Wire 1m", price: 40 },
      { name: "Modular Switch", price: 35 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 🔌 Get 20% OFF on LED bulbs and modular switches today! Use code: LIGHT20" },
      { label: "Special Deal", msg: "Special Deal at [SHOP]! 💡 Extension Boards and premium Copper Wires at discount prices!" },
      { label: "New Spares", msg: "Hi [NAME], we've restocked high-quality electrical spares and fittings at [SHOP]! Visit us for safety-certified gear." },
      { label: "Home Delivery", msg: "Need parts urgently [NAME]? 🚚 Get electrical items delivered to your doorstep from [SHOP] in 1 hour!" },
      { label: "Power Up", msg: "Happy Weekend [NAME]! 🛠️ Time for home repairs? Get special rates on switches and boards from [SHOP]!" }
    ],
    categories: ["Cables & Wires", "LED & Lighting", "Switches & Sockets", "Appliances", "Spares", "Tools", "Others"]
  },
  "Automobile": {
    name: "Automobile Parts Shop",
    item: "Part / Item",
    items: "Spares & Inventory",
    location: "Bin / Rack No",
    presets: [
      { name: "Engine Oil 1L", price: 380 },
      { name: "Spark Plug", price: 120 },
      { name: "Brake Pad Set", price: 450 },
      { name: "Wiper Blade", price: 200 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 🚗 Get 20% OFF on high-quality engine oils and wiper blades today! Use code: DRIVE20" },
      { label: "Special Deal", msg: "Special Deal at [SHOP]! ⚙️ Brake Pad Set + Spark Plug replacement parts at flat 15% OFF!" },
      { label: "New Stock", msg: "Hi [NAME], genuine automobile spares and lubricants have been restocked at [SHOP]! Keep your vehicle smooth!" },
      { label: "Free Delivery", msg: "Mechanic/DIY help [NAME]? 🚚 Free delivery of auto parts from [SHOP] for all local garages & customers!" },
      { label: "Maintenance", msg: "Happy Weekend [NAME]! 🔧 Time to service your car/bike? Get premium oils and wipers from [SHOP] today!" }
    ],
    categories: ["Engine & Lubricants", "Spares & Parts", "Electricals", "Accessories", "Cleaning & Care", "Others"]
  },
  "Gym": {
    name: "GYM / Fitness Center",
    item: "Plan / Item",
    items: "Memberships & Items",
    location: "Trainer / Locker",
    presets: [
      { name: "Monthly Gym Fee", price: 1000 },
      { name: "Quarterly Gym Fee", price: 2700 },
      { name: "Personal Training", price: 2500 },
      { name: "Whey Protein Shake", price: 120 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 🏋️‍♂️ Renew your gym membership today and get 20% OFF! Use code: FIT20" },
      { label: "Combo Offer", msg: "Special Deal at [SHOP]! 💪 Join for 3 months and get 1 month of personal training absolutely FREE!" },
      { label: "New Gear", msg: "Hi [NAME], we've added premium fitness equipment & imported supplements at [SHOP]! Check it out!" },
      { label: "Free Trial", msg: "Ready to sweat [NAME]? 🎟️ Get a Free 3-Day Guest Pass to [SHOP] for your friend/family! Bring them along." },
      { label: "Fitness Goal", msg: "Happy Weekend [NAME]! 🔥 Don't skip your workout! Stop by [SHOP] and fuel up with our protein shakes!" }
    ],
    categories: ["Memberships", "Personal Training", "Supplements & Shakes", "Merchandise", "Day Pass", "Others"]
  },
  "Cosmetic": {
    name: "Cosmetic Shop",
    item: "Cosmetic / Item",
    items: "Cosmetics & Brands",
    location: "Counter / Shelf",
    presets: [
      { name: "Matte Lipstick", price: 299 },
      { name: "Eyeliner", price: 180 },
      { name: "Face Moisturizer", price: 250 },
      { name: "Nail Polish", price: 80 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 💄 Get 20% OFF on premium matte lipsticks and eyeliners today! Use code: BEAUTY20" },
      { label: "Combo Offer", msg: "Special Deal at [SHOP]! 💅 Buy 2 Nail Polishes and get 1 moisturizer at flat 50% OFF!" },
      { label: "New Brands", msg: "Hi [NAME], new luxury cosmetics and skin-care brands have arrived at [SHOP]! Explore the glow!" },
      { label: "Free Gift", msg: "Treat yourself [NAME]! 🎁 Get a free beauty sample pouch from [SHOP] on all purchases above ₹499!" },
      { label: "Glow Up", msg: "Happy Weekend [NAME]! ✨ Get ready for the weekend party with makeup and beauty essentials from [SHOP]!" }
    ],
    categories: ["Makeup", "Skincare", "Haircare", "Fragrances", "Grooming Accessories", "Brands", "Others"]
  },
  "Stationary": {
    name: "Stationary & Book Shop",
    item: "Stationery / Book",
    items: "Books & Stationery",
    location: "Rack / Row No",
    presets: [
      { name: "Classmate Notebook", price: 60 },
      { name: "Reynolds Gel Pen", price: 10 },
      { name: "Geometry Box", price: 120 },
      { name: "A4 Paper Ream", price: 320 }
    ],
    templates: [
      { label: "20% OFF", msg: "Hi [NAME], we miss you at [SHOP]! 📚 Get 20% OFF on premium notebooks and stationery sets today! Use code: STUDY20" },
      { label: "Special Deal", msg: "Special Deal at [SHOP]! 🖊️ Geometry Box + 3 Reynolds Gel Pens combo at flat 25% OFF!" },
      { label: "New Arrivals", msg: "Hi [NAME], fresh stocks of school & office stationery have arrived at [SHOP]! Best quality notebooks!" },
      { label: "Free Delivery", msg: "Studying/Working [NAME]? 🚚 Free delivery of books & school supplies from [SHOP] for orders above ₹300!" },
      { label: "Creative", msg: "Happy Weekend [NAME]! 🎨 Unleash your creativity with colors, sketchbooks, and art supplies from [SHOP]!" }
    ],
    categories: ["Notebooks & Paper", "Pens & Writing", "Office Supplies", "Art & Craft", "Books", "Others"]
  },
  "Mobile/Electronics": {
    name: "Mobile & Electronics Shop",
    item: "Product",
    items: "Mobiles & Electronics",
    location: "Rack / Showcase",
    presets: [
      { name: "Vivo V69 (Black, 128GB)", price: 13990 },
      { name: "iPhone 15 (Blue, 128GB)", price: 79900 },
      { name: "Boat Airdopes 131", price: 1299 },
      { name: "Type-C Fast Charger", price: 499 }
    ],
    templates: [
      { label: "20% OFF", msgEn: "Hi [NAME], we miss you at [SHOP]! 📱 Get 20% OFF on high-quality phone accessories today! Use code: GEAR20", msgHi: "नमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 📱 मोबाइल एसेसरीज पर पाएं 20% की छूट! कोड: GEAR20", msg: "Hi [NAME], we miss you at [SHOP]! 📱 Get 20% OFF on high-quality phone accessories today! Use code: GEAR20\n\nनमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 📱 मोबाइल एसेसरीज पर पाएं 20% की छूट! कोड: GEAR20" },
      { label: "Special Deal", msgEn: "Special Deal at [SHOP]! 🎧 Buy any smartphone and get Bluetooth Airdopes at flat 30% OFF!", msgHi: "स्पेशल ऑफर [SHOP] पर! 🎧 कोई भी स्मार्टफोन खरीदें और बड्स/एयरडॉप्स पाएं 30% की छूट पर!", msg: "Special Deal at [SHOP]! 🎧 Buy any smartphone and get Bluetooth Airdopes at flat 30% OFF!\n\nस्पेशल ऑफर [SHOP] पर! 🎧 कोई भी स्मार्टफोन खरीदें और बड्स/एयरडॉप्स पाएं 30% की छूट पर!" },
      { label: "New Arrival", msgEn: "Hi [NAME], latest smartphones and smartwatches have arrived at [SHOP]! Upgrade your tech today!", msgHi: "नमस्ते [NAME], [SHOP] में नए स्मार्टफोन्स और स्मार्टवॉच आ चुके हैं! आज ही अपना फोन अपग्रेड करें!", msg: "Hi [NAME], latest smartphones and smartwatches have arrived at [SHOP]! Upgrade your tech today!\n\nनमस्ते [NAME], [SHOP] में नए स्मार्टफोन्स और स्मार्टवॉच आ चुके हैं! आज ही अपना फोन अपग्रेड करें!" },
      { label: "Free Delivery", msgEn: "Need accessories [NAME]? 🚚 Free delivery of chargers & headphones from [SHOP]! Order now.", msgHi: "चार्ज / इयरफोन चाहिए [NAME]? 🚚 [SHOP] से पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।", msg: "Need accessories [NAME]? 🚚 Free delivery of chargers & headphones from [SHOP]! Order now.\n\nचार्ज / इयरफोन चाहिए [NAME]? 🚚 [SHOP] से पाएं मुफ़्त होम डिलीवरी! अभी ऑर्डर करें।" },
      { label: "Tech Weekend", msgEn: "Happy Weekend [NAME]! ⚡ Time for a tech upgrade? Get special exchange rates on old phones from [SHOP] today!", msgHi: "हैप्पी वीकेंड [NAME]! ⚡ पुराने फोन पर पाएं बेस्ट एक्सचेंज ऑफर केवल [SHOP] पर!", msg: "Happy Weekend [NAME]! ⚡ Time for a tech upgrade? Get special exchange rates on old phones from [SHOP] today!\n\nहैप्पी वीकेंड [NAME]! ⚡ पुराने फोन पर पाएं बेस्ट एक्सचेंज ऑफर केवल [SHOP] पर!" }
    ],
    categories: ["Smartphones", "Smartwatches", "Accessories", "Chargers & Cables", "Laptops", "Others"]
  }
};

const getLabels = (type: string) => {
  return BUSINESS_CATEGORIES[type] || BUSINESS_CATEGORIES["Restaurant/Cafe"];
};

const getTemplates = (type: string, shopName: string, lang: 'both' | 'en' | 'hi' = 'both') => {
  const cat = BUSINESS_CATEGORIES[type] || BUSINESS_CATEGORIES["Restaurant/Cafe"];
  const list = cat.templates;
  return list.map(t => {
    let text = t.msg;
    if (lang === 'en' && (t as any).msgEn) {
      text = (t as any).msgEn;
    } else if (lang === 'hi' && (t as any).msgHi) {
      text = (t as any).msgHi;
    } else if (lang === 'both' && (t as any).msgEn && (t as any).msgHi) {
      text = `${(t as any).msgEn}\n\n${(t as any).msgHi}`;
    }
    return {
      label: t.label,
      msg: text.replaceAll("[SHOP]", shopName)
    };
  });
};

const getBarcode = (cat: string) => {
  if (!cat) return null;
  if (cat.includes("|Barcode:")) {
    return cat.split("|Barcode:")[1];
  }
  if (cat.startsWith("Barcode:")) {
    return cat.replace("Barcode:", "");
  }
  return null;
};
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import InventoryDiary, { INVENTORY_CATEGORY_CONFIGS } from "./InventoryDiary";

export function WebAdBanner({ scriptUrl, adKey }: { scriptUrl: string; adKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptUrl || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-center items-center w-full min-h-[50px]";

    if (adKey) {
      const optionScript = document.createElement("script");
      optionScript.type = "text/javascript";
      optionScript.innerHTML = `
        window.atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      wrapper.appendChild(optionScript);
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptUrl;
    script.async = true;
    if (adKey) {
      script.setAttribute("data-zone", adKey);
    }
    wrapper.appendChild(script);

    containerRef.current.appendChild(wrapper);
  }, [scriptUrl, adKey]);

  return (
    <div className="w-full flex justify-center py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 print:hidden transition-all duration-300">
      <div ref={containerRef} className="w-[320px] h-[50px] overflow-hidden flex justify-center items-center">
        <span className="text-[8px] font-black tracking-widest text-zinc-300 dark:text-zinc-700 uppercase animate-pulse">Sponsored Ad</span>
      </div>
    </div>
  );
}

export function WebVignetteAd({ scriptUrl, adKey }: { scriptUrl: string; adKey: string }) {
  useEffect(() => {
    if (!scriptUrl || !adKey) return;

    const existing = document.querySelector(`script[data-zone="${adKey}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptUrl;
    script.setAttribute("data-zone", adKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [scriptUrl, adKey]);

  return null;
}

export default function Dashboard() {
  const [extraChargeName, setExtraChargeName] = useState("");
  const [extraChargeAmount, setExtraChargeAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const [isAdMobActive, setIsAdMobActive] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [admobDebugInfo, setAdmobDebugInfo] = useState("Not initialized");
  const [admobHeight, setAdmobHeight] = useState(60);
  const [adProvider, setAdProvider] = useState<"admob" | "web" | "none">("web");
  const [webAdScriptUrl, setWebAdScriptUrl] = useState("https://nap5k.com/tag.min.js");
  const [webAdKey, setWebAdKey] = useState("11070941");
  const [webAdDirectLink, setWebAdDirectLink] = useState("https://omg10.com/4/11071013");
  const [webAdVignetteUrl, setWebAdVignetteUrl] = useState("https://n6wxm.com/vignette.min.js");
  const [webAdVignetteKey, setWebAdVignetteKey] = useState("11076598");
  const admobRef = useRef<any>(null);

  // Remote Config states
  const APP_VERSION = "1.5.1";
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceText, setMaintenanceText] = useState("System under maintenance. Please try again later.");
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [updateStoreUrl, setUpdateStoreUrl] = useState("https://play.google.com/store/apps/details?id=com.zainul.instamunimpos");
  const [remoteAlertEnabled, setRemoteAlertEnabled] = useState(false);
  const [remoteAlertText, setRemoteAlertText] = useState("");
  const [admobBannerId, setAdmobBannerId] = useState("ca-app-pub-6433517681109667/2890562844");
  const [admobInterstitialId, setAdmobInterstitialId] = useState("ca-app-pub-6433517681109667/4211760677");

  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasRegistered = localStorage.getItem("saas_has_registered") === "true";
      if (!hasRegistered) {
        setAuthMode("signup");
      }
    }
  }, []);
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'privacy' | 'terms'>('privacy');
  const [showPassword, setShowPassword] = useState(false);
  const [signupStoreName, setSignupStoreName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("admin");
  const [loginError, setLoginError] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [lang, setLang] = useState<string>('en');
  const [lastSyncedTime, setLastSyncedTime] = useState(format(new Date(), "hh:mm:ss aa"));
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiInsightText, setAiInsightText] = useState("");

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      hi: {
        "Dashboard": "डैशबोर्ड",
        "Menus": "मेन्यू",
        "Sale": "बिक्री",
        "Stats": "आंकड़े",
        "More": "अन्य",
        "Net Profit": "शुद्ध मुनाफा",
        "Gross Sales": "कुल बिक्री",
        "Total Expense": "कुल खर्चे",
        "Pending Udhaar": "उधार बकाया",
        "Cloud Sync": "क्लाउड सिंक",
        "AI Insights": "AI सुझाव",
        "Recent Sales": "हालिया बिक्री",
        "View All": "सब देखें",
        "After Expenses": "खर्चों के बाद",
        "Gross Income": "कुल आय",
        "Operational Costs": "संचालन लागत",
        "From Khata": "खाता से",
        "Online": "ऑनलाइन",
        "Udhaar": "उधार",
        "Mark as Paid": "पैसे मिल गए",
        "Send WhatsApp Receipt": "WhatsApp बिल",
        "Total Pending": "कुल उधार",
        "Smart CRM": "स्मार्ट CRM",
        "Voice Cashier": "वॉइस कैशियर (Soundbox)",
        "Announcer Language": "आवाज की भाषा",
        "UDHAAR KHATA": "उधार खाता",
        "Add Sale": "बिक्री जोड़ें",
        "Add Expense": "खर्चा जोड़ें",
        "Rent Mission": "किराया मिशन",
        "Total Sale Report": "बिक्री रिपोर्ट",
        "Marketing": "मार्केटिंग",
        "Support": "सपोर्ट",
        "Privacy & Policy": "प्राइवेसी और पॉलिसी",
        "MoreMenu": "अधिक मेन्यू",
        "Inventory": "इन्वेंटरी",
        "Settings": "सेटिंग्स",
        "Store Profile": "स्टोर प्रोफाइल",
        "Account Security": "सुरक्षा",
        "System Cloud": "सिस्टम क्लाउड",
        "WhatsApp Bot": "WhatsApp बॉट",
        "Ad Settings": "विज्ञापन सेटिंग्स",
        "Fees & Commissions": "कमीशन",
        "Hardware Settings": "हार्डवेयर सेटिंग्स",
        "FAQ & Data Security": "अक्सर पूछे जाने वाले सवाल",
        "More Options": "अधिक विकल्प",
        "Daily Stock": "दैनिक स्टॉक",
        "Rent Tracker": "किराया ट्रैकर",
        "Help Center": "सहायता केंद्र",
        "Daily Stock Locked": "दैनिक स्टॉक लॉक्ड",
        "Are you sure you want to exit?": "क्या आप सचमुच बाहर निकलना चाहते हैं?",
        "Success!": "सफलता!",
        "Order has been completed and saved to cloud.": "ऑर्डर पूरा हो गया है और क्लाउड में सुरक्षित हो गया है।",
        "Your current session will end. Do you want to leave InstaMunim?": "आपका वर्तमान सत्र समाप्त हो जाएगा। क्या आप सचमुच बाहर निकलना चाहते हैं?",
        "Access additional tools and settings.": "अतिरिक्त उपकरण और सेटिंग्स का उपयोग करें।",
        "Track your store raw items and recipe stock.": "स्टोर के कच्चे माल और रेसिपी स्टॉक को ट्रैक करें।",
        "Track your store daily inventory and product stock.": "स्टोर के दैनिक सामान और उत्पाद स्टॉक को ट्रैक करें।",
        "Track your saloon cosmetics, supplies and styling items.": "सैलून सौंदर्य प्रसाधन, आपूर्ति और स्टाइलिंग वस्तुओं को ट्रैक करें।",
        "Track your clothing inventory, apparel stock and accessories.": "कपड़ों की इन्वेंटरी, परिधान स्टॉक और एक्सेसरीज़ को ट्रैक करें।",
        "Track your cleaning agents, detergents and packaging supplies.": "सफाई एजेंटों, डिटर्जेंट और पैकेजिंग आपूर्ति को ट्रैक करें।",
        "Track your electrical components, fittings and appliances stock.": "विद्युत घटकों, फिटिंग और उपकरणों के स्टॉक को ट्रैक करें।",
        "Track your automobile spares and motor oil stock.": "ऑटोमोबाइल पुर्जों और मोटर ऑयल स्टॉक को ट्रैक करें।",
        "Track your gym supplements, energy drinks and workout gear.": "जिम सप्लीमेंट्स, एनर्जी ड्रिंक्स और वर्कआउट गियर को ट्रैक करें।",
        "Track your cosmetics, skin care items and display stock.": "सौंदर्य प्रसाधन, त्वचा की देखभाल की वस्तुओं और डिस्प्ले स्टॉक को ट्रैक करें।",
        "Track your paper reams, writing items and books stock.": "पेपर रीम, लेखन सामग्री और पुस्तकों के स्टॉक को ट्रैक करें।",
        "Synchronized with UI language": "यूआई भाषा के साथ सिंक किया गया"
      },
      mr: {
        "Dashboard": "डॅशबोर्ड",
        "Menus": "मेनू",
        "Sale": "विक्री",
        "Stats": "आकडेवारी",
        "More": "इतर",
        "Net Profit": "निव्वळ नफा",
        "Gross Sales": "एकूण विक्री",
        "Total Expense": "एकूण खर्च",
        "Pending Udhaar": "उधारी बाकी",
        "Cloud Sync": "क्लाउड सिंक",
        "AI Insights": "AI सल्ला",
        "Recent Sales": "अलीकडील विक्री",
        "View All": "सर्व पहा",
        "After Expenses": "खर्चानंतर",
        "Gross Income": "एकूण उत्पन्न",
        "Operational Costs": "कार्यरत खर्च",
        "From Khata": "खात्यामधून",
        "Online": "ऑनलाइन",
        "Udhaar": "उधार",
        "Mark as Paid": "पैसे मिळाले",
        "Send WhatsApp Receipt": "WhatsApp पावती",
        "Total Pending": "एकूण उधारी",
        "Smart CRM": "स्मार्ट CRM",
        "Voice Cashier": "व्हॉइस कॅशियर (Soundbox)",
        "Announcer Language": "आवाजाची भाषा",
        "UDHAAR KHATA": "उधार खाते",
        "Add Sale": "विक्री जोडा",
        "Add Expense": "खर्च जोडा",
        "Rent Mission": "भाडे मिशन",
        "Total Sale Report": "विक्री अहवाल",
        "Marketing": "मार्केटिंग",
        "Support": "मदत",
        "Privacy & Policy": "गोपनीयता आणि धोरण",
        "MoreMenu": "अधिक पर्याय",
        "Inventory": "इन्व्हेंटरी",
        "Settings": "सेटिंग्ज",
        "Store Profile": "स्टोर प्रोफाइल",
        "Account Security": "सुरक्षा",
        "System Cloud": "सिस्टम क्लाउड",
        "WhatsApp Bot": "WhatsApp बॉट",
        "Ad Settings": "जाहिरात सेटिंग्ज",
        "Fees & Commissions": "कमिशन",
        "Hardware Settings": "हार्डवेअर सेटिंग्ज",
        "FAQ & Data Security": "नेहमीचे प्रश्न",
        "More Options": "अधिक पर्याय",
        "Daily Stock": "दैनिक स्टॉक",
        "Rent Tracker": "भाडे ट्रॅकर",
        "Help Center": "मदत केंद्र",
        "Daily Stock Locked": "दैनिक स्टॉक लॉक केले आहे",
        "Are you sure you want to exit?": "तुम्हाला खात्री आहे की तुम्हाला बाहेर पडायचे आहे?",
        "Success!": "यशस्वी!",
        "Order has been completed and saved to cloud.": "ऑर्डर यशस्वीरित्या पूर्ण झाली असून क्लाउडवर जतन केली गेली आहे.",
        "Your current session will end. Do you want to leave InstaMunim?": "तुमचे चालू सत्र संपेल. तुम्हाला बाहेर पडायचे आहे का?",
        "Access additional tools and settings.": "अतिरिक्त साधने आणि सेटिंग्जमध्ये प्रवेश करा.",
        "Track your store raw items and recipe stock.": "स्टोअर कच्च्या वस्तू आणि रेसिपी स्टॉकचा मागोवा घ्या.",
        "Synchronized with UI language": "यूआय भाषेसह सिंक केले"
      },
      gu: {
        "Dashboard": "ડેશબોર્ડ",
        "Menus": "મેનૂ",
        "Sale": "વેચાણ",
        "Stats": "આંકડા",
        "More": "બીજું",
        "Net Profit": "ચોખ્ખો નફો",
        "Gross Sales": "કુલ વેચાણ",
        "Total Expense": "કુલ ખર્ચ",
        "Pending Udhaar": "બાકી ઉધાર",
        "Cloud Sync": "ક્લાઉડ સિંક",
        "AI Insights": "AI સલાહ",
        "Recent Sales": "તાજેતરનું વેચાણ",
        "View All": "બધું જુઓ",
        "After Expenses": "ખર્ચ પછી",
        "Gross Income": "કુલ આવક",
        "Operational Costs": "સંચાલન ખર્ચ",
        "From Khata": "ખાતામાંથી",
        "Online": "ઓનલાઇન",
        "Udhaar": "ઉધાર",
        "Mark as Paid": "પૈસા મળી ગયા",
        "Send WhatsApp Receipt": "WhatsApp બિલ",
        "Total Pending": "કુલ ઉધાર",
        "Smart CRM": "સ્માર્ટ CRM",
        "Voice Cashier": "વોઇસ કેશિયર (Soundbox)",
        "Announcer Language": "અવાજની ભાષા",
        "UDHAAR KHATA": "ઉધાર ખાતું",
        "Add Sale": "વેચાણ ઉમેરો",
        "Add Expense": "ખર્ચ ઉમેરો",
        "Rent Mission": "ભાડું મિશન",
        "Total Sale Report": "વેચાણ રીપોર્ટ",
        "Marketing": "માર્કેટિંગ",
        "Support": "સપોર્ટ",
        "Privacy & Policy": "ગોપનીયતા અને નીતિ",
        "MoreMenu": "વધુ મેનૂ",
        "Inventory": "ઇન્વેન્ટરી",
        "Settings": "સેટિંગ્સ",
        "Store Profile": "સ્ટોર પ્રોફાઇલ",
        "Account Security": "સુરક્ષા",
        "System Cloud": "સિસ્ટમ ક્લાઉડ",
        "WhatsApp Bot": "WhatsApp બોટ",
        "Ad Settings": "જાહેરાત સેટિંગ્સ",
        "Fees & Commissions": "કમિશન",
        "Hardware Settings": "હાર્ડવેર સેટિંગ્સ",
        "FAQ & Data Security": "સામાન્ય પ્રશ્નો",
        "More Options": "વધુ વિકલ્પો",
        "Daily Stock": "દૈનિક સ્ટોક",
        "Rent Tracker": "ભાડું ટ્રેકર",
        "Help Center": "મદદ કેન્દ્ર",
        "Daily Stock Locked": "દૈનિક સ્ટોક લૉક કરેલ છે",
        "Are you sure you want to exit?": "શું vanity તમે ખરેખર બહાર નીકળવા માંગો છો?",
        "Success!": "સફળતા!",
        "Order has been completed and saved to cloud.": "ઓર્ડર સફળતાપૂર્વક પૂર્ણ થયો છે અને ક્લાઉડમાં સાચવવામાં આવ્યો છે.",
        "Your current session will end. Do you want to leave InstaMunim?": "તમારું સત્ર સમાપ્ત થઈ જશે. શું તમે ખરેખર બહાર જવા માંગો છો?",
        "Access additional tools and settings.": "વધારાના સાધનો અને સેટિંગ્સ ઍક્સેસ કરો.",
        "Track your store raw items and recipe stock.": "સ્ટોરની કાચી વસ્તુઓ અને રેસીપી સ્ટોકને ટ્રૅક કરો.",
        "Synchronized with UI language": "UI ભાષા સાથે સિંક કરેલ"
      },
      bn: {
        "Dashboard": "ড্যাশবোর্ড",
        "Menus": "মেনু",
        "Sale": "বিক্রয়",
        "Stats": "পরিসংখ্যান",
        "More": "অন্যান্য",
        "Net Profit": "নিট লাভ",
        "Gross Sales": "মোট বিক্রয়",
        "Total Expense": "মোট খরচ",
        "Pending Udhaar": "বাকি ধার",
        "Cloud Sync": "ক্লাউড সিঙ্ক",
        "AI Insights": "AI পরামর্শ",
        "Recent Sales": "সাম্প্রতিক বিক্রয়",
        "View All": "সব দেখুন",
        "After Expenses": "খরচের পর",
        "Gross Income": "মোট আয়",
        "Operational Costs": "পরিচালন ব্যয়",
        "From Khata": "খাতা থেকে",
        "Online": "অনলাইন",
        "Udhaar": "ধার",
        "Mark as Paid": "টাকা পেয়েছি",
        "Send WhatsApp Receipt": "WhatsApp রসিদ",
        "Total Pending": "মোট বাকি",
        "Smart CRM": "স্মার্ট CRM",
        "Voice Cashier": "ভয়েস ক্যাশিয়ার (Soundbox)",
        "Announcer Language": "ভাষার নির্বাচন",
        "UDHAAR KHATA": "খাতা খতিয়ান",
        "Add Sale": "বিক্রয় যোগ করুন",
        "Add Expense": "খরচ যোগ করুন",
        "Rent Mission": "ভাড়া হিসাব",
        "Total Sale Report": "বিক্রয় রিপোর্ট",
        "Marketing": "মার্কেটিং",
        "Support": "সহায়তা",
        "Privacy & Policy": "গোপনীয়তা ও নীতি",
        "MoreMenu": "আরও মেনু",
        "Inventory": "ইনভেন্টরি",
        "Settings": "সেটিংস",
        "Store Profile": "স্টোর প্রোফাইল",
        "Account Security": "নিরাপত্তা",
        "System Cloud": "সিস্টেম ক্লাউড",
        "WhatsApp Bot": "WhatsApp বট",
        "Ad Settings": "বিজ্ঞাপন সেটিংস",
        "Fees & Commissions": "কমিশন",
        "Hardware Settings": "হার্ডওয়্যার সেটিংস",
        "FAQ & Data Security": "জিজ্ঞাসাবাদ",
        "More Options": "আরও অপশন",
        "Daily Stock": "দৈনিক স্টক",
        "Rent Tracker": "ভাড়া ট্র্যাকার",
        "Help Center": "হেল্প সেন্টার",
        "Daily Stock Locked": "দৈনিক স্টক লক করা হয়েছে",
        "Are you sure you want to exit?": "আপনি কি নিশ্চিত যে আপনি প্রস্থান করতে চান?",
        "Success!": "সফল!",
        "Order has been completed and saved to cloud.": "অর্ডার সম্পন্ন হয়েছে এবং ক্লাউডে সংরক্ষিত হয়েছে।",
        "Your current session will end. Do you want to leave InstaMunim?": "আপনার সেশন শেষ হবে। আপনি কি প্রস্থান করতে চান?",
        "Access additional tools and settings.": "অতিরিক্ত সরঞ্জাম এবং সেটিংস অ্যাক্সেস করুন।",
        "Track your store raw items and recipe stock.": "স্টোরের কাঁচামাল এবং রেসিপি স্টক ট্র্যাক করুন।",
        "Synchronized with UI language": "UI ভাষার সাথে সিঙ্ক করা হয়েছে"
      },
      pa: {
        "Dashboard": "ਡੈਸ਼ਬੋਰਡ",
        "Menus": "ਮੇਨੂ",
        "Sale": "ਵਿਕਰੀ",
        "Stats": "ਅੰਕੜੇ",
        "More": "ਹੋਰ",
        "Net Profit": "ਸ਼ੁੱਧ ਮੁਨਾਫਾ",
        "Gross Sales": "ਕੁੱਲ ਵਿਕਰੀ",
        "Total Expense": "ਕੁੱਲ ਖਰਚੇ",
        "Pending Udhaar": "ਬਾਕੀ ਉਧਾਰ",
        "Cloud Sync": "ਕਲਾਊਡ ਸਿੰਕ",
        "AI Insights": "AI ਸੁਝਾਅ",
        "Recent Sales": "ਹਾਲੀਆ ਵਿਕਰੀ",
        "View All": "ਸਭ ਦੇਖੋ",
        "After Expenses": "ਖਰਚਿਆਂ ਤੋਂ ਬਾਅਦ",
        "Gross Income": "ਕੁੱਲ ਆਮਦਨ",
        "Operational Costs": "ਸੰਚਾਲਨ ਖਰਚੇ",
        "From Khata": "ਖਾਤੇ ਤੋਂ",
        "Online": "ਆਨਲਾਈਨ",
        "Udhaar": "ਉਧਾਰ",
        "Mark as Paid": "ਪੈਸੇ ਮਿਲ ਗਏ",
        "Send WhatsApp Receipt": "WhatsApp ਰਸੀਦ",
        "Total Pending": "ਕੁੱਲ ਉਧਾਰ",
        "Smart CRM": "ਸਮਾਰਟ CRM",
        "Voice Cashier": "ਵੌਇਸ ਕੈਸ਼ੀਅਰ (Soundbox)",
        "Announcer Language": "ਆਵਾਜ਼ ਦੀ ਭਾਸ਼ਾ",
        "UDHAAR KHATA": "ਉਧਾਰ ਖਾਤਾ",
        "Add Sale": "ਵਿਕਰੀ ਜੋੜੋ",
        "Add Expense": "ਖਰਚਾ ਜੋੜੋ",
        "Rent Mission": "ਕਿਰਾਇਆ ਮਿਸ਼ਨ",
        "Total Sale Report": "ਵਿਕਰੀ ਰਿਪੋਰਟ",
        "Marketing": "ਮਾਰਕੀਟਿੰਗ",
        "Support": "ਸਪੋਰਟ",
        "Privacy & Policy": "ਪ੍ਰਾਈਵੇਸੀ ਅਤੇ ਪਾਲਿਸੀ",
        "MoreMenu": "ਹੋਰ ਮੇਨੂ",
        "Inventory": "ਇਨਵੈਂਟਰੀ",
        "Settings": "ਸੈਟਿੰਗਜ਼",
        "Store Profile": "ਸਟੋਰ ਪ੍ਰੋਫਾਈਲ",
        "Account Security": "ਸੁਰੱਖਿਆ",
        "System Cloud": "ਸਿਸਟਮ ਕਲਾਊਡ",
        "WhatsApp Bot": "WhatsApp ਬੌਟ",
        "Ad Settings": "ਵਿਗਿਆਪਨ ਸੈਟਿੰਗਜ਼",
        "Fees & Commissions": "ਕਮਿਸ਼ਨ",
        "Hardware Settings": "ਹਾਰਡਵੇਅਰ ਸੈਟਿੰਗਜ਼",
        "FAQ & Data Security": "ਆਮ ਸਵਾਲ",
        "More Options": "ਹੋਰ ਵਿਕਲਪ",
        "Daily Stock": "ਰੋਜ਼ਾਨਾ ਸਟਾਕ",
        "Rent Tracker": "ਕਿਰਾਇਆ ਟ੍ਰੈਕਰ",
        "Help Center": "ਮਦਦ ਕੇਂਦਰ",
        "Daily Stock Locked": "ਰੋਜ਼ਾਨਾ ਸਟਾਕ ਲਾਕ ਹੈ",
        "Are you sure you want to exit?": "ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਬਾਹਰ ਜਾਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "Success!": "ਸਫ਼ਲਤਾ!",
        "Order has been completed and saved to cloud.": "ਆਰਡਰ ਪੂਰਾ ਹੋ ਗਿਆ ਹੈ ਅਤੇ ਕਲਾਉਡ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਹੋ ਗਿਆ ਹੈ।",
        "Your current session will end. Do you want to leave InstaMunim?": "ਤੁਹਾਡਾ ਚੱਲ ਰਹੀ ਸੈਸ਼ਨ ਖਤਮ ਹੋ ਜਾਵੇਗਾ। ਕੀ ਤੁਸੀਂ ਬਾਹਰ ਜਾਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "Access additional tools and settings.": "ਵਾਧੂ ਸਾਧਨਾਂ ਅਤੇ ਸੈਟਿੰਗਾਂ ਤੱਕ ਪਹੁੰਚ ਕਰੋ।",
        "Track your store raw items and recipe stock.": "ਸਟੋਰ ਦੀਆਂ ਕੱਚੀਆਂ ਚੀਜ਼ਾਂ ਅਤੇ ਰੈਸਿਪੀ ਸਟਾਕ ਨੂੰ ਟ੍ਰੈਕ ਕਰੋ।",
        "Synchronized with UI language": "UI ਭਾਸ਼ਾ ਨਾਲ ਸਿੰਕ ਕੀਤਾ ਗਿਆ"
      },
      ta: {
        "Dashboard": "டாஷ்போர்டு",
        "Menus": "மெனுக்கள்",
        "Sale": "விற்பனை",
        "Stats": "புள்ளிவிவரங்கள்",
        "More": "மேலும்",
        "Net Profit": "நிகர லாபம்",
        "Gross Sales": "மொத்த விற்பனை",
        "Total Expense": "மொத்த செலவு",
        "Pending Udhaar": "கடன் நிலுவை",
        "Cloud Sync": "கிளவுட் ஒத்திசைவு",
        "AI Insights": "AI ஆலோசனைகள்",
        "Recent Sales": "சமீபத்திய விற்பனை",
        "View All": "அனைத்தையும் பார்",
        "After Expenses": "செலவுகளுக்கு பின்",
        "Gross Income": "மொத்த வருமானம்",
        "Operational Costs": "இயக்க செலவுகள்",
        "From Khata": "கணக்கில் இருந்து",
        "Online": "ஆன்லைன்",
        "Udhaar": "கடன்",
        "Mark as Paid": "பணம் கிடைத்தது",
        "Send WhatsApp Receipt": "WhatsApp ரசீது",
        "Total Pending": "மொத்த கடன்",
        "Smart CRM": "ஸ்மார்ட் CRM",
        "Voice Cashier": "வாய்ஸ் கேஷியர் (Soundbox)",
        "Announcer Language": "மொழி தேர்வு",
        "UDHAAR KHATA": "கடன் கணக்கு",
        "Add Sale": "விற்பனை சேர்",
        "Add Expense": "செலவு சேர்",
        "Rent Mission": "வாடகை கணக்கு",
        "Total Sale Report": "விற்பனை அறிக்கை",
        "Marketing": "விற்பனை மேம்பாடு",
        "Support": "உதவி",
        "Privacy & Policy": "தனியுரிமைக் கொள்கை",
        "MoreMenu": "கூடுதல் மெனு",
        "Inventory": "சரக்கு இருப்பு",
        "Settings": "அமைப்புகள்",
        "Store Profile": "கடை சுயவிவரம்",
        "Account Security": "பாதுகாப்பு",
        "System Cloud": "கிளவுட் சிஸ்டம்",
        "WhatsApp Bot": "WhatsApp பாட்",
        "Ad Settings": "விளம்பர அமைப்புகள்",
        "Fees & Commissions": "கமிஷன்",
        "Hardware Settings": "வன்பொருள் அமைப்புகள்",
        "FAQ & Data Security": "கேள்வி பதில்கள்",
        "More Options": "கூடுதல் தேர்வுகள்",
        "Daily Stock": "தினசரி இருப்பு",
        "Rent Tracker": "வாடகை டிராக்கர்",
        "Help Center": "உதவி மையம்",
        "Daily Stock Locked": "தினசரி இருப்பு பூட்டப்பட்டுள்ளது",
        "Are you sure you want to exit?": "நீங்கள் நிச்சயமாக வெளியேற விரும்புகிறீர்களா?",
        "Success!": "வெற்றி!",
        "Order has been completed and saved to cloud.": "ஆர்டர் வெற்றிகரமாக முடிக்கப்பட்டு கிளவுடில் சேமிக்கப்பட்டது.",
        "Your current session will end. Do you want to leave InstaMunim?": "உங்கள் தற்போதைய அமர்வு முடிவடையும். வெளியேற வேண்டுமா?",
        "Access additional tools and settings.": "கூடுதல் கருவிகள் மற்றும் அமைப்புகளை அணுகவும்.",
        "Track your store raw items and recipe stock.": "கடையின் மூலப் பொருட்கள் மற்றும் சமையல் இருப்பைக் கண்காணிக்கவும்.",
        "Synchronized with UI language": "UI மொழியுடன் ஒத்திசைக்கப்பட்டது"
      },
      te: {
        "Dashboard": "డ్యాష్‌బోర్డ్",
        "Menus": "మెనూలు",
        "Sale": "విక్రయం",
        "Stats": "గణాంకాలు",
        "More": "మరింత",
        "Net Profit": "నికర లాభం",
        "Gross Sales": "మొత్తం అమ్మకాలు",
        "Total Expense": "మొత్తం ఖర్చు",
        "Pending Udhaar": "అప్పు బాకీ",
        "Cloud Sync": "ക്లౌడ్ సింక్",
        "AI Insights": "AI సలహాలు",
        "Recent Sales": "ఇటీవలి విక్రయాలు",
        "View All": "అన్నీ చూడు",
        "After Expenses": "ఖర్చుల తర్వాత",
        "Gross Income": "మొత్తం ఆదాయం",
        "Operational Costs": "నిర్వహణ ఖర్చులు",
        "From Khata": "ఖాతా నుండి",
        "Online": "ఆన్‌లైన్",
        "Udhaar": "అప్పు",
        "Mark as Paid": "డబ్బులు వచ్చాయి",
        "Send WhatsApp Receipt": "WhatsApp రశీదు",
        "Total Pending": "మొత్తం అప్పు",
        "Smart CRM": "స్మార్ట్ CRM",
        "Voice Cashier": "వాయిస్ క్యాషియర్ (Soundbox)",
        "Announcer Language": "వాయిస్ భాష",
        "UDHAAR KHATA": "అప్పుల ఖాతా",
        "Add Sale": "అమ్మకం జోడించు",
        "Add Expense": "ఖర్చు జోడించు",
        "Rent Mission": "అద్దె లక్ష్యం",
        "Total Sale Report": "అమ్మకాల నివేదిక",
        "Marketing": "మార్కెటింగ్",
        "Support": "సహాయం",
        "Privacy & Policy": "గోప్యత & విధానం",
        "MoreMenu": "మరిన్ని మెనూలు",
        "Inventory": "ఇన్వెంటరీ",
        "Settings": "సెట్టింగ్స్",
        "Store Profile": "స్టోర్ ప్రొఫైల్",
        "Account Security": "భద్రత",
        "System Cloud": "సిస్టమ్ క్లౌడ్",
        "WhatsApp Bot": "WhatsApp బాట్",
        "Ad Settings": "ప్రకటనల సెట్టింగ్స్",
        "Fees & Commissions": "కమిషన్",
        "Hardware Settings": "హార్డ్‌వేర్ సెట్టింగ్స్",
        "FAQ & Data Security": "తరచుగా అడిగే ప్రశ్నలు",
        "More Options": "మరిన్ని ఎంపికలు",
        "Daily Stock": "రోజువారీ స్టాక్",
        "Rent Tracker": "అద్దె ట్రాకర్",
        "Help Center": "സഹായ കേന്ദ്രം",
        "Daily Stock Locked": "రోజువారీ స్టాక్ లాక్ చేయబడింది",
        "Are you sure you want to exit?": "మీరు ఖచ్చితంగా నిష్క్రమించాలనుకుంటున్నారా?",
        "Success!": "విజయం!",
        "Order has been completed and saved to cloud.": "ఆర్డర్ పూర్తయింది మరియు క్లౌడ్‌లో భద్రపరచబడింది.",
        "Your current session will end. Do you want to leave InstaMunim?": "మీ నిష్క్రమణతో ప్రస్తుత సెషన్ ముగిసిపోతుంది. నిష్క్రమించాలనుకుంటున్నారా?",
        "Access additional tools and settings.": "అదనపు సాధనాలు మరియు సెట్టింగ్‌లను యాక్సెస్ చేయండి.",
        "Track your store raw items and recipe stock.": "స్టోర్ ముడి వస్తువులు మరియు రెసిపీ స్టాక్‌ను ట్రాక్ చేయండి.",
        "Synchronized with UI language": "UI భాషతో సింక్ చేయబడింది"
      },
      kn: {
        "Dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        "Menus": "ಮೆನುಗಳು",
        "Sale": "ಮಾರಾಟ",
        "Stats": "ಅಂಕಿಅಂಶಗಳು",
        "More": "ಇನ್ನಷ್ಟು",
        "Net Profit": "ನಿವ್ವಳ ಲಾಭ",
        "Gross Sales": "ಒಟ್ಟು ಮಾರಾಟ",
        "Total Expense": "ಒಟ್ಟು ಖರ್ಚು",
        "Pending Udhaar": "ಬಾಕಿ ಉದ್ರಿ",
        "Cloud Sync": "ಕ್ಲೌಡ್ ಸಿಂಕ್",
        "AI Insights": "AI ಸಲಹೆಗಳು",
        "Recent Sales": "ಇತ್ತೀಚಿನ ಮಾರಾಟ",
        "View All": "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ",
        "After Expenses": "ಖರ್ಚುಗಳ ನಂತರ",
        "Gross Income": "ಒಟ್ಟು ಆದಾಯ",
        "Operational Costs": "ಕಾರ್ಯಾಚರಣೆ ವೆಚ್ಚ",
        "From Khata": "ಖಾತೆಯಿಂದ",
        "Online": "ಆನ್‌ಲೈನ್",
        "Udhaar": "ಉದ್ರಿ",
        "Mark as Paid": "ಹಣ ಸಂದಾಯವಾಗಿದೆ",
        "Send WhatsApp Receipt": "WhatsApp ರಸೀದಿ",
        "Total Pending": "ಒಟ್ಟು ಬಾಕಿ",
        "Smart CRM": "ಸ್ಮಾರ್ಟ್ CRM",
        "Voice Cashier": "ವಾಯ್ಸ್ ಕ್ಯಾಷಿಯರ್ (Soundbox)",
        "Announcer Language": "ಘೋಷಕನ ಭಾಷೆ",
        "UDHAAR KHATA": "ಉದ್ರಿ ಖಾತೆ",
        "Add Sale": "ಮಾರಾಟ ಸೇರಿಸಿ",
        "Add Expense": "ಖರ್ಚು ಸೇರಿಸಿ",
        "Rent Mission": "ಬಾಡಿಗೆ ಲೆಕ್ಕ",
        "Total Sale Report": "ಮಾರಾಟ ವರದಿ",
        "Marketing": "ಮಾರ್ಕೆಟಿംഗ്",
        "Support": "ಬೆಂಬಲ",
        "Privacy & Policy": "ಗೌಪ್ಯತೆ ಮತ್ತು ನೀತಿ",
        "MoreMenu": "ಹೆಚ್ಚಿನ ಮೆನು",
        "Inventory": "ದಾಸ್ತಾನು",
        "Settings": "ಸೆಟ್ಟಿಂಗ್ಸ್",
        "Store Profile": "ಅಂಗಡಿ ಪ್ರೊಫೈಲ್",
        "Account Security": "ಭದ್ರತೆ",
        "System Cloud": "ಸಿಸ್ಟಮ್ ಕ್ಲೌಡ್",
        "WhatsApp Bot": "WhatsApp ಬಾಟ್",
        "Ad Settings": "ಜಾಹೀರಾತು ಸೆಟ್ಟಿಂಗ್ಸ್",
        "Fees & Commissions": "ಕಮಿಷನ್",
        "Hardware Settings": "ಹಾರ್ಡ್‌ವೇರ್ ಸೆಟ್ಟಿಂಗ್ಸ್",
        "FAQ & Data Security": "ಪ್ರಶ್ನೋತ್ತರಗಳು",
        "More Options": "ಹೆಚ್ಚಿನ ಆಯ್ಕೆಗಳು",
        "Daily Stock": "ದೈನಂದಿನ ದಾಸ್ತಾನು",
        "Rent Tracker": "ಬಾಡಿಗೆ ಟ್ರ್ಯಾಕರ್",
        "Help Center": "ಸಹಾಯ ಕೇಂದ್ರ",
        "Daily Stock Locked": "ದೈನಂದิน ದಾಸ್ತಾನು ಲಾಕ್ ಆಗಿದೆ",
        "Are you sure you want to exit?": "ನೀವು ಖಚಿತವಾಗಿ ನಿರ್ಗಮಿಸಲು ಬಯಸುವಿರಾ?",
        "Success!": "ಯಶಸ್ವಿ!",
        "Order has been completed and saved to cloud.": "ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
        "Your current session will end. Do you want to leave InstaMunim?": "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಅವಧಿ ಮುಗಿಯುತ್ತದೆ. ನಿರ್ಗಮಿಸಲು ಬಯಸುವಿರಾ?",
        "Access additional tools and settings.": "ಹೆಚ್ಚುವರಿ ಪರಿಕರಗಳು ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಪ್ರವೇಶಿಸಿ.",
        "Track your store raw items and recipe stock.": "ಅಂಗಡಿಯ ಕಚ್ಚಾ ವಸ್ತುಗಳು ಮತ್ತು ಪಾಕವಿಧಾನ ಸ್ಟಾಕ್ ಅನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
        "Synchronized with UI language": "UI ಭಾಷೆಯೊಂದಿಗೆ ಸಿಂಕ್ ಮಾಡಲಾಗಿದೆ"
      },
      ml: {
        "Dashboard": "ഡാഷ്‌ബോർഡ്",
        "Menus": "മെനുകൾ",
        "Sale": "വിൽപന",
        "Stats": "സ്ഥിതിവിവരക്കണക്കുകൾ",
        "More": "കൂടുതൽ",
        "Net Profit": "അറ്റാദായം",
        "Gross Sales": "മൊത്തം വിൽപന",
        "Total Expense": "മൊത്തം ചിലവ്",
        "Pending Udhaar": "ബാക്കി കടം",
        "Cloud Sync": "ക്ലൗഡ് സമന്വയം",
        "AI Insights": "AI നിർദ്ദേശങ്ങൾ",
        "Recent Sales": "സമീപകാല വിൽപനകൾ",
        "View All": "എല്ലാം കാണുക",
        "After Expenses": "ചിലവുകൾക്ക് ശേഷം",
        "Gross Income": "മൊത്തം വരുമാനം",
        "Operational Costs": "പ്രവർത്തന ചിലവുകൾ",
        "From Khata": "കണക്കുപുസ്തകത്തിൽ നിന്ന്",
        "Online": "ഓൺലൈൻ",
        "Udhaar": "കടം",
        "Mark as Paid": "പണം ലഭിച്ചു",
        "Send WhatsApp Receipt": "WhatsApp രസീത്",
        "Total Pending": "മൊത്തം കടം",
        "Smart CRM": "സ്മാർട്ട് CRM",
        "Voice Cashier": "വോയിസ് കാഷ്യർ (Soundbox)",
        "Announcer Language": "അനൗൺസർ ഭാഷ",
        "UDHAAR KHATA": "കടം കണക്ക്",
        "Add Sale": "വിൽപന ചേർക്കുക",
        "Add Expense": "ചിലവ് ചേർക്കുക",
        "Rent Mission": "വാടക കണക്ക്",
        "Total Sale Report": "വിൽപന റിപ്പോർട്ട്",
        "Marketing": "മാർക്കറ്റിംഗ്",
        "Support": "സഹായം",
        "Privacy & Policy": "സ്വകാര്യതാ നയം",
        "MoreMenu": "കൂടുതൽ മെനുകൾ",
        "Inventory": "ഇൻവെന്ററി",
        "Settings": "സെറ്റിംഗ്സ്",
        "Store Profile": "സ്റ്റോർ പ്രൊഫൈൽ",
        "Account Security": "സുരക്ഷ",
        "System Cloud": "സിസ്റ്റം ക്ലൗഡ്",
        "WhatsApp Bot": "WhatsApp ബോട്ട്",
        "Ad Settings": "പരസ്യ സെറ്റിംഗ്സ്",
        "Fees & Commissions": "കമ്മീഷൻ",
        "Hardware Settings": "ഹാർഡ്‌വെയർ സെറ്റിംഗ്സ്",
        "FAQ & Data Security": "ചോദ്യോത്തരങ്ങൾ",
        "More Options": "കൂടുതൽ ഓപ്ഷനുകൾ",
        "Daily Stock": "ദിനചര്യ സ്റ്റോക്ക്",
        "Rent Tracker": "വാടക ട്രാക്കർ",
        "Help Center": "സഹായ കേന്ദ്രം",
        "Daily Stock Locked": "ദിനചര്യ സ്റ്റോക്ക് ലോക്ക് ചെയ്തിരിക്കുന്നു",
        "Are you sure you want to exit?": "നിങ്ങൾക്ക് പുറത്തുകടക്കണമെന്ന് ഉറപ്പാണോ?",
        "Success!": "വിജയം!",
        "Order has been completed and saved to cloud.": "ഓർഡർ പൂർത്തിയാക്കി ക്ലൗഡിൽ സൂക്ഷിച്ചിരിക്കുന്നു.",
        "Your current session will end. Do you want to leave InstaMunim?": "നിങ്ങളുടെ നിലവിലെ സെഷൻ അവസാനിക്കും. പുറത്തുകടക്കണോ?",
        "Access additional tools and settings.": "അധിക ഉപകരണങ്ങളും ക്രമീകരണങ്ങളും ആക്സസ് ചെയ്യുക.",
        "Track your store raw items and recipe stock.": "സ്റ്റോറിലെ അസംസ്കൃത വസ്തുക്കളും പാചകക്കുറിപ്പ് സ്റ്റോക്കും ട്രാക്ക് ചെയ്യുക.",
        "Synchronized with UI language": "UI ഭാഷയുമായി സമന്വയിപ്പിച്ചിരിക്കുന്നു"
      }
    };
    return translations[lang]?.[key] || key;
  };

  const [settingsActiveSection, setSettingsActiveSection] = useState("Identity");
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("General");
  const [newItemImeis, setNewItemImeis] = useState<string[]>([]);
  const [unitDetails, setUnitDetails] = useState<{ imei: string; color: string; purchaseRate: string; hsnCode: string; supplierName: string; }[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newType, setNewType] = useState("Cash");

  // Credit Card State Hooks
  const [cardBankName, setCardBankName] = useState("HDFC Bank");
  const [cardType, setCardType] = useState("Visa");
  const [cardPosTerminal, setCardPosTerminal] = useState("Pine Labs POS");
  const [cardEmiTenure, setCardEmiTenure] = useState("Full Payment");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardAuthCode, setCardAuthCode] = useState("");

  // Buyback State Hooks
  const [buybackCustName, setBuybackCustName] = useState("");
  const [buybackCustMobile, setBuybackCustMobile] = useState("");
  const [buybackAadhaar, setBuybackAadhaar] = useState("");
  const [buybackBrandModel, setBuybackBrandModel] = useState("");
  const [buybackImei, setBuybackImei] = useState("");
  const [buybackPrice, setBuybackPrice] = useState("");
  const [buybackIdPhoto, setBuybackIdPhoto] = useState("");
  const [buybackIdPhotoBack, setBuybackIdPhotoBack] = useState("");
  const [buybackDevicePhoto, setBuybackDevicePhoto] = useState("");
  const [buybackDeclared, setBuybackDeclared] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [viewingIdPhoto, setViewingIdPhoto] = useState<string | null>(null);
  const [printingBuybackItem, setPrintingBuybackItem] = useState<any>(null);

  // Camera Zoom States
  const [hasZoomCapability, setHasZoomCapability] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 4, step: 0.1 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [financeCompany, setFinanceCompany] = useState("Bajaj Finserv");
  const [financeDownPayment, setFinanceDownPayment] = useState("");
  const [financeFileId, setFinanceFileId] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [financeDpSplit, setFinanceDpSplit] = useState(false);
  const [financeDpCash, setFinanceDpCash] = useState("");
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [swiggyCommission, setSwiggyCommission] = useState(25);
  const [zomatoCommission, setZomatoCommission] = useState(25);
  const [swiggyCommType, setSwiggyCommType] = useState("percent");
  const [zomatoCommType, setZomatoCommType] = useState("percent");
  const [monthlyRent, setMonthlyRent] = useState(15000);
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [crmMessage, setCrmMessage] = useState("Hi [NAME], we miss you at [SHOP]! 🍕 Come back today for a special offer just for you!\n\nनमस्ते [NAME], [SHOP] में आपकी याद आ रही है! 🍕 आज ही आएं और अपने लिए खास ऑफर पाएं!");
  const [templateLang, setTemplateLang] = useState<'both' | 'en' | 'hi'>('both');

  // Business Type / Category states
  const [businessType, setBusinessType] = useState("Restaurant/Cafe");
  const [signupBusinessType, setSignupBusinessType] = useState("Restaurant/Cafe");

  // AI Banner Generator states
  const [offerTitle, setOfferTitle] = useState("");
  const [discountDetails, setDiscountDetails] = useState("");
  const [productName, setProductName] = useState("");
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [rawAiImageUrl, setRawAiImageUrl] = useState("");
  const [aiBannerSeed, setAiBannerSeed] = useState<number | null>(null);
  const [aiBannerPrompt, setAiBannerPrompt] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState("");
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState<string | null>(null);

  const uploadBannerToStorage = async (base64Str: string) => {
    try {
      if (!base64Str || !base64Str.startsWith("data:")) return null;

      // 1. Try Supabase Storage first
      try {
        const res = await fetch(base64Str);
        const blob = await res.blob();
        const fileName = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, { contentType: 'image/png', upsert: true });
        if (!error && data) {
          const { data: pubUrl } = supabase.storage.from('receipts').getPublicUrl(fileName);
          if (pubUrl?.publicUrl) {
            setUploadedBannerUrl(pubUrl.publicUrl);
            return pubUrl.publicUrl;
          }
        }
      } catch (e) {
        console.warn("Supabase storage upload failed, trying public CDN fallback:", e);
      }

      // 2. Public CDN upload fallback (tmpfiles.org)
      const blob = await (await fetch(base64Str)).blob();
      const formData = new FormData();
      formData.append("file", blob, "banner.png");
      const cdnRes = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData
      });
      const cdnJson = await cdnRes.json();
      if (cdnJson?.data?.url) {
        const directUrl = cdnJson.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
        setUploadedBannerUrl(directUrl);
        return directUrl;
      }
    } catch (e) {
      console.warn("Storage upload warning:", e);
    }
    return null;
  };

  // Image compression helper
  const compressAndSetIdPhoto = (file: File, side: 'front' | 'back' | 'device') => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          if (side === 'front') {
            setBuybackIdPhoto(dataUrl);
          } else if (side === 'back') {
            setBuybackIdPhotoBack(dataUrl);
          } else {
            setBuybackDevicePhoto(dataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save buyback to Supabase as an expense with tags
  const handleSaveBuyback = async () => {
    if (!buybackCustName || !buybackBrandModel || !buybackPrice) {
      alert("Please fill Name, Device Model and Purchase Price.");
      return;
    }
    setIsLoading(true);
    try {
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (!store) throw new Error("Store ID not found");
        storeId = store.id;
        setCurrentStoreId(store.id);
      }

      const photoFrontStr = buybackIdPhoto ? buybackIdPhoto : "N/A";
      const photoBackStr = buybackIdPhotoBack ? buybackIdPhotoBack : "N/A";
      const photoDeviceStr = buybackDevicePhoto ? buybackDevicePhoto : "N/A";
      const photoStr = `${photoFrontStr}|${photoBackStr}|${photoDeviceStr}`;
      const buybackMeta = `[BUYBACK###${buybackBrandModel}###${buybackImei || "N/A"}###${buybackAadhaar || "N/A"}###${buybackCustName}###${buybackCustMobile || "N/A"}###${photoStr}###UNSOLD]`;
      const expenseTitle = `Used Phone Buyback: ${buybackBrandModel} (IMEI: ${buybackImei || "N/A"}) ${buybackMeta}`;

      const { data: newExp, error } = await supabase
        .from('expenses')
        .insert([{ store_id: storeId, title: expenseTitle, amount: Number(buybackPrice) }])
        .select()
        .single();

      if (error) throw error;

      // Automatically onboard this phone to menu_items as a product in Exchange category
      try {
        const cleanCategory = "Exchange";
        const finalCategory = `${cleanCategory}|IMEIs:${buybackImei || "N/A"}`;
        const productName = `[USED] ${buybackBrandModel}`;

        const { data: newProd, error: prodErr } = await supabase
          .from('menu_items')
          .insert([{
            store_id: storeId,
            name: productName,
            price: Number(buybackPrice),
            category: finalCategory
          }])
          .select()
          .single();

        if (!prodErr && newProd) {
          setMenuItems(prev => [...prev, {
            id: newProd.id,
            name: newProd.name,
            price: newProd.price,
            category: newProd.category
          }]);
        }
      } catch (prodEx) {
        console.error("Failed to auto-onboard exchange product:", prodEx);
      }

      setExpenses([{ id: newExp.id, title: newExp.title, amount: newExp.amount, date: new Date(newExp.expense_date || newExp.created_at) }, ...expenses]);

      setBuybackCustName("");
      setBuybackCustMobile("");
      setBuybackAadhaar("");
      setBuybackBrandModel("");
      setBuybackImei("");
      setBuybackPrice("");
      setBuybackIdPhoto("");
      setBuybackIdPhotoBack("");
      setBuybackDevicePhoto("");
      setBuybackDeclared(false);

      alert("Buyback purchase successfully saved & logged in expenses!");
    } catch (err: any) {
      alert("Error saving buyback: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdfBuyback = (item: any) => {
    const el = document.createElement("div");
    // Place absolute but behind page content so browser runs layout pass and html2canvas works
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "800px";
    el.style.padding = "25px";
    el.style.background = "#ffffff";
    el.style.color = "#000000";
    el.style.fontFamily = "system-ui, -apple-system, sans-serif";
    el.style.zIndex = "9999";
    el.style.opacity = "1";
    el.style.pointerEvents = "none";

    el.innerHTML = `
      <div style="border: 2px solid #e2e8f0; border-radius: 20px; padding: 30px; background: #ffffff; color: #000000;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            ${storeLogo ? `<img src="${storeLogo}" style="max-height: 48px; object-fit: contain;" />` : `<div style="font-size: 24px; font-weight: 900; color: #ea580c; text-transform: uppercase;">${restaurantName || "InstaMunim"}</div>`}
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">${restaurantName || "InstaMunim"}</h1>
            <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; font-weight: 600;">${storeAddress || "Smart Business Partner Log"}</p>
            ${storePhone ? `<p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; font-weight: 600;">Mob: +91 ${storePhone}</p>` : ""}
          </div>
        </div>

        <div style="display: inline-block; background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 4px 12px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px;">
          Proof of Trade-in & Buyback Receipt
        </div>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 15px 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Transaction Information
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; color: #000000;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569; width: 25%;">Customer Name</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">${item.custName}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569; width: 25%;">Brand & Model</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">${item.brandModel}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569;">Customer Mobile</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">+91 ${item.custMobile}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569;">IMEI Number</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">${item.imei}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569;">Aadhaar / ID Card</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">${item.aadhaar}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #000000; font-weight: 600;">${format(new Date(item.date), "dd MMM yyyy")}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #475569;">Identification Status</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #16a34a; font-weight: bold;">VERIFIED (ID PHOTO ATTACHED)</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f8fafc; font-weight: 700; color: #ea580c;">Amount Paid</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: 900; color: #ea580c;">₹${item.amount}</td>
          </tr>
        </table>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 15px 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Legal Declaration & Ownership Transfer
        </div>
        <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 10px; padding: 12px; font-size: 10px; line-height: 1.6; color: #44403c; text-align: justify; font-weight: 500;">
          I hereby declare that this mobile device / item details specified above belongs strictly to me, is my personal property, and has not been obtained by any illegal means, theft, or fraudulent actions. The identification card and photograph submitted are genuine and belong to me. I hereby transfer absolute ownership and user rights of this device to the store owner in exchange for the trade-in buyback amount of ₹${item.amount} received by me.
        </div>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 15px 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Verification Documents & Device Photo
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; text-align: center; background: #ffffff;">
            <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Aadhaar Front</div>
            ${item.photo && item.photo !== "N/A" ? `<img src="${item.photo}" style="max-width: 100%; height: 110px; object-fit: contain; border-radius: 4px;" />` : `<div style="font-size: 9px; color: #94a3b8; font-weight: 700; padding: 30px 0;">Not Provided</div>`}
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; text-align: center; background: #ffffff;">
            <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Aadhaar Back</div>
            ${item.photoBack && item.photoBack !== "N/A" ? `<img src="${item.photoBack}" style="max-width: 100%; height: 110px; object-fit: contain; border-radius: 4px;" />` : `<div style="font-size: 9px; color: #94a3b8; font-weight: 700; padding: 30px 0;">Not Provided</div>`}
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; text-align: center; background: #ffffff;">
            <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Device Photo</div>
            ${item.photoDevice && item.photoDevice !== "N/A" ? `<img src="${item.photoDevice}" style="max-width: 100%; height: 110px; object-fit: contain; border-radius: 4px;" />` : `<div style="font-size: 9px; color: #94a3b8; font-weight: 700; padding: 30px 0;">Not Provided</div>`}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 180px; border-top: 1.5px dashed #cbd5e1; text-align: center; padding-top: 6px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Store Representative</div>
          <div style="width: 180px; border-top: 1.5px dashed #cbd5e1; text-align: center; padding-top: 6px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Seller / Customer</div>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    const runPdfExport = async () => {
      // Safely wait for all images to complete loading to prevent blank PDFs
      try {
        const images = el.getElementsByTagName("img");
        const imagePromises = Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            }
          });
        });
        await Promise.race([
          Promise.all(imagePromises),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
      } catch (e: any) {
        console.warn("Preloading images before PDF generation encountered warning:", e);
      }

      const opt = {
        margin: 10,
        filename: `Buyback_Receipt_${item.custName.replace(/\s+/g, '_')}_&_${item.brandModel.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        const isCapacitor = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative);
        if (isCapacitor) {
          const pdfBase64 = await (window as any).html2pdf().from(el).set(opt).outputPdf('datauristring');
          const base64Data = pdfBase64.split(',')[1];
          const fileName = `Buyback_Receipt_${item.custName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

          // Capacitor Filesystem imported at top level
          // Capacitor Share imported at top level

          const writeResult = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          await Share.share({
            title: 'Buyback Receipt',
            url: writeResult.uri,
            dialogTitle: 'Save or Share Buyback Receipt'
          });
          document.body.removeChild(el);
        } else {
          (window as any).html2pdf().from(el).set(opt).save().then(() => {
            document.body.removeChild(el);
          });
        }
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        alert("PDF Generation Failed: " + err.message);
        try { document.body.removeChild(el); } catch (e: any) { }
      }
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "/html2pdf.bundle.min.js";
      script.onload = runPdfExport;
      document.head.appendChild(script);
    } else {
      runPdfExport();
    }
  };

  const handlePrintBuyback = (item: any) => {
    const storeGst = storeGstin || "";
    const baseUrl = "https://www.instamunim.com";
    const url = `${baseUrl}/invoice?decId=${item.id}&o=${ownerMobile}&n=${encodeURIComponent(restaurantName)}&a=${encodeURIComponent(storeAddress || "")}&ph=${encodeURIComponent(storePhone || "")}&g=${encodeURIComponent(storeGst)}`;

    const isCapacitor = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative);
    if (isCapacitor) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  const handleExportSalesToExcel = async () => {
    const baseUrl = "https://www.instamunim.com";
    const url = `${baseUrl}/invoice?exportExcel=true&o=${ownerMobile}&startDate=${startDate}&endDate=${endDate}&m=${startDate.substring(0, 7)}&n=${encodeURIComponent(restaurantName)}`;

    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative;
    if (isCapacitor) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownloadPdfSalesReport = () => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "800px";
    el.style.padding = "30px";
    el.style.background = "#ffffff";
    el.style.color = "#000000";
    el.style.fontFamily = "system-ui, -apple-system, sans-serif";
    el.style.zIndex = "-999";
    el.style.opacity = "1";
    el.style.pointerEvents = "none";

    const modeTotals = filteredSales.reduce((acc, sale) => {
      const mode = sale.type || "Cash";
      acc[mode] = (acc[mode] || 0) + sale.price;
      return acc;
    }, {});

    const modesHtml = Object.entries(modeTotals).map(([mode, total]) => `
      <div style="flex: 1; min-width: 120px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fafaf9; text-align: center; margin: 4px;">
        <div style="font-size: 8px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">${getPartnerName(businessType, mode)}</div>
        <div style="font-size: 14px; font-weight: 800; color: #ea580c;">₹${Math.round(total as number)}</div>
      </div>
    `).join("");

    const transactionsRowsHtml = filteredSales.map(s => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-size: 10px; color: #71717a; font-weight: 700;">${format(new Date(s.date), "dd MMM, hh:mm a")}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #09090b; font-weight: 700; text-transform: uppercase;">${s.name}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #52525b; font-weight: 600;">${s.mobile}</td>
        <td style="padding: 8px 10px; font-size: 10px; color: #27272a; font-weight: 600;">${s.item || "General Order"}</td>
        <td style="padding: 8px 10px; font-size: 10px; text-align: center;"><span style="background: #f4f4f5; padding: 2px 8px; border-radius: 4px; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #18181b;">${getPartnerName(businessType, s.type)}</span></td>
        <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: 800; color: #09090b;">₹${s.price}</td>
      </tr>
    `).join("");

    const formattedMonthName = (() => {
      try {
        return `${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}`;
      } catch (e: any) {
        return `${startDate} to ${endDate}`;
      }
    })();

    el.innerHTML = `
      <div style="border: 2px solid #e2e8f0; border-radius: 20px; padding: 30px; background: #ffffff; color: #000000;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            ${storeLogo ? `<img src="${storeLogo}" style="max-height: 48px; object-fit: contain;" />` : `<div style="font-size: 24px; font-weight: 900; color: #ea580c; text-transform: uppercase;">${restaurantName || "InstaMunim"}</div>`}
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">${restaurantName || "InstaMunim"}</h1>
            <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; font-weight: 600;">Monthly Business Performance Report</p>
            <p style="font-size: 10px; color: #ea580c; margin: 2px 0 0 0; font-weight: 800; text-transform: uppercase;">Period: ${formattedMonthName}</p>
          </div>
        </div>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Key Metrics
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="flex: 1; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fafaf9; text-align: center;">
            <div style="font-size: 8px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Total Orders</div>
            <div style="font-size: 16px; font-weight: 800; color: #09090b;">${filteredSales.length}</div>
          </div>
          <div style="flex: 1; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fafaf9; text-align: center;">
            <div style="font-size: 8px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Avg. Ticket Size</div>
            <div style="font-size: 16px; font-weight: 800; color: #09090b;">₹${filteredSales.length > 0 ? Math.round(totalSales / filteredSales.length) : 0}</div>
          </div>
          <div style="flex: 1; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fafaf9; text-align: center;">
            <div style="font-size: 8px; font-weight: 800; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Total Revenue</div>
            <div style="font-size: 16px; font-weight: 800; color: #ea580c;">₹${Math.round(totalSales)}</div>
          </div>
        </div>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Payment Method Totals
        </div>
        <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px;">
          ${modesHtml || `<div style="font-size: 10px; color: #71717a; font-style: italic; width: 100%; text-align: center; padding: 10px;">No payment metrics available</div>`}
        </div>

        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          Transaction History
        </div>
        <table style="width: 100%; border-collapse: collapse; color: #000000; margin-top: 10px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; text-align: left;">
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Date & Time</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Customer</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Mobile</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Details</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: center;">Mode</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsRowsHtml || `<tr><td colSpan="6" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic; font-weight: bold;">No transactions registered for this period.</td></tr>`}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px; font-size: 9px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; border-top: 1.5px solid #e2e8f0; padding-top: 10px;">
          POWERED BY INSTAMUNIM SMART POS
        </div>
      </div>
    `;

    document.body.appendChild(el);

    const runPdfExport = async () => {
      try {
        const images = el.getElementsByTagName("img");
        const imagePromises = Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            }
          });
        });
        await Promise.race([
          Promise.all(imagePromises),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
      } catch (e: any) { }

      const opt = {
        margin: 10,
        filename: `Sales_Report_${restaurantName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        const isCapacitor = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative);
        if (isCapacitor) {
          const pdfBase64 = await (window as any).html2pdf().from(el).set(opt).outputPdf('datauristring');
          const base64Data = pdfBase64.split(',')[1];
          const fileName = `Sales_Report_${restaurantName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

          // Capacitor Filesystem imported at top level
          // Capacitor Share imported at top level

          const writeResult = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          await Share.share({
            title: 'Sales Report',
            url: writeResult.uri,
            dialogTitle: 'Save or Share Sales Report'
          });
          document.body.removeChild(el);
        } else {
          (window as any).html2pdf().from(el).set(opt).save().then(() => {
            document.body.removeChild(el);
          });
        }
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        alert("PDF Generation Failed: " + err.message);
        try { document.body.removeChild(el); } catch (e: any) { }
      }
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "/html2pdf.bundle.min.js";
      script.onload = runPdfExport;
      document.head.appendChild(script);
    } else {
      runPdfExport();
    }
  };

  const handleZoomChange = (value: number) => {
    try {
      const scanner = qrCodeRef.current;
      if (scanner) {
        const track = scanner.getRunningTrack();
        if (track) {
          track.applyConstraints({
            advanced: [{ zoom: value }]
          } as any);
          setCurrentZoom(value);
        }
      }
    } catch (e: any) {
      console.error("Failed to apply camera zoom constraint:", e);
    }
  };

  const handleGenerateAIBanner = async () => {
    if (!offerTitle || !discountDetails || !productName) {
      setImageGenerationError("Please fill in all fields (Title, Discount, Product).");
      return;
    }
    setIsGeneratingImage(true);
    setImageGenerationError("");
    const runGeneration = async () => {
      try {
        let cleanPrompt = `Professional commercial studio photography social media ad poster banner. A realistic close-up shot of '${productName}' in premium packaging, set on a modern studio surface with clean lighting. Cinematic lighting, sharp focus, 8k resolution, high-end commercial setup. Plain background with no text, letters, or words.`;

        // Enhance prompt with Google Gemini if API Key is loaded
        if (geminiApiKey) {
          try {
            console.log("Refining ad prompt using Gemini AI...");
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: `You are an expert AI image prompt engineer for commercial advertising banners.
Write a highly descriptive, visually rich, and extremely realistic image generation prompt for Stable Diffusion / Flux to create a professional social media advertising poster.

Details of the offer:
- Store Name: "${restaurantName}" (a ${getLabels(businessType).name.toLowerCase()} business)
- Marketing Head: "${offerTitle}"
- Main Deal: "${discountDetails} on ${productName}"

Requirements for the generated image prompt:
1. It must describe a realistic, high-quality, professional commercial photograph of the product (${productName}). DO NOT make it abstract or text-only.
2. Describe actual physical items being advertised: high-end commercial close-up shot, depth of field, studio lighting, soft shadows, and clean realistic details.
3. CRITICAL: Specify that the image MUST NOT contain any text, letters, numbers, labels, or logos. It must be a clean, textless background featuring only the product. Any ad titles or logos will be overlaid later by code.
4. The background style should be a modern matching studio color palette.
5. Keep the description under 140 words. Return ONLY the raw prompt string. Do not use markdown blocks, quotes, or preambles.`
                        }
                      ]
                    }
                  ]
                })
              }
            );
            const geminiData = await response.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText && rawText.trim()) {
              cleanPrompt = rawText.trim().replace(/^`+|`+$/g, '').trim();
            }
          } catch (geminiErr) {
            console.warn("Gemini prompt enhancement failed, using default:", geminiErr);
          }
        }

        const seed = Math.floor(Math.random() * 1000000);
        setAiBannerSeed(seed);
        setAiBannerPrompt(cleanPrompt);
        const encodedPrompt = encodeURIComponent(cleanPrompt);
        const generatedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

        const drawBannerOverlays = (backgroundImage: any, logoImage: any, logoLoaded: any) => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Helper to draw text with dynamic wrapping or auto-scaling font size
              const drawTextWithFit = (
                textStr: string,
                centerX: number,
                yPos: number,
                maxWidth: number,
                maxFontSize: number,
                isBold: boolean,
                color: string
              ) => {
                let fontSize = maxFontSize;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = color;

                // Reduce font size until it fits, down to a minimum of 20px
                do {
                  ctx.font = `${isBold ? '900' : 'bold'} ${fontSize}px sans-serif`;
                  fontSize -= 2;
                } while (ctx.measureText(textStr).width > maxWidth && fontSize > 20);

                // If it still exceeds, wrap it into two lines
                if (ctx.measureText(textStr).width > maxWidth) {
                  fontSize = maxFontSize - 6;
                  if (fontSize < 20) fontSize = 20;
                  ctx.font = `${isBold ? '900' : 'bold'} ${fontSize}px sans-serif`;
                  const words = textStr.split(" ");
                  let line = "";
                  const lines = [];

                  for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " ";
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                      lines.push(line.trim());
                      line = words[n] + " ";
                    } else {
                      line = testLine;
                    }
                  }
                  lines.push(line.trim());

                  // Adjust y position to center the block of lines
                  const lineHeight = fontSize + 10;
                  const startY = yPos - ((lines.length - 1) * lineHeight) / 2;

                  lines.forEach((lineText, idx) => {
                    ctx.fillText(lineText, centerX, startY + idx * lineHeight);
                  });
                } else {
                  ctx.fillText(textStr, centerX, yPos);
                }
              };

              // 1. Draw the AI background image
              ctx.drawImage(backgroundImage, 0, 0, 1024, 1024);

              // 2. Draw subtle dark gradient overlays at the top and bottom for high text contrast
              const topGrad = ctx.createLinearGradient(0, 0, 0, 260);
              topGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
              topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = topGrad;
              ctx.fillRect(0, 0, 1024, 260);

              const bottomGrad = ctx.createLinearGradient(0, 720, 0, 1024);
              bottomGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
              bottomGrad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
              ctx.fillStyle = bottomGrad;
              ctx.fillRect(0, 720, 1024, 304);

              // 3. Draw Store Name at top-left (with auto-scaling to prevent overlapping the logo)
              ctx.fillStyle = "#ffffff";
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              let storeNameFontSize = 44;
              do {
                ctx.font = `bold ${storeNameFontSize}px sans-serif`;
                storeNameFontSize -= 2;
              } while (ctx.measureText(restaurantName.toUpperCase()).width > 750 && storeNameFontSize > 24);
              ctx.fillText(restaurantName.toUpperCase(), 48, 54);

              // 4. Draw Logo Card at top-right if loaded
              if (logoLoaded && logoImage) {
                const logoSize = 130;
                const x = 1024 - logoSize - 48;
                const y = 48;
                const radius = 24;

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + logoSize - radius, y);
                ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
                ctx.lineTo(x + logoSize, y + logoSize - radius);
                ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - radius, y + logoSize);
                ctx.lineTo(x + radius, y + logoSize);
                ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();

                const margin = 10;
                const size = logoSize - (margin * 2);
                ctx.drawImage(logoImage, x + margin, y + margin, size, size);
              }

              // 5. Draw Marketing Offer Title (e.g. "SUNDAY OFFER") in the lower part
              drawTextWithFit(offerTitle.toUpperCase(), 512, 805, 928, 76, true, "#FF6B00");

              // 6. Draw Discount Promo Details (e.g. "10% DISCOUNT ON ALL PRODUCTS")
              drawTextWithFit(`${discountDetails} ON ${productName}`.toUpperCase(), 512, 895, 928, 38, false, "#ffffff");

              // 7. Draw brand footer watermark
              ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
              ctx.font = "bold 20px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("POWERED BY INSTAMUNIM", 512, 970);

              const mergedUrl = canvas.toDataURL("image/png");
              setAiImageUrl(mergedUrl);
              uploadBannerToStorage(mergedUrl);
            } else {
              setAiImageUrl(backgroundImage.src);
              if (backgroundImage.src.startsWith("data:")) uploadBannerToStorage(backgroundImage.src);
            }
          } catch (err: any) {
            console.error("Canvas draw failed:", err);
            setAiImageUrl(backgroundImage.src);
          }
        };

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = generatedUrl;
        img.onload = () => {
          setRawAiImageUrl(generatedUrl);

          if (storeLogo) {
            const logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src = storeLogo;
            logoImg.onload = () => {
              drawBannerOverlays(img, logoImg, true);
              setIsGeneratingImage(false);
            };
            logoImg.onerror = () => {
              console.warn("Failed to load store logo for merging, fallback to raw AI image + text overlays.");
              drawBannerOverlays(img, null, false);
              setIsGeneratingImage(false);
            };
          } else {
            drawBannerOverlays(img, null, false);
            setIsGeneratingImage(false);
          }
        };
        img.onerror = () => {
          setImageGenerationError("Failed to generate ad banner. Please try again.");
          setIsGeneratingImage(false);
        };
      } catch (err: any) {
        setImageGenerationError("An error occurred during generation.");
        setIsGeneratingImage(false);
      }
    };
    runGeneration();
  };

  const launchWhatsApp = (mobile: string, text: string) => {
    const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-10);
    const encodedText = encodeURIComponent(text);
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative;

    if (isNative) {
      const nativeScheme = cleanMobile
        ? `whatsapp://send?phone=91${cleanMobile}&text=${encodedText}`
        : `whatsapp://send?text=${encodedText}`;
      try {
        window.location.href = nativeScheme;
      } catch (e) {
        const waUrl = cleanMobile
          ? `https://wa.me/91${cleanMobile}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`;
        window.open(waUrl, '_system');
      }
    } else {
      const waUrl = cleanMobile
        ? `https://wa.me/91${cleanMobile}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleShareAIBanner = async () => {
    if (!aiImageUrl) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const response = await fetch(aiImageUrl);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const fileName = `InstaMunim_Offer_${Date.now()}.png`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data.split(',')[1],
          directory: Directory.Cache
        });

        await Share.share({
          title: offerTitle,
          text: `Special offer at ${restaurantName}! 🛍️ Check out this deal:`,
          url: savedFile.uri,
          dialogTitle: 'Share Offer Banner via WhatsApp'
        });
      } else {
        const link = document.createElement('a');
        link.href = aiImageUrl;
        link.download = `InstaMunim_Offer_${offerTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("Banner download completed! You can now share it manually on WhatsApp.");
      }
    } catch (err: any) {
      console.error("Error sharing banner:", err);
      const baseUrl = (typeof window !== 'undefined' && window.location.port === '3000')
        ? "http://localhost:3000"
        : "https://www.instamunim.com";
      const seedParam = aiBannerSeed ? `&sd=${aiBannerSeed}` : "";
      const viewerUrl = `${baseUrl}/invoice?banner=true${seedParam}&n=${encodeURIComponent(restaurantName)}&o=${encodeURIComponent(offerTitle)}&d=${encodeURIComponent(discountDetails)}&p=${encodeURIComponent(productName)}&oM=${encodeURIComponent(ownerMobile)}`;
      launchWhatsApp('', `Special offer at ${restaurantName}! 🛍️ Offer: ${offerTitle}\nView Banner: ${viewerUrl}`);
    }
  };

  const handleSendImage = (mobile: string, name: string) => {
    if (!aiImageUrl) {
      alert("Please generate an AI banner first!");
      return;
    }

    const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      alert("Invalid customer phone number!");
      return;
    }

    try {
      const baseUrl = (typeof window !== 'undefined' && window.location.port === '3000')
        ? "http://localhost:3000"
        : "https://www.instamunim.com";

      const seedParam = aiBannerSeed ? `&sd=${aiBannerSeed}` : "";
      const viewerUrl = `${baseUrl}/invoice?banner=true${seedParam}&n=${encodeURIComponent(restaurantName)}&o=${encodeURIComponent(offerTitle)}&d=${encodeURIComponent(discountDetails)}&p=${encodeURIComponent(productName)}&oM=${encodeURIComponent(ownerMobile)}`;

      const customMsgEn = `Special offer for you, ${name}! 🛍️\nShop: ${restaurantName}\nOffer: ${offerTitle}\nDeal: ${discountDetails} on ${productName}`;
      const customMsgHi = `आपके लिए खास ऑफर, ${name}! 🛍️\nदुकान: ${restaurantName}\nऑफर: ${offerTitle}\nडील: ${productName} पर ${discountDetails}`;
      const customMsg = `${customMsgEn}\n\n${customMsgHi}\n\n🌐 View Digital Banner:\n${viewerUrl}`;

      launchWhatsApp(cleanMobile, customMsg);
    } catch (err: any) {
      console.error("Error sending image:", err);
    }
  };

  const [cart, setCart] = useState<any[]>([]);
  const [isAdMobBannerFailed, setIsAdMobBannerFailed] = useState(false);
  // Barcode Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scanningImeiItem, setScanningImeiItem] = useState<string | null>(null);
  const [scanningNewItemIndex, setScanningNewItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingItemImeis, setEditingItemImeis] = useState<string[]>([]);
  const [editingUnitDetails, setEditingUnitDetails] = useState<{ imei: string; color: string; purchaseRate: string; hsnCode: string; supplierName: string; }[]>([]);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editingSale, setEditingSale] = useState<{ id: string; name: string; mobile: string; item: string; price: string; type: string; discount: string; } | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [scanningEditItemIndex, setScanningEditItemIndex] = useState<number | null>(null);
  const [scannerError, setScannerError] = useState("");
  const [scannerDebugInfo, setScannerDebugInfo] = useState("Initializing...");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newScannedName, setNewScannedName] = useState("");
  const [newScannedPrice, setNewScannedPrice] = useState("");
  const [newScannedQty, setNewScannedQty] = useState("1");
  const [restaurantName, setRestaurantName] = useState("InstaMunim");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeSignature, setStoreSignature] = useState<string | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<string>("");

  const uploadToSupabaseStorage = async (file: File, folderName: 'logo' | 'signature') => {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${ownerMobile || 'unknown'}/${folderName}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('Logos and Images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Logos and Images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error("Storage upload failed:", err.message);
      alert("Image upload fail ho gayi. Dobara try karein: " + err.message);
      return null;
    }
  };

  useEffect(() => {
    if (!currentStoreId) return;

    const channel = supabase.channel('online-users');

    const trackPresence = async () => {
      channel
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ store_id: currentStoreId, online_at: new Date().toISOString() });
          }
        });
    };

    trackPresence();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStoreId]);
  const [storeUpiId, setStoreUpiId] = useState("");
  const [storeUpiName, setStoreUpiName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccessMessage, setScanSuccessMessage] = useState("");
  const [storeAddress, setStoreAddress] = useState("Premium Plaza, Main Road, New Delhi");
  const [storePhone, setStorePhone] = useState("+91 9999 888 777");
  const [storeWebsite, setStoreWebsite] = useState("www.khankitchen.com");
  const [storeGstin, setStoreGstin] = useState("07AABCU1234F1Z5");
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(5);
  const [isThermalPrinterEnabled, setIsThermalPrinterEnabled] = useState(false);
  const [isVoiceAnnouncerEnabled, setIsVoiceAnnouncerEnabled] = useState(true);
  const [voiceAnnouncerLanguage, setVoiceAnnouncerLanguage] = useState("hi");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storeCreatedAt, setStoreCreatedAt] = useState<string | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "error">("synced");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<'form' | 'confirm'>('form');
  const [deleteMobile, setDeleteMobile] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Smart CRM Batch Marketing & Sent Tracking States
  const [sentCrmMobiles, setSentCrmMobiles] = useState<string[]>([]);
  const [crmFilterTab, setCrmFilterTab] = useState<"all" | "pending" | "sent">("pending");
  const [selectedCrmMobiles, setSelectedCrmMobiles] = useState<string[]>([]);
  const [showBatchCampaignModal, setShowBatchCampaignModal] = useState(false);
  const [campaignIndex, setCampaignIndex] = useState(0);

  // POS Keyboard Shortcuts Refs & States
  const itemSearchInputRef = useRef<HTMLInputElement | null>(null);
  const customerMobileInputRef = useRef<HTMLInputElement | null>(null);
  const discountInputRef = useRef<HTMLInputElement | null>(null);
  const handleSaleRef = useRef<() => void>(() => { });
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const grandTotal = Math.max(0, cart.reduce((s, i) => s + (i.price * i.qty), 0) + (Number(extraChargeAmount) || 0) - (Number(discount) || 0));

  const checkSubscription = () => {


    // FORCE FREE PLAN FOR TESTING
    if (ownerMobile === "8130707236") return false;

    if (!storeCreatedAt) return true; // Loading state safety

    const now = new Date();
    const created = new Date(storeCreatedAt);
    const trialEnds = new Date(created.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 Days Trial

    // If active subscription exists
    if (subscriptionExpiry) {
      const expiry = new Date(subscriptionExpiry);
      return isAfter(expiry, now);
    }

    // Check if within trial period
    return isBefore(now, trialEnds);
  };

  const [disableStarterAds, setDisableStarterAds] = useState(false);
  const isSubscribed = checkSubscription();
  const isStarterAdsDisabled = disableStarterAds && (monthlyRent === 199 || monthlyRent === 2000);
  const isProOrAbove = (isSubscribed && (monthlyRent === 399 || monthlyRent === 3500 || monthlyRent === 999 || monthlyRent === 7500)) || isStarterAdsDisabled;

  const handleDeleteAccount = async () => {
    if (!deleteMobile || !deletePassword) {
      setDeleteError("Mobile number aur password dono required hain.");
      return;
    }
    if (deleteMobile !== ownerMobile) {
      setDeleteError("Mobile number aapke account se match nahi karta.");
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      // Single secure RPC call — runs with SECURITY DEFINER on server,
      // bypasses Supabase RLS, verifies creds + deletes all data atomically
      const { data: deleted, error } = await supabase
        .rpc('delete_store_account', {
          input_mobile: deleteMobile,
          input_pass: deletePassword
        });

      if (error) {
        console.error("RPC error:", error);
        setDeleteError("Server error aaya. Thodi der baad try karein.");
        setIsDeleting(false);
        return;
      }

      if (!deleted) {
        // RPC returned false → wrong credentials
        setDeleteError("Mobile number ya password galat hai. Dobara check karein.");
        setIsDeleting(false);
        return;
      }

      // Success — clear everything locally and reload
      localStorage.clear();
      try {

        if (Capacitor.isNativePlatform()) {

          await Preferences.clear();
        }
      } catch (e: any) { /* ignore on web */ }

      alert("✅ Account permanently delete ho gaya. InstaMunim use karne ke liye shukriya!");
      window.location.reload();

    } catch (err: any) {
      setDeleteError("Connection failed. Internet check karein aur dobara try karein.");
    } finally {
      setIsDeleting(false);
    }
  };


  // Force light mode if user is on the Free plan
  useEffect(() => {
    if (isLoggedIn && !isSubscribed && isDarkMode) {
      setIsDarkMode(false);
    }
  }, [isLoggedIn, isSubscribed, isDarkMode]);
  const [whatsappInvoiceTemplate, setWhatsappInvoiceTemplate] = useState(`━━━━━━━━━━━━━━━━━━━━━
🌟 *ORDER RECEIPT* 🌟
━━━━━━━━━━━━━━━━━━━━━

Hi *[NAME]*,

Thank you for choosing *[SHOP]*! Your order has been successfully processed.

📜 *BILL DETAILS:*
─────────────────────
[ITEMS]
─────────────────────
💰 *GRAND TOTAL: ₹[TOTAL]*

✅ *Payment Status:* Success
📅 *Date: ${format(new Date(), "dd-MM-yyyy")}*

We would love to serve you again! 🙏
Stay safe & eat healthy! 🍕

🌐 *View Digital Receipt:*
[LINK]

*Digital Invoice by InstaMunim*
━━━━━━━━━━━━━━━━━━━━━`);

  const [itemSearch, setItemSearch] = useState("");
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemPrice, setManualItemPrice] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePhase, setVoicePhase] = useState<'items' | 'name' | 'mobile'>('items');
  const [voiceInstruction, setVoiceInstruction] = useState("Bolna shuru kijiye...");
  const [voiceStatus, setVoiceStatus] = useState<"Idle" | "Connecting" | "Listening" | "Error">("Idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastMatch, setLastMatch] = useState("");
  const [voiceHistory, setVoiceHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const lastAddedRef = useRef<{ name: string, time: number }>({ name: "", time: 0 });
  const mobileDigitsRef = useRef<string>("");

  // Global Keyboard Shortcuts Event Listener (Conflict-Free Web POS Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // F1 or Shift + ? -> Toggle Keyboard Shortcuts Cheat Sheet
      if (key === "F1" || (e.shiftKey && key === "?")) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Esc -> Close Modals or Reset Search/Cart
      if (key === "Escape") {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (showUpgradeModal) {
          setShowUpgradeModal(false);
          return;
        }
        if (showDeleteAccountModal) {
          setShowDeleteAccountModal(false);
          return;
        }
        if (itemSearch) {
          setItemSearch("");
          return;
        }
        return;
      }

      // F2 or Ctrl + Enter -> Quick Cash Sale Checkout & Print
      if (key === "F2" || (e.ctrlKey && key === "Enter")) {
        e.preventDefault();
        setNewType("Cash");
        setTimeout(() => handleSaleRef.current(), 50);
        return;
      }

      // F3 or Shift + Enter -> Quick Online Sale Checkout & Print
      if (key === "F3" || (e.shiftKey && key === "Enter")) {
        e.preventDefault();
        setNewType("Online");
        setTimeout(() => handleSaleRef.current(), 50);
        return;
      }

      // F7 -> Pay via Udhaar Khata Mode
      if (key === "F7") {
        e.preventDefault();
        setNewType("Udhaar");
        if (customerMobileInputRef.current) {
          customerMobileInputRef.current.focus();
        }
        return;
      }

      // F5 -> Open Custom Entry / New Entry Popup Mode
      if (key === "F5") {
        e.preventDefault();
        setIsManualMode(prev => !prev);
        setIsSaleOpen(true);
        return;
      }

      // F8 -> Focus Item Search Bar
      if (key === "F8") {
        e.preventDefault();
        if (itemSearchInputRef.current) {
          itemSearchInputRef.current.focus();
          itemSearchInputRef.current.select();
        }
        return;
      }

      // F9 -> Focus Customer Mobile Input
      if (key === "F9") {
        e.preventDefault();
        if (customerMobileInputRef.current) {
          customerMobileInputRef.current.focus();
          customerMobileInputRef.current.select();
        }
        return;
      }

      // F10 -> Focus Discount Input Field
      if (key === "F10") {
        e.preventDefault();
        if (discountInputRef.current) {
          discountInputRef.current.focus();
          discountInputRef.current.select();
        }
        return;
      }

      // Screen Navigation Hotkeys (Browser Safe Alt + Number & Function Keys)
      // Alt + 1 -> Billing Dashboard / Sale
      if ((e.altKey && key === "1") || key === "F4") {
        e.preventDefault();
        setActiveTab("Dashboard");
        return;
      }

      // Alt + 2 -> Menu / Products / Inventory
      if (e.altKey && key === "2") {
        e.preventDefault();
        setActiveTab("Menu");
        return;
      }

      // Alt + 3 or F6 -> Udhaar Khata (Customer Ledgers)
      if ((e.altKey && key === "3") || key === "F6") {
        e.preventDefault();
        setActiveTab("Khata");
        return;
      }

      // Alt + 4 or F11 -> Expenses / Rent (Kharcha)
      if ((e.altKey && key === "4") || key === "F11") {
        e.preventDefault();
        setActiveTab("Rent");
        return;
      }

      // Alt + 5 or F12 -> Smart CRM / Reports / Stats
      if ((e.altKey && key === "5") || key === "F12") {
        e.preventDefault();
        setActiveTab("Total Sale Report");
        return;
      }

      // Alt + 6 -> Settings / More Menu
      if (e.altKey && key === "6") {
        e.preventDefault();
        setActiveTab("Settings");
        return;
      }

      // Check if user is typing inside a text input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        (activeElement as HTMLElement).isContentEditable
      );

      // If user is actively typing inside an input field, do not trigger single Shift hotkeys
      if (isInputFocused) {
        return;
      }

      // Shift + N -> Start Fresh Bill (Reset Cart & Fields)
      if (e.shiftKey && (key === "N" || key === "n")) {
        e.preventDefault();
        setCart([]);
        setNewName("");
        setNewMobile("");
        setDiscount("");
        setItemSearch("");
        return;
      }

      // Shift + G -> Toggle GST Tax
      if (e.shiftKey && (key === "G" || key === "g")) {
        e.preventDefault();
        setIsGstEnabled(prev => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcutsModal, showUpgradeModal, showDeleteAccountModal, itemSearch, cart]);

  // SMART TRANSLITERATION (Hindi Script to English Font)
  const transliterate = (text: string) => {
    const map: any = {
      'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
      'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
      'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
      'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h', '्': '', '़': ''
    };
    return text.split('').map(char => map[char] || char).join('').toUpperCase();
  };

  const qrCodeRef = useRef<any>(null);
  const lastScannedRef = useRef<{ barcode: string; time: number } | null>(null);
  const scannerTargetRef = useRef<"cart" | "imei">("cart");
  const [imeiScanned, setImeiScanned] = useState("");
  const [lastScannedMsg, setLastScannedMsg] = useState("");

  // Super Admin Remote Control States
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);
  const [flagVoiceCashier, setFlagVoiceCashier] = useState(true);
  const [flagAiScanner, setFlagAiScanner] = useState(true);
  const [flagBuybackTracker, setFlagBuybackTracker] = useState(true);
  const [flagUdhaarKhata, setFlagUdhaarKhata] = useState(true);
  const [flagReportsCrm, setFlagReportsCrm] = useState(true);
  const [flagInventoryMgmt, setFlagInventoryMgmt] = useState(true);
  const [flagGstInvoicing, setFlagGstInvoicing] = useState(true);

  // Global & Targeted Remote Configs
  const [remoteAdFrequency, setRemoteAdFrequency] = useState(2);
  const [remotePlayStoreBoosterEnabled, setRemotePlayStoreBoosterEnabled] = useState(false);
  const [remotePlayStoreUrl, setRemotePlayStoreUrl] = useState("https://play.google.com/store/apps/details?id=com.instamunim.smartpos");
  const [showTargetedBroadcastModal, setShowTargetedBroadcastModal] = useState(false);
  const [targetedBroadcastData, setTargetedBroadcastData] = useState<any>(null);
  const [showFeatureLockModal, setShowFeatureLockModal] = useState<string | null>(null);

  const handleTabNavigation = (tabId: string) => {
    if ((tabId === "BuybackTracker" || tabId === "Exchange / Sell Old Device") && !flagBuybackTracker) {
      setShowFeatureLockModal("📱 Buyback Device Tracker");
      return;
    }
    if ((tabId === "Khata" || tabId === "Udhaar Khata") && !flagUdhaarKhata) {
      setShowFeatureLockModal("📒 Udhaar Khata Ledger");
      return;
    }
    if ((tabId === "Total Sale Report" || tabId === "Marketing" || tabId === "Smart CRM") && !flagReportsCrm) {
      setShowFeatureLockModal("📊 Reports & Smart CRM");
      return;
    }
    if ((tabId === "Inventory" || tabId === "Menu") && !flagInventoryMgmt) {
      setShowFeatureLockModal("📦 Inventory Management");
      return;
    }
    setActiveTab(tabId);
  };

  // Smart Menu Scanner states
  const [showScanMenuModal, setShowScanMenuModal] = useState(false);
  const [scanMenuImage, setScanMenuImage] = useState<string | null>(null);
  const [scanMenuLoading, setScanMenuLoading] = useState(false);
  const [scanMenuResults, setScanMenuResults] = useState<{ name: string, price: number, selected: boolean }[]>([]);
  const [scanMenuStep, setScanMenuStep] = useState<'capture' | 'review'>('capture');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e: any) {
      console.warn("Audio context not supported", e);
    }
  };

  const startScanner = () => {
    setScannerError("");
    try {
      const formats = [9, 10, 5, 3, 14, 15, 0]; // EAN_13, EAN_8, CODE_128, CODE_39, UPC_A, UPC_E, QR_CODE
      const html5QrCode = new (window as any).Html5Qrcode("reader");
      qrCodeRef.current = html5QrCode;

      const successCallback = (decodedText: string) => {
        const now = Date.now();
        if (
          lastScannedRef.current &&
          lastScannedRef.current.barcode === decodedText &&
          now - lastScannedRef.current.time < 2000
        ) {
          return;
        }
        lastScannedRef.current = { barcode: decodedText, time: now };
        handleScanSuccess(decodedText, html5QrCode);
      };

      const startWithConfig = (cameraIdOrConfig: any, videoConstraints?: any) => {
        return html5QrCode.start(
          cameraIdOrConfig,
          {
            fps: 25,
            qrbox: (width: number, height: number) => {
              return { width: Math.min(width * 0.9, 320), height: 100 };
            },
            videoConstraints: videoConstraints || {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: "environment"
            },
            formatsToSupport: formats,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          successCallback,
          () => { }
        ).then(() => {
          try {
            const track = html5QrCode.getRunningTrack();
            if (track) {
              const capabilities = track.getCapabilities() as any;
              if (capabilities && capabilities.zoom) {
                setHasZoomCapability(true);
                setZoomRange({
                  min: capabilities.zoom.min || 1,
                  max: capabilities.zoom.max || 4,
                  step: capabilities.zoom.step || 0.1
                });
                setCurrentZoom(1);
              } else {
                setHasZoomCapability(false);
              }
            }
          } catch (e: any) {
            console.warn("Failed to read camera zoom capabilities:", e);
            setHasZoomCapability(false);
          }
        });
      };

      // Get all available cameras and look specifically for the back/rear camera
      (window as any).Html5Qrcode.getCameras()
        .then((cameras: any[]) => {
          if (cameras && cameras.length > 0) {
            // Find back camera by label keywords (most reliable)
            let backCam = cameras.find((cam: any) => {
              const label = (cam.label || "").toLowerCase();
              return label.includes("back") || label.includes("rear") || label.includes("environment");
            });

            // If not found by label, look for any camera that does not contain "front" or "user"
            if (!backCam) {
              backCam = cameras.find((cam: any) => {
                const label = (cam.label || "").toLowerCase();
                return !label.includes("front") && !label.includes("user") && !label.includes("selfie");
              });
            }

            // On Android WebView, cameras[0] is often the FRONT camera.
            // Use the LAST camera as default since back camera is usually last in the list.
            if (!backCam) {
              backCam = cameras[cameras.length - 1];
            }

            setScannerDebugInfo(`Using: ${backCam.label || "Back Camera"}`);

            // Start scanning with the selected camera ID
            startWithConfig(backCam.id)
              .then(() => {
                try {
                  html5QrCode.applyVideoConstraints({
                    focusMode: "continuous"
                  } as any).catch((e: any) => console.log("autofocus not supported:", e));
                } catch (e: any) {
                  console.log("Error applying focus constraints:", e);
                }
              })
              .catch((err: any) => {
                console.warn("Failed to start with selected camera ID, falling back to facingMode environment", err);
                startWithConfig({ facingMode: "environment" })
                  .catch((fallbackErr: any) => {
                    setScannerError(`Camera start error: ${fallbackErr.message || fallbackErr}`);
                  });
              });
          } else {
            // Fallback to facingMode environment
            startWithConfig({ facingMode: "environment" })
              .catch((e: any) => {
                setScannerError(`No camera devices detected: ${e.message || e}`);
              });
          }
        })
        .catch((camListErr: any) => {
          console.warn("Failed to get cameras, using environment facingMode", camListErr);
          startWithConfig({ facingMode: "environment" })
            .catch((e: any) => {
              setScannerError(`Camera initialization error: ${e.message || e}`);
            });
        });
    } catch (err: any) {
      console.error(err);
      setScannerError(`Init error: ${err.message || err}`);
    }
  };

  const closeScanner = () => {
    lastScannedRef.current = null;
    setLastScannedMsg("");
    if (qrCodeRef.current) {
      try {
        qrCodeRef.current.stop().then(() => {
          setShowScanner(false);
        }).catch(() => {
          setShowScanner(false);
        });
      } catch (e: any) {
        setShowScanner(false);
      }
    } else {
      setShowScanner(false);
    }
  };

  useEffect(() => {
    if (showScanner) {
      if ((window as any).Html5Qrcode) {
        setTimeout(startScanner, 400);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.async = true;
      script.onload = () => {
        setTimeout(startScanner, 400);
      };
      script.onerror = () => {
        setScannerError("Failed to load scanner library. Check internet connection.");
      };
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [showScanner]);

  const handleScanSuccess = async (rawBarcode: string, html5QrCodeInstance?: any) => {
    playBeep();

    // Clean rawBarcode: if it contains an IMEI sequence (14 to 16 digits), extract it.
    let barcode = rawBarcode.trim();
    const match = barcode.match(/\d{14,16}/);
    if (match) {
      barcode = match[0];
    }

    setScannedBarcode(barcode);

    if (scannerTargetRef.current === "imei") {
      setBuybackImei(barcode);
      setImeiScanned(barcode);
      const sc = html5QrCodeInstance || qrCodeRef.current;
      if (sc) {
        try {
          await sc.stop();
        } catch (e: any) {
          console.error("Error stopping scanner:", e);
        }
      }
      qrCodeRef.current = null;
      setShowScanner(false);
      return;
    }

    const scanner = html5QrCodeInstance || qrCodeRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch (e: any) {
        console.error("Error stopping scanner:", e);
      }
    }
    qrCodeRef.current = null;
    setShowScanner(false);

    if (scanningImeiItem) {
      updateCartItemImei(scanningImeiItem, barcode);
      setScanningImeiItem(null);
      return;
    }

    if (scanningNewItemIndex !== null) {
      setNewItemImeis(prev => {
        const updated = [...prev];
        updated[scanningNewItemIndex] = barcode;
        return updated;
      });
      setScanningNewItemIndex(null);
      return;
    }

    if (scanningEditItemIndex !== null) {
      setEditingItemImeis(prev => {
        const updated = [...prev];
        updated[scanningEditItemIndex] = barcode;
        return updated;
      });
      setScanningEditItemIndex(null);
      return;
    }

    if (businessType === "Mobile/Electronics") {
      const matchedImeiItem = menuItems.find(item => {
        const imeis = getImeis(item.category);
        return imeis.includes(barcode);
      });
      if (matchedImeiItem) {
        addToCart({
          ...matchedImeiItem,
          imei: barcode
        });
        return;
      }
    }

    const matchedItem = menuItems.find(item => {
      const itemBarcode = getBarcode(item.category);
      return itemBarcode === barcode;
    });

    if (matchedItem) {
      addToCart(matchedItem);
    } else {
      setIsApiLoading(true);
      setNewScannedName("");
      setNewScannedPrice("");
      setNewScannedQty("1");
      setShowNewProductModal(true);

      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await res.json();
        if (data.status === 1) {
          const prodName = data.product.product_name || data.product.product_name_en || "";
          const brand = data.product.brands || "";
          const fullName = brand ? `${brand} ${prodName}` : prodName;
          setNewScannedName(fullName.trim());
        }
      } catch (err: any) {
        console.error("Open Food Facts fetch error:", err);
      } finally {
        setIsApiLoading(false);
        setTimeout(() => {
          const priceInput = document.getElementById("new-scanned-price-input");
          if (priceInput) priceInput.focus();
        }, 300);
      }
    }
  };

  const handleAddNewScannedProduct = async () => {
    if (!newScannedName.trim()) return alert("Product name is required.");
    const priceVal = Number(newScannedPrice) || 0;
    const qtyVal = Number(newScannedQty) || 1;

    setCart(prev => {
      const existing = prev.find(c => c.name === newScannedName.trim());
      if (existing) {
        return prev.map(c => c.name === newScannedName.trim() ? { ...c, qty: c.qty + qtyVal } : c);
      }
      return [...prev, {
        name: newScannedName.trim(),
        price: priceVal,
        qty: qtyVal,
        isNewProduct: true,
        barcode: scannedBarcode
      }];
    });

    setShowNewProductModal(false);
  };

  // Latest State Ref to avoid stale closures in voice listener
  const latestStateRef = useRef({ menuItems, voicePhase, cart, newName, newMobile });
  useEffect(() => {
    latestStateRef.current = { menuItems, voicePhase, cart, newName, newMobile };
  }, [menuItems, voicePhase, cart, newName, newMobile]);
  // BACK BUTTON HANDLING FOR MOBILE APP
  useEffect(() => {
    let backListener: any;

    const initBackListener = async () => {
      try {

        backListener = await App.addListener('backButton', () => {
          if (activeTab !== "Dashboard") {
            setActiveTab("Dashboard");
          } else if (isSaleOpen) {
            setIsSaleOpen(false);
          } else {
            setShowExitDialog(true);
          }
        });
      } catch (e: any) {
        console.log("Not running in Capacitor, back button listener skipped.");
      }
    };

    initBackListener();
    return () => {
      if (backListener) backListener.remove();
    };
  }, [activeTab, isSaleOpen, setShowExitDialog]);

  // Fetch available unused coupons for customer mobile number
  useEffect(() => {
    if (newMobile.length === 10 && ownerMobile) {
      const fetchCustomerCoupons = async () => {
        try {
          const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("customer_mobile", newMobile)
            .eq("store_mobile", ownerMobile)
            .eq("status", "unused");
          if (!error && data) {
            setAvailableCoupons(data);
          } else {
            setAvailableCoupons([]);
          }
        } catch (e: any) {
          console.error("Failed to fetch customer coupons", e);
        }
      };
      fetchCustomerCoupons();
    } else {
      setAvailableCoupons([]);
      setAppliedCouponId(null);
    }
  }, [newMobile, ownerMobile]);

  const prepareInterstitialAd = async () => {
    if (isSubscribed) return;
    try {
      const adModule = admobRef.current;

      if (adModule && Capacitor.isNativePlatform()) {
        console.log("Preparing Interstitial Ad...");
        await adModule.prepareInterstitial({
          adId: admobInterstitialId,
          isTesting: false,
        });
        console.log("Interstitial Ad prepared successfully.");
      }
    } catch (err: any) {
      console.error("Error preparing Interstitial Ad:", err);
    }
  };

  useEffect(() => {
    let loadedListener: any = null;
    let failedListener: any = null;
    let sizeChangedListener: any = null;
    let interstitialDismissedListener: any = null;
    let interstitialFailedToLoadListener: any = null;

    const initAdMob = async () => {
      if (adProvider !== "admob") {
        setAdmobDebugInfo("AdMob is not selected provider");
        setIsAdMobActive(false);
        setAdmobHeight(0);
        return;
      }
      if (isProOrAbove) {
        setAdmobDebugInfo("Pro user: AdMob inactive");
        setIsAdMobActive(false);
        setAdmobHeight(0);
        return;
      }
      try {

        if (!Capacitor.isNativePlatform()) {
          setAdmobDebugInfo("Non-native platform");
          return;
        }
        setIsNative(true);

        setAdmobDebugInfo("Loading AdMob module...");
        const adModule = await import('@capacitor-community/admob');
        admobRef.current = adModule.AdMob;
        const AdMob = adModule.AdMob;
        const BannerAdSize = adModule.BannerAdSize;
        const BannerAdPosition = adModule.BannerAdPosition;
        const BannerAdPluginEvents = adModule.BannerAdPluginEvents;
        const InterstitialAdPluginEvents = adModule.InterstitialAdPluginEvents;

        setAdmobDebugInfo("Registering listeners...");

        loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          console.log("AdMob banner loaded successfully");
          setAdmobDebugInfo("Loaded successfully");
          setIsAdMobActive(true);
          setIsAdMobBannerFailed(false);
        });

        failedListener = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (info: any) => {
          console.error("AdMob banner failed to load:", info);
          setAdmobDebugInfo("Unavailable (Switched to Monetag successfully)");
          setIsAdMobActive(false);
          setIsAdMobBannerFailed(true);
        });

        sizeChangedListener = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: any) => {
          console.log("AdMob banner size changed:", size);
          if (size && typeof size.height === "number" && size.height > 0) {
            setAdmobHeight(size.height);
          }
        });

        interstitialDismissedListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          console.log("Interstitial ad dismissed, pre-loading next one...");
          prepareInterstitialAd();
        });

        interstitialFailedToLoadListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (info: any) => {
          console.error("Interstitial ad failed to load:", info);
        });

        setAdmobDebugInfo("Initializing SDK...");
        await AdMob.initialize({
          initializeForTesting: false,
        });

        await prepareInterstitialAd();

        setAdmobDebugInfo("Requesting banner...");
        console.log("Showing AdMob Banner ad...");
        await AdMob.showBanner({
          adId: admobBannerId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: false,
        });
        setAdmobDebugInfo("Show requested. Waiting for load...");
      } catch (err: any) {
        console.error("AdMob initialization/show error: ", err);
        setAdmobDebugInfo("Connection failed (Switched to Monetag successfully)");
      }
    };

    initAdMob();

    return () => {
      const cleanUp = async () => {
        try {

          if (Capacitor.isNativePlatform() && admobRef.current) {
            if (loadedListener) loadedListener.remove();
            if (failedListener) failedListener.remove();
            if (sizeChangedListener) sizeChangedListener.remove();
            if (interstitialDismissedListener) interstitialDismissedListener.remove();
            if (interstitialFailedToLoadListener) interstitialFailedToLoadListener.remove();
            await admobRef.current.removeBanner();
          }
        } catch (e: any) {
          console.error("Error removing AdMob banner/listeners: ", e);
        }
      };
      cleanUp();
    };
  }, [isProOrAbove, adProvider]);

  // Hide AdMob banner when Sale popup is open, show when closed
  useEffect(() => {
    const toggleBanner = async () => {
      try {

        if (!Capacitor.isNativePlatform() || !admobRef.current) return;

        if (isProOrAbove || adProvider !== "admob") {
          try {
            await admobRef.current.hideBanner();
          } catch (e: any) { }
          setIsAdMobActive(false);
          return;
        }

        const adModule = await import('@capacitor-community/admob');
        const BannerAdSize = adModule.BannerAdSize;
        const BannerAdPosition = adModule.BannerAdPosition;
        if (isSaleOpen) {
          await admobRef.current.hideBanner();
        } else {
          // showBanner again instead of resumeBanner (more reliable)
          try {
            await admobRef.current.showBanner({
              adId: admobBannerId,
              adSize: BannerAdSize.ADAPTIVE_BANNER,
              position: BannerAdPosition.TOP_CENTER,
              margin: 0,
              isTesting: false,
            });
            setIsAdMobActive(true);
          } catch (e: any) {
            // already showing, ignore
          }
        }
      } catch (e: any) {
        console.log("Banner toggle error:", e);
      }
    };
    toggleBanner();
  }, [isSaleOpen, isSubscribed, adProvider]);

  // AI-SMART HINGLISH VOICE CASHIER (With Transliteration)
  useEffect(() => {
    const handleVoiceResult = (text: string, isFinal: boolean) => {
      if (!text) return;
      const cleanText = text.toLowerCase().trim();
      const { menuItems: currentMenu } = latestStateRef.current;
      let hasMatchedItem = false;

      const displayTranscript = cleanText.match(/[\u0900-\u097F]/) ? transliterate(cleanText) : cleanText;

      if (isFinal) {
        setVoiceHistory(prev => [displayTranscript, ...prev].slice(0, 5));
        setLiveTranscript("");
      } else {
        setLiveTranscript(displayTranscript);
      }

      // 1. SMART ITEM MATCHING
      currentMenu.forEach(item => {
        const name = item.name.toLowerCase();
        const engVar = [name, name.replace(/er$|s$|els$/g, ""), name.replace(/ /g, "")];
        const hinVar: string[] = ["नूडल्स", "नूडल", "मैगी", "पनीर", "टिक्का", "रोल", "चाय", "टी"];

        const isMatch = engVar.some(v => cleanText.includes(v)) ||
          (name.includes("nood") && (cleanText.includes("नूडल") || cleanText.includes("nood"))) ||
          (name.includes("maggi") && (cleanText.includes("मैगी") || cleanText.includes("maggi"))) ||
          (name.includes("paneer") && (cleanText.includes("पनीर") || cleanText.includes("paneer"))) ||
          (name.includes("tikka") && (cleanText.includes("टिक्का") || cleanText.includes("tikka"))) ||
          (name.includes("roll") && (cleanText.includes("रोल") || cleanText.includes("roll")));

        if (isMatch) {
          hasMatchedItem = true;
          const now = Date.now();
          if (lastAddedRef.current.name === item.name && (now - lastAddedRef.current.time) < 2500) return;

          let qty = 1;
          if (cleanText.match(/do|2|दो/)) qty = 2;
          if (cleanText.match(/teen|3|तीन/)) qty = 3;
          if (cleanText.match(/chaar|4|चार/)) qty = 4;
          if (cleanText.match(/paanch|5|पांच/)) qty = 5;

          for (let i = 0; i < qty; i++) addToCart(item);
          lastAddedRef.current = { name: item.name, time: now };
          setLastMatch(`${qty} x ${item.name}`);
          setVoiceInstruction(`Dala: ${qty} ${item.name} ✅`);
        }
      });

      // 2. SMART NAME DETECTION (Automatic Transliteration)
      if (!hasMatchedItem) {
        if (cleanText.match(/naam|name|bhai|mr|ji|grahak|नाम/)) {
          const namePart = cleanText.split(/naam|name|bhai|mr|ji|grahak|नाम/)[1]?.trim();
          if (namePart && namePart.length > 2) {
            const latinName = namePart.match(/[\u0900-\u097F]/) ? transliterate(namePart) : namePart;
            setNewName(latinName.toUpperCase());
            setVoiceInstruction(`Naam Set: ${latinName.toUpperCase()} ✅`);
          }
        } else if (isFinal && cleanText.split(" ").length <= 3 && cleanText.length > 4) {
          if (!cleanText.match(/[0-9]/) && !cleanText.match(/do|teen|chaar|दो|तीन/)) {
            const latinName = cleanText.match(/[\u0900-\u097F]/) ? transliterate(cleanText) : cleanText;
            setNewName(latinName.toUpperCase());
            setVoiceInstruction(`Naam Set: ${latinName.toUpperCase()} ✅`);
          }
        }
      }

      // 3. MOBILE DETECTION
      const digits = cleanText.replace(/[^0-9]/g, "");
      if (digits.length >= 4) {
        const full = (mobileDigitsRef.current + digits).replace(/[^0-9]/g, "");
        if (full.length >= 10) {
          const validNum = full.slice(-10);
          setNewMobile(validNum);
          setVoiceInstruction(`Number Set: ${validNum} ✅`);
        }
      }

      // 4. Commands
      if (isFinal && (cleanText.includes("next") || cleanText.includes("agla") || cleanText.includes("done") || cleanText.includes("ho gaya"))) {
        setVoicePhase(prev => prev === 'items' ? 'name' : 'mobile');
        setVoiceInstruction("Agla boliye...");
      }
    };

    // Native Bridge Setup
    (window as any).onNativeSpeechResult = (text: string) => handleVoiceResult(text, true);
    (window as any).onNativeSpeechPartial = (text: string) => handleVoiceResult(text, false);

    // Web Speech Setup
    let recognition: any = null;
    if (typeof window !== 'undefined' && !((window as any).NativeSpeech) && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Better for overall capture

      recognition.onstart = () => setVoiceStatus("Listening");
      recognition.onerror = () => setVoiceStatus("Error");
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          handleVoiceResult(event.results[i][0].transcript, event.results[i].isFinal);
        }
      };
      recognition.onend = () => { if (isListening) try { recognition.start(); } catch (e: any) { } };
    }

    if (isListening) {
      if ((window as any).NativeSpeech) {
        setVoiceStatus("Listening");
        (window as any).NativeSpeech.startListening();
      } else if (recognition) {
        try { recognition.start(); } catch (e: any) { }
      }
    }

    return () => {
      if (recognition) try { recognition.stop(); } catch (e: any) { }
      if ((window as any).NativeSpeech) (window as any).NativeSpeech.stopListening();
    };
  }, [isListening]);
  const toggleVoiceBilling = () => {
    if (isListening) {
      if (typeof window !== 'undefined' && (window as any).NativeSpeech) {
        (window as any).NativeSpeech.stopListening();
      } else {
        recognitionRef.current?.stop();
      }
      setIsListening(false);
    } else {
      setVoicePhase('items');
      setVoiceInstruction("Order boliye (e.g. 2 Chai)...");
      setIsListening(true);
      setIsSaleOpen(true);
    }
  };

  useEffect(() => {
    setMounted(true);

    const checkRemoteConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('store_logo')
          .eq('owner_mobile', 'admin_config')
          .single();

        if (data && data.store_logo && data.store_logo.startsWith("JSON_CFG:")) {
          const config = JSON.parse(data.store_logo.substring(9));

          // 1. Maintenance Mode
          if (config.maintenanceMode) {
            setIsMaintenanceActive(true);
            setMaintenanceText(config.maintenanceMessage || "System is under maintenance.");
          }

          // 2. Force Update Version Check
          const minVer = config.forceUpdateMinVersion || "1.5.0";
          const parseVer = (v: string) => v.split('.').map(Number);
          const currentParts = parseVer(APP_VERSION);
          const minParts = parseVer(minVer);
          let isOlder = false;
          for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const minPart = minParts[i] || 0;
            if (currentPart < minPart) {
              isOlder = true;
              break;
            } else if (currentPart > minPart) {
              break;
            }
          }
          if (isOlder) {
            setIsUpdateRequired(true);
            setUpdateStoreUrl(config.forceUpdateLink || "https://play.google.com/store/apps/details?id=com.zainul.instamunimpos");
          }

          // 3. In-App Announcements
          if (config.inAppAlertEnabled) {
            setRemoteAlertEnabled(true);
            setRemoteAlertText(config.inAppAlertMessage || "");
          }

          // 4. Remote Ad Configuration Overrides & Frequency Rate-Limiter
          if (config.adFrequency) setRemoteAdFrequency(config.adFrequency);
          if (config.disableStarterAds !== undefined) setDisableStarterAds(config.disableStarterAds);

          if (config.adsEnabled === false) {
            setAdProvider("none");
          } else if (config.adProvider) {
            setAdProvider(config.adProvider);
            if (config.adProvider === "admob") {
              if (config.admobBannerId) setAdmobBannerId(config.admobBannerId);
              if (config.admobInterstitialId) setAdmobInterstitialId(config.admobInterstitialId);
            } else if (config.adProvider === "web") {
              if (config.webAdScriptUrl) setWebAdScriptUrl(config.webAdScriptUrl);
              if (config.webAdKey) setWebAdKey(config.webAdKey);
              if (config.webAdDirectLink) setWebAdDirectLink(config.webAdDirectLink);
              if (config.webAdVignetteUrl) setWebAdVignetteUrl(config.webAdVignetteUrl);
              if (config.webAdVignetteKey) setWebAdVignetteKey(config.webAdVignetteKey);
            }
          }

          // 5. Play Store 5-Star Rating Booster Banner
          if (config.playStoreBoosterEnabled) {
            setRemotePlayStoreBoosterEnabled(true);
            if (config.playStoreUrl) setRemotePlayStoreUrl(config.playStoreUrl);
          }

          // 6. Targeted Pop-Up Banner Announcement
          if (config.targetedBroadcastEnabled) {
            const myStoreId = localStorage.getItem("saas_store_id") || "";
            if (config.targetStoreId === "ALL" || (myStoreId && config.targetStoreId === myStoreId)) {
              setTargetedBroadcastData({
                title: config.broadcastTitle || "🎉 Announcement",
                message: config.broadcastMessage || "",
                image: config.broadcastImageUrl || "",
                ctaText: config.broadcastCtaText || "OK",
                ctaLink: config.broadcastCtaLink || ""
              });
              setShowTargetedBroadcastModal(true);
            }
          }
        }

        // 7. Check Current Merchant's Specific Remote Flags directly from Supabase
        const myStoreId = localStorage.getItem("saas_store_id");
        const myOwnerMobile = localStorage.getItem("saas_owner_mobile");
        if (myStoreId || myOwnerMobile) {
          const { data: myStore } = await supabase
            .from('stores')
            .select('store_logo')
            .eq(myStoreId ? 'id' : 'owner_mobile', myStoreId || myOwnerMobile)
            .single();

          if (myStore && myStore.store_logo && myStore.store_logo.startsWith("JSON_CFG:")) {
            try {
              const cfg = JSON.parse(myStore.store_logo.substring(9));
              if (typeof cfg.isSuspended === 'boolean') setIsAccountSuspended(cfg.isSuspended);
              if (typeof cfg.voiceCashier === 'boolean') setFlagVoiceCashier(cfg.voiceCashier);
              if (typeof cfg.aiScanner === 'boolean') setFlagAiScanner(cfg.aiScanner);
              if (typeof cfg.buybackTracker === 'boolean') setFlagBuybackTracker(cfg.buybackTracker);
              if (typeof cfg.udhaarKhata === 'boolean') setFlagUdhaarKhata(cfg.udhaarKhata);
              if (typeof cfg.reportsCrm === 'boolean') setFlagReportsCrm(cfg.reportsCrm);
              if (typeof cfg.inventoryMgmt === 'boolean') setFlagInventoryMgmt(cfg.inventoryMgmt);
              if (typeof cfg.gstInvoicing === 'boolean') setFlagGstInvoicing(cfg.gstInvoicing);
            } catch (e) {
              console.warn("Error parsing myStore store_logo:", e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check remote admin config:", err);
      }
    };
    checkRemoteConfig();

    // Unlock Speech Synthesis on first user interaction (critical for Android WebView)
    const unlockSpeech = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance("");
          window.speechSynthesis.speak(utterance);
        } catch (e: any) {
          console.log("Speech unlock error:", e);
        }
      }
      document.removeEventListener("click", unlockSpeech);
      document.removeEventListener("touchstart", unlockSpeech);
    };
    document.addEventListener("click", unlockSpeech);
    document.addEventListener("touchstart", unlockSpeech);

    // Exit Protection Logic
    const handleBackButton = (e: PopStateEvent) => {
      if (isLoggedIn) {
        if (activeTab !== "Dashboard") {
          e.preventDefault();
          setActiveTab("Dashboard");
          window.history.pushState(null, "", window.location.pathname);
        } else {
          const savedName = localStorage.getItem("saas_store_name");
          const savedLogo = localStorage.getItem("saas_store_logo");
          const savedSig = localStorage.getItem("saas_store_signature");
          const savedAddress = localStorage.getItem("saas_store_address");
          const savedPhone = localStorage.getItem("saas_store_phone");
          const savedWebsite = localStorage.getItem("saas_store_website");
          const savedGstin = localStorage.getItem("saas_store_gstin");
          const savedGstEnabled = localStorage.getItem("saas_gst_enabled");
          const savedGstRate = localStorage.getItem("saas_gst_rate");
          const savedRent = localStorage.getItem("saas_monthly_rent");
          const savedUpiId = localStorage.getItem("saas_store_upi_id");
          const savedUpiName = localStorage.getItem("saas_store_upi_name");

          if (savedName) setRestaurantName(savedName);
          if (savedLogo) setStoreLogo(savedLogo);
          if (savedSig) setStoreSignature(savedSig);
          if (savedAddress) setStoreAddress(savedAddress);
          if (savedPhone) setStorePhone(savedPhone);
          if (savedWebsite) setStoreWebsite(savedWebsite);
          if (savedGstin) setStoreGstin(savedGstin);
          if (savedGstEnabled !== null) setIsGstEnabled(savedGstEnabled === "true");
          if (savedGstRate !== null) setGstRate(Number(savedGstRate));
          if (savedRent) setMonthlyRent(Number(savedRent));
          if (savedUpiId) setStoreUpiId(savedUpiId);
          if (savedUpiName) setStoreUpiName(savedUpiName);
          setShowExitDialog(true);
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    };

    // Load remembered credentials
    const savedMobile = localStorage.getItem("saas_rem_mobile");
    const savedPass = localStorage.getItem("saas_rem_pass");
    if (savedMobile && savedPass) {
      setLoginMobile(savedMobile);
      setLoginPassword(savedPass);
      setRememberMe(true);
    }

    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    const savedIsLoggedIn = localStorage.getItem("saas_is_logged_in");
    const savedOwnerMobile = localStorage.getItem("saas_owner_mobile");

    // Also check native Preferences (survives app restart on Android)
    const checkNativeSession = async () => {
      try {

        if (Capacitor.isNativePlatform()) {

          const { value: nativeLoggedIn } = await Preferences.get({ key: 'saas_is_logged_in' });
          const { value: nativeMobile } = await Preferences.get({ key: 'saas_owner_mobile' });
          if (nativeLoggedIn === 'true' && nativeMobile) {
            // Restore to localStorage too
            localStorage.setItem('saas_is_logged_in', 'true');
            localStorage.setItem('saas_owner_mobile', nativeMobile);
            setIsLoggedIn(true);
            setOwnerMobile(nativeMobile);
            const savedBType = localStorage.getItem('saas_business_type');
            if (savedBType) setBusinessType(savedBType);
            const savedLogo = localStorage.getItem('saas_store_logo');
            if (savedLogo) setStoreLogo(savedLogo);
            const savedName = localStorage.getItem('saas_store_name');
            if (savedName) setRestaurantName(savedName);
            const savedRent = localStorage.getItem('saas_monthly_rent');
            if (savedRent) setMonthlyRent(Number(savedRent));
            const savedSwiggy = localStorage.getItem('saas_swiggy_comm');
            if (savedSwiggy) setSwiggyCommission(Number(savedSwiggy));
            const savedSwiggyType = localStorage.getItem('saas_swiggy_comm_type');
            if (savedSwiggyType) setSwiggyCommType(savedSwiggyType);
            const savedZomato = localStorage.getItem('saas_zomato_comm');
            if (savedZomato) setZomatoCommission(Number(savedZomato));
            const savedZomatoType = localStorage.getItem('saas_zomato_comm_type');
            if (savedZomatoType) setZomatoCommType(savedZomatoType);
            const savedUpiId = localStorage.getItem('saas_store_upi_id');
            if (savedUpiId) setStoreUpiId(savedUpiId);
            const savedUpiName = localStorage.getItem('saas_store_upi_name');
            if (savedUpiName) setStoreUpiName(savedUpiName);
            const savedAddress = localStorage.getItem("saas_store_address");
            if (savedAddress) setStoreAddress(savedAddress);
            const savedPhone = localStorage.getItem("saas_store_phone");
            if (savedPhone) setStorePhone(savedPhone);
            const savedWebsite = localStorage.getItem("saas_store_website");
            if (savedWebsite) setStoreWebsite(savedWebsite);
            const savedGstin = localStorage.getItem("saas_store_gstin");
            if (savedGstin) setStoreGstin(savedGstin);
            const savedGstEnabled = localStorage.getItem("saas_gst_enabled");
            if (savedGstEnabled !== null) setIsGstEnabled(savedGstEnabled === "true");
            const savedGstRate = localStorage.getItem("saas_gst_rate");
            if (savedGstRate !== null) setGstRate(Number(savedGstRate));
            // Auto-fetch from cloud
            const { data } = await supabase.from('stores').select('*').eq('owner_mobile', nativeMobile).single();
            if (data) {
              setRestaurantName(data.store_name);
              setMonthlyRent(data.monthly_rent || 0);
              setStoreCreatedAt(data.created_at);
              setSubscriptionExpiry(data.subscription_expiry);
              localStorage.setItem('saas_store_created_at', data.created_at || '');
              localStorage.setItem('saas_store_expiry', data.subscription_expiry || '');
              const storeBType = data.business_type || localStorage.getItem("saas_business_type") || "Restaurant/Cafe";
              setBusinessType(storeBType);
              localStorage.setItem("saas_business_type", storeBType);
              await fetchStoreData(data.id);
            }
          }
        }
      } catch (e: any) {
        console.log('Native preferences check failed:', e);
      }
    };

    if (savedIsLoggedIn === "true") {
      setIsLoggedIn(true);
      if (savedOwnerMobile) {
        setOwnerMobile(savedOwnerMobile);

        // Restore local settings immediately for UX
        const savedBType = localStorage.getItem("saas_business_type");
        if (savedBType) setBusinessType(savedBType);
        const savedLogo = localStorage.getItem("saas_store_logo");
        if (savedLogo) setStoreLogo(savedLogo);
        const savedName = localStorage.getItem("saas_store_name");
        if (savedName) setRestaurantName(savedName);
        const savedRent = localStorage.getItem("saas_monthly_rent");
        if (savedRent) setMonthlyRent(Number(savedRent));
        const savedSwiggy = localStorage.getItem("saas_swiggy_comm");
        if (savedSwiggy) setSwiggyCommission(Number(savedSwiggy));
        const savedSwiggyType = localStorage.getItem("saas_swiggy_comm_type");
        if (savedSwiggyType) setSwiggyCommType(savedSwiggyType);

        const savedZomato = localStorage.getItem("saas_zomato_comm");
        if (savedZomato) setZomatoCommission(Number(savedZomato));
        const savedZomatoType = localStorage.getItem("saas_zomato_comm_type");
        if (savedZomatoType) setZomatoCommType(savedZomatoType);
        const savedUpiId = localStorage.getItem("saas_store_upi_id");
        if (savedUpiId) setStoreUpiId(savedUpiId);
        const savedUpiName = localStorage.getItem("saas_store_upi_name");
        if (savedUpiName) setStoreUpiName(savedUpiName);
        const savedAddress = localStorage.getItem("saas_store_address");
        if (savedAddress) setStoreAddress(savedAddress);
        const savedPhone = localStorage.getItem("saas_store_phone");
        if (savedPhone) setStorePhone(savedPhone);
        const savedWebsite = localStorage.getItem("saas_store_website");
        if (savedWebsite) setStoreWebsite(savedWebsite);
        const savedGstin = localStorage.getItem("saas_store_gstin");
        if (savedGstin) setStoreGstin(savedGstin);
        const savedGstEnabled = localStorage.getItem("saas_gst_enabled");
        if (savedGstEnabled !== null) setIsGstEnabled(savedGstEnabled === "true");
        const savedGstRate = localStorage.getItem("saas_gst_rate");
        if (savedGstRate !== null) setGstRate(Number(savedGstRate));
        // Auto-fetch from cloud for existing sessions
        const autoSync = async () => {
          const { data } = await supabase.from('stores').select('*').eq('owner_mobile', savedOwnerMobile).single();
          if (data) {
            setCurrentStoreId(data.id);
            setRestaurantName(data.store_name);
            setMonthlyRent(data.monthly_rent || 0);
            setStoreCreatedAt(data.created_at);
            setSubscriptionExpiry(data.subscription_expiry);
            localStorage.setItem("saas_store_created_at", data.created_at || "");
            localStorage.setItem("saas_store_expiry", data.subscription_expiry || "");
            const storeBType = data.business_type || localStorage.getItem("saas_business_type") || "Restaurant/Cafe";
            setBusinessType(storeBType);
            localStorage.setItem("saas_business_type", storeBType);
            await fetchStoreData(data.id);
          }
        };
        autoSync();
      }
    } else {
      // localStorage not found, check native storage (app restart case)
      checkNativeSession();
    }

    const savedSales = localStorage.getItem("saas_sales");
    if (savedSales) {
      try {
        setSales(JSON.parse(savedSales).map((s: any) => {
          // Parse commission from items if present
          const commMatch = s.items?.match(/\[COMM:(\d+(\.\d+)?)\]/);
          const commission = commMatch ? Number(commMatch[1]) : (s.commission || 0);
          return { ...s, date: new Date(s.date), commission };
        }));
      } catch (e: any) { console.error(e); }
    }

    const savedExpenses = localStorage.getItem("saas_expenses");
    if (savedExpenses) { try { setExpenses(JSON.parse(savedExpenses).map((e: any) => ({ ...e, date: new Date(e.date) }))); } catch (e: any) { console.error(e); } }

    const savedMenu = localStorage.getItem("saas_menu");
    if (savedMenu) { try { setMenuItems(JSON.parse(savedMenu)); } catch (e: any) { console.error(e); } }

    const savedRestName = localStorage.getItem("saas_rest_name");
    if (savedRestName) setRestaurantName(savedRestName);

    const savedBType = localStorage.getItem("saas_business_type");
    if (savedBType) setBusinessType(savedBType);

    const savedRent = localStorage.getItem("saas_rent");
    if (savedRent) setMonthlyRent(Number(savedRent));

    const savedDarkMode = localStorage.getItem("saas_dark_mode");
    if (savedDarkMode) setIsDarkMode(savedDarkMode === "true");

    const savedPrinter = localStorage.getItem("saas_thermal_printer");
    if (savedPrinter) setIsThermalPrinterEnabled(savedPrinter === "true");

    const savedVoiceEnabled = localStorage.getItem("saas_voice_enabled");
    if (savedVoiceEnabled) setIsVoiceAnnouncerEnabled(savedVoiceEnabled === "true");

    const savedVoiceLang = localStorage.getItem("saas_voice_lang");
    if (savedVoiceLang) setVoiceAnnouncerLanguage(savedVoiceLang);

    const savedUiLang = localStorage.getItem("saas_ui_lang");
    if (savedUiLang) setLang(savedUiLang);

    const savedAdProvider = localStorage.getItem("saas_ad_provider");
    if (savedAdProvider) {
      setAdProvider(savedAdProvider as any);
    } else {
      // Auto-select: Native Android App starts with AdMob (best revenue); Web browsers start with Web Ads (Monetag)
      try {
        if (Capacitor.isNativePlatform()) {
          setAdProvider("admob");
        } else {
          setAdProvider("web");
        }
      } catch (e: any) {
        setAdProvider("web");
      }
    }
    const savedAdScript = localStorage.getItem("saas_web_ad_script");
    if (savedAdScript) {
      setWebAdScriptUrl(savedAdScript);
    } else {
      setWebAdScriptUrl("https://nap5k.com/tag.min.js");
    }
    const savedAdKey = localStorage.getItem("saas_web_ad_key");
    if (savedAdKey) {
      setWebAdKey(savedAdKey);
    } else {
      setWebAdKey("11070941");
    }
    const savedAdDirectLink = localStorage.getItem("saas_web_ad_direct_link");
    if (savedAdDirectLink) {
      setWebAdDirectLink(savedAdDirectLink);
    } else {
      setWebAdDirectLink("https://omg10.com/4/11071013");
    }
    const savedAdVignetteUrl = localStorage.getItem("saas_web_ad_vignette_url");
    if (savedAdVignetteUrl) {
      setWebAdVignetteUrl(savedAdVignetteUrl);
    } else {
      setWebAdVignetteUrl("https://n6wxm.com/vignette.min.js");
    }
    const savedAdVignetteKey = localStorage.getItem("saas_web_ad_vignette_key");
    if (savedAdVignetteKey) {
      setWebAdVignetteKey(savedAdVignetteKey);
    } else {
      setWebAdVignetteKey("11076598");
    }

    setDataLoaded(true);

    return () => window.removeEventListener("popstate", handleBackButton);
  }, [isLoggedIn, activeTab]);

  // 10 MINUTE INACTIVITY BACKGROUND AUTO-LOGOUT
  useEffect(() => {
    let appStateListener: any;

    const checkInactivity = () => {
      const savedIsLoggedIn = localStorage.getItem("saas_is_logged_in");
      if (savedIsLoggedIn === "true") {
        const inactiveTimeStr = localStorage.getItem("saas_inactive_timestamp");
        if (inactiveTimeStr) {
          const inactiveTime = parseInt(inactiveTimeStr, 10);
          if (!isNaN(inactiveTime)) {
            const elapsedMs = Date.now() - inactiveTime;
            const elapsedMins = elapsedMs / (1000 * 60);
            if (elapsedMins >= 10) {
              console.log("Inactivity detected: >= 10 mins. Logging out...");
              handleLogout();
            }
          }
        }
      }
      localStorage.removeItem("saas_inactive_timestamp");
    };

    checkInactivity();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem("saas_inactive_timestamp", Date.now().toString());
      } else {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const initAppStateListener = async () => {
      try {

        appStateListener = await App.addListener('appStateChange', (state) => {
          if (!state.isActive) {
            localStorage.setItem("saas_inactive_timestamp", Date.now().toString());
          } else {
            checkInactivity();
          }
        });
      } catch (e: any) {
        console.log("Capacitor App state listener skipped.");
      }
    };
    initAppStateListener();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (dataLoaded && mounted) {
      localStorage.setItem("saas_sales", JSON.stringify(sales));
      localStorage.setItem("saas_expenses", JSON.stringify(expenses));
      localStorage.setItem("saas_menu", JSON.stringify(menuItems));
      localStorage.setItem("saas_rest_name", restaurantName);
      localStorage.setItem("saas_rent", monthlyRent.toString());
      localStorage.setItem("saas_dark_mode", isDarkMode.toString());
      localStorage.setItem("saas_thermal_printer", isThermalPrinterEnabled.toString());
      localStorage.setItem("saas_voice_enabled", isVoiceAnnouncerEnabled.toString());
      localStorage.setItem("saas_voice_lang", voiceAnnouncerLanguage);
      localStorage.setItem("saas_ui_lang", lang);
      localStorage.setItem("saas_ad_provider", adProvider);
      localStorage.setItem("saas_web_ad_script", webAdScriptUrl);
      localStorage.setItem("saas_web_ad_key", webAdKey);
      localStorage.setItem("saas_web_ad_direct_link", webAdDirectLink);
      localStorage.setItem("saas_web_ad_vignette_url", webAdVignetteUrl);
      localStorage.setItem("saas_web_ad_vignette_key", webAdVignetteKey);
      localStorage.setItem("saas_business_type", businessType);
      if (storeCreatedAt) localStorage.setItem("saas_store_created_at", storeCreatedAt);
      if (subscriptionExpiry) localStorage.setItem("saas_store_expiry", subscriptionExpiry);
    }
  }, [sales, expenses, menuItems, restaurantName, monthlyRent, isDarkMode, dataLoaded, mounted, adProvider, webAdScriptUrl, webAdKey, webAdDirectLink, webAdVignetteUrl, webAdVignetteKey, isThermalPrinterEnabled, isVoiceAnnouncerEnabled, voiceAnnouncerLanguage, lang, businessType]);

  // Auto-default new item category when business type changes
  useEffect(() => {
    const cats = getLabels(businessType).categories;
    if (cats && cats.length > 0) {
      setNewItemCategory(cats[0]);
    } else {
      setNewItemCategory("General");
    }
  }, [businessType]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    // Smart cache clearing: Only wipe settings if logging into a DIFFERENT account
    const lastMobile = localStorage.getItem("saas_owner_mobile");
    if (lastMobile && lastMobile !== loginMobile) {
      console.log("Different merchant logging in. Clearing device settings cache...");
      clearStoreCache();
    }

    // 1. Immediate navigator connection check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoginError("Connection failed. Check internet.");
      setIsLoading(false);
      return;
    }

    if (authMode === "signup" && !acceptTerms) {
      setLoginError("Please accept Privacy Policy & Terms of Service to register.");
      setIsLoading(false);
      return;
    }

    try {
      if (authMode === "login") {
        const { data, error } = await supabase
          .rpc('verify_store_login', {
            mobile: loginMobile,
            input_pass: loginPassword
          });

        if (error) {
          const errMsg = (error as any).message || "";
          if (errMsg.toLowerCase().includes("fetch") || errMsg.toLowerCase().includes("network") || (error as any).status === 0) {
            setLoginError("Connection failed. Check internet.");
          } else {
            setLoginError("Invalid mobile number or password.");
          }
        } else if (!data || data.length === 0) {
          setLoginError("Invalid mobile number or password.");
        } else {
          const storeData = data[0];
          // Success Login
          setIsLoggedIn(true);
          trackEvent("app_login", { owner_mobile: loginMobile, store_name: storeData.store_name });
          setOwnerMobile(loginMobile);
          setRestaurantName(storeData.store_name);
          setMonthlyRent(storeData.monthly_rent || 0);
          const storeBType = storeData.business_type || localStorage.getItem("saas_business_type") || "Restaurant/Cafe";
          setBusinessType(storeBType);
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);
          localStorage.setItem("saas_business_type", storeBType);
          // Save to native Preferences for app restart persistence
          try {

            if (Capacitor.isNativePlatform()) {

              await Preferences.set({ key: 'saas_is_logged_in', value: 'true' });
              await Preferences.set({ key: 'saas_owner_mobile', value: loginMobile });
            }
          } catch (e: any) { console.log('Preferences save error:', e); }

          if (rememberMe) {
            localStorage.setItem("saas_rem_mobile", loginMobile);
            localStorage.setItem("saas_rem_pass", loginPassword);
          } else {
            localStorage.removeItem("saas_rem_mobile");
            localStorage.removeItem("saas_rem_pass");
          }

          setStoreCreatedAt(storeData.created_at);
          setSubscriptionExpiry(storeData.subscription_expiry);
          localStorage.setItem("saas_store_created_at", storeData.created_at || "");
          localStorage.setItem("saas_store_expiry", storeData.subscription_expiry || "");

          await fetchStoreData(storeData.id);

          // Send Discord Alert for Merchant Login / Session Active
          sendDiscordAlert(
            "🔑 Merchant Logged In / App Opened",
            `Merchant **${storeData.store_name}** has logged into InstaMunim POS.`,
            [
              { name: "Store Name", value: storeData.store_name || "N/A", inline: true },
              { name: "Owner Mobile", value: storeData.owner_mobile || "N/A", inline: true },
              { name: "Store ID", value: String(storeData.id), inline: true }
            ],
            3447003
          );
        }
      } else {
        // Create initial config JSON packet to store in database store_logo column
        const defaultSettings = {
          upiId: "",
          upiName: "",
          logo: "",
          address: "",
          phone: "",
          website: "",
          gstin: "",
          gstEnabled: false,
          gstRate: 0,
          swiggyComm: 0,
          swiggyCommType: "Percentage",
          zomatoComm: 0,
          zomatoCommType: "Percentage",
          businessType: signupBusinessType || "Restaurant/Cafe",
          thermalPrinter: false,
          voiceEnabled: false,
          voiceLang: "en",
          lang: "en"
        };
        const initialLogoVal = "JSON_CFG:" + JSON.stringify(defaultSettings);

        // Signup
        let insertResult = await supabase
          .from('stores')
          .insert([{
            owner_mobile: loginMobile,
            store_name: signupStoreName,
            password: loginPassword,
            business_type: signupBusinessType,
            store_logo: initialLogoVal
          }])
          .select()
          .single();

        if (insertResult.error) {
          console.warn("Primary signup insert failed, retrying fallback without business_type column:", insertResult.error);
          insertResult = await supabase
            .from('stores')
            .insert([{
              owner_mobile: loginMobile,
              store_name: signupStoreName,
              password: loginPassword,
              store_logo: initialLogoVal
            }])
            .select()
            .single();
        }

        const { data, error } = insertResult;

        if (error) {
          const errMsg = (error as any).message || "";
          if (errMsg.toLowerCase().includes("fetch") || errMsg.toLowerCase().includes("network") || (error as any).status === 0) {
            setLoginError("Connection failed. Check internet.");
          } else {
            setLoginError("Mobile already registered or error occurred.");
          }
        } else {
          // Send Discord Notification for new Merchant Signup
          sendDiscordAlert(
            "🏪 New Merchant Registered / Store Created!",
            "A new merchant has just registered on InstaMunim POS App.",
            [
              { name: "Store Name", value: signupStoreName || "N/A", inline: true },
              { name: "Owner Mobile", value: loginMobile || "N/A", inline: true },
              { name: "Business Type", value: signupBusinessType || "Restaurant/Cafe", inline: true },
              { name: "Store ID", value: data.id ? String(data.id) : "N/A", inline: true }
            ],
            15844367
          );

          // Seed presets based on the selected business type
          const categoryPresets = BUSINESS_CATEGORIES[signupBusinessType]?.presets || [];
          if (categoryPresets.length > 0) {
            const menuItemsToInsert = categoryPresets.map(preset => ({
              store_id: data.id,
              name: preset.name,
              price: preset.price,
              category: "General"
            }));
            await supabase.from('menu_items').insert(menuItemsToInsert);
          }

          setIsLoggedIn(true);
          trackEvent("store_registration", { store_name: signupStoreName, owner_mobile: loginMobile, business_type: signupBusinessType });
          setOwnerMobile(loginMobile);
          setRestaurantName(signupStoreName);
          setBusinessType(signupBusinessType);
          setStoreCreatedAt(data.created_at);
          setSubscriptionExpiry(data.subscription_expiry);
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);
          localStorage.setItem("saas_business_type", signupBusinessType);
          localStorage.setItem("saas_store_created_at", data.created_at || "");
          localStorage.setItem("saas_store_expiry", data.subscription_expiry || "");

          await fetchStoreData(data.id);
        }
      }
    } catch (err: any) {
      setLoginError("Connection failed. Check internet.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreData = async (storeId: string) => {
    setIsSyncing(true);
    setCurrentStoreId(storeId);
    try {
      // Fetch all data in parallel for maximum speed
      const [
        { data: storeInfo },
        { data: salesData },
        { data: expData },
        { data: menuData }
      ] = await Promise.all([
        supabase.from('stores').select('*').eq('id', storeId).single(),
        supabase.from('sales').select('*').eq('store_id', storeId).order('sale_date', { ascending: false }),
        supabase.from('expenses').select('*').eq('store_id', storeId).order('expense_date', { ascending: false }),
        supabase.from('menu_items').select('*').eq('store_id', storeId)
      ]);

      // 0. Update Store Profile Info
      if (storeInfo) {
        setRestaurantName(storeInfo.store_name || storeInfo.name || localStorage.getItem("saas_store_name") || "");

        // Smart fallback category detection for legacy users with store_logo = null
        let detectedBusinessType = storeInfo.business_type || localStorage.getItem("saas_business_type");
        if (!detectedBusinessType && menuData && menuData.length > 0) {
          const hasMobile = menuData.some(item =>
            item.name.toLowerCase().includes("iphone") ||
            item.name.toLowerCase().includes("vivo") ||
            item.name.toLowerCase().includes("charger") ||
            item.name.toLowerCase().includes("airdopes")
          );
          if (hasMobile) {
            detectedBusinessType = "Mobile/Electronics";
          } else {
            const hasKirana = menuData.some(item =>
              item.name.toLowerCase().includes("oil") ||
              item.name.toLowerCase().includes("rice") ||
              item.name.toLowerCase().includes("salt") ||
              item.name.toLowerCase().includes("maggi")
            );
            if (hasKirana) {
              detectedBusinessType = "Kirana/Grocery";
            } else {
              const hasSaloon = menuData.some(item =>
                item.name.toLowerCase().includes("haircut") ||
                item.name.toLowerCase().includes("beard") ||
                item.name.toLowerCase().includes("massage")
              );
              if (hasSaloon) detectedBusinessType = "Saloon/Spa";
            }
          }
        }

        const storeBType = detectedBusinessType || "Restaurant/Cafe";
        setBusinessType(storeBType);
        localStorage.setItem("saas_business_type", storeBType);

        const cloudLogo = storeInfo.logo || storeInfo.store_logo || storeInfo.image || "";
        if (cloudLogo.startsWith('JSON_CFG:')) {
          try {
            const settingsPacket = JSON.parse(cloudLogo.substring(9));

            // Hydrate React States from DB
            if (settingsPacket.upiId !== undefined) setStoreUpiId(settingsPacket.upiId);
            if (settingsPacket.upiName !== undefined) setStoreUpiName(settingsPacket.upiName);
            if (settingsPacket.logo !== undefined) setStoreLogo(settingsPacket.logo);
            if (settingsPacket.signature !== undefined) {
              setStoreSignature(settingsPacket.signature);
              localStorage.setItem("saas_store_signature", settingsPacket.signature);
            }
            if (settingsPacket.address !== undefined) setStoreAddress(settingsPacket.address);
            if (settingsPacket.phone !== undefined) setStorePhone(settingsPacket.phone);
            if (settingsPacket.website !== undefined) setStoreWebsite(settingsPacket.website);
            if (settingsPacket.gstin !== undefined) setStoreGstin(settingsPacket.gstin);
            if (settingsPacket.gstEnabled !== undefined) setIsGstEnabled(settingsPacket.gstEnabled);
            if (settingsPacket.gstRate !== undefined) setGstRate(settingsPacket.gstRate);
            if (settingsPacket.swiggyComm !== undefined) setSwiggyCommission(settingsPacket.swiggyComm);
            if (settingsPacket.swiggyCommType !== undefined) setSwiggyCommType(settingsPacket.swiggyCommType);
            if (settingsPacket.zomatoComm !== undefined) setZomatoCommission(settingsPacket.zomatoComm);
            if (settingsPacket.zomatoCommType !== undefined) setZomatoCommType(settingsPacket.zomatoCommType);
            if (settingsPacket.businessType !== undefined) {
              setBusinessType(settingsPacket.businessType);
              localStorage.setItem("saas_business_type", settingsPacket.businessType);
            }
            if (settingsPacket.thermalPrinter !== undefined) setIsThermalPrinterEnabled(settingsPacket.thermalPrinter);
            if (settingsPacket.voiceEnabled !== undefined) setIsVoiceAnnouncerEnabled(settingsPacket.voiceEnabled);
            if (settingsPacket.voiceLang !== undefined) setVoiceAnnouncerLanguage(settingsPacket.voiceLang);
            if (settingsPacket.lang !== undefined) setLang(settingsPacket.lang);

            // Hydrate Super Admin Remote Flags
            if (settingsPacket.isSuspended === true) setIsAccountSuspended(true);
            if (typeof settingsPacket.voiceCashier === 'boolean') setFlagVoiceCashier(settingsPacket.voiceCashier);
            if (typeof settingsPacket.aiScanner === 'boolean') setFlagAiScanner(settingsPacket.aiScanner);
            if (typeof settingsPacket.buybackTracker === 'boolean') setFlagBuybackTracker(settingsPacket.buybackTracker);
            if (typeof settingsPacket.udhaarKhata === 'boolean') setFlagUdhaarKhata(settingsPacket.udhaarKhata);
            if (typeof settingsPacket.reportsCrm === 'boolean') setFlagReportsCrm(settingsPacket.reportsCrm);
            if (typeof settingsPacket.inventoryMgmt === 'boolean') setFlagInventoryMgmt(settingsPacket.inventoryMgmt);
            if (typeof settingsPacket.gstInvoicing === 'boolean') setFlagGstInvoicing(settingsPacket.gstInvoicing);

            // Hydrate LocalStorage from DB
            localStorage.setItem("saas_store_upi_id", settingsPacket.upiId || "");
            localStorage.setItem("saas_store_upi_name", settingsPacket.upiName || "");
            localStorage.setItem("saas_store_logo", settingsPacket.logo || "");
            localStorage.setItem("saas_store_address", settingsPacket.address || "");
            localStorage.setItem("saas_store_phone", settingsPacket.phone || "");
            localStorage.setItem("saas_store_website", settingsPacket.website || "");
            localStorage.setItem("saas_store_gstin", settingsPacket.gstin || "");
            localStorage.setItem("saas_gst_enabled", String(settingsPacket.gstEnabled));
            localStorage.setItem("saas_gst_rate", String(settingsPacket.gstRate));
            localStorage.setItem("saas_swiggy_comm", String(settingsPacket.swiggyComm));
            localStorage.setItem("saas_swiggy_comm_type", settingsPacket.swiggyCommType || "Percentage");
            localStorage.setItem("saas_zomato_comm", String(settingsPacket.zomatoComm));
            localStorage.setItem("saas_zomato_comm_type", settingsPacket.zomatoCommType || "Percentage");
            localStorage.setItem("saas_thermal_printer", String(settingsPacket.thermalPrinter));
            localStorage.setItem("saas_voice_enabled", String(settingsPacket.voiceEnabled));
            localStorage.setItem("saas_voice_lang", settingsPacket.voiceLang || "en");
            localStorage.setItem("saas_ui_lang", settingsPacket.lang || "en");
          } catch (e: any) {
            console.error("Failed to parse settings JSON config packet:", e);
          }
        } else if (cloudLogo.includes('|')) {
          const parts = cloudLogo.split('|');
          const upiId = parts[0] || "";
          const upiName = parts[1] || "";
          const logo = parts[2] || "";

          setStoreUpiId(upiId);
          setStoreUpiName(upiName);
          setStoreLogo(logo);
          localStorage.setItem("saas_store_upi_id", upiId);
          localStorage.setItem("saas_store_upi_name", upiName);
          localStorage.setItem("saas_store_logo", logo);
        } else {
          if (cloudLogo) {
            setStoreLogo(cloudLogo);
            localStorage.setItem("saas_store_logo", cloudLogo);
          } else {
            const localLogo = localStorage.getItem("saas_store_logo");
            if (localLogo) setStoreLogo(localLogo);
          }
        }

        setMonthlyRent(storeInfo.monthly_rent || storeInfo.rent || Number(localStorage.getItem("saas_monthly_rent")) || 0);
        setSwiggyCommission(storeInfo.swiggy_commission || Number(localStorage.getItem("saas_swiggy_comm")) || 0);
        setZomatoCommission(storeInfo.zomato_commission || Number(localStorage.getItem("saas_zomato_comm")) || 0);

        setStoreCreatedAt(storeInfo.created_at);
        setSubscriptionExpiry(storeInfo.subscription_expiry);
        localStorage.setItem("saas_store_created_at", storeInfo.created_at || "");
        localStorage.setItem("saas_store_expiry", storeInfo.subscription_expiry || "");
      }

      // 1. Update Sales
      if (salesData) {
        setSales(salesData.map((s: any) => {
          const commMatch = s.items?.match(/\[COMM:(\d+(\.\d+)?)\]/);
          const commission = commMatch ? Number(commMatch[1]) : 0;
          return {
            id: s.id,
            name: s.customer_name,
            item: s.items?.replace(/\[COMM:(\d+(\.\d+)?)\]/, "").trim(),
            mobile: s.mobile,
            price: s.total_price,
            type: s.payment_type,
            date: new Date(s.sale_date),
            commission: commission
          };
        }));
      } else {
        setSales([]);
      }

      // 2. Update Expenses
      setExpenses(expData ? expData.map(e => ({
        id: e.id, title: e.title, amount: e.amount, date: new Date(e.expense_date)
      })) : []);

      // 3. Update Menu
      setMenuItems(menuData ? menuData.map(m => ({
        id: m.id, name: m.name, price: m.price, category: m.category
      })) : []);

      // 4. Fetch Enquiries safely
      try {
        const { data: enquiriesData, error: enquiriesError } = await supabase
          .from('enquiries')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });
        if (enquiriesError) throw enquiriesError;
        setEnquiries(enquiriesData || []);
      } catch (enqErr: any) {
        console.warn("Supabase enquiries fetching failed, reading from localStorage fallback:", enqErr);
        const localEnq = localStorage.getItem(`saas_enquiries_${storeId}`);
        if (localEnq) {
          setEnquiries(JSON.parse(localEnq));
        } else {
          setEnquiries([]);
        }
      }

      // Fetch Gemini API Key from app_config
      const { data: configData } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .single();
      if (configData?.value) setGeminiApiKey(configData.value);

      setSyncStatus("synced");
    } catch (err: any) {
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllData = async () => {
    setIsSyncing(true);
    try {
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (store) {
          storeId = store.id;
          setCurrentStoreId(store.id);
        }
      }
      if (storeId) {
        const getVoicePartnerName = (t: string, langCode: string) => {
          if (t === "Online") {
            return { hi: "ऑनलाइन", mr: "ऑनलाइन", gu: "ઓનલાઇન", bn: "অনলাইন", pa: "ਆਨਲਾਈਨ", ta: "ஆன்லைன்", te: "ఆన్‌లైన్", kn: "ಆನ್‌ಲೈನ್", ml: "ഓൺലൈൻ" }[langCode] || "Online";
          }
          if (t === "Swiggy") {
            if (businessType === "Mobile/Electronics") {
              return { hi: "अमेज़न", mr: "अमेझॉन", gu: "એમેઝોન", bn: "আমাজন", pa: "ਅਮੇਜ਼ਨ", ta: "அமேசான்", te: "అమెజాన్", kn: "ಅಮೆಜಾನ್", ml: "ആമസോൺ" }[langCode] || "Amazon";
            }
            if (businessType === "Kirana/Grocery") {
              return { hi: "ब्लिंकिट", mr: "ब्लिंकिट", gu: "બ્લિંકિટ", bn: "ব্লিনকিট", pa: "ਬਲਿੰਕਿਟ", ta: "பிலிங்கிட்", te: "బ్లింకిట్", kn: "ಬ್ಲಿಂಕಿಟ್", ml: "ಬಂಡಾರ" }[langCode] || "Blinkit";
            }
            return { hi: "स्वीगी", mr: "स्वीगी", gu: "સ્વીગી", bn: "সুইগি", pa: "ਸਵਿਗੀ", ta: "ஸ்விக்கி", te: "స్విగ్గీ", kn: "ಸ್ವಿಗ್ಗಿ", ml: "സ്വിഗ്ഗി" }[langCode] || "Swiggy";
          }
          if (t === "Zomato") {
            if (businessType === "Mobile/Electronics") {
              return { hi: "फ्लिपकार्ट", mr: "फ्लिपकार्ट", gu: "ફ્લિપકાર્ટ", bn: "ফ্লিপকার্ট", pa: "ਫਲਿੱਪਕਾਰਟ", ta: "பிளிப்கார்ட்", te: "ఫ్లిప్‌కార్ట్", kn: "ಫ್ಲಿಪ್‌ಕಾರ್ಟ್", ml: "ഫ്ലിപ്കാർട്ട്" }[langCode] || "Flipkart";
            }
            if (businessType === "Kirana/Grocery") {
              return { hi: "ઝેપ્ટો", mr: "झेप्टो", gu: "ઝેપ્ટો", bn: "জেপ্টো", pa: "ਜ਼ੈਪટો", ta: "ஜெப்டோ", te: "జెప్టో", kn: "ಜೆಪ್ಟೋ", ml: "സെപ്റ്റോ" }[langCode] || "Zepto";
            }
            return { hi: "ज़ोमैटो", mr: "झोमॅटो", gu: "ઝોમેટો", bn: "조ম্যাটো", pa: "ਜ਼ੋਮੈટો", ta: "சொமாட்டோ", te: "జొమాటో", kn: "ಝೊಮ್ಯಾಟೊ", ml: "സൊമാറ്റോ" }[langCode] || "Zomato";
          }
          return { hi: "कैश", mr: "कॅश", gu: "કેશ", bn: "ক্যাশ", pa: "ਕੈਸ਼", ta: "ரொக்கமாக", te: "నగదు", kn: "ನಗದು", ml: "പണമായി" }[langCode] || "Cash";
        };
        await fetchStoreData(storeId);
        setLastSyncedTime(format(new Date(), "hh:mm:ss aa"));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const generateAIInsight = () => {
    setIsAIDialogOpen(true);
    setAiInsightText("Analyzing your business data... 🧠");

    const outOfStockCount = menuItems.filter(i => (i.stock || 0) === 0).length;
    const totalUdhaarAmt = sales.filter(s => s.type === "Udhaar").reduce((sum, s) => sum + s.price, 0);
    const totalExpensesAmt = expenses.reduce((sum, e) => sum + e.amount, 0);

    setTimeout(() => {
      let insight = "";
      // Only show inventory advice if actually used
      const isInventoryUsed = menuItems.some(i => (i.stock || 0) > 0);

      if (filteredSales.length === 0) {
        insight = "Bhai, aaj abhi tak koi sale nahi hui hai. Ek 'Combo Offer' banaiye aur WhatsApp par share kijiye! 🚀";
      } else if (isInventoryUsed && outOfStockCount > 0) {
        insight = `Aapke ${outOfStockCount} items out of stock hain. Inhe refill kijiye sale badhane ke liye! 📦`;
      } else if (totalUdhaarAmt > 2000) {
        insight = `Udhaar ₹${totalUdhaarAmt} ho gaya hai. Aaj recovery ka din banaiye! 💸`;
      } else {
        insight = "Business badhiya chal raha hai! Naye items add karke list ko fresh rakhiye. ✨";
      }
      setAiInsightText(insight);
    }, 600);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError("");
    setScanSuccessMessage("");

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setScanError("Failed to initialize scanner canvas context.");
            setIsScanning(false);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            const decodedData = code.data;
            if (decodedData.startsWith("upi://")) {
              const urlParams = new URLSearchParams(decodedData.split("?")[1]);
              const upiId = urlParams.get("pa") || "";
              const upiName = urlParams.get("pn") || "";

              if (upiId) {
                setStoreUpiId(upiId);
                setStoreUpiName(upiName);
                setScanSuccessMessage(`Successfully verified! UPI ID: ${upiId}, Name: ${upiName || 'N/A'}`);
              } else {
                setScanError("No UPI ID (pa) found in this QR code.");
              }
            } else {
              setScanError("Not a standard UPI QR code. Please upload a standard payment QR code.");
            }
          } else {
            setScanError("Could not find a clear QR code in this image. Please make sure the image is clear and contains a single QR code.");
          }
          setIsScanning(false);
        };
        img.onerror = () => {
          setScanError("Failed to parse image file.");
          setIsScanning(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setScanError("Failed to read image file.");
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setScanError("Failed to scan QR code: " + (err instanceof Error ? err.message : String(err)));
      setIsScanning(false);
    }
  };

  const clearStoreCache = () => {
    setRestaurantName("");
    setStoreLogo("");
    setMonthlyRent(0);
    setSwiggyCommission(0);
    setZomatoCommission(0);
    setStoreUpiId("");
    setStoreUpiName("");
    setStoreAddress("");
    setStorePhone("");
    setStoreWebsite("");
    setStoreGstin("");
    setIsGstEnabled(false);
    setGstRate(0);
    setSales([]);
    setExpenses([]);
    setMenuItems([]);
    setBusinessType("Restaurant/Cafe");

    const keysToRemove = [
      "saas_store_upi_id",
      "saas_store_upi_name",
      "saas_store_name",
      "saas_store_address",
      "saas_store_phone",
      "saas_store_website",
      "saas_store_gstin",
      "saas_gst_enabled",
      "saas_gst_rate",
      "saas_monthly_rent",
      "saas_swiggy_comm",
      "saas_zomato_comm",
      "saas_business_type",
      "saas_store_logo",
      "saas_sales",
      "saas_expenses",
      "saas_menu",
      "saas_store_created_at",
      "saas_store_expiry"
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    localStorage.removeItem("saas_is_logged_in");
    clearStoreCache();
    setAuthMode("login");
    // We keep saas_owner_mobile in localStorage to remember who logged out,
    // so we can detect if a different user logs in later.
    setActiveTab("Dashboard");
    // Clear native Preferences on logout
    try {

      if (Capacitor.isNativePlatform()) {

        await Preferences.remove({ key: 'saas_is_logged_in' });
        await Preferences.remove({ key: 'saas_owner_mobile' });
      }
    } catch (e: any) { console.log('Preferences clear error:', e); }

    if (!rememberMe) {
      setLoginMobile("");
      setLoginPassword("");
      localStorage.removeItem("saas_rem_mobile");
      localStorage.removeItem("saas_rem_pass");
    }
    setRememberMe(true);
  };

  const announceVoice = async (text: string, forceLang?: string) => {
    if (!isVoiceAnnouncerEnabled) return;

    const langToUse = forceLang || lang;
    const localeCodes: Record<string, string> = {
      hi: "hi-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      bn: "bn-IN",
      pa: "pa-IN",
      ta: "ta-IN",
      te: "te-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      en: "en-US"
    };
    const ttsLang = localeCodes[langToUse] || "en-US";

    // 1. Check if running inside native Android / iOS app
    try {

      if (Capacitor.isNativePlatform()) {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text: text,
          lang: ttsLang,
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
          queueStrategy: 1
        });
        return; // Successfully announced via native TTS
      }
    } catch (nativeErr) {
      console.error("Native TTS failed, falling back to Web speech:", nativeErr);
    }

    // 2. Web fallback (for browser preview)
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      console.error("Web Speech Synthesis Error:", e);
    }
  };

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);

  const handleSale = async () => {
    if (cart.length === 0) return alert("Cart is empty.");
    if (newMobile && newMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number or leave it blank.");
      return;
    }

    if (!isSubscribed) {
      const todaySales = sales.filter(s => {
        const saleDate = s.date ? new Date(s.date) : new Date();
        const today = new Date();
        return saleDate.getDate() === today.getDate() &&
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear();
      }).length;

      if (todaySales >= 40) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Get Store ID
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (!store) throw new Error("Store ID not found");
        storeId = store.id;
        setCurrentStoreId(storeId);
      }

      const cartDescription = cart.map(c => {
        let desc = `${c.qty} x ${c.name}`;
        if (c.imei) {
          desc += ` [IMEI-${c.imei}]`;
        }
        desc += ` (₹${c.price * c.qty})`;
        return desc;
      }).join("\n");
      const cartTotalBase = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const extraAmt = Number(extraChargeAmount) || 0;
      const discAmt = Number(discount) || 0;
      const cartTotal = Math.max(0, cartTotalBase + extraAmt - discAmt);

      let commAmount = 0;
      if (newType === "Swiggy") {
        commAmount = swiggyCommType === "percent" ? (cartTotal * (swiggyCommission / 100)) : swiggyCommission;
      } else if (newType === "Zomato") {
        commAmount = zomatoCommType === "percent" ? (cartTotal * (zomatoCommission / 100)) : zomatoCommission;
      }

      // Embed commission and extra charges in items string
      let itemsWithMetadata = `${cartDescription}\n[COMM:${commAmount}]`;
      if (extraChargeName && extraAmt > 0) {
        itemsWithMetadata += `\n[EXTRA:${extraChargeName}:${extraAmt}]`;
      }
      if (discAmt > 0) {
        itemsWithMetadata += `\n[DISCOUNT:${discAmt}]`;
      }

      // Embed Finance details
      if (newType === "Finance") {
        const loanAmt = Math.max(0, cartTotal - (Number(financeDownPayment) || 0));
        let financeStr = `[FINANCE:${financeCompany}:${loanAmt}:${Number(financeDownPayment) || 0}:${financeFileId || "N/A"}:Pending]`;
        if (financeDpSplit) {
          const dpCash = Number(financeDpCash) || 0;
          const dpUpi = Math.max(0, (Number(financeDownPayment) || 0) - dpCash);
          financeStr += `\n[FINANCE_DP_SPLIT:Cash:${dpCash}:UPI:${dpUpi}]`;
        }
        itemsWithMetadata += `\n${financeStr}`;
      }

      let paymentTypeDb = newType;
      if (newType === "Split") {
        const cashPart = Number(splitCash) || 0;
        const upiPart = Math.max(0, cartTotal - cashPart);
        paymentTypeDb = `Split (Cash: ${cashPart} | UPI: ${upiPart})`;
      } else if (newType === "Credit Card") {
        paymentTypeDb = cardBankName ? `Credit Card (${cardBankName})` : "Credit Card";
      }

      const { data: newSale, error } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          customer_name: newName || "Guest",
          mobile: newMobile || "N/A",
          items: itemsWithMetadata,
          total_price: cartTotal,
          payment_type: paymentTypeDb
        }])
        .select()
        .single();

      if (error) throw error;

      // Update coupon status to used if applied
      if (appliedCouponId) {
        await supabase
          .from("coupons")
          .update({ status: "used" })
          .eq("id", appliedCouponId);
      }

      // Autocut IMEIs from stock
      if (businessType === "Mobile/Electronics") {
        for (const cartItem of cart) {
          if (cartItem.imei) {
            const matchedItem = menuItems.find(m => m.name === cartItem.name);
            if (matchedItem) {
              const imeis = getImeis(matchedItem.category);
              const remainingImeis = imeis.filter(x => x !== cartItem.imei);
              const cleanCategory = getDisplayCategory(matchedItem.category);
              const updatedCategory = remainingImeis.length > 0
                ? `${cleanCategory}|IMEIs:${remainingImeis.join(",")}`
                : cleanCategory;

              // Always update category instead of deleting so the item remains in the list as Out of Stock
              supabase
                .from('menu_items')
                .update({ category: updatedCategory })
                .eq('id', matchedItem.id)
                .then(async ({ error }) => {
                  if (!error) {
                    setMenuItems(prev => prev.map(m =>
                      m.id === matchedItem.id ? { ...m, category: updatedCategory } : m
                    ));

                    // If it was an Exchange (buyback) product, update the corresponding UNSOLD buyback expense to SOLD
                    if (cleanCategory === "Exchange") {
                      const targetExpense = expenses.find(e => {
                        const title = e.title || "";
                        return title.includes(cartItem.imei) && (title.endsWith("###UNSOLD]") || title.endsWith(":UNSOLD]"));
                      });

                      if (targetExpense) {
                        const isNewFormat = targetExpense.title.includes("###UNSOLD]");
                        const updatedTitle = isNewFormat
                          ? targetExpense.title.replace("###UNSOLD]", `###SOLD###${cartItem.price}`)
                          : targetExpense.title.replace(":UNSOLD]", `:SOLD:${cartItem.price}`);

                        await supabase
                          .from('expenses')
                          .update({ title: updatedTitle })
                          .eq('id', targetExpense.id);

                        setExpenses(prev => prev.map(e =>
                          e.id === targetExpense.id ? { ...e, title: updatedTitle } : e
                        ));
                      }
                    }
                  }
                });
            }
          }
        }
      }

      // Auto-deduct stock quantities for tracked inventory items
      for (const cartItem of cart) {
        const matchedItem = menuItems.find(m => m.id === cartItem.id || m.name.toLowerCase() === cartItem.name.toLowerCase());
        if (matchedItem && matchedItem.category) {
          const stockMeta = getItemStockMeta(matchedItem.category);
          if (stockMeta.hasQtyTracked) {
            const currentQty = stockMeta.qty || 0;
            const newQty = Math.max(0, currentQty - cartItem.qty);
            const updatedCategoryStr = buildCategoryString(stockMeta.cleanCat, newQty, stockMeta.supplier, stockMeta.cost, stockMeta.lowLimit);

            // Update Supabase DB
            supabase
              .from('menu_items')
              .update({ category: updatedCategoryStr })
              .eq('id', matchedItem.id)
              .then(({ error }) => {
                if (!error) {
                  setMenuItems(prev => prev.map(m => m.id === matchedItem.id ? { ...m, category: updatedCategoryStr } : m));
                }
              });
          }
        }
      }

      trackEvent("add_sale", { store_id: storeId, amount: cartTotal, payment_type: newType });
      // Save new products to menu_items in background
      try {
        const newProducts = cart.filter(c => c.isNewProduct);
        if (newProducts.length > 0) {
          const inserts = newProducts.map(item => ({
            store_id: storeId,
            name: item.name,
            price: Number(item.price),
            category: `General|Barcode:${item.barcode}`
          }));
          const { data: insertedItems, error: insertErr } = await supabase
            .from('menu_items')
            .insert(inserts)
            .select();
          if (!insertErr && insertedItems) {
            setMenuItems(prev => [...prev, ...insertedItems.map(m => ({
              id: m.id,
              name: m.name,
              price: m.price,
              category: m.category
            }))]);
          }
        }
      } catch (dbErr) {
        console.error("Failed to auto-onboard products:", dbErr);
      }

      const sale = {
        id: newSale.id,
        name: newSale.customer_name,
        item: newSale.items,
        mobile: newSale.mobile,
        price: newSale.total_price,
        type: newSale.payment_type,
        date: new Date(newSale.sale_date),
        commission: commAmount // Storing fixed commission at sale time
      };
      setSales([sale, ...sales]);
      setLastOrderDetails(sale);

      // Trigger Live Sales Alert on Discord
      sendDiscordAlert(
        "💰 New Sale Billing Recorded!",
        `Merchant **${restaurantName || 'InstaMunim Merchant'}** has recorded a new sale.`,
        [
          { name: "Store Name", value: restaurantName || "N/A", inline: true },
          { name: "Owner Mobile", value: ownerMobile || "N/A", inline: true },
          { name: "Sale Amount", value: `₹${newSale.total_price.toLocaleString('en-IN')}`, inline: true },
          { name: "Payment Mode", value: newSale.payment_type || "Cash", inline: true },
          { name: "Customer Name", value: newSale.customer_name || "Walk-in Customer", inline: true },
          { name: "Items Billed", value: newSale.items || "N/A", inline: false }
        ],
        5763719
      );

      // Trigger voice cashier announcement
      try {
        const amt = sale.price;
        const type = sale.type; // Cash, Online, Udhaar, Swiggy, Zomato

        const getVoicePartnerName = (t: string, langCode: string) => {
          if (t === "Online") {
            return { hi: "ऑनलाइन", mr: "ऑनलाइन", gu: "ઓનલાઇન", bn: "অনলাইন", pa: "ਆਨਲਾਈਨ", ta: "ஆன்லைன்", te: "ఆన్‌లైన్", kn: "ಆನ್‌ಲೈನ್", ml: "ഓൺലൈൻ" }[langCode] || "Online";
          }
          if (t === "Swiggy") {
            if (businessType === "Mobile/Electronics") {
              return { hi: "अमेज़न", mr: "अमेझॉन", gu: "એમેઝોન", bn: "আমাজন", pa: "ਅਮੇਜ਼ਨ", ta: "அமேசான்", te: "అమెజాన్", kn: "ಅಮೆಜಾನ್", ml: "ആമസോൺ" }[langCode] || "Amazon";
            }
            if (businessType === "Kirana/Grocery") {
              return { hi: "ब्लिंकिट", mr: "ब्लिंकिट", gu: "બ્લિંકિટ", bn: "ব্লিনکیট", pa: "ਬਲਿੰਕਿટ", ta: "பிலிங்கிட்", te: "బ్లింకిట్", kn: "ಬ್লিಂಕಿಟ್", ml: "ബ്ലിങ്കിറ്റ്" }[langCode] || "Blinkit";
            }
            return { hi: "स्वीगी", mr: "स्वीगी", gu: "સ્વીગી", bn: "সুইগি", pa: "ਸਵਿਗੀ", ta: "ஸ்விக்கி", te: "ಸ್виггీ", kn: "ಸ್ವಿಗ್ಗಿ", ml: "സ്വിഗ്ഗി" }[langCode] || "Swiggy";
          }
          if (t === "Zomato") {
            if (businessType === "Mobile/Electronics") {
              return { hi: "फ्लिपकार्ट", mr: "फ्लिपकार्ट", gu: "ફ્લિપકાર્ટ", bn: "ফ্লিপকার্ট", pa: "ਫਲਿੱਪਕਾਰਟ", ta: "பிளிப்கார்ட்", te: "ಫ್లిప్‌కార్ట్", kn: "ಫ್ಲಿಪ್‌ਕਾਰ்ட்", ml: "ഫ്ലിപ്കാർട്ട്" }[langCode] || "Flipkart";
            }
            if (businessType === "Kirana/Grocery") {
              return { hi: "ઝેપ્ટો", mr: "झेप्टो", gu: "ઝેપ્ટો", bn: "જેપ્ટો", pa: "ਜ਼ੈપટો", ta: "ஜெப்டோ", te: "జెప్టో", kn: "జెప్టో", ml: "സെപ്റ്റോ" }[langCode] || "Zepto";
            }
            return { hi: "ज़ोमैटो", mr: "झोमॅटो", gu: "ઝોમેટો", bn: "조ம্যাটো", pa: "ਜ਼ોमैटो", ta: "சொமாட்டோ", te: "జొమాటో", kn: "ಝೊಮ್ಯಾಟೊ", ml: "സൊമാറ്റോ" }[langCode] || "Zomato";
          }
          return { hi: "कैश", mr: "कॅश", gu: "કેશ", bn: "ক্যাশ", pa: "ਕੈਸ਼", ta: "ரொக்கமாக", te: "నగదు", kn: "ನಗದು", ml: "പണമായി" }[langCode] || "Cash";
        };

        const announceTemplates: Record<string, string> = {
          hi: type === "Udhaar"
            ? `इंस्टामुनिम पर ${amt} रुपये का उधार दर्ज हुआ。`
            : `इंस्टामुनिम पर ${type === "Online" ? "ऑनलाइन" : type === "Swiggy" ? "स्वीगी" : type === "Zomato" ? "ज़ोमैटो" : "कैश"} के ${amt} रुपये प्राप्त हुए。`,
          mr: type === "Udhaar"
            ? `इन्स्टामुनिमवर ${amt} रुपयांची उधारी नोंदवली गेली。`
            : `इन्स्टामुनिमवर ${type === "Online" ? "ऑनलाइन" : type === "Swiggy" ? "स्वीगी" : type === "Zomato" ? "झोमॅटो" : "कॅश"}द्वारे ${amt} रुपये प्राप्त झाले。`,
          gu: type === "Udhaar"
            ? `ઇન્સ્ટામુનિમ પર ${amt} રૂપિયાનું ઉધાર નોંધાયું છે。`
            : `ઇન્સ્ટામુનિમ પર ${type === "Online" ? "ઓનલાઇન" : type === "Swiggy" ? "સ્વીગી" : type === "Zomato" ? "ઝોમેટો" : "કેશ"} દ્વારા ${amt} રૂપિયા મળ્યા છે。`,
          bn: type === "Udhaar"
            ? `ইনস্টামুনিমে ${amt} টাকার ধার নথিভুক্ত করা হয়েছে。`
            : `ইনস্টামুনিমে ${type === "Online" ? "অনলাইন" : type === "Swiggy" ? "সুইগি" : type === "Zomato" ? "জোম্যাটো" : "ক্যাশ"} এর মাধ্যমে ${amt} টাকা পাওয়া গেছে。`,
          pa: type === "Udhaar"
            ? `ਇੰਸਟਾਮੁਨਿਮ 'ਤੇ ${amt} ਰੁਪਏ ਦਾ ਉਧਾਰ ਦਰਜ ਕੀਤਾ ਗਿਆ ਹੈ。`
            : `ਇੰਸਟਾਮੁਨਿਮ 'ਤੇ ${type === "Online" ? "ਆਨਲਾਈਨ" : type === "Swiggy" ? "ਸਵਿਗੀ" : type === "Zomato" ? "ਜ਼ੋਮੈਟੋ" : "ਕੈਸ਼"} ਰਾਹੀਂ ${amt} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ。`,
          ta: type === "Udhaar"
            ? `இன்ஸ்டாமுனிமில் ${amt} ரூபாய் கடன் பதிவு செய்யப்பட்டது。`
            : `இன்ஸ்டாமுனிமில் ${type === "Online" ? "ஆன்லைன்" : type === "Swiggy" ? "ஸ்விக்கி" : type === "Zomato" ? "சொமாட்டோ" : "ரொக்கமாக"} மூலம் ${amt} ரூபாய் பெறப்பட்டது。`,
          te: type === "Udhaar"
            ? `ఇన్‌స్టామునిమ్‌లో ${amt} రూపాయల అప్పు నమోదు చేయబడింది。`
            : `ఇన్‌స్టామునిమ్‌లో ${type === "Online" ? "ఆన్‌లైన్" : type === "Swiggy" ? "స్విగ్గీ" : type === "Zomato" ? "జొమాటో" : "నగదు"} ద్వారా ${amt} రూపాయలు వచ్చాయి。`,
          kn: type === "Udhaar"
            ? `ಇನ್ಸ್ಟಾಮುನಿಮ್ನಲ್ಲಿ ${amt} ರೂಪಾಯಿ ಉದ್ರಿ ದಾಖಲಾಗಿದೆ。`
            : `ಇನ್ಸ್ಟಾಮುನಿಮ್ನಲ್ಲಿ ${type === "Online" ? "ಆನ್‌ಲೈನ್" : type === "Swiggy" ? "ಸ್ವಿಗ್ಗಿ" : type === "Zomato" ? "ಝೊಮ್ಯಾಟೊ" : "ನಗದು"} ಮೂಲಕ ${amt} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ。`,
          ml: type === "Udhaar"
            ? `ഇൻസ്റ്റാമുനിമിൽ ${amt} രൂപ കടം രേഖപ്പെടുത്തി。`
            : `ഇൻസ്റ്റാമുനിമിൽ ${type === "Online" ? "ഓൺലൈൻ" : type === "Swiggy" ? "സ്വിഗ്ഗി" : type === "Zomato" ? "സൊമാറ്റോ" : "പണമായി"} വഴി ${amt} രൂപ ലഭിച്ചു。`,
          en: type === "Udhaar"
            ? `Udhaar of ${amt} rupees recorded on InstaMunim。`
            : `Received ${amt} rupees on InstaMunim via ${type}。`
        };

        let textToAnnounce = "";
        if (type && type.startsWith("Split")) {
          const cashMatch = type.match(/Cash:\s*([\d\.]+)/);
          const upiMatch = type.match(/UPI:\s*([\d\.]+)/);
          const cashVal = cashMatch ? Number(cashMatch[1]) : 0;
          const upiVal = upiMatch ? Number(upiMatch[1]) : 0;

          const splitTemplates: Record<string, string> = {
            hi: `इंस्टामुनिम पर ${cashVal} रुपये कैश और ${upiVal} रुपये ऑनलाइन प्राप्त हुए。`,
            mr: `इन्स्टामुनिमवर ${cashVal} रुपये कॅश आणि ${upiVal} रुपये ऑनलाइन प्राप्त झाले。`,
            gu: `ઇન્સ્ટામુનિમ પર ${cashVal} રૂપિયા કેશ અને ${upiVal} રૂપિયા ઓનલાઇન મળ્યા છે。`,
            bn: `ইনস্টামুনিমে ${cashVal} টাকা ক্যাশ এবং ${upiVal} টাকা অনলাইন পাওয়া গেছে。`,
            pa: `ਇੰਸਟਾਮੁਨਿਮ 'ਤੇ ${cashVal} ਰੁਪਏ ਕੈਸ਼ ਅਤੇ ${upiVal} ਰੁਪਏ ਆਨਲਾਈਨ ਪ੍ਰਾਪਤ ਹੋਏ。`,
            ta: `இன்ஸ்டாமுனிமில் ${cashVal} ரூபாய் ரொக்கமாகவும் ${upiVal} ரூபாய் ஆன்லைன் மூலமும் பெறப்பட்டது。`,
            te: `ఇన్‌స్టామునిమ్‌లో ${cashVal} రూపాయల నగదు మరియు ${upiVal} రూపాయల ఆన్‌లైన్ ద్వారా వచ్చాయి。`,
            kn: `ಇನ್ಸ್ಟಾಮುನಿಮ್ನಲ್ಲಿ ${cashVal} ರೂಪಾಯಿ నగదు మరియు ${upiVal} ರೂಪಾಯಿ ಆನ್‌ಲೈನ್ ಮೂಲಕ ಸ್ವೀಕರಿಸಲಾಗಿದೆ挂`,
            ml: `ഇൻസ്റ്റാമുനിമിൽ ${cashVal} രൂപ പണമായും ${upiVal} രൂപ ഓൺലൈൻ വഴിയും ലഭിച്ചു。`,
            en: `Received ${cashVal} rupees Cash and ${upiVal} rupees Online on InstaMunim。`
          };
          textToAnnounce = splitTemplates[lang] || splitTemplates['en'];
        } else {
          textToAnnounce = announceTemplates[lang] || announceTemplates['en'];
        }

        // Dynamically replace platform names in announcement speech for correct branding
        const p1 = getPartnerName(businessType, "Swiggy");
        const p2 = getPartnerName(businessType, "Zomato");
        const vp1 = getVoicePartnerName("Swiggy", lang);
        const vp2 = getVoicePartnerName("Zomato", lang);

        textToAnnounce = textToAnnounce
          .replaceAll("Swiggy", p1)
          .replaceAll("Zomato", p2)
          .replaceAll("स्वीगी", vp1)
          .replaceAll("ज़ोमैटो", vp2)
          .replaceAll("झोमॅटो", vp2)
          .replaceAll("ઝોમેટો", vp2)
          .replaceAll("સ્વીગી", vp1)
          .replaceAll("જોમ্যাટો", vp2)
          .replaceAll("সুইগি", vp1)
          .replaceAll("ਜ਼ੋਮੈਟੋ", vp2)
          .replaceAll("ਸਵਿਗੀ", vp1)
          .replaceAll("சொமாட்டோ", vp2)
          .replaceAll("ஸ்விக்கி", vp1)
          .replaceAll("జొమాటో", vp2)
          .replaceAll("స్విగ్గీ", vp1)
          .replaceAll("ಸ್ವಿಗ್ಗಿ", vp1)
          .replaceAll("ಝೊಮ್ಯಾಟೊ", vp2)
          .replaceAll("സൊമാറ്റോ", vp2)
          .replaceAll("സ്വിഗ്ഗി", vp1);

        announceVoice(textToAnnounce, lang);
      } catch (voiceErr) {
        console.error("Voice announce error inside handleSale:", voiceErr);
      }
      setIsSaleOpen(false);
      setShowSuccessDialog(true);
      setCart([]);
      setNewName("");
      setNewMobile("");
      setExtraChargeName("");
      setExtraChargeAmount("");
      setDiscount("");
      setAvailableCoupons([]);
      setAppliedCouponId(null);
      setFinanceCompany("Bajaj Finserv");
      setFinanceDownPayment("");
      setFinanceFileId("");
      setSplitCash("");
      setFinanceDpSplit(false);
      setFinanceDpCash("");

      // Trigger Interstitial Ad after every [remoteAdFrequency] sales
      if (!isSubscribed) {
        const freq = remoteAdFrequency || 2;
        const nextCount = (Number(localStorage.getItem('ad_sale_count') || '0') + 1) % freq;
        localStorage.setItem('ad_sale_count', nextCount.toString());

        if (nextCount === 0) {
          if (adProvider === "admob" && admobRef.current) {
            try {
              console.log("Triggering Interstitial Ad after sale...");
              await admobRef.current.showInterstitial();
            } catch (e: any) {
              console.error("Error showing interstitial ad, falling back to Web Ads direct link:", e);
              prepareInterstitialAd();
              if (webAdDirectLink) {
                try {
                  window.open(webAdDirectLink, "_blank");
                } catch (webErr) {
                  console.error("Web Ad direct link error:", webErr);
                }
              }
            }
          } else if (adProvider === "web" && webAdDirectLink) {
            try {
              console.log("Triggering Web Interstitial Direct Link Ad...");
              window.open(webAdDirectLink, "_blank");
            } catch (e: any) {
              console.error("Error opening web interstitial ad:", e);
            }
          }
        }
      }
    } catch (err: any) {
      alert("Cloud Sync Error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSaleRef.current = handleSale;
  }, [handleSale]);

  const sendWhatsAppReceipt = () => {
    if (!lastOrderDetails || lastOrderDetails.mobile === "N/A" || !lastOrderDetails.mobile) return alert("No mobile number provided.");

    // Construct items string for URL: Name:Price,Name:Price
    // lastOrderDetails.item is like "2 x Paneer Tikka (₹160)\n..."
    // We'll reconstruct from cart if possible or parse from string
    const itemsParam = (lastOrderDetails.item || "").split("\n").map((line: string) => {
      const parts = line.match(/(.+) \(₹(\d+)\)/);
      if (parts) return `${parts[1].trim()}:${parts[2]}`;
      return null;
    }).filter(Boolean).join(",");

    const extraMatch = (lastOrderDetails.item || "").match(/\[EXTRA:(.+):(\d+)\]/);
    const extraPart = extraMatch ? `&ecn=${encodeURIComponent(extraMatch[1])}&eca=${extraMatch[2]}` : "";

    const discountMatch = (lastOrderDetails.item || "").match(/\[DISCOUNT:(\d+(\.\d+)?)\]/);
    const discountPart = discountMatch ? `&disc=${discountMatch[1]}` : "";

    const financeMatch = (lastOrderDetails.item || "").match(/\[FINANCE:([^:]+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):([^:]+):(Pending|Settled)\]/);
    const financePart = financeMatch ? `&fin=true&fco=${encodeURIComponent(financeMatch[1])}&flo=${financeMatch[2]}&fdp=${financeMatch[3]}&fid=${encodeURIComponent(financeMatch[4])}` : "";
    const sigPart = storeSignature ? `&sig=${encodeURIComponent(storeSignature)}` : "";

    const baseUrl = (typeof window !== 'undefined' && window.location.port === '3000')
      ? "http://localhost:3000"
      : "https://www.instamunim.com";
    let invoiceUrl = `${baseUrl}/invoice?gst=${isGstEnabled}&gstRate=${gstRate}&n=${encodeURIComponent(restaurantName)}&i=${encodeURIComponent(itemsParam)}&p=${lastOrderDetails.price}&d=${encodeURIComponent(lastOrderDetails.date.toISOString())}&t=${encodeURIComponent(lastOrderDetails.type || "")}&id=${lastOrderDetails.id}&m=${lastOrderDetails.mobile}&cn=${encodeURIComponent(lastOrderDetails.name)}&a=${encodeURIComponent(storeAddress)}&ph=${encodeURIComponent(storePhone)}&w=${encodeURIComponent(storeWebsite)}&g=${encodeURIComponent(storeGstin)}&o=${ownerMobile}${extraPart}${discountPart}${financePart}${sigPart}`;
    if (!isSubscribed) {
      invoiceUrl += "&free=true";
    }

    let displayItems = (lastOrderDetails.item || "")
      .split("[COMM:")[0]
      .split("[EXTRA:")[0]
      .split("[DISCOUNT:")[0]
      .split("[FINANCE:")[0]
      .trim();

    if (extraMatch) {
      displayItems += `\n${extraMatch[1]}: ₹${extraMatch[2]}`;
    }
    if (discountMatch) {
      displayItems += `\nDiscount: -₹${discountMatch[1]}`;
    }
    if (financeMatch) {
      displayItems += `\n─────────────────────\n🏦 *FINANCE DETAILS:*\nCompany: ${financeMatch[1]}\nLoan Amount: ₹${financeMatch[2]}\nDown Payment: ₹${financeMatch[3]}\nFile ID: ${financeMatch[4]}`;
    }

    let msg = whatsappInvoiceTemplate
      .replaceAll("[NAME]", lastOrderDetails.name || "Customer")
      .replaceAll("[SHOP]", restaurantName || "Store")
      .replaceAll("[ITEMS]", displayItems)
      .replaceAll("[TOTAL]", lastOrderDetails.price.toString())
      .replaceAll("[LINK]", invoiceUrl);

    if (!isSubscribed) {
      msg += "\n\nGenerated by InstaMunim POS\nDownload App Free: https://instamunim.com";
    }

    launchWhatsApp(lastOrderDetails.mobile, msg);
  };

  const renderPaymentDetails = (s: any) => {
    const rawItemString = s.item || "";
    const typeStr = s.type || "Cash";
    const isSplitPayment = typeStr.includes("Split");

    // Check finance details
    const financeMatch = rawItemString.match(/\[FINANCE:([^:]+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):([^:]+):(Pending|Settled)\]/);
    // Check downpayment split
    const dpSplitMatch = rawItemString.match(/\[FINANCE_DP_SPLIT:Cash:(\d+(?:\.\d+)?):UPI:(\d+(?:\.\d+)?)\]/);

    if (!isSplitPayment && !financeMatch) {
      const isUdhaar = s.type === "Udhaar";
      const isOnline = s.type === "Online";
      const isSwiggy = s.type === "Swiggy";
      const isZomato = s.type === "Zomato";
      let badgeStyle = "bg-emerald-100 text-emerald-600";
      if (isUdhaar) badgeStyle = "bg-red-100 text-red-600";
      else if (isOnline) badgeStyle = "bg-blue-100 text-blue-600";
      else if (isSwiggy || isZomato) badgeStyle = "bg-orange-100 text-orange-600";
      else if (s.type !== "Cash") badgeStyle = "bg-zinc-100 text-zinc-600";

      return (
        <Badge className={`text-[8px] font-bold px-2 py-0.5 rounded-lg border-0 ${badgeStyle}`}>
          {getPartnerName(businessType, s.type).toUpperCase()}
        </Badge>
      );
    }

    return (
      <div className="flex flex-col items-center sm:items-start gap-1">
        <Badge className="text-[8px] font-bold px-2 py-0.5 rounded-lg border-0 bg-blue-100 text-blue-600">
          {getPartnerName(businessType, isSplitPayment ? "Split" : "Finance").toUpperCase()}
        </Badge>
        {isSplitPayment && (
          <span className="text-[9px] font-black text-zinc-500 whitespace-nowrap bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {typeStr.replace("Split ", "")}
          </span>
        )}
        {financeMatch && (
          <div className="flex flex-col items-start gap-0.5 text-[8px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded border border-zinc-100 dark:border-zinc-800 whitespace-nowrap">
            <span className="font-extrabold text-[9px] text-zinc-700 dark:text-zinc-300">{financeMatch[1]}</span>
            <span>Loan: ₹{financeMatch[2]}</span>
            <span>Down Payment: ₹{financeMatch[3]}</span>
            {dpSplitMatch && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                DP Split: Cash ₹{dpSplitMatch[1]} | UPI ₹{dpSplitMatch[2]}
              </span>
            )}
            <span className={`font-black uppercase tracking-wider text-[7px] px-1 rounded-sm mt-0.5 ${financeMatch[5] === 'Settled' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
              {financeMatch[5]}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getInvoiceUrlForSale = (s: any) => {
    const rawItemString = s.item || "";
    const itemsParam = rawItemString.split("\n").map((line: string) => {
      const parts = line.match(/(.+) \(₹(\d+)\)/);
      if (parts) return `${parts[1].trim()}:${parts[2]}`;
      return null;
    }).filter(Boolean).join(",");

    const extraMatch = rawItemString.match(/\[EXTRA:(.+):(\d+)\]/);
    const extraPart = extraMatch ? `&ecn=${encodeURIComponent(extraMatch[1])}&eca=${extraMatch[2]}` : "";

    const discountMatch = rawItemString.match(/\[DISCOUNT:(\d+(\.\d+)?)\]/);
    const discountPart = discountMatch ? `&disc=${discountMatch[1]}` : "";

    const financeMatch = rawItemString.match(/\[FINANCE:([^:]+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):([^:]+):(Pending|Settled)\]/);
    const financePart = financeMatch ? `&fin=true&fco=${encodeURIComponent(financeMatch[1])}&flo=${financeMatch[2]}&fdp=${financeMatch[3]}&fid=${encodeURIComponent(financeMatch[4])}` : "";

    const sigPart = storeSignature ? `&sig=${encodeURIComponent(storeSignature)}` : "";

    const baseUrl = (typeof window !== 'undefined' && window.location.port === '3000')
      ? "http://localhost:3000"
      : "https://www.instamunim.com";
    let url = `${baseUrl}/invoice?gst=${isGstEnabled}&gstRate=${gstRate}&n=${encodeURIComponent(restaurantName)}&i=${encodeURIComponent(itemsParam)}&p=${s.price}&d=${encodeURIComponent(new Date(s.date).toISOString())}&t=${encodeURIComponent(s.type || "")}&id=${s.id}&m=${s.mobile || ""}&cn=${encodeURIComponent(s.name || "")}&a=${encodeURIComponent(storeAddress)}&ph=${encodeURIComponent(storePhone)}&w=${encodeURIComponent(storeWebsite)}&g=${encodeURIComponent(storeGstin)}&o=${ownerMobile}${extraPart}${discountPart}${financePart}${sigPart}`;
    if (!isSubscribed) {
      url += "&free=true";
    }
    return url;
  };

  const handleResendWhatsAppInvoice = (s: any) => {
    const invoiceUrl = getInvoiceUrlForSale(s);
    const extraMatch = (s.item || "").match(/\[EXTRA:(.+):(\d+)\]/);
    const discountMatch = (s.item || "").match(/\[DISCOUNT:(\d+(\.\d+)?)\]/);
    const financeMatch = (s.item || "").match(/\[FINANCE:([^:]+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):([^:]+):(Pending|Settled)\]/);

    let displayItems = (s.item || "")
      .split("[COMM:")[0]
      .split("[EXTRA:")[0]
      .split("[DISCOUNT:")[0]
      .split("[FINANCE:")[0]
      .trim();

    if (extraMatch) {
      displayItems += `\n${extraMatch[1]}: ₹${extraMatch[2]}`;
    }
    if (discountMatch) {
      displayItems += `\nDiscount: -₹${discountMatch[1]}`;
    }
    if (financeMatch) {
      displayItems += `\n─────────────────────\n🏦 *FINANCE DETAILS:*\nCompany: ${financeMatch[1]}\nLoan Amount: ₹${financeMatch[2]}\nDown Payment: ₹${financeMatch[3]}\nFile ID: ${financeMatch[4]}`;
    }

    let msg = whatsappInvoiceTemplate
      .replaceAll("[NAME]", s.name || "Customer")
      .replaceAll("[SHOP]", restaurantName || "Store")
      .replaceAll("[ITEMS]", displayItems)
      .replaceAll("[TOTAL]", s.price.toString())
      .replaceAll("[LINK]", invoiceUrl);

    if (!isSubscribed) {
      msg += "\n\nGenerated by InstaMunim POS\nDownload App Free: https://instamunim.com";
    }

    launchWhatsApp(s.mobile, msg);
  };

  const handleAddManualItem = () => {
    if (!manualItemName.trim()) {
      alert("Bhai, product ka naam likho!");
      return;
    }
    const priceNum = Number(manualItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Bhai, sahi price (rate) daalo!");
      return;
    }
    const isNew = !menuItems.some(m => m.name.toLowerCase() === manualItemName.trim().toLowerCase());
    addToCart({
      name: manualItemName.trim(),
      price: priceNum,
      isNewProduct: isNew,
      barcode: ""
    });
    setManualItemName("");
    setManualItemPrice("");
    setIsManualMode(false);
  };

  const addToCart = (item: any) => {
    // 1. Stock Check & Warning Alert
    const targetItem = menuItems.find(m => m.id === item.id || m.name.toLowerCase() === (item.name || '').toLowerCase()) || item;
    if (targetItem && targetItem.category) {
      const stockMeta = getItemStockMeta(targetItem.category);
      if (stockMeta.hasQtyTracked) {
        const existingInCart = cart.find(c => c.name.toLowerCase() === (item.name || '').toLowerCase());
        const currentCartQty = existingInCart ? existingInCart.qty : 0;
        const requestedQty = currentCartQty + 1;

        if (requestedQty > stockMeta.qty) {
          if (stockMeta.qty <= 0) {
            alert(`⚠️ Out of Stock Alert!\n\n"${targetItem.name}" is currently Out of Stock (0 Pcs available in inventory).\nPlease add stock in Daily Stock before selling.`);
          } else {
            alert(`⚠️ Insufficient Stock Alert!\n\n"${targetItem.name}" ka available stock sirf ${stockMeta.qty} Pcs hai.\nAap ${requestedQty} quantity add karne ki koshish kar rahe hain!`);
          }
          return;
        }
      }
    }

    setCart(prev => {
      let matchedImei = item.imei || "";
      if (!matchedImei && businessType === "Mobile/Electronics") {
        const imeis = getImeis(item.category);
        if (imeis.length > 0) {
          if (itemSearch.trim()) {
            const query = itemSearch.trim().toLowerCase();
            const exactOrPartialMatch = imeis.find(x => x.toLowerCase().includes(query));
            if (exactOrPartialMatch) {
              matchedImei = exactOrPartialMatch;
              setItemSearch("");
            }
          }
          if (!matchedImei) {
            matchedImei = imeis[0];
          }
        }
      }

      const existing = prev.find(c => c.name === item.name);
      if (existing) {
        return prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1, imei: matchedImei || c.imei } : c);
      }
      return [...prev, { ...item, qty: 1, imei: matchedImei }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart(prev => {
      const item = prev.find(c => c.name === name);
      if (item && item.qty > 1) return prev.map(c => c.name === name ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => c.name !== name);
    });
  };

  const updateCartItemImei = (name: string, imei: string) => {
    setCart(prev => prev.map(c => c.name === name ? { ...c, imei } : c));
  };

  const handleScanImei = (itemName: string) => {
    scannerTargetRef.current = "cart";
    setScanningImeiItem(itemName);
    setShowScanner(true);
  };

  const handleScanNewItemImei = (index: number) => {
    scannerTargetRef.current = "cart";
    setScanningNewItemIndex(index);
    setShowScanner(true);
  };

  const handleScanEditItemImei = (index: number) => {
    scannerTargetRef.current = "cart";
    setScanningEditItemIndex(index);
    setShowScanner(true);
  };

  const handleSaveEditStock = async () => {
    if (!editingItem) return;
    setIsLoading(true);
    try {
      const cleanCategory = getDisplayCategory(editingItem.category);
      let updatedCategory = cleanCategory;

      if (editingUnitDetails.length > 0) {
        const encodedUnits = editingUnitDetails
          .filter(u => u.imei && u.imei.trim())
          .map(u => {
            const imei = u.imei.trim();
            const meta = [
              u.color ? `Color:${u.color.trim()}` : "",
              u.purchaseRate ? `Cost:${u.purchaseRate.trim()}` : "",
              u.hsnCode ? `HSN:${u.hsnCode.trim()}` : "",
              u.supplierName ? `Supplier:${u.supplierName.trim()}` : ""
            ].filter(Boolean).join(";");
            return meta ? `IMEI:${imei}{${meta}}` : imei;
          })
          .join(",");
        if (encodedUnits) {
          updatedCategory = `${cleanCategory}|IMEIs:${encodedUnits}`;
        }
      } else if (editingItemImeis.length > 0) {
        const filteredImeis = editingItemImeis.filter(Boolean).map(x => x.trim());
        if (filteredImeis.length > 0) {
          updatedCategory = `${cleanCategory}|IMEIs:${filteredImeis.join(",")}`;
        }
      }

      const { error } = await supabase
        .from('menu_items')
        .update({ category: updatedCategory })
        .eq('id', editingItem.id);

      if (error) throw error;

      setMenuItems(prev => prev.map(item =>
        item.id === editingItem.id ? { ...item, category: updatedCategory } : item
      ));

      setShowEditStockModal(false);
      setEditingItem(null);
      setEditingUnitDetails([]);
    } catch (err: any) {
      alert("Error saving stock: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSale = async () => {
    if (!editingSale || !editingSale.id) return;
    setIsLoading(true);
    try {
      const updatedPrice = Number(editingSale.price) || 0;
      const updatedDiscount = Number(editingSale.discount) || 0;
      const netTotalPrice = Math.max(0, updatedPrice - updatedDiscount);

      const dbPayload: any = {
        customer_name: editingSale.name.trim() || "Customer",
        mobile: editingSale.mobile.trim() || "N/A",
        total_price: netTotalPrice,
        payment_type: editingSale.type || "Cash"
      };

      const { error } = await supabase
        .from("sales")
        .update(dbPayload)
        .eq("id", editingSale.id);

      if (error) {
        console.warn("Supabase sales update notice:", error.message);
      }

      setSales(prev => prev.map(s => s.id === editingSale.id ? {
        ...s,
        name: editingSale.name.trim() || "Customer",
        customer_name: editingSale.name.trim() || "Customer",
        mobile: editingSale.mobile.trim() || "N/A",
        item: editingSale.item.trim() || "General Order",
        items: editingSale.item.trim() || "General Order",
        price: netTotalPrice,
        total_price: netTotalPrice,
        commission: updatedDiscount,
        type: editingSale.type || "Cash",
        payment_type: editingSale.type || "Cash"
      } : s));

      setShowEditSaleModal(false);
      setEditingSale(null);
      alert("✅ Bill updated successfully!");
    } catch (err: any) {
      alert("Failed to update bill: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      try {
        const saleDateStr = format(new Date(s.date), "yyyy-MM-dd");
        return saleDateStr >= startDate && saleDateStr <= endDate;
      } catch (err) {
        return false;
      }
    });
  }, [sales, startDate, endDate]);
  const searchedSales = useMemo(() => {
    if (!salesSearchQuery.trim()) return filteredSales;
    const query = salesSearchQuery.toLowerCase().trim();
    return filteredSales.filter(s => {
      const name = (s.name || "").toLowerCase();
      const mobile = (s.mobile || "").toLowerCase();
      const items = (s.item || "").toLowerCase();
      const type = (s.type || "").toLowerCase();
      const price = String(s.price || "");
      return name.includes(query) || mobile.includes(query) || items.includes(query) || type.includes(query) || price.includes(query);
    });
  }, [filteredSales, salesSearchQuery]);
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      try {
        const expDateStr = format(new Date(e.date), "yyyy-MM-dd");
        return expDateStr >= startDate && expDateStr <= endDate;
      } catch (err) {
        return false;
      }
    });
  }, [expenses, startDate, endDate]);

  const totalSales = useMemo(() => filteredSales.reduce((sum, s) => sum + s.price, 0), [filteredSales]);
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => {
      const title = e.title || "";
      const isSoldBuyback = title.includes("[BUYBACK:") && title.includes(":SOLD");
      if (isSoldBuyback) return sum; // Exclude sold buybacks from active operating expenses
      return sum + e.amount;
    }, 0);
  }, [filteredExpenses]);

  const soldBuybackCost = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => {
      const title = e.title || "";
      const isSoldBuyback = title.includes("[BUYBACK:") && title.includes(":SOLD");
      if (isSoldBuyback) return sum + e.amount;
      return sum;
    }, 0);
  }, [filteredExpenses]);

  const totalCommissions = useMemo(() => filteredSales.reduce((sum, s) => sum + (s.commission || 0), 0), [filteredSales]);

  const totalUdhaar = useMemo(() => filteredSales.filter(s => s.type === "Udhaar" && s.status !== "Paid").reduce((sum, s) => sum + s.price, 0), [filteredSales]);

  const netProfit = useMemo(() => totalSales - totalExpenses - soldBuybackCost - totalCommissions, [totalSales, totalExpenses, soldBuybackCost, totalCommissions]);

  const uniqueCustomers = useMemo(() => Array.from(new Set(sales.filter(s => s.mobile !== "N/A").map(s => s.mobile))), [sales]);

  const crmList = useMemo(() => {
    // Extract unique customers from sales & walk-in enquiries
    const customersMap = new Map<string, { name: string; mobile: string; lastDate: Date; tag?: string; notes?: string }>();

    // 1. Read Walk-in Enquiries from ALL localStorage keys
    try {
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("instamunim_enquiries")) {
            const savedEnquiries = localStorage.getItem(key);
            if (savedEnquiries) {
              const enqList = JSON.parse(savedEnquiries);
              if (Array.isArray(enqList)) {
                enqList.forEach((e: any) => {
                  if (e.phone && e.phone.length >= 10) {
                    const cleanPhone = e.phone.replace(/\D/g, "").slice(-10);
                    const enqDate = e.createdAt ? new Date(e.createdAt) : new Date();
                    const existing = customersMap.get(cleanPhone);
                    if (!existing || enqDate > existing.lastDate) {
                      const noteSummary = e.notes || (e.categoryDetails?.phoneModel ? `Model: ${e.categoryDetails.phoneModel}, Budget: ${e.categoryDetails.budgetRange || 'N/A'}` : 'Walk-in Lead');
                      customersMap.set(cleanPhone, {
                        name: e.customerName || "Walk-in Lead",
                        mobile: cleanPhone,
                        lastDate: enqDate,
                        tag: e.status || "Walk-in Lead",
                        notes: noteSummary
                      });
                    }
                  }
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed reading enquiries for CRM list:", err);
    }

    // 2. Read customers from sales
    sales.forEach(s => {
      if (s.mobile && s.mobile !== "N/A" && s.mobile.length >= 10) {
        const cleanPhone = s.mobile.replace(/\D/g, "").slice(-10);
        const existing = customersMap.get(cleanPhone);
        const sDate = s.date ? new Date(s.date) : new Date();
        if (!existing || sDate > existing.lastDate) {
          customersMap.set(cleanPhone, {
            name: s.name || "Customer",
            mobile: cleanPhone,
            lastDate: sDate,
            tag: existing?.tag || "Customer",
            notes: existing?.notes
          });
        }
      }
    });

    const derived = Array.from(customersMap.values()).map(c => {
      const diffTime = Math.abs(new Date().getTime() - c.lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        name: c.name,
        mobile: c.mobile,
        last: `${diffDays} days ago`,
        tag: c.tag || "Customer",
        notes: c.notes
      };
    });

    if (derived.length === 0) {
      return [
        { name: "salman khan", mobile: "7838229178", last: "1 days ago", tag: "Customer", notes: undefined },
        { name: "Sumaira", mobile: "8130707236", last: "2 days ago", tag: "Customer", notes: undefined },
        { name: "Anish Gupta", mobile: "9910293847", last: "5 days ago", tag: "Customer", notes: undefined }
      ];
    }

    return derived;
  }, [sales, currentStoreId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`saas_sent_crm_mobiles_${currentStoreId || 'default'}`);
      if (saved) {
        setSentCrmMobiles(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load sent CRM mobiles:", e);
    }
  }, [currentStoreId]);

  const markCrmMobileAsSent = (mobile: string) => {
    const clean = (mobile || '').replace(/\D/g, '').slice(-10);
    if (!clean) return;
    setSentCrmMobiles(prev => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      try {
        localStorage.setItem(`saas_sent_crm_mobiles_${currentStoreId || 'default'}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const resetCrmSentStatus = () => {
    if (!confirm("Are you sure you want to reset sent status for all customers? This will mark all customers as Pending again.")) return;
    setSentCrmMobiles([]);
    setSelectedCrmMobiles([]);
    try {
      localStorage.removeItem(`saas_sent_crm_mobiles_${currentStoreId || 'default'}`);
    } catch (e) {}
  };

  const fullCrmListWithStatus = useMemo(() => {
    return crmList.map(c => {
      const clean = (c.mobile || '').replace(/\D/g, '').slice(-10);
      const isSent = sentCrmMobiles.includes(clean);
      return { ...c, cleanMobile: clean, isSent };
    });
  }, [crmList, sentCrmMobiles]);

  const pendingCrmCount = useMemo(() => fullCrmListWithStatus.filter(c => !c.isSent).length, [fullCrmListWithStatus]);
  const sentCrmCount = useMemo(() => fullCrmListWithStatus.filter(c => c.isSent).length, [fullCrmListWithStatus]);

  const displayedCrmList = useMemo(() => {
    let list = fullCrmListWithStatus;
    if (crmFilterTab === "pending") {
      list = list.filter(c => !c.isSent);
    } else if (crmFilterTab === "sent") {
      list = list.filter(c => c.isSent);
    }
    if (!isSubscribed) {
      return list.slice(0, 10);
    }
    return list;
  }, [fullCrmListWithStatus, crmFilterTab, isSubscribed]);

  const rentTargetData = useMemo(() => {
    const dailyBase = Math.round(monthlyRent / 30);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysPassed = today.getDate();

    const monthSalesToDate = sales
      .filter(s => new Date(s.date) >= startOfMonth && new Date(s.date) < today)
      .reduce((sum, s) => sum + s.price, 0);

    const targetToDate = dailyBase * daysPassed;
    const carryOver = targetToDate - monthSalesToDate;
    const todaysTarget = dailyBase + (carryOver > 0 ? carryOver : 0);

    const todayActual = sales
      .filter(s => format(new Date(s.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
      .reduce((sum, s) => sum + s.price, 0);

    return { dailyBase, carryOver, todaysTarget, todayActual, remaining: Math.max(0, todaysTarget - todayActual) };
  }, [monthlyRent, sales]);

  const filteredMenuItems = useMemo(() => {
    const query = itemSearch.toLowerCase().trim();
    if (!query) return menuItems;
    return menuItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      if (nameMatch) return true;

      if (businessType === "Mobile/Electronics") {
        const imeis = getImeis(item.category).map(x => x.toLowerCase());
        return imeis.some(imei => imei.includes(query));
      }
      return false;
    });
  }, [menuItems, itemSearch, businessType]);

  const udhaarSales = useMemo(() => {
    return sales.filter(s => s.type === "Udhaar");
  }, [sales]);


  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice) return;
    setIsLoading(true);
    try {
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (!store) throw new Error("Store ID not found");
        storeId = store.id;
        setCurrentStoreId(store.id);
      }

      let finalCategory = newItemCategory;
      if (businessType === "Mobile/Electronics") {
        if (unitDetails.length > 0) {
          const encodedUnits = unitDetails
            .filter(u => u.imei && u.imei.trim())
            .map(u => {
              const imei = u.imei.trim();
              const meta = [
                u.color ? `Color:${u.color.trim()}` : "",
                u.purchaseRate ? `Cost:${u.purchaseRate.trim()}` : "",
                u.hsnCode ? `HSN:${u.hsnCode.trim()}` : "",
                u.supplierName ? `Supplier:${u.supplierName.trim()}` : ""
              ].filter(Boolean).join(";");
              return meta ? `IMEI:${imei}{${meta}}` : imei;
            })
            .join(",");
          if (encodedUnits) {
            finalCategory = `${newItemCategory}|IMEIs:${encodedUnits}`;
          }
        } else if (newItemImeis.length > 0) {
          finalCategory = `${newItemCategory}|IMEIs:${newItemImeis.filter(Boolean).map(x => x.trim()).join(",")}`;
        }
      }

      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert([{ store_id: storeId, name: newItemName, price: Number(newItemPrice), category: finalCategory }])
        .select()
        .single();

      if (error) throw error;
      setMenuItems([...menuItems, { id: newItem.id, name: newItem.name, price: newItem.price, category: newItem.category }]);
      setNewItemName(""); setNewItemPrice("");
      setNewItemImeis([]);
      setUnitDetails([]);
    } catch (err: any) {
      alert("Menu Sync Error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpTitle || !newExpAmount) return;
    setIsLoading(true);
    try {
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (!store) throw new Error("Store ID not found");
        storeId = store.id;
        setCurrentStoreId(store.id);
      }

      const { data: newExp, error } = await supabase
        .from('expenses')
        .insert([{ store_id: storeId, title: newExpTitle, amount: Number(newExpAmount) }])
        .select()
        .single();

      if (error) throw error;
      setExpenses([{ id: newExp.id, title: newExp.title, amount: newExp.amount, date: new Date(newExp.expense_date) }, ...expenses]);
      setNewExpTitle(""); setNewExpAmount("");

      // Trigger voice cashier announcement for expense
      try {
        const amt = newExp.amount;
        const announceTemplates: Record<string, string> = {
          hi: `इंस्टामुनिम पर ${amt} रुपये का खर्चा दर्ज हुआ。`,
          mr: `इन्स्टामुनिमवर ${amt} रुपयांचा खर्च नोंदवला गेला。`,
          gu: `ઇન્સ્ટામુનિમ પર ${amt} રૂપિયાનો kharch નોંધાયો છે。`,
          bn: `ইনস্টামুনিমে ${amt} টাকার খরচ নথিভুক্ত করা হয়েছে。`,
          pa: `ਇੰਸਟਾਮੁਨਿਮ 'ਤੇ ${amt} ਰੁਪਏ ਦਾ ਖਰਚਾ ਦਰਜ ਕੀਤਾ ਗਿਆ ਹੈ。`,
          ta: `இன்ஸ்டாமுனிமில் ${amt} ரூபாய் செலவு பதிவு செய்யப்பட்டது。`,
          te: `ఇన్‌స్టామునిమ్‌లో ${amt} రూపాయల ఖర్చు నమోదు చేయబడింది。`,
          kn: `ಇನ್ಸ್ಟಾಮುನಿಮ್ನಲ್ಲಿ ${amt} ರೂಪಾಯಿ ಖರ್ಚು ದಾಖಲಾಗಿದೆ。`,
          ml: `ഇൻസ്റ്റാമുനിമിൽ ${amt} രൂപ ചിലവ് രേഖപ്പെടുത്തി。`,
          en: `Expense of ${amt} rupees logged on InstaMunim。`
        };
        const textToAnnounce = announceTemplates[lang] || announceTemplates['en'];
        announceVoice(textToAnnounce, lang);
      } catch (voiceErr) {
        console.error("Voice announce error inside handleAddExpense:", voiceErr);
      }
    } catch (err: any) {
      alert("Expense Sync Error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (id: string | number) => {
    try {
      const { error } = await supabase.from('sales').update({ payment_type: 'Cash' }).eq('id', id);
      if (error) throw error;

      // Trigger voice cashier announcement for Udhaar payment completion
      const saleToPay = sales.find(s => s.id === id);
      if (saleToPay) {
        const amt = saleToPay.price;
        try {
          const announceTemplates: Record<string, string> = {
            hi: `उधार भुगतान के ${amt} रुपये प्राप्त हुए。`,
            mr: `उधारी देयकाचे ${amt} रुपये प्राप्त झाले。`,
            gu: `ઉધાર ચુકવણીના ${amt} રૂપિયા મળ્યા છે。`,
            bn: `ধার পরিশোধ বাবদ ${amt} টাকা পাওয়া গেছে。`,
            pa: `ਉਧਾਰ ਭੁਗਤਾਨ ਦੇ ${amt} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ。`,
            ta: `கடன் செலுத்திய தொகையாக ${amt} ரூபாய் பெறப்பட்டது。`,
            te: `అప్పు చెల్లింపుగా ${amt} రూపాయలు వచ్చాయి。`,
            kn: `ಉದ್ರಿ ಪಾವತಿಯ ${amt} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ。`,
            ml: `കടം വീട്ടിയ ഇനത്തിൽ ${amt} രൂപ ലഭിച്ചു。`,
            en: `Received ${amt} rupees for udhaar payment。`
          };
          const textToAnnounce = announceTemplates[lang] || announceTemplates['en'];
          announceVoice(textToAnnounce, lang);
        } catch (voiceErr) {
          console.error("Voice announce error inside markAsPaid:", voiceErr);
        }
      }

      setSales(sales.map(s => s.id === id ? { ...s, type: "Cash" } : s));
    } catch (err: any) {
      alert("Failed to update status on cloud.");
    }
  };

  const handleDeleteItem = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Failed to delete item from cloud.");
    }
  };

  const handleScanMenu = async () => {
    if (!scanMenuImage) return;
    setScanMenuLoading(true);
    setScanMenuResults([]);
    try {
      const apiKey = geminiApiKey;
      if (!apiKey) throw new Error("Gemini API key not configured. Please set it in Supabase app_config table with key='gemini_api_key'.");

      const base64Data = scanMenuImage.split(',')[1];
      const mimeType = scanMenuImage.split(';')[0].split(':')[1];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `You are an inventory parser AI. Analyze this card/menu/price-list image and extract ALL ${getLabels(businessType).items.toLowerCase()} with their prices. 

CRITICAL RULE FOR MULTIPLE PRICES/SIZES (e.g., Half, Full, Quarter, Qtr, Small, Medium, Large, Regular, Single, Double, or different package durations/options):
If an item/service has multiple prices based on size/portion/type, split them into separate items by appending the option name in parentheses.
Example: If "Haircut" has Adult = 150 and Child = 80, you must generate TWO separate items:
1. {"name": "Haircut (Adult)", "price": 150}
2. {"name": "Haircut (Child)", "price": 80}

If a product has 500g = 150, 1kg = 280, you must generate TWO separate items:
1. {"name": "Basmati Rice (500g)", "price": 150}
2. {"name": "Basmati Rice (1kg)", "price": 280}

Extract every single item you can see. Return ONLY a minified valid JSON array without any newlines, spaces, or indentation, like this: [{"name":"Haircut","price":150},{"name":"Beard Trim","price":80}]. If price is not visible, use 0. Return ONLY the minified JSON array, no explanation.`
                },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }],
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Attempt to extract JSON array or object
      const arrayMatch = rawText.match(/\[[\s\S]*\]/);
      const objectMatch = rawText.match(/\{[\s\S]*\}/);

      let items: any[] = [];

      if (arrayMatch) {
        try {
          items = JSON.parse(arrayMatch[0]);
        } catch (e: any) {
          console.error("Failed to parse array JSON:", e);
        }
      } else if (objectMatch) {
        try {
          const obj = JSON.parse(objectMatch[0]);
          const possibleArray = Object.values(obj).find(val => Array.isArray(val));
          if (possibleArray) {
            items = possibleArray;
          } else {
            items = Object.entries(obj).map(([key, val]: any) => {
              const price = typeof val === 'number' ? val : (Number(val?.price) || Number(val) || 0);
              return { name: key, price: price };
            });
          }
        } catch (e: any) {
          console.error("Failed to parse object JSON:", e);
        }
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        const blockReason = data.candidates?.[0]?.finishReason;
        if (blockReason && blockReason !== "STOP") {
          throw new Error(`Google Gemini blocked this image. Reason: ${blockReason}. Please try cropping the menu card.`);
        }
        throw new Error(`Could not parse menu. Gemini Output: ${rawText.replace(/[\r\n]+/g, ' ').substring(0, 150)}...`);
      }

      setScanMenuResults(items.map((item: any) => ({
        name: String(item.name || '').trim(),
        price: Number(item.price) || 0,
        selected: true
      })));
      setScanMenuStep('review');
    } catch (err: any) {
      alert('Scan Error: ' + (err.message || 'Unknown error'));
    } finally {
      setScanMenuLoading(false);
    }
  };

  const handleAddScannedItems = async () => {
    const selectedItems = scanMenuResults.filter(i => i.selected && i.name.trim());
    if (selectedItems.length === 0) return alert("Koi item select nahi hai!");

    setIsLoading(true);
    try {
      let storeId = currentStoreId;
      if (!storeId) {
        const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
        if (!store) throw new Error("Store ID not found");
        storeId = store.id;
        setCurrentStoreId(store.id);
      }

      const { data: insertedData, error } = await supabase
        .from('menu_items')
        .insert(selectedItems.map(item => ({ store_id: storeId, name: item.name, price: item.price, category: 'General' })))
        .select();

      if (error) throw error;
      setMenuItems(prev => [...prev, ...insertedData]);
      setShowScanMenuModal(false);
      setScanMenuImage(null);
      setScanMenuResults([]);
      setScanMenuStep('capture');
      alert(`✅ ${insertedData.length} items menu mein add ho gaye!`);
    } catch (err: any) {
      alert("Add Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-10 selection:bg-orange-500/30 overflow-y-auto transition-colors duration-700 ${isDarkMode ? 'bg-[#000000]' : 'bg-[#f8f9fa]'}`}>
        <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 my-auto py-8">
          <Card className={`border-0 rounded-2xl p-8 overflow-hidden transition-all duration-700 ${isDarkMode ? 'bg-transparent shadow-none border-none' : 'bg-white shadow-2xl shadow-zinc-200'}`}>
            <div className="flex flex-col items-center text-center mb-6 pt-14 sm:pt-16">
              <div className="w-full flex justify-center">
                <div className="w-full max-w-[420px] h-64 relative animate-in zoom-in duration-700 flex items-center justify-center">
                  <img
                    src={isDarkMode ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
                    alt="InstaMunim Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {authMode === "login" && (
              <div className="flex flex-col items-center justify-center pb-6 border-b border-dashed border-zinc-200 dark:border-zinc-800 mb-6">
                <Button
                  type="button"
                  onClick={() => { setAuthMode("signup"); setLoginError(""); }}
                  className="w-full max-w-[340px] h-14 rounded-2xl font-black text-xs bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest animate-pulse"
                >
                  <PlusCircle className="h-4 w-4" /> Create Free Account
                </Button>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-2">New merchant? Start business in 5 seconds</p>
              </div>
            )}

            {authMode === "signup" && (
              <div className="flex flex-col items-center justify-center pb-6 border-b border-dashed border-zinc-200 dark:border-zinc-800 mb-6">
                <Button
                  type="button"
                  onClick={() => { setAuthMode("login"); setLoginError(""); }}
                  className={`w-full max-w-[340px] h-14 rounded-2xl font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'}`}
                >
                  Already have an account? Login
                </Button>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className={`text-xl font-black leading-none uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {authMode === "login" ? "Owner Login" : "Store Registration"}
              </h2>
              <p className="text-zinc-400 text-[10px] font-bold mt-2 uppercase tracking-widest">
                {authMode === "login" ? "Welcome back to your POS Dashboard" : "Register your business in 10 seconds"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Store Name</Label>
                    <Input
                      placeholder="e.g. Khan Kitchen"
                      value={signupStoreName}
                      onChange={e => setSignupStoreName(e.target.value)}
                      required
                      className={`h-14 rounded-xl border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-orange-500 transition-all text-sm ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Business Type</Label>
                    <Select value={signupBusinessType} onValueChange={(val: any) => setSignupBusinessType(val)}>
                      <SelectTrigger className={`h-14 rounded-xl border-0 font-bold px-6 focus:ring-2 focus:ring-orange-500 transition-all text-sm ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-50'}`}>
                        <SelectValue placeholder="Select Business Type" />
                      </SelectTrigger>
                      <SelectContent className={`max-h-[300px] overflow-y-auto ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100'}`}>
                        {Object.entries(BUSINESS_CATEGORIES).map(([key, value]) => (
                          <SelectItem key={key} value={key} className="font-bold py-3">
                            {value.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Owner Mobile</Label>
                <div className="relative group">
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 p-1 border-r ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}>
                    <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <Input
                    placeholder="99XXXXXXXX"
                    value={loginMobile}
                    onChange={e => setLoginMobile(e.target.value)}
                    required
                    className={`h-14 rounded-xl border-0 font-bold pl-16 focus-visible:ring-2 focus-visible:ring-orange-500 text-base transition-all ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-50'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Secret Password</Label>
                <div className="relative group">
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 p-1 border-r ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}>
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className={`h-14 rounded-xl border-0 font-bold pl-16 pr-14 focus-visible:ring-2 focus-visible:ring-orange-500 text-base tracking-widest transition-all ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-50'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 mb-4">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="rememberMe" className="text-xs font-bold text-zinc-500 cursor-pointer uppercase tracking-widest">Remember Me</label>

                <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 transition-all">
                  {isDarkMode ? <Sun className="h-4 w-4 text-orange-500" /> : <Moon className="h-4 w-4 text-zinc-400" />}
                </button>
              </div>

              {authMode === "signup" && (
                <div className="flex items-center gap-2.5 px-1 py-1 mb-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    required
                    className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <label className="text-xs font-bold text-zinc-500 cursor-pointer uppercase tracking-tight">
                    I accept <span onClick={(e) => { e.preventDefault(); setTermsModalTab('privacy'); setShowTermsModal(true); }} className="text-orange-500 underline hover:text-orange-600 cursor-pointer">Privacy Policy</span> & <span onClick={(e) => { e.preventDefault(); setTermsModalTab('terms'); setShowTermsModal(true); }} className="text-orange-500 underline hover:text-orange-600 cursor-pointer">Terms</span>
                  </label>
                </div>
              )}


              {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}

              <div className="flex justify-center pt-2">
                <Button type="submit" className={`w-full max-w-[260px] h-14 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest ${isDarkMode ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20' : 'bg-zinc-900 hover:bg-black text-white shadow-zinc-900/20'}`}>
                  {authMode === "login" ? "Access Dashboard" : "Start Business"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>

          <p className="text-center text-[8px] font-bold text-zinc-300 uppercase tracking-widest">
            Secured by InstaMunim Cloud Gateway
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-orange-500/30 ${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#fafafa] text-zinc-900'}`}
      style={{ paddingTop: isAdMobActive && adProvider === "admob" ? `${admobHeight}px` : "0px" }}
    >
      {((adProvider === "web" || (adProvider === "admob" && isAdMobBannerFailed)) && !isProOrAbove && webAdScriptUrl) && (
        <WebAdBanner scriptUrl={webAdScriptUrl} adKey={webAdKey} />
      )}
      {((adProvider === "web" || (adProvider === "admob" && isAdMobBannerFailed)) && !isSubscribed && webAdVignetteUrl && webAdVignetteKey) && (
        <WebVignetteAd scriptUrl={webAdVignetteUrl} adKey={webAdVignetteKey} />
      )}
      <main className="flex-1 pb-24 overflow-y-auto">
        <div className="max-w-full px-2 sm:px-4 py-8">

          {remoteAlertEnabled && remoteAlertText && (
            <div className="mx-2 mb-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-orange-500/10 border border-orange-400/20 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <Megaphone size={18} className="shrink-0 animate-bounce" />
                <span className="text-xs font-black leading-relaxed">{remoteAlertText}</span>
              </div>
              <button
                onClick={() => setRemoteAlertEnabled(false)}
                className="p-1 hover:bg-white/10 active:scale-90 transition-all rounded-lg border-0"
                style={{ background: 'transparent', color: '#ffffff' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
            <DialogContent className="p-0 border-0 max-w-[380px] w-[90%] left-1/2 -translate-x-1/2 bottom-4 top-auto !translate-y-0 bg-white dark:bg-zinc-950 rounded-2xl h-auto max-h-[94vh] overflow-hidden flex flex-col shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] fixed">
              <div className="p-5 pb-2 shrink-0 flex items-start justify-between relative">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Cash Entry</h2>
                  <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                    {isListening ? (
                      <div className="space-y-1">
                        <span className={`animate-pulse flex items-center gap-1 uppercase tracking-widest text-[9px] ${voiceStatus === 'Error' ? 'text-red-500' : 'text-orange-600'}`}>
                          <Mic className="h-2.5 w-2.5" /> {voiceInstruction}
                        </span>
                        <div className="flex gap-2 items-center">
                          <Badge className={`text-[7px] font-black px-2 py-0 ${voiceStatus === 'Listening' ? 'bg-emerald-500' : 'bg-zinc-400'} text-white rounded-full`}>
                            {voiceStatus.toUpperCase()}
                          </Badge>
                          {lastMatch && (
                            <div className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black inline-block animate-bounce">
                              MATCHED: {lastMatch}
                            </div>
                          )}
                        </div>
                        {liveTranscript && (
                          <p className="text-[8px] font-medium text-zinc-400 italic truncate max-w-[200px]">
                            " {liveTranscript} "
                          </p>
                        )}
                        {voiceHistory.length > 0 && (
                          <div className="flex flex-wrap gap-1 opacity-60">
                            {voiceHistory.map((h, i) => (
                              <span key={i} className="text-[7px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full whitespace-nowrap border border-zinc-200 dark:border-zinc-700">Suna: {h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : "Tap items or use Voice Control"}
                  </p>
                </div>
                <div className="flex items-center gap-2 pr-6">
                  <button
                    onClick={toggleVoiceBilling}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-600 text-white shadow-orange-600/40'}`}
                  >
                    <Mic className="h-6 w-6" />
                  </button>
                  <button onClick={() => setIsSaleOpen(false)} className="text-zinc-300 hover:text-zinc-500"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-4 scrollbar-hide">
                {/* SELECT ITEMS SECTION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Select {getLabels(businessType).items}</h4>
                    <button
                      onClick={() => {
                        setIsManualMode(!isManualMode);
                        if (!isManualMode) {
                          setManualItemName(itemSearch); // Autofill manual name from search query if any
                        }
                      }}
                      className="text-[11px] font-black uppercase px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-500/30 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white transition-all active:scale-95 flex items-center gap-1 border-0"
                    >
                      {isManualMode ? "← Show Menu" : "+ Custom Entry"}
                    </button>
                  </div>

                  {isManualMode ? (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Custom Product Detail</p>
                      <div className="space-y-2">
                        <Input
                          placeholder="Product Name (e.g. Cold Drink)"
                          value={manualItemName}
                          onChange={e => setManualItemName(e.target.value)}
                          className="h-10 rounded-xl bg-white dark:bg-zinc-950 font-bold text-xs"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Price (₹)"
                            value={manualItemPrice}
                            onChange={e => setManualItemPrice(e.target.value)}
                            className="h-10 rounded-xl bg-white dark:bg-zinc-950 font-black text-xs flex-1"
                          />
                          <button
                            onClick={handleAddManualItem}
                            className="h-10 px-4 bg-orange-600 text-white rounded-xl font-black text-xs hover:bg-orange-700 active:scale-95 transition-all shadow-md shadow-orange-600/20"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                          <Input
                            ref={itemSearchInputRef}
                            placeholder={`Search ${getLabels(businessType).items.toLowerCase()}...`}
                            value={itemSearch}
                            onChange={e => {
                              const val = e.target.value;
                              setItemSearch(val);
                              if (businessType === "Mobile/Electronics") {
                                const query = val.trim();
                                if (query) {
                                  const matchedItem = menuItems.find(item => {
                                    const imeis = getImeis(item.category);
                                    return imeis.some(x => x.toLowerCase() === query.toLowerCase());
                                  });
                                  if (matchedItem) {
                                    playBeep();
                                    addToCart({
                                      ...matchedItem,
                                      imei: query
                                    });
                                    setItemSearch("");
                                  }
                                }
                              }
                            }}
                            className="h-10 pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-0 font-bold placeholder:text-zinc-300 text-xs w-full"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            if (!isSubscribed) {
                              setShowUpgradeModal(true);
                            } else {
                              if (Capacitor.isNativePlatform()) {
                                try {
                                  const status = await BarcodeScanner.checkPermissions();
                                  if (status.camera !== 'granted') {
                                    const req = await BarcodeScanner.requestPermissions();
                                    if (req.camera !== 'granted') {
                                      alert("Camera permission denied.");
                                      return;
                                    }
                                  }

                                  // Check if Google Barcode Scanner module is available on Android
                                  if (Capacitor.getPlatform() === 'android') {
                                    try {
                                      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
                                      if (!available) {
                                        await BarcodeScanner.installGoogleBarcodeScannerModule();
                                      }
                                    } catch (moduleErr) {
                                      console.warn("Google Barcode Module error:", moduleErr);
                                    }
                                  }

                                  const { barcodes } = await BarcodeScanner.scan({
                                    formats: ['codabar', 'code_39', 'code_93', 'code_128', 'ean_8', 'ean_13', 'itf', 'pdf417', 'upc_a', 'upc_e']
                                  });
                                  if (barcodes && barcodes.length > 0) {
                                    const imeiBarcode = barcodes.find(b => /^\d{14,16}$/.test(b.rawValue.trim()));
                                    const scannedValue = imeiBarcode ? imeiBarcode.rawValue.trim() : barcodes[0].rawValue.trim();
                                    handleScanSuccess(scannedValue);
                                  }
                                } catch (err: any) {
                                  console.error("Native scan error:", err);
                                  alert("Scanning failed: " + (err.message || err));
                                }
                              } else {
                                scannerTargetRef.current = "cart";
                                setShowScanner(true);
                              }
                            }
                          }}
                          className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors active:scale-95 shadow-sm"
                          title="Scan Barcode"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                      </div>

                      {filteredMenuItems.length === 0 ? (
                        itemSearch.trim() && (
                          <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-dashed border-orange-200 dark:border-orange-900/30 text-center space-y-2 animate-in fade-in duration-300">
                            <p className="text-[10px] font-bold text-zinc-500">"{itemSearch}" nahi mila.</p>
                            <div className="flex gap-2 justify-center max-w-[260px] mx-auto">
                              <Input
                                type="number"
                                placeholder="Price (₹)"
                                id="direct-price-input"
                                className="h-8 rounded-lg bg-white dark:bg-zinc-950 font-black text-[10px] text-center w-24"
                              />
                              <button
                                onClick={() => {
                                  const priceInput = document.getElementById("direct-price-input") as HTMLInputElement;
                                  const price = Number(priceInput?.value || 0);
                                  if (price <= 0) return alert("Bhai, sahi price daalo.");
                                  addToCart({ name: itemSearch.trim(), price });
                                  setItemSearch(""); // clear search
                                }}
                                className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-black text-[10px] transition-all active:scale-95"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1.5">
                            {filteredMenuItems.slice(0, 15).map(item => {
                              const qty = getImeis(item.category).length;
                              return (
                                <button key={item.id} onClick={() => addToCart(item)} className="p-1.5 bg-white dark:bg-zinc-900 rounded-xl text-left border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between min-h-[58px]">
                                  <p className="font-bold text-[10px] text-zinc-900 dark:text-white lowercase leading-tight truncate w-full">{item.name}</p>
                                  <div className="flex justify-between items-center w-full mt-1 gap-1">
                                    <p className="text-[8px] font-bold text-zinc-400 shrink-0">₹{item.price}</p>
                                    {businessType === "Mobile/Electronics" && (
                                      <span className={`text-[6.5px] font-black px-1 py-0.5 rounded shrink-0 uppercase tracking-wider ${qty > 0
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400'}`}
                                      >
                                        {qty > 0 ? `Qty: ${qty}` : 'Out'}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {filteredMenuItems.length > 15 && (
                            <p className="text-[9px] text-center text-zinc-400 font-bold mt-1 uppercase tracking-wider">
                              + {filteredMenuItems.length - 15} more items (search to find)
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* ORDER SUMMARY SECTION */}
                <div className="space-y-4 pb-6">
                  <div className="flex items-center gap-2 text-orange-600">
                    <ShoppingCart className="h-4 w-4" />
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Order Summary</h4>
                  </div>

                  <div className="min-h-[80px] flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[1.5rem] p-3 border border-zinc-200 dark:border-zinc-800">
                    {cart.length === 0 ? (
                      <div className="text-center space-y-2 opacity-20">
                        <ShoppingCart className="h-8 w-8 mx-auto" />
                        <p className="text-[8px] font-black uppercase tracking-widest italic">Cart is empty</p>
                      </div>
                    ) : (
                      <div className="w-full divide-y dark:divide-zinc-800">
                        {cart.map(c => (
                          <div key={c.name} className="flex flex-col py-2 first:pt-0 last:pb-0 gap-2">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex flex-col">
                                <span className="font-bold text-[11px]">{c.name}</span>
                                <span className="text-[9px] text-zinc-400">₹{c.price} per unit</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-1 rounded-lg">
                                <button onClick={() => removeFromCart(c.name)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"><Minus className="h-3 w-3" /></button>
                                <span className="font-black text-xs px-1 min-w-[20px] text-center">{c.qty}</span>
                                <button onClick={() => addToCart({ name: c.name, price: c.price })} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-orange-600 transition-colors"><Plus className="h-3 w-3" /></button>
                              </div>
                            </div>
                            {businessType === "Mobile/Electronics" && (
                              <div className="flex items-center gap-2 mt-1 w-full">
                                <ImeiInput
                                  placeholder="IMEI / Serial Number"
                                  value={c.imei || ""}
                                  onChange={val => updateCartItemImei(c.name, val)}
                                  className="h-8 flex-1 rounded-xl bg-white dark:bg-zinc-800 border-0 font-bold px-3 text-[10px]"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-1">Extra Charges (Delivery/Packing)</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Delivery"
                        value={extraChargeName}
                        onChange={e => setExtraChargeName(e.target.value)}
                        className="h-9 flex-1 rounded-xl bg-white dark:bg-zinc-800 border-0 font-bold px-4 text-[11px]"
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={extraChargeAmount}
                        onChange={e => setExtraChargeAmount(e.target.value)}
                        className="h-9 w-20 rounded-xl bg-white dark:bg-zinc-800 border-0 font-bold px-3 text-[11px] text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-1">Discount (₹)</p>
                    <div className="flex gap-2">
                      <Input
                        ref={discountInputRef}
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                        className="h-9 flex-1 rounded-xl bg-white dark:bg-zinc-800 border-0 font-bold px-4 text-[11px]"
                      />
                    </div>
                  </div>

                  {availableCoupons.length > 0 && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800/40 space-y-2">
                      <p className="text-[8px] font-black text-[#00c875] uppercase tracking-widest px-1">Available Coupons 🎉</p>
                      <div className="space-y-1.5">
                        {availableCoupons.map((coupon) => (
                          <div key={coupon.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div>
                              <span className="font-mono text-xs font-black text-orange-500 tracking-wider block">{coupon.code}</span>
                              <span className="text-[8px] font-bold text-zinc-400">Save ₹{coupon.discount_amount} on this bill</span>
                            </div>
                            {appliedCouponId === coupon.id ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDiscount("");
                                  setAppliedCouponId(null);
                                }}
                                className="h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider px-2 border-0"
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDiscount(coupon.discount_amount.toString());
                                  setAppliedCouponId(coupon.id);
                                }}
                                className="h-7 bg-[#00c875] hover:bg-[#00b067] text-white rounded-lg text-[9px] font-black uppercase tracking-wider px-3 border-0"
                              >
                                Apply
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Grand Total</p>
                      <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
                        ₹{grandTotal}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input placeholder="Customer Name (Optional)" value={newName} onChange={e => setNewName(e.target.value)} className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 text-sm" />
                    <Input
                      ref={customerMobileInputRef}
                      placeholder="Mobile Number (Optional)"
                      value={newMobile}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setNewMobile(val);
                      }}
                      className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 text-sm"
                    />

                    {newType === "Cash" && (
                      <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest pl-1">Cash Received</span>
                          <Input
                            type="number"
                            placeholder={grandTotal.toString()}
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value)}
                            className="w-28 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-black text-sm text-center shadow-sm"
                          />
                        </div>
                        <div className="h-[1px] bg-orange-200/50 dark:bg-orange-900/30 w-full" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">Return Change</span>
                          <span className="text-lg font-black text-emerald-600">
                            ₹{Math.max(0, Number(cashReceived) - grandTotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {newType === "Online" && (
                      <div className="p-6 bg-zinc-950 text-white rounded-[2rem] border border-zinc-850 flex flex-col items-center justify-center space-y-4 text-center w-full">
                        {storeUpiId ? (
                          <>
                            <div className="relative p-4 bg-white rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                  `upi://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeUpiName || restaurantName)}&am=${grandTotal}&cu=INR&tn=Invoice`
                                )}`}
                                alt="UPI Payment QR Code"
                                className="w-40 h-40 object-contain"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">SCAN TO PAY</p>
                              <p className="text-2xl font-black text-orange-500">₹{grandTotal.toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-zinc-300 leading-none">
                                Paying to: <span className="text-white font-extrabold">{storeUpiName || restaurantName}</span>
                              </p>
                              <p className="text-[8px] font-bold text-zinc-500 leading-none mt-1 select-all" title="Click to copy UPI ID">{storeUpiId}</p>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3 p-4">
                            <p className="text-[11px] font-bold text-amber-500 leading-relaxed uppercase tracking-wider">⚠️ UPI ID Not Configured</p>
                            <p className="text-[9px] text-zinc-400 leading-relaxed font-semibold">
                              Please go to <span className="font-extrabold text-white">Settings &gt; Store Profile</span> and save or upload your UPI QR code scanner first.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {newType === "Finance" && (
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 space-y-3 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">Finance Company</span>
                          <select
                            value={financeCompany}
                            onChange={e => setFinanceCompany(e.target.value)}
                            className="h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-2 text-xs shadow-sm"
                          >
                            <option value="Bajaj Finserv">Bajaj Finserv</option>
                            <option value="HDB Finance">HDB Finance</option>
                            <option value="IDFC First Bank">IDFC First Bank</option>
                            <option value="TVS Credit">TVS Credit</option>
                            <option value="Home Credit">Home Credit</option>
                            <option value="Other">Other Finance</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">Down Payment (₹)</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={financeDownPayment}
                            onChange={e => setFinanceDownPayment(e.target.value)}
                            className="w-28 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-black text-sm text-center shadow-sm"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">Loan Amount (₹)</span>
                          <span className="text-lg font-black text-emerald-600">
                            ₹{Math.max(0, grandTotal - (Number(financeDownPayment) || 0))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">File / App ID</span>
                          <Input
                            placeholder="e.g. BJ-9921"
                            value={financeFileId}
                            onChange={e => setFinanceFileId(e.target.value)}
                            className="w-32 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-center shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {newType === "Split" && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20 space-y-3 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-1">Cash Amount</span>
                          <Input
                            type="number"
                            placeholder="₹ Cash"
                            value={splitCash}
                            onChange={e => setSplitCash(e.target.value)}
                            className="w-32 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-center shadow-sm"
                          />
                        </div>
                        <div className="h-[1px] bg-purple-200/50 dark:bg-purple-900/30 w-full" />
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-1">UPI Amount</span>
                          <span className="text-lg font-black text-purple-600 pr-2">
                            ₹{Math.max(0, grandTotal - (Number(splitCash) || 0))}
                          </span>
                        </div>
                      </div>
                    )}

                    {newType === "Credit Card" && (
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3 text-left animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            💳 Credit Card & EMI Details
                          </span>
                        </div>

                        <div className="flex flex-col space-y-2.5 w-full">
                          {/* 1. Bank Name */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">1. Bank Name</Label>
                            <select
                              value={cardBankName}
                              onChange={e => setCardBankName(e.target.value)}
                              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-3.5 shadow-sm focus:border-indigo-500"
                            >
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="SBI Card">SBI Card</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra">Kotak Mahindra</option>
                              <option value="OneCard">OneCard</option>
                              <option value="Other Bank">Other Bank</option>
                            </select>
                          </div>

                          {/* 2. Card Network */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">2. Card Network</Label>
                            <select
                              value={cardType}
                              onChange={e => setCardType(e.target.value)}
                              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-3.5 shadow-sm focus:border-indigo-500"
                            >
                              <option value="Visa">Visa</option>
                              <option value="Mastercard">Mastercard</option>
                              <option value="RuPay">RuPay</option>
                              <option value="Amex">American Express</option>
                            </select>
                          </div>

                          {/* 3. POS Terminal */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">3. POS Machine</Label>
                            <select
                              value={cardPosTerminal}
                              onChange={e => setCardPosTerminal(e.target.value)}
                              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-3.5 shadow-sm focus:border-indigo-500"
                            >
                              <option value="Pine Labs POS">Pine Labs POS</option>
                              <option value="Paytm POS">Paytm POS</option>
                              <option value="Plutus POS">Plutus POS</option>
                              <option value="Mosambee POS">Mosambee POS</option>
                              <option value="PhonePe POS">PhonePe POS</option>
                              <option value="Other POS">Other Machine</option>
                            </select>
                          </div>

                          {/* 4. EMI Plan */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">4. Payment / EMI Plan</Label>
                            <select
                              value={cardEmiTenure}
                              onChange={e => setCardEmiTenure(e.target.value)}
                              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-black px-3.5 shadow-sm text-indigo-600 focus:border-indigo-500"
                            >
                              <option value="Full Payment">Full Payment (No EMI)</option>
                              <option value="3 Months EMI">3 Months No-Cost EMI</option>
                              <option value="6 Months EMI">6 Months No-Cost EMI</option>
                              <option value="9 Months EMI">9 Months Low-Cost EMI</option>
                              <option value="12 Months EMI">12 Months Low-Cost EMI</option>
                            </select>
                          </div>

                          {/* 5. Auth / POS Slip Code */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">5. Auth / POS Slip Code</Label>
                            <Input
                              placeholder="e.g. 482910"
                              value={cardAuthCode}
                              onChange={e => setCardAuthCode(e.target.value)}
                              className="h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-3.5 shadow-sm focus:border-indigo-500"
                            />
                          </div>

                          {/* 6. Cardholder Name */}
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">6. Cardholder Name (Optional)</Label>
                            <Input
                              placeholder="Name on card"
                              value={cardHolderName}
                              onChange={e => setCardHolderName(e.target.value)}
                              className="h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-3.5 shadow-sm focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative w-44">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 appearance-none focus:ring-0 text-xs shadow-sm"
                      >
                        <option value="Cash">Cash Sale</option>
                        <option value="Online">Online/UPI</option>
                        <option value="Credit Card">Credit Card / Card EMI</option>
                        <option value="Split">Split (Cash + UPI)</option>
                        <option value="Udhaar">Udhaar Khata</option>
                        <option value="Swiggy">{getPartnerName(businessType, "Swiggy")}</option>
                        <option value="Zomato">{getPartnerName(businessType, "Zomato")}</option>
                        {businessType === "Mobile/Electronics" && (
                          <option value="Finance">Finance / EMI</option>
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    onClick={handleSale}
                    disabled={isLoading}
                    className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl uppercase tracking-widest mt-2"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {activeTab === "Dashboard" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 px-1">
              {/* COMPACT HEADER */}
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 pb-3">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      {storeLogo ? (
                        <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-sm">
                          {restaurantName?.charAt(0) || "M"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm tracking-tight leading-none uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {restaurantName || "My Store"}
                        </span>
                        <div className="bg-emerald-500/10 text-emerald-500 text-[7px] font-bold px-1.5 h-3.5 rounded-full flex items-center gap-1 uppercase tracking-tighter"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live</div>
                      </div>
                      <div className="text-[7px] font-bold text-orange-500 uppercase tracking-widest leading-none mt-1">Beyond Billing</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
                  <Select value={lang} onValueChange={(val) => {
                    setLang(val || "en");
                    const testPhrases: Record<string, string> = {
                      en: "Language set to English",
                      hi: "भाषा हिन्दी सेट की गई है",
                      mr: "भाषा मराठी सेट केली आहे",
                      gu: "ભાષા ગુજરાતી સેટ કરવામાં આવી છે",
                      bn: "ভাষা বাংলা সেট করা হয়েছে",
                      pa: "ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਸੈੱਟ ਕੀਤੀ ਗਈ ਹੈ",
                      ta: "மொழி தமிழ் அமைக்கப்பட்டுள்ளது",
                      te: "భాష తెలుగు సెట్ చేయబడింది",
                      kn: "ಭಾಷೆ ಕನ್ನಡ ಹೊಂದಿಸಲಾಗಿದೆ",
                      ml: "ഭാഷ മലയാളം സജ്ജമാക്കിയിരിക്കുന്നു"
                    };
                    const text = testPhrases[val || "en"] || "Language updated";
                    setTimeout(() => {
                      announceVoice(text, val || "en");
                    }, 200);
                  }}>
                    <SelectTrigger className="h-7 rounded-full bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm font-bold text-[8px] px-2.5 gap-1 text-zinc-600 dark:text-zinc-300">
                      <Globe className="h-3.5 w-3.5 text-zinc-400" />
                      <SelectValue placeholder="Lang" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0 shadow-2xl font-bold">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                      <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full px-2 py-0.5 shadow-sm text-zinc-650 dark:text-zinc-350">
                    <Filter className="h-3 w-3 text-zinc-400 mr-0.5" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-[8px] font-black focus:outline-none text-zinc-700 dark:text-zinc-300 w-[80px] border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[8px] text-zinc-400 font-bold px-0.5">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-[8px] font-black focus:outline-none text-zinc-700 dark:text-zinc-300 w-[80px] border-0 p-0 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                    className="h-7 w-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 active:scale-90 transition-all"
                    title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                  >
                    {isPrivacyMode ? <EyeOff className="h-3.5 w-3.5 text-zinc-500" /> : <Eye className="h-3.5 w-3.5 text-zinc-500" />}
                  </button>
                </div>
              </header>

              {/* ACTION ROW COMPACT */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsSyncing(true);
                    let storeId = currentStoreId;
                    if (!storeId) {
                      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
                      if (store) {
                        storeId = store.id;
                        setCurrentStoreId(store.id);
                      }
                    }
                    if (storeId) {
                      await fetchStoreData(storeId);
                      setLastSyncedTime(format(new Date(), "hh:mm:ss aa"));
                    }
                    setIsSyncing(false);
                  }}
                  className="h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 font-bold text-[9px] uppercase tracking-widest gap-1.5 shadow-sm active:scale-90 transition-all"
                >
                  <RefreshCw className={`h-3 w-3 text-zinc-400 ${isSyncing ? 'animate-spin' : ''}`} /> {t("Cloud Sync")}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateAIInsight}
                  className="h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 font-bold text-[9px] uppercase tracking-widest gap-1.5 shadow-sm active:scale-90 transition-all"
                >
                  <Send className="h-3 w-3 text-indigo-500" /> {t("AI Insights")}
                </Button>
              </div>

              {/* AI INSIGHTS DIALOG */}
              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-0 p-0 overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="p-8 space-y-6">
                    <header className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center">
                          <Send className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter">{t("AI Business Advisor")}</h2>
                      </div>
                      <button onClick={() => setIsAIDialogOpen(false)} className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all">
                        <X className="h-4 w-4" />
                      </button>
                    </header>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border-l-[6px] border-indigo-600 relative overflow-hidden">
                      <p className="text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed text-sm">
                        {aiInsightText || "Analyzing your business data to provide smart suggestions..."}
                      </p>
                    </div>

                    <Button onClick={() => setIsAIDialogOpen(false)} className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-zinc-900/20">
                      Got it, Thanks!
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* NO-SCROLL METRICS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-[1.5rem] border-0 shadow-lg shadow-orange-600/10 h-32 flex flex-col justify-between">
                  <p className="text-[13px] font-black uppercase tracking-wider">{t("Net Profit")}</p>
                  <div>
                    <h3 className={`text-[28px] font-black tracking-tight leading-none transition-all duration-300 ${isPrivacyMode ? 'blur-[8px] select-none pointer-events-none' : ''}`}>₹{Math.round(netProfit)}</h3>
                    <p className="text-[11px] font-black uppercase mt-1 tracking-wider leading-none">{t("After Expenses")}</p>
                  </div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border-0 shadow-sm border-b-[3px] border-blue-500 h-32 flex flex-col justify-between">
                  <p className="text-[13px] font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">{t("Gross Sales")}</p>
                  <div>
                    <h3 className={`text-[28px] font-black tracking-tight leading-none transition-all duration-300 ${isPrivacyMode ? 'blur-[8px] select-none pointer-events-none' : ''}`}>₹{totalSales}</h3>
                    <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mt-1 tracking-wider leading-none">{t("Gross Income")}</p>
                  </div>
                </Card>

                <Card
                  onClick={() => setActiveTab("Khata")}
                  className="bg-[#fff1f1] dark:bg-red-950/20 p-4 rounded-[1.5rem] border-0 h-32 flex flex-col justify-between active:scale-95 transition-all cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <p className="text-[13px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider">{t("Pending Udhaar")}</p>
                  <div>
                    <h3 className={`text-[28px] font-black text-red-600 tracking-tight leading-none transition-all duration-300 ${isPrivacyMode ? 'blur-[8px] select-none pointer-events-none' : ''}`}>₹{totalUdhaar}</h3>
                    <p className="text-[11px] font-black text-red-500 dark:text-red-400 uppercase mt-1 flex items-center gap-1 leading-none"><Users className="h-2.5 w-2.5" /> {t("From Khata")}</p>
                  </div>
                </Card>

                <Card
                  onClick={() => setShowExpenseBreakdown(true)}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border-0 shadow-sm border-b-[3px] border-purple-500 h-32 flex flex-col justify-between active:scale-95 transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                >
                  <p className="text-[13px] font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">{t("Total Expense")}</p>
                  <div>
                    <h3 className={`text-[28px] font-black tracking-tight leading-none transition-all duration-300 ${isPrivacyMode ? 'blur-[8px] select-none pointer-events-none' : ''}`}>₹{Math.round(totalExpenses)}</h3>
                    <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mt-1 tracking-wider leading-none">{t("Operational Costs")}</p>
                  </div>
                </Card>
              </div>

              {/* RECENT SALES SUPER COMPACT */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-lg font-bold tracking-tight">{t("Recent Sales")}</h3>
                  <button onClick={() => setActiveTab("Total Sale Report")} className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{t("View All")}</button>
                </div>
                <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 divide-y dark:divide-zinc-800 overflow-hidden">
                  {filteredSales.slice(0, 3).map(s => (
                    <div key={s.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[13px] leading-tight">{s.name}</p>
                        <div className="text-[8px] font-medium text-zinc-400 flex flex-wrap items-center gap-1.5">
                          <span>{format(new Date(s.date), "hh:mm aa")}</span>
                          <span>•</span>
                          {s.type && s.type.includes("Split") ? (
                            <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1 rounded-sm font-bold uppercase">{s.type.replace("Split ", "SPLIT: ")}</span>
                          ) : s.type === "Finance" ? (
                            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-1 rounded-sm font-bold uppercase">
                              FINANCE: {(() => {
                                const m = (s.item || "").match(/\[FINANCE:([^:]+):/);
                                return m ? m[1] : "Bajaj";
                              })()}
                            </span>
                          ) : (
                            <span className={`px-1 rounded-sm font-bold ${s.type === 'Cash' ? 'text-emerald-600 bg-emerald-50' : s.type === 'Swiggy' || s.type === 'Zomato' ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' : 'text-blue-600 bg-blue-50'}`}>{getPartnerName(businessType, s.type)}</span>
                          )}
                        </div>
                      </div>
                      <p className={`text-base font-bold tracking-tight transition-all duration-300 ${isPrivacyMode ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                        ₹{s.price - (s.commission || 0)}
                      </p>
                    </div>
                  ))}
                  {filteredSales.length === 0 && (
                    <div className="py-10 text-center text-zinc-300 font-medium italic text-xs">No recent sales</div>
                  )}
                </Card>
              </div>

              {/* QUICK EXPENSE CARD */}
              <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                <div className="bg-[#fff1f1] dark:bg-red-950/20 py-4 px-6">
                  <h3 className="text-red-600 font-bold text-sm uppercase tracking-widest">Quick Expense</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="What did you buy?"
                      value={newExpTitle}
                      onChange={e => setNewExpTitle(e.target.value)}
                      className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-medium px-6 focus-visible:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Amount (₹)"
                      value={newExpAmount}
                      onChange={e => setNewExpAmount(e.target.value)}
                      className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-medium px-6 focus-visible:ring-red-500"
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all uppercase tracking-widest">
                    SAVE EXPENSE
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "Rent" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
              <header className="relative">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter">Rent Mission</h2>
                <p className="text-zinc-500 font-bold flex items-center gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Stay ahead of your shop costs.</p>
              </header>

              {!isSubscribed ? (
                <Card className="bg-gradient-to-br from-zinc-900 to-black text-white p-10 rounded-[3rem] border border-zinc-800 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                  <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center relative animate-pulse shadow-inner">
                    <Lock className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Rent Tracker Locked</h3>
                    <p className="text-zinc-400 font-bold text-xs max-w-sm mx-auto leading-relaxed">
                      Automatic carry-over cost calculation, Rent ledger, and daily target tracker are premium features of the Smart Business Plan.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent(`Hi Admin, I want to upgrade to the Paid Plan to unlock Rent Tracker for: ${restaurantName} (${ownerMobile}).`)}`, "_blank")}
                    className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all z-10"
                  >
                    Activate Smart Business Plan
                  </Button>
                </Card>
              ) : (
                <>
                  <Card className="bg-blue-600 text-white p-10 rounded-[3rem] border-0 relative overflow-hidden shadow-2xl shadow-blue-600/30">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <Badge className="bg-white text-blue-600 border-0 font-black px-4 py-1.5 mb-6 rounded-full shadow-lg">MISSION TARGET</Badge>
                    <h3 className="text-7xl font-black tracking-tighter mb-2">₹{rentTargetData.todaysTarget}</h3>
                    <p className="text-lg font-bold opacity-80 uppercase tracking-[0.2em]">Remaining Today</p>

                    <div className="mt-12 space-y-4">
                      <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                        <span>Performance</span>
                        <span className="text-xl">{Math.min(100, Math.round((rentTargetData.todayActual / rentTargetData.todaysTarget) * 100 || 0))}%</span>
                      </div>
                      <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden p-1">
                        <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${Math.min(100, (rentTargetData.todayActual / rentTargetData.todaysTarget) * 100 || 0)}%` }} />
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-zinc-200 dark:bg-zinc-800" />
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Fixed Cost</p>
                      <h4 className="text-3xl font-black">₹{rentTargetData.dailyBase}</h4>
                      <p className="text-[9px] font-bold text-zinc-400 mt-2 italic">Base daily rent</p>
                    </Card>
                    <Card className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                      <div className={`absolute left-0 top-0 w-1.5 h-full ${rentTargetData.carryOver > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">History Impact</p>
                      <h4 className={`text-3xl font-black ${rentTargetData.carryOver > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {rentTargetData.carryOver > 0 ? `+₹${rentTargetData.carryOver}` : `-₹${Math.abs(rentTargetData.carryOver)}`}
                      </h4>
                      <p className="text-[9px] font-bold text-zinc-400 mt-2 italic">Carry-over data</p>
                    </Card>
                  </div>

                  <div className="p-6 bg-zinc-900 text-white rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-2xl"><PieChart className="h-6 w-6" /></div>
                      <div><h5 className="font-black">Finance Check</h5><p className="text-[10px] font-bold opacity-60">Status: {rentTargetData.remaining === 0 ? "Profit Zone 🚀" : "Cost Recovery 💪"}</p></div>
                    </div>
                    <div className="text-right"><p className="text-[8px] font-black opacity-40 uppercase">Est. Monthly Profit</p><p className="text-xl font-black">₹{netProfit}</p></div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "Total Sale Report" && (
            <div className="max-w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-2 sm:px-4 pt-4">
              <header className="px-2">
                <h2 className="text-5xl font-bold tracking-tighter leading-none text-zinc-900 dark:text-white">Business<br />Analytics</h2>
                <p className="text-sm font-bold text-zinc-400 mt-2 leading-relaxed">Comprehensive view of your store's performance.</p>
              </header>

              <div className="flex flex-col sm:flex-row gap-4 w-full px-2">
                <Button
                  onClick={handleExportSalesToExcel}
                  className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-full text-xs shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-all border-0 cursor-pointer"
                >
                  <FileText className="h-4 w-4" /> EXPORT TO EXCEL
                </Button>
                <Button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e: any) {
                      alert("Printing not supported in this view.");
                    }
                  }}
                  className="flex-1 h-14 bg-zinc-900 hover:bg-black text-white font-black rounded-full text-xs shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-all border-0 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> PRINT REPORT
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-5 rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-zinc-100 dark:bg-zinc-800" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Orders</p>
                  <h3 className="text-4xl font-bold tracking-tighter px-1">{filteredSales.length}</h3>
                </Card>

                <Card className="p-5 rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-zinc-100 dark:bg-zinc-800" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Avg. Ticket</p>
                  <h3 className="text-4xl font-bold tracking-tighter px-1">₹{filteredSales.length > 0 ? Math.round(totalSales / filteredSales.length) : 0}</h3>
                </Card>

                <Card className="p-5 rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-zinc-100 dark:bg-zinc-800" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Revenue</p>
                  <h3 className="text-4xl font-bold tracking-tighter px-1">₹{Math.round(totalSales)}</h3>
                </Card>
              </div>

              {filteredSales.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Payment Mode Totals</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(
                      filteredSales.reduce((acc, sale) => {
                        const mode = sale.type || "Cash";
                        acc[mode] = (acc[mode] || 0) + sale.price;
                        return acc;
                      }, {})
                    ).map(([mode, total]) => (
                      <Card key={mode} className="p-4 rounded-xl border-0 shadow-sm bg-white dark:bg-zinc-900 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-orange-500" />
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 px-1">
                          {getPartnerName(businessType, mode).toUpperCase()}
                        </p>
                        <h4 className="text-xl font-bold tracking-tighter px-1">₹{Math.round(total as number)}</h4>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* FULL TRANSACTION HISTORY - SCROLLABLE TABLE */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                  <h3 className="text-2xl font-bold tracking-tighter">Transaction History</h3>
                  <div className="relative w-full sm:max-w-xs">
                    <Input
                      placeholder="Search name, mobile, item, amount..."
                      value={salesSearchQuery}
                      onChange={e => setSalesSearchQuery(e.target.value)}
                      className={`h-10 rounded-xl border-0 font-bold px-4 focus-visible:ring-2 focus-visible:ring-orange-500 text-xs transition-all ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'}`}
                    />
                  </div>
                </div>
                <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="min-w-max text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-[140px]">Date & Time</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-[150px]">Customer</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-[120px]">Mobile</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Order Details</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Type</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right w-[140px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800">
                        {searchedSales.length === 0 ? (
                          <tr><td colSpan={7} className="p-10 text-center text-zinc-300 font-bold italic">No transactions found</td></tr>
                        ) : (
                          searchedSales.map(s => (
                            <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-2 px-4 font-bold text-[10px] text-zinc-400 whitespace-nowrap">{format(new Date(s.date), "dd MMM, hh:mm aa")}</td>
                              <td className="py-2 px-4 font-bold text-sm text-zinc-900 dark:text-white uppercase whitespace-nowrap">{s.name}</td>
                              <td className="py-2 px-4 font-bold text-sm text-zinc-500 whitespace-nowrap">{s.mobile}</td>
                              <td className="py-2 px-4 font-bold text-xs text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{s.item || "General Order"}</td>
                              <td className="py-2 px-4 text-center">
                                {renderPaymentDetails(s)}
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-lg tracking-tighter text-zinc-900 dark:text-white whitespace-nowrap">
                                ₹{s.price - (s.commission || 0)}
                              </td>
                              <td className="py-2 px-4 text-right whitespace-nowrap">
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => window.open(getInvoiceUrlForSale(s), "_blank")}
                                    className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSale({
                                        id: s.id,
                                        name: s.name || "",
                                        mobile: s.mobile || "",
                                        item: s.item || "",
                                        price: String(s.price || 0),
                                        type: s.type || "Cash",
                                        discount: String(s.commission || 0)
                                      });
                                      setShowEditSaleModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95 border border-indigo-200 dark:border-indigo-900/40"
                                  >
                                    Edit
                                  </button>
                                  {s.mobile && s.mobile !== "N/A" && s.mobile.length === 10 && (
                                    <button
                                      onClick={() => handleResendWhatsAppInvoice(s)}
                                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95"
                                    >
                                      Resend
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* FINANCIAL ANALYTICS SECTION */}
              <div className="space-y-3">
                <div className="px-2 flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tighter">Financial Analytics</h3>
                    <p className="text-[10px] font-bold text-zinc-400">Total volume breakdown.</p>
                  </div>
                  <Badge className="bg-zinc-900 text-white px-3 py-1 rounded-full font-bold text-[9px]">{filteredSales.length} Sales</Badge>
                </div>

                <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="min-w-max text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-[120px]">Date</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-[150px]">Customer</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Order Details</th>
                          <th className="py-2 px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800">
                        {filteredSales.slice(0, 20).map(s => (
                          <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-2 px-4 font-bold text-[10px] text-zinc-400 whitespace-nowrap">{format(new Date(s.date), "dd MMM, HH:mm")}</td>
                            <td className="py-2 px-4 font-bold text-sm text-zinc-900 dark:text-white uppercase whitespace-nowrap">{s.name}</td>
                            <td className="py-2 px-4 font-bold text-xs text-zinc-500 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <span>{s.item || "General Order"}</span>
                                <div className="mt-0.5">{renderPaymentDetails(s)}</div>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-lg tracking-tighter text-zinc-900 dark:text-white whitespace-nowrap">
                              ₹{s.price - (s.commission || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "Marketing" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 px-4 pb-28">
              <header className="flex items-center justify-between px-2 pt-4">
                <h2 className="text-3xl font-black tracking-tighter">Smart CRM</h2>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-black text-[10px] uppercase px-3 py-1">Active</Badge>
              </header>

              {!isSubscribed && (
                <Card className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left space-y-1">
                    <p className="font-black text-sm uppercase tracking-tight">Free CRM Outreach Limit</p>
                    <p className="text-[10px] opacity-80 leading-normal">
                      Only the first 10 customers are displayed. Upgrade to the Paid Plan to view and contact your entire customer base.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowUpgradeModal(true)}
                    className="h-10 px-6 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shrink-0 whitespace-nowrap active:scale-95 transition-all"
                  >
                    Unlock Unlimited
                  </Button>
                </Card>
              )}

              {/* CAMPAIGN MESSAGE EDITOR */}
              <Card className="p-8 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 space-y-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest px-1">Campaign Message</Label>
                  </div>
                  <Badge className="bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 border-0 font-black text-[8px] px-3 py-1 rounded-full shadow-sm">WHATSAPP TEMPLATE</Badge>
                </div>

                <textarea
                  value={crmMessage}
                  onChange={e => setCrmMessage(e.target.value)}
                  className="w-full h-40 bg-white/80 dark:bg-zinc-900/80 rounded-[2rem] border-0 focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold resize-none p-6 leading-relaxed shadow-inner placeholder:text-zinc-300"
                  placeholder="Write your marketing message here..."
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Quick Sample Templates</p>
                    <div className="flex gap-1 bg-white/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                      <button
                        type="button"
                        onClick={() => setTemplateLang("both")}
                        className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${templateLang === 'both' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                      >
                        🌐 English + हिंदी (Both)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateLang("hi")}
                        className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${templateLang === 'hi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                      >
                        🇮🇳 हिंदी (Hindi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateLang("en")}
                        className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${templateLang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getTemplates(businessType, restaurantName, templateLang).map(template => (
                      <button
                        key={template.label}
                        onClick={() => setCrmMessage(template.msg)}
                        className="bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-600 hover:text-white transition-all px-4 py-2.5 font-black text-[9px] rounded-xl shadow-sm active:scale-95 uppercase tracking-tighter"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* AI MARKETING BANNER GENERATOR */}
              <Card className="p-8 bg-orange-50/50 dark:bg-orange-950/10 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/30 space-y-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <Label className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest px-1">AI Marketing Banner (FREE)</Label>
                  </div>
                  <Badge className="bg-orange-500 text-white border-0 font-black text-[8px] px-3 py-1 rounded-full shadow-sm">INSTANT AI DESIGN</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-black uppercase text-zinc-400">Offer Title</Label>
                      <Input
                        value={offerTitle}
                        onChange={e => setOfferTitle(e.target.value)}
                        placeholder="e.g. Sunday Feast, Festival Discount"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 font-bold text-sm h-11"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-black uppercase text-zinc-400">Discount Details</Label>
                      <Input
                        value={discountDetails}
                        onChange={e => setDiscountDetails(e.target.value)}
                        placeholder="e.g. Buy 1 Get 1 FREE, 25% OFF"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 font-bold text-sm h-11"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-black uppercase text-zinc-400">{getLabels(businessType).item} Name</Label>
                      <Input
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        placeholder={`e.g. ${getLabels(businessType).presets[0]?.name || "Item"}, All ${getLabels(businessType).items}`}
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 font-bold text-sm h-11"
                      />
                    </div>

                    {imageGenerationError && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider pl-1">{imageGenerationError}</p>
                    )}

                    <Button
                      onClick={handleGenerateAIBanner}
                      disabled={isGeneratingImage}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Designing Banner...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Generate Custom Ad Banner
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Right Column - Preview & Share */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 min-h-[260px] bg-white/40 dark:bg-zinc-950/20 relative">
                    {aiImageUrl ? (
                      <div className="w-full space-y-4">
                        <img
                          src={aiImageUrl}
                          alt="AI generated ad banner"
                          className="w-full aspect-square object-cover rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-900"
                        />
                        <Button
                          onClick={handleShareAIBanner}
                          className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Share Offer on WhatsApp
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 py-8">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mx-auto text-orange-500">
                          <Wand2 className="h-6 w-6" />
                        </div>
                        <p className="font-black text-xs uppercase tracking-wider text-zinc-400">Live Ad Preview</p>
                        <p className="text-[10px] text-zinc-400 max-w-[200px] leading-normal mx-auto">
                          Fill in the details on the left and click generate to instantly design your banner.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* RETENTION LIST & WHATSAPP BROADCAST SECTION */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden space-y-4">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">Retention List & Customer Contacts</h3>
                    <p className="text-xs font-bold text-violet-200 mt-1">Send direct messages or copy all phone numbers in 1-click for WhatsApp Business Broadcast!</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => {
                        const cleanMobiles = displayedCrmList
                          .map(c => (c.mobile || '').replace(/\D/g, '').slice(-10))
                          .filter(m => m && m.length === 10)
                          .map(m => `91${m}`);

                        if (cleanMobiles.length === 0) {
                          alert("No customer mobile numbers available to copy!");
                          return;
                        }
                        const formattedList = Array.from(new Set(cleanMobiles)).join(", ");
                        navigator.clipboard.writeText(formattedList);
                        alert(`🎉 Copied ${cleanMobiles.length} Customer Phone Numbers!\n\nInstructions:\n1. Open WhatsApp Business App\n2. Tap Menu ➔ New Broadcast\n3. Paste copied numbers to send 1-click offer to all customers!`);
                      }}
                      className="h-12 px-6 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4 fill-current" />
                      Copy All Numbers ({displayedCrmList.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (displayedCrmList.length === 0) {
                          alert("No customer data to export!");
                          return;
                        }
                        let csvContent = "data:text/csv;charset=utf-8,Name,Mobile,Tag,Last Visit\n";
                        displayedCrmList.forEach(c => {
                          const cleanMob = (c.mobile || '').replace(/\D/g, '').slice(-10);
                          csvContent += `"${c.name || 'Customer'}","${cleanMob}","${c.tag || 'Customer'}","${c.last || ''}"\n`;
                        });
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `InstaMunim_Customer_List_${format(new Date(), "yyyyMMdd")}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="h-12 px-5 bg-white/10 hover:bg-white/20 text-white border-white/20 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                        <th className="text-left py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</th>
                        <th className="text-left py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Taiyaar Message (Live Preview)</th>
                        <th className="text-left py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Last Visit</th>
                        <th className="text-left py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                      {displayedCrmList.map((cust, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-6 px-8">
                            <div className="flex items-center gap-2">
                              <div className="font-black text-base text-zinc-900 dark:text-white tracking-tight">{cust.name}</div>
                              {cust.tag === "Walk-in Lead" && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                                  🏷️ Walk-in Lead
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-zinc-400 tracking-tight">{cust.mobile}</div>
                            {cust.notes && (
                              <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-1 max-w-[200px] truncate">
                                📝 {cust.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-6 px-8">
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-3xl max-w-[280px] border border-zinc-100 dark:border-zinc-700">
                              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                                "{crmMessage.replaceAll("[NAME]", cust.name || "Customer").replaceAll("[SHOP]", restaurantName || "Store").substring(0, 75)}..."
                              </p>
                            </div>
                          </td>
                          <td className="py-6 px-8 text-xs font-black text-zinc-500 uppercase tracking-widest">{cust.last}</td>
                          <td className="py-6 px-8">
                            <div className="flex gap-2.5">
                              <Button
                                onClick={() => {
                                  const cleanMobile = (cust.mobile || '').replace(/\D/g, '').slice(-10);
                                  if (!cleanMobile || cleanMobile.length < 10) {
                                    alert("Invalid customer phone number!");
                                    return;
                                  }
                                  const customMsg = crmMessage
                                    .replaceAll("[NAME]", cust.name || "Customer")
                                    .replaceAll("[SHOP]", restaurantName || "Store");
                                  launchWhatsApp(cleanMobile, customMsg);
                                }}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl h-12 px-5 font-black text-[10px] shadow-md shadow-indigo-500/10 flex items-center gap-2 active:scale-95 transition-all uppercase tracking-wider"
                              >
                                <Send className="h-3.5 w-3.5" /> Text
                              </Button>
                              <Button
                                onClick={() => handleSendImage(cust.mobile, cust.name)}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 px-5 font-black text-[10px] shadow-md shadow-orange-500/10 flex items-center gap-2 active:scale-95 transition-all uppercase tracking-wider"
                              >
                                <Camera className="h-3.5 w-3.5" /> Send Image
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "FinanceTracker" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
              <header className="relative px-2">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter text-blue-600">EMI & Finance Ledger</h2>
                <p className="text-zinc-500 font-bold mt-1">Track finance settlements and loan payouts.</p>
              </header>

              {/* METRICS CARDS */}
              {(() => {
                const financeSales = sales.map(s => {
                  const m = (s.item || "").match(/\[FINANCE:([^:]+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):([^:]+):(Pending|Settled)\]/);
                  if (!m) return null;
                  return {
                    id: s.id,
                    name: s.name,
                    mobile: s.mobile,
                    price: s.price,
                    date: s.date,
                    item: s.item,
                    company: m[1],
                    loanAmount: Number(m[2]),
                    downPayment: Number(m[3]),
                    fileId: m[4],
                    status: m[5]
                  };
                }).filter(Boolean) as any[];

                const totalPending = financeSales.filter(fs => fs.status === "Pending").reduce((sum, fs) => sum + fs.loanAmount, 0);
                const totalSettled = financeSales.filter(fs => fs.status === "Settled").reduce((sum, fs) => sum + fs.loanAmount, 0);

                // Group by company
                const pendingByCompany: Record<string, number> = {};
                financeSales.filter(fs => fs.status === "Pending").forEach(fs => {
                  pendingByCompany[fs.company] = (pendingByCompany[fs.company] || 0) + fs.loanAmount;
                });

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Pending</p>
                        <h4 className="text-3xl font-black text-red-600 tracking-tighter">₹{totalPending}</h4>
                      </Card>
                      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Settled</p>
                        <h4 className="text-3xl font-black text-emerald-600 tracking-tighter">₹{totalSettled}</h4>
                      </Card>
                    </div>

                    {Object.keys(pendingByCompany).length > 0 && (
                      <Card className="p-5 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl">
                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3">Pending Partner Breakup</h4>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {Object.entries(pendingByCompany).map(([co, amt]) => (
                            <div key={co} className="flex justify-between py-2.5 text-sm">
                              <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{co}</span>
                              <span className="font-black text-red-600">₹{amt}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* LEDGER LIST */}
                    <Card className="p-5 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4">Finance Transactions</h4>
                      {financeSales.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-sm font-bold text-zinc-400">No finance sales recorded yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {financeSales.map(fs => (
                            <div key={fs.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">{format(new Date(fs.date), "dd MMM yyyy")}</span>
                                  <span className={`text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full ${fs.status === "Settled" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-red-50 text-red-600 dark:bg-red-950/20"}`}>
                                    {fs.status.toUpperCase()}
                                  </span>
                                </div>
                                <h5 className="font-black text-zinc-900 dark:text-white">{fs.name} ({fs.mobile})</h5>
                                <p className="text-[11px] font-bold text-zinc-500">
                                  Partner: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{fs.company}</span> | File ID: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{fs.fileId}</span>
                                </p>
                              </div>
                              <div className="flex items-center justify-between md:justify-end gap-6">
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Financed Loan</p>
                                  <h4 className="text-lg font-black text-zinc-900 dark:text-white">₹{fs.loanAmount}</h4>
                                  <p className="text-[9px] font-bold text-zinc-400">DP: ₹{fs.downPayment}</p>
                                </div>
                                {fs.status === "Pending" && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      const updatedItems = fs.item.replace(":Pending]", ":Settled]");
                                      const { error } = await supabase.from('sales').update({ items: updatedItems }).eq('id', fs.id);
                                      if (!error) {
                                        setSales(prev => prev.map(sale => sale.id === fs.id ? { ...sale, item: updatedItems } : sale));
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider px-3 h-8 shadow-sm"
                                  >
                                    Mark Settled
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "BuybackTracker" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
              <header className="relative px-2">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter text-orange-600">Exchange Ledger</h2>
                <p className="text-zinc-500 font-bold mt-1">Log used phone trade-ins, capture Aadhaar IDs, and track buyback expenses.</p>
              </header>

              {(() => {
                const buybackExpenses = expenses.map(e => {
                  const title = e.title || "";
                  if (!title.includes("[BUYBACK###") && !title.includes("[BUYBACK:")) return null;

                  if (title.includes("[BUYBACK###")) {
                    const metaPart = title.substring(title.indexOf("[BUYBACK###") + 11, title.lastIndexOf("]"));
                    const parts = metaPart.split("###");
                    const photos = (parts[5] || "").split("|");
                    const status = parts[6] || "UNSOLD";
                    const isSold = status === "SOLD" || status.startsWith("SOLD");
                    const salePrice = isSold ? Number(parts[7] || 0) : 0;
                    return {
                      id: e.id,
                      title: e.title,
                      amount: e.amount,
                      date: e.date,
                      brandModel: parts[0] || "Unknown",
                      imei: parts[1] || "N/A",
                      aadhaar: parts[2] || "N/A",
                      custName: parts[3] || "N/A",
                      custMobile: parts[4] || "N/A",
                      photo: photos[0] || "N/A",
                      photoBack: photos[1] || "N/A",
                      photoDevice: photos[2] || "N/A",
                      status: isSold ? "SOLD" : "UNSOLD",
                      salePrice: salePrice
                    };
                  } else {
                    const metaPart = title.substring(title.indexOf("[BUYBACK:") + 9, title.lastIndexOf("]"));
                    const parts = metaPart.split(":");
                    const photos = (parts[5] || "").split("|");
                    const status = parts[6] || "UNSOLD";
                    const isSold = status === "SOLD" || status.startsWith("SOLD");
                    const salePrice = isSold ? Number(parts[7] || 0) : 0;
                    return {
                      id: e.id,
                      title: e.title,
                      amount: e.amount,
                      date: e.date,
                      brandModel: parts[0] || "Unknown",
                      imei: parts[1] || "N/A",
                      aadhaar: parts[2] || "N/A",
                      custName: parts[3] || "N/A",
                      custMobile: parts[4] || "N/A",
                      photo: photos[0] || "N/A",
                      photoBack: photos[1] || "N/A",
                      photoDevice: photos[2] || "N/A",
                      status: isSold ? "SOLD" : "UNSOLD",
                      salePrice: salePrice
                    };
                  }
                }).filter(Boolean) as any[];

                const totalBuybackAmount = buybackExpenses.reduce((sum, item) => sum + item.amount, 0);
                const totalDevicesCount = buybackExpenses.length;

                return (
                  <div className="space-y-6">
                    {/* METRICS CARDS */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Spent</p>
                        <h4 className="text-3xl font-black text-orange-600 tracking-tighter">₹{totalBuybackAmount}</h4>
                      </Card>
                      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Devices Bought</p>
                        <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{totalDevicesCount}</h4>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* NEW BUYBACK FORM */}
                      <Card className="lg:col-span-5 p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-3xl space-y-4">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Log Used Phone Purchase</h3>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Customer Name</Label>
                            <Input
                              value={buybackCustName}
                              onChange={e => setBuybackCustName(e.target.value)}
                              placeholder="Customer Name"
                              className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Customer Mobile</Label>
                            <Input
                              value={buybackCustMobile}
                              onChange={e => setBuybackCustMobile(e.target.value)}
                              placeholder="Mobile Number"
                              type="tel"
                              className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Aadhaar / ID Card No.</Label>
                            <Input
                              value={buybackAadhaar}
                              onChange={e => setBuybackAadhaar(e.target.value)}
                              placeholder="12 Digit Aadhaar No."
                              className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Brand & Model</Label>
                              <Input
                                value={buybackBrandModel}
                                onChange={e => setBuybackBrandModel(e.target.value)}
                                placeholder="e.g. Vivo Y11"
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">IMEI Number (Scan / Type)</Label>
                              <ImeiInput
                                value={buybackImei}
                                onChange={(val) => setBuybackImei(val)}
                                placeholder="15 Digit IMEI"
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Purchase / Buyback Price (₹)</Label>
                            <Input
                              value={buybackPrice}
                              onChange={e => setBuybackPrice(e.target.value)}
                              placeholder="Amount Paid to Customer"
                              type="number"
                              className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold shadow-sm text-orange-600"
                            />
                          </div>

                          {/* THREE PHOTO ATTACHMENT SLOTS */}
                          <div className="space-y-3 pt-2">
                            <span className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block border-b border-zinc-100 dark:border-zinc-800 pb-1">Required Photo Captures</span>
                            <div className="grid grid-cols-3 gap-3">
                              {/* Aadhaar Front */}
                              <div className="flex flex-col items-center gap-1.5">
                                <Label className="text-[8px] font-black text-zinc-400 uppercase text-center leading-none">Aadhaar Front</Label>
                                <label className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider text-center w-full block shadow-sm border border-zinc-200 dark:border-zinc-700/50 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                                  Capture
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) compressAndSetIdPhoto(file, 'front');
                                    }}
                                  />
                                </label>
                                {buybackIdPhoto ? (
                                  <div className="relative">
                                    <img src={buybackIdPhoto} alt="Front ID" className="w-10 h-10 object-cover rounded-lg border border-zinc-250" />
                                    <button type="button" onClick={() => setBuybackIdPhoto("")} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">✕</button>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-850 rounded-lg flex items-center justify-center text-[8px] text-zinc-400 font-bold uppercase">No Pic</div>
                                )}
                              </div>

                              {/* Aadhaar Back */}
                              <div className="flex flex-col items-center gap-1.5">
                                <Label className="text-[8px] font-black text-zinc-400 uppercase text-center leading-none">Aadhaar Back</Label>
                                <label className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider text-center w-full block shadow-sm border border-zinc-200 dark:border-zinc-700/50 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                                  Capture
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) compressAndSetIdPhoto(file, 'back');
                                    }}
                                  />
                                </label>
                                {buybackIdPhotoBack ? (
                                  <div className="relative">
                                    <img src={buybackIdPhotoBack} alt="Back ID" className="w-10 h-10 object-cover rounded-lg border border-zinc-250" />
                                    <button type="button" onClick={() => setBuybackIdPhotoBack("")} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">✕</button>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-850 rounded-lg flex items-center justify-center text-[8px] text-zinc-400 font-bold uppercase">No Pic</div>
                                )}
                              </div>

                              {/* Mobile Phone Device Pic */}
                              <div className="flex flex-col items-center gap-1.5">
                                <Label className="text-[8px] font-black text-zinc-400 uppercase text-center leading-none">Device Photo</Label>
                                <label className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider text-center w-full block shadow-sm border border-zinc-200 dark:border-zinc-700/50 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                                  Capture
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) compressAndSetIdPhoto(file, 'device');
                                    }}
                                  />
                                </label>
                                {buybackDevicePhoto ? (
                                  <div className="relative">
                                    <img src={buybackDevicePhoto} alt="Device Pic" className="w-10 h-10 object-cover rounded-lg border border-zinc-250" />
                                    <button type="button" onClick={() => setBuybackDevicePhoto("")} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">✕</button>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-850 rounded-lg flex items-center justify-center text-[8px] text-zinc-400 font-bold uppercase">No Pic</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* DECLARATION CHECKBOX */}
                          <div className="flex items-start gap-2.5 p-3.5 bg-orange-50/50 dark:bg-orange-950/15 rounded-2xl border border-orange-100/50 dark:border-orange-900/20 mt-2">
                            <input
                              type="checkbox"
                              id="buybackDeclaration"
                              checked={buybackDeclared}
                              onChange={(e) => setBuybackDeclared(e.target.checked)}
                              className="mt-0.5 rounded accent-orange-600 h-4 w-4"
                            />
                            <label htmlFor="buybackDeclaration" className="text-[10px] font-bold text-zinc-650 dark:text-zinc-300 leading-snug cursor-pointer select-none">
                              I declare that this device belongs to me and is not stolen/illegal, and I agree to transfer complete ownership of the device.
                            </label>
                          </div>
                        </div>

                        <Button
                          onClick={handleSaveBuyback}
                          className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-widest mt-4 disabled:opacity-50"
                          disabled={isLoading || !buybackDeclared}
                        >
                          {isLoading ? "Saving..." : "Save Buyback Entry"}
                        </Button>
                      </Card>

                      {/* BUYBACK HISTORY LEDGER */}
                      <Card className="lg:col-span-7 p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-3xl space-y-4">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Recent Buyback Purchases</h3>
                        {buybackExpenses.length === 0 ? (
                          <div className="text-center py-20">
                            <p className="text-sm font-bold text-zinc-400">No buyback transactions found.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {buybackExpenses.map(item => (
                              <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">{format(new Date(item.date), "dd MMM yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-black text-zinc-900 dark:text-white uppercase leading-none">{item.brandModel}</h5>
                                    {item.status === "SOLD" ? (
                                      <span className="px-1.5 py-0.5 bg-zinc-150 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 rounded-md text-[8px] font-black uppercase tracking-wider">Sold (₹{item.salePrice})</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-wider">In Stock</span>
                                    )}
                                    {item.status === "SOLD" && (
                                      <span className="text-[9px] font-extrabold text-emerald-600">Profit: +₹{item.salePrice - item.amount}</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-bold text-zinc-500">
                                    IMEI: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{item.imei}</span>
                                  </p>
                                  <div className="h-[1px] bg-zinc-200/50 dark:bg-zinc-800 w-full my-1" />
                                  <p className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450">
                                    Seller: <span className="text-zinc-900 dark:text-white font-black">{item.custName}</span> (+91 {item.custMobile})
                                  </p>
                                  <p className="text-[10px] font-bold text-zinc-500">
                                    Aadhaar ID: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{item.aadhaar}</span>
                                  </p>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-6">
                                  <div className="text-right">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Amount Paid</p>
                                    <h4 className="text-lg font-black text-orange-600">₹{item.amount}</h4>
                                  </div>
                                  <div className="flex flex-col gap-2 min-w-[130px]">
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                      {item.photo && item.photo !== "N/A" && (
                                        <Button
                                          size="sm"
                                          onClick={() => setViewingIdPhoto(item.photo)}
                                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-zinc-200 border border-orange-100 dark:border-zinc-700 rounded-lg text-[8px] font-black uppercase tracking-wider px-2 h-7 shadow-sm"
                                        >
                                          ID Front
                                        </Button>
                                      )}
                                      {item.photoBack && item.photoBack !== "N/A" && (
                                        <Button
                                          size="sm"
                                          onClick={() => setViewingIdPhoto(item.photoBack)}
                                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-zinc-200 border border-orange-100 dark:border-zinc-700 rounded-lg text-[8px] font-black uppercase tracking-wider px-2 h-7 shadow-sm"
                                        >
                                          ID Back
                                        </Button>
                                      )}
                                      {item.photoDevice && item.photoDevice !== "N/A" && (
                                        <Button
                                          size="sm"
                                          onClick={() => setViewingIdPhoto(item.photoDevice)}
                                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-zinc-200 border border-orange-100 dark:border-zinc-700 rounded-lg text-[8px] font-black uppercase tracking-wider px-2 h-7 shadow-sm"
                                        >
                                          Device Pic
                                        </Button>
                                      )}
                                    </div>
                                    <div className="flex gap-1.5 justify-end w-full">
                                      <Button
                                        size="sm"
                                        onClick={() => handlePrintBuyback(item)}
                                        className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg text-[9px] font-black uppercase tracking-wider h-8 shadow-sm border-0"
                                      >
                                        Print Receipt
                                      </Button>

                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Lightbox / Aadhaar Viewer Modal */}
                    {viewingIdPhoto && (
                      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4 animate-in fade-in duration-250">
                        <div className="relative bg-zinc-900 rounded-3xl p-6 max-w-[600px] w-full max-h-[85vh] flex flex-col items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setViewingIdPhoto(null)}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-white text-zinc-990 rounded-full flex items-center justify-center font-bold text-lg shadow-xl"
                          >
                            ✕
                          </button>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest self-start px-2">Uploaded Document / Device Photo</h4>
                          <div className="w-full flex-1 min-h-[300px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800">
                            <img src={viewingIdPhoto} alt="Aadhaar ID Card" className="max-w-full max-h-[50vh] object-contain" />
                          </div>
                          <div className="flex gap-4 w-full">
                            <Button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = viewingIdPhoto;
                                link.download = "buyback_photo_proof.jpg";
                                link.click();
                              }}
                              className="flex-1 h-12 bg-white text-zinc-990 hover:bg-zinc-200 rounded-xl font-black text-xs uppercase tracking-widest"
                            >
                              Download Image
                            </Button>
                            <Button
                              onClick={() => setViewingIdPhoto(null)}
                              className="flex-1 h-12 bg-zinc-800 text-white hover:bg-zinc-700 rounded-xl font-black text-xs uppercase tracking-widest border-0"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "Khata" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
              <header className="relative px-2">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter text-red-500">Udhaar Khata</h2>
                <p className="text-zinc-500 font-bold  mt-1">Manage your shop's credit ledger.</p>
              </header>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Pending</p>
                  <h4 className="text-3xl font-black text-red-600 tracking-tighter">₹{udhaarSales.reduce((sum, s) => sum + s.price, 0)}</h4>
                </Card>
                <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Customers</p>
                  <h4 className="text-3xl font-black tracking-tighter">{new Set(udhaarSales.map(s => s.mobile)).size} <span className="text-xs text-zinc-400">Accs</span></h4>
                </Card>
              </div>

              <div className="space-y-4">
                {udhaarSales.length === 0 ? (
                  <div className="py-24 text-center space-y-4 animate-in fade-in duration-1000">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-900/20">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">Sab Paisa Recovered!</p>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No pending dues found 💰</p>
                    </div>
                  </div>
                ) : (
                  udhaarSales.map(s => (
                    <Card key={s.id} className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border-0 shadow-sm group relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-red-500" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center font-black text-sm">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-lg leading-none">{s.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{format(new Date(s.date), "dd MMM, yyyy")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-red-600">₹{s.price}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                        <Button
                          onClick={() => markAsPaid(s.id)}
                          className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" /> MARK AS PAID
                        </Button>
                        <Button
                          onClick={() => window.open(getInvoiceUrlForSale(s), "_blank")}
                          variant="outline"
                          className="w-14 h-14 p-0 rounded-2xl border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-blue-500 hover:border-blue-500 transition-all shadow-sm"
                          title="View Invoice"
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                        <Button
                          onClick={() => {
                            const udharMsgEn = `Hi ${s.name}, a friendly reminder for your pending Udhaar of ₹${s.price} at ${restaurantName}. Please pay soon! Thanks.`;
                            const udharMsgHi = `नमस्ते ${s.name}, ${restaurantName} पर आपका ₹${s.price} का बकाया/उधार पेंडिंग है। कृपया जल्द भुगतान करें! धन्यवाद।`;
                            const udharFullMsg = `${udharMsgEn}\n\n${udharMsgHi}`;
                            window.open(`https://wa.me/91${s.mobile}?text=${encodeURIComponent(udharFullMsg)}`, "_blank");
                          }}
                          variant="outline"
                          className="w-14 h-14 p-0 rounded-2xl border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 transition-all shadow-sm"
                        >
                          <MessageCircle className="h-6 w-6" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "Menu" && (
            !flagInventoryMgmt ? (
              <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in my-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                    Disabled by Admin
                  </span>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">Menu & Inventory is Locked</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    This menu feature is disabled from Admin Control for your store. Please contact Admin to unlock access.
                  </p>
                </div>
                <a
                  href={`https://wa.me/91${ownerMobile || '7838229178'}?text=${encodeURIComponent('Hi Admin, please enable Menu & Inventory access for my store.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-orange-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Request Admin to Unlock</span>
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 px-3">
                <header className="px-2 pt-4">
                  <h2 className="text-5xl font-bold tracking-tighter leading-tight text-zinc-900 dark:text-white">{getLabels(businessType).items.split(" & ")[0]}<br />Control</h2>
                  <p className="text-sm font-medium text-zinc-400 mt-3 leading-relaxed">Update your digital {getLabels(businessType).items.toLowerCase()} and pricing.</p>
                </header>

                {/* SMART MENU AI SCANNER BUTTON */}
                <button
                  onClick={() => {
                    if (!flagAiScanner) {
                      setShowFeatureLockModal("📷 AI Menu Scanner");
                      return;
                    }
                    if (!isSubscribed) {
                      setShowUpgradeModal(true);
                    } else {
                      setScanMenuStep('capture');
                      setScanMenuImage(null);
                      setScanMenuResults([]);
                      setShowScanMenuModal(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/25 active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-black text-base leading-none">📷 Smart Menu Scanner</p>
                      <p className="text-white/70 text-[10px] font-bold mt-1 uppercase tracking-widest">AI se menu card scan karein</p>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs font-black uppercase tracking-widest">AI ✨</div>
                </button>

                {/* NEW ITEM CARD - PREMIUM STYLE */}
                <Card className="rounded-2xl border-0 shadow-2xl shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="bg-zinc-900 dark:bg-zinc-800 p-6">
                    <h3 className="text-xl font-bold text-white">New {getLabels(businessType).item}</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">{getLabels(businessType).item} Name</Label>
                      <Input
                        placeholder={`e.g. ${getLabels(businessType).presets[0]?.name || "Item Name"}`}
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItemPrice}
                        onChange={e => setNewItemPrice(e.target.value)}
                        className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Category</Label>
                      <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v || "Others")}>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                          {(getLabels(businessType).categories || ["General", "Others"]).map(cat => (
                            <SelectItem key={cat} value={cat} className="font-bold py-3">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {businessType === "Mobile/Electronics" && (
                      <div className="space-y-3 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                        <div className="flex justify-between items-center px-1">
                          <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                              Unit Details Manager
                            </Label>
                            <p className="text-[10px] font-bold text-zinc-500">
                              {unitDetails.length > 0 ? `${unitDetails.length} Unit(s) Logged` : `${newItemImeis.length} Unit(s) Logged`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (unitDetails.length === 0 && newItemImeis.length > 0) {
                                setUnitDetails(newItemImeis.map(i => ({ imei: i, color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" })));
                              } else if (unitDetails.length === 0) {
                                setUnitDetails([{ imei: "", color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" }]);
                              }
                              setIsUnitModalOpen(true);
                            }}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md"
                          >
                            📱 + Add / Edit Unit Rows
                          </Button>
                        </div>

                        {unitDetails.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-indigo-100 dark:border-indigo-900/30">
                            {unitDetails.map((u, i) => (
                              <div key={i} className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <span>#{i + 1} IMEI: <strong className="text-indigo-600">{u.imei || 'N/A'}</strong></span>
                                <span className="text-[9px] text-zinc-400">
                                  {u.color ? `Color: ${u.color}` : ''} {u.purchaseRate ? `| Rate: ₹${u.purchaseRate}` : ''} {u.supplierName ? `| Supplier: ${u.supplierName}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* POPUP MODAL FOR UNIT DETAILS */}
                        <Dialog open={isUnitModalOpen} onOpenChange={setIsUnitModalOpen}>
                          <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl rounded-[2rem] p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-950 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="space-y-0.5 text-left border-b border-zinc-100 dark:border-zinc-800 pb-3">
                              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-indigo-600" />
                                Mobile Unit Details Manager
                              </DialogTitle>
                              <DialogDescription className="text-[11px] text-zinc-500 font-medium">
                                Add parameters per unit row (IMEI, Color, Purchase Rate, HSN, Supplier).
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 my-3">
                              {unitDetails.length === 0 ? (
                                <div className="text-center py-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200">
                                  <p className="text-xs font-bold text-zinc-500">No unit rows added yet.</p>
                                  <Button
                                    type="button"
                                    onClick={() => setUnitDetails([{ imei: "", color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" }])}
                                    className="mt-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                                  >
                                    + Add First Unit
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {unitDetails.map((unit, index) => (
                                    <div key={index} className="p-3.5 sm:p-4 bg-zinc-50/90 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-2.5 shadow-sm">
                                      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50 pb-2">
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-[9px] font-black">
                                            #{index + 1}
                                          </span>
                                          Unit Specifications
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              const copied = { ...unit, imei: "" };
                                              const next = [...unitDetails];
                                              next.splice(index + 1, 0, copied);
                                              setUnitDetails(next);
                                            }}
                                            className="h-7 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40"
                                          >
                                            <Copy className="h-3 w-3 mr-1" /> Copy Unit
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setUnitDetails(unitDetails.filter((_, idx) => idx !== index))}
                                            className="h-7 text-[10px] font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 rounded-lg"
                                          >
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                          </Button>
                                        </div>
                                      </div>

                                      {/* COMPACT 2-ROW GRID */}
                                      <div className="space-y-2">
                                        {/* Row 1: IMEI (2 cols) + Color (1 col) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                          <div className="sm:col-span-2 space-y-0.5 text-left">
                                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                              IMEI / Serial Number *
                                            </Label>
                                            <ImeiInput
                                              placeholder="15-digit IMEI number"
                                              value={unit.imei}
                                              onChange={val => {
                                                const updated = [...unitDetails];
                                                updated[index].imei = val;
                                                setUnitDetails(updated);
                                              }}
                                              className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                                            />
                                          </div>

                                          <div className="space-y-0.5 text-left">
                                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                              Color
                                            </Label>
                                            <Input
                                              placeholder="e.g. Black / Blue"
                                              value={unit.color}
                                              onChange={e => {
                                                const updated = [...unitDetails];
                                                updated[index].color = e.target.value;
                                                setUnitDetails(updated);
                                              }}
                                              className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                                            />
                                          </div>
                                        </div>

                                        {/* Row 2: Purchase Rate + HSN Code + Supplier Name */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                          <div className="space-y-0.5 text-left">
                                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                              Purchase Rate (₹)
                                            </Label>
                                            <Input
                                              type="number"
                                              placeholder="e.g. 15000"
                                              value={unit.purchaseRate}
                                              onChange={e => {
                                                const updated = [...unitDetails];
                                                updated[index].purchaseRate = e.target.value;
                                                setUnitDetails(updated);
                                              }}
                                              className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                                            />
                                          </div>

                                          <div className="space-y-0.5 text-left">
                                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                              HSN Code
                                            </Label>
                                            <Input
                                              placeholder="8517"
                                              value={unit.hsnCode}
                                              onChange={e => {
                                                const updated = [...unitDetails];
                                                updated[index].hsnCode = e.target.value;
                                                setUnitDetails(updated);
                                              }}
                                              className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                                            />
                                          </div>

                                          <div className="space-y-0.5 text-left">
                                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                              Supplier Name
                                            </Label>
                                            <Input
                                              placeholder="e.g. Ramesh Telecom"
                                              value={unit.supplierName}
                                              onChange={e => {
                                                const updated = [...unitDetails];
                                                updated[index].supplierName = e.target.value;
                                                setUnitDetails(updated);
                                              }}
                                              className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                                <Button
                                  type="button"
                                  onClick={() => setUnitDetails([...unitDetails, { imei: "", color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" }])}
                                  className="w-full sm:w-auto h-10 px-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-extrabold text-xs rounded-xl border border-indigo-200 dark:border-indigo-900/40"
                                >
                                  + Add Another Unit
                                </Button>

                                <Button
                                  type="button"
                                  onClick={() => setIsUnitModalOpen(false)}
                                  className="w-full sm:w-auto h-10 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                                >
                                  Save Units ({unitDetails.length}) & Close
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    <Button
                      onClick={handleAddItem}
                      className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-md shadow-xl shadow-blue-500/30 active:scale-95 transition-all mt-4 uppercase tracking-wider"
                    >
                      ADD {getLabels(businessType).item.toUpperCase()}
                    </Button>
                  </div>
                </Card>

                {/* LIVE MENU LIST */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-2xl font-bold tracking-tight">Live {getLabels(businessType).items.split(" & ")[0]}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 font-bold bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 shadow-sm">{menuItems.length} {getLabels(businessType).items.includes("Stock") || getLabels(businessType).items.includes("Inventory") ? "Products" : "Items"}</Badge>
                      <button
                        onClick={() => {
                          const csvContent = "Name,Price,Category,IMEI,Color,PurchaseRate,HSNCode,SupplierName\niPhone 15 128GB,59999,Smartphones,358741098234156,Titanium Black,52000,8517,Ramesh Telecom\nSamsung S24 Ultra,119999,Smartphones,358741098234157,Cobalt Violet,105000,8517,National Distributors";
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'stock_template.csv';
                          a.click();
                        }}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40"
                      >
                        <Download className="h-3 w-3" /> Stock Template
                      </button>
                      <label className="cursor-pointer text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                        <Upload className="h-3 w-3" /> Import Stock CSV
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const text = event.target?.result as string;
                                const lines = text.split("\n").filter(l => l.trim() !== "");
                                if (lines.length <= 1) {
                                  alert("CSV file is empty or missing data rows.");
                                  return;
                                }

                                const aggregatedMap = new Map<string, { name: string; price: number; category: string; units: string[] }>();

                                // Skip header row
                                for (let i = 1; i < lines.length; i++) {
                                  const parts = lines[i].split(",").map(s => s.trim());
                                  if (!parts[0] || !parts[1]) continue;

                                  const name = parts[0];
                                  const price = Number(parts[1]);
                                  if (isNaN(price)) continue;

                                  const baseCategory = parts[2] || "General";
                                  const imei = parts[3] || "";
                                  const color = parts[4] || "";
                                  const purchaseRate = parts[5] || "";
                                  const hsnCode = parts[6] || "8517";
                                  const supplierName = parts[7] || "";

                                  const key = `${name.toLowerCase()}_${price}`;
                                  const existing = aggregatedMap.get(key) || { name, price, category: baseCategory, units: [] };

                                  if (imei || color || purchaseRate || supplierName) {
                                    const meta = [
                                      color ? `Color:${color}` : "",
                                      purchaseRate ? `Cost:${purchaseRate}` : "",
                                      hsnCode ? `HSN:${hsnCode}` : "",
                                      supplierName ? `Supplier:${supplierName}` : ""
                                    ].filter(Boolean).join(";");

                                    const encodedUnit = meta ? `IMEI:${imei}{${meta}}` : imei;
                                    if (encodedUnit) {
                                      existing.units.push(encodedUnit);
                                    }
                                  }

                                  aggregatedMap.set(key, existing);
                                }

                                const newItemsFromCsv = Array.from(aggregatedMap.values()).map(item => {
                                  let finalCategory = item.category;
                                  if (item.units.length > 0) {
                                    finalCategory = `${item.category}|IMEIs:${item.units.join(",")}`;
                                  }
                                  return {
                                    name: item.name,
                                    price: item.price,
                                    category: finalCategory
                                  };
                                });

                                if (newItemsFromCsv.length > 0) {
                                  setIsLoading(true);
                                  try {
                                    let storeId = currentStoreId;
                                    if (!storeId) {
                                      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
                                      if (!store) throw new Error("Store ID not found");
                                      storeId = store.id;
                                      setCurrentStoreId(store.id);
                                    }

                                    const { data: insertedData, error } = await supabase
                                      .from('menu_items')
                                      .insert(newItemsFromCsv.map(item => ({ ...item, store_id: storeId })))
                                      .select();

                                    if (error) throw error;
                                    setMenuItems([...menuItems, ...insertedData]);
                                    alert(`Successfully imported ${insertedData.length} stock items from CSV!`);
                                  } catch (err: any) {
                                    alert("Import Error: " + err.message);
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-zinc-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Search inventory..."
                      value={itemSearch}
                      onChange={e => setItemSearch(e.target.value)}
                      className="h-14 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm font-bold text-zinc-600 dark:text-zinc-400"
                    />
                  </div>

                  <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="p-6 border-b dark:border-zinc-800 grid grid-cols-12 text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-8">
                      <div className="col-span-7">Name</div>
                      <div className="col-span-3 text-center">Price</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    <div className="divide-y dark:divide-zinc-800">
                      {menuItems.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto"><PlusCircle className="h-8 w-8 text-zinc-300" /></div>
                          <p className="text-sm font-bold text-zinc-400 ">No items in menu. Add your first dish above!</p>
                        </div>
                      ) : (
                        filteredMenuItems.map(item => {
                          const itemImeis = getImeis(item.category);
                          const isMobile = businessType === "Mobile/Electronics";
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isMobile) {
                                  setEditingItem(item);
                                  setEditingItemImeis(itemImeis);
                                  const parsedUnits = parseUnitDetailsFromCategory(item.category);
                                  if (parsedUnits.length > 0) {
                                    setEditingUnitDetails(parsedUnits);
                                  } else {
                                    setEditingUnitDetails(itemImeis.map(i => ({ imei: i, color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" })));
                                  }
                                  setShowEditStockModal(true);
                                }
                              }}
                              className={`p-6 grid grid-cols-12 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors px-8 ${isMobile ? 'cursor-pointer' : ''}`}
                            >
                              <div className="col-span-7">
                                <p className="font-bold text-md text-zinc-900 dark:text-white leading-none">{item.name}</p>
                                <div className="flex flex-col gap-1 mt-1.5">
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{getDisplayCategory(item.category)}</p>
                                  {isMobile && (
                                    <>
                                      {itemImeis.length === 0 ? (
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md w-fit">Out of Stock</span>
                                      ) : (
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md w-fit">{itemImeis.length} Units in Stock</span>
                                      )}
                                      {itemImeis.length > 0 && (
                                        <p className="text-[9px] text-zinc-400 italic max-w-xs truncate">IMEIs: {itemImeis.join(", ")}</p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-3 text-center">
                                <p className="font-bold text-lg tracking-tight">₹{item.price}</p>
                              </div>
                              <div className="col-span-2 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )
          )}

          {activeTab === "Support" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-4">
              <header className="flex flex-col items-center text-center px-2 pt-8">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6">
                  <Smartphone className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">Help & Support</h2>
                <p className="text-zinc-500 font-bold mt-2 leading-relaxed max-w-[240px]">
                  We are here to help you grow your business 24/7.
                </p>
              </header>

              <div className="space-y-6">
                {/* FOUNDER CARD */}
                <Card className="p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">InstaMunim Admin</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">Platform Admin</p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <Button
                      onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent("Hi Admin, I need help with my InstaMunim POS. Can you please assist me?")}`, "_blank")}
                      className="w-full h-16 bg-[#00c875] hover:bg-[#00b067] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-5 w-5" /> Contact on WhatsApp
                    </Button>
                    <Button
                      onClick={() => window.location.href = "mailto:instamunim@gmail.com?subject=InstaMunim Support Request"}
                      variant="outline"
                      className="w-full h-16 bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <Send className="h-5 w-5" /> Send Email
                    </Button>
                  </div>
                </Card>

                {/* DIRECT SUPPORT DASHBOARD */}
                <Card className="p-8 bg-zinc-900 text-white rounded-[3rem] border-0 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <h3 className="text-2xl font-black tracking-tighter mb-8">Direct Support</h3>

                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                        <Smartphone className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Call Us</p>
                        <p className="text-lg font-black tracking-tight">+91 7838229178</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                        <Send className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Email Support</p>
                        <p className="text-lg font-black tracking-tight truncate max-w-[180px]">instamunim@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                      Response time is usually under <span className="text-emerald-500 font-black">2 hours</span> during business hours.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "Legal" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-4">
              <header className="px-2 pt-4">
                <h2 className="text-4xl font-black tracking-tighter">{t("Privacy & Policy")}</h2>
                <p className="text-zinc-500 font-bold mt-1">{t("Please read our terms and policies carefully.")}</p>
              </header>

              <div className="space-y-4">
                {/* 1. Cloud Storage & Syncing */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/30 shrink-0">
                      <Cloud className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">1. Cloud Storage & Syncing</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    InstaMunim utilizes a secure, enterprise-grade Supabase cloud database to back up and synchronize all your business sales invoices, customer details, credentials, and settings. This ensures real-time access across devices and safeguards your business operations from data loss.
                  </p>
                </Card>

                {/* 2. Device & Camera Permissions */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
                      <Camera className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">2. Device & Camera Permissions</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Our application requires access to the camera exclusively to scan item barcodes for lightning-fast bill checkouts. Image frames are processed locally on your device in real-time and are never uploaded to any external server. Local storage is also utilized to cache settings for offline readiness.
                  </p>
                </Card>

                {/* 3. WhatsApp Integration & Limits */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                      <MessageCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">3. WhatsApp Integration & Limits</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    This app provides a utility to pre-fill WhatsApp messages to send invoice links or digital receipts. The shop owner (user) remains solely responsible for initiating and sending these messages. Any suspension or ban from WhatsApp resulting from message overuse is not the responsibility of InstaMunim.
                  </p>
                </Card>

                {/* 4. Subscriptions & Payments */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 shrink-0">
                      <CreditCard className="h-6 w-6 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">4. Subscriptions & Payments</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Access to high-speed billing, advanced CRM templates, and multi-staff credentials relies on active monthly subscriptions. Failure to renew the service plan may restrict application utility or result in account suspension from the Admin Panel.
                  </p>
                </Card>

                {/* 5. Account Deletion & Danger Zone */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 shrink-0">
                      <Trash2 className="h-6 w-6 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">5. Account Deletion Policy</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    We support complete user autonomy. You can instantly delete your account and wipe all associated sales, inventory, and profit data directly via the app dashboard under <span className="font-extrabold text-rose-500">Settings &gt; Account Security &gt; Danger Zone</span>. This action permanently and irreversibly purges your data from Supabase database.
                  </p>
                </Card>

                {/* 6. Support & Contact */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-100 dark:border-amber-900/30 shrink-0">
                      <Send className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">6. Support Contact</h3>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    For any support queries, data export assistance, or legal clarifications, reach out to our helpdesk at <span className="font-extrabold text-amber-600 dark:text-amber-400">instamunim@gmail.com</span> or message us directly on WhatsApp support.
                  </p>
                </Card>

                {/* AGREEMENT FOOTER */}
                <div className="pt-6">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-900 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 italic italic">
                      By using this application, you agree to these policies and terms.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-8">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Version 2.0.4 - Enterprise Edition</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Enquiries" && (
            <div className="pb-28">
              <EnquiriesView
                storeId={currentStoreId}
                businessType={businessType}
                customers={[]}
                setCustomers={() => { }}
                supabase={supabase}
                onClose={() => setActiveTab("MoreMenu")}
              />
            </div>
          )}

          {activeTab === "MoreMenu" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-1">
              <header className="px-2">
                <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{t("More Options")}</h2>
                <p className="text-zinc-500 font-bold mt-1">{t("Access additional tools and settings.")}</p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "Settings", label: "Settings", icon: Settings, color: "text-zinc-600", bg: "bg-zinc-50" },
                  ...(businessType !== "Mobile/Electronics" ? [{ id: "Inventory", label: "Inventory", icon: Package, color: "text-orange-500", bg: "bg-orange-50" }] : []),
                  ...(businessType === "Mobile/Electronics" ? [
                    { id: "FinanceTracker", label: "EMI Tracker", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
                    { id: "BuybackTracker", label: "Exchange Ledger", icon: RefreshCw, color: "text-orange-600", bg: "bg-orange-55" }
                  ] : []),
                  { id: "Rent", label: "Rent", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
                  { id: "Khata", label: "UDHAAR KHATA", icon: Book, color: "text-orange-500", bg: "bg-orange-50" },
                  { id: "Marketing", label: "Smart CRM", icon: Send, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { id: "Legal", label: "Privacy & Policy", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
                  { id: "Support", label: "Support", icon: Smartphone, color: "text-emerald-500", bg: "bg-emerald-50" },
                  { id: "Enquiries", label: "Enquiries", icon: MessageCircle, color: "text-pink-500", bg: "bg-pink-50" },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabNavigation(item.id)}
                    className="py-7 px-2 bg-white dark:bg-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} dark:bg-opacity-10 border border-zinc-100 dark:border-zinc-800 shadow-sm`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-[13px] font-black text-zinc-900 dark:text-white tracking-wider text-center uppercase">{t(item.label)}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-8 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-full border border-red-100 dark:border-red-900/20 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                >
                  <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black tracking-[0.2em]">LOGOUT ACCOUNT</span>
                </button>
                <p className="text-center text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em] mt-6">Version 2.0.4 Enterprise</p>
              </div>
            </div>
          )}

          {activeTab === "Inventory" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10 px-4 pt-4">
              <header className="relative">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter">{t("Daily Stock")}</h2>
                <p className="text-zinc-500 font-bold flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" /> {t(INVENTORY_CATEGORY_CONFIGS[businessType]?.subtext || "Track your store raw items and recipe stock.")}
                </p>
              </header>

              {!isSubscribed ? (
                <Card className="bg-gradient-to-br from-zinc-900 to-black text-white p-10 rounded-[3rem] border border-zinc-800 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                  <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center relative animate-pulse shadow-inner">
                    <Lock className="h-10 w-10 text-orange-500" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{t("Daily Stock Locked")}</h3>
                    <p className="text-zinc-400 font-bold text-xs max-w-sm mx-auto leading-relaxed">
                      Daily stock diaries, consumption logs, and inventory alerts are premium features of the Smart Business Plan.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent(`Hi Admin, I want to upgrade to the Paid Plan to unlock Daily Stock for: ${restaurantName} (${ownerMobile}).`)}`, "_blank")}
                    className="h-14 px-8 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all z-10"
                  >
                    Activate Smart Business Plan
                  </Button>
                </Card>
              ) : (
                <InventoryDiary businessType={businessType} itemsProp={menuItems} setItemsProp={setMenuItems} storeId={currentStoreId} />
              )}
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-28 px-4 pt-4">
              <header className="flex items-center justify-between px-2 mb-6">
                <h2 className="text-3xl font-black tracking-tighter">{t("Settings")}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!isSubscribed) {
                        setShowUpgradeModal(true);
                      } else {
                        setIsDarkMode(!isDarkMode);
                      }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                  >
                    {isDarkMode ? <Sun className="h-5 w-5 text-zinc-400" /> : <Moon className="h-5 w-5 text-zinc-400" />}
                  </button>
                  <Button
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        // Save everything locally first to ensure persistence
                        localStorage.setItem("saas_store_logo", storeLogo || "");
                        localStorage.setItem("saas_store_signature", storeSignature || "");
                        localStorage.setItem("saas_store_name", restaurantName);
                        localStorage.setItem("saas_store_address", storeAddress);
                        localStorage.setItem("saas_store_phone", storePhone);
                        localStorage.setItem("saas_store_website", storeWebsite);
                        localStorage.setItem("saas_store_gstin", storeGstin);
                        localStorage.setItem("saas_gst_enabled", isGstEnabled.toString());
                        localStorage.setItem("saas_gst_rate", gstRate.toString());
                        localStorage.setItem("saas_monthly_rent", monthlyRent.toString());
                        localStorage.setItem("saas_swiggy_comm", swiggyCommission.toString());
                        localStorage.setItem("saas_swiggy_comm_type", swiggyCommType);
                        localStorage.setItem("saas_zomato_comm", zomatoCommission.toString());
                        localStorage.setItem("saas_zomato_comm_type", zomatoCommType);
                        localStorage.setItem("saas_store_upi_id", storeUpiId || "");
                        localStorage.setItem("saas_store_upi_name", storeUpiName || "");

                        // Serialize ALL store settings and configurations together into the store_logo column for database persistence
                        const settingsPacket = {
                          upiId: storeUpiId || "",
                          upiName: storeUpiName || "",
                          logo: storeLogo || "",
                          signature: storeSignature || "",
                          address: storeAddress || "",
                          phone: storePhone || "",
                          website: storeWebsite || "",
                          gstin: storeGstin || "",
                          gstEnabled: isGstEnabled,
                          gstRate: gstRate,
                          swiggyComm: swiggyCommission,
                          swiggyCommType: swiggyCommType,
                          zomatoComm: zomatoCommission,
                          zomatoCommType: zomatoCommType,
                          businessType: businessType || "Restaurant/Cafe",
                          thermalPrinter: isThermalPrinterEnabled,
                          voiceEnabled: isVoiceAnnouncerEnabled,
                          voiceLang: voiceAnnouncerLanguage,
                          lang: lang,
                          // Preserve Super Admin Flags
                          isSuspended: isAccountSuspended,
                          voiceCashier: flagVoiceCashier,
                          aiScanner: flagAiScanner,
                          buybackTracker: flagBuybackTracker,
                          udhaarKhata: flagUdhaarKhata,
                          reportsCrm: flagReportsCrm,
                          inventoryMgmt: flagInventoryMgmt,
                          gstInvoicing: flagGstInvoicing
                        };
                        const combinedLogo = "JSON_CFG:" + JSON.stringify(settingsPacket);

                        // Cloud Sync (Safe Mode via Secure RPC)
                        const { error: syncError } = await supabase
                          .rpc('update_store_settings', {
                            input_mobile: ownerMobile,
                            input_name: restaurantName,
                            input_logo: combinedLogo,
                            input_rent: monthlyRent
                          });

                        if (syncError) {
                          console.warn("Cloud sync warning:", syncError.message);
                        }

                        // Success Feedback
                        setExpandedSetting(null);
                        setSyncStatus("synced");
                        setLastSyncedTime(format(new Date(), "hh:mm:ss aa"));
                      } catch (err: any) {
                        alert("Save Error: " + (err.message || "Cloud connection failed"));
                        setSyncStatus("error");
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 h-10 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl shadow-zinc-900/20 active:scale-95 transition-all disabled:opacity-70"
                  >
                    {isSyncing ? (
                      <>SAVING... <Loader2 className="h-3 w-3 animate-spin" /></>
                    ) : (
                      <>SAVE <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div></>
                    )}
                  </Button>
                </div>
              </header>

              <div className="space-y-3">
                {[
                  { id: "StoreProfile", label: "Store Profile", icon: Users },
                  { id: "AccountSecurity", label: "Account Security", icon: Lock },
                  { id: "SystemCloud", label: "System & Cloud", icon: Cloud },
                  { id: "WhatsAppBot", label: "WhatsApp Bot", icon: MessageCircle },
                  ...(ownerMobile === "7838229178" ? [{ id: "AdSettings", label: "Ad Monetization", icon: CreditCard }] : []),
                  { id: "FeesCommissions", label: "Fees & Commissions", icon: TrendingUp },
                  { id: "HardwareSettings", label: "Hardware Settings", icon: Printer },
                  { id: "FAQSecurity", label: "FAQ & Data Security", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => setExpandedSetting(expandedSetting === item.id ? null : item.id)}
                      className={`w-full p-5 flex items-center justify-between transition-all active:scale-95 group ${expandedSetting === item.id && (item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "AdSettings" || item.id === "FeesCommissions" || item.id === "HardwareSettings" || item.id === "FAQSecurity") ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={`h-5 w-5 ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "AdSettings" || item.id === "FeesCommissions" || item.id === "HardwareSettings") ? 'text-orange-500' : (item.id === "FAQSecurity" ? 'text-emerald-500' : 'text-zinc-900 dark:text-white')) : 'text-zinc-400'}`} />
                        <span className={`font-bold text-sm ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "AdSettings" || item.id === "FeesCommissions" || item.id === "HardwareSettings" || item.id === "FAQSecurity") ? 'text-white' : 'text-zinc-900 dark:text-white') : 'text-zinc-700 dark:text-zinc-300'}`}>{t(item.label)}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${expandedSetting === item.id ? 'rotate-90 text-white' : 'text-zinc-300'}`} />
                    </button>

                    {expandedSetting === item.id && (
                      <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300 border-t border-zinc-50 dark:border-zinc-800">
                        {item.id === "StoreProfile" && (
                          <div className="space-y-8 pt-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Business Name</Label>
                              <Input
                                value={restaurantName}
                                onChange={e => setRestaurantName(e.target.value)}
                                className="h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 shadow-inner text-xl font-black px-6 focus:ring-2 ring-orange-500/20 transition-all"
                                placeholder="Enter Business Name"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Business Category (Locked)</Label>
                              <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 text-base font-extrabold px-6 flex items-center text-zinc-500 dark:text-zinc-400 select-none">
                                {BUSINESS_CATEGORIES[businessType]?.name || businessType}
                              </div>
                              <p className="text-[9px] font-bold text-zinc-400 px-2 uppercase">Please contact support/admin to change your business category.</p>
                            </div>

                            <div className="space-y-4">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Store Logo / Profile Picture</Label>
                              <div className="flex items-center gap-6 px-2">
                                <div className="w-24 h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                  {storeLogo ? (
                                    <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-4xl font-black text-zinc-300 uppercase">{restaurantName.charAt(0) || "S"}</span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <label className="cursor-pointer bg-orange-50 dark:bg-orange-950/20 text-orange-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest inline-block hover:bg-orange-100 transition-all active:scale-95 border border-orange-100 dark:border-orange-900/30 shadow-sm">
                                    Choose File
                                    <input type="file" className="hidden" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setIsApiLoading(true);
                                        const publicUrl = await uploadToSupabaseStorage(file, 'logo');
                                        if (publicUrl) setStoreLogo(publicUrl);
                                        setIsApiLoading(false);
                                      }
                                    }} />
                                  </label>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight ml-1">Update Brand Identity</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">OR Logo Link (URL)</Label>
                              <Input
                                value={storeLogo || ""}
                                onChange={e => setStoreLogo(e.target.value)}
                                className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 shadow-sm"
                                placeholder="https://example.com/logo.png"
                              />
                              <p className="text-[8px] font-bold text-zinc-400 px-2 italic uppercase">Recommended if Cloud Save is not active</p>
                            </div>

                            {/* AUTHORISED SIGNATURE UPLOADER */}
                            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Authorised Signature (Prints on Invoices)</Label>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                                <div className="w-32 h-16 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                                  {storeSignature ? (
                                    <img src={storeSignature} alt="Authorised Signature" className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tight">No Signature</span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex gap-2 items-center">
                                    <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest inline-block hover:bg-indigo-500 transition-all active:scale-95 shadow-sm">
                                      Upload Signature
                                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setIsApiLoading(true);
                                          const publicUrl = await uploadToSupabaseStorage(file, 'signature');
                                          if (publicUrl) {
                                            setStoreSignature(publicUrl);
                                            localStorage.setItem("saas_store_signature", publicUrl);
                                          }
                                          setIsApiLoading(false);
                                        }
                                      }} />
                                    </label>
                                    {storeSignature && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setStoreSignature(null);
                                          localStorage.removeItem("saas_store_signature");
                                        }}
                                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase px-2 py-1"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Appears on bottom right of digital tax invoices</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Store Address</Label>
                                <Input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6" />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Contact Phone</Label>
                                <Input value={storePhone} onChange={e => setStorePhone(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6" />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Store Website</Label>
                                <Input value={storeWebsite} onChange={e => setStoreWebsite(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6" />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">GSTIN Number</Label>
                                <Input value={storeGstin} onChange={e => setStoreGstin(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6" />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">GST Billing Mode</Label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsGstEnabled(true)}
                                    className={`h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-0 ${isGstEnabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                                  >
                                    GST ON
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsGstEnabled(false)}
                                    className={`h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-0 ${!isGstEnabled ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                                  >
                                    GST OFF
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">GST Rate (%)</Label>
                                <select
                                  value={gstRate}
                                  onChange={e => setGstRate(Number(e.target.value))}
                                  disabled={!isGstEnabled}
                                  className="w-full h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-40"
                                >
                                  <option value={5}>5% (Retail/Food)</option>
                                  <option value={12}>12% (Services/Goods)</option>
                                  <option value={18}>18% (Standard Services)</option>
                                  <option value={28}>28% (Luxury Goods)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Monthly Rent (₹)</Label>
                              <Input
                                type="number"
                                value={monthlyRent}
                                onChange={e => setMonthlyRent(Number(e.target.value))}
                                className="h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border-0 shadow-inner text-3xl font-black px-6 focus:ring-2 ring-orange-500/20 transition-all"
                                placeholder="0"
                              />
                            </div>

                            {/* UPI ID & Payments Config */}
                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                              <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider pl-1">UPI Payments Configuration</h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Store UPI ID</Label>
                                  <Input
                                    value={storeUpiId}
                                    onChange={e => setStoreUpiId(e.target.value)}
                                    className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 shadow-sm"
                                    placeholder="merchant@upi"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">UPI Display Name (Merchant Name)</Label>
                                  <Input
                                    value={storeUpiName}
                                    onChange={e => setStoreUpiName(e.target.value)}
                                    className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 shadow-sm"
                                    placeholder="Sharma Dhaba"
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Upload UPI QR Scanner (PNG/JPG)</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-150 dark:border-zinc-850">
                                  <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-orange-500/20 shrink-0">
                                    <Camera className="h-4 w-4" /> Upload QR Code
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg"
                                      onChange={handleQrUpload}
                                    />
                                  </label>
                                  <div className="text-left">
                                    <p className="text-[10px] font-black text-zinc-650 dark:text-zinc-400 uppercase tracking-wide">AUTO-SCAN UPI QR</p>
                                    <p className="text-[9px] text-zinc-400 font-semibold leading-relaxed mt-0.5">Upload screenshot or photo of your GooglePay/PhonePe business QR. System will scan and auto-extract UPI parameters.</p>
                                  </div>
                                </div>
                              </div>

                              {isScanning && (
                                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                  <span className="text-xs font-bold text-orange-600">Scanning uploaded QR image...</span>
                                </div>
                              )}

                              {scanError && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-150 dark:border-red-900/20 text-xs font-bold text-red-500">
                                  {scanError}
                                </div>
                              )}

                              {scanSuccessMessage && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 text-xs font-bold text-emerald-600">
                                  {scanSuccessMessage}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.id === "AccountSecurity" && (
                          <div className="space-y-6 pt-6">
                            {/* --- Password Update --- */}
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Owner Password</Label>
                              <Input
                                type="password"
                                value={ownerPassword}
                                onChange={e => setOwnerPassword(e.target.value)}
                                className="h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border-0 shadow-inner text-2xl font-black px-6 focus:ring-2 ring-orange-500/20 transition-all"
                              />
                            </div>
                            <Button className="w-full h-16 bg-[#00c875] hover:bg-[#00b067] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                              UPDATE PASSWORD
                            </Button>

                            {/* --- Divider --- */}
                            <div className="flex items-center gap-3 py-2">
                              <div className="flex-1 h-px bg-red-100 dark:bg-red-900/30" />
                              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Danger Zone</span>
                              <div className="flex-1 h-px bg-red-100 dark:bg-red-900/30" />
                            </div>

                            {/* --- Delete Account Card --- */}
                            {!showDeleteAccountModal ? (
                              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl p-6 space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center shrink-0">
                                    <Trash2 className="h-6 w-6 text-red-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-red-700 dark:text-red-400 text-sm uppercase tracking-tight">Delete Account</h4>
                                    <p className="text-[11px] text-red-500/80 font-bold leading-relaxed mt-1">
                                      Aapka poora data — sales, menu, expenses — permanently delete ho jayega. Ye action undo nahi ho sakta.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setShowDeleteAccountModal(true);
                                    setDeleteConfirmStep('form');
                                    setDeleteMobile("");
                                    setDeletePassword("");
                                    setDeleteError("");
                                  }}
                                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                >
                                  🗑️ Delete My Account
                                </button>
                              </div>
                            ) : (
                              <div className="bg-zinc-950 border border-red-900/50 rounded-3xl p-6 space-y-5 shadow-2xl">
                                {deleteConfirmStep === 'form' ? (
                                  <>
                                    <div className="text-center space-y-1">
                                      <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Trash2 className="h-7 w-7 text-red-500" />
                                      </div>
                                      <h4 className="font-black text-white text-base uppercase tracking-tight">Verify Karo, Phir Delete</h4>
                                      <p className="text-[10px] text-zinc-400 font-bold">Apna registered number aur password enter karo</p>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Registered Mobile Number</Label>
                                        <Input
                                          type="tel"
                                          maxLength={10}
                                          placeholder="10-digit mobile number"
                                          value={deleteMobile}
                                          onChange={e => { setDeleteMobile(e.target.value); setDeleteError(""); }}
                                          className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black text-lg px-5 placeholder:text-zinc-600 focus:ring-2 ring-red-500/30 transition-all"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Account Password</Label>
                                        <Input
                                          type="password"
                                          placeholder="Enter your password"
                                          value={deletePassword}
                                          onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
                                          className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black text-lg px-5 placeholder:text-zinc-600 focus:ring-2 ring-red-500/30 transition-all"
                                        />
                                      </div>
                                    </div>

                                    {deleteError && (
                                      <div className="bg-red-950/60 border border-red-800/50 rounded-xl px-4 py-3">
                                        <p className="text-[11px] text-red-400 font-bold">⚠️ {deleteError}</p>
                                      </div>
                                    )}

                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => setShowDeleteAccountModal(false)}
                                        className="flex-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!deleteMobile || deleteMobile.length !== 10) {
                                            setDeleteError("Valid 10-digit mobile number enter karo.");
                                            return;
                                          }
                                          if (!deletePassword) {
                                            setDeleteError("Password field empty hai.");
                                            return;
                                          }
                                          if (deleteMobile !== ownerMobile) {
                                            setDeleteError("Ye mobile number is account se registered nahi hai.");
                                            return;
                                          }
                                          setDeleteConfirmStep('confirm');
                                          setDeleteError("");
                                        }}
                                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                      >
                                        Next →
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Final Confirm Step */}
                                    <div className="text-center space-y-3">
                                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                        <Trash2 className="h-8 w-8 text-red-500" />
                                      </div>
                                      <h4 className="font-black text-white text-lg">Are you sure?</h4>
                                      <p className="text-[11px] text-red-400 font-bold leading-relaxed px-2">
                                        Number <span className="text-white">{deleteMobile}</span> ka poora account aur data permanently delete hoga. Ye kisi bhi tarah recover nahi ho sakta.
                                      </p>
                                    </div>

                                    {deleteError && (
                                      <div className="bg-red-950/60 border border-red-800/50 rounded-xl px-4 py-3">
                                        <p className="text-[11px] text-red-400 font-bold">⚠️ {deleteError}</p>
                                      </div>
                                    )}

                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => setDeleteConfirmStep('form')}
                                        disabled={isDeleting}
                                        className="flex-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                                      >
                                        ← Back
                                      </button>
                                      <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-red-900/40 disabled:opacity-60 flex items-center justify-center gap-2"
                                      >
                                        {isDeleting ? (
                                          <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                                        ) : (
                                          <>🗑️ YES, DELETE</>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {item.id === "WhatsAppBot" && (
                          <div className="pt-6">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-5 rounded-3xl flex items-center justify-between mb-4 shadow-sm">
                              <div>
                                <h4 className="font-black text-lg tracking-tight">Auto WhatsApp</h4>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">Invoice Sending</p>
                              </div>
                              <button
                                onClick={() => setIsWhatsAppEnabled(!isWhatsAppEnabled)}
                                className={`px-6 h-10 rounded-xl font-black text-xs transition-all active:scale-95 ${isWhatsAppEnabled ? 'bg-[#00c875] text-white shadow-lg shadow-emerald-500/10' : 'bg-zinc-100 text-zinc-400'}`}
                              >
                                {isWhatsAppEnabled ? "ACTIVE" : "INACTIVE"}
                              </button>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                              <textarea
                                value={whatsappInvoiceTemplate}
                                onChange={e => setWhatsappInvoiceTemplate(e.target.value)}
                                className="w-full h-44 bg-transparent border-0 text-sm font-bold leading-relaxed resize-none focus:ring-0 text-zinc-700 dark:text-zinc-300"
                                placeholder="Write your invoice template here..."
                              />
                            </div>
                            <p className="text-[8px] font-bold text-zinc-400 italic mt-3 ml-2 tracking-tight">● Use tags: [NAME], [SHOP], [ITEMS], [TOTAL]</p>
                          </div>
                        )}

                        {item.id === "AdSettings" && (
                          <div className="pt-6 space-y-4">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-5 rounded-3xl shadow-sm space-y-4">
                              <h4 className="font-black text-lg tracking-tight">Ad Monetization Mode</h4>
                              <div className="flex gap-2">
                                {[
                                  { id: "admob", label: "Google AdMob" },
                                  { id: "web", label: "Web Ads (Direct APK)" },
                                  { id: "none", label: "No Ads" }
                                ].map((prov) => (
                                  <button
                                    key={prov.id}
                                    onClick={() => setAdProvider(prov.id as any)}
                                    className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 border ${adProvider === prov.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-md' : 'bg-transparent text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                                  >
                                    {prov.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {adProvider === "web" && (
                              <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-5 rounded-3xl shadow-sm space-y-4">
                                <h4 className="font-black text-lg tracking-tight">Web Ads Configurations</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 ml-2">Ad Script URL</label>
                                    <input
                                      type="text"
                                      value={webAdScriptUrl}
                                      onChange={(e) => setWebAdScriptUrl(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                      placeholder="//www.highperformanceformat.com/abcd123/invoke.js"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 ml-2">Ad Placement Key / ID (Optional)</label>
                                    <input
                                      type="text"
                                      value={webAdKey}
                                      onChange={(e) => setWebAdKey(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                      placeholder="Adsterra Key / Monetag Zone ID"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 ml-2">Web Interstitial / Direct Link URL</label>
                                    <input
                                      type="text"
                                      value={webAdDirectLink}
                                      onChange={(e) => setWebAdDirectLink(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                      placeholder="Paste Monetag Direct Link URL here"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 ml-2">Vignette Video Script URL</label>
                                    <input
                                      type="text"
                                      value={webAdVignetteUrl}
                                      onChange={(e) => setWebAdVignetteUrl(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                      placeholder="https://n6wxm.com/vignette.min.js"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 ml-2">Vignette Video Zone ID</label>
                                    <input
                                      type="text"
                                      value={webAdVignetteKey}
                                      onChange={(e) => setWebAdVignetteKey(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                                      placeholder="Monetag Vignette Zone ID"
                                    />
                                  </div>
                                </div>
                                <p className="text-[8px] font-bold text-zinc-400 leading-normal ml-2">
                                  * Paste the script details generated from your Monetag/Adsterra publisher panel. The app will automatically render ads on direct APK builds.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {item.id === "FeesCommissions" && (
                          <div className="pt-6 space-y-3">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-4 sm:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${getPartnerConfig(businessType).swiggyColor} flex items-center justify-center font-black shrink-0`}>
                                  {getPartnerConfig(businessType).swiggyIcon}
                                </div>
                                <span className="font-black text-sm">{getPartnerName(businessType, "Swiggy")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={swiggyCommType}
                                  onChange={e => setSwiggyCommType(e.target.value)}
                                  className="bg-zinc-100 dark:bg-zinc-700/80 rounded-xl px-2.5 py-1.5 font-black text-xs border-0 focus:ring-0 text-zinc-700 dark:text-zinc-200"
                                >
                                  <option value="percent">% (Percent)</option>
                                  <option value="fixed">₹ (Fixed)</option>
                                </select>
                                <Input type="number" value={swiggyCommission} onChange={e => setSwiggyCommission(Number(e.target.value))} className="w-20 h-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center font-black text-sm focus:ring-0" />
                              </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-4 sm:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${getPartnerConfig(businessType).zomatoColor} flex items-center justify-center font-black shrink-0`}>
                                  {getPartnerConfig(businessType).zomatoIcon}
                                </div>
                                <span className="font-black text-sm">{getPartnerName(businessType, "Zomato")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={zomatoCommType}
                                  onChange={e => setZomatoCommType(e.target.value)}
                                  className="bg-zinc-100 dark:bg-zinc-700/80 rounded-xl px-2.5 py-1.5 font-black text-xs border-0 focus:ring-0 text-zinc-700 dark:text-zinc-200"
                                >
                                  <option value="percent">% (Percent)</option>
                                  <option value="fixed">₹ (Fixed)</option>
                                </select>
                                <Input type="number" value={zomatoCommission} onChange={e => setZomatoCommission(Number(e.target.value))} className="w-20 h-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center font-black text-sm focus:ring-0" />
                              </div>
                            </div>
                          </div>
                        )}

                        {item.id === "SystemCloud" && (
                          <div className="pt-6">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                              <div>
                                <h4 className="font-black text-lg tracking-tight">Cloud Engine v2.0</h4>
                                <div className="bg-[#00c875] text-white px-3 py-1 rounded-lg text-[10px] font-black mt-1 inline-block uppercase tracking-wider">
                                  {isSyncing ? "SYNCING..." : "ACTIVE"}
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 mt-2">Last Cloud Sync: {lastSyncedTime}</p>
                              </div>
                              <RefreshCw className={`h-8 w-8 text-zinc-100 dark:text-zinc-700 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
                            </div>
                            <Button
                              onClick={syncAllData}
                              disabled={isSyncing}
                              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-4"
                            >
                              {isSyncing ? "SYNCING..." : "MANUAL SYNC NOW"}
                            </Button>

                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl text-left text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-4 space-y-1">
                              <div>
                                <span className="font-bold text-zinc-500">Active Ad Network:</span> <span className="text-orange-500 font-bold uppercase">
                                  {adProvider === "admob"
                                    ? (isAdMobBannerFailed ? "Web Ads (Monetag) [Backup Active]" : "Google AdMob + Meta Ads")
                                    : adProvider === "web" ? "Web Ads (Monetag)" : "None / Disabled"}
                                </span>
                              </div>
                              {isProOrAbove ? (
                                <div>
                                  <span className="font-bold text-emerald-500">Plan Tier Status:</span> Pro / VIP Plan (100% Ad-Free)
                                </div>
                              ) : isSubscribed ? (
                                <div>
                                  <span className="font-bold text-orange-500">Plan Tier Status:</span> Starter Plan ₹199 (Top Banner Active • Video Ads Disabled)
                                </div>
                              ) : null}
                              {adProvider === "admob" && !isProOrAbove && (
                                <div>
                                  <span className="font-bold text-orange-500">AdMob Status:</span> {admobDebugInfo}
                                </div>
                              )}
                              {(adProvider === "web" || (adProvider === "admob" && isAdMobBannerFailed)) && !isProOrAbove && (
                                <div>
                                  <span className="font-bold text-orange-500">Monetag Status:</span> {webAdScriptUrl ? "Running successfully" : "Not configured"}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.id === "HardwareSettings" && (
                          <div className="pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            {/* Thermal Printer Card */}
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isThermalPrinterEnabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                                  <Printer className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="font-black text-lg tracking-tight">Thermal Printer</h4>
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Bluetooth / USB</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setIsThermalPrinterEnabled(!isThermalPrinterEnabled)}
                                className={`w-16 h-9 rounded-2xl transition-all flex items-center px-1.5 ${isThermalPrinterEnabled ? 'bg-orange-500 justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'}`}
                              >
                                <div className="w-6 h-6 bg-white rounded-full shadow-lg" />
                              </button>
                            </div>

                            {isThermalPrinterEnabled && (
                              <div className="mt-4 p-5 bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/20 flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Printer Service Active & Ready</p>
                              </div>
                            )}

                            {/* Voice Cashier / Soundbox Card */}
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-6 rounded-3xl space-y-5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isVoiceAnnouncerEnabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                                    <Volume2 className="h-6 w-6" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h4 className="font-black text-lg tracking-tight">{t("Voice Cashier")}</h4>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Audio Soundbox</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const nextVal = !isVoiceAnnouncerEnabled;
                                    setIsVoiceAnnouncerEnabled(nextVal);
                                    if (nextVal) {
                                      const testText = voiceAnnouncerLanguage === "hi"
                                        ? "इंस्टामुनिम वॉइस कैशियर चालू है"
                                        : "InstaMunim voice cashier is active";
                                      setTimeout(() => {
                                        announceVoice(testText, voiceAnnouncerLanguage);
                                      }, 100);
                                    }
                                  }}
                                  className={`w-16 h-9 rounded-2xl transition-all flex items-center px-1.5 ${isVoiceAnnouncerEnabled ? 'bg-orange-500 justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'}`}
                                >
                                  <div className="w-6 h-6 bg-white rounded-full shadow-lg" />
                                </button>
                              </div>

                              {isVoiceAnnouncerEnabled && (
                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700 space-y-4">
                                  {/* Language Selector */}
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <h5 className="font-bold text-sm tracking-tight">{t("Announcer Language")}</h5>
                                      <p className="text-[10px] font-medium text-zinc-400 leading-none">{t("Synchronized with UI language")}</p>
                                    </div>
                                    <span className="px-3.5 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-[10px] font-black text-orange-600 uppercase tracking-widest rounded-xl">
                                      {lang === "hi" ? "हिन्दी" : lang === "mr" ? "मराठी" : lang === "gu" ? "ગુજરાતી" : lang === "bn" ? "বাংলা" : lang === "pa" ? "ਪੰਜਾਬੀ" : lang === "ta" ? "தமிழ்" : lang === "te" ? "తెలుగు" : lang === "kn" ? "ಕನ್ನಡ" : lang === "ml" ? "മലയാളം" : "English"}
                                    </span>
                                  </div>

                                  {/* Service status indicator */}
                                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Voice Announcer Service Connected</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const testText = voiceAnnouncerLanguage === "hi"
                                          ? "यह एक परीक्षण आवाज संदेश है।"
                                          : "This is a test voice announcement.";
                                        announceVoice(testText);
                                      }}
                                      className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 text-[10px] font-black text-orange-600 uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                    >
                                      Test Voice
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}


                        {item.id === "FAQSecurity" && (
                          <div className="pt-6 space-y-4">
                            {[
                              {
                                q: "Is my customer data safe from hackers?",
                                a: "Absolutely. Your data is encrypted with AES-256 bank-level security. We strictly adhere to global privacy laws, ensuring 0% data leaks or hacks. Your ledger is 100% private."
                              },
                              {
                                q: "Will I lose my data if my phone breaks?",
                                a: "Never. All your sales and Udhaar data is synchronized to our secure cloud servers instantly. You can log into any new device and perfectly restore your entire business without losing a single rupee."
                              },
                              {
                                q: "Are there any hidden payments or fraud?",
                                a: "No! The platform operates on 100% transparent pricing. You will never be billed automatically without explicit consent, protecting you completely against subscription fraud and hidden charges."
                              },
                              {
                                q: "Will you spam my customers with ads?",
                                a: "Never. The Smart CRM only sends promotional messages explicitly triggered by you. We do not sell your data, make calls, or run third-party spam operations."
                              }
                            ].map((faq, i) => (
                              <div key={i} className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-6 rounded-3xl shadow-sm">
                                <h4 className="text-emerald-600 font-black text-sm mb-2 leading-relaxed">Q: {faq.q}</h4>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full bg-white dark:bg-zinc-900 p-5 rounded-2xl flex items-center justify-between border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95 group mt-4"
                >
                  <div className="flex items-center gap-4">
                    <LogOut className="h-5 w-5 text-red-500" />
                    <span className="font-bold text-sm text-red-500">Logout</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* Old Support Tab Removed */}

          {/* Web simulated banner ad */}
          {!isSubscribed && (
            <div className="w-full bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 mt-6 animate-in fade-in duration-1000 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest border border-orange-500/30 px-1.5 py-0.5 rounded bg-orange-500/10">Ad</span>
                </div>
                <div className="text-left">
                  <p className="font-black text-xs text-zinc-800 dark:text-zinc-200">🚀 Unlock the Ultimate POS Experience</p>
                  <p className="text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-tighter">Get unlimited billing, rent tracker, barcode scanner & no ads!</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="h-8 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-black text-[9px] uppercase tracking-wider shrink-0 active:scale-95 transition-all shadow-md shadow-orange-500/20"
              >
                Remove Ads
              </Button>
            </div>
          )}

        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 h-14 border-t backdrop-blur-2xl z-50 flex items-center justify-around px-4 ${isDarkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]'}`}>
        <button onClick={() => handleTabNavigation("Dashboard")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Dashboard' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Dashboard' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><LayoutDashboard className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">{t("Dashboard")}</span>
        </button>

        <button onClick={() => handleTabNavigation("Menu")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Menu' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Menu' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><ShoppingCart className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">{t("Menus")}</span>
        </button>

        <button onClick={() => setIsSaleOpen(true)} className="flex flex-col items-center -mt-8 group">
          <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center shadow-xl shadow-orange-600/30 border-4 border-[#fafafa] dark:border-zinc-950 group-active:scale-90 transition-all">
            <PlusCircle className="h-8 w-8 text-white" />
          </div>
          <span className="text-[8px] font-bold uppercase text-orange-600 mt-1 tracking-widest">{t("Sale")}</span>
        </button>

        <button onClick={() => handleTabNavigation("Total Sale Report")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Total Sale Report' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Total Sale Report' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><PieChart className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">{t("Stats")}</span>
        </button>

        <button onClick={() => handleTabNavigation("MoreMenu")} className={`flex flex-col items-center gap-1 transition-all ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory', 'BuybackTracker'].includes(activeTab) ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory', 'BuybackTracker'].includes(activeTab) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><Settings className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">{t("More")}</span>
        </button>
      </nav>
      {/* EXIT PROTECTION DIALOG */}
      {/* EXPENSE BREAKDOWN DIALOG */}
      <Dialog open={showExpenseBreakdown} onOpenChange={setShowExpenseBreakdown}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl bg-white dark:bg-zinc-900 p-6 max-w-md w-[90%] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wider text-purple-650">Expense Breakdown</DialogTitle>
            <DialogDescription className="text-xs font-bold text-zinc-450 uppercase tracking-widest">
              Detailed list of operational costs for {startDate} to {endDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 mt-4 divide-y dark:divide-zinc-850">
            {filteredExpenses.length === 0 ? (
              <p className="text-center py-8 text-zinc-400 font-bold italic text-xs">No expenses recorded for this range.</p>
            ) : (
              filteredExpenses.map((exp) => (
                <div key={exp.id} className="pt-3 first:pt-0 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-zinc-950 dark:text-white leading-tight uppercase">
                      {(() => {
                        if (exp.title.includes("Used Phone Buyback:")) {
                          const match = exp.title.match(/Used Phone Buyback:\s*([^\(]+)/);
                          return match ? `Buyback: ${match[1].trim()}` : "Used Phone Purchase";
                        }
                        return exp.title.split('[BUYBACK')[0].trim();
                      })()}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {format(new Date(exp.date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <span className="font-black text-purple-650 text-base">₹{exp.amount}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-550">Total Costs</span>
            <span className="text-xl font-black text-purple-650">₹{Math.round(totalExpenses)}</span>
          </div>

          <Button
            onClick={() => setShowExpenseBreakdown(false)}
            className="w-full h-12 bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-black text-xs uppercase tracking-widest mt-4 border-0"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="p-8 border-0 max-w-[320px] bg-zinc-900 text-white rounded-xl shadow-2xl">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-center">{t("Are you sure you want to exit?")}</DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs font-bold leading-relaxed text-center">
                {t("Your current session will end. Do you want to leave InstaMunim?")}
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={async () => {
                await handleLogout();
                try {

                  await App.exitApp();
                } catch (e: any) {
                  window.close();
                }
              }} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs active:scale-95 transition-all">{t("Yes")}</Button>
              <Button onClick={() => setShowExitDialog(false)} variant="outline" className="flex-1 h-12 bg-transparent border-zinc-700 text-white hover:bg-white/5 font-black rounded-xl text-xs active:scale-95 transition-all">{t("No")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ORDER SUCCESS DIALOG */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="p-10 border-0 max-w-[340px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl">
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-inner">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black tracking-tight text-center">{t("Success!")}</DialogTitle>
              <DialogDescription className="text-zinc-500 font-bold italic text-center">
                {t("Order has been completed and saved to cloud.")}
              </DialogDescription>
            </div>

            <div className="space-y-4 pt-4">
              {lastOrderDetails?.mobile && lastOrderDetails.mobile !== "N/A" && lastOrderDetails.mobile !== "" && (
                <Button
                  onClick={() => {
                    sendWhatsAppReceipt();
                    setTimeout(() => setShowSuccessDialog(false), 1000);
                  }}
                  className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-lg shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle className="h-6 w-6" /> SEND RECEIPT
                </Button>
              )}
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className={lastOrderDetails?.mobile && lastOrderDetails.mobile !== "N/A" && lastOrderDetails.mobile !== ""
                  ? "w-full h-12 text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-zinc-600"
                  : "w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-0"
                }
                variant={lastOrderDetails?.mobile && lastOrderDetails.mobile !== "N/A" && lastOrderDetails.mobile !== "" ? "ghost" : "default"}
              >
                {lastOrderDetails?.mobile && lastOrderDetails.mobile !== "N/A" && lastOrderDetails.mobile !== "" ? "Done" : "OK"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TERMS & PRIVACY POLICY MODAL */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl w-[92%] max-h-[85vh] bg-white dark:bg-zinc-950 rounded-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                  InstaMunim Legal Terms
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                  DPDP Act 2023 & Google Play Policy Compliant
                </DialogDescription>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex gap-2 mt-4 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTermsModalTab('privacy')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${termsModalTab === 'privacy'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setTermsModalTab('terms')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${termsModalTab === 'terms'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
              >
                Terms of Service
              </button>
            </div>
          </DialogHeader>

          {/* Modal Body with Scroll */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
            {termsModalTab === 'privacy' ? (
              <>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  1. Information We Collect
                </h3>
                <p>
                  We collect information provided voluntarily by merchant owners during account setup and routine daily POS billing usage:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Account & Owner Details:</strong> Mobile phone number, business name, store logo, address, and login credentials.</li>
                  <li><strong>Business & Tax Details:</strong> GSTIN number, custom item prices, category settings, and UPI ID for payment QR code generation.</li>
                  <li><strong>Transaction Ledger Data:</strong> Customer contact numbers, billing item lists, payment types, and expense ledgers.</li>
                </ul>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  2. Device Permissions
                </h3>
                <p>
                  Our Android mobile app and Web application request specific browser and device permissions strictly to operate core features:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Camera Access:</strong> Used exclusively for real-time barcode scanning of retail items. Video feeds are processed locally on device and never recorded or uploaded.</li>
                  <li><strong>Local Storage:</strong> Used to temporarily store offline sessions and UI preferences.</li>
                </ul>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  3. Data Security & Encryption
                </h3>
                <p>
                  All data transmissions between your app and cloud servers are encrypted using 256-bit SSL/TLS (HTTPS). Account databases hosted on Supabase PostgreSQL are encrypted at rest using AES-256 with Row-Level Security (RLS).
                </p>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  4. Instant Account Deletion
                </h3>
                <p>
                  You maintain 100% control over your store data. You can permanently delete your store account and erase all transaction data at any time inside the app by going to <strong>Settings &gt; Account Security &gt; Delete Account</strong>, or by emailing <strong>Instamunim@gmail.com</strong>.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  1. Service Usage & Merchant Responsibility
                </h3>
                <p>
                  InstaMunim provides POS, billing, and store management tools. Merchant owners are responsible for ensuring accurate tax calculation (GST) and compliance with local retail regulations.
                </p>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  2. Account Credentials & Security
                </h3>
                <p>
                  Merchants are responsible for maintaining the confidentiality of their mobile login numbers and PINs. Unauthorized account usage must be reported to support immediately.
                </p>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  3. Limitation of Liability
                </h3>
                <p>
                  InstaMunim is provided on an "AS IS" and "AS AVAILABLE" basis. InstaMunim shall not be liable for indirect damages, network outages, or lost device hardware. Regular export of sales ledgers via PDF/Excel is recommended.
                </p>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-l-2 border-orange-500 pl-2">
                  4. Contact & Support
                </h3>
                <p>
                  For any legal inquiries, support or feedback, please contact us at <strong>Instamunim@gmail.com</strong> or visit <strong>https://instamunim.com</strong>.
                </p>
              </>
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
            <Button
              onClick={() => setShowTermsModal(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-6 h-10 rounded-xl"
            >
              I Understand & Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BARCODE SCANNER DIALOG */}
      <Dialog open={showScanner} onOpenChange={(open) => { if (!open) closeScanner(); }}>
        <DialogContent className="p-0 border-0 w-screen h-screen max-w-none m-0 bg-zinc-950 text-white rounded-none flex flex-col justify-between overflow-hidden">
          {/* Full Screen Camera Viewport */}
          <div className="relative w-full h-full flex flex-col justify-between">
            <div id="reader" className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

            {/* 1. Translucent Top Header bar */}
            <div className="relative z-10 w-full bg-zinc-950/75 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-zinc-800/50">
              <div className="space-y-0.5">
                <DialogTitle className="text-xs font-black uppercase tracking-widest text-orange-500">InstaMunim Barcode Scanner</DialogTitle>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">HD Scan Mode</p>
              </div>
              <Button size="icon" variant="ghost" onClick={closeScanner} className="h-9 w-9 text-zinc-400 hover:text-white rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 transition-all border border-zinc-800/40">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 2. Narrow Scanning Target Overlay (Only captures one barcode at a time) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6">
              <div className="w-full max-w-[320px] h-[75px] border-2 border-orange-500 rounded-2xl relative bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center">
                {/* Scanning Laser */}
                <div className="absolute left-3 right-3 h-[2px] bg-red-500 shadow-lg shadow-red-500 top-1/2 -translate-y-1/2 animate-pulse" />
              </div>

              <div className="mt-4 bg-zinc-950/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-zinc-800/50">
                <p className="text-white text-[9px] font-black uppercase tracking-widest text-center">
                  Align ONLY ONE barcode in target
                </p>
              </div>
            </div>

            {/* 3. Translucent Bottom Control Panel */}
            <div className="relative z-10 w-full bg-gradient-to-t from-zinc-950/95 via-zinc-950/85 to-transparent px-6 pb-8 pt-10 space-y-4">
              {/* Scan Success Message */}
              {lastScannedMsg && (
                <div className="bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2.5 rounded-2xl text-center shadow-lg animate-bounce flex items-center justify-center gap-2 max-w-[280px] mx-auto border border-emerald-500/30">
                  <span className="h-2.5 w-2.5 bg-white rounded-full animate-ping" />
                  {lastScannedMsg}
                </div>
              )}

              {/* Camera Zoom Control */}
              {hasZoomCapability && (
                <div className="max-w-[320px] mx-auto space-y-2 bg-zinc-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/60 shadow-xl">
                  <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                    <span>Magnify / Zoom</span>
                    <span className="text-orange-500 font-mono font-black">{currentZoom.toFixed(1)}x</span>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={zoomRange.min}
                    max={zoomRange.max}
                    step={zoomRange.step}
                    value={currentZoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer h-1.5 bg-zinc-850 rounded-lg appearance-none"
                  />

                  {/* Preset Zoom Buttons */}
                  <div className="flex gap-2 justify-center pt-1">
                    {[1, 1.5, 2, 2.5, 3, 4].map(val => {
                      if (val >= zoomRange.min && val <= zoomRange.max) {
                        return (
                          <button
                            key={val}
                            onClick={() => handleZoomChange(val)}
                            className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all border ${currentZoom === val
                                ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                                : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/80 hover:text-white"
                              }`}
                          >
                            {val}x
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {scannerError && (
                <p className="text-red-500 text-xs font-bold text-center leading-relaxed bg-red-950/20 py-2 rounded-xl border border-red-900/30 max-w-[320px] mx-auto">{scannerError}</p>
              )}

              {/* Debug Info */}
              <div className="text-center">
                <span className="inline-block text-[8px] font-mono font-bold text-zinc-500 bg-zinc-900/60 border border-zinc-800/50 px-3 py-1 rounded-full uppercase tracking-wider">
                  {scannerDebugInfo}
                </span>
              </div>

              {/* Fallback Camera Photo Scan (Jugad Scan) */}
              <div className="flex flex-col gap-2 max-w-[320px] mx-auto w-full pt-1">
                <label className="cursor-pointer h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-zinc-800/60 transition-all active:scale-95 shadow-lg">
                  <Camera className="h-4 w-4 text-orange-500" />
                  Capture Photo (Jugad Scan)
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLastScannedMsg("Scanning image...");
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = async () => {
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            canvas.width = 800;
                            canvas.height = 600;
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, 800, 600);
                              canvas.toBlob(async (blob) => {
                                if (blob) {
                                  const optimizedFile = new File([blob], file.name, { type: "image/jpeg" });

                                  // Native Barcode Detector check
                                  try {
                                    if ('BarcodeDetector' in window) {
                                      const detector = new (window as any).BarcodeDetector({
                                        formats: ['codabar', 'code_39', 'code_93', 'code_128', 'ean_8', 'ean_13', 'itf', 'pdf417', 'upc_a', 'upc_e']
                                      });
                                      const detected = await detector.detect(img);
                                      if (detected && detected.length > 0) {
                                        const code = detected[0].rawValue;
                                        handleScanSuccess(code);
                                        return;
                                      }
                                    }
                                  } catch (detectErr) {
                                    console.warn("Native BarcodeDetector fail:", detectErr);
                                  }

                                  // Fallback to html5QrCode scanFile
                                  try {
                                    const html5QrCode = qrCodeRef.current || new (window as any).Html5Qrcode("reader");
                                    const decodedText = await html5QrCode.scanFile(optimizedFile, true);
                                    handleScanSuccess(decodedText, html5QrCode);
                                  } catch (err: any) {
                                    console.error(err);
                                    alert("Barcode/IMEI not detected. Please capture a clear, straight, close-up photo of the barcode.");
                                    setLastScannedMsg("");
                                  }
                                }
                              }, "image/jpeg", 0.85);
                            }
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW PRODUCT SCAN MODAL */}
      <Dialog open={showNewProductModal} onOpenChange={setShowNewProductModal}>
        <DialogContent className="p-6 border-0 max-w-[340px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl">
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <DialogTitle className="text-lg font-black tracking-tight">New Barcode Scanned!</DialogTitle>
              <DialogDescription className="text-zinc-500 font-bold text-xs">
                Enter details to add this product to your sale.
              </DialogDescription>
            </div>

            <div className="space-y-4">
              {/* Scanned Barcode Read-Only */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Scanned Barcode</Label>
                <div className="relative flex items-center">
                  <Input
                    readOnly
                    value={scannedBarcode}
                    className="h-10 rounded-xl font-mono font-bold text-xs bg-zinc-50 dark:bg-zinc-850 text-zinc-650 pr-10 border-0 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(scannedBarcode);
                      alert("Barcode copied to clipboard!");
                    }}
                    className="absolute right-2 h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Product Name</Label>
                {isApiLoading ? (
                  <div className="h-10 w-full flex items-center gap-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                    <Loader2 className="animate-spin text-orange-600" size={14} />
                    <span className="text-zinc-400 text-xs font-bold italic">Fetching name...</span>
                  </div>
                ) : (
                  <Input
                    placeholder="e.g. Good Day Biscuits"
                    value={newScannedName}
                    onChange={e => setNewScannedName(e.target.value)}
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Price (₹)</Label>
                  <Input
                    id="new-scanned-price-input"
                    type="number"
                    placeholder="e.g. 10"
                    value={newScannedPrice}
                    onChange={e => setNewScannedPrice(e.target.value)}
                    className="h-10 rounded-xl font-black text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Quantity</Label>
                  <Input
                    type="number"
                    value={newScannedQty}
                    onChange={e => setNewScannedQty(e.target.value)}
                    className="h-10 rounded-xl font-black text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={handleAddNewScannedProduct}
                className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-xs active:scale-95 transition-all"
              >
                ADD TO SALE
              </Button>
              <Button
                onClick={() => setShowNewProductModal(false)}
                variant="outline"
                className="h-12 rounded-xl font-black text-xs active:scale-95 transition-all"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT STOCK / IMEI MODAL */}
      <Dialog open={showEditStockModal} onOpenChange={setShowEditStockModal}>
        <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl rounded-[2rem] p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-950 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-0.5 text-left border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-indigo-600" />
              Edit Mobile Unit Stock ({editingItem?.name || "Product"})
            </DialogTitle>
            <DialogDescription className="text-[11px] text-zinc-500 font-medium">
              Update IMEI, Color, Purchase Rate, HSN Code, and Supplier Name for each unit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-3">
            {editingUnitDetails.length === 0 ? (
              <div className="text-center py-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-xs font-bold text-zinc-500">No unit rows present.</p>
                <Button
                  type="button"
                  onClick={() => setEditingUnitDetails([{ imei: "", color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" }])}
                  className="mt-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  + Add First Unit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {editingUnitDetails.map((unit, index) => (
                  <div key={index} className="p-3.5 sm:p-4 bg-zinc-50/90 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50 pb-2">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-[9px] font-black">
                          #{index + 1}
                        </span>
                        Unit Specifications
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const copied = { ...unit, imei: "" };
                            const next = [...editingUnitDetails];
                            next.splice(index + 1, 0, copied);
                            setEditingUnitDetails(next);
                          }}
                          className="h-7 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40"
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy Unit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUnitDetails(editingUnitDetails.filter((_, idx) => idx !== index))}
                          className="h-7 text-[10px] font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>

                    {/* COMPACT 2-ROW GRID */}
                    <div className="space-y-2">
                      {/* Row 1: IMEI (2 cols) + Color (1 col) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2 space-y-0.5 text-left">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            IMEI / Serial Number *
                          </Label>
                          <ImeiInput
                            placeholder="15-digit IMEI number"
                            value={unit.imei}
                            onChange={val => {
                              const updated = [...editingUnitDetails];
                              updated[index].imei = val;
                              setEditingUnitDetails(updated);
                            }}
                            className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                          />
                        </div>

                        <div className="space-y-0.5 text-left">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            Color
                          </Label>
                          <Input
                            placeholder="e.g. Black / Blue"
                            value={unit.color}
                            onChange={e => {
                              const updated = [...editingUnitDetails];
                              updated[index].color = e.target.value;
                              setEditingUnitDetails(updated);
                            }}
                            className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                          />
                        </div>
                      </div>

                      {/* Row 2: Purchase Rate + HSN Code + Supplier Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-0.5 text-left">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            Purchase Rate (₹)
                          </Label>
                          <Input
                            type="number"
                            placeholder="e.g. 15000"
                            value={unit.purchaseRate}
                            onChange={e => {
                              const updated = [...editingUnitDetails];
                              updated[index].purchaseRate = e.target.value;
                              setEditingUnitDetails(updated);
                            }}
                            className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                          />
                        </div>

                        <div className="space-y-0.5 text-left">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            HSN Code
                          </Label>
                          <Input
                            placeholder="8517"
                            value={unit.hsnCode}
                            onChange={e => {
                              const updated = [...editingUnitDetails];
                              updated[index].hsnCode = e.target.value;
                              setEditingUnitDetails(updated);
                            }}
                            className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                          />
                        </div>

                        <div className="space-y-0.5 text-left">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            Supplier Name
                          </Label>
                          <Input
                            placeholder="e.g. Ramesh Telecom"
                            value={unit.supplierName}
                            onChange={e => {
                              const updated = [...editingUnitDetails];
                              updated[index].supplierName = e.target.value;
                              setEditingUnitDetails(updated);
                            }}
                            className="h-9.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border-zinc-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                onClick={() => setEditingUnitDetails([...editingUnitDetails, { imei: "", color: "", purchaseRate: "", hsnCode: "8517", supplierName: "" }])}
                className="w-full sm:w-auto h-10 px-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-extrabold text-xs rounded-xl border border-indigo-200 dark:border-indigo-900/40"
              >
                + Add Another Unit
              </Button>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    setShowEditStockModal(false);
                    setEditingItem(null);
                  }}
                  variant="outline"
                  className="flex-1 sm:flex-none h-10 px-5 rounded-xl font-black text-xs"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleSaveEditStock}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none h-10 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  SAVE STOCK ({editingUnitDetails.length})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT BILL MODAL */}
      <Dialog open={showEditSaleModal} onOpenChange={setShowEditSaleModal}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-[2rem] p-5 sm:p-7 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-950 shadow-2xl">
          <DialogHeader className="space-y-1 text-left border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Edit Bill & Transaction Details
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 font-medium">
              Update customer details, items, payment mode, or total price for this invoice.
            </DialogDescription>
          </DialogHeader>

          {editingSale && (
            <div className="space-y-4 my-4">
              {/* Customer Name */}
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Customer Name *
                </Label>
                <Input
                  value={editingSale.name}
                  onChange={e => setEditingSale({ ...editingSale, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="h-11 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 px-3.5"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Mobile Number (WhatsApp)
                </Label>
                <Input
                  value={editingSale.mobile}
                  onChange={e => setEditingSale({ ...editingSale, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="h-11 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 px-3.5"
                />
              </div>

              {/* Order Items / Details */}
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Order Details / Items
                </Label>
                <Input
                  value={editingSale.item}
                  onChange={e => setEditingSale({ ...editingSale, item: e.target.value })}
                  placeholder="e.g. iPhone 15 128GB (Black)"
                  className="h-11 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 px-3.5"
                />
              </div>

              {/* Amount & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Total Amount (₹) *
                  </Label>
                  <Input
                    type="number"
                    value={editingSale.price}
                    onChange={e => setEditingSale({ ...editingSale, price: e.target.value })}
                    placeholder="0"
                    className="h-11 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 px-3.5"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Discount / Commission (₹)
                  </Label>
                  <Input
                    type="number"
                    value={editingSale.discount}
                    onChange={e => setEditingSale({ ...editingSale, discount: e.target.value })}
                    placeholder="0"
                    className="h-11 rounded-xl bg-white dark:bg-zinc-900 text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 px-3.5"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Payment Mode / Type
                </Label>
                <select
                  value={editingSale.type}
                  onChange={e => setEditingSale({ ...editingSale, type: e.target.value })}
                  className="w-full h-11 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 font-bold text-xs px-3.5 text-zinc-900 dark:text-white"
                >
                  <option value="Cash">Cash Payment</option>
                  <option value="Online">Online / UPI</option>
                  <option value="Credit Card">Credit Card / Card EMI</option>
                  <option value="Card">Card / POS Machine</option>
                  <option value="Udhaar">Udhaar (Credit)</option>
                  <option value="Finance">Finance / EMI</option>
                  <option value="Split">Split Payment</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => {
                    setShowEditSaleModal(false);
                    setEditingSale(null);
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSale}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Update & Save Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SMART MENU SCANNER MODAL */}
      {showScanMenuModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end justify-center p-0" onClick={(e) => { if (e.target === e.currentTarget) { setShowScanMenuModal(false); } }}>
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] w-full max-w-lg p-8 pb-12 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tighter">Smart Menu Scanner</h3>
                <p className="text-xs font-bold text-zinc-400 mt-1">Menu card ki photo se AI items detect karega</p>
              </div>
              <button onClick={() => setShowScanMenuModal(false)} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            {scanMenuStep === 'capture' && (
              <div className="space-y-5">
                {!scanMenuImage ? (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-violet-300 dark:border-violet-800 rounded-3xl p-10 text-center space-y-4 hover:border-violet-500 transition-colors bg-violet-50 dark:bg-violet-950/20">
                      <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto">
                        <Camera className="h-10 w-10 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-base font-black text-zinc-800 dark:text-zinc-200">Menu Card Upload Karein</p>
                        <p className="text-[11px] font-bold text-zinc-400 mt-1">Camera se photo lein ya gallery se choose karein</p>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-2xl font-black text-sm">
                        <Camera className="h-4 w-4" /> Photo Lein / Upload
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setScanMenuImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img src={scanMenuImage} alt="Menu card" className="w-full rounded-2xl object-cover max-h-64" />
                      <button
                        onClick={() => setScanMenuImage(null)}
                        className="absolute top-3 right-3 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                    <button
                      onClick={handleScanMenu}
                      disabled={scanMenuLoading}
                      className="w-full h-16 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black rounded-2xl text-base shadow-xl shadow-violet-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {scanMenuLoading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> AI Scan Ho Raha Hai...</>
                      ) : (
                        <><Camera className="h-5 w-5" /> AI Se Scan Karein ✨</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {scanMenuStep === 'review' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-zinc-700 dark:text-zinc-300">{scanMenuResults.filter(i => i.selected).length} items select hain</p>
                  <button
                    onClick={() => setScanMenuResults(prev => prev.map(i => ({ ...i, selected: !prev.every(x => x.selected) })))}
                    className="text-[10px] font-black text-violet-600 uppercase tracking-widest"
                  >
                    Toggle All
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {scanMenuResults.map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${item.selected ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
                      onClick={() => setScanMenuResults(prev => prev.map((x, i) => i === idx ? { ...x, selected: !x.selected } : x))}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${item.selected ? 'bg-violet-600 border-violet-600' : 'border-zinc-300'}`}>
                        {item.selected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{item.name}</p>
                      </div>
                      <input
                        type="number"
                        value={item.price}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setScanMenuResults(prev => prev.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))}
                        className="w-20 text-right font-black text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
                        placeholder="₹0"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setScanMenuStep('capture'); setScanMenuImage(null); }}
                    className="flex-1 h-14 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-sm text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all"
                  >
                    Wapas Jao
                  </button>
                  <button
                    onClick={handleAddScannedItems}
                    disabled={isLoading || scanMenuResults.filter(i => i.selected).length === 0}
                    className="flex-1 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-violet-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Add to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREMIUM UPGRADE DIALOG */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="p-8 border-0 max-w-[340px] bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse" />

          <div className="text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
              <Lock className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight text-center uppercase">Premium Feature</DialogTitle>
              <DialogDescription className="text-zinc-400 font-bold text-xs leading-relaxed text-center">
                Upgrade to the Smart Business Plan to unlock this feature and supercharge your business!
              </DialogDescription>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-center border-b border-white/5 pb-2">Smart Business Plan Features</p>
              <div className="space-y-2">
                {[
                  "Unlimited Bills (No daily 40-bill limit)",
                  "Automatic Rent Ledger & Daily Target Tracker",
                  "High-Speed Barcode Checkout Scanner",
                  "AI Rate Card / Menu Scanner",
                  "Premium Eye-Care Night/Dark Theme",
                  "Unlimited CRM Customer Outreach",
                  "Remove Watermarks from Receipts"
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#00c875] shrink-0 mt-0.5" />
                    <span className="text-[10px] font-bold text-zinc-300 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent(`Hi Admin, I want to upgrade to the Paid Plan for: ${restaurantName} (${ownerMobile}). Please activate my account.`)}`, "_blank")}
                className="w-full h-14 bg-[#00c875] hover:bg-[#00b067] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <MessageCircle className="h-5 w-5" /> UPGRADE NOW
              </Button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors py-1 block w-full text-center"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SYSTEM MAINTENANCE OVERLAY */}
      {isMaintenanceActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#09090b', color: '#ffffff', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '24px', padding: '40px 24px', maxWidth: '360px', width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px', background: '#f97316',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff'
            }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>SYSTEM MAINTENANCE</h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 700, lineHeight: '1.6' }}>
              {maintenanceText}
            </p>
          </div>
        </div>
      )}

      {/* FORCE UPDATE OVERLAY */}
      {isUpdateRequired && !isMaintenanceActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.95)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '32px', padding: '40px 24px', maxWidth: '340px', width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #e4e4e7'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px', background: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff'
            }}>
              <Smartphone size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#09090b', letterSpacing: '-0.5px', marginBottom: '8px' }}>UPDATE REQUIRED</h2>
              <p style={{ fontSize: '12px', color: '#71717a', fontWeight: 700, lineHeight: '1.5' }}>
                A critical update is available. Please update the app to continue.
              </p>
            </div>
            <button
              onClick={() => window.open(updateStoreUrl, "_blank")}
              style={{
                width: '100%', height: '56px', background: '#3b82f6', color: '#ffffff',
                border: '0', borderRadius: '18px', fontWeight: 900, fontSize: '13px',
                letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)', transition: 'all 0.3s'
              }}
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS CHEAT SHEET MODAL (WEB ONLY) */}
      <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
        <DialogContent className="p-6 border-0 max-w-[480px] bg-zinc-950 text-white rounded-3xl shadow-2xl relative overflow-hidden border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 text-orange-500">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  POS Keyboard Shortcuts
                </DialogTitle>
                <DialogDescription className="text-zinc-400 font-bold text-[11px]">
                  Bill 10x faster on Desktop Counters
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 text-xs py-2">
            {/* Section 1: Billing & Payment */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest px-1">⚡ Sales & Billing Shortcuts</p>
              <div className="bg-zinc-900/80 rounded-2xl p-3 space-y-2.5 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Quick Pay Cash & Print</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-orange-400">F2</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-orange-400">Ctrl + Enter</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Quick Pay Online (UPI/QR) & Print</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-blue-400">F3</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-blue-400">Shift + Enter</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Select Udhaar Khata Mode</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-red-400 font-mono text-[11px] font-black">F7</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Custom Entry / Nayi Entry Popup</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-mono text-[11px] font-black">F5</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Start Fresh Bill (Reset Cart)</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-amber-400 font-mono text-[11px] font-black">Shift + N</kbd>
                </div>
              </div>
            </div>

            {/* Section 2: Search & Field Focus */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">🔍 Search & Focus Shortcuts</p>
              <div className="bg-zinc-900/80 rounded-2xl p-3 space-y-2.5 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Focus Item Search Bar</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-mono text-[11px] font-black">F8</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Focus Customer Mobile Input</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-mono text-[11px] font-black">F9</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Focus Discount (₹) Field</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-mono text-[11px] font-black">F10</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Toggle GST Tax ON/OFF</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-mono text-[11px] font-black">Shift + G</kbd>
                </div>
              </div>
            </div>

            {/* Section 3: Navigation & Control */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">🚀 Screen Navigation & Controls</p>
              <div className="bg-zinc-900/80 rounded-2xl p-3 space-y-2.5 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Billing Counter / Sales</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">Alt + 1</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">F4</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Menu / Inventory</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400 font-mono text-[11px] font-black">Alt + 2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Udhaar Khata Ledger</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">Alt + 3</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">F6</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Expenses / Rent / Kharcha</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">Alt + 4</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">F11</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Smart CRM / Stats / Reports</span>
                  <div className="flex gap-1.5 font-mono text-[11px] font-black">
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">Alt + 5</kbd>
                    <span className="text-zinc-500">or</span>
                    <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400">F12</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Settings & More Menu</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-purple-400 font-mono text-[11px] font-black">Alt + 6</kbd>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                  <span className="font-bold text-zinc-300">Close Popups / Reset Search</span>
                  <kbd className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg text-zinc-400 font-mono text-[11px] font-black">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-500">
            <span>Press Esc to close</span>
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-colors"
            >
              Got it!
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🛑 ACCOUNT SUSPENDED LOCKOUT OVERLAY */}
      {isAccountSuspended && (
        <div className="fixed inset-0 z-[99999] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-white">
            <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/40 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/30">
                Account Suspended
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Access Locked by Admin</h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Your store account has been temporarily freezed by InstaMunim Admin due to verification or security compliance.
              </p>
            </div>

            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 text-left text-xs text-zinc-300 space-y-1">
              <p className="font-bold text-white">Need help resolving this?</p>
              <p className="text-zinc-400 text-[11px]">Contact official support to unfreeze your account instantly.</p>
            </div>

            <a
              href="https://wa.me/919876543210?text=Hi%20InstaMunim%20Admin,%20my%20store%20account%20has%20been%20suspended.%20Please%20verify%20and%20unfreeze."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-6 rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Admin Support</span>
            </a>
          </div>
        </div>
      )}

      {/* 📢 TARGETED POP-UP BANNER ANNOUNCEMENT MODAL */}
      {showTargetedBroadcastModal && targetedBroadcastData && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <button
              onClick={() => setShowTargetedBroadcastModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {targetedBroadcastData.image && (
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700/50">
                <img src={targetedBroadcastData.image} alt="Announcement" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{targetedBroadcastData.title}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{targetedBroadcastData.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTargetedBroadcastModal(false)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 rounded-2xl font-bold text-xs transition-colors"
              >
                Close
              </button>
              {targetedBroadcastData.ctaLink && (
                <a
                  href={targetedBroadcastData.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-2xl font-black text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span>{targetedBroadcastData.ctaText || "Check Now"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔒 FEATURE LOCK WARNING MODAL */}
      {showFeatureLockModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                Disabled by Admin
              </span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">{showFeatureLockModal} Disabled</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                This menu feature is disabled from Admin Control for your store. Please request Admin to activate this module.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowFeatureLockModal(null)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 py-3 rounded-2xl font-bold text-xs transition-colors"
              >
                Close
              </button>
              <a
                href={`https://wa.me/91${ownerMobile || '7838229178'}?text=${encodeURIComponent(`Hi Admin, please enable ${showFeatureLockModal} access for my store.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-2xl font-black text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <span>Request Access</span>
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SHORTCUTS LAUNCHER BUTTON */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-zinc-900/90 dark:bg-zinc-100/90 hover:bg-orange-600 dark:hover:bg-orange-500 text-white dark:text-zinc-900 hover:text-white px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-black tracking-wider transition-all duration-300 group border border-zinc-700/50 dark:border-zinc-300/50 cursor-pointer active:scale-95"
        title="Press F1 for POS Keyboard Shortcuts"
      >
        <Keyboard className="h-4 w-4 text-orange-400 dark:text-orange-600 group-hover:text-white transition-colors" />
        <span>Shortcuts <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono ml-0.5">F1</span></span>
      </button>
    </div>
  );
}
