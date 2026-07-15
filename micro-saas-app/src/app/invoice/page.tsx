"use client";

import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Suspense, useEffect, useState, useRef } from "react";
import { Printer, ShoppingBag, CheckCircle2, QrCode, Camera, Globe, Phone, MapPin, ReceiptText, Download, Gift, Copy, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// Scratch Card Component for Invoice
function ScratchCard({ 
  invoiceId, 
  ownerMobile, 
  customerMobile, 
  storeName, 
  businessType,
  onWon 
}: { 
  invoiceId: string; 
  ownerMobile: string; 
  customerMobile: string; 
  storeName: string;
  businessType: string | null;
  onWon: (coupon: any) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [amount, setAmount] = useState(10); // Default reward

  useEffect(() => {
    if (businessType === "Mobile/Electronics") {
      // Multiple of 10 between 100 and 300 (inclusive)
      const roll = Math.floor(Math.random() * 21) * 10 + 100;
      setAmount(roll);
    } else {
      // 70% chance of ₹10, 30% chance of ₹5
      const roll = Math.random() < 0.7 ? 10 : 5;
      setAmount(roll);
    }
  }, [businessType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 340;
      canvas.height = rect?.height || 185;

      // Draw gradient holographic background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#4b5563"); // slate-600
      grad.addColorStop(0.5, "#9ca3af"); // slate-400
      grad.addColorStop(1, "#1f2937"); // slate-800
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background noise/sparkles
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4 + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add instruction text
      ctx.font = "900 12px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAP / CLICK TO REVEAL REWARD! ✨", canvas.width / 2, canvas.height / 2);
    };

    resizeCanvas();
  }, [isCompleted]);

  const revealCard = (e: any) => {
    if (isCompleted) return;
    setIsCompleted(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (err) {}

    // Generate dynamic coupon code
    const couponCode = "IM-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newCoupon = {
      code: couponCode,
      discount_amount: amount,
      store_mobile: ownerMobile || "",
      customer_mobile: customerMobile || "",
      invoice_id: invoiceId || "1001",
      status: "unused"
    };

    // Trigger instant UI reveal
    onWon(newCoupon);

    supabase
      .from("coupons")
      .insert([newCoupon])
      .then(({ error }) => {
        if (error) {
          console.error("Supabase coupon insert failed:", error);
        }
      });
  };

  return (
    <div className="absolute inset-0 z-20">
      <canvas 
        ref={canvasRef} 
        onMouseDown={revealCard}
        onTouchStart={revealCard}
        className="w-full h-full rounded-3xl cursor-pointer" 
      />
    </div>
  );
}


function InvoiceContent() {
  const searchParams = useSearchParams();
  const [cloudLogo, setCloudLogo] = useState<string | null>(null);
  const isFree = searchParams.get("free") === "true";

  // Scratch card coupon states
  const [scratchClaimed, setScratchClaimed] = useState(false);
  const [claimedCoupon, setClaimedCoupon] = useState<any>(null);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(true);
  const [copied, setCopied] = useState(false);
  const [storeBusinessType, setStoreBusinessType] = useState<string | null>(null);
  
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
  const discountAmount = Number(searchParams.get("disc")) || 0;

  const fin = searchParams.get("fin") === "true";
  const fco = searchParams.get("fco") || "";
  const flo = searchParams.get("flo") || "0";
  const fdp = searchParams.get("fdp") || "0";
  const fid = searchParams.get("fid") || "";

  const logoFromUrl = searchParams.get("logo") || "";

  const isBannerView = searchParams.get("banner") === "true";
  const bannerOffer = searchParams.get("o") || "";
  const bannerDetails = searchParams.get("d") || "";
  const bannerProd = searchParams.get("p") || "";

  const [adBannerUrl, setAdBannerUrl] = useState("");
  const [isLoadingAd, setIsLoadingAd] = useState(true);

  useEffect(() => {
    if (!isBannerView) return;
    const runAdGen = async () => {
      try {
        const bannerPrompt = `Professional commercial studio photography social media ad poster banner. A realistic close-up shot of '${bannerProd}' in premium packaging, set on a modern studio surface with clean lighting. Cinematic lighting, sharp focus, 8k resolution, high-end commercial setup. Plain background with no text, letters, or words.`;
        const encodedPrompt = encodeURIComponent(bannerPrompt);
        const seed = Math.abs(restName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
        const bgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

        const drawTextWithFit = (
          ctx: any,
          textStr: string, 
          centerX: number, 
          yPos: number, 
          maxWidth: number, 
          maxFontSize: number, 
          isBold: boolean, 
          color: string
        ) => {
          let fontSize = maxFontSize;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = color;
          
          do {
            ctx.font = `${isBold ? '900' : 'bold'} ${fontSize}px sans-serif`;
            fontSize -= 2;
          } while (ctx.measureText(textStr).width > maxWidth && fontSize > 20);
          
          if (ctx.measureText(textStr).width > maxWidth) {
            fontSize = maxFontSize - 6;
            if (fontSize < 20) fontSize = 20;
            ctx.font = `${isBold ? '900' : 'bold'} ${fontSize}px sans-serif`;
            const words = textStr.split(" ");
            let line = "";
            const lines = [];
            
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + " ";
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth && n > 0) {
                lines.push(line.trim());
                line = words[n] + " ";
              } else {
                line = testLine;
              }
            }
            lines.push(line.trim());
            
            const lineHeight = fontSize + 10;
            const startY = yPos - ((lines.length - 1) * lineHeight) / 2;
            
            lines.forEach((lineText, idx) => {
              ctx.fillText(lineText, centerX, startY + idx * lineHeight);
            });
          } else {
            ctx.fillText(textStr, centerX, yPos);
          }
        };

        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAdBannerUrl(bgUrl);
          setIsLoadingAd(false);
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = bgUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1024, 1024);

          const topGrad = ctx.createLinearGradient(0, 0, 0, 260);
          topGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
          topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, 1024, 260);

          const bottomGrad = ctx.createLinearGradient(0, 720, 0, 1024);
          bottomGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
          bottomGrad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(0, 720, 1024, 304);

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          let storeNameFontSize = 44;
          do {
            ctx.font = `bold ${storeNameFontSize}px sans-serif`;
            storeNameFontSize -= 2;
          } while (ctx.measureText(restName.toUpperCase()).width > 750 && storeNameFontSize > 24);
          ctx.fillText(restName.toUpperCase(), 48, 54);

          const drawWithLogo = (logoImg: any) => {
            if (logoImg) {
              const logoSize = 130;
              const x = 1024 - logoSize - 48;
              const y = 48;
              const radius = 24;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.moveTo(x + radius, y);
              ctx.lineTo(x + logoSize - radius, y);
              ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
              ctx.lineTo(x + logoSize, y + logoSize - radius);
              ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - radius, y + logoSize);
              ctx.lineTo(x + radius, y + logoSize);
              ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
              ctx.lineTo(x, y + radius);
              ctx.quadraticCurveTo(x, y, x + radius, y);
              ctx.closePath();
              ctx.fill();

              const margin = 10;
              const size = logoSize - (margin * 2);
              ctx.drawImage(logoImg, x + margin, y + margin, size, size);
            }

            drawTextWithFit(ctx, bannerOffer.toUpperCase(), 512, 805, 928, 76, true, "#FF6B00");
            drawTextWithFit(ctx, `${bannerDetails} ON ${bannerProd}`.toUpperCase(), 512, 895, 928, 38, false, "#ffffff");

            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("POWERED BY INSTAMUNIM", 512, 970);

            setAdBannerUrl(canvas.toDataURL("image/png"));
            setIsLoadingAd(false);
          };

          const logoUrl = logoFromUrl || cloudLogo;
          if (logoUrl) {
            const lImg = new Image();
            lImg.crossOrigin = "anonymous";
            lImg.src = logoUrl;
            lImg.onload = () => drawWithLogo(lImg);
            lImg.onerror = () => drawWithLogo(undefined);
          } else {
            drawWithLogo(undefined);
          }
        };
        img.onerror = () => {
          setAdBannerUrl(bgUrl);
          setIsLoadingAd(false);
        };
      } catch (e) {
        setIsLoadingAd(false);
      }
    };
    
    if (ownerMobile && !cloudLogo) {
      const timer = setTimeout(runAdGen, 1000);
      return () => clearTimeout(timer);
    } else {
      runAdGen();
    }
  }, [isBannerView, restName, bannerOffer, bannerDetails, bannerProd, logoFromUrl, cloudLogo, ownerMobile]);

  const decId = searchParams.get("decId");
  const [declarationItem, setDeclarationItem] = useState<any>(null);
  const [loadingDeclaration, setLoadingDeclaration] = useState(true);

  // Fetch declaration item if decId exists
  useEffect(() => {
    if (decId) {
      const fetchDeclaration = async () => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', decId)
            .single();
          
          if (!error && data) {
            const title = data.title || "";
            if (title.includes("[BUYBACK###") || title.includes("[BUYBACK:")) {
              const parseBuybackMeta = (t: any) => {
                if (t.includes("[BUYBACK###")) {
                  const metaPart = t.substring(t.indexOf("[BUYBACK###") + 11, t.lastIndexOf("]"));
                  const parts = metaPart.split("###");
                  const photos = (parts[5] || "").split("|");
                  return {
                    brandModel: parts[0] || "Unknown",
                    imei: parts[1] || "N/A",
                    aadhaar: parts[2] || "N/A",
                    custName: parts[3] || "N/A",
                    custMobile: parts[4] || "N/A",
                    photo: photos[0] || "N/A",
                    photoBack: photos[1] || "N/A",
                    photoDevice: photos[2] || "N/A"
                  };
                } else {
                  const metaPart = t.substring(t.indexOf("[BUYBACK:") + 9, t.lastIndexOf("]"));
                  const parts = metaPart.split(":");
                  const photos = (parts[5] || "").split("|");
                  return {
                    brandModel: parts[0] || "Unknown",
                    imei: parts[1] || "N/A",
                    aadhaar: parts[2] || "N/A",
                    custName: parts[3] || "N/A",
                    custMobile: parts[4] || "N/A",
                    photo: photos[0] || "N/A",
                    photoBack: photos[1] || "N/A",
                    photoDevice: photos[2] || "N/A"
                  };
                }
              };
              
              const info = parseBuybackMeta(title);
              setDeclarationItem({
                id: data.id,
                title: data.title,
                amount: data.amount,
                date: data.expense_date || data.created_at,
                brandModel: info.brandModel,
                imei: info.imei,
                aadhaar: info.aadhaar,
                custName: info.custName,
                custMobile: info.custMobile,
                photo: info.photo,
                photoBack: info.photoBack,
                photoDevice: info.photoDevice
              });
            }
          }
        } catch (e) {
          console.error("Error loading buyback declaration:", e);
        } finally {
          setLoadingDeclaration(false);
        }
      };
      fetchDeclaration();
    }
  }, [decId]);

  // Auto print declaration
  useEffect(() => {
    if (declarationItem) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [declarationItem]);

  // Fetch Logo from Cloud
  useEffect(() => {
    if (ownerMobile) {
      const fetchLogo = async () => {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('store_logo, business_type')
            .eq('owner_mobile', ownerMobile)
            .single();
          
          if (!error && data) {
            let bType = data.business_type || "";
            const rawLogo = data.store_logo || "";
            if (rawLogo.startsWith('JSON_CFG:')) {
              try {
                const settings = JSON.parse(rawLogo.substring(9));
                setCloudLogo(settings.logo || null);
                if (!bType) bType = settings.businessType || "";
              } catch (e) {
                setCloudLogo(rawLogo);
              }
            } else if (rawLogo.includes('|')) {
              const parts = rawLogo.split('|');
              setCloudLogo(parts[2] || null);
            } else {
              setCloudLogo(rawLogo);
            }
            setStoreBusinessType(bType);
          }
        } catch (e) {
          console.error("Logo and business type fetch failed", e);
        }
      };
      fetchLogo();
    }
  }, [ownerMobile]);

  // Fetch scratch coupon status from Supabase
  useEffect(() => {
    if (id) {
      const checkCoupon = async () => {
        setIsLoadingCoupon(true);
        try {
          const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("invoice_id", id)
            .maybeSingle();
          if (!error && data) {
            setScratchClaimed(true);
            setClaimedCoupon(data);
          }
        } catch (e) {
          console.error("Coupon fetch failed", e);
        } finally {
          setIsLoadingCoupon(false);
        }
      };
      checkCoupon();
    } else {
      setIsLoadingCoupon(false);
    }
  }, [id]);

  const canScratch = id && mobile && ownerMobile;

  // Determine which logo to show
  const finalLogo = cloudLogo || (logoFromUrl.startsWith("http") ? logoFromUrl : null);

  const parsedItems = items.split(',').map(i => {
    const parts = i.trim().split(':');
    let nameStr = parts[0] || "Item";
    let imei = "";
    const imeiMatch = nameStr.match(/\[IMEI-(.+)\]/);
    if (imeiMatch) {
      imei = imeiMatch[1];
      nameStr = nameStr.replace(/\[IMEI-.+\]/, "").trim();
    }
    return { name: nameStr, price: parts[1] || "0", imei };
  }).filter(i => i.name !== "Item" || i.price !== "0");

  const hasGst = searchParams.get("gst") !== "false";
  const gstRate = Number(searchParams.get("gstRate")) || 0;

  const finalTotal = Number(price) || 0;
  const grossTotal = finalTotal + discountAmount;
  const actualTaxable = Math.max(0, finalTotal - extraChargeAmount);
  
  let gstTotal = 0;
  let cgst = "0.00";
  let sgst = "0.00";
  let subtotal = (grossTotal - extraChargeAmount).toFixed(2);

  if (hasGst && gstRate > 0) {
    const gstFactor = gstRate / 100;
    const taxableSubtotal = actualTaxable / (1 + gstFactor);
    gstTotal = actualTaxable - taxableSubtotal;
    cgst = (gstTotal / 2).toFixed(2);
    sgst = (gstTotal / 2).toFixed(2);
    subtotal = (grossTotal - gstTotal - extraChargeAmount).toFixed(2);
  }

  if (isBannerView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-white">
        <div className="w-full max-w-lg space-y-6 text-center animate-in fade-in duration-500">
          <header className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-orange-500">{restName}</h1>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Special Customer Promotion Offer</p>
          </header>

          <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
            {isLoadingAd ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Generating Ad Banner...</p>
              </div>
            ) : (
              <img src={adBannerUrl} alt="Ad Banner" className="w-full h-full object-contain" />
            )}
          </div>

          {!isLoadingAd && (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = adBannerUrl;
                  link.download = `InstaMunim_Offer_${restName.replace(/\s+/g, '_')}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase shadow-lg shadow-orange-600/10 active:scale-95 transition-all border-0 cursor-pointer"
              >
                Save To Gallery
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (decId) {
    if (loadingDeclaration) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-black uppercase tracking-[0.5em] text-xs">
          Loading Legal Declaration...
        </div>
      );
    }
    if (!declarationItem) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-black uppercase tracking-[0.2em] text-xs text-center p-4">
          Error: Buyback declaration record not found.
        </div>
      );
    }
    return (
      <div className="h-screen bg-zinc-100 flex justify-center py-0 sm:py-10 px-0 sm:px-4 font-sans print:bg-white print:p-0 print:h-auto print:overflow-visible overflow-y-auto">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 0; }
            html, body { height: auto !important; overflow: visible !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible !important; }
            .print-hide { display: none !important; }
          }
        `}} />
        
        <div className="bg-white w-full max-w-[550px] shadow-2xl flex flex-col relative print:shadow-none print:max-w-full print:h-auto print:min-h-0 h-fit min-h-full text-zinc-900">
          
          {/* Print Bar */}
          <div className="bg-zinc-900 text-white p-4 flex justify-between items-center print:hidden print-hide sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Buyback Receipt</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => window.print()} 
                className="bg-white text-zinc-900 hover:bg-zinc-200 h-8 text-[10px] font-black uppercase tracking-widest px-4 border-0 rounded-md cursor-pointer"
              >
                <Printer className="w-3 h-3 mr-2" /> Save PDF
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.close()} 
                className="bg-zinc-800 text-white hover:bg-zinc-700 h-8 text-[10px] font-black uppercase tracking-widest px-4 border-0 rounded-md cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>

          {/* White Paper Content */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col">
            
            {/* Store Logo/Header */}
            <div className="text-center pb-6 border-b border-zinc-200 flex flex-col items-center">
              {finalLogo ? (
                <img src={finalLogo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl mb-4 bg-zinc-900 p-1" />
              ) : (
                <div className="w-16 h-16 bg-zinc-950 text-white rounded-2xl flex items-center justify-center font-black text-2xl uppercase mb-4">
                  {restName.charAt(0)}
                </div>
              )}
              
              <h1 className="text-2xl font-black uppercase tracking-tight">{restName}</h1>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                {storeAddr}
              </p>
              <p className="text-xs font-bold text-zinc-500 tracking-widest">
                Ph: {storePh}
              </p>
              {storeGs && (
                <p className="text-[10px] font-black text-zinc-800 mt-1 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full">
                  GSTIN: {storeGs}
                </p>
              )}
            </div>

            {/* Title / Date */}
            <div className="text-center my-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-2 border-zinc-900 py-1.5 px-4 inline-block">
                Exchange & Legal Declaration
              </h2>
              <p className="text-[9px] font-bold text-zinc-400 mt-1.5 uppercase">
                Date: {format(new Date(declarationItem.date), "dd MMMM, yyyy - hh:mm a")}
              </p>
            </div>

            {/* Declaration Text */}
            <div className="text-[11px] font-medium leading-relaxed text-zinc-700 text-justify space-y-3 font-sans border-b border-zinc-150 pb-6">
              <p>
                I, <strong className="text-zinc-900 uppercase">{declarationItem.custName}</strong>, residing at the registered address under the ID proof below, holding Mobile Number <strong>+91 {declarationItem.custMobile}</strong>, do hereby declare that:
              </p>
              <p>
                1. I am the absolute lawful owner of the device described as <strong className="uppercase">{declarationItem.brandModel}</strong> bearing 15-digit IMEI number <strong>{declarationItem.imei}</strong>.
              </p>
              <p>
                2. I have voluntarily sold / exchanged this device to <strong className="uppercase">{restName}</strong> for a mutually agreed consideration value of <strong>₹{declarationItem.amount}.00</strong> on this day.
              </p>
              <p>
                3. If this device is subsequently found to be stolen, blocked, or involved in any dispute, I shall be solely held responsible and liable for all legal consequences under the applicable laws.
              </p>
            </div>

            {/* Details Summary Table */}
            <div className="my-6 border border-zinc-200 rounded-xl overflow-hidden text-[10px] font-sans">
              <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-200 p-2.5 font-bold text-zinc-800">
                <span>Device Model:</span>
                <span className="text-right text-zinc-900 uppercase">{declarationItem.brandModel}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-zinc-200 p-2.5 font-bold text-zinc-800">
                <span>Device IMEI:</span>
                <span className="text-right text-zinc-900">{declarationItem.imei}</span>
              </div>
              <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-200 p-2.5 font-bold text-zinc-800">
                <span>Customer ID / Aadhaar:</span>
                <span className="text-right text-zinc-900">{declarationItem.aadhaar}</span>
              </div>
              <div className="grid grid-cols-2 p-2.5 font-bold text-zinc-800">
                <span>Transacted Amount:</span>
                <span className="text-right text-orange-600 font-black">₹{declarationItem.amount}.00</span>
              </div>
            </div>

            {/* Photos Section */}
            {((declarationItem.photo && declarationItem.photo !== "N/A") || 
              (declarationItem.photoBack && declarationItem.photoBack !== "N/A") || 
              (declarationItem.photoDevice && declarationItem.photoDevice !== "N/A")) && (
              <div className="my-6 space-y-2.5">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Verification Documents & Device</h4>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Front Side */}
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center">ID Front</p>
                    <div className="w-full h-24 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-50">
                      {declarationItem.photo && declarationItem.photo !== "N/A" ? (
                        <img src={declarationItem.photo} alt="ID Front" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center">ID Back</p>
                    <div className="w-full h-24 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-50">
                      {declarationItem.photoBack && declarationItem.photoBack !== "N/A" ? (
                        <img src={declarationItem.photoBack} alt="ID Back" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Device Photo */}
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center">Device Photo</p>
                    <div className="w-full h-24 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-50">
                      {declarationItem.photoDevice && declarationItem.photoDevice !== "N/A" ? (
                        <img src={declarationItem.photoDevice} alt="Device Pic" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">N/A</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 mt-auto pt-8 border-t border-dashed border-zinc-200 text-[10px] font-sans">
              <div className="space-y-12">
                <div className="h-10 border-b border-zinc-300 w-36" />
                <p className="font-bold text-zinc-800">Customer Signature / Thumb</p>
              </div>
              <div className="space-y-12 text-right flex flex-col items-end">
                <div className="h-10 border-b border-zinc-300 w-36" />
                <p className="font-bold text-zinc-800">Authorized Merchant Sign</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-100 flex justify-center py-0 sm:py-10 px-0 sm:px-4 font-sans print:bg-white print:p-0 print:h-auto print:overflow-visible overflow-y-auto">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          html, body { height: auto !important; overflow: visible !important; }
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
      
      <div className="bg-white w-full max-w-[550px] shadow-2xl flex flex-col relative print:shadow-none print:max-w-full print:h-auto print:min-h-0 h-fit min-h-full">
        
        {/* Print Bar */}
        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center print:hidden print-hide sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-[10px] uppercase tracking-widest">Digital Tax Invoice</span>
          </div>
          <Button size="sm" onClick={() => window.print()} className="bg-white text-zinc-900 hover:bg-zinc-200 h-8 text-[10px] font-black uppercase tracking-widest px-4">
            <Printer className="w-3 h-3 mr-2" /> Save PDF
          </Button>
        </div>

        <div className="p-8 sm:p-14 print:p-6 flex-1 flex flex-col space-y-10 print:space-y-4">
          
          {/* Brand Header */}
          <div className="text-center space-y-4 print:space-y-1">
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
               {hasGst && storeGs && (
                 <p className="text-[10px] font-black text-zinc-900 mt-4 print:mt-1 px-4 py-1.5 print:py-0.5 bg-zinc-100 rounded-full inline-block uppercase tracking-[0.2em]">GSTIN: {storeGs}</p>
               )}
             </div>
          </div>

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 print:gap-y-2 pb-10 print:pb-4 border-b-2 border-zinc-100 relative">
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
                <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                  {fin ? `EMI (${fco})` : type} SUCCESS
                </p>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="flex-1 space-y-6 print:space-y-2">
            <div className="flex justify-between text-[10px] font-black text-zinc-900 uppercase tracking-widest pb-3 print:pb-1 border-b border-zinc-100">
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            
            <div className="space-y-6">
               {parsedItems.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-start gap-4">
                   <div className="flex-1">
                     <p className="text-md font-black text-zinc-900 tracking-tight leading-tight uppercase">{item.name}</p>
                     {item.imei && (
                       <p className="text-[9px] font-black text-orange-500 mt-1 uppercase">IMEI No: {item.imei}</p>
                     )}
                     <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">HSN: 9963 | Qty: 1.00</p>
                   </div>
                   <p className="text-md font-black text-zinc-900">₹{item.price}.00</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-zinc-900 text-white rounded-[2.5rem] print:rounded-2xl p-8 print:p-4 space-y-4 print:space-y-1 shadow-2xl shadow-zinc-200">
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Subtotal (Net)</span>
              <span>₹{subtotal}</span>
            </div>
            {hasGst && (
              <>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span>₹{cgst}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span>₹{sgst}</span>
                </div>
              </>
            )}
            
            {extraChargeAmount > 0 && (
              <div className="flex justify-between text-[10px] font-black text-orange-400 uppercase tracking-widest pt-2">
                <span>{extraChargeName || "Extra Charge"}</span>
                <span>₹{extraChargeAmount.toFixed(2)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between text-[10px] font-black text-red-400 uppercase tracking-widest pt-2">
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Total Amount</span>
              <span className="text-4xl font-black tracking-tighter">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {fin && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] print:rounded-2xl p-8 print:p-4 border border-blue-100 dark:border-blue-900/20 space-y-3 print:space-y-1">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-600">EMI & Finance Breakdown</h5>
              <div className="h-[1px] bg-blue-100 dark:bg-blue-900/30 w-full" />
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Finance Provider</span>
                <span className="text-zinc-900 dark:text-white font-extrabold">{fco}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Down Payment (Paid)</span>
                <span className="text-zinc-900 dark:text-white font-extrabold">₹{Number(fdp).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Financed Loan Amount</span>
                <span className="text-emerald-600 font-black">₹{Number(flo).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Loan Application / File ID</span>
                <span className="text-zinc-900 dark:text-white font-extrabold">{fid}</span>
              </div>
            </div>
          )}

          {/* Scratch Card Section */}
          {canScratch && !isLoadingCoupon && (
            <div className="w-full bg-gradient-to-br from-zinc-900 to-black text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden min-h-[200px] flex flex-col justify-center items-center text-center print-hide border border-white/5">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              
              {!scratchClaimed ? (
                <div className="space-y-4 w-full h-full min-h-[160px] flex flex-col justify-center items-center relative z-10">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center animate-pulse">
                    <Gift className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-md font-black uppercase tracking-tight">Scratch & Win Reward! 🎁</h4>
                    <p className="text-[9px] text-zinc-400 font-bold max-w-[280px] leading-relaxed">
                      Scratch the card below to win a discount coupon valid on your next visit at {restName}!
                    </p>
                  </div>
                  {/* Canvas Overlay Scratch Card */}
                  <ScratchCard 
                    invoiceId={id} 
                    ownerMobile={ownerMobile} 
                    customerMobile={mobile} 
                    storeName={restName}
                    businessType={storeBusinessType}
                    onWon={(coupon) => {
                      setScratchClaimed(true);
                      setClaimedCoupon(coupon);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 relative z-10 animate-in zoom-in-95 duration-500 w-full">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Gift className="h-6 w-6 text-[#00c875]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-md font-black uppercase tracking-tight text-white">CONGRATULATIONS! 🎉</h4>
                    <p className="text-[9px] text-zinc-400 font-bold">
                      You won <span className="text-[#00c875] font-black text-sm">₹{claimedCoupon?.discount_amount} Off</span> on your next bill at {restName}!
                    </p>
                  </div>
                  
                  {/* Coupon Code Copy Box */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 max-w-[280px] mx-auto w-full">
                    <div className="text-left">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Coupon Code</span>
                      <span className="font-mono text-sm font-black tracking-wider text-orange-500">{claimedCoupon?.code}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (claimedCoupon?.code) {
                          navigator.clipboard.writeText(claimedCoupon.code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 h-9 px-3 rounded-xl flex items-center justify-center border-0 text-white"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    *Show this code at the billing counter to redeem.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Terms & Conditions - More Content */}
          <div className="space-y-6 print:space-y-2 pb-10 print:pb-0">
            <div className="bg-zinc-50 rounded-3xl print:rounded-xl p-6 print:p-3 border border-zinc-100">
              <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 print:mb-1 text-zinc-900">Terms & Conditions</h5>
              <ul className="text-[9px] font-bold text-zinc-400 space-y-2 print:space-y-0.5 uppercase leading-relaxed">
                <li>• This is a computer generated digital tax invoice.</li>
                <li>• No signature is required for digital receipts.</li>
                <li>• Please check items before leaving the counter.</li>
                <li>• Items once sold cannot be returned or exchanged.</li>
                <li>• Standard GST rates applied as per Govt. norms.</li>
              </ul>
            </div>
 
            {/* Social & Experience */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4 print:hidden print-hide">
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

          {/* Free Plan APK Download Promotion Banner */}
          {isFree && (
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl p-6 shadow-xl text-center space-y-4 print-hide">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">Create Bills Fast & Smart</p>
                  <p className="text-[10px] opacity-90 font-bold uppercase tracking-tight">Download InstaMunim POS App Free</p>
                </div>
              </div>
              <Button 
                onClick={() => window.open("https://play.google.com/store/apps/details?id=com.zainul.instamunimpos", "_blank")}
                className="w-full h-12 bg-zinc-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md border-0 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-orange-500" /> Get it on Play Store
              </Button>
            </div>
          )}

          {/* Footer Barcode Style */}
          <div className="text-center pt-10 print:pt-4 border-t-2 border-dashed border-zinc-100">
            <div className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center mb-6 print:mb-2 opacity-30 overflow-hidden">
               {/* Barcode Mock */}
               <div className="flex gap-1">
                  {[...Array(40)].map((_, i) => <div key={i} className={`w-[2px] h-8 bg-zinc-900 ${i % 3 === 0 ? 'w-[4px]' : ''}`} />)}
               </div>
            </div>
            <p className="text-xs font-black text-zinc-900 uppercase tracking-[0.3em]">Thank you for shopping!</p>
            <div className="mt-8 print:mt-2 pt-8 print:pt-2 border-t border-zinc-50 flex flex-col items-center gap-2">
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">Verified Digital Receipt</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                {isFree ? (
                  <a 
                    href="https://instamunim.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] font-black text-orange-600 hover:text-orange-500 uppercase tracking-widest italic underline print-hide"
                  >
                    Download App: instamunim.com
                  </a>
                ) : (
                  <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest italic">
                    Powered by InstaMunim
                  </p>
                )}
                {isFree && (
                  <span className="hidden print:inline text-[10px] font-black text-zinc-900 uppercase tracking-widest italic">
                    Download App: instamunim.com
                  </span>
                )}
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
