"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { 
  LayoutDashboard, FileText, Settings, LogOut, Search,
  PlusCircle, Loader2, Book, Trash2, Send, ShoppingCart, Package,
  TrendingUp, Users, Smartphone, PieChart, ArrowUpRight, CheckCircle2, Mic, MessageCircle, ArrowRight, Sun, Moon, Cloud, RefreshCw, Lock, ShieldCheck, ShieldAlert, Eye, EyeOff, LayoutPanelLeft, Clock, History, CreditCard, ChevronRight, Download, Filter, Share2, Printer, X, ChevronDown, Plus, Minus, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, InterstitialAdPluginEvents } from "@capacitor-community/admob";
import { Camera, CameraResultType } from "@capacitor/camera";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAdMobActive, setIsAdMobActive] = useState(false);
  const [admobDebugInfo, setAdmobDebugInfo] = useState("Not initialized");
  const [admobHeight, setAdmobHeight] = useState(60);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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
  const [cart, setCart] = useState<{name: string, price: number, qty: number}[]>([]);
  const [restaurantName, setRestaurantName] = useState("InstaMunim");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeAddress, setStoreAddress] = useState("Premium Plaza, Main Road, New Delhi");
  
  // Gemini AI Menu Scanner State
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<{ name: string; price: number; selected: boolean }[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);

  const fetchGeminiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .single();
      if (data && data.value) {
        setGeminiApiKey(data.value);
        localStorage.setItem("saas_gemini_api_key", data.value);
      }
    } catch (err) {
      console.warn("Failed to fetch Gemini API Key from Supabase config:", err);
    }
  };
  const [storePhone, setStorePhone] = useState("+91 9999 888 777");
  const [storeWebsite, setStoreWebsite] = useState("www.khankitchen.com");
  const [storeGstin, setStoreGstin] = useState("07AABCU1234F1Z5");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
  
  // Latest State Ref to avoid stale closures in voice listener
  const latestStateRef = useRef({ menuItems, voicePhase, cart, newName, newMobile });
  useEffect(() => {
    latestStateRef.current = { menuItems, voicePhase, cart, newName, newMobile };
  }, [menuItems, voicePhase, cart, newName, newMobile]);
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

  const prepareInterstitialAd = async () => {
    try {
      if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
        console.log("Preparing Interstitial Ad...");
        await AdMob.prepareInterstitial({
          adId: "ca-app-pub-6433517681109667/4211760677", // User's Real Android Interstitial ID
          isTesting: false,
        });
        console.log("Interstitial Ad prepared successfully.");
      }
    } catch (err) {
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
      try {
        if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
          setAdmobDebugInfo("Registering listeners...");
          
          loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            console.log("AdMob banner loaded successfully");
            setAdmobDebugInfo("Loaded successfully");
            setIsAdMobActive(true);
          });

          failedListener = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (info: any) => {
            console.error("AdMob banner failed to load:", info);
            setAdmobDebugInfo(`Failed to load: Code ${info?.code || "unknown"}, Msg: ${info?.message || "unknown"}`);
            setIsAdMobActive(false);
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

          // Preload first interstitial ad
          await prepareInterstitialAd();

          setAdmobDebugInfo("Requesting banner...");
          console.log("Showing AdMob Banner ad...");
          await AdMob.showBanner({
            adId: "ca-app-pub-6433517681109667/2890562844", // User's Real Android Banner ID
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
            isTesting: false,
          });
          setAdmobDebugInfo("Show requested. Waiting for load...");
        } else {
          setAdmobDebugInfo("Non-native platform");
        }
      } catch (err: any) {
        console.error("AdMob initialization/show error: ", err);
        setAdmobDebugInfo(`Init Error: ${err?.message || err}`);
      }
    };
    initAdMob();

    return () => {
      if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
        try {
          if (loadedListener) loadedListener.remove();
          if (failedListener) failedListener.remove();
          if (sizeChangedListener) sizeChangedListener.remove();
          if (interstitialDismissedListener) interstitialDismissedListener.remove();
          if (interstitialFailedToLoadListener) interstitialFailedToLoadListener.remove();
          AdMob.removeBanner();
        } catch (e) {
          console.error("Error removing AdMob banner/listeners: ", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchGeminiKey();
    
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
        const savedZomato = localStorage.getItem("saas_zomato_comm");
        if (savedZomato) setZomatoCommission(Number(savedZomato));
        // Auto-fetch from cloud for existing sessions
        const autoSync = async () => {
          const { data } = await supabase.from('stores').select('id, store_name, monthly_rent').eq('owner_mobile', savedOwnerMobile).single();
          if (data) {
            setRestaurantName(data.store_name);
            setMonthlyRent(data.monthly_rent || 0);
            await fetchStoreData(data.id);
          }
        };
        autoSync();
      }
    }
    
    const savedSales = localStorage.getItem("saas_sales");
    if (savedSales) { try { setSales(JSON.parse(savedSales).map((s: any) => ({ ...s, date: new Date(s.date) }))); } catch (e) { console.error(e); } }
    
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

    const savedGeminiKey = localStorage.getItem("saas_gemini_api_key");
    if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);

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
      localStorage.setItem("saas_gemini_api_key", geminiApiKey);
    }
  }, [sales, expenses, menuItems, restaurantName, monthlyRent, isDarkMode, geminiApiKey, dataLoaded, mounted]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");
    
    try {
      if (authMode === "login") {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_mobile', loginMobile)
          .single();

        if (error || !data) {
          setLoginError("Store not found. Please register.");
        } else if (data.password !== loginPassword) {
          setLoginError("Invalid password.");
        } else {
          // Success Login
          setIsLoggedIn(true);
          setOwnerMobile(loginMobile);
          setRestaurantName(data.store_name);
          setMonthlyRent(data.monthly_rent || 0);
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);
          await fetchStoreData(data.id);
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
          localStorage.setItem("saas_is_logged_in", "true");
          localStorage.setItem("saas_owner_mobile", loginMobile);

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
      // 0. Fetch Store Profile Info
      const { data: storeInfo } = await supabase.from('stores').select('*').eq('id', storeId).single();
      if (storeInfo) {
        setRestaurantName(storeInfo.store_name || storeInfo.name || localStorage.getItem("saas_store_name") || "");
        
        // Use cloud logo if exists, else fallback to localStorage
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
      }

      // 1. Fetch Sales
      const { data: salesData } = await supabase.from('sales').select('*').eq('store_id', storeId).order('sale_date', { ascending: false });
      setSales(salesData ? salesData.map(s => ({ 
        id: s.id, name: s.customer_name, item: s.items, mobile: s.mobile, price: s.total_price, type: s.payment_type, date: new Date(s.sale_date) 
      })) : []);

      // 2. Fetch Expenses
      const { data: expData } = await supabase.from('expenses').select('*').eq('store_id', storeId).order('expense_date', { ascending: false });
      setExpenses(expData ? expData.map(e => ({ 
        id: e.id, title: e.title, amount: e.amount, date: new Date(e.expense_date) 
      })) : []);

      // 3. Fetch Menu
      const { data: menuData } = await supabase.from('menu_items').select('*').eq('store_id', storeId);
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

  const generateAIInsight = () => {
    // Basic AI logic based on data
    const insights = [
      "Based on trends, your top item will be in high demand tomorrow. Keep 15% extra stock.",
      "Smart Tip: Wednesday sales are usually 20% higher for Roll items. Prepare in advance.",
      "Inventory Alert: Your stock levels are healthy. Good job on management!",
      "Profit Insight: Online orders are increasing. Consider a special weekend combo.",
      "Customer Trend: Most users are paying via Online. Ensure your QR is accessible."
    ];
    
    // Pick based on some simple logic
    if (sales.length > 5) {
      setAiInsightText(insights[0]);
    } else {
      setAiInsightText(insights[1]);
    }
    setIsAIDialogOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("saas_is_logged_in");
    setActiveTab("Dashboard");
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
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      const { data: newSale, error } = await supabase
        .from('sales')
        .insert([{
          store_id: store.id,
          customer_name: newName || "Guest",
          mobile: newMobile,
          items: cartDescription,
          total_price: cartTotal,
          payment_type: newType
        }])
        .select()
        .single();

      if (error) throw error;

      const sale = { id: newSale.id, name: newSale.customer_name, item: newSale.items, mobile: newSale.mobile, price: newSale.total_price, type: newSale.payment_type, date: new Date(newSale.sale_date) };
      setSales([sale, ...sales]);
      setLastOrderDetails(sale);
      setIsSaleOpen(false);
      setShowSuccessDialog(true);
      setCart([]); 
      setNewName(""); 
      setNewMobile("");

      // Show Fullscreen Interstitial Ad
      if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
        try {
          console.log("Triggering Interstitial Ad after sale...");
          await AdMob.showInterstitial();
        } catch (e) {
          console.error("Error showing interstitial ad:", e);
          // If show fails (e.g. not loaded), try preloading again
          prepareInterstitialAd();
        }
      }
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

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const invoiceUrl = `${baseUrl}/invoice?n=${encodeURIComponent(restaurantName)}&i=${encodeURIComponent(itemsParam)}&p=${lastOrderDetails.price}&d=${encodeURIComponent(lastOrderDetails.date.toISOString())}&t=${lastOrderDetails.type}&id=${lastOrderDetails.id}&m=${lastOrderDetails.mobile}&cn=${encodeURIComponent(lastOrderDetails.name)}&a=${encodeURIComponent(storeAddress)}&ph=${encodeURIComponent(storePhone)}&w=${encodeURIComponent(storeWebsite)}&g=${encodeURIComponent(storeGstin)}&o=${ownerMobile}`;

    const msg = whatsappInvoiceTemplate
      .replace("[NAME]", lastOrderDetails.name)
      .replace("[SHOP]", restaurantName)
      .replace("[ITEMS]", lastOrderDetails.item)
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

  const filteredSales = sales.filter(s => format(new Date(s.date), "yyyy-MM") === selectedMonth);
  const filteredExpenses = expenses.filter(e => format(new Date(e.date), "yyyy-MM") === selectedMonth);
  
  const totalSales = filteredSales.reduce((sum, s) => sum + s.price, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const totalCommissions = filteredSales.reduce((sum, s) => {
    if (s.type === "Swiggy") return sum + (s.price * (swiggyCommission / 100));
    if (s.type === "Zomato") return sum + (s.price * (zomatoCommission / 100));
    return sum;
  }, 0);

  const totalUdhaar = filteredSales.filter(s => s.type === "Udhaar" && s.status !== "Paid").reduce((sum, s) => sum + s.price, 0);

  const netProfit = totalSales - totalExpenses - totalCommissions;

  const uniqueCustomers = Array.from(new Set(sales.filter(s => s.mobile !== "N/A").map(s => s.mobile)));

  const getRentTargetData = () => {
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
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice) return;
    setIsLoading(true);
    try {
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (!store) throw new Error("Store ID not found");

      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert([{ store_id: store.id, name: newItemName, price: Number(newItemPrice), category: "Uncategorized" }])
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

  const handleBatchAddItems = async (itemsToAdd: { name: string; price: number }[]) => {
    if (itemsToAdd.length === 0) return;
    setIsLoading(true);
    try {
      const { data: store } = await supabase.from('stores').select('id').eq('owner_mobile', ownerMobile).single();
      if (!store) throw new Error("Store ID not found");

      const rows = itemsToAdd.map(item => ({
        store_id: store.id,
        name: item.name,
        price: Number(item.price),
        category: "Uncategorized"
      }));

      const { data: newItems, error } = await supabase
        .from('menu_items')
        .insert(rows)
        .select();

      if (error) throw error;
      
      const mapped = newItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category
      }));
      
      setMenuItems([...menuItems, ...mapped]);
      alert("Batch Menu Sync Success: Added " + newItems.length + " items!");
    } catch (err: any) {
      alert("Batch Menu Sync Error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const parseMenuWithGemini = async (base64Image: string, apiKey: string) => {
    if (!apiKey) {
      throw new Error("Gemini API Key missing! Please add it in Store Settings -> System & Cloud.");
    }
    
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "You are a menu card scanning assistant. Analyze this restaurant menu card image. Extract all dishes/items and their prices. Return strictly as a JSON array of objects, with each object having keys 'name' (string) and 'price' (number). Make sure prices are parsed as numbers. Do not include markdown blocks like ```json ... ```, HTML, or conversational text. Return only the raw JSON array string. Example: [{\"name\": \"Margherita Pizza\", \"price\": 199}]"
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ]
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Gemini API returned HTTP status ${response.status}`);
    }
    
    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();
    
    try {
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error("Output is not a valid list");
      return items.map(item => ({
        name: String(item.name || "Unnamed Item"),
        price: Number(item.price || 0),
        selected: true
      }));
    } catch (parseErr) {
      console.error("Gemini output parsing failed. Raw response:", text);
      throw new Error("AI output was not in the expected JSON format. Please try again with a clearer image.");
    }
  };

  const handleScanMenu = async () => {
    try {
      if (!geminiApiKey) {
        alert("Pehle Settings me jaakar Gemini API Key daalein! (System & Cloud settings ke andar)");
        setActiveTab("Settings");
        setExpandedSetting("SystemCloud");
        return;
      }
      
      let base64Image = "";
      
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64
        });
        if (image && image.base64String) {
          base64Image = image.base64String;
        } else {
          return;
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          
          setIsScanning(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = reader.result as string;
              const items = await parseMenuWithGemini(base64, geminiApiKey);
              setScannedItems(items);
              setShowScanModal(true);
            } catch (err: any) {
              alert("Scan Fail: " + err.message);
            } finally {
              setIsScanning(false);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }
      
      if (base64Image) {
        setIsScanning(true);
        const items = await parseMenuWithGemini(base64Image, geminiApiKey);
        setScannedItems(items);
        setShowScanModal(true);
      }
    } catch (err: any) {
      if (err.message && err.message.includes("User cancelled")) return;
      alert("Scan Failed: " + (err.message || "Unknown error"));
    } finally {
      setIsScanning(false);
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
      <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center bg-[#f8f9fa] p-4 sm:p-10 selection:bg-orange-500/30 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 my-auto">
          <Card className="border-0 shadow-2xl shadow-zinc-200 rounded-xl p-6 bg-white overflow-hidden">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-3">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-none">InstaMunim</h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2">- BEYOND BILLING -</p>
            </div>

            <div className="text-center mb-6">
               <h2 className="text-xl font-bold text-zinc-400">Owner Login</h2>
               <p className="text-zinc-400 text-[10px] font-medium mt-1">Welcome back to your POS Dashboard.</p>
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
                    className="h-14 rounded-xl bg-zinc-50 border-0 font-bold px-6 focus-visible:ring-2 focus-visible:ring-orange-500 transition-all text-sm" 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Owner Mobile</Label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 p-1 border-r border-zinc-200">
                    <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <Input 
                    placeholder="99XXXXXXXX" 
                    value={loginMobile} 
                    onChange={e => setLoginMobile(e.target.value)} 
                    required 
                    className="h-14 rounded-xl bg-zinc-50 border-0 font-bold pl-16 focus-visible:ring-2 focus-visible:ring-orange-500 text-base transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Secret Password</Label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 p-1 border-r border-zinc-200">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    required 
                    className="h-14 rounded-xl bg-zinc-50 border-0 font-bold pl-16 pr-14 focus-visible:ring-2 focus-visible:ring-orange-500 text-base tracking-widest transition-all" 
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

              {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}

              <Button type="submit" className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-xs active:scale-95 transition-all shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-3 uppercase tracking-widest">
                {authMode === "login" ? "Access Dashboard" : "Start Business"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <button 
                type="button" 
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setLoginError(""); }} 
                className="w-full text-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] py-2 hover:text-zinc-900 transition-colors"
              >
                {authMode === "login" ? "Don't have an account? Create one" : "Already registered? Login"}
              </button>
            </form>
          </Card>

          {Capacitor.isNativePlatform() && (
            <div className="bg-white border border-orange-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-3 text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-mono shadow-sm">
              <span className="font-bold text-orange-500">AdMob Status:</span> {admobDebugInfo}
            </div>
          )}
          
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
      style={{ paddingTop: isAdMobActive ? `${admobHeight}px` : "0px" }}
    >
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                    <Input placeholder="Search dishes..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="h-10 pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-0 font-bold placeholder:text-zinc-300 text-xs" />
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

                   <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Grand Total</p>
                        <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">₹{cart.reduce((s,i) => s + (i.price*i.qty), 0)}</h3>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Input placeholder="Customer Name" value={newName} onChange={e => setNewName(e.target.value)} className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 text-sm" />
                      <Input placeholder="Mobile Number" value={newMobile} onChange={e => setNewMobile(e.target.value)} className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold px-4 text-sm" />
                   
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
                              ₹{Math.max(0, Number(cashReceived) - cart.reduce((s,i) => s + (i.price*i.qty), 0))}
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
                      <img src={storeLogo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-zinc-400">{restaurantName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-tight">{restaurantName}</span>
                      <div className="bg-emerald-500/10 text-emerald-500 text-[7px] font-bold px-1.5 h-3.5 rounded-full flex items-center gap-1 uppercase tracking-tighter"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live</div>
                    </div>
                    <div className="text-[8px] font-medium text-zinc-400 flex items-center gap-1 mt-0.5"><Cloud className="h-2 w-2" /> Synced {lastSyncedTime}</div>
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
                      <p className="text-base font-bold tracking-tight">₹{s.price}</p>
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
                <h3 className="text-7xl font-black tracking-tighter mb-2">₹{getRentTargetData().todaysTarget}</h3>
                <p className="text-lg font-bold opacity-80 uppercase tracking-[0.2em]">Remaining Today</p>
                
                <div className="mt-12 space-y-4">
                  <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                    <span>Performance</span>
                    <span className="text-xl">{Math.min(100, Math.round((getRentTargetData().todayActual / getRentTargetData().todaysTarget) * 100 || 0))}%</span>
                  </div>
                  <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${Math.min(100, (getRentTargetData().todayActual / getRentTargetData().todaysTarget) * 100 || 0)}%` }} />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-zinc-200 dark:bg-zinc-800" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Fixed Cost</p>
                  <h4 className="text-3xl font-black">₹{getRentTargetData().dailyBase}</h4>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2 italic">Base daily rent</p>
                </Card>
                <Card className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                  <div className={`absolute left-0 top-0 w-1.5 h-full ${getRentTargetData().carryOver > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">History Impact</p>
                  <h4 className={`text-3xl font-black ${getRentTargetData().carryOver > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {getRentTargetData().carryOver > 0 ? `+₹${getRentTargetData().carryOver}` : `-₹${Math.abs(getRentTargetData().carryOver)}`}
                  </h4>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2 italic">Carry-over data</p>
                </Card>
              </div>

              <div className="p-6 bg-zinc-900 text-white rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-500 rounded-2xl"><PieChart className="h-6 w-6" /></div>
                   <div><h5 className="font-black">Finance Check</h5><p className="text-[10px] font-bold opacity-60">Status: {getRentTargetData().remaining === 0 ? "Profit Zone 🚀" : "Cost Recovery 💪"}</p></div>
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

              <Button onClick={() => window.print()} className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-bold rounded-full text-sm shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all">
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
                              <td className="py-2 px-4 text-right font-bold text-lg tracking-tighter text-zinc-900 dark:text-white whitespace-nowrap">₹{s.price}</td>
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
                            <td className="py-2 px-4 text-right font-bold text-lg tracking-tighter text-zinc-900 dark:text-white whitespace-nowrap">₹{s.price}</td>
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
              <header className="px-2 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-5xl font-bold tracking-tighter leading-tight text-zinc-900 dark:text-white">Inventory<br/>Control</h2>
                  <p className="text-sm font-medium text-zinc-400 mt-3 leading-relaxed">Update your digital menu items and pricing.</p>
                </div>
                <div>
                  <Button 
                    onClick={handleScanMenu}
                    disabled={isScanning}
                    className="h-14 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs px-6 shadow-xl shadow-orange-500/20 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {isScanning ? (
                      <>SCANNING MENU... <Loader2 className="h-4 w-4 animate-spin" /></>
                    ) : (
                      <>📷 SMART AI SCANNER</>
                    )}
                  </Button>
                </div>
              </header>

              {/* GEMINI MENU SCANNER REVIEW MODAL */}
              <Dialog open={showScanModal} onOpenChange={setShowScanModal}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-zinc-900 border-0 p-6 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight">AI Scanned Menu Items</DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400 font-bold uppercase mt-1">
                      Check and edit the scanned items before saving.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-[350px] overflow-y-auto divide-y dark:divide-zinc-800 my-4 pr-1 scrollbar-thin">
                    {scannedItems.map((item, index) => (
                      <div key={index} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <input 
                            type="checkbox" 
                            checked={item.selected} 
                            onChange={(e) => {
                              const updated = [...scannedItems];
                              updated[index].selected = e.target.checked;
                              setScannedItems(updated);
                            }}
                            className="w-5 h-5 rounded-md border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <Input 
                            value={item.name} 
                            onChange={(e) => {
                              const updated = [...scannedItems];
                              updated[index].name = e.target.value;
                              setScannedItems(updated);
                            }}
                            className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold text-sm px-3 flex-1"
                          />
                        </div>
                        <div className="w-24">
                          <Input 
                            type="number"
                            value={item.price} 
                            onChange={(e) => {
                              const updated = [...scannedItems];
                              updated[index].price = Number(e.target.value);
                              setScannedItems(updated);
                            }}
                            className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-0 font-bold text-sm px-3 text-right"
                          />
                        </div>
                      </div>
                    ))}
                    {scannedItems.length === 0 && (
                      <p className="text-center py-6 text-xs text-zinc-400 font-bold uppercase tracking-wider">No items found. Please try again.</p>
                    )}
                  </div>

                  <DialogFooter className="flex flex-row gap-3 pt-4 border-t dark:border-zinc-800">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowScanModal(false)}
                      className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wider text-xs border-zinc-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        const selected = scannedItems.filter(i => i.selected && i.name.trim() !== "");
                        if (selected.length === 0) {
                          alert("Pehle kam se kam 1 item select karein!");
                          return;
                        }
                        setShowScanModal(false);
                        await handleBatchAddItems(selected);
                      }}
                      className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20"
                    >
                      Save {scannedItems.filter(i => i.selected).length} Items
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                  <Badge variant="outline" className="rounded-full px-3 py-1 font-bold bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 shadow-sm">{menuItems.length} Items</Badge>
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
                            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1 tracking-wider">{item.category}</p>
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

          {activeTab === "Inventory" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-2 sm:px-4 max-w-full">
              <header className="px-2 pt-4 flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">Inventory Control</h2>
                  <p className="text-zinc-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Manage stock levels and supplies</p>
                </div>
                <Button className="bg-zinc-900 text-white rounded-xl font-black text-[10px] px-6 h-12 uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-zinc-900/20">
                  <Plus className="h-4 w-4 mr-2" /> New Supply
                </Button>
              </header>

              {/* INVENTORY SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Items</p>
                  <h4 className="text-3xl font-black">{menuItems.length}</h4>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-tight">Active menu items</p>
                </Card>
                <Card className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-orange-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Low Stock</p>
                  <h4 className="text-3xl font-black text-orange-500">
                    {menuItems.filter(i => (i.stock || 0) <= (i.minStock || 5) && (i.stock || 0) > 0).length}
                  </h4>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-tight">Need urgent refill</p>
                </Card>
                <Card className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border-0 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-red-600" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Out of Stock</p>
                  <h4 className="text-3xl font-black text-red-600">
                    {menuItems.filter(i => (i.stock || 0) === 0).length}
                  </h4>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-tight">Critical status</p>
                </Card>
              </div>

              {/* STOCK TABLE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                    <Input placeholder="Search inventory..." className="h-12 pl-10 rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-sm font-bold text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-bold text-[10px] h-12 uppercase tracking-widest border-zinc-100 dark:border-zinc-800">Export</Button>
                    <Button variant="outline" className="rounded-xl font-bold text-[10px] h-12 uppercase tracking-widest border-zinc-100 dark:border-zinc-800">Filter</Button>
                  </div>
                </div>

                <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                          <th className="py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item Details</th>
                          <th className="py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Status</th>
                          <th className="py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">In Stock</th>
                          <th className="py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Reorder Lvl</th>
                          <th className="py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800">
                        {menuItems.map(item => {
                          const stock = item.stock || 0;
                          const minStock = item.minStock || 5;
                          const isLow = stock <= minStock && stock > 0;
                          const isOut = stock === 0;

                          return (
                            <tr key={item.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all">
                              <td className="py-6 px-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-zinc-500">
                                    {item.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-black text-lg tracking-tight text-zinc-900 dark:text-white uppercase">{item.name}</p>
                                    <p className="text-[10px] font-bold text-zinc-400">Category: {item.category || "General"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 px-8 text-center">
                                {isOut ? (
                                  <Badge className="bg-red-600 text-white border-0 font-black text-[9px] uppercase px-3 py-1 rounded-lg">OUT OF STOCK</Badge>
                                ) : isLow ? (
                                  <Badge className="bg-orange-500 text-white border-0 font-black text-[9px] uppercase px-3 py-1 rounded-lg">LOW STOCK</Badge>
                                ) : (
                                  <Badge className="bg-emerald-500 text-white border-0 font-black text-[9px] uppercase px-3 py-1 rounded-lg">HEALTHY</Badge>
                                )}
                              </td>
                              <td className="py-6 px-8 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <button className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"><Minus className="h-3 w-3" /></button>
                                  <span className={`text-xl font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>{stock}</span>
                                  <button className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"><Plus className="h-3 w-3" /></button>
                                </div>
                              </td>
                              <td className="py-6 px-8 text-center">
                                <span className="font-black text-zinc-400 text-sm">{minStock} units</span>
                              </td>
                              <td className="py-6 px-8 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 text-blue-600"><Settings className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                        localStorage.setItem("saas_zomato_comm", zomatoCommission.toString());
                        localStorage.setItem("saas_gemini_api_key", geminiApiKey);
                        
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
                  { id: "FAQSecurity", label: "FAQ & Data Security", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setExpandedSetting(expandedSetting === item.id ? null : item.id)}
                      className={`w-full p-5 flex items-center justify-between transition-all active:scale-95 group ${expandedSetting === item.id && (item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions" || item.id === "FAQSecurity") ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={`h-5 w-5 ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions") ? 'text-orange-500' : (item.id === "FAQSecurity" ? 'text-emerald-500' : 'text-zinc-900 dark:text-white')) : 'text-zinc-400'}`} />
                        <span className={`font-bold text-sm ${expandedSetting === item.id ? ((item.id === "StoreProfile" || item.id === "AccountSecurity" || item.id === "SystemCloud" || item.id === "WhatsAppBot" || item.id === "FeesCommissions" || item.id === "FAQSecurity") ? 'text-white' : 'text-zinc-900 dark:text-white') : 'text-zinc-700 dark:text-zinc-300'}`}>{item.label}</span>
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
                                <select className="bg-transparent font-black text-xs border-0 focus:ring-0 text-zinc-500">
                                  <option>pe</option>
                                  <option>fixed</option>
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
                                <select className="bg-transparent font-black text-xs border-0 focus:ring-0 text-zinc-500">
                                  <option>pe</option>
                                  <option>fixed</option>
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
                              </div>
                              <Button 
                                onClick={() => { setIsSyncing(true); setTimeout(() => setIsSyncing(false), 1500); }} 
                                disabled={isSyncing}
                                className="bg-[#00c875] hover:bg-[#00b067] text-white px-6 h-12 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-2"
                              >
                                {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
                                SYNC NOW
                              </Button>
                            </div>
                            <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-4">Database is synchronized and secure</p>
                             
                            
                            {Capacitor.isNativePlatform() && (
                              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-4">
                                <span className="font-bold text-orange-500">AdMob Status:</span> {admobDebugInfo}
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

        <button onClick={() => setActiveTab("MoreMenu")} className={`flex flex-col items-center gap-1 transition-all ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu'].includes(activeTab) ? 'text-orange-600 scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <div className={`p-1.5 rounded-xl ${['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu'].includes(activeTab) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><Settings className="h-5 w-5" /></div>
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
    </div>
  );
}
