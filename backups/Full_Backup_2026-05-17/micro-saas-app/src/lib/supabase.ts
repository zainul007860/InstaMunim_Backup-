import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and Anon Key from supabase.com
const supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZHpzaHdzYmh0ZWJ3cnR4bHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjI1MjAsImV4cCI6MjA5MzYzODUyMH0.i30sQfzE8lUwkg2vy0CaEBp0gnv27YQN5KabpQkv6Oo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * DATABASE SCHEMA HELP (Run this in Supabase SQL Editor):
 * 
 * create table stores (
 *   id uuid primary key default uuid_generate_v4(),
 *   owner_mobile text unique not null,
 *   store_name text not null,
 *   monthly_rent numeric default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * create table sales (
 *   id uuid primary key default uuid_generate_v4(),
 *   store_id uuid references stores(id),
 *   customer_name text,
 *   mobile text,
 *   items text,
 *   total_price numeric not null,
 *   payment_type text,
 *   sale_date timestamp with time zone default now()
 * );
 */
