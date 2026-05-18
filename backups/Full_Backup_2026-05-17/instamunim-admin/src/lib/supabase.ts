import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co'
// Using Service Role Key for Admin privileges
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZHpzaHdzYmh0ZWJ3cnR4bHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA2MjUyMCwiZXhwIjoyMDkzNjM4NTIwfQ.p55ronA1jHbUvaNAUK7xvgkQ4yg80MZwaijrbcNB7PM'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
