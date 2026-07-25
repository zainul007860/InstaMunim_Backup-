const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co';
const supabaseAnonKey = 'sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('stores').select('*').limit(1);
  if (error) {
    console.error("Error fetching store:", error);
  } else if (data && data.length > 0) {
    console.log("Stores table columns:", Object.keys(data[0]));
    console.log("Sample store row data:", data[0]);
  } else {
    console.log("No store rows found in stores table.");
  }
}

run();
