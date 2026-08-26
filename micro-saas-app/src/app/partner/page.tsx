"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, TrendingUp, DollarSign, Phone, MapPin, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  ExternalLink, Search, Camera, IndianRupee, Award, Calendar, 
  MessageSquare, FileText, ChevronRight, X, Eye, EyeOff, Key, Send, 
  Trash2, Edit3, Power, Check, AlertCircle, Sparkles, Navigation,
  QrCode, LogOut, ArrowRight, ShieldAlert, Store, Star, Flame,
  User, CheckSquare, Square, Smartphone, BarChart3, Database,
  DownloadCloud, PackageCheck, Receipt, Volume2, Share2, HelpCircle,
  Building, MapPinned, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { sendDiscordAlert } from "@/lib/discord";
import { App as CapacitorApp } from "@capacitor/app";

export default function PartnerApp() {
  // =========================================================================
  // AUTHENTICATION & CREDENTIALS
  // =========================================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<any | null>(null);
  const [authError, setAuthError] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // App Navigation: dashboard, onboard, leads, stores, pitch, profile
  const [activeTab, setActiveTab] = useState<"dashboard" | "onboard" | "leads" | "stores" | "pitch" | "profile">("dashboard");

  // Attendance & Dynamic Live Location
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [liveLocationText, setLiveLocationText] = useState<string>("Detecting GPS...");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Data States
  const [fseConfig, setFseConfig] = useState<any>({ agents: [], leads: [], attendance: [], settlements: [] });
  const [allStores, setAllStores] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Rapid Onboarding Form
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Restaurant/Cafe");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "yearly">("starter");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash">("UPI");
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingSuccess, setOnboardingSuccess] = useState<any | null>(null);

  // Leads Form
  const [leadStoreName, setLeadStoreName] = useState("");
  const [leadOwnerName, setLeadOwnerName] = useState("");
  const [leadMobile, setLeadMobile] = useState("");
  const [leadInterest, setLeadInterest] = useState<"Hot" | "Warm" | "Cold">("Hot");
  const [leadRevisitDate, setLeadRevisitDate] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Profile Uploading
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load saved credentials & login session & Register Android Back button
  useEffect(() => {
    // 1. Saved session
    const savedAgent = localStorage.getItem("instamunim_partner_agent");
    if (savedAgent) {
      try {
        const parsed = JSON.parse(savedAgent);
        setCurrentAgent(parsed);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem("instamunim_partner_agent");
      }
    }

    // 2. Remember Me credentials
    const savedMobile = localStorage.getItem("instamunim_partner_saved_mobile");
    const savedPass = localStorage.getItem("instamunim_partner_saved_pass");
    if (savedMobile) setLoginMobile(savedMobile);
    if (savedPass) setLoginPassword(savedPass);

    // 3. Register Native Back Button to Exit App
    let backListener: any = null;
    const registerBack = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (e) {
        // Fallback in web/desktop environment
      }
    };
    registerBack();

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, []);

  // Fetch FSE & Stores Data
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch FSE Config
      const { data: fseData } = await supabase
        .from('stores')
        .select('store_logo')
        .eq('owner_mobile', 'admin_fse_config')
        .single();

      if (fseData && fseData.store_logo && fseData.store_logo.startsWith("JSON_CFG:")) {
        const parsed = JSON.parse(fseData.store_logo.substring(9));
        setFseConfig(parsed);
        
        // Refresh current agent with latest from cloud
        if (currentAgent?.mobile) {
          const freshMe = (parsed.agents || []).find((a: any) => a.mobile === currentAgent.mobile);
          if (freshMe) {
            setCurrentAgent(freshMe);
            localStorage.setItem("instamunim_partner_agent", JSON.stringify(freshMe));
          }
        }
      }

      // 2. Fetch All Stores
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeData) {
        setAllStores(storeData);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      captureLiveGPS();
    }
  }, [isLoggedIn]);

  // =========================================================================
  // DYNAMIC LIVE GPS CAPTURE & REVERSE GEOCODING
  // =========================================================================
  const captureLiveGPS = () => {
    if (!navigator.geolocation) {
      setLiveLocationText(currentAgent?.city || "Location Not Available");
      return;
    }

    setLiveLocationText("Detecting area...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationCoords({ lat, lng });

        try {
          // Dynamic Reverse Geocoding using OpenStreetMap
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || "";
            const city = data.address.city || data.address.state_district || data.address.state || "";
            const placeStr = suburb ? `${suburb}, ${city}` : (city || `${lat.toFixed(3)}, ${lng.toFixed(3)}`);
            setLiveLocationText(placeStr);
          } else {
            setLiveLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch (e) {
          // Fallback to coordinates
          setLiveLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      (err) => {
        console.warn("GPS Location error:", err);
        setLiveLocationText(currentAgent?.city || "GPS Off");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // =========================================================================
  // AUTHENTICATION LOGIN
  // =========================================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoadingAuth(true);

    try {
      const cleanMobile = loginMobile.trim().replace(/[^0-9]/g, "").slice(-10);
      
      const { data, error } = await supabase
        .from('stores')
        .select('store_logo')
        .eq('owner_mobile', 'admin_fse_config')
        .single();

      if (!data || !data.store_logo) {
        setAuthError("FSE system config not initialized. Contact Admin.");
        return;
      }

      const config = JSON.parse(data.store_logo.substring(9));
      const registeredAgents = config.agents || [];
      const matchedAgent = registeredAgents.find((a: any) => 
        a.mobile === cleanMobile && a.password.trim() === loginPassword.trim()
      );

      if (!matchedAgent) {
        setAuthError("Invalid Mobile Number or Password. Please contact Admin.");
        return;
      }

      if (matchedAgent.status === "inactive") {
        setAuthError("Your Executive Account is suspended. Please contact Admin.");
        return;
      }

      // Save Remember Me
      if (rememberMe) {
        localStorage.setItem("instamunim_partner_saved_mobile", cleanMobile);
        localStorage.setItem("instamunim_partner_saved_pass", loginPassword);
      } else {
        localStorage.removeItem("instamunim_partner_saved_mobile");
        localStorage.removeItem("instamunim_partner_saved_pass");
      }

      // Success
      setCurrentAgent(matchedAgent);
      setIsLoggedIn(true);
      localStorage.setItem("instamunim_partner_agent", JSON.stringify(matchedAgent));

      // Trigger Discord Alert for Executive Login
      sendDiscordAlert(
        "👤 Field Executive Logged In",
        `Sales Executive **${matchedAgent.name}** logged into Partner App.`,
        [
          { name: "Executive Name", value: matchedAgent.name, inline: true },
          { name: "Mobile", value: matchedAgent.mobile, inline: true },
          { name: "City", value: matchedAgent.city || "N/A", inline: true },
          { name: "Daily Target", value: `${matchedAgent.target_daily || 2} Stores/Day`, inline: true }
        ],
        15105570
      );
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Logout
  const handleLogout = () => {
    // Trigger Discord Alert for Logout
    if (currentAgent) {
      sendDiscordAlert(
        "🚪 Field Executive Logged Out",
        `Executive **${currentAgent.name}** logged out of Partner App.`,
        [
          { name: "Executive", value: currentAgent.name, inline: true },
          { name: "Mobile", value: currentAgent.mobile, inline: true },
          { name: "Time", value: format(new Date(), "hh:mm a, dd MMM yyyy"), inline: true }
        ],
        10066329
      );
    }
    localStorage.removeItem("instamunim_partner_agent");
    setIsLoggedIn(false);
    setCurrentAgent(null);
    setIsOnDuty(false);
    setActiveTab("dashboard");
  };

  // Toggle Attendance
  const handleToggleAttendance = () => {
    if (!isOnDuty) {
      captureLiveGPS();
      setPunchInTime(format(new Date(), "hh:mm a"));
      setIsOnDuty(true);

      // Trigger Discord Alert
      sendDiscordAlert(
        "⚡ Field Executive Punched In (Duty Started)",
        `Executive **${currentAgent?.name}** started field duty. Status: **ON DUTY (IN FIELD)**.`,
        [
          { name: "Executive", value: currentAgent?.name || "N/A", inline: true },
          { name: "Mobile", value: currentAgent?.mobile || "N/A", inline: true },
          { name: "Location", value: liveLocationText || "GPS Area", inline: false },
          { name: "Time", value: format(new Date(), "hh:mm a, dd MMM yyyy"), inline: true }
        ],
        3447003
      );
      alert("🎉 Day Started! You are now ON DUTY. Best of luck with today's targets! 🚀");
    } else {
      if (confirm("Are you sure you want to punch out and end your field day?")) {
        setIsOnDuty(false);

        // Trigger Discord Alert
        sendDiscordAlert(
          "🛑 Field Executive Punched Out (Duty Ended)",
          `Executive **${currentAgent?.name}** ended field duty. Status: **OFF DUTY**.`,
          [
            { name: "Executive", value: currentAgent?.name || "N/A", inline: true },
            { name: "Mobile", value: currentAgent?.mobile || "N/A", inline: true },
            { name: "Time", value: format(new Date(), "hh:mm a, dd MMM yyyy"), inline: true }
          ],
          15548997
        );
        alert("Day Completed! Great work today! 👍");
      }
    }
  };

  // Photo Capture for Shop
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setShopPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Profile Photo Upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Photo = reader.result as string;
      
      try {
        // Update agent in local state
        const updatedAgent = { ...currentAgent, photo: base64Photo };
        setCurrentAgent(updatedAgent);
        localStorage.setItem("instamunim_partner_agent", JSON.stringify(updatedAgent));

        // Update in Supabase FSE config
        const { data: fseData } = await supabase
          .from('stores')
          .select('store_logo')
          .eq('owner_mobile', 'admin_fse_config')
          .single();

        if (fseData && fseData.store_logo) {
          const cfg = JSON.parse(fseData.store_logo.substring(9));
          const updatedAgents = (cfg.agents || []).map((a: any) => 
            a.mobile === currentAgent.mobile ? { ...a, photo: base64Photo } : a
          );
          const newCfg = { ...cfg, agents: updatedAgents };

          await supabase
            .from('stores')
            .update({ store_logo: 'JSON_CFG:' + JSON.stringify(newCfg) })
            .eq('owner_mobile', 'admin_fse_config');
          
          setFseConfig(newCfg);
        }
        alert("🎉 Profile Photo updated successfully!");
      } catch (err: any) {
        alert("Failed to update photo: " + err.message);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Rapid Onboarding
  const handleOnboardStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !ownerMobile) {
      alert("Please fill all required store details!");
      return;
    }

    const cleanMobile = ownerMobile.trim().replace(/[^0-9]/g, "").slice(-10);
    if (cleanMobile.length !== 10) {
      alert("Please enter a valid 10-digit customer mobile number!");
      return;
    }

    if (allStores.some(s => s.owner_mobile === cleanMobile)) {
      alert("A store with this mobile number is already registered in InstaMunim!");
      return;
    }

    setIsOnboarding(true);
    try {
      const generatedPass = cleanMobile.slice(-4);
      const now = new Date();
      const isYearly = selectedPlan === "yearly";
      const planDays = isYearly ? 365 : 30;
      const planFee = isYearly ? 2500 : 500;
      const monthlyRent = isYearly ? 2500 : 250;
      const expiry = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);

      const storeConfig = {
        onboardedBy: currentAgent?.name || "Field Executive",
        onboardedAgentName: currentAgent?.name || "Field Executive",
        onboardedAgentMobile: currentAgent?.mobile || "",
        onboardingFee: planFee,
        selectedPlan: isYearly ? "Annual Super Saver (₹2,500 / Year)" : "Starter Onboarding (₹500 / 1st Month)",
        paymentMode: paymentMode,
        businessType: businessCategory,
        shopPhoto: shopPhoto || null,
        lat: locationCoords?.lat || null,
        lng: locationCoords?.lng || null,
        locationAddress: liveLocationText || null,
        onboardingDate: now.toISOString(),
        voiceCashier: true,
        aiScanner: false,
        whatsappMarketing: true,
        smartCrm: true,
        rentTracker: true,
        barcodeBilling: true,
        unlimitedCloud: true,
        exportSales: true,
        stockManagement: true,
        udhaarKhata: true,
        inventoryMgmt: true,
        gstInvoicing: true,
        reportsCrm: true
      };

      const payload = {
        owner_mobile: cleanMobile,
        store_name: storeName.trim(),
        password: generatedPass,
        monthly_rent: monthlyRent,
        subscription_expiry: expiry.toISOString(),
        store_logo: 'JSON_CFG:' + JSON.stringify(storeConfig)
      };

      const { data, error } = await supabase
        .from('stores')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Success
      const successData = {
        store_name: storeName,
        owner_mobile: cleanMobile,
        password: generatedPass,
        payment_mode: paymentMode,
        fee: planFee,
        plan_name: isYearly ? "Annual Super Saver (1 Full Year)" : "Starter (1st Month Active)",
        expiry_date: format(expiry, "dd MMM yyyy")
      };
      setOnboardingSuccess(successData);

      // Trigger Instant Discord Alert for New Store Onboarded
      sendDiscordAlert(
        "🛍️ New Store Onboarded by Field Executive!",
        `Executive **${currentAgent?.name || "Field Executive"}** has onboarded **${storeName.trim()}**! 🎉`,
        [
          { name: "Store Name", value: storeName.trim(), inline: true },
          { name: "Owner Mobile", value: cleanMobile, inline: true },
          { name: "Login Password", value: generatedPass, inline: true },
          { name: "Onboarded By", value: `${currentAgent?.name || "Executive"} (${currentAgent?.mobile || ""})`, inline: true },
          { name: "Plan & Fee", value: `₹${planFee} (${isYearly ? "Yearly" : "Monthly"} - ${paymentMode})`, inline: true },
          { name: "Validity", value: format(expiry, "dd MMM yyyy"), inline: true },
          { name: "Category", value: businessCategory, inline: true },
          { name: "Location", value: liveLocationText || "GPS Captured", inline: false }
        ],
        5763719
      );

      // Reset form
      setStoreName("");
      setOwnerName("");
      setOwnerMobile("");
      setShopPhoto(null);
      fetchData();
    } catch (err: any) {
      alert("Onboarding failed: " + (err.message || err));
    } finally {
      setIsOnboarding(false);
    }
  };

  // Save Lead
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadStoreName || !leadMobile) {
      alert("Please enter shop name and mobile!");
      return;
    }

    const newLead = {
      id: `lead_${Date.now()}`,
      agent_id: currentAgent?.id,
      agent_mobile: currentAgent?.mobile,
      store_name: leadStoreName,
      owner_name: leadOwnerName,
      mobile: leadMobile.trim().replace(/[^0-9]/g, "").slice(-10),
      interest_level: leadInterest,
      revisit_date: leadRevisitDate || format(new Date(), "yyyy-MM-dd"),
      notes: leadNotes,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const updatedLeads = [newLead, ...(fseConfig.leads || [])];
    const updatedConfig = { ...fseConfig, leads: updatedLeads };

    await supabase
      .from('stores')
      .update({ store_logo: 'JSON_CFG:' + JSON.stringify(updatedConfig) })
      .eq('owner_mobile', 'admin_fse_config');

    setFseConfig(updatedConfig);
    setLeadStoreName("");
    setLeadOwnerName("");
    setLeadMobile("");
    setLeadNotes("");
    setShowAddLeadModal(false);
    alert("🎉 Lead Saved Successfully!");
  };

  // Convert Lead
  const handleConvertLead = (lead: any) => {
    setStoreName(lead.store_name);
    setOwnerName(lead.owner_name || "");
    setOwnerMobile(lead.mobile);
    setActiveTab("onboard");
  };

  // Filter Agent's Stores with dynamic collected fee
  const myStores = allStores.filter(s => {
    if (!s.store_logo || !s.store_logo.startsWith("JSON_CFG:")) return false;
    try {
      const cfg = JSON.parse(s.store_logo.substring(9));
      return cfg.onboardedAgentMobile === currentAgent?.mobile || cfg.onboardedAgentName === currentAgent?.name;
    } catch {
      return false;
    }
  }).map(s => {
    const cfg = JSON.parse(s.store_logo.substring(9));
    return {
      ...s,
      paymentMode: cfg.paymentMode || "UPI",
      onboardingFee: typeof cfg.onboardingFee === "number" ? cfg.onboardingFee : (Number(cfg.onboardingFee) || 500),
      onboardingDate: cfg.onboardingDate || s.created_at,
      selectedPlan: cfg.selectedPlan || "Starter"
    };
  });

  // Performance Calculations
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayStores = myStores.filter(s => format(new Date(s.onboardingDate), "yyyy-MM-dd") === todayStr);
  const totalMonthCount = myStores.length;
  const targetDaily = currentAgent?.target_daily || 2;

  // Milestone (40+ = ₹100/store)
  const milestoneReached = totalMonthCount >= 40;
  const bonusStores = Math.max(0, totalMonthCount - 40);
  const milestoneIncentiveEarned = bonusStores * 100;

  // Real-time Cash in Hand based on dynamic fee per store (supporting discounts & changes)
  const totalCashCollected = myStores
    .filter(s => s.paymentMode === "Cash")
    .reduce((sum: number, s: any) => sum + (Number(s.onboardingFee) || 0), 0);
  const mySettlements = (fseConfig.settlements || []).filter((set: any) => set.agent_mobile === currentAgent?.mobile);
  const totalCashSettled = mySettlements.reduce((sum: number, set: any) => sum + (Number(set.amount) || 0), 0);
  const pendingCashInHand = Math.max(0, totalCashCollected - totalCashSettled);

  // My Leads
  const myLeads = (fseConfig.leads || []).filter((l: any) => l.agent_mobile === currentAgent?.mobile);

  // =========================================================================
  // LIGHT THEME LOGIN SCREEN
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div style={{ 
        background: '#f8fafc', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif' 
      }}>
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '24px', 
          maxWidth: '420px', 
          width: '100%', 
          padding: '36px 28px', 
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07)' 
        }}>
          
          {/* BRAND LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ 
              width: '68px', 
              height: '68px', 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              borderRadius: '20px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 10px 20px rgba(249, 115, 22, 0.25)', 
              marginBottom: '14px' 
            }}>
              <Award size={34} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
              InstaMunim Partner
            </h1>
            <p style={{ color: '#ea580c', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', marginTop: '4px', textTransform: 'uppercase' }}>
              Field Sales & Onboarding App
            </p>
          </div>

          {authError && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#dc2626', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 700, 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <AlertTriangle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* MOBILE INPUT */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Registered Mobile Number
              </label>
              <input 
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={loginMobile}
                onChange={e => setLoginMobile(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '50px', 
                  background: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '12px', 
                  padding: '0 16px', 
                  color: '#0f172a', 
                  fontSize: '15px', 
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* PASSWORD INPUT WITH EYE TOGGLE */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Password / PIN
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '50px', 
                    background: '#f8fafc', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '0 48px 0 16px', 
                    color: '#0f172a', 
                    fontSize: '15px', 
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div 
              onClick={() => setRememberMe(!rememberMe)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', marginTop: '2px' }}
            >
              {rememberMe ? (
                <CheckSquare size={18} color="#ea580c" />
              ) : (
                <Square size={18} color="#94a3b8" />
              )}
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                Remember Password
              </span>
            </div>

            {/* LOGIN BUTTON */}
            <button 
              type="submit"
              disabled={isLoadingAuth}
              style={{ 
                marginTop: '10px',
                height: '52px', 
                borderRadius: '14px', 
                border: 'none', 
                background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                color: '#ffffff', 
                fontWeight: 900, 
                fontSize: '15px', 
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoadingAuth ? "Authenticating..." : "START FIELD WORK"} <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '24px' }}>
            Account credentials are created by <strong>Admin</strong>.
          </p>

        </div>
      </div>
    );
  }

  // =========================================================================
  // LIGHT THEME MAIN APP INTERFACE (FULLY SCROLLABLE)
  // =========================================================================
  return (
    <div style={{ 
      background: '#f8fafc', 
      minHeight: '100vh', 
      color: '#0f172a', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      
      {/* TOP HEADER */}
      <header style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '14px 20px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '650px', margin: '0 auto' }}>
          
          {/* PROFILE AVATAR (PHOTO OR INITIAL) & LIVE LOCATION */}
          <div 
            onClick={() => setActiveTab("profile")}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative' }}>
              {currentAgent?.photo ? (
                <img 
                  src={currentAgent.photo} 
                  alt={currentAgent.name} 
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '14px', 
                    objectFit: 'cover', 
                    border: '2px solid #ea580c',
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)' 
                  }} 
                />
              ) : (
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 900, 
                  fontSize: '18px', 
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)'
                }}>
                  {currentAgent?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}

              {/* Duty Status Indicator Dot */}
              <span style={{ 
                position: 'absolute', 
                bottom: '-2px', 
                right: '-2px', 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: isOnDuty ? '#10b981' : '#94a3b8',
                border: '2px solid #ffffff'
              }} />
            </div>

            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                {currentAgent?.name}
              </h2>
              
              {/* DYNAMIC LIVE GPS LOCATION */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <MapPin size={11} color="#ea580c" />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {liveLocationText}
                </span>
              </div>
            </div>
          </div>

          {/* DUTY TOGGLE & LOGOUT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleToggleAttendance}
              style={{ 
                padding: '7px 12px', 
                borderRadius: '10px', 
                border: 'none', 
                background: isOnDuty ? '#fee2e2' : '#dcfce7', 
                color: isOnDuty ? '#dc2626' : '#15803d',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Power size={13} /> {isOnDuty ? "Punch Out" : "Punch In"}
            </button>

            <button 
              onClick={handleLogout}
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                background: '#f1f5f9', 
                border: '1px solid #e2e8f0', 
                color: '#64748b', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* ===================================================================== */}
      {/* SCROLLABLE APP BODY CONTAINER */}
      {/* ===================================================================== */}
      <main style={{ 
        flex: 1, 
        maxWidth: '650px', 
        width: '100%', 
        margin: '0 auto', 
        padding: '16px 16px 120px 16px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>

        {/* ===================================================================== */}
        {/* TAB 1: DASHBOARD (LIGHT THEME) */}
        {/* ===================================================================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* TODAY SCORECARD */}
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '20px', 
              padding: '22px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Today's Target
                  </span>
                  <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                    {todayStores.length} <span style={{ fontSize: '16px', color: '#64748b' }}>/ {targetDaily} Stores</span>
                  </h3>
                </div>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '10px', 
                  background: todayStores.length >= targetDaily ? '#dcfce7' : '#ffedd5',
                  color: todayStores.length >= targetDaily ? '#15803d' : '#c2410c',
                  fontWeight: 900,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {todayStores.length >= targetDaily ? "🎯 Target Completed!" : "🔥 In Progress"}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(100, (todayStores.length / targetDaily) * 100)}%`, 
                  background: todayStores.length >= targetDaily ? '#10b981' : 'linear-gradient(90deg, #f97316, #ea580c)' 
                }} />
              </div>

              {/* ONBOARD BUTTON */}
              <button 
                onClick={() => setActiveTab("onboard")}
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                  color: '#ffffff', 
                  fontWeight: 900, 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.25)'
                }}
              >
                <UserPlus size={18} /> + Onboard New Store Now
              </button>
            </div>

            {/* 40+ MILESTONE SUPER INCENTIVE CARD */}
            <div style={{ 
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', 
              borderRadius: '20px', 
              padding: '20px', 
              border: '1px solid #bfdbfe' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#2563eb" />
                  <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#1e3a8a' }}>40 Stores Milestone</h4>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 900, background: '#2563eb', color: '#ffffff', padding: '3px 8px', borderRadius: '6px' }}>
                  +₹100 / Store Bonus
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                  <span style={{ color: '#1e40af' }}>Monthly Stores: {totalMonthCount} / 40</span>
                  <span style={{ color: milestoneReached ? '#15803d' : '#ea580c' }}>
                    {milestoneReached ? "🎉 Super Incentive Active!" : `${40 - totalMonthCount} Stores to Unlock`}
                  </span>
                </div>
                <div style={{ height: '8px', background: '#bfdbfe', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (totalMonthCount / 40) * 100)}%`, 
                    background: milestoneReached ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #2563eb)' 
                  }} />
                </div>
              </div>

              {milestoneIncentiveEarned > 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#15803d', fontWeight: 800 }}>Super Incentive Earned This Month</p>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a' }}>+₹{milestoneIncentiveEarned.toLocaleString()}</h3>
                  <p style={{ fontSize: '10px', color: '#15803d', fontWeight: 700 }}>({bonusStores} Extra Stores × ₹100 / Store)</p>
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: '#1e40af', lineHeight: 1.4, margin: 0 }}>
                  Cross 40 store onboardings this month to automatically unlock <strong>₹100 Per Store Incentive</strong> on all stores above 40! 🚀
                </p>
              )}
            </div>

            {/* CASH IN HAND LEDGER CARD */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '18px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 4px 15px -3px rgba(0,0,0,0.04)'
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Cash to Submit (Admin)
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: pendingCashInHand > 0 ? '#dc2626' : '#16a34a', marginTop: '2px' }}>
                  ₹{pendingCashInHand.toLocaleString()}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Settled: ₹{totalCashSettled.toLocaleString()}</span>
                <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 800, marginTop: '2px' }}>Standard ₹500/Store</div>
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: RAPID ONBOARDING FORM (LIGHT THEME & FULL SCROLL) */}
        {/* ===================================================================== */}
        {activeTab === "onboard" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* SUCCESS BANNER OVERLAY */}
            {onboardingSuccess && (
              <div style={{ 
                background: '#f0fdf4', 
                borderRadius: '20px', 
                padding: '24px', 
                border: '1px solid #86efac', 
                textAlign: 'center' 
              }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: '#16a34a', 
                  color: '#ffffff', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '14px' 
                }}>
                  <Check size={30} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>Store Activated Successfully!</h3>
                <p style={{ color: '#15803d', fontSize: '13px', marginTop: '2px' }}>
                  {onboardingSuccess.store_name} is now LIVE on InstaMunim.
                </p>

                <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', margin: '16px 0', textAlign: 'left', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Login Mobile:</span>
                    <strong style={{ color: '#0f172a' }}>{onboardingSuccess.owner_mobile}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Password:</span>
                    <strong style={{ color: '#ea580c', fontFamily: 'monospace', fontSize: '15px' }}>{onboardingSuccess.password}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Plan Activated:</span>
                    <strong style={{ color: '#0f172a' }}>{onboardingSuccess.plan_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Plan Expiry:</span>
                    <strong style={{ color: '#16a34a' }}>{onboardingSuccess.expiry_date}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Fee Paid:</span>
                    <strong style={{ color: '#16a34a' }}>₹{onboardingSuccess.fee} ({onboardingSuccess.payment_mode})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a 
                    href={`https://wa.me/91${onboardingSuccess.owner_mobile}?text=${encodeURIComponent(`Namaste ${onboardingSuccess.store_name}! 🎉\n\nAapka InstaMunim Smart POS account successfully active ho gaya hai!\n\n📋 Plan: ${onboardingSuccess.plan_name}\n📅 Valid Till: ${onboardingSuccess.expiry_date}\n\n📱 Login Mobile: ${onboardingSuccess.owner_mobile}\n🔑 Password: ${onboardingSuccess.password}\n\n👉 Download Android App: https://play.google.com/store/apps/details?id=com.zainul.instamunimpos\n👉 Web POS: https://www.instamunim.com\n\nSupport Helpline: +91 7838229178`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, height: '46px', background: '#25D366', color: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 900, textDecoration: 'none', fontSize: '13px' }}
                  >
                    <MessageSquare size={16} /> Send WhatsApp Pass
                  </a>

                  <button 
                    onClick={() => setOnboardingSuccess(null)}
                    style={{ padding: '0 20px', height: '46px', background: '#0f172a', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                  >
                    + Next Store
                  </button>
                </div>
              </div>
            )}

            {/* ONBOARDING FORM */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '24px',
              boxShadow: '0 4px 20px -3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Store size={24} color="#ea580c" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Rapid Merchant Onboarding</h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Takes less than 30 seconds to activate.</p>
                </div>
              </div>

              <form onSubmit={handleOnboardStore} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* SHOP NAME */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Shop / Store Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bilal Mobile & Electronics"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    style={{ width: '100%', height: '50px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 16px', color: '#0f172a', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                {/* OWNER NAME & MOBILE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      Owner Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Salman Khan"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      style={{ width: '100%', height: '50px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 16px', color: '#0f172a', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      Owner Mobile *
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="10-digit number"
                      value={ownerMobile}
                      onChange={e => setOwnerMobile(e.target.value)}
                      style={{ width: '100%', height: '50px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 16px', color: '#0f172a', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* BUSINESS CATEGORY */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Business Category
                  </label>
                  <select 
                    value={businessCategory}
                    onChange={e => setBusinessCategory(e.target.value)}
                    style={{ width: '100%', height: '50px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 16px', color: '#0f172a', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Restaurant/Cafe">Restaurant / Cafe / Food Stall</option>
                    <option value="Kirana/Grocery">Kirana / Grocery / General Store</option>
                    <option value="Saloon/Spa">Saloon / Spa / Beauty Parlour</option>
                    <option value="Clothing/Retail">Clothing / Footwear / Retail Shop</option>
                    <option value="Laundry">Laundry Business</option>
                    <option value="Electric">Electric Shop</option>
                    <option value="Automobile">Automobile Parts Shop</option>
                    <option value="Gym">GYM / Fitness Center</option>
                    <option value="Cosmetic">Cosmetic Shop</option>
                    <option value="Stationary">Stationary & Book Shop</option>
                    <option value="Mobile/Electronics">Mobile & Electronics Shop</option>
                  </select>
                </div>

                {/* SHOP CAMERA PHOTO */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Shop Board / Counter Photo (Live Camera)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ 
                      flex: 1, 
                      height: '50px', 
                      background: '#f8fafc', 
                      border: '1px dashed #cbd5e1', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      color: '#ea580c', 
                      cursor: 'pointer', 
                      fontWeight: 800, 
                      fontSize: '13px' 
                    }}>
                      <Camera size={18} /> {shopPhoto ? "Photo Clicked (Retake)" : "Open Camera & Click"}
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                    </label>
                    {shopPhoto && (
                      <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #16a34a' }}>
                        <img src={shopPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* PLAN SELECTION DROPDOWN */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Select Subscription & Onboarding Plan *
                  </label>
                  <select 
                    value={selectedPlan}
                    onChange={e => setSelectedPlan(e.target.value as "starter" | "yearly")}
                    style={{ width: '100%', height: '52px', background: '#f8fafc', border: '2px solid #ea580c', borderRadius: '12px', padding: '0 16px', color: '#0f172a', fontSize: '14px', fontWeight: 800, outline: 'none' }}
                  >
                    <option value="starter">⚡ Starter Plan — ₹500 (Includes 1st Month + Full Setup)</option>
                    <option value="yearly">💎 Annual Super Saver — ₹2,500 / 1 Year (FREE Setup • Save ₹1,000)</option>
                  </select>
                </div>

                {/* PAYMENT SECTION */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                        {selectedPlan === "yearly" ? "Plan: Annual Full Year" : "Plan: Starter Onboarding"}
                      </span>
                      <h4 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
                        {selectedPlan === "yearly" ? "₹2,500" : "₹500"} 
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          {selectedPlan === "yearly" ? " (Valid 365 Days)" : " (Includes 1st Month)"}
                        </span>
                      </h4>
                    </div>
                    <span style={{ fontSize: '10px', color: selectedPlan === "yearly" ? '#15803d' : '#0284c7', fontWeight: 800, background: selectedPlan === "yearly" ? '#dcfce7' : '#e0f2fe', padding: '4px 8px', borderRadius: '6px' }}>
                      {selectedPlan === "yearly" ? "✓ ₹0 Renewal for 1 Yr" : "₹250/Mo Thereafter"}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setPaymentMode("UPI")}
                      style={{ 
                        height: '46px', 
                        borderRadius: '10px', 
                        border: paymentMode === "UPI" ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: paymentMode === "UPI" ? '#eff6ff' : '#ffffff',
                        color: paymentMode === "UPI" ? '#1d4ed8' : '#64748b',
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <QrCode size={16} /> Admin UPI QR
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMode("Cash")}
                      style={{ 
                        height: '46px', 
                        borderRadius: '10px', 
                        border: paymentMode === "Cash" ? '2px solid #d97706' : '1px solid #cbd5e1',
                        background: paymentMode === "Cash" ? '#fffbeb' : '#ffffff',
                        color: paymentMode === "Cash" ? '#b45309' : '#64748b',
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <IndianRupee size={16} /> Cash in Hand
                    </button>
                  </div>

                  {/* QR CODE IF UPI SELECTED */}
                  {paymentMode === "UPI" && (
                    <div style={{ marginTop: '14px', background: '#ffffff', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        Ask Shopkeeper to Scan & Pay {selectedPlan === "yearly" ? "₹2,500" : "₹500"}:
                      </p>
                      <div style={{ display: 'inline-block', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=7838229178@ptaxis&pn=InstaMunim&am=${selectedPlan === "yearly" ? "2500" : "500"}&cu=INR`} 
                          alt="Admin UPI QR" 
                          style={{ width: '150px', height: '150px', display: 'block' }}
                        />
                      </div>
                      <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: 800, marginTop: '8px' }}>✓ Money directly goes to Admin Account</p>
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                  type="submit"
                  disabled={isOnboarding}
                  style={{ 
                    marginTop: '8px',
                    height: '52px', 
                    borderRadius: '14px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #16a34a, #15803d)', 
                    color: '#ffffff', 
                    fontWeight: 900, 
                    fontSize: '15px', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(22, 163, 74, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isOnboarding ? "Activating Store..." : "⚡ ACTIVATE STORE INSTANTLY"}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: LEADS & PIPELINE (LIGHT THEME) */}
        {/* ===================================================================== */}
        {activeTab === "leads" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Leads & Follow-ups</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Track interested merchants to close later.</p>
              </div>
              <button 
                onClick={() => setShowAddLeadModal(true)}
                style={{ padding: '10px 16px', background: '#ea580c', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)' }}
              >
                + Add Lead
              </button>
            </div>

            {/* LEADS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myLeads.length === 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No pending leads. Tap <strong>"+ Add Lead"</strong> when a shopkeeper asks to revisit!
                </div>
              ) : (
                myLeads.map((lead: any) => (
                  <div key={lead.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '15px' }}>{lead.store_name}</strong>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: lead.interest_level === 'Hot' ? '#fee2e2' : lead.interest_level === 'Warm' ? '#fef3c7' : '#e0f2fe',
                          color: lead.interest_level === 'Hot' ? '#dc2626' : lead.interest_level === 'Warm' ? '#d97706' : '#0284c7'
                        }}>
                          {lead.interest_level === 'Hot' ? '🔥 HOT' : lead.interest_level === 'Warm' ? '🟡 WARM' : '❄️ COLD'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        {lead.owner_name ? `${lead.owner_name} • ` : ''}{lead.mobile}
                      </p>
                      {lead.notes && (
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a 
                        href={`tel:+91${lead.mobile}`}
                        style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', textDecoration: 'none' }}
                      >
                        <Phone size={16} />
                      </a>
                      <button 
                        onClick={() => handleConvertLead(lead)}
                        style={{ padding: '0 14px', height: '38px', borderRadius: '10px', background: '#16a34a', border: 'none', color: '#ffffff', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}
                      >
                        Convert
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ADD LEAD MODAL */}
            {showAddLeadModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '28px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <button onClick={() => setShowAddLeadModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>

                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Save Store Follow-up Lead</h3>

                  <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="text" 
                      required 
                      placeholder="Shop Name *" 
                      value={leadStoreName} 
                      onChange={e => setLeadStoreName(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', color: '#0f172a', outline: 'none' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Owner Name" 
                      value={leadOwnerName} 
                      onChange={e => setLeadOwnerName(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', color: '#0f172a', outline: 'none' }} 
                    />
                    <input 
                      type="tel" 
                      required 
                      placeholder="10-digit Mobile Number *" 
                      value={leadMobile} 
                      onChange={e => setLeadMobile(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', color: '#0f172a', outline: 'none' }} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <select 
                        value={leadInterest} 
                        onChange={e => setLeadInterest(e.target.value as any)}
                        style={{ width: '100%', height: '46px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', color: '#0f172a', outline: 'none' }}
                      >
                        <option value="Hot">🔥 Hot (Ready Tomorrow)</option>
                        <option value="Warm">🟡 Warm (Next Week)</option>
                        <option value="Cold">❄️ Cold (Thinking)</option>
                      </select>

                      <input 
                        type="date" 
                        value={leadRevisitDate} 
                        onChange={e => setLeadRevisitDate(e.target.value)}
                        style={{ width: '100%', height: '46px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', color: '#0f172a', outline: 'none' }} 
                      />
                    </div>

                    <textarea 
                      placeholder="Notes (e.g. Owner absent, come at 4 PM)" 
                      value={leadNotes} 
                      onChange={e => setLeadNotes(e.target.value)}
                      style={{ width: '100%', height: '60px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', color: '#0f172a', resize: 'none', outline: 'none' }}
                    />

                    <button 
                      type="submit" 
                      style={{ height: '48px', background: '#ea580c', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '6px' }}
                    >
                      Save Lead
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: MY STORES (LIGHT THEME) */}
        {/* ===================================================================== */}
        {activeTab === "stores" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>My Onboarded Stores ({myStores.length})</h3>

            {myStores.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                You haven't onboarded any stores yet. Tap <strong>"Onboard"</strong> to start!
              </div>
            ) : (
              myStores.map(store => (
                <div key={store.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ color: '#0f172a', fontSize: '15px' }}>{store.store_name}</strong>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{store.owner_mobile}</p>
                    </div>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      background: store.paymentMode === 'UPI' ? '#eff6ff' : '#fef3c7',
                      color: store.paymentMode === 'UPI' ? '#1d4ed8' : '#d97706',
                      fontWeight: 800,
                      fontSize: '10px'
                    }}>
                      ₹{store.onboardingFee} ({store.paymentMode})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
                    <span>Onboarded: {format(new Date(store.onboardingDate), "dd MMM yyyy")}</span>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>● Active</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: DIGITAL PITCH KIT (COMPREHENSIVE SELLING POINTS) */}
        {/* ===================================================================== */}
        {activeTab === "pitch" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Digital Pitch Kit & Rate Card</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Show these key benefits to close shopkeepers instantly on the spot.</p>
            </div>

            {/* PRICING CARD */}
            <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', borderRadius: '20px', padding: '20px', color: '#ffffff', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                Most Affordable in India
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', marginBottom: '2px' }}>
                Only ₹250 <span style={{ fontSize: '14px', fontWeight: 600 }}>/ Month</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#ffedd5', margin: 0 }}>
                (₹500 One-time Activation includes first month subscription)
              </p>
            </div>

            {/* 10 FEATURE BENEFITS CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. WHATSAPP MARKETING */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Share2 size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>WhatsApp Marketing</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Send festival greetings, special offers, and discount catalogs directly to customer WhatsApp in 1-click.
                  </p>
                </div>
              </div>

              {/* 2. SMART CRM & CUSTOMER KHATA */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Smart CRM & Customer Ledger</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Track frequent customers, total spending, and automatic WhatsApp reminders for Udhaar balances.
                  </p>
                </div>
              </div>

              {/* 3. RENT & EXPENSE TRACKER */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Rent & Shop Expense Tracker</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Track monthly shop rent, staff salaries, electricity bills, and daily tea/snacks expenses easily.
                  </p>
                </div>
              </div>

              {/* 4. BARCODE BILLING */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Rapid Barcode Billing</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Instant item scanning with mobile camera or laser barcode scanner for lightning fast checkout.
                  </p>
                </div>
              </div>

              {/* 5. SMART AUTO-GENERATED BARCODE / QR FOR PAYMENTS */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Smart Auto-Generated UPI QR</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Every bill generates a dynamic UPI QR code with exact amount prefilled for direct bank settlement.
                  </p>
                </div>
              </div>

              {/* 6. VOICE CASHIER SOUNDBOX */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Volume2 size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>In-App Voice Soundbox (9 Languages)</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    No need to buy costly ₹1,500 soundbox hardware! Speaks payment alerts loud & clear in Hindi, English, etc.
                  </p>
                </div>
              </div>

              {/* 7. UNLIMITED CLOUD RECORD */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Database size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Unlimited Cloud Records</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    100% lifetime automated cloud backup. Change phone anytime without losing a single rupee record.
                  </p>
                </div>
              </div>

              {/* 8. EXPORT SALES & REPORTS */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DownloadCloud size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Export Sales & GST Reports</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    1-Click download of daily/monthly sales in Excel, PDF, and GST-compliant formats for CAs.
                  </p>
                </div>
              </div>

              {/* 9. STOCK & INVENTORY MANAGEMENT */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>Stock & Low Inventory Alerts</h4>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    Auto-deducts stock upon billing and sends instant alerts before items run out of stock.
                  </p>
                </div>
              </div>

            </div>

            {/* LIVE DEMO LINK BUTTON */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Show live web app demo on merchant phone:</p>
              <a 
                href="https://www.instamunim.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ea580c', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '13px', textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Open InstaMunim Live Demo
              </a>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 6: PROFILE (PHOTO UPLOAD & EXECUTIVE DETAILS) */}
        {/* ===================================================================== */}
        {activeTab === "profile" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* PROFILE HEADER CARD */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '24px', 
              padding: '28px 20px', 
              textAlign: 'center',
              boxShadow: '0 4px 20px -3px rgba(0,0,0,0.04)'
            }}>
              
              {/* AVATAR WITH PHOTO UPLOAD TRIGGER */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
                {currentAgent?.photo ? (
                  <img 
                    src={currentAgent.photo} 
                    alt={currentAgent.name} 
                    style={{ width: '90px', height: '90px', borderRadius: '26px', objectFit: 'cover', border: '3px solid #ea580c', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.2)' }}
                  />
                ) : (
                  <div style={{ width: '90px', height: '90px', borderRadius: '26px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '36px', fontWeight: 900, boxShadow: '0 8px 20px rgba(249, 115, 22, 0.2)' }}>
                    {currentAgent?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}

                <label style={{ 
                  position: 'absolute', 
                  bottom: '-4px', 
                  right: '-4px', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: '#0f172a', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  <Camera size={15} />
                  <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{currentAgent?.name}</h2>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                {currentAgent?.mobile} • Field Executive
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', marginTop: '10px' }}>
                <MapPin size={12} color="#ea580c" />
                <span style={{ fontSize: '11px', color: '#334155', fontWeight: 800 }}>Assigned City: {currentAgent?.city}</span>
              </div>
            </div>

            {/* EXECUTIVE METRICS SUMMARY */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '14px' }}>Executive Assignment Details</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#64748b' }}>Daily Onboarding Target:</span>
                  <strong style={{ color: '#0f172a' }}>{currentAgent?.target_daily || 2} Stores / Day</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#64748b' }}>Total Stores Onboarded:</span>
                  <strong style={{ color: '#ea580c' }}>{myStores.length} Stores</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#64748b' }}>Account Status:</span>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>● Active in InstaMunim System</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Admin Contact:</span>
                  <a href="tel:+917838229178" style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}>+91 7838229178</a>
                </div>
              </div>
            </div>

            {/* SOCIAL COMMUNITY & OFFICIAL LINKS */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '16px 20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>Official Social Handles</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                
                {/* FACEBOOK BUTTON */}
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    borderRadius: '12px', 
                    background: '#1877F2', 
                    color: '#ffffff', 
                    textDecoration: 'none', 
                    fontWeight: 800, 
                    fontSize: '12px',
                    boxShadow: '0 4px 10px rgba(24, 119, 242, 0.25)' 
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>

                {/* INSTAGRAM BUTTON */}
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                    color: '#ffffff', 
                    textDecoration: 'none', 
                    fontWeight: 800, 
                    fontSize: '12px',
                    boxShadow: '0 4px 10px rgba(220, 39, 67, 0.25)' 
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>

              </div>
            </div>

            {/* EXIT APP & LOGOUT ACTIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={async () => {
                  try {
                    await CapacitorApp.exitApp();
                  } catch {
                    window.close();
                  }
                }}
                style={{ height: '48px', background: '#0f172a', color: '#ffffff', borderRadius: '14px', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Power size={15} /> Exit App
              </button>

              <button 
                onClick={handleLogout}
                style={{ height: '48px', background: '#fee2e2', color: '#dc2626', borderRadius: '14px', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ===================================================================== */}
      {/* BOTTOM NAVIGATION BAR (LIGHT THEME) */}
      {/* ===================================================================== */}
      <nav style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: '#ffffff', 
        borderTop: '1px solid #e2e8f0', 
        height: '66px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-around', 
        zIndex: 100, 
        maxWidth: '650px', 
        margin: '0 auto',
        boxShadow: '0 -4px 15px rgba(0,0,0,0.03)'
      }}>
        
        {/* HOME / DASHBOARD */}
        <button 
          onClick={() => setActiveTab("dashboard")}
          style={{ background: 'none', border: 'none', color: activeTab === "dashboard" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <TrendingUp size={20} />
          <span>Home</span>
        </button>

        {/* RAPID ONBOARD */}
        <button 
          onClick={() => setActiveTab("onboard")}
          style={{ background: 'none', border: 'none', color: activeTab === "onboard" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeTab === "onboard" ? '#ea580c' : '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <UserPlus size={20} />
          </div>
          <span>Onboard</span>
        </button>

        {/* LEADS CRM */}
        <button 
          onClick={() => setActiveTab("leads")}
          style={{ background: 'none', border: 'none', color: activeTab === "leads" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <Flame size={20} />
          <span>Leads</span>
        </button>

        {/* MY STORES */}
        <button 
          onClick={() => setActiveTab("stores")}
          style={{ background: 'none', border: 'none', color: activeTab === "stores" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <Store size={20} />
          <span>My Stores</span>
        </button>

        {/* PITCH KIT */}
        <button 
          onClick={() => setActiveTab("pitch")}
          style={{ background: 'none', border: 'none', color: activeTab === "pitch" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <FileText size={20} />
          <span>Pitch Kit</span>
        </button>

        {/* PROFILE */}
        <button 
          onClick={() => setActiveTab("profile")}
          style={{ background: 'none', border: 'none', color: activeTab === "profile" ? '#ea580c' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <User size={20} />
          <span>Profile</span>
        </button>

      </nav>

    </div>
  );
}
