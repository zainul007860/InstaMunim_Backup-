"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, TrendingUp, DollarSign, Phone, MapPin, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  ExternalLink, Search, Camera, IndianRupee, Award, Calendar, 
  MessageSquare, FileText, ChevronRight, X, Eye, Key, Send, 
  Trash2, Edit3, Power, Check, AlertCircle, Sparkles, RotateCcw,
  Flame, CheckCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, isAfter } from "date-fns";

interface SalesAgent {
  id: string;
  name: string;
  mobile: string;
  password: string;
  city: string;
  target_daily: number;
  status: "active" | "inactive";
  created_at: string;
  profile_photo?: string;
}

interface FieldSalesProps {
  stores: any[];
  allSales: any[];
  onRefreshStores: () => void;
}

export default function FieldSalesSection({ stores, allSales, onRefreshStores }: FieldSalesProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "agents" | "onboardings" | "settlements" | "renewals" | "leads">("overview");
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Registration Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentMobile, setAgentMobile] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const [agentCity, setAgentCity] = useState("Delhi NCR");
  const [agentDailyTarget, setAgentDailyTarget] = useState(2);
  const [editingAgent, setEditingAgent] = useState<SalesAgent | null>(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Fetch FSE Config from Supabase
  const fetchFSEData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('store_logo')
        .eq('owner_mobile', 'admin_fse_config')
        .single();

      if (data && data.store_logo && data.store_logo.startsWith("JSON_CFG:")) {
        const config = JSON.parse(data.store_logo.substring(9));
        setAgents(config.agents || []);
        setLeads(config.leads || []);
        setAttendance(config.attendance || []);
        setSettlements(config.settlements || []);
      }
    } catch (err) {
      console.error("Error fetching FSE data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFSEData();
  }, []);

  // Save FSE Config to Supabase
  const saveFSEConfig = async (newAgents: SalesAgent[], newLeads: any[], newAttendance: any[], newSettlements: any[]) => {
    setIsSaving(true);
    try {
      const payload = {
        agents: newAgents,
        leads: newLeads,
        attendance: newAttendance,
        settlements: newSettlements
      };

      const { error } = await supabase
        .from('stores')
        .update({
          store_logo: 'JSON_CFG:' + JSON.stringify(payload)
        })
        .eq('owner_mobile', 'admin_fse_config');

      if (error) {
        console.error("Update error:", error);
        alert("Failed to save: " + error.message);
      } else {
        setAgents(newAgents);
        setLeads(newLeads);
        setAttendance(newAttendance);
        setSettlements(newSettlements);
      }
    } catch (err: any) {
      console.error("Error saving FSE config:", err);
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Register or Update Agent
  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentMobile || !agentPassword) {
      alert("Please fill all required fields!");
      return;
    }

    const cleanMobile = agentMobile.trim().replace(/[^0-9]/g, "").slice(-10);
    if (cleanMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number!");
      return;
    }

    if (editingAgent) {
      // Update existing
      const updated = agents.map(a => a.id === editingAgent.id ? {
        ...a,
        name: agentName,
        mobile: cleanMobile,
        password: agentPassword,
        city: agentCity,
        target_daily: Number(agentDailyTarget)
      } : a);
      await saveFSEConfig(updated, leads, attendance, settlements);
    } else {
      // Check duplicate
      if (agents.some(a => a.mobile === cleanMobile)) {
        alert("An executive with this mobile number is already registered!");
        return;
      }

      const newAgent: SalesAgent = {
        id: `agent_${Date.now()}`,
        name: agentName,
        mobile: cleanMobile,
        password: agentPassword,
        city: agentCity,
        target_daily: Number(agentDailyTarget) || 2,
        status: "active",
        created_at: new Date().toISOString()
      };
      await saveFSEConfig([...agents, newAgent], leads, attendance, settlements);
    }

    setShowAddModal(false);
    setAgentName("");
    setAgentMobile("");
    setAgentPassword("");
    setEditingAgent(null);
  };

  // Toggle Agent Active Status
  const toggleAgentStatus = async (agent: SalesAgent) => {
    const updated = agents.map(a => a.id === agent.id ? {
      ...a,
      status: (a.status === "active" ? "inactive" : "active") as "active" | "inactive"
    } : a);
    await saveFSEConfig(updated, leads, attendance, settlements);
  };

  // Delete Agent
  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (confirm(`Are you sure you want to permanently delete Executive "${agentName}"? They will no longer be able to log in.`)) {
      const updated = agents.filter(a => a.id !== agentId);
      await saveFSEConfig(updated, leads, attendance, settlements);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string, storeName: string) => {
    if (confirm(`Delete lead for "${storeName}"?`)) {
      const updated = leads.filter(l => l.id !== leadId);
      await saveFSEConfig(agents, updated, attendance, settlements);
    }
  };

  // Settle Cash for an Executive
  const handleSettleCash = async (agent: SalesAgent, amount: number) => {
    const settleAmt = prompt(`Enter cash amount to settle for ${agent.name}:`, String(amount));
    if (!settleAmt || isNaN(Number(settleAmt)) || Number(settleAmt) <= 0) return;

    const newSettlement = {
      id: `set_${Date.now()}`,
      agent_id: agent.id,
      agent_name: agent.name,
      agent_mobile: agent.mobile,
      amount: Number(settleAmt),
      date: new Date().toISOString(),
      status: "cleared"
    };

    const updatedSettlements = [newSettlement, ...settlements];
    await saveFSEConfig(agents, leads, attendance, updatedSettlements);
    alert(`₹${settleAmt} settled successfully for ${agent.name}! Cash ledger is updated.`);
  };

  // Clear / Reset All Settlements History
  const handleClearSettlementsHistory = async () => {
    if (confirm("Are you sure you want to clear settlement history?")) {
      await saveFSEConfig(agents, leads, attendance, []);
      alert("Settlement history cleared.");
    }
  };

  // Delete a Store Record from Supabase
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (confirm(`⚠️ Danger: Are you sure you want to permanently delete Store "${storeName}" from the database?`)) {
      try {
        const { error } = await supabase
          .from('stores')
          .delete()
          .eq('id', storeId);
        
        if (error) throw error;
        alert(`Store "${storeName}" has been deleted.`);
        onRefreshStores();
      } catch (err: any) {
        alert("Failed to delete store: " + err.message);
      }
    }
  };

  // Calculate Onboarding Data & Metrics
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const onboardedStores = stores.filter(s => {
    if (s.owner_mobile === 'admin_fse_config') return false;
    if (s.store_logo && s.store_logo.startsWith("JSON_CFG:")) {
      try {
        const parsed = JSON.parse(s.store_logo.substring(9));
        return parsed.isFSEOnboarded === true || parsed.onboardedByAgent;
      } catch (e) {
        return false;
      }
    }
    return false;
  }).map(s => {
    let parsedCfg: any = {};
    try {
      parsedCfg = JSON.parse(s.store_logo.substring(9));
    } catch (e) {}

    return {
      ...s,
      agentName: parsedCfg.agentName || "Direct Partner",
      agentMobile: parsedCfg.agentMobile || "N/A",
      onboardingFee: parsedCfg.onboardingFee || 500,
      paymentMode: parsedCfg.paymentMode || "UPI",
      shopPhoto: parsedCfg.shopPhoto || null,
      onboardingDate: parsedCfg.onboardingDate || s.created_at || new Date().toISOString()
    };
  });

  const todayOnboardings = onboardedStores.filter(s => {
    return format(new Date(s.onboardingDate), "yyyy-MM-dd") === todayStr;
  });

  // Renewal Desk Stores (Stores expiring in <= 7 days or already expired)
  const expiringStores = stores.filter(s => {
    if (s.owner_mobile === 'admin_fse_config') return false;
    if (!s.subscription_expiry) return true; // No expiry set = due
    const exp = new Date(s.subscription_expiry);
    const diff = differenceInDays(exp, new Date());
    return diff <= 7;
  });

  return (
    <div className="admin-field-sales" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.8px', marginBottom: '4px' }}>
            Field Sales Force & Partner Control
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Multi-Agent Onboarding Manager • 40+ Milestone Incentives • ₹250 Renewal Desk
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { fetchFSEData(); onRefreshStores(); }}
            style={{ 
              padding: '10px 16px', 
              background: '#ffffff', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              color: 'var(--text)', 
              fontWeight: 800, 
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /> Refresh Live Data
          </button>

          <button 
            onClick={() => {
              setEditingAgent(null);
              setAgentName("");
              setAgentMobile("");
              setAgentPassword("");
              setAgentCity("Delhi NCR");
              setAgentDailyTarget(2);
              setShowAddModal(true);
            }}
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              color: '#ffffff', 
              fontWeight: 900, 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.25)'
            }}
          >
            <UserPlus size={16} /> Register New Executive
          </button>
        </div>
      </div>

      {/* TOP STATS CARDS (CLEAN LIGHT THEME) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* STAT 1: ACTIVE AGENTS */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sales Force</p>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#ea580c" />
            </div>
          </div>
          <h3 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            {agents.length} <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 800 }}>Active</span>
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            Target: {agents.reduce((sum, a) => sum + (a.target_daily || 2), 0)} Stores / Day
          </p>
        </div>

        {/* STAT 2: TODAY'S ONBOARDED */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Today's Onboarded</p>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#16a34a" />
            </div>
          </div>
          <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px' }}>
            {todayOnboardings.length}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            Lifetime Field Stores: {onboardedStores.length}
          </p>
        </div>

        {/* STAT 3: FEE COLLECTED */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Onboarding Fee</p>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color="#2563eb" />
            </div>
          </div>
          <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.5px' }}>
            ₹{(onboardedStores.length * 500).toLocaleString()}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            Standard ₹500 / Store Onboarding
          </p>
        </div>

        {/* STAT 4: RENEWALS DUE */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>₹250 Renewals Due</p>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={18} color="#ca8a04" />
            </div>
          </div>
          <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#ca8a04', letterSpacing: '-0.5px' }}>
            {expiringStores.length}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            Ready for 1-Click WhatsApp Calling
          </p>
        </div>

      </div>

      {/* SUB-NAVIGATION BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          
          <button 
            onClick={() => setActiveSubTab("overview")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "overview" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "overview" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={15} /> Performance & Milestone
          </button>

          <button 
            onClick={() => setActiveSubTab("agents")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "agents" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "agents" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} /> Executives ({agents.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("onboardings")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "onboardings" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "onboardings" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={15} /> Live Onboardings ({onboardedStores.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("settlements")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "settlements" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "settlements" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <DollarSign size={15} /> Cash Settlements ({settlements.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("leads")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "leads" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "leads" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Flame size={15} /> Field Leads ({leads.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("renewals")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "renewals" ? '#ea580c' : 'transparent', 
              color: activeSubTab === "renewals" ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Phone size={15} /> ₹250 Renewal Desk ({expiringStores.length})
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & 40+ MILESTONE INCENTIVE CALCULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === "overview" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MILESTONE BANNER (LIGHT ACCENT THEME) */}
          <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: '20px', padding: '24px', border: '1px solid #fed7aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ea580c', color: '#ffffff', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 900, marginBottom: '8px' }}>
                  <Sparkles size={13} /> ACTIVE INCENTIVE POLICY
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#9a3412', marginBottom: '4px' }}>
                  40+ Stores Super-Incentive Meter
                </h3>
                <p style={{ color: '#c2410c', fontSize: '13px', maxWidth: '650px', lineHeight: 1.5, fontWeight: 500 }}>
                  Each executive has a base target of <strong>2 Stores / Day (60 Stores / Month)</strong>. Once an executive crosses <strong>40 stores</strong> in a month, they automatically unlock <strong>₹100 Per Store Incentive</strong> on all stores from 41 onwards!
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #fed7aa', textAlign: 'right', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Super Incentive Rate</p>
                <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
                  +₹100 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ Store</span>
                </h3>
                <p style={{ fontSize: '10px', color: '#ea580c', fontWeight: 800 }}>Unlocked on Store #41+</p>
              </div>
            </div>
          </div>

          {/* EXECUTIVE PERFORMANCE TABLE */}
          <div className="data-table-container">
            <div className="table-header">
              <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>EXECUTIVE SCORECARD & INCENTIVE TRACKER</h4>
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Executive Name</th>
                  <th>Mobile / City</th>
                  <th>Today Onboardings</th>
                  <th>Monthly Total</th>
                  <th>Milestone Status (40 Goal)</th>
                  <th>Super Incentive Earned</th>
                  <th>Unsettled Cash</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No sales executives registered yet. Click <strong>"Register New Executive"</strong> to add your first ground agent!
                    </td>
                  </tr>
                ) : (
                  agents.map(agent => {
                    const agentStores = onboardedStores.filter(s => s.agentMobile === agent.mobile || s.agentName.toLowerCase() === agent.name.toLowerCase());
                    const todayAgentCount = agentStores.filter(s => format(new Date(s.onboardingDate), "yyyy-MM-dd") === todayStr).length;
                    const totalMonthCount = agentStores.length;
                    const incentiveEligibleCount = Math.max(0, totalMonthCount - 40);
                    const incentiveEarned = incentiveEligibleCount * 100;
                    
                    // Cash calculation
                    const totalCashCollected = agentStores.filter(s => s.paymentMode === "Cash").length * 500;
                    const totalCashSettled = settlements.filter(set => set.agent_mobile === agent.mobile).reduce((sum, set) => sum + (Number(set.amount) || 0), 0);
                    const pendingCash = Math.max(0, totalCashCollected - totalCashSettled);

                    return (
                      <tr key={agent.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '1px solid #fed7aa', fontSize: '15px' }}>
                              {agent.name ? agent.name.charAt(0).toUpperCase() : "A"}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 800, display: 'block' }}>
                                {agent.name}
                              </strong>
                              <span style={{ fontSize: '10px', color: agent.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                                ● {agent.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{agent.mobile}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agent.city}</div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            background: todayAgentCount >= agent.target_daily ? '#dcfce7' : '#ffedd5',
                            color: todayAgentCount >= agent.target_daily ? '#15803d' : '#c2410c',
                            fontWeight: 900,
                            fontSize: '12px'
                          }}>
                            {todayAgentCount} / {agent.target_daily} Stores
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{totalMonthCount} Stores</strong>
                        </td>
                        <td>
                          <div style={{ width: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, marginBottom: '4px' }}>
                              <span style={{ color: totalMonthCount >= 40 ? '#16a34a' : 'var(--text-muted)' }}>
                                {totalMonthCount >= 40 ? "🎉 Super Goal Active!" : `${40 - totalMonthCount} more to unlock`}
                              </span>
                              <span style={{ color: '#ea580c' }}>{totalMonthCount}/40</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${Math.min(100, (totalMonthCount / 40) * 100)}%`, 
                                background: totalMonthCount >= 40 ? '#16a34a' : 'linear-gradient(90deg, #f97316, #ea580c)' 
                              }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          {incentiveEarned > 0 ? (
                            <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontWeight: 900, fontSize: '13px' }}>
                              +₹{incentiveEarned.toLocaleString()} ({incentiveEligibleCount} × ₹100)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>₹0 (Reach 41+)</span>
                          )}
                        </td>
                        <td>
                          {pendingCash > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '14px' }}>₹{pendingCash.toLocaleString()}</span>
                              <button 
                                onClick={() => handleSettleCash(agent, pendingCash)}
                                style={{ padding: '4px 10px', background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                              >
                                Settle
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 800 }}>✓ All Clear</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVES REGISTRATION & MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === "agents" && (
        <div>
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>REGISTERED FIELD EXECUTIVES ({agents.length})</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin can create, edit, deactivate, or delete executive accounts.</p>
              </div>
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Executive Name</th>
                  <th>Mobile Number (Login ID)</th>
                  <th>Password</th>
                  <th>Assigned City</th>
                  <th>Daily Target</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No executives registered. Click <strong>"Register New Executive"</strong> button above.
                    </td>
                  </tr>
                ) : (
                  agents.map(agent => (
                    <tr key={agent.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '1px solid #fed7aa' }}>
                            {agent.name ? agent.name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 800, display: 'block' }}>
                              {agent.name}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {agent.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ea580c', fontSize: '13px' }}>{agent.mobile}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', background: '#f4f4f5', padding: '4px 8px', borderRadius: '6px', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700 }}>
                          {agent.password}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{agent.city}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{agent.target_daily} Stores / Day</strong>
                      </td>
                      <td>
                        <button 
                          onClick={() => toggleAgentStatus(agent)}
                          style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            background: agent.status === 'active' ? '#dcfce7' : '#fee2e2',
                            color: agent.status === 'active' ? '#15803d' : '#dc2626',
                            fontWeight: 900,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {agent.status.toUpperCase()}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* EDIT AGENT */}
                          <button 
                            onClick={() => {
                              setEditingAgent(agent);
                              setAgentName(agent.name);
                              setAgentMobile(agent.mobile);
                              setAgentPassword(agent.password);
                              setAgentCity(agent.city);
                              setAgentDailyTarget(agent.target_daily);
                              setShowAddModal(true);
                            }}
                            style={{ padding: '6px 10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '11px' }}
                            title="Edit Executive"
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {/* DELETE AGENT */}
                          <button 
                            onClick={() => handleDeleteAgent(agent.id, agent.name)}
                            style={{ padding: '6px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '11px' }}
                            title="Delete Executive"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE ONBOARDINGS TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === "onboardings" && (
        <div>
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>ALL FIELD ONBOARDED STORES ({onboardedStores.length})</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct stores onboarded through the Partner Field App with photo verification.</p>
              </div>
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Owner Mobile</th>
                  <th>Onboarded By</th>
                  <th>Fee Paid</th>
                  <th>Payment Mode</th>
                  <th>Date & Time</th>
                  <th>Shop Photo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {onboardedStores.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No stores onboarded via Field Sales App yet.
                    </td>
                  </tr>
                ) : (
                  onboardedStores.map(store => (
                    <tr key={store.id}>
                      <td>
                        <strong style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 800, display: 'block' }}>
                          {store.store_name}
                        </strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {store.id}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>
                          {store.owner_mobile}
                        </span>
                      </td>
                      <td>
                        <span style={{ padding: '4px 8px', background: '#fff7ed', color: '#ea580c', borderRadius: '6px', fontSize: '11px', fontWeight: 800, border: '1px solid #fed7aa' }}>
                          👤 {store.agentName}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#16a34a', fontSize: '14px' }}>₹{store.onboardingFee}</strong>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          background: store.paymentMode === 'UPI' ? '#eff6ff' : '#fefce8',
                          color: store.paymentMode === 'UPI' ? '#2563eb' : '#ca8a04',
                          fontWeight: 800,
                          fontSize: '11px',
                          border: store.paymentMode === 'UPI' ? '1px solid #bfdbfe' : '1px solid #fef08a'
                        }}>
                          {store.paymentMode}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {format(new Date(store.onboardingDate), "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td>
                        {store.shopPhoto ? (
                          <button 
                            onClick={() => setPreviewPhoto(store.shopPhoto)}
                            style={{ padding: '4px 10px', background: '#ffffff', border: '1px solid var(--border)', color: '#ea580c', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                          >
                            <Camera size={13} /> View Photo
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No Photo</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteStore(store.id, store.store_name)}
                          style={{ padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                          title="Delete Store Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CASH SETTLEMENTS */}
      {/* ========================================================================= */}
      {activeSubTab === "settlements" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>CASH SETTLEMENT HISTORY ({settlements.length})</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete ledger of physical cash submitted by sales executives to Admin.</p>
              </div>
              {settlements.length > 0 && (
                <button 
                  onClick={handleClearSettlementsHistory}
                  style={{ padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={13} /> Clear History
                </button>
              )}
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Executive</th>
                  <th>Amount Settled</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No cash settlements logged yet.
                    </td>
                  </tr>
                ) : (
                  settlements.map(set => (
                    <tr key={set.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{set.id}</td>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{set.agent_name}</strong> ({set.agent_mobile})
                      </td>
                      <td>
                        <strong style={{ color: '#16a34a', fontSize: '14px' }}>₹{Number(set.amount).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '11px', fontWeight: 900, border: '1px solid #bbf7d0' }}>
                          ✓ CLEARED
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {format(new Date(set.date), "dd MMM yyyy, hh:mm a")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FIELD LEADS CRM */}
      {/* ========================================================================= */}
      {activeSubTab === "leads" && (
        <div>
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>FIELD STORE LEADS ({leads.length})</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prospective stores visited by sales executives with follow-up dates.</p>
              </div>
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Owner / Mobile</th>
                  <th>Interest Level</th>
                  <th>Revisit Date</th>
                  <th>Executive</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No field leads captured yet.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <strong style={{ color: 'var(--text)', fontSize: '14px' }}>{lead.store_name}</strong>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text)', fontWeight: 700 }}>{lead.owner_name || "Merchant"}</div>
                        <a href={`tel:+91${lead.mobile}`} style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}>{lead.mobile}</a>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: lead.interest_level === 'Hot' ? '#fee2e2' : lead.interest_level === 'Warm' ? '#ffedd5' : '#f1f5f9',
                          color: lead.interest_level === 'Hot' ? '#dc2626' : lead.interest_level === 'Warm' ? '#ea580c' : '#64748b',
                          fontWeight: 900,
                          fontSize: '11px'
                        }}>
                          {lead.interest_level === 'Hot' ? '🔥 HOT' : lead.interest_level === 'Warm' ? '🟡 WARM' : '❄️ COLD'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{lead.revisit_date || "N/A"}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.agent_mobile}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                        {lead.notes || "—"}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteLead(lead.id, lead.store_name)}
                          style={{ padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                          title="Delete Lead"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MONTHLY ₹250 RENEWAL DESK */}
      {/* ========================================================================= */}
      {activeSubTab === "renewals" && (
        <div>
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 900 }}>MONTHLY ₹250 SUBSCRIPTION RENEWAL DESK ({expiringStores.length})</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Call merchants or send 1-click WhatsApp payment reminders directly from your desktop.</p>
              </div>
            </div>
            <table className="table-content">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Contact</th>
                  <th>Current Plan</th>
                  <th>Expiry Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expiringStores.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#16a34a', fontWeight: 800 }}>
                      🎉 All stores are fully active! No renewals due right now.
                    </td>
                  </tr>
                ) : (
                  expiringStores.map(store => {
                    const expiry = store.subscription_expiry ? new Date(store.subscription_expiry) : null;
                    const isExpired = !expiry || !isAfter(expiry, new Date());
                    const cleanMobile = store.owner_mobile.replace(/[^0-9]/g, "").slice(-10);
                    
                    const renewalMessage = encodeURIComponent(
                      `Namaste ${store.store_name}! 🙏\n\nAapka InstaMunim Smart POS monthly subscription (₹250) renew karne ke liye payment link:\n\n💳 Pay ₹250: https://www.instamunim.com\n\nKisi bhi sahayata ke liye sampark karein: +91 7838229178`
                    );

                    return (
                      <tr key={store.id}>
                        <td>
                          <strong style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 800, display: 'block' }}>
                            {store.store_name}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {store.id}</span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: '#ea580c', fontWeight: 800 }}>{store.owner_mobile}</span>
                        </td>
                        <td>
                          <span style={{ color: '#0284c7', fontWeight: 800 }}>Standard (₹250 / Month)</span>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            background: isExpired ? '#fee2e2' : '#fefce8',
                            color: isExpired ? '#dc2626' : '#ca8a04',
                            fontWeight: 900,
                            fontSize: '11px',
                            border: isExpired ? '1px solid #fca5a5' : '1px solid #fef08a'
                          }}>
                            {isExpired ? "EXPIRED" : `Expires in ${differenceInDays(expiry!, new Date())} Days`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* WhatsApp Button */}
                            <a 
                              href={`https://wa.me/91${cleanMobile}?text=${renewalMessage}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ 
                                padding: '8px 12px', 
                                background: '#16a34a', 
                                color: '#ffffff', 
                                borderRadius: '8px', 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                textDecoration: 'none'
                              }}
                            >
                              <MessageSquare size={13} /> WhatsApp Link
                            </a>

                            {/* Direct Call Button */}
                            <a 
                              href={`tel:+91${cleanMobile}`}
                              style={{ 
                                padding: '8px 12px', 
                                background: '#ffffff', 
                                border: '1px solid var(--border)', 
                                color: 'var(--text)', 
                                borderRadius: '8px', 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                textDecoration: 'none'
                              }}
                            >
                              <Phone size={13} /> Call Merchant
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REGISTRATION & EDIT MODAL (CLEAN LIGHT THEME) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '32px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', marginBottom: '4px' }}>
              {editingAgent ? "Edit Sales Executive" : "Register New Sales Executive"}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Create official login credentials for your Field Sales Partner App.
            </p>

            <form onSubmit={handleSaveAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Executive Full Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Mobile Number (Login ID)
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="10-digit mobile number"
                  value={agentMobile}
                  onChange={e => setAgentMobile(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  App Login Password / PIN
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 1234 or pass123"
                  value={agentPassword}
                  onChange={e => setAgentPassword(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Assigned City / Area
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Delhi NCR"
                    value={agentCity}
                    onChange={e => setAgentCity(e.target.value)}
                    style={{ width: '100%', height: '48px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Daily Target (Stores)
                  </label>
                  <input 
                    type="number" 
                    value={agentDailyTarget}
                    onChange={e => setAgentDailyTarget(Number(e.target.value))}
                    style={{ width: '100%', height: '48px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                style={{ 
                  marginTop: '12px',
                  height: '50px', 
                  borderRadius: '14px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                  color: '#ffffff', 
                  fontWeight: 900, 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                }}
              >
                {isSaving ? "Saving..." : (editingAgent ? "Update Executive Account" : "Create & Activate Executive")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOP PHOTO PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', maxWidth: '600px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setPreviewPhoto(null)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: '#f4f4f5', border: 'none', color: 'var(--text)', borderRadius: '9999px', padding: '6px', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h4 style={{ color: 'var(--text)', fontWeight: 800, marginBottom: '14px', fontSize: '15px' }}>Shop Front Camera Verification</h4>
            <img src={previewPhoto} alt="Shop Front Verification" style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border)' }} />
          </div>
        </div>
      )}

    </div>
  );
}
