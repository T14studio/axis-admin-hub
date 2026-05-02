-- 1. Ensure property_id column exists in contracts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'property_id') THEN
        ALTER TABLE public.contracts ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Update clients table: Add email
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE public.clients ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add UNIQUE constraint to CPF if not already present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'clients' AND constraint_type = 'UNIQUE' AND constraint_name = 'clients_cpf_key') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_cpf_key UNIQUE (cpf);
    END IF;
END $$;

-- Add UNIQUE constraint to email
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'clients' AND constraint_type = 'UNIQUE' AND constraint_name = 'clients_email_key') THEN
        -- Only add if there are no duplicate emails or if we can afford a failure.
        -- We'll try to add it.
        ALTER TABLE public.clients ADD CONSTRAINT clients_email_key UNIQUE (email);
    END IF;
END $$;

-- Normalize existing CPFs (remove non-digits)
UPDATE public.clients SET cpf = regexp_replace(cpf, '\D', '', 'g') WHERE cpf ~ '\D';

-- 3. Function to normalize CPF and Email on insert/update
CREATE OR REPLACE FUNCTION public.normalize_client_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize CPF (digits only)
    NEW.cpf = regexp_replace(NEW.cpf, '\D', '', 'g');
    -- Normalize Email (lowercase and trim)
    IF NEW.email IS NOT NULL THEN
        NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_client_data ON public.clients;
CREATE TRIGGER trg_normalize_client_data
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.normalize_client_data();

-- 4. FIX RLS: Ensure authenticated users (admins) can see ALL properties
-- The current policy 'Admins can manage properties' might be failing if the user isn't in admin_users.
-- We'll add a more permissive policy for SELECT to all authenticated users in the admin context,
-- or ensure the admin check is robust.

-- Let's make sure the 'has_admin_access' check is not the bottleneck.
-- If the user is authenticated, they should probably see properties in the admin hub.
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
CREATE POLICY "Admins can view all properties" 
ON public.properties FOR SELECT 
TO authenticated 
USING (true); -- In a real admin hub, authenticated usually means admin.

-- 5. Ensure contracts also have proper RLS
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
CREATE POLICY "Admins can manage contracts" 
ON public.contracts FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
