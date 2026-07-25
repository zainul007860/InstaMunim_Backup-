"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Plus, Moon, CheckCircle2, Save, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StockItem = {
  id: string;
  name: string;
  unit: string; // kg, pc, pkt
  openingStock: number; // Kal ka bacha hua
  addedToday: number; // Aaj kharida hua
  closingStock: string; // Raat ko bacha hua (string to allow decimal typing)
};

export const INVENTORY_CATEGORY_CONFIGS: Record<string, {
  title: string;
  subtext: string;
  sourceTitle: string;
  placeholder: string;
  presets: { name: string; unit: string; openingStock: number; addedToday: number; closingStock: string }[];
}> = {
  "Restaurant/Cafe": {
    title: "Stock Diary",
    subtext: "Track your store raw items and recipe stock.",
    sourceTitle: "Add New Stock (Mandi/Supplier)",
    placeholder: "Item Name (e.g. Paneer)",
    presets: [
      { name: "Paneer", unit: "kg", openingStock: 5, addedToday: 0, closingStock: "" },
      { name: "Milk", unit: "pkt", openingStock: 10, addedToday: 0, closingStock: "" },
      { name: "Potatoes", unit: "kg", openingStock: 15, addedToday: 0, closingStock: "" }
    ]
  },
  "Kirana/Grocery": {
    title: "Inventory Diary",
    subtext: "Track your store daily inventory and product stock.",
    sourceTitle: "Add New Stock (Mandi/Supplier)",
    placeholder: "Product Name (e.g. Basmati Rice)",
    presets: [
      { name: "Basmati Rice", unit: "kg", openingStock: 50, addedToday: 0, closingStock: "" },
      { name: "Mustard Oil", unit: "pc", openingStock: 12, addedToday: 0, closingStock: "" },
      { name: "Sugar", unit: "kg", openingStock: 20, addedToday: 0, closingStock: "" }
    ]
  },
  "Saloon/Spa": {
    title: "Supplies Diary",
    subtext: "Track your saloon cosmetics, supplies and styling items.",
    sourceTitle: "Add New Stock (Supplier/Vendor)",
    placeholder: "Item Name (e.g. Hair Shampoo)",
    presets: [
      { name: "Hair Color (Black)", unit: "pkt", openingStock: 8, addedToday: 0, closingStock: "" },
      { name: "Shampoo Bottle", unit: "pc", openingStock: 6, addedToday: 0, closingStock: "" },
      { name: "Face Scrub", unit: "pc", openingStock: 4, addedToday: 0, closingStock: "" }
    ]
  },
  "Clothing/Retail": {
    title: "Inventory Diary",
    subtext: "Track your clothing inventory, apparel stock and accessories.",
    sourceTitle: "Add New Stock (Wholesaler/Supplier)",
    placeholder: "Item Name (e.g. Cotton T-Shirt)",
    presets: [
      { name: "Cotton T-Shirt (M)", unit: "pc", openingStock: 15, addedToday: 0, closingStock: "" },
      { name: "Blue Jeans (32)", unit: "pc", openingStock: 10, addedToday: 0, closingStock: "" },
      { name: "Socks Pairs", unit: "pc", openingStock: 25, addedToday: 0, closingStock: "" }
    ]
  },
  "Laundry": {
    title: "Supplies Diary",
    subtext: "Track your cleaning agents, detergents and packaging supplies.",
    sourceTitle: "Add New Stock (Supplier/Vendor)",
    placeholder: "Item Name (e.g. Detergent Powder)",
    presets: [
      { name: "Detergent Powder", unit: "kg", openingStock: 10, addedToday: 0, closingStock: "" },
      { name: "Liquid Bleach", unit: "pc", openingStock: 5, addedToday: 0, closingStock: "" },
      { name: "Plastic Hangers", unit: "pc", openingStock: 100, addedToday: 0, closingStock: "" }
    ]
  },
  "Electric": {
    title: "Inventory Diary",
    subtext: "Track your electrical components, fittings and appliances stock.",
    sourceTitle: "Add New Stock (Distributor/Supplier)",
    placeholder: "Component Name (e.g. LED Bulb 9W)",
    presets: [
      { name: "LED Bulb 9W", unit: "pc", openingStock: 30, addedToday: 0, closingStock: "" },
      { name: "Extension Board", unit: "pc", openingStock: 8, addedToday: 0, closingStock: "" },
      { name: "Copper Wire 1.5mm", unit: "pkt", openingStock: 5, addedToday: 0, closingStock: "" }
    ]
  },
  "Automobile": {
    title: "Spares Diary",
    subtext: "Track your vehicle parts, oils and spare inventory.",
    sourceTitle: "Add New Stock (Distributor/Supplier)",
    placeholder: "Part Name (e.g. Engine Oil 1L)",
    presets: [
      { name: "Engine Oil 1L", unit: "pc", openingStock: 12, addedToday: 0, closingStock: "" },
      { name: "Spark Plug", unit: "pc", openingStock: 20, addedToday: 0, closingStock: "" },
      { name: "Brake Pads Set", unit: "pc", openingStock: 6, addedToday: 0, closingStock: "" }
    ]
  },
  "Gym": {
    title: "Supplies Diary",
    subtext: "Track your gym supplements, energy drinks and workout gear.",
    sourceTitle: "Add New Stock (Supplier/Distributor)",
    placeholder: "Item Name (e.g. Whey Protein)",
    presets: [
      { name: "Whey Protein 1kg", unit: "pc", openingStock: 10, addedToday: 0, closingStock: "" },
      { name: "BCAA Powder", unit: "pc", openingStock: 5, addedToday: 0, closingStock: "" },
      { name: "Shaker Bottles", unit: "pc", openingStock: 15, addedToday: 0, closingStock: "" }
    ]
  },
  "Cosmetic": {
    title: "Cosmetics Diary",
    subtext: "Track your cosmetics, skin care items and display stock.",
    sourceTitle: "Add New Stock (Distributor/Supplier)",
    placeholder: "Item Name (e.g. Matte Lipstick)",
    presets: [
      { name: "Matte Lipstick (Red)", unit: "pc", openingStock: 12, addedToday: 0, closingStock: "" },
      { name: "Black Eyeliner", unit: "pc", openingStock: 15, addedToday: 0, closingStock: "" },
      { name: "Nail Polish (Pink)", unit: "pc", openingStock: 20, addedToday: 0, closingStock: "" }
    ]
  },
  "Stationary": {
    title: "Inventory Diary",
    subtext: "Track your paper reams, writing items and books stock.",
    sourceTitle: "Add New Stock (Publisher/Supplier)",
    placeholder: "Item Name (e.g. Classmate Notebook)",
    presets: [
      { name: "Classmate Notebook", unit: "pc", openingStock: 40, addedToday: 0, closingStock: "" },
      { name: "Reynolds Gel Pen (Blue)", unit: "pc", openingStock: 100, addedToday: 0, closingStock: "" },
      { name: "A4 Paper Reams", unit: "pc", openingStock: 15, addedToday: 0, closingStock: "" }
    ]
  }
};

export default function InventoryDiary({ businessType = "Restaurant/Cafe" }: { businessType?: string }) {
  const [activeView, setActiveView] = useState<"Morning" | "Closing" | "Report">("Morning");
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, [businessType]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        // Find default presets of ALL OTHER categories to clean them up if present
        const currentConfig = INVENTORY_CATEGORY_CONFIGS[businessType] || INVENTORY_CATEGORY_CONFIGS["Restaurant/Cafe"];
        const currentPresetNames = currentConfig.presets.map(p => p.name.toLowerCase());
        
        // Define all default preset names across all categories
        const allOtherPresets = [
          "paneer", "milk", "potatoes", "potato", "bread (white)", "water bottle", // Restaurant
          "basmati rice", "mustard oil", "sugar", // Kirana
          "hair color (black)", "shampoo bottle", "face scrub", // Saloon
          "cotton t-shirt (m)", "blue jeans (32)", "socks pairs", // Clothing
          "detergent powder", "liquid bleach", "plastic hangers", // Laundry
          "led bulb 9w", "extension board", "copper wire 1.5mm", // Electric
          "engine oil 1l", "spark plug", "brake pads set", // Automobile
          "whey protein 1kg", "bcaa powder", "shaker bottles", // Gym
          "matte lipstick (red)", "black eyeliner", "nail polish (pink)", // Cosmetic
          "classmate notebook", "reynolds gel pen (blue)", "a4 paper reams" // Stationary
        ];
        
        const filteredData = data.filter(d => {
          const lowerName = d.name.toLowerCase();
          // If this item is in the default list of other categories, but not in current category's presets, delete it from Supabase
          if (allOtherPresets.includes(lowerName) && !currentPresetNames.includes(lowerName)) {
            supabase.from('inventory_items').delete().eq('id', d.id).then(() => {});
            return false;
          }
          return true;
        });

        if (filteredData.length > 0) {
          setInventory(filteredData.map(d => ({
            id: d.id,
            name: d.name,
            unit: d.unit,
            openingStock: Number(d.opening_stock) || 0,
            addedToday: Number(d.added_today) || 0,
            closingStock: d.closing_stock || ""
          })));
        } else {
          // If no items left (all default restaurant items deleted), load current category presets
          const config = INVENTORY_CATEGORY_CONFIGS[businessType] || INVENTORY_CATEGORY_CONFIGS["Restaurant/Cafe"];
          setInventory(config.presets.map((p, idx) => ({
            id: String(idx + 1),
            name: p.name,
            unit: p.unit,
            openingStock: p.openingStock,
            addedToday: p.addedToday,
            closingStock: p.closingStock
          })));
        }
      } else {
        const config = INVENTORY_CATEGORY_CONFIGS[businessType] || INVENTORY_CATEGORY_CONFIGS["Restaurant/Cafe"];
        setInventory(config.presets.map((p, idx) => ({
          id: String(idx + 1),
          name: p.name,
          unit: p.unit,
          openingStock: p.openingStock,
          addedToday: p.addedToday,
          closingStock: p.closingStock
        })));
      }
    } catch (e) {
      console.log("Supabase error (table likely missing), using local fallback data.");
      const config = INVENTORY_CATEGORY_CONFIGS[businessType] || INVENTORY_CATEGORY_CONFIGS["Restaurant/Cafe"];
      setInventory(config.presets.map((p, idx) => ({
        id: String(idx + 1),
        name: p.name,
        unit: p.unit,
        openingStock: p.openingStock,
        addedToday: p.addedToday,
        closingStock: p.closingStock
      })));
    } finally {
      setLoading(false);
    }
  };

  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pc");

  const today = format(new Date(), "dd MMM yyyy");

  const handleAddItem = async () => {
    if (!newItemName || !newItemQty) return;
    
    const existing = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());
    if (existing) {
      const newAdded = existing.addedToday + Number(newItemQty);
      setInventory(inventory.map(i => 
        i.id === existing.id ? { ...i, addedToday: newAdded } : i
      ));
      
      // Update DB in background
      await supabase.from('inventory_items').update({ added_today: newAdded }).eq('id', existing.id);
    } else {
      const tempId = Date.now().toString();
      const newItem = {
        id: tempId,
        name: newItemName,
        unit: newItemUnit,
        openingStock: 0,
        addedToday: Number(newItemQty),
        closingStock: ""
      };
      setInventory([...inventory, newItem]);

      // Insert into DB
      const { data, error } = await supabase.from('inventory_items').insert([{
        name: newItemName,
        unit: newItemUnit,
        opening_stock: 0,
        added_today: Number(newItemQty),
        closing_stock: null
      }]).select();
      
      if (data && data[0]) {
        // Replace temp ID with actual Supabase UUID
        setInventory(prev => prev.map(i => i.id === tempId ? { ...i, id: data[0].id } : i));
      }
    }
    setNewItemName("");
    setNewItemQty("");
  };

  const handleClosingInput = (id: string, val: string) => {
    setInventory(inventory.map(i => 
      i.id === id ? { ...i, closingStock: val } : i
    ));
  };

  const handleSaveClosing = () => {
    // Auto-fill empty fields with "0" so the user isn't blocked
    setInventory(inventory.map(i => ({
      ...i,
      closingStock: i.closingStock === "" ? "0" : i.closingStock
    })));
    setActiveView("Report");
  };

  const handleFinishClosing = async () => {
    const updatedInventory = inventory.map(i => ({
      ...i,
      openingStock: parseFloat(i.closingStock || "0"),
      addedToday: 0,
      closingStock: ""
    }));

    setInventory(updatedInventory);
    setActiveView("Morning");

    // Persist rollover to DB
    for (const item of updatedInventory) {
      if (item.id.length > 10) { // Check if it's a real Supabase UUID (not our dummy ID "1" or "2")
        await supabase.from('inventory_items').update({
          opening_stock: item.openingStock,
          added_today: 0,
          closing_stock: null
        }).eq('id', item.id);
      }
    }
  };

  if (loading) {
    return <div className="p-10 text-center font-bold text-zinc-400">Loading Inventory...</div>;
  }

  const config = INVENTORY_CATEGORY_CONFIGS[businessType] || INVENTORY_CATEGORY_CONFIGS["Restaurant/Cafe"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 px-1">
      <header className="px-2">
        <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{config.title}</h2>
        <p className="text-orange-600 font-bold mt-1 text-sm">{today}</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-full overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveView("Morning")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeView === "Morning" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
        >
          <ShoppingCart className="w-4 h-4" /> Aaj ka Maal (Add)
        </button>
        <button 
          onClick={() => setActiveView("Closing")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeView === "Closing" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500"}`}
        >
          <Moon className="w-4 h-4" /> Night Closing
        </button>
      </div>

      {activeView === "Morning" && (
        <div className="space-y-6">
          <Card className="p-4 rounded-3xl border-0 shadow-sm bg-white">
            <h3 className="font-bold text-sm mb-4">{config.sourceTitle}</h3>
            <div className="flex gap-2 mb-3">
              <Input 
                placeholder={config.placeholder}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="bg-zinc-50 border-0 h-12 rounded-2xl"
              />
              <Input 
                type="number"
                placeholder="Qty" 
                value={newItemQty}
                onChange={e => setNewItemQty(e.target.value)}
                className="w-20 bg-zinc-50 border-0 h-12 rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={newItemUnit}
                onChange={e => setNewItemUnit(e.target.value)}
                className="w-24 bg-zinc-50 border-0 h-12 rounded-2xl px-3 text-sm font-medium focus:outline-none"
              >
                <option value="kg">KG</option>
                <option value="pc">Pieces</option>
                <option value="pkt">Packet</option>
              </select>
              <Button onClick={handleAddItem} className="flex-1 h-12 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-2xl font-bold shadow-none">
                <Plus className="w-5 h-5 mr-1" /> Add
              </Button>
            </div>
          </Card>

          <div className="space-y-3 px-2">
            <h3 className="font-black text-lg">Total Available Today</h3>
            {inventory.length === 0 ? (
              <p className="text-zinc-400 text-sm italic">No items in stock.</p>
            ) : (
              inventory.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                  <div>
                    <h4 className="font-bold text-zinc-900">{item.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                      Kal: {item.openingStock} | Aaj laya: <span className="text-green-500">+{item.addedToday}</span>
                    </p>
                  </div>
                  <div className="text-xl font-black text-orange-500">
                    {item.openingStock + item.addedToday} <span className="text-xs text-zinc-500 font-bold uppercase">{item.unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeView === "Closing" && (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
            <h3 className="font-black text-orange-800 text-lg flex items-center gap-2 mb-2"><Moon className="w-5 h-5" /> Store Closing</h3>
            <p className="text-xs font-bold text-orange-600/70">Check your physical stock and enter what is REMAINING right now.</p>
          </div>

          <div className="space-y-3">
            {inventory.map(item => (
              <div key={item.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-zinc-900">{item.name}</h4>
                  <span className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded-lg">Total Today: {item.openingStock + item.addedToday}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-zinc-400 w-16">Remaining:</div>
                  <Input 
                    type="number"
                    step="any"
                    placeholder={`Left in ${item.unit}`}
                    value={item.closingStock}
                    onChange={e => handleClosingInput(item.id, e.target.value)}
                    className="flex-1 bg-white border-2 border-orange-300 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-14 rounded-xl text-xl font-black shadow-[0_4px_10px_rgba(249,115,22,0.1)] transition-all placeholder:font-medium placeholder:text-zinc-300"
                  />
                  <span className="text-xs font-bold uppercase text-zinc-400">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveClosing} className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-black text-lg active:scale-95 shadow-xl">
            <Save className="w-5 h-5 mr-2" /> SAVE CLOSING
          </Button>
        </div>
      )}

      {activeView === "Report" && (
        <div className="space-y-6">
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-black text-emerald-800 text-2xl">Closing Saved!</h3>
            <p className="text-sm font-bold text-emerald-600/70 mt-1">Tomorrow's opening stock has been updated.</p>
          </div>

          <div className="space-y-3 px-2">
            <h3 className="font-black text-lg">Today's Consumption</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase text-zinc-400">Item</th>
                    <th className="p-4 text-[10px] font-black uppercase text-zinc-400 text-right">Used/Sold Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {inventory.map(item => {
                    const total = item.openingStock + item.addedToday;
                    const used = total - (parseFloat(item.closingStock || "0"));
                    return (
                      <tr key={item.id}>
                        <td className="p-4 font-bold text-sm text-zinc-800">{item.name}</td>
                        <td className="p-4 font-black text-lg text-right text-red-500">
                          {used} <span className="text-[10px] text-red-400">{item.unit}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <Button onClick={handleFinishClosing} className="w-full h-12 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-2xl font-bold shadow-none">
            Start Next Day
          </Button>
        </div>
      )}
    </div>
  );
}
