const { createClient } = require('@supabase/supabase-js');

// Project credentials from your environment
const supabaseUrl = 'https://ovskvfmvzkvzkvzkvzkv.supabase.co'; // Replace with actual URL if known or fetch from env
const supabaseKey = 'your-anon-key'; // Replace with actual key

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function forceActivate() {
  console.log('Fetching store for: 7838229178');
  const { data: store, error: fetchError } = await supabase
    .from('stores')
    .select('id, store_name, subscription_expiry')
    .eq('owner_mobile', '7838229178')
    .single();

  if (fetchError) {
    console.error('Error fetching store:', fetchError);
    return;
  }

  const newExpiry = new Date();
  newExpiry.setFullYear(newExpiry.getFullYear() + 1); // 1 Year activation to be safe!
  
  console.log(`Activating ${store.store_name} until ${newExpiry.toISOString()}`);
  
  const { error: updateError } = await supabase
    .from('stores')
    .update({ subscription_expiry: newExpiry.toISOString() })
    .eq('id', store.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
  } else {
    console.log('SUCCESS: Account Activated for 1 Year!');
  }
}

forceActivate();
