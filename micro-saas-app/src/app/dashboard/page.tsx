"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format, isBefore, isAfter } from "date-fns";
import { 
  LayoutDashboard, FileText, Settings, LogOut, Search,
  PlusCircle, Loader2, Book, Trash2, Send, ShoppingCart, Package,
  TrendingUp, Users, Smartphone, PieChart, ArrowUpRight, CheckCircle2, Mic, MessageCircle, ArrowRight, Sun, Moon, Cloud, RefreshCw, Lock, ShieldCheck, ShieldAlert, Eye, EyeOff, LayoutPanelLeft, Clock, History, CreditCard, ChevronRight, Download, Upload, Filter, Share2, Printer, X, ChevronDown, Plus, Minus, Check, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";

const getDisplayCategory = (cat: string) => {
  if (!cat) return "General";
  if (cat.includes("|Barcode:")) {
    return cat.split("|Barcode:")[0] || "General";
  }
  if (cat.startsWith("Barcode:")) return "General";
  return cat;
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
import InventoryDiary from "./InventoryDiary";

export default function Dashboard() {
  const [extraChargeName, setExtraChargeName] = useState("");
  const [extraChargeAmount, setExtraChargeAmount] = useState("");

  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupStoreName, setSignupStoreName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("admin");
  const [loginError, setLoginError] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [lang, setLang] = useState<'hi'|'en'>('en');
  const [lastSyncedTime, setLastSyncedTime] = useState(format(new Date(), "hh:mm:ss aa"));
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiInsightText, setAiInsightText] = useState("");

  const t = (key: string) => {
    const map: Record<string, string> = {
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
      "Smart CRM": "स्मार्ट CRM"
    };
    return lang === 'hi' && map[key] ? map[key] : key;
  };

  const [settingsActiveSection, setSettingsActiveSection] = useState("Identity");
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Main Course");
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newType, setNewType] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
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
  const [crmMessage, setCrmMessage] = useState("Hi [NAME], we miss you at [SHOP]! 🍕 Come back today for a special offer just for you!");
  const [cart, setCart] = useState<any[]>([]);
  // Barcode Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannerError, setScannerError] = useState("");
  const [scannerDebugInfo, setScannerDebugInfo] = useState("Initializing...");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newScannedName, setNewScannedName] = useState("");
  const [newScannedPrice, setNewScannedPrice] = useState("");
  const [newScannedQty, setNewScannedQty] = useState("1");
  const [restaurantName, setRestaurantName] = useState("InstaMunim");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeAddress, setStoreAddress] = useState("Premium Plaza, Main Road, New Delhi");
  const [storePhone, setStorePhone] = useState("+91 9999 888 777");
  const [storeWebsite, setStoreWebsite] = useState("www.khankitchen.com");
  const [storeGstin, setStoreGstin] = useState("07AABCU1234F1Z5");
  const [isThermalPrinterEnabled, setIsThermalPrinterEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storeCreatedAt, setStoreCreatedAt] = useState<string | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "error">("synced");
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
  const [isListening, setIsListening] = useState(false);
  const [voicePhase, setVoicePhase] = useState<'items' | 'name' | 'mobile'>('items');
  const [voiceInstruction, setVoiceInstruction] = useState("Bolna shuru kijiye...");
  const [voiceStatus, setVoiceStatus] = useState<"Idle" | "Connecting" | "Listening" | "Error">("Idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastMatch, setLastMatch] = useState("");
  const [voiceHistory, setVoiceHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const lastAddedRef = useRef<{name: string, time: number}>({name: "", time: 0});
  const mobileDigitsRef = useRef<string>("");

  // SMART TRANSLITERATION (Hindi Script to English Font)
  const transliterate = (text: string) => {
    const map: any = {
      'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ए':'e','ऐ':'ai','ओ':'o','औ':'au','अं':'an','अः':'ah',
      'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n',
      'त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h',
      'ा':'a','ि':'i','ी':'ee','ु':'u','ू':'oo','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ः':'h','्':'','़':''
    };
    return text.split('').map(char => map[char] || char).join('').toUpperCase();
  };
  
  const qrCodeRef = useRef<any>(null);
  const lastScannedRef = useRef<{ barcode: string; time: number } | null>(null);
  const [lastScannedMsg, setLastScannedMsg] = useState("");

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
    } catch (e) {
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

      const startWithConstraints = (constraints: any) => {
        return html5QrCode.start(
          constraints,
          {
            fps: 20,
            qrbox: (width: number, height: number) => {
              return { width: Math.min(width * 0.85, 290), height: 140 };
            },
            formatsToSupport: formats,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          successCallback,
          () => {}
        );
      };

      // Try HD constraints first
      startWithConstraints({
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 }
      })
      .then(() => {
        try {
          const inputState = (html5QrCode as any).html5QrcodeInput;
          const track = inputState?.localMediaStream?.getVideoTracks()?.[0];
          if (track) {
            const settings = track.getSettings ? track.getSettings() : {};
            setScannerDebugInfo(`Active (HD): ${settings.width || 0}x${settings.height || 0} px`);
          } else {
            setScannerDebugInfo("Camera active. Align barcode.");
          }
        } catch (e) {
          setScannerDebugInfo("Camera active. Align barcode.");
        }

        try {
          html5QrCode.applyVideoConstraints({
            focusMode: "continuous"
          } as any).catch((e: any) => console.log("autofocus not supported:", e));
        } catch (e) {
          console.log("Error applying focus constraints:", e);
        }
      })
      .catch((err: any) => {
        console.warn("HD constraints failed, falling back to SD:", err);
        startWithConstraints({ facingMode: "environment" })
        .then(() => {
          try {
            const inputState = (html5QrCode as any).html5QrcodeInput;
            const track = inputState?.localMediaStream?.getVideoTracks()?.[0];
            if (track) {
              const settings = track.getSettings ? track.getSettings() : {};
              setScannerDebugInfo(`Active (SD): ${settings.width || 0}x${settings.height || 0} px`);
            } else {
              setScannerDebugInfo("Camera active. Align barcode.");
            }
          } catch (e) {
            setScannerDebugInfo("Camera active. Align barcode.");
          }

          try {
            html5QrCode.applyVideoConstraints({
              focusMode: "continuous"
            } as any).catch((e: any) => console.log("autofocus not supported:", e));
          } catch (e) {
            console.log("Error applying focus constraints:", e);
          }
        })
        .catch((fallbackErr: any) => {
          console.error("Scanner start completely failed:", fallbackErr);
          setScannerError(`Camera error: ${fallbackErr.message || fallbackErr}`);
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
      } catch (e) {
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

  const handleScanSuccess = async (barcode: string, html5QrCodeInstance?: any) => {
    playBeep();
    setScannedBarcode(barcode);
    
    const matchedItem = menuItems.find(item => {
      const itemBarcode = getBarcode(item.category);
      return itemBarcode === barcode;
    });

    const scanner = html5QrCodeInstance || qrCodeRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    qrCodeRef.current = null;
    setShowScanner(false);

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
      } catch (err) {
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
        isNewProduct: false,
        barcode: scannedBarcode
      }];
    });

    try {
      const { data: newDbItem, error: dbErr } = await supabase
        .from("menu_items")
        .insert([{
          store_id: store.id,
          name: newScannedName.trim(),
          price: priceVal,
          category: `General|Barcode:${scannedBarcode}`
        }])
        .select()
        .single();

      if (!dbErr && newDbItem) {
        setMenuItems(prev => [...prev, {
          id: newDbItem.id,
          name: newDbItem.name,
          price: newDbItem.price,
          category: newDbItem.category
        }]);
      }
    } catch (err) {
      console.error("Error saving new barcode product immediately:", err);
    }

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
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', () => {
          if (activeTab !== "Dashboard") {
            setActiveTab("Dashboard");
          } else if (isSaleOpen) {
            setIsSaleOpen(false);
          }
        });
      } catch (e) {
        console.log("Not running in Capacitor, back button listener skipped.");
      }
    };

    initBackListener();
    return () => {
      if (backListener) backListener.remove();
    };
  }, [activeTab, isSaleOpen]);

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

          for(let i=0; i<qty; i++) addToCart(item);
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
      recognition.onend = () => { if (isListening) try { recognition.start(); } catch(e) {} };
    }

    if (isListening) {
      if ((window as any).NativeSpeech) {
        setVoiceStatus("Listening");
        (window as any).NativeSpeech.startListening();
      } else if (recognition) {
        try { recognition.start(); } catch (e) {}
      }
    }

    return () => {
      if (recognition) try { recognition.stop(); } catch (e) {}
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

  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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
          const savedAddress = localStorage.getItem("saas_store_address");
          const savedPhone = localStorage.getItem("saas_store_phone");
          const savedWebsite = localStorage.getItem("saas_store_website");
          const savedGstin = localStorage.getItem("saas_store_gstin");
          const savedRent = localStorage.getItem("saas_store_rent");

          if (savedName) setRestaurantName(savedName);
          if (savedLogo) setStoreLogo(savedLogo);
          if (savedAddress) setStoreAddress(savedAddress);
          if (savedPhone) setStorePhone(savedPhone);
          if (savedWebsite) setStoreWebsite(savedWebsite);
          if (savedGstin) setStoreGstin(savedGstin);
          if (savedRent) setMonthlyRent(Number(savedRent));
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
    if (savedIsLoggedIn === "true") {
      setIsLoggedIn(true);
      if (savedOwnerMobile) {
        setOwnerMobile(savedOwnerMobile);
        
        // Restore local settings immediately for UX
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
        // Auto-fetch from cloud for existing sessions
        const autoSync = async () => {
          const { data } = await supabase.from('stores').select('*').eq('owner_mobile', savedOwnerMobile).single();
          if (data) {
            setRestaurantName(data.store_name);
            setMonthlyRent(data.monthly_rent || 0);
            setStoreCreatedAt(data.created_at);
            setSubscriptionExpiry(data.subscription_expiry);
            localStorage.setItem("saas_store_created_at", data.created_at || "");
            localStorage.setItem("saas_store_expiry", data.subscription_expiry || "");
            await fetchStoreData(data.id);
          }
        };
        autoSync();
      }
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
      } catch (e) { console.error(e); } 
    }
    
    const savedExpenses = localStorage.getItem("saas_expenses");
    if (savedExpenses) { try { setExpenses(JSON.parse(savedExpenses).map((e: any) => ({ ...e, date: new Date(e.date) }))); } catch (e) { console.error(e); } }

    const savedMenu = localStorage.getItem("saas_menu");
    if (savedMenu) { try { setMenuItems(JSON.parse(savedMenu)); } catch (e) { console.error(e); } }

    const savedRestName = localStorage.getItem("saas_rest_name");
    if (savedRestName) setRestaurantName(savedRestName);

    const savedRent = localStorage.getItem("saas_rent");
    if (savedRent) setMonthlyRent(Number(savedRent));

    const savedDarkMode = localStorage.getItem("saas_dark_mode");
    if (savedDarkMode) setIsDarkMode(savedDarkMode === "true");

    setDataLoaded(true);

    return () => window.removeEventListener("popstate", handleBackButton);
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (dataLoaded && mounted) {
      localStorage.setItem("saas_sales", JSON.stringify(sales));
      localStorage.setItem("saas_expenses", JSON.stringify(expenses));
      localStorage.setItem("saas_menu", JSON.stringify(menuItems));
      localStorage.setItem("saas_rest_name", restaurantName);
      localStorage.setItem("saas_rent", monthlyRent.toString());
      localStorage.setItem("saas_dark_mode", isDarkMode.toString());
      localStorage.setItem("saas_thermal_printer", isThermalPrinterEnabled.toString());
      if (storeCreatedAt) localStorage.setItem("saas_store_created_at", storeCreatedAt);
      if (subscriptionExpiry) localStorage.setItem("saas_store_expiry", subscriptionExpiry);
    }
  }, [sales, expenses, menuItems, restaurantName, monthlyRent, isDarkMode, dataLoaded, mounted]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");
    
    try {
      if (authMode === "login") {
        const { data, error } = await supabase
          .rpc('verify_store_login', { 
            mobile: loginMobile, 
            input_pass: loginPassword 
          });

        if (error || !data || data.length === 0) {
          setLoginError("Invalid mobile number or password.");
        } else {
          const storeData = data[0];
          // Success Login
          setIsLoggedIn(true);
          setOwnerMobile(loginMobile);
          setRestaurantName(storeData.store_name);
          setMonthlyRent(storeData.monthly_rent || 0);
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);

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
        }
      } else {
        // Signup
        const { data, error } = await supabase
          .from('stores')
          .insert([{ 
            owner_mobile: loginMobile, 
            store_name: signupStoreName, 
            password: loginPassword 
          }])
          .select()
          .single();

        if (error) {
          setLoginError("Mobile already registered or error occurred.");
        } else {
          setIsLoggedIn(true);
          setOwnerMobile(loginMobile);
          setRestaurantName(signupStoreName);
          setStoreCreatedAt(data.created_at);
          setSubscriptionExpiry(data.subscription_expiry);
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);
          localStorage.setItem("saas_store_created_at", data.created_at || "");
          localStorage.setItem("saas_store_expiry", data.subscription_expiry || "");

          await fetchStoreData(data.id);
        }
      }
    } catch (err) {
      setLoginError("Connection failed. Check internet.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreData = async (storeId: string) => {
    setIsSyncing(true);
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
        
        const cloudLogo = storeInfo.logo || storeInfo.store_logo || storeInfo.image;
        if (cloudLogo) {
          setStoreLogo(cloudLogo);
          localStorage.setItem("saas_store_logo", cloudLogo);
        } else {
          const localLogo = localStorage.getItem("saas_store_logo");
          if (localLogo) setStoreLogo(localLogo);
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
      
      setSyncStatus("synced");
    } catch (err) {
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllData = async () => {
    setIsSyncing(true);
    try {
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (store) {
        await fetchStoreData(store.id);
        setLastSyncedTime(format(new Date(), "hh:mm:ss aa"));
      }
    } catch (e) {
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
        insight = "Business badhiya chal raha hai! Naye products add karke menu ko fresh rakhiye. ✨";
      }
      setAiInsightText(insight);
    }, 600);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("saas_is_logged_in");
    setActiveTab("Dashboard");
    
    if (!rememberMe) {
      setLoginMobile("");
      setLoginPassword("");
      localStorage.removeItem("saas_rem_mobile");
      localStorage.removeItem("saas_rem_pass");
    }
  };

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);

  const handleSale = async () => {
    if (cart.length === 0) return alert("Cart is empty.");
    if (!newMobile || newMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoading(true);
    
    try {
      // Get Store ID
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (!store) throw new Error("Store ID not found");

      const cartDescription = cart.map(c => `${c.qty} x ${c.name} (₹${c.price * c.qty})`).join("\n");
      const cartTotalBase = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const extraAmt = Number(extraChargeAmount) || 0;
      const cartTotal = cartTotalBase + extraAmt;
      
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

      const { data: newSale, error } = await supabase
        .from('sales')
        .insert([{
          store_id: store.id,
          customer_name: newName || "Guest",
          mobile: newMobile,
          items: itemsWithMetadata,
          total_price: cartTotal,
          payment_type: newType
        }])
        .select()
        .single();

      if (error) throw error;

      // Save new products to menu_items in background
      try {
        const newProducts = cart.filter(c => c.isNewProduct);
        if (newProducts.length > 0) {
          const inserts = newProducts.map(item => ({
            store_id: store.id,
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
      setIsSaleOpen(false);
      setShowSuccessDialog(true);
      setCart([]); 
      setNewName(""); 
      setNewMobile("");
      setExtraChargeName("");
      setExtraChargeAmount("");
    } catch (err: any) {
      alert("Cloud Sync Error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const sendWhatsAppReceipt = () => {
    if (!lastOrderDetails || lastOrderDetails.mobile === "N/A") return alert("No mobile number provided.");
    
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

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const invoiceUrl = `${baseUrl}/invoice?n=${encodeURIComponent(restaurantName)}&i=${encodeURIComponent(itemsParam)}&p=${lastOrderDetails.price}&d=${encodeURIComponent(lastOrderDetails.date.toISOString())}&t=${lastOrderDetails.type}&id=${lastOrderDetails.id}&m=${lastOrderDetails.mobile}&cn=${encodeURIComponent(lastOrderDetails.name)}&a=${encodeURIComponent(storeAddress)}&ph=${encodeURIComponent(storePhone)}&w=${encodeURIComponent(storeWebsite)}&g=${encodeURIComponent(storeGstin)}&o=${ownerMobile}${extraPart}`;

    let displayItems = (lastOrderDetails.item || "").split("[COMM:")[0].trim();
    if (extraMatch) {
      displayItems = displayItems.split("[EXTRA:")[0].trim();
      displayItems += `\n${extraMatch[1]}: ₹${extraMatch[2]}`;
    }

    const msg = whatsappInvoiceTemplate
      .replace("[NAME]", lastOrderDetails.name)
      .replace("[SHOP]", restaurantName)
      .replace("[ITEMS]", displayItems)
      .replace("[TOTAL]", lastOrderDetails.price.toString())
      .replace("[LINK]", invoiceUrl);
      
    window.open(`https://wa.me/91${lastOrderDetails.mobile}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.name === item.name);
      if (existing) return prev.map(c => c.name === item.name ? {...c, qty: c.qty + 1} : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart(prev => {
      const item = prev.find(c => c.name === name);
      if (item && item.qty > 1) return prev.map(c => c.name === name ? {...c, qty: c.qty - 1} : c);
      return prev.filter(c => c.name !== name);
    });
  };

  const filteredSales = useMemo(() => sales.filter(s => format(new Date(s.date), "yyyy-MM") === selectedMonth), [sales, selectedMonth]);
  const filteredExpenses = useMemo(() => expenses.filter(e => format(new Date(e.date), "yyyy-MM") === selectedMonth), [expenses, selectedMonth]);
  
  const totalSales = useMemo(() => filteredSales.reduce((sum, s) => sum + s.price, 0), [filteredSales]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  
  const totalCommissions = useMemo(() => filteredSales.reduce((sum, s) => sum + (s.commission || 0), 0), [filteredSales]);

  const totalUdhaar = useMemo(() => filteredSales.filter(s => s.type === "Udhaar" && s.status !== "Paid").reduce((sum, s) => sum + s.price, 0), [filteredSales]);

  const netProfit = useMemo(() => totalSales - totalExpenses - totalCommissions, [totalSales, totalExpenses, totalCommissions]);

  const uniqueCustomers = useMemo(() => Array.from(new Set(sales.filter(s => s.mobile !== "N/A").map(s => s.mobile))), [sales]);

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

  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice) return;
    setIsLoading(true);
    try {
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (!store) throw new Error("Store ID not found");

      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert([{ store_id: store.id, name: newItemName, price: Number(newItemPrice), category: newItemCategory }])
        .select()
        .single();

      if (error) throw error;
      setMenuItems([...menuItems, { id: newItem.id, name: newItem.name, price: newItem.price, category: newItem.category }]);
      setNewItemName(""); setNewItemPrice("");
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
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (!store) throw new Error("Store ID not found");

      const { data: newExp, error } = await supabase
        .from('expenses')
        .insert([{ store_id: store.id, title: newExpTitle, amount: Number(newExpAmount) }])
        .select()
        .single();

      if (error) throw error;
      setExpenses([{ id: newExp.id, title: newExp.title, amount: newExp.amount, date: new Date(newExp.expense_date) }, ...expenses]);
      setNewExpTitle(""); setNewExpAmount("");
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
      setSales(sales.map(s => s.id === id ? { ...s, type: "Cash" } : s));
    } catch (err) {
      alert("Failed to update status on cloud.");
    }
  };

  const handleDeleteItem = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete item from cloud.");
    }
  };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 sm:p-10 selection:bg-orange-500/30 overflow-y-auto transition-colors duration-700 ${isDarkMode ? 'bg-[#000000]' : 'bg-[#f8f9fa]'}`}>
        <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 my-auto">
          <Card className={`border-0 rounded-2xl p-8 overflow-hidden transition-all duration-700 ${isDarkMode ? 'bg-transparent shadow-none border-none' : 'bg-white shadow-2xl shadow-zinc-200'}`}>
            <div className="flex flex-col items-center text-center mb-10">
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

            <div className="text-center mb-8">
               <h2 className={`text-xl font-black leading-none uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Owner Login</h2>
               <p className="text-zinc-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Welcome back to your POS Dashboard</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
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


              {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}

              <div className="flex justify-center pt-2">
                <Button type="submit" className={`w-full max-w-[260px] h-14 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest ${isDarkMode ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20' : 'bg-zinc-900 hover:bg-black text-white shadow-zinc-900/20'}`}>
                  {authMode === "login" ? "Access Dashboard" : "Start Business"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <button 
                type="button" 
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setLoginError(""); }} 
                className="w-full text-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] py-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {authMode === "login" ? "Don't have an account? Create one" : "Already registered? Login"}
              </button>
            </form>
          </Card>
          
          <p className="text-center text-[8px] font-bold text-zinc-300 uppercase tracking-widest">
            Secured by InstaMunim Cloud Gateway
          </p>
        </div>
      </div>
    );
  }

  // Subscription Logic
  const checkSubscription = () => {
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

  const isSubscribed = checkSubscription();

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-orange-500/30 ${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#fafafa] text-zinc-900'}`}>
      
      {!isSubscribed && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <Card className="w-full max-w-[400px] bg-zinc-900 border-zinc-800 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(249,115,22,0.2)] text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20">
              <Clock className="h-10 w-10 text-white animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Trial Expired</h2>
              <p className="text-zinc-400 font-bold text-xs leading-relaxed uppercase tracking-tighter">
                Your free trial is over.<br/>Please scan the QR code and pay to continue using the app.
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-inner group">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Scan to Pay via UPI</p>
              <div className="aspect-square w-full max-w-[200px] mx-auto bg-zinc-100 rounded-2xl flex items-center justify-center border-2 border-zinc-100 overflow-hidden">
                <img src="/pay-qr.png" alt="Payment QR" className="w-full h-full object-contain" />
              </div>
              <p className="mt-3 font-black text-zinc-900 text-sm">₹399 <span className="text-[10px] text-zinc-400 uppercase">/ Month</span></p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent(`Hi Zainul, I have paid ₹399 for InstaMunim. My Store: ${restaurantName} (${ownerMobile}). Please activate my account.`)}`, "_blank")}
                className="w-full h-14 bg-[#00c875] hover:bg-[#00b067] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <MessageCircle className="h-5 w-5" /> After Payment Click Here
              </Button>
              <button 
                onClick={() => handleLogout()}
                className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors py-2"
              >
                Logout Account
              </button>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 text-zinc-500">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Secured Payment Gateway</span>
              </div>
            </div>
          </Card>
        </div>
      )}
      <main className="flex-1 pb-24 overflow-y-auto">
        <div className="max-w-full px-2 sm:px-4 py-8">
          
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
                  <h4 className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Select Items</h4>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                      <Input placeholder="Search dishes..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="h-10 pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-0 font-bold placeholder:text-zinc-300 text-xs w-full" />
                    </div>
                    <button 
                      onClick={() => setShowScanner(true)} 
                      className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors active:scale-95 shadow-sm"
                      title="Scan Barcode"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {menuItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(item => (
                      <button key={item.id} onClick={() => addToCart(item)} className="p-1.5 bg-white dark:bg-zinc-900 rounded-xl text-left border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95 group">
                        <p className="font-bold text-[10px] text-zinc-900 dark:text-white lowercase leading-tight truncate">{item.name}</p>
                        <p className="text-[8px] font-bold text-zinc-400 mt-0.5">₹{item.price}</p>
                      </button>
                    ))}
                  </div>
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
                            <div key={c.name} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
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

                   <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Grand Total</p>
                        <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
                          ₹{cart.reduce((s,i) => s + (i.price*i.qty), 0) + (Number(extraChargeAmount) || 0)}
                        </h3>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Input placeholder="Customer Name" value={newName} onChange={e => setNewName(e.target.value)} className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 text-sm" />
                      <Input 
                        placeholder="Mobile Number" 
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
                              value={cashReceived} 
                              onChange={e => setCashReceived(e.target.value)} 
                              className="w-28 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-black text-sm text-center shadow-sm" 
                            />
                          </div>
                          <div className="h-[1px] bg-orange-200/50 dark:bg-orange-900/30 w-full" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">Return Change</span>
                            <span className="text-lg font-black text-emerald-600">
                              ₹{Math.max(0, Number(cashReceived) - (cart.reduce((s,i) => s + (i.price*i.qty), 0) + (Number(extraChargeAmount) || 0)))}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="relative w-40">
                        <select 
                          value={newType} 
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 appearance-none focus:ring-0 text-xs shadow-sm"
                        >
                          <option value="Cash">Cash Sale</option>
                          <option value="Online">Online/UPI</option>
                          <option value="Udhaar">Udhaar Khata</option>
                          <option value="Swiggy">Swiggy</option>
                          <option value="Zomato">Zomato</option>
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
              <header className="flex justify-between items-center py-2">
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
                <div className="flex items-center gap-2">
                  <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="h-7 px-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full font-bold text-[8px] flex items-center justify-center shadow-sm active:scale-90 transition-all">A/अ</button>
                  <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || "")}>
                    <SelectTrigger className="h-7 rounded-full bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm font-bold text-[8px] px-3 gap-1.5">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0 shadow-2xl font-bold">
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                        <SelectItem key={m} value={`2026-${m}`} className="rounded-xl">
                          {format(new Date(2026, parseInt(m)-1), "MMMM")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </header>

              {/* ACTION ROW COMPACT */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setIsSyncing(true);
                    const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
                    if (store) {
                      await fetchStoreData(store.id);
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
                  <p className="text-[7px] font-bold uppercase opacity-70 tracking-widest">{t("Net Profit")}</p>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tighter leading-none">₹{Math.round(netProfit)}</h3>
                    <p className="text-[6px] font-medium uppercase opacity-60 mt-1 tracking-tighter leading-none">{t("After Expenses")}</p>
                  </div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border-0 shadow-sm border-b-[3px] border-blue-500 h-32 flex flex-col justify-between">
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">{t("Gross Sales")}</p>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tighter leading-none">₹{totalSales}</h3>
                    <p className="text-[6px] font-bold">{t("Gross Income")}</p>
                  </div>
                </Card>

                <Card 
                  onClick={() => setActiveTab("Khata")} 
                  className="bg-[#fff1f1] dark:bg-red-950/20 p-4 rounded-[1.5rem] border-0 h-32 flex flex-col justify-between active:scale-95 transition-all cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <p className="text-[7px] font-bold text-red-600 uppercase tracking-widest">{t("Pending Udhaar")}</p>
                  <div>
                    <h3 className="text-2xl font-bold text-red-600 tracking-tighter leading-none">₹{totalUdhaar}</h3>
                    <p className="text-[6px] font-bold text-red-400 uppercase mt-1 flex items-center gap-1 leading-none"><Users className="h-2 w-2" /> {t("From Khata")}</p>
                  </div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border-0 shadow-sm border-b-[3px] border-purple-500 h-32 flex flex-col justify-between">
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">{t("Total Expense")}</p>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tighter leading-none">₹{Math.round(totalExpenses)}</h3>
                    <p className="text-[6px] font-bold text-zinc-400 uppercase mt-1 tracking-tighter leading-none">{t("Operational Costs")}</p>
                  </div>
                </Card>
              </div>

              {/* RECENT SALES SUPER COMPACT */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-lg font-bold tracking-tight">{t("Recent Sales")}</h3>
                  <button onClick={() => setActiveTab("Total Sale Report")} className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{t("View All")}</button>
                </div>
                <Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-sm divide-y dark:divide-zinc-800 overflow-hidden">
                  {filteredSales.slice(0, 3).map(s => (
                    <div key={s.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[13px] leading-tight">{s.name}</p>
                        <div className="text-[8px] font-medium text-zinc-400 flex items-center gap-1.5">
                          {format(new Date(s.date), "hh:mm aa")} • 
                          <span className={`px-1 rounded-sm font-bold ${s.type === 'Cash' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}>{s.type}</span>
                        </div>
                      </div>
                      <p className="text-base font-bold tracking-tight">
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
              <Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
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
                <p className="text-zinc-500 font-bold flex items-center gap-2 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Stay ahead of your shop costs.</p>
              </header>

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
            </div>
          )}

          {/* Old Marketing Tab Removed */}

          {activeTab === "Total Sale Report" && (
            <div className="max-w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-2 sm:px-4 pt-4">
              <header className="px-2">
                <h2 className="text-5xl font-bold tracking-tighter leading-none text-zinc-900 dark:text-white">Business<br/>Analytics</h2>
                <p className="text-sm font-bold text-zinc-400 mt-2 leading-relaxed">Comprehensive view of your store's performance.</p>
              </header>

              <Button 
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    alert("Printing not supported in this view. Try opening in a browser.");
                  }
                }} 
                className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-bold rounded-full text-sm shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" /> PRINT FULL REPORT
              </Button>

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

              {/* FULL TRANSACTION HISTORY - SCROLLABLE TABLE */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tighter px-2">Transaction History</h3>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800">
                        {filteredSales.length === 0 ? (
                          <tr><td colSpan={6} className="p-10 text-center text-zinc-300 font-bold italic">No transactions yet</td></tr>
                        ) : (
                          filteredSales.map(s => (
                            <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-2 px-4 font-bold text-[10px] text-zinc-400 whitespace-nowrap">{format(new Date(s.date), "dd MMM, hh:mm aa")}</td>
                              <td className="py-2 px-4 font-bold text-sm text-zinc-900 dark:text-white uppercase whitespace-nowrap">{s.name}</td>
                              <td className="py-2 px-4 font-bold text-sm text-zinc-500 whitespace-nowrap">{s.mobile}</td>
                              <td className="py-2 px-4 font-bold text-xs text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{s.item || "General Order"}</td>
                              <td className="py-2 px-4 text-center">
                                <Badge className={`text-[8px] font-bold px-2 py-0.5 rounded-lg border-0 ${s.type === 'Cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {s.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-lg tracking-tighter text-zinc-900 dark:text-white whitespace-nowrap">
                              ₹{s.price - (s.commission || 0)}
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
                            <td className="py-2 px-4 font-bold text-xs text-zinc-500 whitespace-nowrap">{s.item || "General Order"}</td>
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
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Quick Sample Texts</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "20% OFF", msg: `Hi [NAME], we miss you at ${restaurantName}! 🍕 Get 20% OFF on your next order today! Use code: MISSYOU20` },
                      { label: "BOGO Offer", msg: `Weekend Special at ${restaurantName}! 🥤 Buy 1 Get 1 FREE on all large orders! Valid only for today.` },
                      { label: "New Menu", msg: `Hi [NAME], check out our NEW items at ${restaurantName}! 😋 From spicy rolls to fresh shakes, try them now!` },
                      { label: "Free Delivery", msg: `Hungry [NAME]? 🚚 Free Delivery for you at ${restaurantName} for the next 2 hours! Order now.` },
                      { label: "Weekend", msg: `Happy Weekend [NAME]! 🎉 Relax and enjoy a meal from ${restaurantName}. We've got special treats waiting!` }
                    ].map(template => (
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

              {/* RETENTION LIST SECTION */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8">
                  <h3 className="text-3xl font-black text-white tracking-tighter">Retention List</h3>
                </div>

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
                      {[
                        { name: "salman khan", mobile: "7838229178", last: "1 days ago" },
                        { name: "Sumaira", mobile: "8130707236", last: "2 days ago" },
                        { name: "Anish Gupta", mobile: "9910293847", last: "5 days ago" }
                      ].map((cust, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-6 px-8">
                            <div className="font-black text-base text-zinc-900 dark:text-white tracking-tight">{cust.name}</div>
                            <div className="text-[11px] font-bold text-zinc-400 tracking-tight">{cust.mobile}</div>
                          </td>
                          <td className="py-6 px-8">
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-3xl max-w-[280px] border border-zinc-100 dark:border-zinc-700">
                              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                                "Hi {cust.name}, we miss you at {restaurantName}! 🍕 Come back today for a special offer..."
                              </p>
                            </div>
                          </td>
                          <td className="py-6 px-8 text-xs font-black text-zinc-500 uppercase tracking-widest">{cust.last}</td>
                          <td className="py-6 px-8">
                            <Button 
                              onClick={() => window.open(`https://wa.me/91${cust.mobile}?text=${encodeURIComponent(`Hi ${cust.name}, we miss you at ${restaurantName}! 🍕 Come back today for a special offer just for you!`)}`, "_blank")}
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl h-14 px-8 font-black text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-3 active:scale-95 transition-all"
                            >
                              <Send className="h-4 w-4" /> SEND
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                  <h4 className="text-3xl font-black text-red-600 tracking-tighter">₹{sales.filter(s => s.type === "Udhaar").reduce((sum, s) => sum + s.price, 0)}</h4>
                </Card>
                <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-sm rounded-2xl flex flex-col justify-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Customers</p>
                  <h4 className="text-3xl font-black tracking-tighter">{new Set(sales.filter(s => s.type === "Udhaar").map(s => s.mobile)).size} <span className="text-xs text-zinc-400">Accs</span></h4>
                </Card>
              </div>

              <div className="space-y-4">
                {sales.filter(s => s.type === "Udhaar").length === 0 ? (
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
                  sales.filter(s => s.type === "Udhaar").map(s => (
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
                          onClick={() => window.open(`https://wa.me/91${s.mobile}?text=${encodeURIComponent(`Hi ${s.name}, a friendly reminder for your pending Udhaar of ₹${s.price} at ${restaurantName}. Please pay soon! Thanks.`)}`, "_blank")}
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 px-3">
              <header className="px-2 pt-4">
                <h2 className="text-5xl font-bold tracking-tighter leading-tight text-zinc-900 dark:text-white">Inventory<br/>Control</h2>
                <p className="text-sm font-medium text-zinc-400 mt-3 leading-relaxed">Update your digital menu items and pricing.</p>
              </header>

              {/* NEW ITEM CARD - PREMIUM STYLE */}
              <Card className="rounded-2xl border-0 shadow-2xl shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="bg-zinc-900 dark:bg-zinc-800 p-6">
                  <h3 className="text-xl font-bold text-white">New Item</h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Dish Name</Label>
                    <Input 
                      placeholder="e.g. Double Cheese Roll" 
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
                    <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v || "Main Course")}>
                      <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-0 shadow-2xl">
                        <SelectItem value="Main Course">🍛 Main Course</SelectItem>
                        <SelectItem value="Starters">🥟 Starters</SelectItem>
                        <SelectItem value="Chinese">🥢 Chinese</SelectItem>
                        <SelectItem value="Beverages">🥤 Beverages</SelectItem>
                        <SelectItem value="Snacks">🍟 Snacks</SelectItem>
                        <SelectItem value="Breads">🍞 Breads</SelectItem>
                        <SelectItem value="Desserts">🍰 Desserts/Sweets</SelectItem>
                        <SelectItem value="Others">📁 Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddItem} 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-md shadow-xl shadow-blue-500/30 active:scale-95 transition-all mt-4 uppercase tracking-wider"
                  >
                    ADD TO MENU
                  </Button>
                </div>
              </Card>

              {/* LIVE MENU LIST */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-2xl font-bold tracking-tight">Live Menu</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 font-bold bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 shadow-sm">{menuItems.length} Items</Badge>
                    <button 
                      onClick={() => {
                        const csvContent = "Name,Price,Category"; // Clean header only
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'menu_template.csv';
                        a.click();
                      }}
                      className="text-[9px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Template
                    </button>
                    <label className="cursor-pointer text-[9px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest flex items-center gap-1">
                      <Upload className="h-3 w-3" /> Import
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
                              const newItemsFromCsv: any[] = [];
                              
                              // Skip header row
                              for (let i = 1; i < lines.length; i++) {
                                const [name, price, category] = lines[i].split(",").map(s => s.trim());
                                if (name && price) {
                                  newItemsFromCsv.push({
                                    name,
                                    price: Number(price),
                                    category: category || "General"
                                  });
                                }
                              }

                              if (newItemsFromCsv.length > 0) {
                                setIsLoading(true);
                                try {
                                  const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
                                  if (!store) throw new Error("Store ID not found");
                                  
                                  const { data: insertedData, error } = await supabase
                                    .from('menu_items')
                                    .insert(newItemsFromCsv.map(item => ({ ...item, store_id: store.id })))
                                    .select();
                                  
                                  if (error) throw error;
                                  setMenuItems([...menuItems, ...insertedData]);
                                  alert(`Successfully imported ${insertedData.length} items!`);
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
                      menuItems.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase())).map(item => (
                        <div key={item.id} className="p-6 grid grid-cols-12 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors px-8">
                          <div className="col-span-7">
                            <p className="font-bold text-md text-zinc-900 dark:text-white leading-none">{item.name}</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1 tracking-wider">{getDisplayCategory(item.category)}</p>
                          </div>
                          <div className="col-span-3 text-center">
                            <p className="font-bold text-lg tracking-tight">₹{item.price}</p>
                          </div>
                          <div className="col-span-2 text-right">
                            <button 
                              onClick={() => handleDeleteItem(item.id)} 
                              className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
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
                    <h3 className="text-3xl font-black tracking-tighter">Zainul Khan</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">Platform Founder</p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <Button 
                      onClick={() => window.open(`https://wa.me/917838229178?text=${encodeURIComponent("Hi Zainul, I need help with my InstaMunim POS. Can you please assist me?")}`, "_blank")}
                      className="w-full h-16 bg-[#00c875] hover:bg-[#00b067] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-5 w-5" /> Contact on WhatsApp
                    </Button>
                    <Button 
                      onClick={() => window.location.href = "mailto:Zainul007860@gmail.com?subject=InstaMunim Support Request"}
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
                        <p className="text-lg font-black tracking-tight truncate max-w-[180px]">Zainul007860@gmail.com</p>
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
                <h2 className="text-4xl font-black tracking-tighter">Legal & Privacy</h2>
                <p className="text-zinc-500 font-bold mt-1">Please read our terms carefully.</p>
              </header>

              <div className="space-y-4">
                {/* 1. WhatsApp Usage Policy */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">1. WhatsApp Usage Policy</h3>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    This application provides a utility to pre-fill WhatsApp messages for invoices. The "Shop Owner" (User) is solely responsible for sending these messages. The application does not automate spam. Overuse of WhatsApp features that results in a temporary or permanent ban of the User's number is not the responsibility of the application or its owners.
                  </p>
                </Card>

                {/* 2. Data Privacy & Storage */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">2. Data Privacy & Storage</h3>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Currently, all business data including sales, menu items, and expenses are stored locally on your device (Browser Storage). While this ensures offline access, clearing browser data or uninstalling the app may result in data loss. We are not liable for any data loss occurring due to device failure or user error.
                  </p>
                </Card>

                {/* 3. Subscription & Payments */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">3. Subscription & Payments</h3>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    The usage of this application is subject to a monthly subscription fee (e.g., ₹399/month). Failure to pay the subscription may result in limited access to features or account suspension from the Admin Panel.
                  </p>
                </Card>

                {/* 4. Limitation of Liability */}
                <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border-0 shadow-sm space-y-4">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">4. Limitation of Liability</h3>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    In no event shall the application owners be liable for any indirect, incidental, or consequential damages arising out of the use of this service.
                  </p>
                </Card>

                {/* AGREEMENT FOOTER */}
                <div className="pt-6">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-900 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 italic italic">
                      By using this application, you agree to these terms.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-8">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Version 2.0.4 - Enterprise Edition</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "MoreMenu" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-1">
              <header className="px-2">
                <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">More Options</h2>
                <p className="text-zinc-500 font-bold mt-1">Access additional tools and settings.</p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "Settings", label: "STORE SETTINGS", icon: Settings, color: "text-zinc-600", bg: "bg-zinc-50" },
                  { id: "Inventory", label: "DAILY STOCK", icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
                  { id: "Rent", label: "RENT TRACKER", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
                  { id: "Khata", label: "UDHAAR KHATA", icon: Book, color: "text-orange-500", bg: "bg-orange-50" },
                  { id: "Marketing", label: "SMART CRM", icon: Send, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { id: "Legal", label: "LEGAL & PRIVACY", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
                  { id: "Support", label: "HELP CENTER", icon: Smartphone, color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    className="py-7 px-2 bg-white dark:bg-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} dark:bg-opacity-10 border border-zinc-100 dark:border-zinc-800 shadow-sm`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-[9px] font-black text-zinc-900 dark:text-white tracking-widest text-center">{item.label}</span>
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

          {activeTab === "Inventory" && <InventoryDiary />}

          {activeTab === "Settings" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-28 px-4 pt-4">
              <header className="flex items-center justify-between px-2 mb-6">
                <h2 className="text-3xl font-black tracking-tighter">Store Settings</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    {isDarkMode ? <Sun className="h-5 w-5 text-zinc-400" /> : <Moon className="h-5 w-5 text-zinc-400" />}
                  </button>
                  <Button 
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        // Save everything locally first to ensure persistence
                        localStorage.setItem("saas_store_logo", storeLogo || "");
                        localStorage.setItem("saas_store_name", restaurantName);
                        localStorage.setItem("saas_store_address", storeAddress);
                        localStorage.setItem("saas_store_phone", storePhone);
                        localStorage.setItem("saas_store_website", storeWebsite);
                        localStorage.setItem("saas_store_gstin", storeGstin);
                        localStorage.setItem("saas_monthly_rent", monthlyRent.toString());
                        localStorage.setItem("saas_swiggy_comm", swiggyCommission.toString());
                        localStorage.setItem("saas_swiggy_comm_type", swiggyCommType);
                        localStorage.setItem("saas_zomato_comm", zomatoCommission.toString());
                        localStorage.setItem("saas_zomato_comm_type", zomatoCommType);
                        
                        // Cloud Sync (Safe Mode)
                        const { error: syncError } = await supabase
                          .from('stores')
                          .update({ 
                            store_name: restaurantName,
                            store_logo: storeLogo
                          })
                          .eq('owner_mobile', ownerMobile);

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
                  { id: "FeesCommissions", label: "Fees & Commissions", icon: TrendingUp },
                  { id: "HardwareSettings", label: "Hardware Settings", icon: Printer },
                  { id: "FAQSecurity", label: "FAQ & Data Security", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setExpandedSetting(expandedSetting === item.id ? null : item.id)}
                      className={`w-full p-5 flex items-center justify-between transition-all active:scale-95 group ${expandedSetting === item.id && (item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions" || item.id === "HardwareSettings" || item.id === "FAQSecurity") ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={`h-5 w-5 ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions" || item.id === "HardwareSettings") ? 'text-orange-500' : (item.id === "FAQSecurity" ? 'text-emerald-500' : 'text-zinc-900 dark:text-white')) : 'text-zinc-400'}`} />
                        <span className={`font-bold text-sm ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions" || item.id === "HardwareSettings" || item.id === "FAQSecurity") ? 'text-white' : 'text-zinc-900 dark:text-white') : 'text-zinc-700 dark:text-zinc-300'}`}>{item.label}</span>
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
                                    <input type="file" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setStoreLogo(reader.result as string);
                                        reader.readAsDataURL(file);
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
                          </div>
                        )}

                        {item.id === "AccountSecurity" && (
                          <div className="space-y-6 pt-6">
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

                        {item.id === "FeesCommissions" && (
                          <div className="pt-6 space-y-3">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-5 rounded-3xl flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black">S</div>
                                <span className="font-black">Swiggy</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <select 
                                  value={swiggyCommType} 
                                  onChange={e => setSwiggyCommType(e.target.value)}
                                  className="bg-transparent font-black text-xs border-0 focus:ring-0 text-zinc-500"
                                >
                                  <option value="percent">pe</option>
                                  <option value="fixed">fixed</option>
                                </select>
                                <Input type="number" value={swiggyCommission} onChange={e => setSwiggyCommission(Number(e.target.value))} className="w-16 h-10 bg-transparent border-0 text-right font-black text-lg focus:ring-0" />
                              </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-5 rounded-3xl flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black">Z</div>
                                <span className="font-black">Zomato</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <select 
                                  value={zomatoCommType} 
                                  onChange={e => setZomatoCommType(e.target.value)}
                                  className="bg-transparent font-black text-xs border-0 focus:ring-0 text-zinc-500"
                                >
                                  <option value="percent">pe</option>
                                  <option value="fixed">fixed</option>
                                </select>
                                <Input type="number" value={zomatoCommission} onChange={e => setZomatoCommission(Number(e.target.value))} className="w-16 h-10 bg-transparent border-0 text-right font-black text-lg focus:ring-0" />
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
                          </div>
                        )}

                        {item.id === "HardwareSettings" && (
                          <div className="pt-6 animate-in fade-in slide-in-from-bottom-4">
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

        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 h-14 border-t backdrop-blur-2xl z-50 flex items-center justify-around px-4 ${isDarkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]'}`}>
        <button onClick={() => setActiveTab("Dashboard")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Dashboard' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Dashboard' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><LayoutDashboard className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Home</span>
        </button>
 
        <button onClick={() => setActiveTab("Menu")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Menu' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Menu' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><ShoppingCart className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Menus</span>
        </button>
 
        <button onClick={() => setIsSaleOpen(true)} className="flex flex-col items-center -mt-8 group">
          <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center shadow-xl shadow-orange-600/30 border-4 border-[#fafafa] dark:border-zinc-950 group-active:scale-90 transition-all">
            <PlusCircle className="h-8 w-8 text-white" />
          </div>
          <span className="text-[8px] font-bold uppercase text-orange-600 mt-1 tracking-widest">Sale</span>
        </button>

        <button onClick={() => setActiveTab("Total Sale Report")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'Total Sale Report' ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${activeTab === 'Total Sale Report' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><PieChart className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Stats</span>
        </button>

        <button onClick={() => setActiveTab("MoreMenu")} className={`flex flex-col items-center gap-1 transition-all ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory'].includes(activeTab) ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory'].includes(activeTab) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><Settings className="h-5 w-5" /></div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">More</span>
        </button>
      </nav>
      {/* EXIT PROTECTION DIALOG */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="p-8 border-0 max-w-[320px] bg-zinc-900 text-white rounded-xl shadow-2xl">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-center">Are you sure you want to exit?</DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs font-bold leading-relaxed text-center">
                Your current session will end. Do you want to leave InstaMunim?
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => window.close()} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs active:scale-95 transition-all">Yes</Button>
              <Button onClick={() => setShowExitDialog(false)} variant="outline" className="flex-1 h-12 bg-transparent border-zinc-700 text-white hover:bg-white/5 font-black rounded-xl text-xs active:scale-95 transition-all">No</Button>
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
              <DialogTitle className="text-3xl font-black tracking-tight text-center">Success!</DialogTitle>
              <DialogDescription className="text-zinc-500 font-bold italic text-center">
                Order has been completed and saved to cloud.
              </DialogDescription>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={() => {
                  sendWhatsAppReceipt();
                  setTimeout(() => setShowSuccessDialog(false), 1000);
                }} 
                className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-lg shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-6 w-6" /> SEND RECEIPT
              </Button>
              <Button 
                onClick={() => setShowSuccessDialog(false)} 
                variant="ghost" 
                className="w-full h-12 text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-zinc-600"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* BARCODE SCANNER DIALOG */}
      <Dialog open={showScanner} onOpenChange={(open) => { if(!open) closeScanner(); }}>
        <DialogContent className="p-6 border-0 max-w-[360px] bg-zinc-950 text-white rounded-xl shadow-2xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <DialogTitle className="text-sm font-black uppercase tracking-wider text-zinc-400">Barcode Scanner</DialogTitle>
              <Button size="icon" variant="ghost" onClick={closeScanner} className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 aspect-[4/3] flex items-center justify-center">
              <div id="reader" className="w-full h-full [&_video]:object-contain [&_video]:rounded-xl" />
              <div className="absolute inset-0 border-[30px] border-zinc-950/60 pointer-events-none flex items-center justify-center">
                <div className="w-[220px] h-[100px] border-2 border-dashed border-orange-500 rounded-lg relative">
                  <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-md shadow-red-500 top-1/2 -translate-y-1/2 animate-bounce" />
                </div>
              </div>
              {lastScannedMsg && (
                <div className="absolute bottom-4 left-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-center shadow-lg animate-fade-in flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 bg-white rounded-full animate-ping" />
                  {lastScannedMsg}
                </div>
              )}
            </div>
            {scannerError && (
              <p className="text-red-500 text-xs font-bold text-center leading-relaxed">{scannerError}</p>
            )}
            <p className="text-zinc-500 text-[10px] font-bold text-center uppercase tracking-widest">
              Align barcode inside the rectangle to auto-scan
            </p>
            <div className="text-center">
              <span className="inline-block text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                {scannerDebugInfo}
              </span>
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
    </div>
  );
}
