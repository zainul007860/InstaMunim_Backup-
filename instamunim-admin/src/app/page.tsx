"use client";

import { useState, useEffect } from "react";
import { 
  Users, ShoppingBag, TrendingUp, Search, ShieldCheck, 
  Settings, LogOut, ChevronRight, ArrowUpRight, Clock,
  Plus, MoreVertical, Ban, CheckCircle2, Globe, LayoutDashboard,
  CreditCard, Smartphone, Zap, RefreshCw, Trash2, Filter,
  Send, Megaphone, Loader2, MessageSquare, Copy, ExternalLink,
  Download, Calendar, AlertTriangle, IndianRupee, FileText, X,
  Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, addDays, isAfter, isBefore, differenceInDays, differenceInHours, differenceInMinutes, startOfDay, endOfDay, subDays } from "date-fns";

export default function AdminDashboard() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [stores, setStores] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [totalSalesVal, setTotalSalesVal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<{[key: string]: string}>({});
  const [revealedPasswords, setRevealedPasswords] = useState<{[key: string]: boolean}>({});
  
  // Reset Account states
  const [resetStore, setResetStore] = useState<any | null>(null);
  const [confirmStoreName, setConfirmStoreName] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Sales Filters
  const [selectedMerchant, setSelectedMerchant] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Remote Config states
  const [remoteAdsEnabled, setRemoteAdsEnabled] = useState(true);
  const [remoteAdProvider, setRemoteAdProvider] = useState<"admob" | "web" | "none">("web");
  const [remoteWebAdScriptUrl, setRemoteWebAdScriptUrl] = useState("");
  const [remoteWebAdKey, setRemoteWebAdKey] = useState("");
  const [remoteWebAdDirectLink, setRemoteWebAdDirectLink] = useState("");
  const [remoteWebAdVignetteUrl, setRemoteWebAdVignetteUrl] = useState("");
  const [remoteWebAdVignetteKey, setRemoteWebAdVignetteKey] = useState("");
  const [remoteAdmobBannerId, setRemoteAdmobBannerId] = useState("");
  const [remoteAdmobInterstitialId, setRemoteAdmobInterstitialId] = useState("");
  const [remoteForceUpdateMinVersion, setRemoteForceUpdateMinVersion] = useState("1.5.0");
  const [remoteForceUpdateLink, setRemoteForceUpdateLink] = useState("");
  const [remoteMaintenanceMode, setRemoteMaintenanceMode] = useState(false);
  const [remoteMaintenanceMessage, setRemoteMaintenanceMessage] = useState("");
  const [remoteInAppAlertEnabled, setRemoteInAppAlertEnabled] = useState(false);
  const [remoteInAppAlertMessage, setRemoteInAppAlertMessage] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn]);

  const fetchAdminConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('store_logo')
        .eq('owner_mobile', 'admin_config')
        .single();
      
      if (data && data.store_logo && data.store_logo.startsWith("JSON_CFG:")) {
        const config = JSON.parse(data.store_logo.substring(9));
        setRemoteAdsEnabled(config.adsEnabled ?? true);
        setRemoteAdProvider(config.adProvider ?? "web");
        setRemoteWebAdScriptUrl(config.webAdScriptUrl ?? "");
        setRemoteWebAdKey(config.webAdKey ?? "");
        setRemoteWebAdDirectLink(config.webAdDirectLink ?? "");
        setRemoteWebAdVignetteUrl(config.webAdVignetteUrl ?? "");
        setRemoteWebAdVignetteKey(config.webAdVignetteKey ?? "");
        setRemoteAdmobBannerId(config.admobBannerId ?? "");
        setRemoteAdmobInterstitialId(config.admobInterstitialId ?? "");
        setRemoteForceUpdateMinVersion(config.forceUpdateMinVersion ?? "1.5.0");
        setRemoteForceUpdateLink(config.forceUpdateLink ?? "");
        setRemoteMaintenanceMode(config.maintenanceMode ?? false);
        setRemoteMaintenanceMessage(config.maintenanceMessage ?? "");
        setRemoteInAppAlertEnabled(config.inAppAlertEnabled ?? false);
        setRemoteInAppAlertMessage(config.inAppAlertMessage ?? "");
      }
    } catch (e) {
      console.error("Error loading remote config:", e);
    }
  };

  const saveAdminConfig = async () => {
    setIsSavingConfig(true);
    try {
      const configObj = {
        adsEnabled: remoteAdsEnabled,
        adProvider: remoteAdProvider,
        webAdScriptUrl: remoteWebAdScriptUrl,
        webAdKey: remoteWebAdKey,
        webAdDirectLink: remoteWebAdDirectLink,
        webAdVignetteUrl: remoteWebAdVignetteUrl,
        webAdVignetteKey: remoteWebAdVignetteKey,
        admobBannerId: remoteAdmobBannerId,
        admobInterstitialId: remoteAdmobInterstitialId,
        forceUpdateMinVersion: remoteForceUpdateMinVersion,
        forceUpdateLink: remoteForceUpdateLink,
        maintenanceMode: remoteMaintenanceMode,
        maintenanceMessage: remoteMaintenanceMessage,
        inAppAlertEnabled: remoteInAppAlertEnabled,
        inAppAlertMessage: remoteInAppAlertMessage
      };

      const serialized = "JSON_CFG:" + JSON.stringify(configObj);
      
      const { error } = await supabase
        .from('stores')
        .update({ store_logo: serialized })
        .eq('owner_mobile', 'admin_config');
      
      if (error) throw error;
      alert("SUCCESS: Remote Configuration updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save config: " + (err.message || err));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const fetchAdminData = async () => {
    setIsRefreshing(true);
    try {
      const { data: storesData } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      const { data: salesData } = await supabase.from('sales').select('*, stores(store_name)').order('sale_date', { ascending: false });
      
      if (storesData) setStores(storesData);
      if (salesData) {
        setAllSales(salesData);
        const total = salesData.reduce((sum, s) => sum + Number(s.total_price), 0);
        setTotalSalesVal(total);
      }
      await fetchAdminConfig();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const initiateReset = (store: any) => {
    setResetStore(store);
    setConfirmStoreName("");
  };

  const executeReset = async () => {
    if (!resetStore) return;
    if (confirmStoreName !== resetStore.store_name) {
      alert("Error: Store name does not match!");
      return;
    }
    setIsResetting(true);
    try {
      // 1. Delete sales
      const { error: salesErr } = await supabase
        .from('sales')
        .delete()
        .eq('store_id', resetStore.id);
      if (salesErr) throw salesErr;

      // 2. Delete expenses
      const { error: expErr } = await supabase
        .from('expenses')
        .delete()
        .eq('store_id', resetStore.id);
      if (expErr) throw expErr;

      // 3. Delete exchange menu items
      const { error: menuErr } = await supabase
        .from('menu_items')
        .delete()
        .eq('store_id', resetStore.id)
        .ilike('category', 'Exchange%');
      if (menuErr) throw menuErr;

      alert(`SUCCESS: Account data reset successfully for ${resetStore.store_name}!`);
      setResetStore(null);
      fetchAdminData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to reset account: " + (err.message || err));
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === "munim@admin") {
      setIsAdminLoggedIn(true);
    } else {
      alert("Unauthorized Access!");
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    if (!confirm(`Are you sure you want to set this store to ${newStatus}?`)) return;
    try {
      await supabase.from('stores').update({ status: newStatus }).eq('id', storeId);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const addSubscriptionDays = async (store: any, days: number) => {
    const now = new Date();
    const currentExpiry = (store.subscription_expiry && isAfter(new Date(store.subscription_expiry), now)) 
      ? new Date(store.subscription_expiry) 
      : now;
    const newExpiry = addDays(currentExpiry, days);
    
    // Check if custom price/discount is set
    const typedPrice = customPrices[store.id];
    const planPrice = typedPrice && !isNaN(Number(typedPrice)) && Number(typedPrice) >= 0 
      ? Number(typedPrice) 
      : (days === 365 ? 1999 : 199);

    // Immediate Feedback
    if (!confirm(`Confirm: Extend ${store.store_name} by ${days} days? (Plan Price: ₹${planPrice})`)) return;
    
    setUpdatingStoreId(store.id);
    try {
      const { error } = await supabase.from('stores').update({ 
        subscription_expiry: newExpiry.toISOString(),
        monthly_rent: planPrice
      }).eq('id', store.id);
      
      if (error) throw error;
      
      alert(`SUCCESS: ${store.store_name} updated. Expiry: ${format(newExpiry, "MMM dd, yyyy")} (Plan: ₹${planPrice})`);
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      alert("Sync Error: " + (err.message || JSON.stringify(err) || "Unknown error"));
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const toggleSubscriptionActive = async (store: any, isCurrentlyActive: boolean) => {
    const action = isCurrentlyActive ? 'DEACTIVATE' : 'ACTIVATE';
    if (!confirm(`Are you sure you want to ${action} ${store.store_name}?`)) return;
    
    setUpdatingStoreId(store.id);
    try {
      let newExpiry;
      if (isCurrentlyActive) {
        newExpiry = subDays(new Date(), 1);
      } else {
        const days = Number(store.monthly_rent) === 1999 ? 365 : 30;
        newExpiry = addDays(new Date(), days);
      }
      
      const { error } = await supabase.from('stores').update({ 
        subscription_expiry: newExpiry.toISOString()
      }).eq('id', store.id);
      
      if (error) throw error;
      
      alert(`SUCCESS: ${store.store_name} has been ${isCurrentlyActive ? 'deactivated' : 'activated'}.`);
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      alert("Sync Error: " + (err.message || JSON.stringify(err) || "Unknown error"));
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const makeStoreFreemium = async (store: any) => {
    if (!confirm(`Are you sure you want to convert ${store.store_name} to FREEMIUM?`)) return;
    
    setUpdatingStoreId(store.id);
    try {
      const pastExpiry = subDays(new Date(), 1);
      const { error } = await supabase.from('stores').update({ 
        subscription_expiry: pastExpiry.toISOString(),
        monthly_rent: 0
      }).eq('id', store.id);
      
      if (error) throw error;
      
      alert(`SUCCESS: ${store.store_name} has been set to FREEMIUM.`);
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      alert("Sync Error: " + (err.message || JSON.stringify(err) || "Unknown error"));
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const deleteStore = async (store: any) => {
    const doubleConfirm = confirm(`⚠️ DANGER: Are you sure you want to permanently DELETE "${store.store_name}"?\nAll sales data, menu items, expenses, and the store account itself will be deleted forever. This cannot be undone!`);
    if (!doubleConfirm) return;

    const finalConfirm = prompt(`To confirm deletion, please type the store name: "${store.store_name}"`);
    if (!finalConfirm || finalConfirm.trim().toLowerCase() !== store.store_name.trim().toLowerCase()) {
      alert("Store name did not match. Deletion cancelled.");
      return;
    }

    setUpdatingStoreId(store.id);
    try {
      // 1. Delete dependent data first to satisfy foreign keys
      const salesRes = await supabase.from('sales').delete().eq('store_id', store.id);
      if (salesRes.error) console.warn("Failed to delete sales:", salesRes.error);
      
      const expensesRes = await supabase.from('expenses').delete().eq('store_id', store.id);
      if (expensesRes.error) console.warn("Failed to delete expenses:", expensesRes.error);

      const menuRes = await supabase.from('menu_items').delete().eq('store_id', store.id);
      if (menuRes.error) console.warn("Failed to delete menu items:", menuRes.error);

      // 2. Delete the store itself
      const { error } = await supabase.from('stores').delete().eq('id', store.id);
      
      if (error) throw error;
      
      alert(`SUCCESS: ${store.store_name} and all its data have been permanently deleted.`);
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      alert("Delete Error: " + (err.message || JSON.stringify(err) || "Unknown error"));
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const togglePasswordVisibility = (storeId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [storeId]: !prev[storeId]
    }));
  };

  const openWhatsApp = (mobile: string) => {
    const msg = encodeURIComponent(broadcastMessage || "Hello from InstaMunim!");
    const cleanMobile = mobile.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/91${cleanMobile.slice(-10)}?text=${msg}`, "_blank");
  };

  const getStatusColor = (store: any) => {
    if (store.status === 'suspended') return '#ef4444';
    
    const now = new Date();
    const expiry = store.subscription_expiry ? new Date(store.subscription_expiry) : null;
    const isPaidActive = expiry && isAfter(expiry, now);
    
    const created = new Date(store.created_at);
    const trialEnds = new Date(created.getTime() + (7 * 24 * 60 * 60 * 1000));
    const isTrialActive = !expiry && isBefore(now, trialEnds);

    if (isPaidActive) {
      if (differenceInDays(expiry!, now) <= 3) return '#facc15';
      return '#10b981';
    }
    if (isTrialActive) {
      return '#f97316';
    }
    return '#a1a1aa';
  };

  const filteredStores = stores.filter(s => 
    s.store_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.owner_mobile.includes(searchQuery)
  );

  const filteredSales = allSales.filter(sale => {
    const matchesSearch = (sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || sale.stores?.store_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMerchant = selectedMerchant === "all" || sale.store_id === selectedMerchant;
    const matchesPayment = selectedPayment === "all" || sale.payment_type === selectedPayment;
    let matchesDate = true;
    const saleDate = new Date(sale.sale_date);
    if (dateFilter === "today") matchesDate = isAfter(saleDate, startOfDay(new Date()));
    else if (dateFilter === "yesterday") matchesDate = isAfter(saleDate, startOfDay(subDays(new Date(), 1))) && isBefore(saleDate, startOfDay(new Date()));
    else if (dateFilter === "week") matchesDate = isAfter(saleDate, subDays(new Date(), 7));
    return matchesSearch && matchesMerchant && matchesPayment && matchesDate;
  });

  if (!isAdminLoggedIn) {
    return (
      <div className="login-container" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-card">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src="/assets/logo-light.png" alt="InstaMunim Logo" style={{ width: '450px', height: '450px', objectFit: 'contain' }} />
          </div>
          <div className="login-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px' }}>COMMAND CENTER</h1>
            <p style={{ color: '#f97316', fontWeight: 700, letterSpacing: '2px', marginTop: '8px', fontSize: '10px' }}>ADMIN ACCESS SECURED</p>
          </div>
          <form onSubmit={handleAdminLogin}>
            <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="••••••••" className="login-input" style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button type="submit" className="login-btn" style={{ width: '100%', maxWidth: '260px', background: '#f97316' }}>INITIALIZE SESSION</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="logo-section" style={{ marginBottom: '40px' }}>
          <img src="/assets/logo-light.png" alt="InstaMunim" style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain' }} />
        </div>
        <nav className="nav-links">
          {["Dashboard", "Merchants", "Sales", "Broadcast", "Subscriptions", "Settings"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-item ${activeTab === tab ? "active" : ""}`}>
              {tab === "Dashboard" && <LayoutDashboard size={19} />}
              {tab === "Merchants" && <Users size={19} />}
              {tab === "Sales" && <Globe size={19} />}
              {tab === "Broadcast" && <Megaphone size={19} />}
              {tab === "Subscriptions" && <CreditCard size={19} />}
              {tab === "Settings" && <Settings size={19} />}
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAdminLoggedIn(false)} className="nav-item" style={{ marginTop: 'auto', color: '#71717a' }}><LogOut size={19} /> Logout</button>
      </aside>

      <main className="main-content">
        <header className="header" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', marginBottom: '4px' }}>{activeTab.toUpperCase()}</h1>
              <p style={{ color: '#f97316', fontSize: '10px', fontWeight: 800, letterSpacing: '2px' }}>COMMAND CENTER • GLOBAL NETWORK</p>
            </div>
            <button 
              onClick={fetchAdminData} 
              className={`nav-item ${isRefreshing ? "animate-spin" : ""}`} 
              style={{ 
                width: '48px', 
                height: '48px', 
                background: '#ffffff', 
                borderRadius: '14px', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                transition: 'all 0.3s'
              }}
            >
              <RefreshCw size={20} color={isRefreshing ? "var(--text)" : "#f97316"} />
            </button>
          </div>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} size={18} />
            <input 
              type="text" 
              placeholder="Search merchants, customer names, or store IDs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                height: '56px', 
                background: '#ffffff', 
                border: '1px solid var(--border)', 
                borderRadius: '18px', 
                paddingLeft: '56px', 
                color: 'var(--text)', 
                fontWeight: 600, 
                fontSize: '14px', 
                boxShadow: '0 4px 20px rgba(24,24,27,0.02)'
              }}
            />
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <div className="animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card"><p>Total Merchants</p><h3>{stores.length}</h3></div>
              <div className="stat-card"><p>Global GMV</p><h3>₹{totalSalesVal.toLocaleString()}</h3></div>
              <div className="stat-card"><p>Est. Revenue</p><h3 style={{ color: '#f97316' }}>₹{stores.reduce((sum, s) => sum + ((s.monthly_rent === null || s.monthly_rent === undefined) ? 199 : Number(s.monthly_rent)), 0).toLocaleString()}</h3></div>
            </div>
            <div className="data-table-container">
               <div className="table-header"><h4 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)' }}>RECENT ONBOARDING</h4></div>
                <table className="table-content">
                  <thead><tr><th>Store</th><th>Contact</th><th>Status</th><th>Expiry</th></tr></thead>
                  <tbody>{stores.slice(0, 10).map(s => {
                    const now = new Date();
                    const expiry = s.subscription_expiry ? new Date(s.subscription_expiry) : null;
                    const isPaidActive = expiry && isAfter(expiry, now);
                    
                    const created = new Date(s.created_at);
                    const trialEnds = new Date(created.getTime() + (7 * 24 * 60 * 60 * 1000));
                    const isTrialActive = !expiry && isBefore(now, trialEnds);

                    return (
                      <tr key={s.id}>
                        <td>{s.store_name}</td>
                        <td>{s.owner_mobile}</td>
                        <td>
                          {isPaidActive ? (
                            <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>ACTIVE</span>
                          ) : isTrialActive ? (
                            <span style={{ padding: '4px 8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>TRIAL</span>
                          ) : (
                            <span style={{ padding: '4px 8px', background: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>FREEMIUM</span>
                          )}
                        </td>
                        <td style={{ color: getStatusColor(s), fontWeight: 700 }}>{s.subscription_expiry ? format(new Date(s.subscription_expiry), "MMM dd") : 'Trial'}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === "Sales" && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
               <select value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)} style={{ flex: 1, height: '44px', background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">All Merchants</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
               </select>
               <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} style={{ width: '150px', height: '44px', background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">All Modes</option><option value="Cash">Cash</option><option value="Online">Online</option>
               </select>
               <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: '150px', height: '44px', background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">Lifetime</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">7 Days</option>
               </select>
            </div>
            <div className="data-table-container">
               <div className="table-header"><h4 style={{ color: 'var(--text)' }}>SALES LOG ({filteredSales.length})</h4><div style={{ color: '#f97316', fontWeight: 900 }}>Total: ₹{filteredSales.reduce((s, a) => s + Number(a.total_price), 0).toLocaleString()}</div></div>
               <table className="table-content">
                  <thead><tr><th>Store</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>{filteredSales.map(sale => (
                    <tr key={sale.id}><td style={{ color: '#f97316', fontWeight: 800 }}>{sale.stores?.store_name}</td><td>{sale.customer_name || "Guest"}</td><td style={{ fontWeight: 900 }}>₹{Number(sale.total_price).toLocaleString()}</td><td>{format(new Date(sale.sale_date), "MMM dd, hh:mm aa")}</td></tr>
                  ))}</tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === "Subscriptions" && (
          <div className="data-table-container animate-fade-in">
             <div className="table-header"><h4 style={{ color: 'var(--text)' }}>SUBSCRIPTIONS</h4></div>
             <table className="table-content">
                <thead><tr><th>Merchant</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{filteredStores.map(s => {
                  const now = new Date();
                  const expiry = s.subscription_expiry ? new Date(s.subscription_expiry) : null;
                  const isPaidActive = expiry && isAfter(expiry, now);
                  
                  const created = new Date(s.created_at);
                  const trialEnds = new Date(created.getTime() + (7 * 24 * 60 * 60 * 1000));
                  const isTrialActive = !expiry && isBefore(now, trialEnds);
                  
                  return (
                    <tr key={s.id}>
                      <td>{s.store_name}</td>
                      <td>
                        {isPaidActive ? (
                          s.monthly_rent === 1999 ? (
                            <span style={{ color: '#10b981', fontWeight: 800 }}>Yearly (₹1999)</span>
                          ) : (
                            <span style={{ color: '#f97316', fontWeight: 800 }}>
                              Monthly (<span style={{ textDecoration: 'line-through', opacity: 0.5 }}>₹299</span> ₹199)
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#a1a1aa', fontWeight: 800 }}>Freemium</span>
                        )}
                      </td>
                      <td style={{ color: getStatusColor(s), fontWeight: 700 }}>{s.subscription_expiry ? format(new Date(s.subscription_expiry), "MMM dd, yyyy") : 'TRIAL'}</td>
                      <td>
                        {isPaidActive ? (
                          <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>ACTIVE</span>
                        ) : isTrialActive ? (
                          <span style={{ padding: '4px 8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>TRIAL</span>
                        ) : (
                          <span style={{ padding: '4px 8px', background: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>FREEMIUM</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            placeholder="Custom ₹" 
                            value={customPrices[s.id] || ""}
                            onChange={(e) => setCustomPrices({ ...customPrices, [s.id]: e.target.value })}
                            style={{ 
                              width: '75px', 
                              height: '32px', 
                              borderRadius: '8px', 
                              border: '1px solid var(--border)', 
                              padding: '0 8px', 
                              fontSize: '11px', 
                              fontWeight: 600,
                              outline: 'none',
                              color: 'var(--text)',
                              background: '#ffffff'
                            }}
                          />
                          <button 
                            disabled={updatingStoreId === s.id}
                            onClick={() => addSubscriptionDays(s, 30)} 
                            style={{ padding: '8px 12px', background: '#f97316', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', opacity: updatingStoreId === s.id ? 0.5 : 1 }}
                          >
                            {updatingStoreId === s.id ? <Loader2 className="animate-spin" size={12} /> : null}
                            {updatingStoreId === s.id ? 'WAIT...' : '+ 30 DAYS'}
                          </button>
                          <button 
                            disabled={updatingStoreId === s.id}
                            onClick={() => addSubscriptionDays(s, 365)} 
                            style={{ padding: '8px 12px', background: '#10b981', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', opacity: updatingStoreId === s.id ? 0.5 : 1 }}
                          >
                            {updatingStoreId === s.id ? <Loader2 className="animate-spin" size={12} /> : null}
                            {updatingStoreId === s.id ? 'WAIT...' : '+ 365 DAYS'}
                          </button>
                          <button 
                            disabled={updatingStoreId === s.id}
                            onClick={() => toggleSubscriptionActive(s, !!isPaidActive)} 
                            style={{ 
                              padding: '8px 12px', 
                              background: isPaidActive ? '#ef4444' : '#10b981', 
                              color: 'white', 
                              borderRadius: '10px', 
                              border: 'none', 
                              fontWeight: 900, 
                              cursor: 'pointer', 
                              fontSize: '10px', 
                              opacity: updatingStoreId === s.id ? 0.5 : 1 
                            }}
                          >
                            {updatingStoreId === s.id ? '...' : (isPaidActive ? 'DEACTIVATE' : 'ACTIVATE')}
                          </button>
                          <button 
                            disabled={updatingStoreId === s.id}
                            onClick={() => makeStoreFreemium(s)} 
                            style={{ 
                              padding: '8px 12px', 
                              background: '#71717a', 
                              color: 'white', 
                              borderRadius: '10px', 
                              border: 'none', 
                              fontWeight: 900, 
                              cursor: 'pointer', 
                              fontSize: '10px', 
                              opacity: updatingStoreId === s.id ? 0.5 : 1 
                            }}
                          >
                            {updatingStoreId === s.id ? '...' : 'MAKE FREEMIUM'}
                          </button>
                          <button 
                            disabled={updatingStoreId === s.id}
                            onClick={() => deleteStore(s)} 
                            style={{ 
                              padding: '8px 12px', 
                              background: '#ef4444', 
                              color: 'white', 
                              borderRadius: '10px', 
                              border: 'none', 
                              fontWeight: 900, 
                              cursor: 'pointer', 
                              fontSize: '10px', 
                              opacity: updatingStoreId === s.id ? 0.5 : 1 
                            }}
                          >
                            {updatingStoreId === s.id ? '...' : 'DELETE'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
             </table>
          </div>
        )}

        {activeTab === "Merchants" && (
          <div className="data-table-container animate-fade-in">
             <div className="table-header"><h4 style={{ color: 'var(--text)' }}>MERCHANTS</h4></div>
             <table className="table-content">
                <thead><tr><th>Store</th><th>Contact</th><th>Password</th><th>Category</th><th>Status (Last Activity)</th><th>Action</th></tr></thead>
                <tbody>{filteredStores.map(s => {
                  // Find the merchant's most recent sale
                  const merchantSales = allSales.filter(sale => sale.store_id === s.id);
                  let statusText = "No Sales";
                  let isActive = false;
                  let color = "#a1a1aa"; // Gray
                  
                  if (merchantSales.length > 0) {
                    const lastSale = merchantSales[0]; // Ordered descending by date in fetch
                    const lastSaleDate = new Date(lastSale.sale_date);
                    const now = new Date();
                    
                    const minutesElapsed = differenceInMinutes(now, lastSaleDate);
                    const hoursElapsed = differenceInHours(now, lastSaleDate);
                    const daysElapsed = differenceInDays(now, lastSaleDate);
                    
                    isActive = hoursElapsed < 24;
                    color = isActive ? "#10b981" : "#a1a1aa"; // Green if active within 24h, else gray
                    
                    if (minutesElapsed < 60) {
                      statusText = `Active ${minutesElapsed}m ago`;
                    } else if (hoursElapsed < 24) {
                      statusText = `Active ${hoursElapsed}h ago`;
                    } else {
                      statusText = `Inactive ${daysElapsed}d ago`;
                    }
                  }

                  return (
                    <tr key={s.id}>
                      <td>{s.store_name}</td>
                      <td>{s.owner_mobile}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px' }}>
                            {revealedPasswords[s.id] ? (s.password || 'N/A') : "••••••••"}
                          </span>
                          <button 
                            type="button"
                            onClick={() => togglePasswordVisibility(s.id)} 
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#71717a', 
                              cursor: 'pointer', 
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              outline: 'none'
                            }}
                            title={revealedPasswords[s.id] ? "Hide Password" : "View Password"}
                          >
                            {revealedPasswords[s.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <select
                          value={s.business_type || "Restaurant/Cafe"}
                          onChange={async (e) => {
                            const newBType = e.target.value;
                            setUpdatingStoreId(s.id);
                            try {
                              const { error } = await supabase
                                .from('stores')
                                .update({ business_type: newBType })
                                .eq('id', s.id);
                              if (error) throw error;
                              setStores(prev => prev.map(store => store.id === s.id ? { ...store, business_type: newBType } : store));
                            } catch (err: any) {
                              alert("Failed to update category: " + (err.message || err));
                            } finally {
                              setUpdatingStoreId(null);
                            }
                          }}
                          disabled={updatingStoreId === s.id}
                          style={{
                            padding: '6px 8px',
                            background: 'var(--card-bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            outline: 'none',
                            cursor: 'pointer',
                            width: '140px'
                          }}
                        >
                          <option value="Restaurant/Cafe">🍔 Restaurant/Cafe</option>
                          <option value="Grocery/Supermarket">🛒 Grocery/Supermarket</option>
                          <option value="Bakery/Sweets">🍰 Bakery/Sweets</option>
                          <option value="Dairy/Milk Parlour">🥛 Dairy/Milk Parlour</option>
                          <option value="Clothing/Footwear">👕 Clothing/Footwear</option>
                          <option value="Salon/Spa">💇‍♂️ Salon/Spa</option>
                          <option value="Electrical/Hardware">⚙️ Electrical/Hardware</option>
                          <option value="Other Business">📦 Other Business</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: color,
                            display: 'inline-block'
                          }} />
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            color: color,
                            letterSpacing: '0.3px'
                          }}>
                            {statusText}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => openWhatsApp(s.owner_mobile)} style={{ padding: '8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', borderRadius: '10px', cursor: 'pointer' }} title="WhatsApp Merchant"><MessageSquare size={16} /></button>
                          <button 
                            onClick={() => initiateReset(s)} 
                            style={{ 
                              padding: '8px', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              color: '#ef4444', 
                              border: '1px solid #ef4444', 
                              borderRadius: '10px', 
                              cursor: 'pointer'
                            }}
                            title="Reset Sales & Expenses Ledger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
             </table>
          </div>
        )}

        {activeTab === "Broadcast" && (
           <div className="broadcast-box animate-fade-in">
              <h3 style={{ color: 'var(--text)' }}>GLOBAL BROADCAST</h3>
              <textarea className="broadcast-textarea" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type announcement..." />
              <button onClick={() => setActiveTab("Merchants")} className="login-btn">GO TO MERCHANTS</button>
           </div>
        )}

        {activeTab === "Settings" && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '50px' }}>
            {/* Save Config Header Card */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(24,24,27,0.02)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '4px' }}>REMOTE CONFIGURATION</h3>
                <p style={{ color: '#71717a', fontSize: '11px', fontWeight: 500 }}>Update mobile app parameters instantly without rebuilding APK/AAB</p>
              </div>
              <button 
                onClick={saveAdminConfig} 
                disabled={isSavingConfig}
                className="login-btn"
                style={{ 
                  margin: 0, 
                  background: '#f97316', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '13px'
                }}
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    SAVE CHANGES
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              {/* Ad Control Section */}
              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 20px rgba(24,24,27,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <Megaphone size={20} color="#f97316" />
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.2px' }}>GLOBAL ADVERT CONTROLS</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>Enable All Ads</span>
                  <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={remoteAdsEnabled} 
                      onChange={(e) => setRemoteAdsEnabled(e.target.checked)} 
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: remoteAdsEnabled ? '#f97316' : '#e4e4e7',
                      transition: '.4s', borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                        transform: remoteAdsEnabled ? 'translateX(20px)' : 'none'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Select Ad Network Provider</label>
                  <select 
                    value={remoteAdProvider} 
                    onChange={(e) => setRemoteAdProvider(e.target.value as any)}
                    className="login-input"
                    style={{ background: '#fafaf9', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    <option value="admob">Google AdMob (App Native)</option>
                    <option value="web">Web Ads / Monetag (HTML Script)</option>
                    <option value="none">Disabled / No Ads</option>
                  </select>
                </div>

                {remoteAdProvider === "admob" && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>AdMob Banner Unit ID</label>
                      <input 
                        type="text" 
                        value={remoteAdmobBannerId} 
                        onChange={(e) => setRemoteAdmobBannerId(e.target.value)} 
                        placeholder="ca-app-pub-xxx/yyy" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>AdMob Interstitial Unit ID</label>
                      <input 
                        type="text" 
                        value={remoteAdmobInterstitialId} 
                        onChange={(e) => setRemoteAdmobInterstitialId(e.target.value)} 
                        placeholder="ca-app-pub-xxx/zzz" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                  </>
                )}

                {remoteAdProvider === "web" && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Web Ad Banner Script URL</label>
                      <input 
                        type="text" 
                        value={remoteWebAdScriptUrl} 
                        onChange={(e) => setRemoteWebAdScriptUrl(e.target.value)} 
                        placeholder="https://nap5k.com/tag.min.js" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Web Ad Banner Placement Key / ID</label>
                      <input 
                        type="text" 
                        value={remoteWebAdKey} 
                        onChange={(e) => setRemoteWebAdKey(e.target.value)} 
                        placeholder="11070941" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Web Interstitial / Direct Link URL</label>
                      <input 
                        type="text" 
                        value={remoteWebAdDirectLink} 
                        onChange={(e) => setRemoteWebAdDirectLink(e.target.value)} 
                        placeholder="https://omg10.com/4/11071013" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Web Vignette Video Script URL</label>
                      <input 
                        type="text" 
                        value={remoteWebAdVignetteUrl} 
                        onChange={(e) => setRemoteWebAdVignetteUrl(e.target.value)} 
                        placeholder="https://n6wxm.com/vignette.min.js" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Web Vignette Video Zone ID</label>
                      <input 
                        type="text" 
                        value={remoteWebAdVignetteKey} 
                        onChange={(e) => setRemoteWebAdVignetteKey(e.target.value)} 
                        placeholder="11076598" 
                        className="login-input"
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* System & Update Section */}
                <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 20px rgba(24,24,27,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <Settings size={20} color="#f97316" />
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.2px' }}>SYSTEM & UPDATE MANAGEMENT</h4>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block' }}>Maintenance Mode</span>
                      <span style={{ fontSize: '10px', color: '#71717a' }}>Blocks all user activity inside the app</span>
                    </div>
                    <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={remoteMaintenanceMode} 
                        onChange={(e) => setRemoteMaintenanceMode(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: remoteMaintenanceMode ? '#ef4444' : '#e4e4e7',
                        transition: '.4s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                          transform: remoteMaintenanceMode ? 'translateX(20px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>

                  {remoteMaintenanceMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Maintenance Notice Message</label>
                      <textarea 
                        value={remoteMaintenanceMessage} 
                        onChange={(e) => setRemoteMaintenanceMessage(e.target.value)} 
                        placeholder="Write notice..."
                        rows={3} 
                        className="broadcast-textarea"
                        style={{ height: '70px', padding: '12px', fontSize: '12px' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Minimum Required Version (tVersion)</label>
                    <input 
                      type="text" 
                      value={remoteForceUpdateMinVersion} 
                      onChange={(e) => setRemoteForceUpdateMinVersion(e.target.value)} 
                      placeholder="1.5.1" 
                      className="login-input"
                      style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Play Store / Update URL</label>
                    <input 
                      type="text" 
                      value={remoteForceUpdateLink} 
                      onChange={(e) => setRemoteForceUpdateLink(e.target.value)} 
                      placeholder="https://play.google.com/store/apps/details?id=com.zainul.instamunimpos" 
                      className="login-input"
                      style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                {/* Global In-App Banner Alerts */}
                <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 20px rgba(24,24,27,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <Users size={20} color="#f97316" />
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.2px' }}>IN-APP BROADCAST / ALERTS</h4>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block' }}>Display Alert Banner</span>
                      <span style={{ fontSize: '10px', color: '#71717a' }}>Shows warning/news at top of app screen</span>
                    </div>
                    <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={remoteInAppAlertEnabled} 
                        onChange={(e) => setRemoteInAppAlertEnabled(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: remoteInAppAlertEnabled ? '#f97316' : '#e4e4e7',
                        transition: '.4s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                          transform: remoteInAppAlertEnabled ? 'translateX(20px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>

                  {remoteInAppAlertEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Alert Message Text</label>
                      <textarea 
                        value={remoteInAppAlertMessage} 
                        onChange={(e) => setRemoteInAppAlertMessage(e.target.value)} 
                        placeholder="Welcome to InstaMunim! Print billing is now faster."
                        rows={3} 
                        className="broadcast-textarea"
                        style={{ height: '70px', padding: '12px', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RESET SAFETY CONFIRMATION MODAL */}
      {resetStore && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: '24px', padding: '30px', maxWidth: '380px', width: '100%',
            display: 'flex', flexDirection: 'column', gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: 'var(--text)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 900, color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} /> RESET STORE DATA
              </h3>
              <button onClick={() => setResetStore(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#71717a', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
              Warning: This will permanently delete all **Sales**, **Expenses (Buyback exchange ledger)**, and **Unsold Exchange Stock** for <strong style={{ color: 'var(--text)' }}>{resetStore.store_name}</strong>. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#a1a1aa', letterSpacing: '0.5px' }}>
                TYPE STORE NAME TO CONFIRM:
              </label>
              <input 
                type="text"
                value={confirmStoreName}
                onChange={(e) => setConfirmStoreName(e.target.value)}
                placeholder={resetStore.store_name}
                style={{
                  width: '100%', height: '46px', background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)', borderRadius: '12px',
                  padding: '0 16px', color: 'var(--text)', fontWeight: 'bold', fontSize: '13px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={executeReset}
              disabled={confirmStoreName !== resetStore.store_name || isResetting}
              style={{
                width: '100%', height: '48px', background: confirmStoreName === resetStore.store_name ? '#ef4444' : '#ef444440',
                color: '#ffffff', border: '0', borderRadius: '14px', fontWeight: 900, fontSize: '12px',
                letterSpacing: '1px', textTransform: 'uppercase', cursor: confirmStoreName === resetStore.store_name ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s'
              }}
            >
              {isResetting ? <Loader2 size={16} className="animate-spin" /> : "RESET DATA NOW"}
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
