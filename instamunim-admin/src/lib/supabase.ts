import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkdzshwsbhtebwrtxlua.supabase.co'
// Using Service Role Key for Admin privileges (Must be in .env or .env.local)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
