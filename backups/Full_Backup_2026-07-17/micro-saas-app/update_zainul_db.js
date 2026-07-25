const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://xkdzshwsbhtebwrtxlua.supabase.co', 'sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD');

async function run() {
  const mobile = '9999999999';
  const { data: store, error: fetchErr } = await supabase
    .from('stores')
    .select('id, store_logo')
    .eq('owner_mobile', mobile)
    .single();
  
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  const rawLogo = store.store_logo || "";
  if (rawLogo.startsWith('JSON_CFG:')) {
    try {
      const settings = JSON.parse(rawLogo.substring(9));
      settings.businessType = "Mobile/Electronics";
      const newLogoVal = "JSON_CFG:" + JSON.stringify(settings);
      
      const { error: updateErr } = await supabase
        .from('stores')
        .update({ store_logo: newLogoVal })
        .eq('id', store.id);
      
      if (updateErr) {
        console.error("Update error:", updateErr);
      } else {
        console.log("SUCCESS: Updated Zainul Mobile (9999999999) category in database to Mobile/Electronics!");
      }
    } catch (e) {
      console.error("JSON parsing error:", e);
    }
  } else {
    // If store_logo is null or normal, set default with Mobile/Electronics
    const defaultSettings = {
      upiId: "",
      upiName: "",
      logo: "",
      address: "",
      phone: "",
      website: "",
      gstin: "",
      gstEnabled: false,
      gstRate: 0,
      swiggyComm: 0,
      swiggyCommType: "Percentage",
      zomatoComm: 0,
      zomatoCommType: "Percentage",
      businessType: "Mobile/Electronics",
      thermalPrinter: false,
      voiceEnabled: false,
      voiceLang: "en",
      lang: "en"
    };
    const newLogoVal = "JSON_CFG:" + JSON.stringify(defaultSettings);
    const { error: updateErr } = await supabase
      .from('stores')
      .update({ store_logo: newLogoVal })
      .eq('id', store.id);
    
    if (updateErr) {
      console.error("Update error:", updateErr);
    } else {
      console.log("SUCCESS: Initialized Zainul Mobile (9999999999) category in database to Mobile/Electronics!");
    }
  }
}

run();
