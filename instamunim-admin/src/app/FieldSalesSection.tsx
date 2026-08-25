"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, TrendingUp, DollarSign, Phone, MapPin, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  ExternalLink, Search, Camera, IndianRupee, Award, Calendar, 
  MessageSquare, FileText, ChevronRight, X, Eye, Key, Send, 
  Trash2, Edit3, Power, Check, AlertCircle, Sparkles
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
}

interface FieldSalesProps {
  stores: any[];
  allSales: any[];
  onRefreshStores: () => void;
}

export default function FieldSalesSection({ stores, allSales, onRefreshStores }: FieldSalesProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "agents" | "onboardings" | "settlements" | "renewals">("overview");
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
      } else {
        setAgents(newAgents);
        setLeads(newLeads);
        setAttendance(newAttendance);
        setSettlements(newSettlements);
      }
    } catch (err) {
      console.error("Error saving FSE config:", err);
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
      await saveFSEConfig([newAgent, ...agents], leads, attendance, settlements);
    }

    // Reset Form
    setAgentName("");
    setAgentMobile("");
    setAgentPassword("");
    setAgentCity("Delhi NCR");
    setAgentDailyTarget(2);
    setEditingAgent(null);
    setShowAddModal(false);
  };

  // Toggle Agent Active/Inactive
  const toggleAgentStatus = async (agent: SalesAgent) => {
    const updated = agents.map(a => a.id === agent.id ? {
      ...a,
      status: a.status === "active" ? "inactive" as const : "active" as const
    } : a);
    await saveFSEConfig(updated, leads, attendance, settlements);
  };

  // Delete Agent
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to remove this sales executive?")) return;
    const updated = agents.filter(a => a.id !== agentId);
    await saveFSEConfig(updated, leads, attendance, settlements);
  };

  // Settle Cash for Agent
  const handleSettleCash = async (agent: SalesAgent, amountToSettle: number) => {
    if (amountToSettle <= 0) {
      alert("No pending cash to settle for this executive.");
      return;
    }
    if (!confirm(`Confirm cash settlement of ₹${amountToSettle.toLocaleString()} from ${agent.name}?`)) return;

    const newSettlement = {
      id: `settle_${Date.now()}`,
      agent_id: agent.id,
      agent_name: agent.name,
      agent_mobile: agent.mobile,
      amount: amountToSettle,
      date: new Date().toISOString(),
      status: "cleared"
    };

    await saveFSEConfig(agents, leads, attendance, [newSettlement, ...settlements]);
    alert(`🎉 Successfully settled ₹${amountToSettle.toLocaleString()} for ${agent.name}!`);
  };

  // Extract onboarded stores from stores table
  const onboardedStores = stores.filter(s => {
    if (!s.store_logo || !s.store_logo.startsWith("JSON_CFG:")) return false;
    try {
      const cfg = JSON.parse(s.store_logo.substring(9));
      return !!cfg.onboardedBy || !!cfg.onboardedAgentName || !!cfg.onboardedAgentMobile;
    } catch {
      return false;
    }
  }).map(s => {
    const cfg = JSON.parse(s.store_logo.substring(9));
    return {
      ...s,
      agentName: cfg.onboardedAgentName || cfg.onboardedBy || "Field Executive",
      agentMobile: cfg.onboardedAgentMobile || "",
      onboardingFee: cfg.onboardingFee || 500,
      paymentMode: cfg.paymentMode || "UPI",
      shopPhoto: cfg.shopPhoto || null,
      lat: cfg.lat || null,
      lng: cfg.lng || null,
      onboardingDate: cfg.onboardingDate || s.created_at
    };
  });

  // Calculate Metrics
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayOnboardings = onboardedStores.filter(s => format(new Date(s.onboardingDate), "yyyy-MM-dd") === todayStr);

  // Expiring stores for renewal desk
  const expiringStores = stores.filter(s => {
    if (s.owner_mobile === 'admin_config' || s.owner_mobile === 'admin_fse_config') return false;
    if (!s.subscription_expiry) return true; // Trial
    const expiry = new Date(s.subscription_expiry);
    const now = new Date();
    return differenceInDays(expiry, now) <= 3; // Expired or expiring in 3 days
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* TOP METRIC CARDS */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Sales Force</p>
            <Users size={20} color="#f97316" />
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff' }}>{agents.length} <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 700 }}>Active</span></h3>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>Target: {agents.reduce((sum, a) => sum + (a.target_daily || 2), 0)} Stores / Day</p>
        </div>

        <div className="stat-card" style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Onboarded</p>
            <TrendingUp size={20} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>{todayOnboardings.length}</h3>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>Lifetime Field Stores: {onboardedStores.length}</p>
        </div>

        <div className="stat-card" style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Onboarding Fee Collected</p>
            <IndianRupee size={20} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#3b82f6' }}>₹{(onboardedStores.length * 500).toLocaleString()}</h3>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>Standard ₹500 / Store Onboarding</p>
        </div>

        <div className="stat-card" style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>₹250 Renewals Due</p>
            <AlertCircle size={20} color="#eab308" />
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#eab308' }}>{expiringStores.length}</h3>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>Ready for 1-Click WhatsApp Calling</p>
        </div>
      </div>

      {/* SUB-NAVIGATION BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', background: '#18181b', padding: '6px', borderRadius: '16px', border: '1px solid #27272a' }}>
          <button 
            onClick={() => setActiveSubTab("overview")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "overview" ? '#f97316' : 'transparent', 
              color: activeSubTab === "overview" ? '#ffffff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={16} /> Performance & Milestone
          </button>

          <button 
            onClick={() => setActiveSubTab("agents")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "agents" ? '#f97316' : 'transparent', 
              color: activeSubTab === "agents" ? '#ffffff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} /> Executives ({agents.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("onboardings")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "onboardings" ? '#f97316' : 'transparent', 
              color: activeSubTab === "onboardings" ? '#ffffff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={16} /> Live Onboardings ({onboardedStores.length})
          </button>

          <button 
            onClick={() => setActiveSubTab("settlements")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "settlements" ? '#f97316' : 'transparent', 
              color: activeSubTab === "settlements" ? '#ffffff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <DollarSign size={16} /> Cash Settlement
          </button>

          <button 
            onClick={() => setActiveSubTab("renewals")} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeSubTab === "renewals" ? '#f97316' : 'transparent', 
              color: activeSubTab === "renewals" ? '#ffffff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Phone size={16} /> ₹250 Renewal Desk ({expiringStores.length})
          </button>
        </div>

        {/* REGISTER NEW EXECUTIVE BUTTON */}
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
            padding: '12px 20px', 
            borderRadius: '14px', 
            border: 'none', 
            background: 'linear-gradient(135deg, #f97316, #ea580c)', 
            color: '#ffffff', 
            fontWeight: 900, 
            fontSize: '13px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
          }}
        >
          <UserPlus size={18} /> Register New Executive
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & 40+ MILESTONE INCENTIVE CALCULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === "overview" && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MILESTONE BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '20px', padding: '28px', border: '1px solid #4338ca' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 900, marginBottom: '12px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                  <Sparkles size={14} /> ACTIVE INCENTIVE POLICY
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>40+ Stores Super-Incentive Meter</h2>
                <p style={{ color: '#c7d2fe', fontSize: '13px', maxWidth: '650px', lineHeight: 1.5 }}>
                  Each executive has a base target of <strong>2 Stores / Day (60 Stores / Month)</strong>. Once an executive crosses <strong>40 stores</strong> in a month, they automatically unlock <strong>₹100 Per Store Incentive</strong> for all stores above 40!
                </p>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Super Incentive Rate</p>
                <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>+₹100 <span style={{ fontSize: '14px', color: '#ffffff' }}>/ Store</span></h3>
                <p style={{ fontSize: '10px', color: '#fb923c', fontWeight: 800 }}>Unlocked on Store #41+</p>
              </div>
            </div>
          </div>

          {/* EXECUTIVE PERFORMANCE TABLE */}
          <div className="data-table-container">
            <div className="table-header">
              <h4 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 900 }}>EXECUTIVE SCORECARD & INCENTIVE TRACKER</h4>
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                              {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#ffffff', fontSize: '13px' }}>{agent.name}</strong>
                              <div style={{ fontSize: '10px', color: agent.status === 'active' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                                ● {agent.status.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#e4e4e7' }}>{agent.mobile}</div>
                          <div style={{ fontSize: '11px', color: '#71717a' }}>{agent.city}</div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            background: todayAgentCount >= agent.target_daily ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                            color: todayAgentCount >= agent.target_daily ? '#10b981' : '#f97316',
                            fontWeight: 900,
                            fontSize: '12px'
                          }}>
                            {todayAgentCount} / {agent.target_daily} Stores
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '14px', color: '#ffffff' }}>{totalMonthCount} Stores</strong>
                        </td>
                        <td>
                          <div style={{ width: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, marginBottom: '4px' }}>
                              <span style={{ color: totalMonthCount >= 40 ? '#10b981' : '#94a3b8' }}>
                                {totalMonthCount >= 40 ? "🎉 Super Milestone Active!" : `${40 - totalMonthCount} more to unlock`}
                              </span>
                              <span style={{ color: '#f97316' }}>{totalMonthCount}/40</span>
                            </div>
                            <div style={{ height: '6px', background: '#27272a', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${Math.min(100, (totalMonthCount / 40) * 100)}%`, 
                                background: totalMonthCount >= 40 ? '#10b981' : 'linear-gradient(90deg, #f97316, #eab308)' 
                              }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          {incentiveEarned > 0 ? (
                            <span style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '8px', fontWeight: 900, fontSize: '13px' }}>
                              +₹{incentiveEarned.toLocaleString()} ({incentiveEligibleCount} × ₹100)
                            </span>
                          ) : (
                            <span style={{ color: '#71717a', fontSize: '12px' }}>₹0 (Reach 41+)</span>
                          )}
                        </td>
                        <td>
                          {pendingCash > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '13px' }}>₹{pendingCash.toLocaleString()}</span>
                              <button 
                                onClick={() => handleSettleCash(agent, pendingCash)}
                                style={{ padding: '4px 8px', background: '#27272a', border: '1px solid #3f3f46', color: '#ffffff', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                Settle
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 800 }}>✓ All Clear</span>
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
        <div className="animate-fade-in">
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 900 }}>REGISTERED FIELD EXECUTIVES ({agents.length})</h4>
              <p style={{ fontSize: '11px', color: '#71717a' }}>Only Admin can register/modify executive accounts.</p>
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
                {agents.map(agent => (
                  <tr key={agent.id}>
                    <td>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>{agent.name}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f97316' }}>{agent.mobile}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: '#27272a', padding: '2px 8px', borderRadius: '4px', color: '#a1a1aa' }}>
                        {agent.password}
                      </span>
                    </td>
                    <td>{agent.city}</td>
                    <td><strong>{agent.target_daily} Stores / Day</strong></td>
                    <td>
                      <button 
                        onClick={() => toggleAgentStatus(agent)}
                        style={{ 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          border: 'none', 
                          background: agent.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: agent.status === 'active' ? '#10b981' : '#ef4444',
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
                          style={{ padding: '6px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#38bdf8', cursor: 'pointer' }}
                          title="Edit Executive"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAgent(agent.id)}
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                          title="Remove Executive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE ONBOARDINGS TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === "onboardings" && (
        <div className="animate-fade-in">
          <div className="data-table-container">
            <div className="table-header">
              <h4 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 900 }}>ALL FIELD ONBOARDED STORES ({onboardedStores.length})</h4>
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
                </tr>
              </thead>
              <tbody>
                {onboardedStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
                      No stores onboarded via Field Sales App yet.
                    </td>
                  </tr>
                ) : (
                  onboardedStores.map(store => (
                    <tr key={store.id}>
                      <td>
                        <strong style={{ color: '#ffffff' }}>{store.store_name}</strong>
                      </td>
                      <td>{store.owner_mobile}</td>
                      <td>
                        <span style={{ padding: '4px 8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                          👤 {store.agentName}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#10b981' }}>₹{store.onboardingFee}</strong>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: store.paymentMode === 'UPI' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: store.paymentMode === 'UPI' ? '#60a5fa' : '#facc15',
                          fontWeight: 800,
                          fontSize: '11px'
                        }}>
                          {store.paymentMode}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#a1a1aa' }}>
                        {format(new Date(store.onboardingDate), "dd MMM yyyy, hh:mm aa")}
                      </td>
                      <td>
                        {store.shopPhoto ? (
                          <button 
                            onClick={() => setPreviewPhoto(store.shopPhoto)}
                            style={{ padding: '4px 8px', background: '#27272a', border: '1px solid #3f3f46', color: '#f97316', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Camera size={12} /> View Photo
                          </button>
                        ) : (
                          <span style={{ color: '#71717a', fontSize: '11px' }}>No Photo</span>
                        )}
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="data-table-container">
            <div className="table-header">
              <h4 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 900 }}>CASH SETTLEMENT HISTORY ({settlements.length})</h4>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
                      No cash settlements logged yet.
                    </td>
                  </tr>
                ) : (
                  settlements.map(set => (
                    <tr key={set.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>{set.id}</td>
                      <td>
                        <strong>{set.agent_name}</strong> ({set.agent_mobile})
                      </td>
                      <td>
                        <strong style={{ color: '#10b981', fontSize: '14px' }}>₹{Number(set.amount).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
                          ✓ CLEARED
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#a1a1aa' }}>
                        {format(new Date(set.date), "dd MMM yyyy, hh:mm aa")}
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
      {/* 5. MONTHLY ₹250 RENEWAL DESK */}
      {/* ========================================================================= */}
      {activeSubTab === "renewals" && (
        <div className="animate-fade-in">
          <div className="data-table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 900 }}>MONTHLY ₹250 SUBSCRIPTION RENEWAL DESK</h4>
                <p style={{ fontSize: '11px', color: '#71717a' }}>Call merchants or send 1-click WhatsApp payment reminders directly from your desktop.</p>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#10b981', fontWeight: 700 }}>
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
                          <strong style={{ color: '#ffffff', fontSize: '14px' }}>{store.store_name}</strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: '#f97316', fontWeight: 700 }}>{store.owner_mobile}</span>
                        </td>
                        <td>
                          <span style={{ color: '#38bdf8', fontWeight: 800 }}>Standard (₹250 / Month)</span>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            background: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: isExpired ? '#ef4444' : '#facc15',
                            fontWeight: 900,
                            fontSize: '11px'
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
                                background: '#10b981', 
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
                                background: '#27272a', 
                                border: '1px solid #3f3f46',
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
      {/* REGISTRATION MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '32px', position: 'relative' }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              {editingAgent ? "Edit Sales Executive" : "Register New Sales Executive"}
            </h3>
            <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '24px' }}>
              Create official login credentials for your Field Sales Partner App.
            </p>

            <form onSubmit={handleSaveAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Executive Full Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Mobile Number (Login ID)
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="10-digit mobile number"
                  value={agentMobile}
                  onChange={e => setAgentMobile(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  App Login Password / PIN
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 1234 or pass123"
                  value={agentPassword}
                  onChange={e => setAgentPassword(e.target.value)}
                  style={{ width: '100%', height: '48px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Assigned City / Area
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Delhi NCR"
                    value={agentCity}
                    onChange={e => setAgentCity(e.target.value)}
                    style={{ width: '100%', height: '48px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Daily Target (Stores)
                  </label>
                  <input 
                    type="number" 
                    value={agentDailyTarget}
                    onChange={e => setAgentDailyTarget(Number(e.target.value))}
                    style={{ width: '100%', height: '48px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '0 16px', color: '#ffffff', fontWeight: 600 }}
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
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '16px', maxWidth: '600px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setPreviewPhoto(null)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ffffff', borderRadius: '9999px', padding: '6px', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h4 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '12px', fontSize: '14px' }}>Shop Front Camera Verification</h4>
            <img src={previewPhoto} alt="Shop Front Verification" style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />
          </div>
        </div>
      )}

    </div>
  );
}
