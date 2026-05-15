"use client";

import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Suspense, useEffect, useState } from "react";
import { Printer, ShoppingBag, CheckCircle2, QrCode, Camera, Globe, Phone, MapPin, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const [cloudLogo, setCloudLogo] = useState<string | null>(null);
  
  const restName = searchParams.get("n") || "InstaMunim POS";
  const items = searchParams.get("i") || "";
  const price = searchParams.get("p") || "0";
  const date = searchParams.get("d") || new Date().toISOString();
  const type = searchParams.get("t") || "Cash";
  const id = searchParams.get("id") || "1001";
  const mobile = searchParams.get("m") || "";
  const custName = searchParams.get("cn") || "Guest Customer";
  const storeAddr = searchParams.get("a") || "Premium Plaza, New Delhi";
  const storePh = searchParams.get("ph") || "+91 9999 888 777";
  const storeWeb = searchParams.get("w") || "www.khankitchen.com";
  const storeGs = searchParams.get("g") || "07AABCU1234F1Z5";
  const ownerMobile = searchParams.get("o") || "";
  
  const extraChargeName = searchParams.get("ecn") || "";
  const extraChargeAmount = Number(searchParams.get("eca")) || 0;

  const logoFromUrl = searchParams.get("logo") || "";

  // Fetch Logo from Cloud
  useEffect(() => {
    if (ownerMobile) {
      const fetchLogo = async () => {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('store_logo')
            .eq('owner_mobile', ownerMobile)
            .single();
          
          if (!error && data?.store_logo) {
            setCloudLogo(data.store_logo);
          }
        } catch (e) {
          console.error("Logo fetch failed", e);
        }
      };
      fetchLogo();
    }
  }, [ownerMobile]);

  // Determine which logo to show
  const finalLogo = cloudLogo || (logoFromUrl.startsWith("http") ? logoFromUrl : null);

  const parsedItems = items.split(',').map(i => {
    const parts = i.trim().split(':');
    return { name: parts[0] || "Item", price: parts[1] || "0" };
  }).filter(i => i.name !== "Item" || i.price !== "0");

  const total = Number(price);
  const gstTotal = ((total - extraChargeAmount) * 0.05).toFixed(2);
  const cgst = (Number(gstTotal) / 2).toFixed(2);
  const sgst = (Number(gstTotal) / 2).toFixed(2);
  const subtotal = (total - Number(gstTotal) - extraChargeAmount).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-100 flex justify-center py-0 sm:py-10 px-0 sm:px-4 font-sans print:bg-white print:p-0 overflow-y-auto">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible !important; }
          .print-hide { display: none !important; }
        }
        .dotted-border {
          background-image: linear-gradient(to right, #e4e4e7 33%, rgba(255,255,255,0) 0%);
          background-position: bottom;
          background-size: 10px 1px;
          background-repeat: repeat-x;
        }
      `}} />
      
      <div className="bg-white w-full max-w-[550px] shadow-2xl flex flex-col relative print:shadow-none print:max-w-full h-fit min-h-full">
        
        {/* Print Bar */}
        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center print-hide sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-[10px] uppercase tracking-widest">Digital Tax Invoice</span>
          </div>
          <Button size="sm" onClick={() => window.print()} className="bg-white text-zinc-900 hover:bg-zinc-200 h-8 text-[10px] font-black uppercase tracking-widest px-4">
            <Printer className="w-3 h-3 mr-2" /> Save PDF
          </Button>
        </div>

        <div className="p-8 sm:p-14 flex-1 flex flex-col space-y-10">
          
          {/* Brand Header */}
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-zinc-200 border-4 border-zinc-50 overflow-hidden text-white font-black text-4xl">
               {finalLogo ? (
                 <img src={finalLogo} alt="Store Logo" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-black text-white">{restName.charAt(0)}</span>
               )}
             </div>
             <div>
               <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{restName}</h1>
               <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-zinc-400 mt-3 uppercase tracking-widest">
                  <MapPin className="w-2.5 h-2.5" /> {storeAddr}
               </div>
               <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {storePh}</span>
                  <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> {storeWeb}</span>
               </div>
               <p className="text-[10px] font-black text-zinc-900 mt-4 px-4 py-1.5 bg-zinc-100 rounded-full inline-block uppercase tracking-[0.2em]">GSTIN: {storeGs}</p>
             </div>
          </div>

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 pb-10 border-b-2 border-zinc-100 relative">
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-zinc-900" />
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Invoice Details</p>
              <p className="text-sm font-black text-zinc-900 tracking-tight">#INV-{id.split('-').pop()?.toUpperCase() || id.slice(-6).toUpperCase()}</p>
              <p className="text-[10px] font-bold text-zinc-400 mt-0.5">POS: UNIT-01 / Cashier: System</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Date & Time</p>
              <p className="text-sm font-black text-zinc-900">{format(new Date(date), "dd MMMM, yyyy")}</p>
              <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{format(new Date(date), "hh:mm a")}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Billed To</p>
              <p className="text-sm font-black text-zinc-900">{custName}</p>
              <p className="text-[10px] font-bold text-zinc-400 mt-0.5">+91 {mobile}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Payment Mode</p>
              <div className="flex items-center justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">{type} SUCCESS</p>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between text-[10px] font-black text-zinc-900 uppercase tracking-widest pb-3 border-b border-zinc-100">
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            
            <div className="space-y-6">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-md font-black text-zinc-900 tracking-tight leading-tight uppercase">{item.name}</p>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">HSN: 9963 | Qty: 1.00</p>
                  </div>
                  <p className="text-md font-black text-zinc-900">₹{item.price}.00</p>
                </div>
              ))}

              {extraChargeName && extraChargeAmount > 0 && (
                <div className="flex justify-between items-start gap-4 border-t border-zinc-50 pt-6">
                  <div className="flex-1">
                    <p className="text-md font-black text-zinc-900 tracking-tight leading-tight uppercase">{extraChargeName}</p>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">Additional Service</p>
                  </div>
                  <p className="text-md font-black text-zinc-900">₹{extraChargeAmount}.00</p>
                </div>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 space-y-4 shadow-2xl shadow-zinc-200">
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Subtotal (Net)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>CGST (2.5%)</span>
              <span>₹{cgst}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>SGST (2.5%)</span>
              <span>₹{sgst}</span>
            </div>
            {extraChargeAmount > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                <span>{extraChargeName}</span>
                <span>₹{extraChargeAmount}.00</span>
              </div>
            )}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Total Amount</span>
              <span className="text-4xl font-black tracking-tighter">₹{total}.00</span>
            </div>
          </div>

          {/* Terms & Conditions - More Content */}
          <div className="space-y-6 pb-10">
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
              <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-900">Terms & Conditions</h5>
              <ul className="text-[9px] font-bold text-zinc-400 space-y-2 uppercase leading-relaxed">
                <li>• This is a computer generated digital tax invoice.</li>
                <li>• No signature is required for digital receipts.</li>
                <li>• Please check items before leaving the counter.</li>
                <li>• Items once sold cannot be returned or exchanged.</li>
                <li>• Standard GST rates applied as per Govt. norms.</li>
              </ul>
            </div>

            {/* Social & Experience */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="flex items-center gap-6">
                <Camera className="w-5 h-5 text-zinc-300" />
                <Globe className="w-5 h-5 text-zinc-300" />
                <Phone className="w-5 h-5 text-zinc-300" />
              </div>
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">How was your experience?</p>
              <div className="flex gap-2">
                 {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">★</div>)}
              </div>
            </div>
          </div>

          {/* Footer Barcode Style */}
          <div className="text-center pt-10 border-t-2 border-dashed border-zinc-100">
            <div className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center mb-6 opacity-30 overflow-hidden">
               {/* Barcode Mock */}
               <div className="flex gap-1">
                  {[...Array(40)].map((_, i) => <div key={i} className={`w-[2px] h-8 bg-zinc-900 ${i % 3 === 0 ? 'w-[4px]' : ''}`} />)}
               </div>
            </div>
            <p className="text-xs font-black text-zinc-900 uppercase tracking-[0.3em]">Thank you for shopping!</p>
            <div className="mt-8 pt-8 border-t border-zinc-50 flex flex-col items-center gap-2">
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">Verified Digital Receipt</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest italic">Powered by InstaMunim</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white font-black uppercase tracking-[0.5em] text-xs">Authenticating Receipt...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
