-- LendMeADollar Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create campaign_stats table
CREATE TABLE IF NOT EXISTS campaign_stats (
    id SERIAL PRIMARY KEY,
    total_raised NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    supporter_count INTEGER NOT NULL DEFAULT 0,
    goal NUMERIC(12, 2) NOT NULL DEFAULT 1000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial campaign stats row if not exists
INSERT INTO campaign_stats (id, total_raised, supporter_count, goal)
VALUES (1, 0.00, 0, 1000000.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paypal_order_id TEXT NOT NULL,
    paypal_capture_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    payer_name TEXT,
    payer_country VARCHAR(10),
    display_name VARCHAR(100) NOT NULL DEFAULT 'Anonymous Legend',
    custom_message VARCHAR(280),
    supporter_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_capture_id ON payments (paypal_capture_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_supporter_number ON payments (supporter_number DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to campaign_stats
CREATE POLICY "Public read campaign_stats"
    ON campaign_stats
    FOR SELECT
    USING (true);

-- Allow public read access to payments (only safe columns if accessed directly)
CREATE POLICY "Public read payments list"
    ON payments
    FOR SELECT
    USING (true);

-- Restrict INSERT / UPDATE / DELETE to service_role (used by Next.js API backend)
CREATE POLICY "Service role full access payments"
    ON payments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access campaign_stats"
    ON campaign_stats
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
