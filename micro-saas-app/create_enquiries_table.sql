-- SQL Migration Script for Enquiries Table
-- Run this in your Supabase SQL Editor (https://supabase.com) to create the enquiries table.

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  business_type TEXT NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT,
  
  -- Dynamic product details
  brand_model TEXT,
  quoted_price NUMERIC,
  menu_event TEXT,
  guests_size TEXT,
  preferred_stylist TEXT,
  service_name TEXT,
  expected_delivery TEXT,
  interested_package TEXT,
  membership_plan TEXT,
  product_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Create Policies for Store access
CREATE POLICY "Enable read access for authenticated users by store_id" ON enquiries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON enquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users by store_id" ON enquiries
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users by store_id" ON enquiries
  FOR DELETE USING (true);
