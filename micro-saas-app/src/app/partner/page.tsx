"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, TrendingUp, DollarSign, Phone, MapPin, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  ExternalLink, Search, Camera, IndianRupee, Award, Calendar, 
  MessageSquare, FileText, ChevronRight, X, Eye, Key, Send, 
  Trash2, Edit3, Power, Check, AlertCircle, Sparkles, Navigation,
  QrCode, LogOut, ArrowRight, ShieldAlert, Store, Star, Flame
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export default function PartnerApp() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [currentAgent, setCurrentAgent] = useState<any | null>(null);
  const [authError, setAuthError] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "onboard" | "leads" | "stores" | "pitch">("dashboard");

  // Attendance
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchInLocation, setPunchInLocation] = useState<string | null>(null);

  // Data States
  const [fseConfig, setFseConfig] = useState<any>({ agents: [], leads: [], attendance: [], settlements: [] });
  const [allStores, setAllStores] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Rapid Onboarding Form
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Mobile & Electronics");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash">("UPI");
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
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

  // Auto-login from localStorage if previously logged in
  useEffect(() => {
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
      // Auto-capture GPS
      captureGPS();
    }
  }, [isLoggedIn]);

  // Capture GPS Location
  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setPunchInLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          console.warn("GPS Location error:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Agent Login Handler
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
        setAuthError("Invalid Mobile Number or Password. Please check with Admin.");
        return;
      }

      if (matchedAgent.status === "inactive") {
        setAuthError("Your Executive Account is suspended. Please contact Admin.");
        return;
      }

      // Success
      setCurrentAgent(matchedAgent);
      setIsLoggedIn(true);
      localStorage.setItem("instamunim_partner_agent", JSON.stringify(matchedAgent));
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("instamunim_partner_agent");
    setIsLoggedIn(false);
    setCurrentAgent(null);
    setIsOnDuty(false);
  };

  // Toggle Attendance
  const handleToggleAttendance = () => {
    if (!isOnDuty) {
      captureGPS();
      setPunchInTime(format(new Date(), "hh:mm a"));
      setIsOnDuty(true);
      alert("🎉 Day Started! You are now ON DUTY. Best of luck with today's targets! 🚀");
    } else {
      if (confirm("Are you sure you want to punch out and end your field day?")) {
        setIsOnDuty(false);
        alert("Day Completed! Great work today! 👍");
      }
    }
  };

  // Photo Capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setShopPhoto(reader.result as string);
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

    // Check duplicate store
    if (allStores.some(s => s.owner_mobile === cleanMobile)) {
      alert("A store with this mobile number is already registered in InstaMunim!");
      return;
    }

    setIsOnboarding(true);
    try {
      const generatedPass = cleanMobile.slice(-4); // Default 4-digit PIN
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days active

      const storeConfig = {
        onboardedBy: currentAgent?.name || "Field Executive",
        onboardedAgentName: currentAgent?.name || "Field Executive",
        onboardedAgentMobile: currentAgent?.mobile || "",
        onboardingFee: 500,
        paymentMode: paymentMode,
        businessType: businessCategory,
        shopPhoto: shopPhoto || null,
        lat: locationCoords?.lat || null,
        lng: locationCoords?.lng || null,
        onboardingDate: now.toISOString(),
        voiceCashier: true,
        aiScanner: true,
        udhaarKhata: true,
        inventoryMgmt: true,
        gstInvoicing: true,
        reportsCrm: true
      };

      const payload = {
        owner_mobile: cleanMobile,
        store_name: storeName.trim(),
        password: generatedPass,
        monthly_rent: 250, // Standard 250 monthly plan
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
        fee: 500
      };
      setOnboardingSuccess(successData);

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

  // Submit Lead
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
    alert("🎉 Lead Saved Successfully! You can follow up anytime.");
  };

  // Convert Lead to Onboarding
  const handleConvertLead = (lead: any) => {
    setStoreName(lead.store_name);
    setOwnerName(lead.owner_name || "");
    setOwnerMobile(lead.mobile);
    setActiveTab("onboard");
  };

  // Filter Agent's Stores
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
      onboardingFee: cfg.onboardingFee || 500,
      onboardingDate: cfg.onboardingDate || s.created_at
    };
  });

  // Today's Stats
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayStores = myStores.filter(s => format(new Date(s.onboardingDate), "yyyy-MM-dd") === todayStr);
  const totalMonthCount = myStores.length;
  const targetDaily = currentAgent?.target_daily || 2;

  // Milestone Incentive (40+ Stores = ₹100/store)
  const milestoneReached = totalMonthCount >= 40;
  const bonusStores = Math.max(0, totalMonthCount - 40);
  const milestoneIncentiveEarned = bonusStores * 100;

  // Cash in Hand
  const totalCashCollected = myStores.filter(s => s.paymentMode === "Cash").length * 500;
  const mySettlements = (fseConfig.settlements || []).filter((set: any) => set.agent_mobile === currentAgent?.mobile);
  const totalCashSettled = mySettlements.reduce((sum: number, set: any) => sum + (Number(set.amount) || 0), 0);
  const pendingCashInHand = Math.max(0, totalCashCollected - totalCashSettled);

  // My Leads
  const myLeads = (fseConfig.leads || []).filter((l: any) => l.agent_mobile === currentAgent?.mobile);

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div style={{ background: '#09090b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '28px', maxWidth: '420px', width: '100%', padding: '36px 28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          
          {/* LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4)', marginBottom: '16px' }}>
              <Award size={36} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>InstaMunim Partner</h1>
            <p style={{ color: '#f97316', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', marginTop: '4px', textTransform: 'uppercase' }}>Field Sales & Onboarding App</p>
          </div>

          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Executive Mobile Number
              </label>
              <input 
                type="tel"
                required
                placeholder="10-digit Registered Mobile"
                value={loginMobile}
                onChange={e => setLoginMobile(e.target.value)}
                style={{ width: '100%', height: '52px', background: '#09090b', border: '1px solid #27272a', borderRadius: '14px', padding: '0 16px', color: '#ffffff', fontSize: '15px', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Password / PIN
              </label>
              <input 
                type="password"
                required
                placeholder="Enter password provided by Admin"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={{ width: '100%', height: '52px', background: '#09090b', border: '1px solid #27272a', borderRadius: '14px', padding: '0 16px', color: '#ffffff', fontSize: '15px', fontWeight: 600 }}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoadingAuth}
              style={{ 
                marginTop: '8px',
                height: '54px', 
                borderRadius: '16px', 
                border: 'none', 
                background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                color: '#ffffff', 
                fontWeight: 900, 
                fontSize: '15px', 
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoadingAuth ? "Authenticating..." : "START FIELD WORK"} <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#71717a', marginTop: '24px' }}>
            Account not registered? Contact <strong>Zainul Sir (Admin)</strong> to get your credentials.
          </p>

        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN PARTNER APP INTERFACE
  // =========================================================================
  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#f4f4f5', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      
      {/* TOP HEADER */}
      <header style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* AGENT PROFILE INFO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: '#ffffff' }}>
              {currentAgent?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>{currentAgent?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '7px', 
                  height: '7px', 
                  borderRadius: '50%', 
                  background: isOnDuty ? '#10b981' : '#a1a1aa' 
                }} />
                <span style={{ fontSize: '10px', color: isOnDuty ? '#10b981' : '#a1a1aa', fontWeight: 800 }}>
                  {isOnDuty ? "ON DUTY (LIVE)" : "OFF DUTY"}
                </span>
                <span style={{ fontSize: '10px', color: '#71717a' }}>• {currentAgent?.city}</span>
              </div>
            </div>
          </div>

          {/* DUTY TOGGLE & LOGOUT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleToggleAttendance}
              style={{ 
                padding: '8px 14px', 
                borderRadius: '10px', 
                border: 'none', 
                background: isOnDuty ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #10b981, #059669)', 
                color: isOnDuty ? '#ef4444' : '#ffffff',
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
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* APP BODY CONTAINER */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>

        {/* ===================================================================== */}
        {/* TAB 1: DASHBOARD (TODAY TARGET & 40+ MILESTONE) */}
        {/* ===================================================================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* TODAY SCORECARD */}
            <div style={{ background: 'linear-gradient(135deg, #18181b, #27272a)', borderRadius: '24px', padding: '24px', border: '1px solid #3f3f46', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Performance</span>
                  <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                    {todayStores.length} <span style={{ fontSize: '16px', color: '#a1a1aa' }}>/ {targetDaily} Stores</span>
                  </h3>
                </div>
                <div style={{ 
                  padding: '8px 12px', 
                  borderRadius: '12px', 
                  background: todayStores.length >= targetDaily ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                  color: todayStores.length >= targetDaily ? '#10b981' : '#f97316',
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
              <div style={{ height: '8px', background: '#09090b', borderRadius: '9999px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(100, (todayStores.length / targetDaily) * 100)}%`, 
                  background: todayStores.length >= targetDaily ? '#10b981' : 'linear-gradient(90deg, #f97316, #eab308)' 
                }} />
              </div>

              {/* QUICK ACTION BUTTON */}
              <button 
                onClick={() => setActiveTab("onboard")}
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  borderRadius: '14px', 
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
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                }}
              >
                <UserPlus size={18} /> + Onboard New Store Now
              </button>
            </div>

            {/* 40+ MILESTONE INCENTIVE CARD */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '24px', padding: '24px', border: '1px solid #4338ca' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#fb923c" />
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>40 Stores Milestone</h4>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: '6px', color: '#ffffff' }}>
                  ₹100 / Store Tier
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                  <span style={{ color: '#c7d2fe' }}>Monthly Stores: {totalMonthCount} / 40</span>
                  <span style={{ color: milestoneReached ? '#10b981' : '#fb923c' }}>
                    {milestoneReached ? "🎉 Super Incentive Active!" : `${40 - totalMonthCount} Stores to Unlock`}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (totalMonthCount / 40) * 100)}%`, 
                    background: milestoneReached ? '#10b981' : 'linear-gradient(90deg, #f97316, #fbbf24)' 
                  }} />
                </div>
              </div>

              {milestoneIncentiveEarned > 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: 700 }}>Super Incentive Earned</p>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>+₹{milestoneIncentiveEarned.toLocaleString()}</h3>
                  <p style={{ fontSize: '10px', color: '#6ee7b7' }}>({bonusStores} Extra Stores × ₹100 / Store)</p>
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: '#a5b4fc', lineHeight: 1.4 }}>
                  Cross 40 store onboardings this month to automatically unlock <strong>₹100 Per Store Incentive</strong> on all stores above 40! 🚀
                </p>
              )}
            </div>

            {/* CASH IN HAND CARD */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase' }}>Cash to Submit (Zainul Sir)</p>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: pendingCashInHand > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                  ₹{pendingCashInHand.toLocaleString()}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#71717a' }}>Settled: ₹{totalCashSettled.toLocaleString()}</span>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, marginTop: '2px' }}>Standard ₹500/Store</div>
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: 30-SECOND RAPID ONBOARDING FORM */}
        {/* ===================================================================== */}
        {activeTab === "onboard" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* SUCCESS MODAL OVERLAY */}
            {onboardingSuccess && (
              <div style={{ background: 'linear-gradient(135deg, #064e3b, #047857)', borderRadius: '24px', padding: '28px', border: '1px solid #10b981', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Check size={32} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>Store Activated Successfully!</h3>
                <p style={{ color: '#a7f3d0', fontSize: '13px', marginTop: '4px' }}>{onboardingSuccess.store_name} is now LIVE on InstaMunim.</p>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px', margin: '20px 0', textAlign: 'left', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Login Mobile:</span>
                    <strong style={{ color: '#ffffff' }}>{onboardingSuccess.owner_mobile}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Password:</span>
                    <strong style={{ color: '#facc15', fontFamily: 'monospace' }}>{onboardingSuccess.password}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Fee Paid:</span>
                    <strong style={{ color: '#10b981' }}>₹{onboardingSuccess.fee} ({onboardingSuccess.payment_mode})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a 
                    href={`https://wa.me/91${onboardingSuccess.owner_mobile}?text=${encodeURIComponent(`Namaste ${onboardingSuccess.store_name}! 🎉\n\nAapka InstaMunim Smart POS account create ho gaya hai!\n\n📱 Login Mobile: ${onboardingSuccess.owner_mobile}\n🔑 Password: ${onboardingSuccess.password}\n\n👉 Download App: https://play.google.com/store/apps/details?id=com.zainul.instamunimpos\n👉 Web POS: https://www.instamunim.com`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, height: '46px', background: '#25D366', color: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 900, textDecoration: 'none', fontSize: '13px' }}
                  >
                    <MessageSquare size={16} /> Send WhatsApp Pass
                  </a>

                  <button 
                    onClick={() => setOnboardingSuccess(null)}
                    style={{ padding: '0 20px', height: '46px', background: '#ffffff', color: '#09090b', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                  >
                    + Next Store
                  </button>
                </div>
              </div>
            )}

            {/* ONBOARDING FORM */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Store size={22} color="#f97316" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Rapid Merchant Onboarding</h3>
                  <p style={{ fontSize: '11px', color: '#71717a' }}>Takes less than 30 seconds to activate.</p>
                </div>
              </div>

              <form onSubmit={handleOnboardStore} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Shop / Store Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bilal Mobile & Electronics"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    style={{ width: '100%', height: '50px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      Owner Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Salman Khan"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      style={{ width: '100%', height: '50px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      Owner Mobile *
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="10-digit number"
                      value={ownerMobile}
                      onChange={e => setOwnerMobile(e.target.value)}
                      style={{ width: '100%', height: '50px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Business Category
                  </label>
                  <select 
                    value={businessCategory}
                    onChange={e => setBusinessCategory(e.target.value)}
                    style={{ width: '100%', height: '50px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}
                  >
                    <option value="Mobile & Electronics">Mobile & Electronics</option>
                    <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                    <option value="Kirana & Grocery">Kirana & Grocery</option>
                    <option value="Clothing & Footwear">Clothing & Footwear</option>
                    <option value="Bakery & Sweet Shop">Bakery & Sweet Shop</option>
                    <option value="Saloon & Spa">Saloon & Spa</option>
                    <option value="General Retail">General Retail</option>
                  </select>
                </div>

                {/* SHOP CAMERA PHOTO */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Shop Board / Counter Photo (Live Camera)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ flex: 1, height: '50px', background: '#27272a', border: '1px dashed #3f3f46', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f97316', cursor: 'pointer', fontWeight: 800, fontSize: '13px' }}>
                      <Camera size={18} /> {shopPhoto ? "Retake Photo" : "Open Camera & Click"}
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                    </label>
                    {shopPhoto && (
                      <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #10b981' }}>
                        <img src={shopPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* PAYMENT SECTION */}
                <div style={{ background: '#09090b', padding: '16px', borderRadius: '16px', border: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Plan: Standard Onboarding</span>
                      <h4 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>₹500 <span style={{ fontSize: '12px', color: '#a1a1aa' }}>(Includes 1st Month)</span></h4>
                    </div>
                    <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, background: 'rgba(56, 189, 248, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                      ₹250/Mo Thereafter
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setPaymentMode("UPI")}
                      style={{ 
                        height: '46px', 
                        borderRadius: '10px', 
                        border: paymentMode === "UPI" ? '2px solid #3b82f6' : '1px solid #27272a',
                        background: paymentMode === "UPI" ? 'rgba(59, 130, 246, 0.15)' : '#18181b',
                        color: paymentMode === "UPI" ? '#60a5fa' : '#a1a1aa',
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
                        border: paymentMode === "Cash" ? '2px solid #eab308' : '1px solid #27272a',
                        background: paymentMode === "Cash" ? 'rgba(234, 179, 8, 0.15)' : '#18181b',
                        color: paymentMode === "Cash" ? '#facc15' : '#a1a1aa',
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

                  {/* SHOW QR CODE IF UPI SELECTED */}
                  {paymentMode === "UPI" && (
                    <div style={{ marginTop: '14px', background: '#18181b', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #27272a' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Ask Shopkeeper to Scan & Pay ₹500:</p>
                      <div style={{ display: 'inline-block', background: '#ffffff', padding: '12px', borderRadius: '12px' }}>
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=7838229178@ptaxis&pn=InstaMunim&am=500&cu=INR" 
                          alt="Admin UPI QR" 
                          style={{ width: '140px', height: '140px', display: 'block' }}
                        />
                      </div>
                      <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginTop: '8px' }}>✓ Money directly goes to Zainul Sir's Account</p>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isOnboarding}
                  style={{ 
                    marginTop: '8px',
                    height: '54px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                    color: '#ffffff', 
                    fontWeight: 900, 
                    fontSize: '15px', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
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
        {/* TAB 3: LEADS & PROSPECTS PIPELINE */}
        {/* ===================================================================== */}
        {activeTab === "leads" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Leads & Follow-ups</h3>
                <p style={{ fontSize: '11px', color: '#71717a' }}>Track interested merchants to close later.</p>
              </div>
              <button 
                onClick={() => setShowAddLeadModal(true)}
                style={{ padding: '10px 16px', background: '#f97316', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                + Add Lead
              </button>
            </div>

            {/* LEADS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myLeads.length === 0 ? (
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#71717a' }}>
                  No pending leads. Tap <strong>"+ Add Lead"</strong> when a shopkeeper asks to revisit!
                </div>
              ) : (
                myLeads.map((lead: any) => (
                  <div key={lead.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '18px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#ffffff', fontSize: '15px' }}>{lead.store_name}</strong>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: lead.interest_level === 'Hot' ? 'rgba(239, 68, 68, 0.2)' : lead.interest_level === 'Warm' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: lead.interest_level === 'Hot' ? '#ef4444' : lead.interest_level === 'Warm' ? '#facc15' : '#60a5fa'
                        }}>
                          {lead.interest_level === 'Hot' ? '🔥 HOT' : lead.interest_level === 'Warm' ? '🟡 WARM' : '❄️ COLD'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                        {lead.owner_name ? `${lead.owner_name} • ` : ''}{lead.mobile}
                      </p>
                      {lead.notes && (
                        <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', fontStyle: 'italic' }}>
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a 
                        href={`tel:+91${lead.mobile}`}
                        style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#27272a', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none' }}
                      >
                        <Phone size={16} />
                      </a>
                      <button 
                        onClick={() => handleConvertLead(lead)}
                        style={{ padding: '0 14px', height: '38px', borderRadius: '10px', background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }}>
                  <button onClick={() => setShowAddLeadModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>

                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginBottom: '16px' }}>Save Store Follow-up Lead</h3>

                  <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="text" 
                      required 
                      placeholder="Shop Name *" 
                      value={leadStoreName} 
                      onChange={e => setLeadStoreName(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', color: '#ffffff' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Owner Name" 
                      value={leadOwnerName} 
                      onChange={e => setLeadOwnerName(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', color: '#ffffff' }} 
                    />
                    <input 
                      type="tel" 
                      required 
                      placeholder="10-digit Mobile Number *" 
                      value={leadMobile} 
                      onChange={e => setLeadMobile(e.target.value)} 
                      style={{ width: '100%', height: '46px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', color: '#ffffff' }} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <select 
                        value={leadInterest} 
                        onChange={e => setLeadInterest(e.target.value as any)}
                        style={{ width: '100%', height: '46px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', color: '#ffffff' }}
                      >
                        <option value="Hot">🔥 Hot (Ready Tomorrow)</option>
                        <option value="Warm">🟡 Warm (Next Week)</option>
                        <option value="Cold">❄️ Cold (Thinking)</option>
                      </select>

                      <input 
                        type="date" 
                        value={leadRevisitDate} 
                        onChange={e => setLeadRevisitDate(e.target.value)}
                        style={{ width: '100%', height: '46px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', color: '#ffffff' }} 
                      />
                    </div>

                    <textarea 
                      placeholder="Notes (e.g. Owner absent, come at 4 PM)" 
                      value={leadNotes} 
                      onChange={e => setLeadNotes(e.target.value)}
                      style={{ width: '100%', height: '60px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: '#ffffff', resize: 'none' }}
                    />

                    <button 
                      type="submit" 
                      style={{ height: '48px', background: '#f97316', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '6px' }}
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
        {/* TAB 4: MY ONBOARDED STORES */}
        {/* ===================================================================== */}
        {activeTab === "stores" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>My Onboarded Stores ({myStores.length})</h3>

            {myStores.length === 0 ? (
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#71717a' }}>
                You haven't onboarded any stores yet. Tap <strong>"Onboard"</strong> below to start!
              </div>
            ) : (
              myStores.map(store => (
                <div key={store.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '18px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '15px' }}>{store.store_name}</strong>
                      <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{store.owner_mobile}</p>
                    </div>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      background: store.paymentMode === 'UPI' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: store.paymentMode === 'UPI' ? '#60a5fa' : '#facc15',
                      fontWeight: 800,
                      fontSize: '10px'
                    }}>
                      ₹{store.onboardingFee} ({store.paymentMode})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #27272a', fontSize: '11px', color: '#71717a' }}>
                    <span>Onboarded: {format(new Date(store.onboardingDate), "dd MMM yyyy")}</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>● Active</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: PITCH KIT (SALES DEMO HELPER) */}
        {/* ===================================================================== */}
        {activeTab === "pitch" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Digital Pitch Kit & Benefits</h3>
            
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ color: '#f97316', fontWeight: 900, fontSize: '15px', marginBottom: '10px' }}>
                🌟 5 Key Selling Points For Shopkeeper:
              </h4>
              <ul style={{ paddingLeft: '20px', color: '#d4d4d8', fontSize: '13px', lineHeight: 1.6 }}>
                <li><strong>Voice Soundbox:</strong> Free automatic soundbox in 9 Indian languages.</li>
                <li><strong>WhatsApp Billing:</strong> 1-click digital PDF bills sent directly to customer WhatsApp.</li>
                <li><strong>AI Menu Scanner:</strong> Scan menu/rate card photo and items are added in 5 seconds.</li>
                <li><strong>Udhaar Khata:</strong> Automated WhatsApp payment reminders for pending balances.</li>
                <li><strong>Only ₹250/Month:</strong> Most affordable all-in-one Smart POS in India!</li>
              </ul>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #18181b, #27272a)', border: '1px solid #3f3f46', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '10px' }}>Live Web POS Demo Link to show Merchant:</p>
              <a 
                href="https://www.instamunim.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f97316', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '13px', textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Open InstaMunim Demo
              </a>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#18181b', borderTop: '1px solid #27272a', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100, maxWidth: '600px', margin: '0 auto' }}>
        
        <button 
          onClick={() => setActiveTab("dashboard")}
          style={{ background: 'none', border: 'none', color: activeTab === "dashboard" ? '#f97316' : '#71717a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <TrendingUp size={20} />
          <span>Home</span>
        </button>

        <button 
          onClick={() => setActiveTab("onboard")}
          style={{ background: 'none', border: 'none', color: activeTab === "onboard" ? '#f97316' : '#71717a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: activeTab === "onboard" ? '#f97316' : '#27272a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <UserPlus size={20} />
          </div>
          <span>Onboard</span>
        </button>

        <button 
          onClick={() => setActiveTab("leads")}
          style={{ background: 'none', border: 'none', color: activeTab === "leads" ? '#f97316' : '#71717a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <Flame size={20} />
          <span>Leads</span>
        </button>

        <button 
          onClick={() => setActiveTab("stores")}
          style={{ background: 'none', border: 'none', color: activeTab === "stores" ? '#f97316' : '#71717a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <Store size={20} />
          <span>My Stores</span>
        </button>

        <button 
          onClick={() => setActiveTab("pitch")}
          style={{ background: 'none', border: 'none', color: activeTab === "pitch" ? '#f97316' : '#71717a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
        >
          <FileText size={20} />
          <span>Pitch Kit</span>
        </button>

      </nav>

    </div>
  );
}
