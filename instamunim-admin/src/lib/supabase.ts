import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co'
}
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
if (!supabaseAnonKey.startsWith('sb_publishable_')) {
  supabaseAnonKey = 'sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
