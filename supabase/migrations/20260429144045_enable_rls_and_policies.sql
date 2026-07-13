-- Habilitar Row Level Security (RLS) para as tabelas principais
ALTER TABLE IF EXISTS "public"."admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."contract_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."leads" ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Políticas para a tabela "clients"
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select on clients" ON "public"."clients";
CREATE POLICY "Allow authenticated select on clients" 
  ON "public"."clients" FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on clients" ON "public"."clients";
CREATE POLICY "Allow authenticated insert on clients" 
  ON "public"."clients" FOR INSERT 
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on clients" ON "public"."clients";
CREATE POLICY "Allow authenticated update on clients" 
  ON "public"."clients" FOR UPDATE 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin delete on clients" ON "public"."clients";
CREATE POLICY "Allow admin delete on clients" 
  ON "public"."clients" FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true
  ));

-- --------------------------------------------------------
-- Políticas para a tabela "contract_files"
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select on contract_files" ON "public"."contract_files";
CREATE POLICY "Allow authenticated select on contract_files" 
  ON "public"."contract_files" FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on contract_files" ON "public"."contract_files";
CREATE POLICY "Allow authenticated insert on contract_files" 
  ON "public"."contract_files" FOR INSERT 
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on contract_files" ON "public"."contract_files";
CREATE POLICY "Allow authenticated update on contract_files" 
  ON "public"."contract_files" FOR UPDATE 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin delete on contract_files" ON "public"."contract_files";
CREATE POLICY "Allow admin delete on contract_files" 
  ON "public"."contract_files" FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true
  ));

-- --------------------------------------------------------
-- Políticas para a tabela "contracts"
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select on contracts" ON "public"."contracts";
CREATE POLICY "Allow authenticated select on contracts" 
  ON "public"."contracts" FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on contracts" ON "public"."contracts";
CREATE POLICY "Allow authenticated insert on contracts" 
  ON "public"."contracts" FOR INSERT 
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on contracts" ON "public"."contracts";
CREATE POLICY "Allow authenticated update on contracts" 
  ON "public"."contracts" FOR UPDATE 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin delete on contracts" ON "public"."contracts";
CREATE POLICY "Allow admin delete on contracts" 
  ON "public"."contracts" FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true
  ));

-- --------------------------------------------------------
-- Políticas para a tabela "leads"
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select on leads" ON "public"."leads";
CREATE POLICY "Allow authenticated select on leads" 
  ON "public"."leads" FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on leads" ON "public"."leads";
CREATE POLICY "Allow authenticated insert on leads" 
  ON "public"."leads" FOR INSERT 
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on leads" ON "public"."leads";
CREATE POLICY "Allow authenticated update on leads" 
  ON "public"."leads" FOR UPDATE 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin delete on leads" ON "public"."leads";
CREATE POLICY "Allow admin delete on leads" 
  ON "public"."leads" FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true
  ));

-- --------------------------------------------------------
-- Políticas para a tabela "admin_users"
-- (Suplementar ao que já pode existir para garantir acesso authenticated e restrição no DELETE)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select on admin_users" ON "public"."admin_users";
CREATE POLICY "Allow authenticated select on admin_users" 
  ON "public"."admin_users" FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on admin_users" ON "public"."admin_users";
CREATE POLICY "Allow authenticated insert on admin_users" 
  ON "public"."admin_users" FOR INSERT 
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on admin_users" ON "public"."admin_users";
CREATE POLICY "Allow authenticated update on admin_users" 
  ON "public"."admin_users" FOR UPDATE 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin delete on admin_users" ON "public"."admin_users";
CREATE POLICY "Allow admin delete on admin_users" 
  ON "public"."admin_users" FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true AND role = 'admin_master'
  ));
