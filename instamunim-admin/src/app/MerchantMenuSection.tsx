"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, Upload, Search, Plus, Trash2, Edit2, Check, X, 
  Sparkles, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, 
  RefreshCw, Utensils, Eye, ArrowRight, Download, Filter, Store,
  Key, ShieldCheck, Cpu, EyeOff, CheckCheck, HelpCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StoreItem {
  id: string;
  store_name: string;
  owner_mobile: string;
  business_type?: string;
  store_logo?: string;
  created_at?: string;
}

interface MenuItem {
  id?: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  created_at?: string;
}

interface ScannedItem {
  tempId: string;
  name: string;
  price: number;
  category: string;
  selected: boolean;
}

type AiProvider = "gemini" | "openai" | "claude";

export default function MerchantMenuSection({ stores }: { stores: StoreItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [menuCounts, setMenuCounts] = useState<{ [storeId: string]: number }>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // AI Configuration State (Custom Dynamic Key & Provider)
  const [aiProvider, setAiProvider] = useState<AiProvider>("gemini");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [activeApiKey, setActiveApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  // Modals state
  const [selectedStoreForScan, setSelectedStoreForScan] = useState<StoreItem | null>(null);
  const [selectedStoreForUpload, setSelectedStoreForUpload] = useState<StoreItem | null>(null);
  const [selectedStoreForManage, setSelectedStoreForManage] = useState<StoreItem | null>(null);

  // AI Scan state
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSavingScan, setIsSavingScan] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload state
  const [csvParsedItems, setCsvParsedItems] = useState<ScannedItem[]>([]);
  const [isSavingCsv, setIsSavingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Manage Menu state
  const [manageItems, setManageItems] = useState<MenuItem[]>([]);
  const [isLoadingManageItems, setIsLoadingManageItems] = useState(false);
  const [manageSearch, setManageSearch] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("General");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    loadSavedAiConfig();
    fetchCountsAndConfig();
  }, [stores]);

  const loadSavedAiConfig = async () => {
    // 1. Try local storage first for user custom key
    if (typeof window !== 'undefined') {
      const localKey = localStorage.getItem('instamunim_admin_ai_key');
      const localProvider = (localStorage.getItem('instamunim_admin_ai_provider') as AiProvider) || "gemini";
      const localModel = localStorage.getItem('instamunim_admin_ai_model') || "gemini-2.5-flash";

      if (localKey) {
        setApiKeyInput(localKey);
        setActiveApiKey(localKey);
        setAiProvider(localProvider);
        setAiModel(localModel);
        return;
      }
    }

    // 2. Fallback to Supabase app_config
    try {
      const { data: configData } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .single();
      
      if (configData?.value) {
        setApiKeyInput(configData.value);
        setActiveApiKey(configData.value);
        setAiProvider("gemini");
        setAiModel("gemini-2.5-flash");
      }
    } catch (e) {}
  };

  const saveAiConfig = async () => {
    if (!apiKeyInput.trim()) {
      alert("Please paste a valid API key!");
      return;
    }
    setIsSavingKey(true);
    try {
      const cleanKey = apiKeyInput.trim();
      setActiveApiKey(cleanKey);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('instamunim_admin_ai_key', cleanKey);
        localStorage.setItem('instamunim_admin_ai_provider', aiProvider);
        localStorage.setItem('instamunim_admin_ai_model', aiModel);
      }

      // If Gemini, also update Supabase app_config for sync
      if (aiProvider === 'gemini') {
        await supabase
          .from('app_config')
          .upsert({ key: 'gemini_api_key', value: cleanKey }, { onConflict: 'key' });
      }

      showToast(`⚡ ${aiProvider.toUpperCase()} (${aiModel}) Key Saved & Activated!`);
    } catch (err: any) {
      console.error(err);
      showToast("Key saved locally!");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleKeyInputChange = (val: string) => {
    setApiKeyInput(val);
    const trimmed = val.trim();
    // Auto-detect provider by prefix
    if (trimmed.startsWith("AIza")) {
      setAiProvider("gemini");
      setAiModel("gemini-2.5-flash");
    } else if (trimmed.startsWith("sk-ant-")) {
      setAiProvider("claude");
      setAiModel("claude-3-5-sonnet-20241022");
    } else if (trimmed.startsWith("sk-") && !trimmed.startsWith("sk-ant-")) {
      setAiProvider("openai");
      setAiModel("gpt-4o-mini");
    }
  };

  const fetchCountsAndConfig = async () => {
    setIsLoadingCounts(true);
    try {
      const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, store_id');

      if (!error && items) {
        const counts: { [storeId: string]: number } = {};
        items.forEach(it => {
          if (it.store_id) {
            counts[it.store_id] = (counts[it.store_id] || 0) + 1;
          }
        });
        setMenuCounts(counts);
      }
    } catch (e) {
      console.error("Error fetching menu items count:", e);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Filtered merchants
  const filteredMerchants = stores.filter(store => {
    if (store.owner_mobile === 'admin_config') return false;
    const matchesSearch = 
      store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      store.owner_mobile.includes(searchTerm) ||
      (store.business_type || "").toLowerCase().includes(searchTerm.toLowerCase());

    const count = menuCounts[store.id] || 0;
    if (filterType === 'has_menu') return matchesSearch && count > 0;
    if (filterType === 'no_menu') return matchesSearch && count === 0;
    return matchesSearch;
  });

  // ------------------- AI SCAN HANDLERS -------------------
  const handleImageFile = (file: File) => {
    setScanError(null);
    setScannedItems([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      setScanImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processAiMenuScan = async () => {
    if (!scanImage) return;
    const effectiveKey = activeApiKey || apiKeyInput.trim();
    if (!effectiveKey) {
      setScanError("API Key is missing! Please enter your API Key in the top configuration bar.");
      setShowConfigPanel(true);
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScannedItems([]);

    try {
      const base64Data = scanImage.split(',')[1];
      const mimeType = scanImage.split(';')[0].split(':')[1] || 'image/jpeg';

      const systemPrompt = `You are an expert menu, rate list, and catalog parser AI. 
Analyze this menu card / price list / catalog / bill photo and extract ALL items, dishes, products, or services with their prices.

CRITICAL RULES FOR MULTIPLE PRICES/SIZES/OPTIONS (e.g. Half, Full, Quarter, Small, Medium, Large, Single, Double, 500g, 1kg):
If an item has multiple prices based on size/portion, split them into distinct separate items with the option in parentheses.
Example 1: "Chicken Biryani" (Half: 120, Full: 220) -> 
[{"name": "Chicken Biryani (Half)", "price": 120, "category": "Non-Veg"}, {"name": "Chicken Biryani (Full)", "price": 220, "category": "Non-Veg"}]
Example 2: "Haircut" (Adult: 150, Child: 80) -> 
[{"name": "Haircut (Adult)", "price": 150, "category": "Hair"}, {"name": "Haircut (Child)", "price": 80, "category": "Hair"}]

Extract EVERY single item visible. If price is not visible or free, use 0. Guess an appropriate category name.
Return ONLY a minified valid JSON array of objects without markdown formatting or backticks:
[{"name":"Item Name","price":100,"category":"Category"}]`;

      let rawResponseText = "";

      // 1. GOOGLE GEMINI
      if (aiProvider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${effectiveKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
            })
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || `Gemini API Error (${response.status})`);
        }
        rawResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } 
      // 2. OPENAI (CHATGPT GPT-4o / GPT-4o-mini)
      else if (aiProvider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`
          },
          body: JSON.stringify({
            model: aiModel || "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: systemPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: scanImage
                    }
                  }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 4096
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || `OpenAI API Error (${response.status})`);
        }
        rawResponseText = data.choices?.[0]?.message?.content || "";
      }
      // 3. ANTHROPIC CLAUDE
      else if (aiProvider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': effectiveKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: aiModel || "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: mimeType,
                      data: base64Data
                    }
                  },
                  {
                    type: "text",
                    text: systemPrompt
                  }
                ]
              }
            ]
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || `Claude API Error (${response.status})`);
        }
        rawResponseText = data.content?.[0]?.text || "";
      }

      // Clean and parse JSON
      const jsonMatch = rawResponseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not detect any structured menu items from this image. Please verify your photo or try a clearer image.");
      }

      const parsed: any[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("No items found. Please try a different photo.");
      }

      const mapped: ScannedItem[] = parsed.map((item, idx) => ({
        tempId: `scan_${Date.now()}_${idx}`,
        name: String(item.name || "Item").trim(),
        price: Number(item.price) || 0,
        category: String(item.category || "General").trim(),
        selected: true
      }));

      setScannedItems(mapped);
      showToast(`✨ Extracted ${mapped.length} items with ${aiProvider.toUpperCase()}!`);
    } catch (err: any) {
      setScanError(err.message || "An error occurred during AI scanning.");
    } finally {
      setIsScanning(false);
    }
  };

  const saveScannedItemsToStore = async () => {
    if (!selectedStoreForScan) return;
    const selectedToSave = scannedItems.filter(it => it.selected && it.name.trim().length > 0);
    if (selectedToSave.length === 0) {
      alert("Please select at least one valid item to save!");
      return;
    }

    setIsSavingScan(true);
    try {
      const recordsToInsert = selectedToSave.map(item => ({
        store_id: selectedStoreForScan.id,
        name: item.name.trim(),
        price: Number(item.price) || 0,
        category: item.category.trim() || 'General'
      }));

      const { data, error } = await supabase
        .from('menu_items')
        .insert(recordsToInsert)
        .select();

      if (error) throw error;

      // Update local count
      setMenuCounts(prev => ({
        ...prev,
        [selectedStoreForScan.id]: (prev[selectedStoreForScan.id] || 0) + (data?.length || recordsToInsert.length)
      }));

      showToast(`✅ Successfully uploaded ${recordsToInsert.length} items to ${selectedStoreForScan.store_name}'s menu!`);
      setSelectedStoreForScan(null);
      setScanImage(null);
      setScannedItems([]);
    } catch (err: any) {
      alert("Failed to save menu items: " + (err.message || err));
    } finally {
      setIsSavingScan(false);
    }
  };

  // ------------------- CSV FILE UPLOAD HANDLERS -------------------
  const handleCsvFile = (file: File) => {
    setCsvError(null);
    setCsvParsedItems([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("Empty file content.");

        const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) throw new Error("File contains no data lines.");

        const items: ScannedItem[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (i === 0 && (line.toLowerCase().includes("item") || line.toLowerCase().includes("name") || line.toLowerCase().includes("price"))) {
            continue;
          }

          const parts = line.includes('\t') ? line.split('\t') : (line.includes(';') ? line.split(';') : line.split(','));
          if (parts.length >= 1) {
            const name = parts[0]?.replace(/^["']|["']$/g, '').trim();
            const price = parts[1] ? parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 0 : 0;
            const category = parts[2] ? parts[2].replace(/^["']|["']$/g, '').trim() : 'General';

            if (name && name.length > 0) {
              items.push({
                tempId: `csv_${Date.now()}_${i}`,
                name,
                price,
                category: category || 'General',
                selected: true
              });
            }
          }
        }

        if (items.length === 0) {
          throw new Error("Could not parse any valid items from CSV. Please check formatting (e.g. Name, Price, Category).");
        }

        setCsvParsedItems(items);
      } catch (err: any) {
        setCsvError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const saveCsvItemsToStore = async () => {
    if (!selectedStoreForUpload) return;
    const selectedToSave = csvParsedItems.filter(it => it.selected && it.name.trim().length > 0);
    if (selectedToSave.length === 0) {
      alert("Please select at least one valid item to import!");
      return;
    }

    setIsSavingCsv(true);
    try {
      const recordsToInsert = selectedToSave.map(item => ({
        store_id: selectedStoreForUpload.id,
        name: item.name.trim(),
        price: Number(item.price) || 0,
        category: item.category.trim() || 'General'
      }));

      const { data, error } = await supabase
        .from('menu_items')
        .insert(recordsToInsert)
        .select();

      if (error) throw error;

      setMenuCounts(prev => ({
        ...prev,
        [selectedStoreForUpload.id]: (prev[selectedStoreForUpload.id] || 0) + (data?.length || recordsToInsert.length)
      }));

      showToast(`✅ Successfully imported ${recordsToInsert.length} items to ${selectedStoreForUpload.store_name}'s menu!`);
      setSelectedStoreForUpload(null);
      setCsvParsedItems([]);
    } catch (err: any) {
      alert("Failed to import items: " + (err.message || err));
    } finally {
      setIsSavingCsv(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Item Name,Price,Category\n" +
      "Paneer Butter Masala,220,Main Course\n" +
      "Butter Naan,40,Breads\n" +
      "Cold Coffee,90,Beverages\n" +
      "Veg Chowmein (Full),120,Chinese\n" +
      "Gulab Jamun (2 Pcs),60,Dessert\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "InstaMunim_Sample_Menu_Format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ------------------- MANAGE ITEMS HANDLERS -------------------
  const openManageModal = async (store: StoreItem) => {
    setSelectedStoreForManage(store);
    setIsLoadingManageItems(true);
    setManageSearch("");
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', store.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setManageItems(data || []);
    } catch (err: any) {
      alert("Failed to load store menu items: " + (err.message || err));
    } finally {
      setIsLoadingManageItems(false);
    }
  };

  const handleManualAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreForManage || !newItemName.trim()) return;

    setIsAddingItem(true);
    try {
      const newItem = {
        store_id: selectedStoreForManage.id,
        name: newItemName.trim(),
        price: parseFloat(newItemPrice) || 0,
        category: newItemCategory.trim() || 'General'
      };

      const { data, error } = await supabase
        .from('menu_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setManageItems(prev => [data, ...prev]);
      setMenuCounts(prev => ({
        ...prev,
        [selectedStoreForManage.id]: (prev[selectedStoreForManage.id] || 0) + 1
      }));

      setNewItemName("");
      setNewItemPrice("");
      setNewItemCategory("General");
      showToast(`Added "${newItem.name}" to menu!`);
    } catch (err: any) {
      alert("Failed to add item: " + (err.message || err));
    } finally {
      setIsAddingItem(false);
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItemId(item.id || null);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditCategory(item.category || "General");
  };

  const saveEditItem = async (itemId: string) => {
    if (!editName.trim()) return;
    try {
      const updated = {
        name: editName.trim(),
        price: parseFloat(editPrice) || 0,
        category: editCategory.trim() || 'General'
      };

      const { error } = await supabase
        .from('menu_items')
        .update(updated)
        .eq('id', itemId);

      if (error) throw error;

      setManageItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updated } : it));
      setEditingItemId(null);
      showToast("Item updated successfully!");
    } catch (err: any) {
      alert("Failed to update item: " + (err.message || err));
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setManageItems(prev => prev.filter(it => it.id !== itemId));
      if (selectedStoreForManage) {
        setMenuCounts(prev => ({
          ...prev,
          [selectedStoreForManage.id]: Math.max(0, (prev[selectedStoreForManage.id] || 1) - 1)
        }));
      }
      showToast("Item removed from menu.");
    } catch (err: any) {
      alert("Failed to delete item: " + (err.message || err));
    }
  };

  const handleClearAllItems = async () => {
    if (!selectedStoreForManage) return;
    if (!confirm(`⚠️ DANGER: Are you sure you want to delete ALL ${manageItems.length} items for "${selectedStoreForManage.store_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('store_id', selectedStoreForManage.id);

      if (error) throw error;

      setManageItems([]);
      setMenuCounts(prev => ({
        ...prev,
        [selectedStoreForManage.id]: 0
      }));
      showToast("All items cleared for this merchant.");
    } catch (err: any) {
      alert("Failed to clear items: " + (err.message || err));
    }
  };

  const totalAllItems = Object.values(menuCounts).reduce((a, b) => a + b, 0);
  const merchantsWithMenu = Object.values(menuCounts).filter(c => c > 0).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '14px 22px',
          borderRadius: '16px',
          fontWeight: 800,
          fontSize: '13px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={20} />
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚡ SECURE MULTI-AI ENGINE & API KEY CONFIGURATION BAR                     */}
      {/* ========================================================================= */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(24,24,27,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text)' }}>
                  AI Vision Engine & Custom API Key
                </h4>
                {activeApiKey ? (
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <CheckCheck size={12} /> {aiProvider.toUpperCase()} ACTIVE
                  </span>
                ) : (
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444', fontSize: '10px', fontWeight: 900
                  }}>
                    ⚠️ KEY REQUIRED
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                Paste your Gemini / OpenAI ChatGPT / Claude API Key here — 100% private and protected from code leaks!
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
              background: '#f8fafc', color: 'var(--text)', fontSize: '11px', fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {showConfigPanel ? "Hide Key Box" : "Edit / Change API Key"}
          </button>
        </div>

        {showConfigPanel && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9'
          }}>
            {/* AI Provider Dropdown */}
            <div style={{ minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#71717a', marginBottom: '4px', textTransform: 'uppercase' }}>
                AI Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => {
                  const prov = e.target.value as AiProvider;
                  setAiProvider(prov);
                  if (prov === 'gemini') setAiModel('gemini-2.5-flash');
                  else if (prov === 'openai') setAiModel('gpt-4o-mini');
                  else if (prov === 'claude') setAiModel('claude-3-5-sonnet-20241022');
                }}
                style={{
                  width: '100%', height: '42px', borderRadius: '12px',
                  border: '1px solid var(--border)', padding: '0 10px',
                  fontSize: '12px', fontWeight: 700, color: 'var(--text)', background: '#f9fafb', outline: 'none'
                }}
              >
                <option value="gemini">🌟 Google Gemini (Fast & Free)</option>
                <option value="openai">🤖 OpenAI ChatGPT (GPT-4o)</option>
                <option value="claude">🟣 Anthropic Claude (3.5 Sonnet)</option>
              </select>
            </div>

            {/* Model Selector */}
            <div style={{ minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#71717a', marginBottom: '4px', textTransform: 'uppercase' }}>
                Vision Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                style={{
                  width: '100%', height: '42px', borderRadius: '12px',
                  border: '1px solid var(--border)', padding: '0 10px',
                  fontSize: '12px', fontWeight: 700, color: 'var(--text)', background: '#f9fafb', outline: 'none'
                }}
              >
                {aiProvider === 'gemini' && (
                  <>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Accuracy)</option>
                  </>
                )}
                {aiProvider === 'openai' && (
                  <>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cheap)</option>
                    <option value="gpt-4o">gpt-4o (Max Precision)</option>
                  </>
                )}
                {aiProvider === 'claude' && (
                  <>
                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                    <option value="claude-3-haiku-20240307">claude-3-haiku-20240307</option>
                  </>
                )}
              </select>
            </div>

            {/* API Key Input Box */}
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#71717a', marginBottom: '4px', textTransform: 'uppercase' }}>
                Paste API Key ({aiProvider === 'gemini' ? 'AIza...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'})
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={15} color="#71717a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showApiKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => handleKeyInputChange(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? "AIzaSy..." : aiProvider === 'openai' ? "sk-..." : "sk-ant-..."}
                  style={{
                    width: '100%', height: '42px', borderRadius: '12px',
                    border: '1px solid var(--border)', paddingLeft: '36px', paddingRight: '40px',
                    fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)', background: '#f9fafb', outline: 'none'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px'
                  }}
                  title={showApiKey ? "Hide Key" : "Show Key"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Apply & Save Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 'auto' }}>
              <button 
                onClick={saveAiConfig}
                disabled={isSavingKey || !apiKeyInput.trim()}
                style={{
                  height: '42px', padding: '0 20px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white',
                  fontWeight: 900, fontSize: '12px', cursor: (isSavingKey || !apiKeyInput.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 10px rgba(249, 115, 22, 0.25)',
                  opacity: (isSavingKey || !apiKeyInput.trim()) ? 0.6 : 1
                }}
              >
                {isSavingKey ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={15} />}
                Apply & Save Key
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOP STATS CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Active Merchants</p>
            <Store size={18} color="#f97316" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{stores.length}</h3>
          <span style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block' }}>Registered on InstaMunim</span>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Stores with Menu</p>
            <Utensils size={18} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', margin: 0 }}>{merchantsWithMenu} <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 600 }}>/ {stores.length}</span></h3>
          <span style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block' }}>Ready for Instant POS Billing</span>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Total Cloud Menu Items</p>
            <Sparkles size={18} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{totalAllItems.toLocaleString()}</h3>
          <span style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block' }}>Items & Products across all stores</span>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '16px 20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(24,24,27,0.02)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#71717a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search merchant name, phone, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              paddingLeft: '40px',
              paddingRight: '14px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              background: '#f9fafb',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#71717a' }}>FILTER:</span>
          <button 
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: filterType === 'all' ? '1px solid #f97316' : '1px solid var(--border)',
              background: filterType === 'all' ? 'rgba(249, 115, 22, 0.1)' : '#ffffff',
              color: filterType === 'all' ? '#f97316' : 'var(--text)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            All ({stores.length})
          </button>
          <button 
            onClick={() => setFilterType('has_menu')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: filterType === 'has_menu' ? '1px solid #10b981' : '1px solid var(--border)',
              background: filterType === 'has_menu' ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
              color: filterType === 'has_menu' ? '#10b981' : 'var(--text)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Has Menu ({merchantsWithMenu})
          </button>
          <button 
            onClick={() => setFilterType('no_menu')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: filterType === 'no_menu' ? '1px solid #ef4444' : '1px solid var(--border)',
              background: filterType === 'no_menu' ? 'rgba(239, 68, 68, 0.1)' : '#ffffff',
              color: filterType === 'no_menu' ? '#ef4444' : 'var(--text)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Empty Menu ({stores.length - merchantsWithMenu})
          </button>
        </div>

        <button 
          onClick={fetchCountsAndConfig}
          disabled={isLoadingCounts}
          style={{
            height: '42px',
            padding: '0 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: '#ffffff',
            color: 'var(--text)',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={isLoadingCounts ? "animate-spin" : ""} color="#f97316" />
          Refresh
        </button>
      </div>

      {/* MERCHANTS MENU TABLE */}
      <div className="data-table-container">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'var(--text)', margin: 0, fontSize: '15px', fontWeight: 900 }}>
              MERCHANT CATALOGUE & MENU ONBOARDING ({filteredMerchants.length})
            </h4>
            <span style={{ fontSize: '11px', color: '#71717a' }}>
              Upload menus directly to any merchant account via AI Camera Scan or CSV File
            </span>
          </div>
          <button 
            onClick={downloadSampleCsv}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: '#f9fafb',
              color: '#3b82f6',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} /> Download Sample CSV
          </button>
        </div>

        <table className="table-content">
          <thead>
            <tr>
              <th>Store / Merchant</th>
              <th>Contact</th>
              <th>Business Category</th>
              <th>Current Menu Size</th>
              <th style={{ textAlign: 'center' }}>Direct Menu Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMerchants.map(s => {
              const count = menuCounts[s.id] || 0;
              const hasItems = count > 0;

              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: hasItems ? '#10b981' : '#f97316',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '14px',
                        flexShrink: 0
                      }}>
                        {s.store_name?.charAt(0)?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '13px' }}>{s.store_name}</div>
                        <div style={{ fontSize: '10px', color: '#71717a' }}>ID: {s.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.owner_mobile}</td>

                  <td>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      color: '#2563eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {s.business_type || "Restaurant/Cafe"}
                    </span>
                  </td>

                  <td>
                    {hasItems ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 900
                      }}>
                        <CheckCircle2 size={13} /> {count} Items Live
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        <AlertCircle size={13} /> 0 Items (Empty)
                      </span>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      
                      {/* AI CAMERA SCAN BUTTON */}
                      <button 
                        onClick={() => {
                          setSelectedStoreForScan(s);
                          setScanImage(null);
                          setScannedItems([]);
                          setScanError(null);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #f97316, #ea580c)',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
                          transition: 'transform 0.15s ease'
                        }}
                        title={`Scan Menu Card Photo with ${aiProvider.toUpperCase()}`}
                      >
                        <Camera size={14} /> AI Scan
                      </button>

                      {/* FILE UPLOAD CSV BUTTON */}
                      <button 
                        onClick={() => {
                          setSelectedStoreForUpload(s);
                          setCsvParsedItems([]);
                          setCsvError(null);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '10px',
                          border: '1px solid #3b82f6',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Upload Excel or CSV Sheet"
                      >
                        <Upload size={14} /> Upload CSV
                      </button>

                      {/* VIEW / MANAGE MENU BUTTON */}
                      <button 
                        onClick={() => openManageModal(s)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          background: '#ffffff',
                          color: 'var(--text)',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="View and Edit existing menu items"
                      >
                        <Eye size={14} /> View ({count})
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 📷 AI CAMERA & PHOTO SCAN MODAL                                          */}
      {/* ========================================================================= */}
      {selectedStoreForScan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--border)',
            borderRadius: '24px', maxWidth: '850px', width: '100%',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                  <Camera size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text)' }}>
                    AI Menu & Rate List Scanner
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                    Model: <strong style={{ color: '#3b82f6' }}>{aiProvider.toUpperCase()} ({aiModel})</strong> • For: <strong style={{ color: '#f97316' }}>{selectedStoreForScan.store_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStoreForScan(null)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Image Upload / Capture Section */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  flex: 1, minWidth: '280px', border: '2px dashed #f97316',
                  borderRadius: '16px', padding: '24px', textAlign: 'center',
                  background: '#fffbf5', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                  {scanImage ? (
                    <div style={{ position: 'relative', width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={scanImage} 
                        alt="Menu Preview" 
                        style={{ maxHeight: '190px', borderRadius: '10px', objectFit: 'contain', border: '1px solid #e4e4e7' }} 
                      />
                    </div>
                  ) : (
                    <>
                      <Sparkles size={36} color="#f97316" />
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>
                          Click or Drop Menu Card / Rate List Photo
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#71717a' }}>
                          Supports JPG, PNG, WEBP, Camera photos, pamphlets & rate boards
                        </p>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      ref={cameraInputRef} 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleImageFile(e.target.files[0]);
                      }}
                    />
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: '#f97316', color: 'white', fontWeight: 800,
                        fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Camera size={15} /> Take Photo
                    </button>

                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleImageFile(e.target.files[0]);
                      }}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)',
                        background: '#ffffff', color: 'var(--text)', fontWeight: 800,
                        fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Upload size={15} /> Choose File
                    </button>
                  </div>
                </div>

                {/* AI Trigger Card */}
                {scanImage && (
                  <div style={{
                    width: '260px', background: '#f8fafc', borderRadius: '16px',
                    border: '1px solid var(--border)', padding: '20px', display: 'flex',
                    flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '14px'
                  }}>
                    <Sparkles size={32} color="#3b82f6" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--text)' }}>
                        Process with {aiProvider.toUpperCase()}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#71717a' }}>
                        {aiModel} will extract dish names, portion sizes, and prices.
                      </p>
                    </div>
                    <button 
                      onClick={processAiMenuScan}
                      disabled={isScanning}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                        fontWeight: 900, fontSize: '13px', cursor: isScanning ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isScanning ? 'AI Scanning...' : 'Start AI Extraction'}
                    </button>
                  </div>
                )}
              </div>

              {/* Scan Error Alert */}
              {scanError && (
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', background: '#fef2f2',
                  border: '1px solid #fee2e2', color: '#ef4444', fontSize: '12px',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <AlertCircle size={18} /> {scanError}
                </div>
              )}

              {/* Scanned Items Review Table */}
              {scannedItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text)' }}>
                        Extracted Items ({scannedItems.length})
                      </span>
                      <button 
                        onClick={() => {
                          const allSelected = scannedItems.every(it => it.selected);
                          setScannedItems(scannedItems.map(it => ({ ...it, selected: !allSelected })));
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#3b82f6',
                          fontSize: '11px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline'
                        }}
                      >
                        {scannedItems.every(it => it.selected) ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        setScannedItems(prev => [
                          ...prev,
                          {
                            tempId: `manual_${Date.now()}`,
                            name: "New Item",
                            price: 0,
                            category: "General",
                            selected: true
                          }
                        ]);
                      }}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                        background: '#ffffff', color: 'var(--text)', fontSize: '11px',
                        fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Plus size={13} /> Add Row
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border)',
                    borderRadius: '14px', background: '#ffffff'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ width: '40px', padding: '10px', textAlign: 'center' }}>Select</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Item Name</th>
                          <th style={{ width: '110px', padding: '10px', textAlign: 'left' }}>Price (₹)</th>
                          <th style={{ width: '140px', padding: '10px', textAlign: 'left' }}>Category</th>
                          <th style={{ width: '50px', padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedItems.map((item, idx) => (
                          <tr key={item.tempId} style={{ borderBottom: '1px solid #f1f5f9', background: item.selected ? 'transparent' : '#f8fafc' }}>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <input 
                                type="checkbox"
                                checked={item.selected}
                                onChange={(e) => {
                                  const updated = [...scannedItems];
                                  updated[idx].selected = e.target.checked;
                                  setScannedItems(updated);
                                }}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...scannedItems];
                                  updated[idx].name = e.target.value;
                                  setScannedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '12px', fontWeight: 600, color: 'var(--text)'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const updated = [...scannedItems];
                                  updated[idx].price = parseFloat(e.target.value) || 0;
                                  setScannedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '12px', fontWeight: 700, color: '#10b981'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="text"
                                value={item.category}
                                onChange={(e) => {
                                  const updated = [...scannedItems];
                                  updated[idx].category = e.target.value;
                                  setScannedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '11px', fontWeight: 600, color: '#64748b'
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button 
                                onClick={() => {
                                  setScannedItems(scannedItems.filter(it => it.tempId !== item.tempId));
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <button 
                onClick={() => setSelectedStoreForScan(null)}
                style={{
                  padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border)',
                  background: '#ffffff', color: '#71717a', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button 
                onClick={saveScannedItemsToStore}
                disabled={isSavingScan || scannedItems.filter(it => it.selected).length === 0}
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', fontWeight: 900, fontSize: '13px',
                  cursor: (isSavingScan || scannedItems.filter(it => it.selected).length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  opacity: (isSavingScan || scannedItems.filter(it => it.selected).length === 0) ? 0.6 : 1
                }}
              >
                {isSavingScan ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isSavingScan ? "Saving to Cloud..." : `Save ${scannedItems.filter(it => it.selected).length} Items to Menu`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📁 CSV & EXCEL BULK FILE UPLOAD MODAL                                     */}
      {/* ========================================================================= */}
      {selectedStoreForUpload && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--border)',
            borderRadius: '24px', maxWidth: '850px', width: '100%',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text)' }}>
                    Bulk Menu File Upload (CSV)
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                    Import spreadsheets for: <strong style={{ color: '#2563eb' }}>{selectedStoreForUpload.store_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStoreForUpload(null)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Dropzone */}
              <div style={{
                border: '2px dashed #3b82f6', borderRadius: '16px', padding: '24px',
                textAlign: 'center', background: '#f8fafc', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: '12px'
              }}>
                <FileSpreadsheet size={36} color="#3b82f6" />
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>
                    Upload CSV or Text Menu List
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#71717a' }}>
                    Columns: <code>Item Name, Price, Category</code> (e.g. <em>Paneer Butter Masala, 220, Main Course</em>)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <input 
                    type="file" 
                    accept=".csv, .txt, .tsv" 
                    ref={csvFileInputRef} 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleCsvFile(e.target.files[0]);
                    }}
                  />
                  <button 
                    onClick={() => csvFileInputRef.current?.click()}
                    style={{
                      padding: '8px 18px', borderRadius: '10px', border: 'none',
                      background: '#3b82f6', color: 'white', fontWeight: 800,
                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Upload size={15} /> Select CSV File
                  </button>

                  <button 
                    onClick={downloadSampleCsv}
                    style={{
                      padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)',
                      background: '#ffffff', color: '#3b82f6', fontWeight: 800,
                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Download size={14} /> Download Sample Template
                  </button>
                </div>
              </div>

              {/* Error */}
              {csvError && (
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', background: '#fef2f2',
                  border: '1px solid #fee2e2', color: '#ef4444', fontSize: '12px',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <AlertCircle size={18} /> {csvError}
                </div>
              )}

              {/* Parsed Items */}
              {csvParsedItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text)' }}>
                      Parsed Items ({csvParsedItems.length})
                    </span>
                    <button 
                      onClick={() => {
                        const allSelected = csvParsedItems.every(it => it.selected);
                        setCsvParsedItems(csvParsedItems.map(it => ({ ...it, selected: !allSelected })));
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#3b82f6',
                        fontSize: '11px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline'
                      }}
                    >
                      {csvParsedItems.every(it => it.selected) ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border)',
                    borderRadius: '14px', background: '#ffffff'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ width: '40px', padding: '10px', textAlign: 'center' }}>Select</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Item Name</th>
                          <th style={{ width: '110px', padding: '10px', textAlign: 'left' }}>Price (₹)</th>
                          <th style={{ width: '140px', padding: '10px', textAlign: 'left' }}>Category</th>
                          <th style={{ width: '50px', padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsedItems.map((item, idx) => (
                          <tr key={item.tempId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <input 
                                type="checkbox"
                                checked={item.selected}
                                onChange={(e) => {
                                  const updated = [...csvParsedItems];
                                  updated[idx].selected = e.target.checked;
                                  setCsvParsedItems(updated);
                                }}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...csvParsedItems];
                                  updated[idx].name = e.target.value;
                                  setCsvParsedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '12px', fontWeight: 600, color: 'var(--text)'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const updated = [...csvParsedItems];
                                  updated[idx].price = parseFloat(e.target.value) || 0;
                                  setCsvParsedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '12px', fontWeight: 700, color: '#10b981'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input 
                                type="text"
                                value={item.category}
                                onChange={(e) => {
                                  const updated = [...csvParsedItems];
                                  updated[idx].category = e.target.value;
                                  setCsvParsedItems(updated);
                                }}
                                style={{
                                  width: '100%', height: '32px', borderRadius: '8px',
                                  border: '1px solid var(--border)', padding: '0 8px',
                                  fontSize: '11px', fontWeight: 600, color: '#64748b'
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button 
                                onClick={() => {
                                  setCsvParsedItems(csvParsedItems.filter(it => it.tempId !== item.tempId));
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <button 
                onClick={() => setSelectedStoreForUpload(null)}
                style={{
                  padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border)',
                  background: '#ffffff', color: '#71717a', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button 
                onClick={saveCsvItemsToStore}
                disabled={isSavingCsv || csvParsedItems.filter(it => it.selected).length === 0}
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: 900, fontSize: '13px',
                  cursor: (isSavingCsv || csvParsedItems.filter(it => it.selected).length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  opacity: (isSavingCsv || csvParsedItems.filter(it => it.selected).length === 0) ? 0.6 : 1
                }}
              >
                {isSavingCsv ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isSavingCsv ? "Importing to Cloud..." : `Import ${csvParsedItems.filter(it => it.selected).length} Items`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👁️ VIEW & EDIT EXISTING MENU MODAL                                       */}
      {/* ========================================================================= */}
      {selectedStoreForManage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--border)',
            borderRadius: '24px', maxWidth: '900px', width: '100%',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: '#18181b', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white'
                }}>
                  <Utensils size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text)' }}>
                    {selectedStoreForManage.store_name} — Live Menu Items
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                    Total: <strong style={{ color: '#10b981' }}>{manageItems.length} items</strong> in cloud database
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStoreForManage(null)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Quick Add Single Item Form */}
              <form onSubmit={handleManualAddItem} style={{
                background: '#f8fafc', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '16px', display: 'flex',
                gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap'
              }}>
                <div style={{ flex: 2, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Item / Dish Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Masala Dosa, Haircut, Milk 1L"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    style={{
                      height: '38px', borderRadius: '10px', border: '1px solid var(--border)',
                      padding: '0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', background: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Price (₹)</label>
                  <input 
                    type="number"
                    placeholder="150"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                    style={{
                      height: '38px', borderRadius: '10px', border: '1px solid var(--border)',
                      padding: '0 12px', fontSize: '12px', fontWeight: 700, color: '#10b981', background: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Category</label>
                  <input 
                    type="text"
                    placeholder="South Indian"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{
                      height: '38px', borderRadius: '10px', border: '1px solid var(--border)',
                      padding: '0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', background: '#ffffff'
                    }}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isAddingItem}
                  style={{
                    height: '38px', padding: '0 18px', borderRadius: '10px', border: 'none',
                    background: '#f97316', color: 'white', fontWeight: 900, fontSize: '12px',
                    cursor: isAddingItem ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {isAddingItem ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Item
                </button>
              </form>

              {/* Search & Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={14} color="#71717a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text"
                    placeholder="Search dishes in this menu..."
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                    style={{
                      width: '100%', height: '36px', borderRadius: '10px',
                      border: '1px solid var(--border)', paddingLeft: '34px', paddingRight: '12px',
                      fontSize: '12px', color: 'var(--text)', background: '#ffffff'
                    }}
                  />
                </div>

                {manageItems.length > 0 && (
                  <button 
                    onClick={handleClearAllItems}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid #fee2e2',
                      background: '#fef2f2', color: '#ef4444', fontSize: '11px',
                      fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Trash2 size={13} /> Clear All ({manageItems.length})
                  </button>
                )}
              </div>

              {/* Items List Table */}
              {isLoadingManageItems ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '12px', fontWeight: 700 }}>Loading menu items from cloud...</p>
                </div>
              ) : manageItems.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center', background: '#f8fafc',
                  borderRadius: '16px', border: '1px solid var(--border)'
                }}>
                  <Utensils size={36} color="#a1a1aa" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>No items in this menu yet</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#71717a' }}>
                    Use the AI Camera Scan, CSV Upload, or the quick form above to add items!
                  </p>
                </div>
              ) : (
                <div style={{
                  maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border)',
                  borderRadius: '14px', background: '#ffffff'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item Name</th>
                        <th style={{ width: '130px', padding: '10px 14px', textAlign: 'left' }}>Price (₹)</th>
                        <th style={{ width: '160px', padding: '10px 14px', textAlign: 'left' }}>Category</th>
                        <th style={{ width: '110px', padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manageItems
                        .filter(it => it.name.toLowerCase().includes(manageSearch.toLowerCase()) || it.category?.toLowerCase().includes(manageSearch.toLowerCase()))
                        .map(item => {
                          const isEditing = editingItemId === item.id;

                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 14px' }}>
                                {isEditing ? (
                                  <input 
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{
                                      width: '100%', height: '32px', borderRadius: '8px',
                                      border: '1px solid #f97316', padding: '0 8px',
                                      fontSize: '12px', fontWeight: 600
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>{item.name}</span>
                                )}
                              </td>

                              <td style={{ padding: '8px 14px' }}>
                                {isEditing ? (
                                  <input 
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    style={{
                                      width: '100%', height: '32px', borderRadius: '8px',
                                      border: '1px solid #f97316', padding: '0 8px',
                                      fontSize: '12px', fontWeight: 700, color: '#10b981'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 900, color: '#10b981', fontSize: '13px' }}>
                                    ₹{Number(item.price).toLocaleString()}
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: '8px 14px' }}>
                                {isEditing ? (
                                  <input 
                                    type="text"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    style={{
                                      width: '100%', height: '32px', borderRadius: '8px',
                                      border: '1px solid #f97316', padding: '0 8px',
                                      fontSize: '11px', fontWeight: 600
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    padding: '3px 8px', borderRadius: '6px',
                                    background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 700
                                  }}>
                                    {item.category || "General"}
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => item.id && saveEditItem(item.id)}
                                      style={{
                                        padding: '4px 8px', borderRadius: '6px', border: 'none',
                                        background: '#10b981', color: 'white', fontSize: '10px',
                                        fontWeight: 800, cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingItemId(null)}
                                      style={{
                                        padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                                        background: '#ffffff', color: '#71717a', fontSize: '10px',
                                        fontWeight: 800, cursor: 'pointer'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => startEditItem(item)}
                                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '2px' }}
                                      title="Edit Item"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => item.id && handleDeleteItem(item.id, item.name)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                      title="Delete Item"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              background: '#fcfcfd'
            }}>
              <button 
                onClick={() => setSelectedStoreForManage(null)}
                style={{
                  padding: '10px 24px', borderRadius: '12px', border: 'none',
                  background: '#18181b', color: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                }}
              >
                Done / Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
