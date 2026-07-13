-- ==========================================
-- FIX: Remoção de Políticas RLS Permissivas
-- ==========================================
-- Este script tem a finalidade EXCLUSIVA de apagar as políticas de segurança (RLS)
-- que permitiam acesso livre 'USING (true)' ou criavam risco de DoS 'EXISTS' na deleção.
-- Ao apagar estas políticas, o banco de dados passará a obedecer as regras originais mais
-- rigorosas definidas no script de 11 de Abril (has_admin_access).

-- 1. Remoção do RLS Inseguro da tabela 'admin_users'
DROP POLICY IF EXISTS "Allow authenticated insert on admin_users" ON "public"."admin_users";
DROP POLICY IF EXISTS "Allow authenticated update on admin_users" ON "public"."admin_users";
DROP POLICY IF EXISTS "Allow admin delete on admin_users" ON "public"."admin_users";
-- (Mantemos "Allow authenticated select on admin_users" caso seja necessária para listagem genérica, 
-- porém recomendamos o uso da política "Admins can view all admin users" via has_admin_access, então deletaremos também)
DROP POLICY IF EXISTS "Allow authenticated select on admin_users" ON "public"."admin_users";

-- 2. Remoção do RLS Inseguro da tabela 'clients'
DROP POLICY IF EXISTS "Allow authenticated insert on clients" ON "public"."clients";
DROP POLICY IF EXISTS "Allow authenticated update on clients" ON "public"."clients";
DROP POLICY IF EXISTS "Allow admin delete on clients" ON "public"."clients";
DROP POLICY IF EXISTS "Allow authenticated select on clients" ON "public"."clients";

-- 3. Remoção do RLS Inseguro da tabela 'contracts'
DROP POLICY IF EXISTS "Allow authenticated insert on contracts" ON "public"."contracts";
DROP POLICY IF EXISTS "Allow authenticated update on contracts" ON "public"."contracts";
DROP POLICY IF EXISTS "Allow admin delete on contracts" ON "public"."contracts";
DROP POLICY IF EXISTS "Allow authenticated select on contracts" ON "public"."contracts";

-- 4. Remoção do RLS Inseguro da tabela 'contract_files'
DROP POLICY IF EXISTS "Allow authenticated insert on contract_files" ON "public"."contract_files";
DROP POLICY IF EXISTS "Allow authenticated update on contract_files" ON "public"."contract_files";
DROP POLICY IF EXISTS "Allow admin delete on contract_files" ON "public"."contract_files";
DROP POLICY IF EXISTS "Allow authenticated select on contract_files" ON "public"."contract_files";

-- 5. Remoção do RLS Inseguro da tabela 'leads'
DROP POLICY IF EXISTS "Allow authenticated insert on leads" ON "public"."leads";
DROP POLICY IF EXISTS "Allow authenticated update on leads" ON "public"."leads";
DROP POLICY IF EXISTS "Allow admin delete on leads" ON "public"."leads";
DROP POLICY IF EXISTS "Allow authenticated select on leads" ON "public"."leads";

-- RESULTADO ESPERADO:
-- Sem essas políticas de bypass ('true'), as operações de CRUD passam a exigir 
-- que public.has_admin_access(auth.uid()) = true para cada respectiva tabela.
-- Isso restaura a camada zero-trust e resolve a escalada horizontal de privilégios.
