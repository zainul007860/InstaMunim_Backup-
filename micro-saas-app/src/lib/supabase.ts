import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and Anon Key from supabase.com
const supabaseUrl = 'https://xkdzshwsbhtebwrtxlua.supabase.co'
const supabaseAnonKey = 'sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD'

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
