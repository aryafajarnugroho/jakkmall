-- Supabase Schema Migration: JakMall to Shopee Automation
-- Jalankan query ini pada Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Buat tabel products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_name TEXT,
    category_id BIGINT DEFAULT 100012,
    base_price NUMERIC NOT NULL,
    markup_percent NUMERIC DEFAULT 15,
    fixed_margin NUMERIC DEFAULT 2500,
    final_price NUMERIC NOT NULL,
    stock INTEGER DEFAULT 100,
    weight_grams INTEGER DEFAULT 250,
    condition TEXT DEFAULT 'Baru',
    main_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    sku TEXT NOT NULL,
    variations JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'EXTRACTED',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Policy akses terbuka untuk Anon / Authenticated (PoC / Demo)
CREATE POLICY "Allow public read access" 
ON public.products FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.products FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON public.products FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access" 
ON public.products FOR DELETE 
USING (true);
