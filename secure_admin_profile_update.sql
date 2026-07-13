-- =================================================================
-- FIX: Proteção de Escalada de Privilégios no Update de Perfil
-- =================================================================
-- Este script permite que usuários administradores alterem os seus
-- próprios nomes no perfil, garantindo via Trigger que ninguém,
-- exceto um Master Admin, possa modificar a coluna 'role' ou 'active'.

-- 1. A Política RLS que autoriza o UPDATE na própria linha
DROP POLICY IF EXISTS "Users can update their own admin profile" ON public.admin_users;
CREATE POLICY "Users can update their own admin profile"
ON public.admin_users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. A Proteção em Nível de Coluna via Trigger Function
-- Reverte as colunas 'role' e 'active' para o estado antigo se 
-- quem estiver atualizando não for um 'admin_master'.
CREATE OR REPLACE FUNCTION public.protect_admin_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se o usuário executando a query NÃO for um admin master, bloqueamos a edição de privilégios
  IF public.get_admin_role(auth.uid()) IS DISTINCT FROM 'admin_master' THEN
    
    -- Restaura silenciosamente os valores de role e active para o que já estava no banco
    NEW.role = OLD.role;
    NEW.active = OLD.active;
    
  END IF;

  RETURN NEW;
END;
$$;


-- 3. O Trigger atrelado à tabela
DROP TRIGGER IF EXISTS on_admin_user_update_privileges ON public.admin_users;
CREATE TRIGGER on_admin_user_update_privileges
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_admin_privileges();
