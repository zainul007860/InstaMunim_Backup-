$file = "src\app\dashboard\page.tsx"
$c = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# ─── 1. ADD BUYBACK STATE VARS after imeiScanned ───────────────────────────
$afterImei = '  const [imeiScanned, setImeiScanned] = useState("");'
$buybackStates = @'

  // Buyback / Exchange Ledger States
  const [buybackCustName, setBuybackCustName] = useState("");
  const [buybackCustMobile, setBuybackCustMobile] = useState("");
  const [buybackAadhaar, setBuybackAadhaar] = useState("");
  const [buybackBrandModel, setBuybackBrandModel] = useState("");
  const [buybackImei, setBuybackImei] = useState("");
  const [buybackPrice, setBuybackPrice] = useState("");
  const [buybackIdPhoto, setBuybackIdPhoto] = useState("");
  const [buybackIdPhotoBack, setBuybackIdPhotoBack] = useState("");
  const [buybackList, setBuybackList] = useState<any[]>([]);
  const [buybackLoading, setBuybackLoading] = useState(false);
'@
$c = $c.Replace($afterImei, $afterImei + $buybackStates)

# ─── 2. ADD handleSaveBuyback & handleDeleteBuyback before handleAddExpense ─
$beforeExpense = '  const handleAddExpense = async () => {'
$buybackHandlers = @'
  const handleSaveBuyback = async () => {
    if (!buybackCustName || !buybackImei || !buybackPrice) {
      alert("Please fill Customer Name, IMEI and Price fields.");
      return;
    }
    setBuybackLoading(true);
    try {
      const { data: store } = await supabase.from("stores").select("id").eq("owner_mobile", ownerMobile).single();
      if (!store) throw new Error("Store not found");
      const title = `Exchange Buyback: ${buybackBrandModel || "Phone"} | IMEI: ${buybackImei} | Customer: ${buybackCustName} (${buybackCustMobile}) | Aadhaar: ${buybackAadhaar}`;
      const { data: newExp, error } = await supabase
        .from("expenses")
        .insert([{ store_id: store.id, title, amount: Number(buybackPrice) }])
        .select()
        .single();
      if (error) throw error;
      const record = {
        id: newExp.id,
        custName: buybackCustName,
        custMobile: buybackCustMobile,
        aadhaar: buybackAadhaar,
        brandModel: buybackBrandModel,
        imei: buybackImei,
        price: buybackPrice,
        idPhoto: buybackIdPhoto,
        idPhotoBack: buybackIdPhotoBack,
        date: new Date().toLocaleDateString("en-IN"),
      };
      setBuybackList(prev => [record, ...prev]);
      setBuybackCustName(""); setBuybackCustMobile(""); setBuybackAadhaar("");
      setBuybackBrandModel(""); setBuybackImei(""); setBuybackPrice("");
      setBuybackIdPhoto(""); setBuybackIdPhotoBack(""); setImeiScanned("");
      alert("Exchange Buyback saved and logged in expenses!");
    } catch (err: any) {
      alert("Error: " + (err.message || "Unknown error"));
    } finally {
      setBuybackLoading(false);
    }
  };

  const handleDeleteBuyback = (id: any) => {
    if (!confirm("Delete this buyback record?")) return;
    setBuybackList(prev => prev.filter(r => r.id !== id));
  };

'@
$c = $c.Replace($beforeExpense, $buybackHandlers + $beforeExpense)

# ─── 3. ADD "Exchange Ledger" to MoreMenu grid ─────────────────────────────
$afterKhata = '{ id: "Marketing", label: "Smart CRM"'
$exchangeEntry = '{ id: "BuybackTracker", label: "Exchange Ledger", icon: RefreshCw, color: "text-orange-600", bg: "bg-orange-50" },' + "`r`n" + '                  { id: "Marketing", label: "Smart CRM"'
$c = $c.Replace($afterKhata, $exchangeEntry)

# ─── 4. ADD BuybackTracker to bottom nav highlight arrays ──────────────────
$c = $c.Replace(
  "['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory'].includes(activeTab)",
  "['MoreMenu', 'Settings', 'Rent', 'Support', 'Khata', 'Menu', 'Inventory', 'BuybackTracker'].includes(activeTab)"
)

# ─── 5. SYNC imeiScanned → buybackImei when scanner returns ────────────────
$c = $c.Replace(
  '      setImeiScanned(barcode);',
  '      setImeiScanned(barcode);' + "`r`n" + '      setBuybackImei(barcode);'
)

# ─── 6. ADD Exchange Ledger UI section before {activeTab === "Inventory" ───
$beforeInventory = '{activeTab === "Inventory" && ('
$exchangeUI = @'
{activeTab === "BuybackTracker" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-28 px-4 pt-4">
              <header>
                <button onClick={() => setActiveTab("MoreMenu")} className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-1"><span>←</span> More</button>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-orange-600" />
                  </div>
                  Exchange Ledger
                </h2>
                <p className="text-zinc-500 font-bold mt-1 text-sm">Record used phone / device buyback with customer ID proof</p>
              </header>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 space-y-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">New Buyback Entry</p>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Customer Name *</label>
                    <input type="text" placeholder="Full Name" value={buybackCustName} onChange={e => setBuybackCustName(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mobile No</label>
                    <input type="tel" placeholder="10-digit" value={buybackCustMobile} onChange={e => setBuybackCustMobile(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Aadhaar No</label>
                  <input type="text" placeholder="12-digit Aadhaar" value={buybackAadhaar} onChange={e => setBuybackAadhaar(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Device Brand & Model *</label>
                  <input type="text" placeholder="e.g. Samsung Galaxy A54" value={buybackBrandModel} onChange={e => setBuybackBrandModel(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                </div>

                {/* IMEI with Camera Scanner */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">IMEI Number * (Scan or Type)</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="15-digit IMEI" value={buybackImei} onChange={e => setBuybackImei(e.target.value)}
                      className="flex-1 h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                    <button
                      onClick={() => {
                        scannerTargetRef.current = "imei";
                        setScannedBarcode("");
                        setLastScannedMsg("");
                        setShowScanner(true);
                      }}
                      className="h-11 w-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md shadow-orange-500/20 flex-shrink-0"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  {imeiScanned && <p className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">✓ IMEI scanned: {imeiScanned}</p>}
                </div>

                {/* Buy Price */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Buy Price (₹) *</label>
                  <input type="number" placeholder="Amount paid to customer" value={buybackPrice} onChange={e => setBuybackPrice(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-sm" />
                </div>

                {/* ID Photo front/back */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ID Proof (Front)</label>
                    {buybackIdPhoto ? (
                      <div className="relative aspect-[3/2] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <img src={buybackIdPhoto} alt="ID Front" className="w-full h-full object-cover" />
                        <button onClick={() => setBuybackIdPhoto("")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <label className="aspect-[3/2] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <Camera className="h-5 w-5 text-zinc-300" />
                        <span className="text-[9px] font-bold text-zinc-400">Take Photo</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const r = new FileReader(); r.onloadend = () => setBuybackIdPhoto(r.result as string); r.readAsDataURL(f);
                        }} />
                      </label>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ID Proof (Back)</label>
                    {buybackIdPhotoBack ? (
                      <div className="relative aspect-[3/2] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <img src={buybackIdPhotoBack} alt="ID Back" className="w-full h-full object-cover" />
                        <button onClick={() => setBuybackIdPhotoBack("")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <label className="aspect-[3/2] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <Camera className="h-5 w-5 text-zinc-300" />
                        <span className="text-[9px] font-bold text-zinc-400">Take Photo</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const r = new FileReader(); r.onloadend = () => setBuybackIdPhotoBack(r.result as string); r.readAsDataURL(f);
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveBuyback}
                  disabled={buybackLoading}
                  className="w-full h-13 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {buybackLoading ? "Saving..." : "✓ Save Exchange Record"}
                </button>
              </div>

              {/* Records List */}
              {buybackList.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Past Records ({buybackList.length})</p>
                  {buybackList.map((rec, i) => (
                    <div key={rec.id || i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-zinc-900 dark:text-white text-sm">{rec.brandModel || "Device"}</p>
                          <p className="text-[10px] font-bold text-zinc-500">{rec.custName} • {rec.custMobile}</p>
                          <p className="text-[10px] font-bold text-orange-600">IMEI: {rec.imei}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{rec.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-zinc-900 dark:text-white">₹{rec.price}</p>
                          <button onClick={() => handleDeleteBuyback(rec.id)} className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider mt-1">Delete</button>
                        </div>
                      </div>
                      {(rec.idPhoto || rec.idPhotoBack) && (
                        <div className="flex gap-2 pt-1">
                          {rec.idPhoto && <img src={rec.idPhoto} alt="ID Front" className="h-14 rounded-lg object-cover border border-zinc-100" />}
                          {rec.idPhotoBack && <img src={rec.idPhotoBack} alt="ID Back" className="h-14 rounded-lg object-cover border border-zinc-100" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
'@
$c = $c.Replace($beforeInventory, $exchangeUI + $beforeInventory)

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $c)
Write-Host "Exchange Ledger fully rebuilt!"
