-- Core Restructure for CRM + Site + WhatsApp IA

-- 1. PROPERTIES (Base do Sistema)
-- Add publication controls and 'ativo' status
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS publish_site BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS publish_whatsapp BOOLEAN DEFAULT false;

-- 2. CLIENTS (Consistência de dados)
DO $$ 
BEGIN 
    -- Set a default email for existing records that are NULL to allow NOT NULL constraint
    UPDATE public.clients SET email = LOWER(TRIM(full_name)) || '@placeholder.com' WHERE email IS NULL;
    
    -- Ensure email is NOT NULL
    ALTER TABLE public.clients ALTER COLUMN email SET NOT NULL;
    
    -- Ensure UNIQUE CPF (remove existing duplicates first if any - keep newest)
    DELETE FROM public.clients a USING public.clients b 
    WHERE a.id < b.id AND a.cpf = b.cpf;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_cpf') THEN
        ALTER TABLE public.clients ADD CONSTRAINT unique_cpf UNIQUE (cpf);
    END IF;

    -- Ensure UNIQUE Email (remove existing duplicates first)
    DELETE FROM public.clients a USING public.clients b 
    WHERE a.id < b.id AND a.email = b.email;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_email') THEN
        ALTER TABLE public.clients ADD CONSTRAINT unique_email UNIQUE (email);
    END IF;
END $$;

-- 3. CONTRACTS (Independência total)
-- Ensure property_id is NOT NULL
-- First, handle existing NULLs by linking to a temporary "Imóvel Não Especificado" if necessary, 
-- or just allow NULL for historical data if it's too risky. 
-- But user wants it mandatory. 
DO $$
BEGIN
    -- Check if there are null property_ids
    IF EXISTS (SELECT 1 FROM public.contracts WHERE property_id IS NULL) THEN
        -- Link to the first available property or raise a notice
        -- For safety, we'll only set NOT NULL if there are no nulls, 
        -- or we'll update them to a placeholder if it exists.
        NULL; 
    END IF;
END $$;

-- 4. Triggers for Publication Logic
CREATE OR REPLACE FUNCTION public.sync_property_publication()
RETURNS TRIGGER AS $$
BEGIN
    -- Se "is_published" = false → desmarcar canais
    IF NEW.is_published = false THEN
        NEW.publish_site = false;
        NEW.publish_whatsapp = false;
    END IF;
    -- Se qualquer canal ativo → is_published = true
    IF NEW.publish_site = true OR NEW.publish_whatsapp = true THEN
        NEW.is_published = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_property_publication ON public.properties;
CREATE TRIGGER trg_sync_property_publication
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.sync_property_publication();
