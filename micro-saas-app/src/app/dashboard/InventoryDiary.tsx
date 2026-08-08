"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw, Trash2, Search, Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MenuItem = {
  id: string | number;
  name: string;
  price: number;
  category: string;
};

export const INVENTORY_CATEGORY_CONFIGS: any = {};

const getDisplayCategory = (cat: string) => {
  if (!cat) return "General";
  let clean = cat;
  if (clean.includes("|Barcode:")) clean = clean.split("|Barcode:")[0];
  if (clean.includes("|IMEIs:")) clean = clean.split("|IMEIs:")[0];
  if (clean.includes("|Qty:")) clean = clean.split("|Qty:")[0];
  if (clean.includes("|Supplier:")) clean = clean.split("|Supplier:")[0];
  if (clean.includes("|Cost:")) clean = clean.split("|Cost:")[0];
  if (clean.includes("|LowLimit:")) clean = clean.split("|LowLimit:")[0];
  if (clean.startsWith("Barcode:")) return "General";
  return clean || "General";
};

export const getItemStockMeta = (cat: string) => {
  if (!cat) return { cleanCat: "General", qty: 0, hasQtyTracked: false, cost: null, supplier: "", lowLimit: 5 };
  let cleanCat = cat;

  let qty: number | null = null;
  let cost: number | null = null;
  let supplier = "";
  let lowLimit = 5;
  const hasQtyTracked = cleanCat.includes("|Qty:");

  if (hasQtyTracked) {
    const parts = cleanCat.split("|Qty:");
    cleanCat = parts[0];
    const rest = parts[1].split("|")[0];
    const parsed = parseInt(rest, 10);
    if (!isNaN(parsed)) qty = parsed;
  }
  if (cleanCat.includes("|Cost:")) {
    const parts = cleanCat.split("|Cost:");
    const rest = parts[1].split("|")[0];
    const parsed = parseFloat(rest);
    if (!isNaN(parsed)) cost = parsed;
  }
  if (cleanCat.includes("|Supplier:")) {
    const parts = cleanCat.split("|Supplier:");
    supplier = parts[1].split("|")[0];
  }
  if (cleanCat.includes("|LowLimit:")) {
    const parts = cleanCat.split("|LowLimit:");
    const parsed = parseInt(parts[1].split("|")[0], 10);
    if (!isNaN(parsed)) lowLimit = parsed;
  }

  cleanCat = getDisplayCategory(cleanCat);
  if (qty === null) {
    qty = 0;
  }
  return { cleanCat, qty, hasQtyTracked, cost, supplier, lowLimit };
};

export const buildCategoryString = (cleanCat: string, qty?: number | null, supplier?: string, cost?: number | null, lowLimit?: number | null) => {
  let res = cleanCat || "General";
  if (qty !== undefined && qty !== null && !isNaN(qty)) {
    res += `|Qty:${qty}`;
  }
  if (supplier && supplier.trim()) {
    res += `|Supplier:${supplier.trim()}`;
  }
  if (cost !== undefined && cost !== null && !isNaN(cost)) {
    res += `|Cost:${cost}`;
  }
  if (lowLimit !== undefined && lowLimit !== null && !isNaN(lowLimit)) {
    res += `|LowLimit:${lowLimit}`;
  }
  return res;
};

type InventoryDiaryProps = {
  businessType?: string;
  itemsProp?: MenuItem[];
  setItemsProp?: any;
  storeId?: string | number;
};

export default function InventoryDiary({
  businessType = "Kirana/Grocery",
  itemsProp,
  setItemsProp,
  storeId
}: InventoryDiaryProps) {
  const [localItems, setLocalItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Active store items only (from page.tsx or filtered DB fetch)
  const items = itemsProp || localItems;

  const updateItemsState = (updater: (prev: MenuItem[]) => MenuItem[]) => {
    if (setItemsProp) {
      setItemsProp(updater);
    }
    setLocalItems(updater);
  };

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editLowLimit, setEditLowLimit] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "out">("all");
  const [selectedRestockId, setSelectedRestockId] = useState("");
  const [customRefillInput, setCustomRefillInput] = useState("");

  const handleOpenEditModal = (item: MenuItem) => {
    const meta = getItemStockMeta(item.category);
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.price ? String(item.price) : "0");
    setEditQty(meta.qty !== null ? String(meta.qty) : "0");
    setEditCost(meta.cost !== null ? String(meta.cost) : "");
    setEditSupplier(meta.supplier || "");
    setEditLowLimit(String(meta.lowLimit || 5));
  };

  const handleSaveEditModal = async () => {
    if (!editingItem) return;
    const q = Number(editQty);
    const finalQty = isNaN(q) ? 0 : q;
    const finalCost = editCost ? Number(editCost) : null;
    const finalSupplier = editSupplier.trim() || null;
    const finalLowLimit = editLowLimit ? Number(editLowLimit) : 5;
    const meta = getItemStockMeta(editingItem.category);
    const newCatStr = buildCategoryString(meta.cleanCat, finalQty, finalSupplier, finalCost, finalLowLimit);

    const updatedItem = {
      ...editingItem,
      name: editName.trim() || editingItem.name,
      price: Number(editPrice) || editingItem.price,
      category: newCatStr
    };

    updateItemsState(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
    setEditingItem(null);

    try {
      await supabase.from("menu_items").update({
        name: updatedItem.name,
        price: updatedItem.price,
        category: updatedItem.category
      }).eq("id", editingItem.id);
    } catch (err) {
      console.error("Failed to update item stock details:", err);
    }
  };

  useEffect(() => {
    if (!itemsProp) {
      fetchMenuItems();
    }
  }, [itemsProp, storeId]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      let query = supabase.from("menu_items").select("*");
      if (storeId) {
        query = query.eq("store_id", storeId);
      }
      const { data, error } = await query;
      if (!error && data) {
        setLocalItems(data);
      }
    } catch (e) {
      console.error("Error fetching menu items:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (itemId: string | number, addQty: number) => {
    const target = items.find(i => i.id === itemId);
    if (!target) return;

    const meta = getItemStockMeta(target.category);
    const currentQty = meta.qty !== null ? meta.qty : 0;
    const newQty = currentQty + addQty;
    const newCatStr = buildCategoryString(meta.cleanCat, newQty, meta.supplier, meta.cost, meta.lowLimit);

    updateItemsState(prev => prev.map(i => i.id === itemId ? { ...i, category: newCatStr } : i));

    try {
      await supabase.from("menu_items").update({ category: newCatStr }).eq("id", itemId);
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };

  const handleDelete = async (itemId: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    updateItemsState(prev => prev.filter(i => i.id !== itemId));
    try {
      await supabase.from("menu_items").delete().eq("id", itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  // All store items are stock controllable (default presets, custom, AI scan, CSV)
  const stockTrackedItems = items;

  // Calculations
  const totalProducts = stockTrackedItems.length;
  const totalUnits = stockTrackedItems.reduce((acc, item) => acc + (getItemStockMeta(item.category).qty || 0), 0);
  const totalValuation = stockTrackedItems.reduce((acc, item) => {
    const meta = getItemStockMeta(item.category);
    const q = meta.qty || 0;
    return acc + (q * Number(item.price || 0));
  }, 0);

  const lowStockCount = stockTrackedItems.filter(item => {
    const meta = getItemStockMeta(item.category);
    return meta.qty !== null && meta.qty > 0 && meta.qty <= meta.lowLimit;
  }).length;

  const outOfStockCount = stockTrackedItems.filter(item => {
    const meta = getItemStockMeta(item.category);
    return meta.qty !== null && meta.qty <= 0;
  }).length;

  // Filtered List (Real Stock Tracked Items Only)
  const filteredList = stockTrackedItems.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!nameMatch) return false;

    const meta = getItemStockMeta(item.category);
    if (filterMode === "low") {
      return meta.qty !== null && meta.qty > 0 && meta.qty <= meta.lowLimit;
    }
    if (filterMode === "out") {
      return meta.qty !== null && meta.qty <= 0;
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-28 max-w-4xl mx-auto px-3 sm:px-4 animate-in fade-in duration-500 pt-3">
      {/* HEADER SECTION */}
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 shrink-0" />
              <span>Inventory & Stock Control</span>
            </h2>
            <p className="text-[11px] sm:text-xs font-bold text-zinc-400 mt-0.5">
              Track stock counts, valuation & quick refills.
            </p>
          </div>
          <Button
            size="sm"
            onClick={fetchMenuItems}
            variant="outline"
            className="h-9 px-2.5 rounded-xl font-bold text-[11px] gap-1 shrink-0 border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </header>

      {/* TOP STOCK SUMMARY DASHBOARD */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/60 dark:from-zinc-900 dark:to-zinc-800 rounded-3xl border border-blue-100/60 dark:border-zinc-800 shadow-sm space-y-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-blue-50 dark:border-zinc-800 shadow-sm">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Total Products</p>
            <p className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{totalProducts}</p>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-blue-50 dark:border-zinc-800 shadow-sm">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Total Stock Units</p>
            <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{totalUnits} Pcs</p>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-blue-50 dark:border-zinc-800 shadow-sm">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Stock Valuation</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalValuation.toLocaleString('en-IN')}</p>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-blue-50 dark:border-zinc-800 shadow-sm">
            <p className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Low Stock Alerts</p>
            <p className="text-lg sm:text-2xl font-black text-amber-500 mt-0.5">{lowStockCount} Items</p>
          </div>
        </div>

        {/* QUICK REFILL HEADER BAR */}
        <div className="pt-3 border-t border-blue-100/60 dark:border-zinc-800 space-y-2.5">
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              ⚡ Quick Stock Refill / Adjust
            </span>
            <select
              value={selectedRestockId}
              onChange={(e) => setSelectedRestockId(e.target.value)}
              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 text-xs font-bold px-3 text-zinc-800 dark:text-zinc-200 focus:outline-none shadow-sm truncate"
            >
              <option value="">Select Item to Refill / Adjust...</option>
              {stockTrackedItems.length === 0 ? (
                <option value="" disabled>No stock items added yet (Add items with Stock Qty first)</option>
              ) : (
                stockTrackedItems.map(item => {
                  const meta = getItemStockMeta(item.category);
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} ({meta.qty} Pcs)
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {selectedRestockId && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                <button
                  onClick={() => handleRestock(selectedRestockId, -1)}
                  className="h-10 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-black text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center border border-red-200 dark:border-red-900/30"
                  title="Minus 1 Unit"
                >
                  - 1 Pc
                </button>
                <button
                  onClick={() => handleRestock(selectedRestockId, 1)}
                  className="h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30"
                  title="Add 1 Unit"
                >
                  + 1 Pc
                </button>
                <button
                  onClick={() => handleRestock(selectedRestockId, 10)}
                  className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  +10
                </button>
                <button
                  onClick={() => handleRestock(selectedRestockId, 50)}
                  className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  +50
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  placeholder="Custom qty (+5, -2, 15, etc)..."
                  value={customRefillInput}
                  onChange={e => setCustomRefillInput(e.target.value)}
                  className="h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold px-3 flex-1"
                />
                <Button
                  size="sm"
                  disabled={!customRefillInput || isNaN(Number(customRefillInput))}
                  onClick={() => {
                    const val = Number(customRefillInput);
                    if (!isNaN(val) && val !== 0) {
                      handleRestock(selectedRestockId, val);
                      setCustomRefillInput("");
                    }
                  }}
                  className="h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold text-xs active:scale-95"
                >
                  Update Qty
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER CHIPS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search stock items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 pl-10 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-xs shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto pb-1">
          <button
            onClick={() => setFilterMode("all")}
            className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all ${
              filterMode === "all"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900"
            }`}
          >
            All ({stockTrackedItems.length})
          </button>
          <button
            onClick={() => setFilterMode("low")}
            className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
              filterMode === "low"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterMode("out")}
            className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all ${
              filterMode === "out"
                ? "bg-red-500 text-white shadow-md"
                : "bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <Card className="rounded-3xl border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 sm:p-5 border-b dark:border-zinc-800 grid grid-cols-12 text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-6">
          <div className="col-span-6 sm:col-span-7">Product Details</div>
          <div className="col-span-3 text-center">Selling Price</div>
          <div className="col-span-3 sm:col-span-2 text-right">Quick Stock / Action</div>
        </div>

        <div className="divide-y dark:divide-zinc-800">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-zinc-400 animate-pulse">
              Loading Inventory Stock...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Package className="h-10 w-10 text-zinc-300 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No stock items match your filter.</p>
            </div>
          ) : (
            filteredList.map(item => {
              const meta = getItemStockMeta(item.category);
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 grid grid-cols-12 items-center hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors px-6"
                >
                  <div className="col-span-6 sm:col-span-7 space-y-1">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{meta.cleanCat}</span>
                      
                      {meta.qty === null ? (
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                          ♾️ Unlimited
                        </span>
                      ) : meta.qty < 0 ? (
                        <span className="text-[9px] font-black text-red-600 bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-md animate-pulse border border-red-200 dark:border-red-900/50">
                          🔴 Out of Stock ({meta.qty} Pcs)
                        </span>
                      ) : meta.qty === 0 ? (
                        <span className="text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">
                          🔴 Out of Stock (0 Pcs)
                        </span>
                      ) : meta.qty <= meta.lowLimit ? (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                          ⚠️ Low Stock: {meta.qty} Pcs
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                          🟢 In Stock: {meta.qty} Pcs
                        </span>
                      )}

                      {meta.supplier && (
                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          🏪 {meta.supplier}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    <p className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">₹{item.price}</p>
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right flex justify-end items-center gap-1">
                    <button
                      onClick={() => handleRestock(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 font-black text-xs flex items-center justify-center transition-all active:scale-90 border border-red-200/50"
                      title="Minus 1 Pc"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleRestock(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 font-black text-xs flex items-center justify-center transition-all active:scale-90 border border-emerald-200/50"
                      title="Plus 1 Pc"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90 flex items-center justify-center border border-blue-200/50"
                      title="Edit Stock & Supplier details"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 ml-0.5 flex items-center justify-center"
                      title="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* QUICK STOCK EDIT MODAL */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white dark:bg-zinc-950 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                <span>Edit Stock & Details</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Product Name</Label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Selling Price (₹)</Label>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Current Stock (Pcs)</Label>
                  <Input
                    type="number"
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Cost Price / Purchase (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 380"
                    value={editCost}
                    onChange={e => setEditCost(e.target.value)}
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Low Limit Alert (Pcs)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={editLowLimit}
                    onChange={e => setEditLowLimit(e.target.value)}
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Supplier Name</Label>
                <Input
                  placeholder="e.g. Gupta Wholesalers"
                  value={editSupplier}
                  onChange={e => setEditSupplier(e.target.value)}
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="h-10 px-4 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditModal}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md"
              >
                Save Details
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
