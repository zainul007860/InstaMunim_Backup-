const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://xkdzshwsbhtebwrtxlua.supabase.co', 'sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD');

async function run() {
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, owner_mobile, store_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Error fetching stores:", error);
  } else {
    console.log("RECENT SIGNUPS (10):");
    stores.forEach(s => {
      console.log(`STORE: "${s.store_name}" | MOB: ${s.owner_mobile} | CREATED_AT: ${s.created_at}`);
    });
  }
}

run();
