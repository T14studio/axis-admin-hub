-- SQL Script to set up the specialized properties table
-- Execute this in the Supabase SQL Editor: https://supabase.com/dashboard/project/kubfzjfjvovbdlqchhgh/sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if you want a clean start (WARNING: deletes data)
-- DROP TABLE IF EXISTS public.properties CASCADE;

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    reference_code TEXT UNIQUE,
    condition TEXT DEFAULT 'usado', -- novo / usado
    purpose TEXT DEFAULT 'venda', -- venda / locacao
    property_type TEXT, -- apartamento, casa, terreno, etc.
    
    -- Localizacao
    state TEXT,
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    
    -- Areas
    built_area NUMERIC(10,2),
    total_area NUMERIC(10,2),
    
    -- Descricoes
    features TEXT, -- "Mais características"
    observations TEXT, -- "Observações"
    proximity JSONB DEFAULT '[]', -- List of nearby items (checkboxes)
    
    -- Valores
    price NUMERIC(12,2),
    condo_fee NUMERIC(10,2),
    iptu NUMERIC(10,2),
    
    -- Metadados / Status
    highlight JSONB DEFAULT '[]', -- capa / lista / lancamento
    expiration_date DATE,
    is_reserved BOOLEAN DEFAULT false,
    broker_name TEXT,
    
    status TEXT DEFAULT 'ativo', -- ativo / inativo / rascunho
    published BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the website)
CREATE POLICY "Public Read Access" 
ON public.properties FOR SELECT 
TO anon 
USING (published = true AND status = 'ativo');

-- Allow all access to authenticated users (admins)
CREATE POLICY "Admin All Access" 
ON public.properties FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
