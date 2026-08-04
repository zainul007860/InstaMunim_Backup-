"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Phone, Calendar, MessageSquare, Send, Share2, 
  Trash2, CheckCircle2, Sparkles, Filter, Search, X, ArrowRight,
  Smartphone, Utensils, ShoppingCart, Scissors, Tag, Clock, ChevronRight, RefreshCw, Flame, DollarSign, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface WalkInEnquiry {
  id: string;
  storeId: string;
  customerName: string;
  phone: string;
  businessType: string;
  status: "Hot Lead" | "Interested" | "Follow Up" | "Converted" | "Not Interested";
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  // Category-specific details
  categoryDetails: {
    // Mobile / Electronics
    phoneModel?: string;
    budgetRange?: string;
    isExchange?: boolean;
    exchangeModel?: string;
    // Restaurant / Cafe
    inquiryType?: string;
    paxCount?: string;
    eventDate?: string;
    eventTime?: string;
    // Kirana / Grocery
    rationList?: string;
    estimatedBudget?: string;
    isDeliveryRequired?: boolean;
    // Saloon / Spa
    preferredService?: string;
    stylistName?: string;
    slotTime?: string;
    // General Retail
    productInterested?: string;
    expectedPurchaseDate?: string;
  };
}

interface EnquiriesViewProps {
  storeId: string;
  businessType: string;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  supabase: any;
  onClose?: () => void;
  onOpenCrmWithMessage?: (phone: string, text: string) => void;
}

export function EnquiriesView({
  storeId,
  businessType,
  customers,
  setCustomers,
  supabase,
  onClose,
  onOpenCrmWithMessage
}: EnquiriesViewProps) {
  const [enquiries, setEnquiries] = useState<WalkInEnquiry[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<WalkInEnquiry["status"]>("Hot Lead");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Category specific fields
  const [phoneModel, setPhoneModel] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [isExchange, setIsExchange] = useState(false);
  const [exchangeModel, setExchangeModel] = useState("");

  const [inquiryType, setInquiryType] = useState("Table Booking");
  const [paxCount, setPaxCount] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const [rationList, setRationList] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [isDeliveryRequired, setIsDeliveryRequired] = useState(false);

  const [preferredService, setPreferredService] = useState("");
  const [stylistName, setStylistName] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const [productInterested, setProductInterested] = useState("");

  const storageKey = `instamunim_enquiries_${storeId || 'default'}`;

  // Load Enquiries from localStorage / Supabase
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setEnquiries(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load enquiries from storage:", e);
    }
  }, [storageKey]);

  const saveToStorageAndState = (updated: WalkInEnquiry[]) => {
    setEnquiries(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save enquiries to storage:", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to format enquiry detail summary for notes / CRM
  const buildCategorySummary = () => {
    const isMobile = businessType.includes("Mobile") || businessType.includes("Electric");
    const isRestaurant = businessType.includes("Restaurant") || businessType.includes("Cafe") || businessType.includes("Food");
    const isKirana = businessType.includes("Kirana") || businessType.includes("Grocery");
    const isSaloon = businessType.includes("Saloon") || businessType.includes("Spa");

    if (isMobile) {
      return `[Mobile Enquiry] Model: ${phoneModel || 'N/A'}, Budget: ${budgetRange || 'N/A'}${isExchange ? `, Exchange: ${exchangeModel || 'Yes'}` : ''}`;
    } else if (isRestaurant) {
      return `[Restaurant Enquiry] Type: ${inquiryType}, Pax: ${paxCount || 'N/A'}, Date: ${eventDate || 'N/A'} ${eventTime || ''}`;
    } else if (isKirana) {
      return `[Kirana Enquiry] Items: ${rationList || 'Bulk'}, Budget: ${estimatedBudget || 'N/A'}${isDeliveryRequired ? ', Home Delivery Req.' : ''}`;
    } else if (isSaloon) {
      return `[Salon Enquiry] Service: ${preferredService || 'N/A'}, Stylist: ${stylistName || 'Any'}, Slot: ${slotTime || 'N/A'}`;
    } else {
      return `[Walk-in Enquiry] Item: ${productInterested || 'N/A'}, Budget: ${budgetRange || 'N/A'}`;
    }
  };

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }
    if (!phone.trim()) {
      alert("Please enter customer phone number.");
      return;
    }

    setIsSaving(true);
    const categorySummary = buildCategorySummary();
    const fullNotes = notes ? `${notes} | ${categorySummary}` : categorySummary;

    const newEnquiry: WalkInEnquiry = {
      id: `enq_${Date.now()}`,
      storeId: storeId || "default",
      customerName: customerName.trim(),
      phone: phone.trim(),
      businessType: businessType || "General",
      status: status,
      followUpDate: followUpDate || undefined,
      notes: fullNotes,
      createdAt: new Date().toISOString(),
      categoryDetails: {
        phoneModel: phoneModel.trim() || undefined,
        budgetRange: budgetRange.trim() || undefined,
        isExchange,
        exchangeModel: exchangeModel.trim() || undefined,
        inquiryType: inquiryType || undefined,
        paxCount: paxCount.trim() || undefined,
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        rationList: rationList.trim() || undefined,
        estimatedBudget: estimatedBudget.trim() || undefined,
        isDeliveryRequired,
        preferredService: preferredService.trim() || undefined,
        stylistName: stylistName.trim() || undefined,
        slotTime: slotTime || undefined,
        productInterested: productInterested.trim() || undefined
      }
    };

    const updatedEnquiries = [newEnquiry, ...enquiries];
    saveToStorageAndState(updatedEnquiries);

    // AUTO-SYNC TO SMART CRM (Customers State & Database)
    const existingIndex = customers.findIndex(c => c.phone === phone.trim());
    let updatedCustomers = [...customers];

    if (existingIndex >= 0) {
      updatedCustomers[existingIndex] = {
        ...updatedCustomers[existingIndex],
        name: customerName.trim(),
        tag: "Walk-in Lead",
        enquiryNotes: fullNotes,
        lastEnquiryDate: new Date().toLocaleDateString('en-IN')
      };
    } else {
      updatedCustomers.push({
        id: `cust_${Date.now()}`,
        name: customerName.trim(),
        phone: phone.trim(),
        total_spend: 0,
        visit_count: 0,
        tag: "Walk-in Lead",
        enquiryNotes: fullNotes,
        lastEnquiryDate: new Date().toLocaleDateString('en-IN')
      });
    }

    setCustomers(updatedCustomers);

    // Save to Supabase if available
    if (supabase && storeId) {
      try {
        await supabase.from("customers").upsert([{
          store_id: storeId,
          name: customerName.trim(),
          phone: phone.trim(),
          notes: fullNotes
        }], { onConflict: "store_id,phone" });
      } catch (err) {
        console.warn("Supabase CRM sync fallback to local:", err);
      }
    }

    setIsSaving(false);
    showToast(`✅ Enquiry saved for ${customerName}! Auto-synced to Smart CRM.`);
    
    // Reset Form
    setCustomerName("");
    setPhone("");
    setNotes("");
    setPhoneModel("");
    setBudgetRange("");
    setIsExchange(false);
    setExchangeModel("");
    setPaxCount("");
    setRationList("");
    setPreferredService("");
    setProductInterested("");
    setActiveTab("list");
  };

  const handleDeleteEnquiry = (id: string) => {
    if (confirm("Are you sure you want to delete this enquiry?")) {
      const filtered = enquiries.filter(e => e.id !== id);
      saveToStorageAndState(filtered);
      showToast("Enquiry removed.");
    }
  };

  // WhatsApp Outreach helpers
  const getWhatsAppOfferText = (enquiry: WalkInEnquiry) => {
    const name = enquiry.customerName;
    const isMobile = enquiry.businessType.includes("Mobile") || enquiry.businessType.includes("Electric");
    const isRestaurant = enquiry.businessType.includes("Restaurant") || enquiry.businessType.includes("Cafe");
    
    let text = `Namaste ${name}! 🙏 Thank you for visiting us. `;

    if (isMobile && enquiry.categoryDetails.phoneModel) {
      text += `We have great special offers on ${enquiry.categoryDetails.phoneModel}! `;
    } else if (isRestaurant) {
      text += `We would love to host your dining/event with special discount vouchers! `;
    } else {
      text += `We have exciting offers specially curated for you today! `;
    }

    text += `Visit us or reply to get the best deal! ✨`;
    return encodeURIComponent(text);
  };

  const sendWhatsAppMessage = (enquiry: WalkInEnquiry) => {
    const cleanPhone = enquiry.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = getWhatsAppOfferText(enquiry);
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = 
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.includes(searchQuery) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isMobileCategory = businessType.includes("Mobile") || businessType.includes("Electric");
  const isRestaurantCategory = businessType.includes("Restaurant") || businessType.includes("Cafe") || businessType.includes("Food");
  const isKiranaCategory = businessType.includes("Kirana") || businessType.includes("Grocery");
  const isSaloonCategory = businessType.includes("Saloon") || businessType.includes("Spa");

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 sm:p-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Smart POS Feature
            </Badge>
            <Badge className="bg-indigo-700/60 text-indigo-200 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
              Category: {businessType || "General Store"}
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-300" />
            Walk-in Enquiries & Leads
          </h2>
          <p className="text-xs text-indigo-200 font-medium">
            Capture customer details, follow-ups & auto-sync to Smart CRM for WhatsApp offers.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto justify-end">
          <Button
            onClick={() => setActiveTab(activeTab === "list" ? "new" : "list")}
            className={`h-11 px-5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md ${
              activeTab === "new" 
                ? "bg-white text-indigo-950 hover:bg-slate-100" 
                : "bg-emerald-500 hover:bg-emerald-400 text-white"
            }`}
          >
            {activeTab === "new" ? (
              <>
                <X className="h-4 w-4 mr-1.5" /> Close Form
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1.5" /> + New Walk-in Entry
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* NEW ENQUIRY FORM */}
      {activeTab === "new" && (
        <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Add Walk-in Enquiry Details
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Fields are tailored specifically for <strong className="text-indigo-600 dark:text-indigo-400">{businessType}</strong>
              </p>
            </div>
            <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 text-[10px] font-bold px-3 py-1 rounded-xl">
              ⚡ Auto-Syncs to CRM
            </Badge>
          </div>

          <form onSubmit={handleSaveEnquiry} className="space-y-6">
            {/* Common Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Customer Name *
                </Label>
                <Input
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-11 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Mobile Number (WhatsApp) *
                </Label>
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="h-11 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200"
                />
              </div>
            </div>

            {/* DYNAMIC CATEGORY-SPECIFIC FIELDS */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
              <div className="flex items-center gap-2">
                {isMobileCategory && <Smartphone className="h-4 w-4 text-indigo-600" />}
                {isRestaurantCategory && <Utensils className="h-4 w-4 text-indigo-600" />}
                {isKiranaCategory && <ShoppingCart className="h-4 w-4 text-indigo-600" />}
                {isSaloonCategory && <Scissors className="h-4 w-4 text-indigo-600" />}
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                  {businessType} Specific Inquiry Details
                </span>
              </div>

              {/* Mobile / Electronics Category */}
              {isMobileCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Interested Phone Model / Brand</Label>
                    <Input
                      value={phoneModel}
                      onChange={e => setPhoneModel(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro / Vivo V30"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Customer Budget Range</Label>
                    <Input
                      value={budgetRange}
                      onChange={e => setBudgetRange(e.target.value)}
                      placeholder="e.g. ₹20,000 - ₹30,000"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isExchange}
                        onChange={e => setIsExchange(e.target.checked)}
                        className="h-4 w-4 rounded accent-indigo-600"
                      />
                      Customer wants Old Phone Exchange?
                    </label>
                    {isExchange && (
                      <Input
                        value={exchangeModel}
                        onChange={e => setExchangeModel(e.target.value)}
                        placeholder="Old Phone Model (e.g. Realme 8 64GB)"
                        className="h-9 rounded-xl bg-white dark:bg-zinc-900 text-xs font-medium max-w-sm"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Restaurant / Cafe Category */}
              {isRestaurantCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Inquiry Type</Label>
                    <select
                      value={inquiryType}
                      onChange={e => setInquiryType(e.target.value)}
                      className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 text-xs font-bold px-3"
                    >
                      <option value="Table Booking">Table Booking</option>
                      <option value="Party / Birthday Event">Party / Birthday Event</option>
                      <option value="Bulk Catering Order">Bulk Catering Order</option>
                      <option value="General Dining">General Dining</option>
                    </select>
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Pax / Guest Count</Label>
                    <Input
                      type="number"
                      value={paxCount}
                      onChange={e => setPaxCount(e.target.value)}
                      placeholder="e.g. 15 Guests"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Event / Booking Date</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Kirana / Grocery Category */}
              {isKiranaCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left sm:col-span-2">
                    <Label className="text-[10px] font-bold text-zinc-600">Ration List / Items Enquiry</Label>
                    <textarea
                      value={rationList}
                      onChange={e => setRationList(e.target.value)}
                      placeholder="e.g. Monthly ration list: 20kg Rice, Mustard oil 5L, Dry fruits package..."
                      className="w-full h-20 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 text-xs font-medium resize-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Estimated Budget (₹)</Label>
                    <Input
                      value={estimatedBudget}
                      onChange={e => setEstimatedBudget(e.target.value)}
                      placeholder="e.g. ₹5,000"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDeliveryRequired}
                        onChange={e => setIsDeliveryRequired(e.target.checked)}
                        className="h-4 w-4 rounded accent-indigo-600"
                      />
                      Home Delivery Required?
                    </label>
                  </div>
                </div>
              )}

              {/* Saloon / Spa Category */}
              {isSaloonCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Preferred Service / Treatment</Label>
                    <Input
                      value={preferredService}
                      onChange={e => setPreferredService(e.target.value)}
                      placeholder="e.g. Hair Spa & Facial package"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Stylist Preference</Label>
                    <Input
                      value={stylistName}
                      onChange={e => setStylistName(e.target.value)}
                      placeholder="e.g. Senior Stylist / Any"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Slot Time</Label>
                    <Input
                      type="time"
                      value={slotTime}
                      onChange={e => setSlotTime(e.target.value)}
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* General / Other Category Fallback */}
              {!isMobileCategory && !isRestaurantCategory && !isKiranaCategory && !isSaloonCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Product / Item Interested</Label>
                    <Input
                      value={productInterested}
                      onChange={e => setProductInterested(e.target.value)}
                      placeholder="e.g. Designer Jacket, Leather Shoes"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-zinc-600">Budget Range (₹)</Label>
                    <Input
                      value={budgetRange}
                      onChange={e => setBudgetRange(e.target.value)}
                      placeholder="e.g. ₹2,000 - ₹4,000"
                      className="h-10 rounded-xl bg-white dark:bg-zinc-900 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status & Follow up */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Lead Status
                </Label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 text-xs font-black px-3"
                >
                  <option value="Hot Lead">🔥 Hot Lead (High Priority)</option>
                  <option value="Interested">👍 Interested</option>
                  <option value="Follow Up">⏰ Needs Follow-up</option>
                  <option value="Converted">✅ Converted to Sale</option>
                  <option value="Not Interested">❌ Not Interested</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Follow-up Date
                </Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="h-11 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Additional Notes / Remarks
                </Label>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Asked to call on Sunday"
                  className="h-11 rounded-xl font-medium bg-zinc-50 dark:bg-zinc-800 border-zinc-200"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("list")}
                className="h-11 px-6 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
              >
                {isSaving ? "Saving & Syncing..." : "Save Enquiry & Sync to CRM"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ENQUIRIES LIST VIEW */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, phone, item..."
                className="pl-10 h-10 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border-0"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "Hot Lead", "Follow Up", "Converted"].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                  }`}
                >
                  {st === "ALL" ? "All Enquiries" : st}
                </button>
              ))}
            </div>
          </div>

          {/* List Cards */}
          {filteredEnquiries.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto text-indigo-500">
                <Users className="h-8 w-8" />
              </div>
              <h4 className="font-black text-lg text-zinc-800 dark:text-white">No Walk-in Enquiries Found</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">
                Record details of walk-in customers to follow up and send WhatsApp offers.
              </p>
              <Button
                onClick={() => setActiveTab("new")}
                className="mt-2 h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase"
              >
                + Add First Enquiry
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEnquiries.map(enquiry => (
                <Card
                  key={enquiry.id}
                  className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-zinc-900 dark:text-white">
                          {enquiry.customerName}
                        </h4>
                        <Badge
                          className={`border-0 font-black text-[9px] uppercase px-2.5 py-0.5 ${
                            enquiry.status === "Hot Lead"
                              ? "bg-red-500/10 text-red-500"
                              : enquiry.status === "Converted"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : enquiry.status === "Follow Up"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-indigo-500/10 text-indigo-500"
                          }`}
                        >
                          {enquiry.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {enquiry.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteEnquiry(enquiry.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        title="Delete Enquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enquiry Notes / Category summary */}
                  {enquiry.notes && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {enquiry.notes}
                    </div>
                  )}

                  {/* Footer & Direct Outreach Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      {new Date(enquiry.createdAt).toLocaleDateString('en-IN')}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => sendWhatsAppMessage(enquiry)}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-extrabold text-[10px] uppercase tracking-tight flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" /> Send WhatsApp Offer
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
