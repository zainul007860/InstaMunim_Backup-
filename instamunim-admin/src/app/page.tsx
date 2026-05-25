"use client";

import { useState, useEffect } from "react";
import { 
  Users, ShoppingBag, TrendingUp, Search, ShieldCheck, 
  Settings, LogOut, ChevronRight, ArrowUpRight, Clock,
  Plus, MoreVertical, Ban, CheckCircle2, Globe, LayoutDashboard,
  CreditCard, Smartphone, Zap, RefreshCw, Trash2, Filter,
  Send, Megaphone, Loader2, MessageSquare, Copy, ExternalLink,
  Download, Calendar, AlertTriangle, IndianRupee, FileText, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, addDays, isAfter, isBefore, differenceInDays, startOfDay, endOfDay, subDays } from "date-fns";

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
  
  // Sales Filters
  const [selectedMerchant, setSelectedMerchant] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
    
    // Immediate Feedback
    if (!confirm(`Confirm: Extend ${store.store_name} by ${days} days?`)) return;
    
    const planPrice = days === 365 ? 3600 : 399;
    
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
        const days = Number(store.monthly_rent) === 3600 ? 365 : 30;
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
      <div className="login-container" style={{ background: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-card" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src="/assets/logo-dark.png" alt="InstaMunim Logo" style={{ width: '450px', height: '450px', objectFit: 'contain' }} />
          </div>
          <div className="login-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>COMMAND CENTER</h1>
            <p style={{ color: '#f97316', fontWeight: 700, letterSpacing: '2px', marginTop: '8px', fontSize: '10px' }}>ADMIN ACCESS SECURED</p>
          </div>
          <form onSubmit={handleAdminLogin}>
            <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="••••••••" className="login-input" style={{ background: '#1c1c1f', border: 'none', color: 'white' }} />
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
          <img src="/assets/logo-dark.png" alt="InstaMunim" style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain' }} />
        </div>
        <nav className="nav-links">
          {["Dashboard", "Merchants", "Sales", "Broadcast", "Subscriptions"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-item ${activeTab === tab ? "active" : ""}`}>
              {tab === "Dashboard" && <LayoutDashboard size={19} />}
              {tab === "Merchants" && <Users size={19} />}
              {tab === "Sales" && <Globe size={19} />}
              {tab === "Broadcast" && <Megaphone size={19} />}
              {tab === "Subscriptions" && <CreditCard size={19} />}
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
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: '4px' }}>{activeTab.toUpperCase()}</h1>
              <p style={{ color: '#f97316', fontSize: '10px', fontWeight: 800, letterSpacing: '2px' }}>COMMAND CENTER • GLOBAL NETWORK</p>
            </div>
            <button 
              onClick={fetchAdminData} 
              className={`nav-item ${isRefreshing ? "animate-spin" : ""}`} 
              style={{ 
                width: '48px', 
                height: '48px', 
                background: '#1c1c1f', 
                borderRadius: '14px', 
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                transition: 'all 0.3s'
              }}
            >
              <RefreshCw size={20} color={isRefreshing ? "#ffffff" : "#f97316"} />
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
                background: '#111113', 
                border: '1px solid #27272a', 
                borderRadius: '18px', 
                paddingLeft: '56px', 
                color: 'white', 
                fontWeight: 600, 
                fontSize: '14px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <div className="animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card"><p>Total Merchants</p><h3>{stores.length}</h3></div>
              <div className="stat-card"><p>Global GMV</p><h3>₹{totalSalesVal.toLocaleString()}</h3></div>
              <div className="stat-card"><p>Est. Revenue</p><h3 style={{ color: '#f97316' }}>₹{stores.reduce((sum, s) => sum + ((s.monthly_rent === null || s.monthly_rent === undefined) ? 399 : Number(s.monthly_rent)), 0).toLocaleString()}</h3></div>
            </div>
            <div className="data-table-container">
               <div className="table-header"><h4 style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>RECENT ONBOARDING</h4></div>
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
               <select value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)} style={{ flex: 1, height: '44px', background: '#1c1c1f', color: 'white', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">All Merchants</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
               </select>
               <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} style={{ width: '150px', height: '44px', background: '#1c1c1f', color: 'white', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">All Modes</option><option value="Cash">Cash</option><option value="Online">Online</option>
               </select>
               <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: '150px', height: '44px', background: '#1c1c1f', color: 'white', borderRadius: '12px', padding: '0 12px' }}>
                  <option value="all">Lifetime</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">7 Days</option>
               </select>
            </div>
            <div className="data-table-container">
               <div className="table-header"><h4 style={{ color: 'white' }}>SALES LOG ({filteredSales.length})</h4><div style={{ color: '#f97316', fontWeight: 900 }}>Total: ₹{filteredSales.reduce((s, a) => s + Number(a.total_price), 0).toLocaleString()}</div></div>
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
             <div className="table-header"><h4 style={{ color: 'white' }}>SUBSCRIPTIONS</h4></div>
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
                          s.monthly_rent === 3600 ? (
                            <span style={{ color: '#10b981', fontWeight: 800 }}>Yearly (₹3600)</span>
                          ) : (
                            <span style={{ color: '#f97316', fontWeight: 800 }}>Monthly (₹399)</span>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
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
             <div className="table-header"><h4 style={{ color: 'white' }}>MERCHANTS</h4></div>
             <table className="table-content">
                <thead><tr><th>Store</th><th>Contact</th><th>Action</th></tr></thead>
                <tbody>{filteredStores.map(s => (
                  <tr key={s.id}>
                    <td>{s.store_name}</td><td>{s.owner_mobile}</td>
                    <td><button onClick={() => openWhatsApp(s.owner_mobile)} style={{ padding: '8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', borderRadius: '10px', cursor: 'pointer' }}><MessageSquare size={16} /></button></td>
                  </tr>
                ))}</tbody>
             </table>
          </div>
        )}

        {activeTab === "Broadcast" && (
           <div className="broadcast-box animate-fade-in">
              <h3 style={{ color: 'white' }}>GLOBAL BROADCAST</h3>
              <textarea className="broadcast-textarea" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type announcement..." />
              <button onClick={() => setActiveTab("Merchants")} className="login-btn">GO TO MERCHANTS</button>
           </div>
        )}
      </main>
      
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
