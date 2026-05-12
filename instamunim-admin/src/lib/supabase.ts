import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZHpzaHdzYmh0ZWJ3cnR4bHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjI1MjAsImV4cCI6MjA5MzYzODUyMH0.i30sQfzE8lUwkg2vy0CaEBp0gnv27YQN5KabpQkv6Oo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
