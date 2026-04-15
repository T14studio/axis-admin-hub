-- 1. Habilitar a extensão UUID (caso ainda não esteja)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Garantir que a tabela admin_users existe (deve existir pelo types.ts, mas garantimos)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role public.app_role DEFAULT 'admin_operacional',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id),
  UNIQUE (email)
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para a tabela admin_users

-- Permitir que usuários leiam seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own admin profile" ON public.admin_users;
CREATE POLICY "Users can view their own admin profile" 
ON public.admin_users FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que qualquer usuário autenticado CRIE seu próprio perfil (necessário para o fallback do React)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.admin_users;
CREATE POLICY "Users can insert their own profile" 
ON public.admin_users FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir que administradores Master leiam e atualizem todos os perfis
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.admin_users;
CREATE POLICY "Master admins can view all profiles"
ON public.admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND role = 'admin_master' AND active = true
  )
);

DROP POLICY IF EXISTS "Master admins can update profiles" ON public.admin_users;
CREATE POLICY "Master admins can update profiles"
ON public.admin_users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND role = 'admin_master' AND active = true
  )
);

-- 5. Trigger Opcional: Criar perfil automaticamente no momento da criação do usuário (via dashboard do Supabase)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.admin_users (user_id, email, name, role, active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    'admin_operacional', -- Papel padrão inicial
    true -- Perfil nasce ativo
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger antigo caso exista e recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Opcional: Atualizar os usuários existentes que não têm perfil na tabela (Backfill)
INSERT INTO public.admin_users (user_id, email, name, role, active)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)), 
  'admin_master',  -- Se está rodando esse backfill inicialmente, considere os antigos como master
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.admin_users)
ON CONFLICT (user_id) DO NOTHING;
