
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin_master', 'admin_operacional', 'comercial', 'administrativo', 'financeiro');

-- Create lead status enum
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_atendimento', 'qualificado', 'visita_agendada', 'proposta', 'convertido', 'perdido');

-- Create property status enum
CREATE TYPE public.property_status AS ENUM ('ativo', 'inativo', 'rascunho');

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('ativo', 'pendente', 'encerrado', 'vencendo', 'vencido');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===================== ADMIN USERS =====================
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'admin_operacional',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to check admin access (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND active = true
  )
$$;

-- Security definer function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_users
  WHERE user_id = _user_id AND active = true
  LIMIT 1
$$;

-- Admin users policies
CREATE POLICY "Admins can view all admin users" ON public.admin_users FOR SELECT TO authenticated USING (public.has_admin_access(auth.uid()));
CREATE POLICY "Admin master can insert admin users" ON public.admin_users FOR INSERT TO authenticated WITH CHECK (public.has_admin_access(auth.uid()));
CREATE POLICY "Admin master can update admin users" ON public.admin_users FOR UPDATE TO authenticated USING (public.has_admin_access(auth.uid()));
CREATE POLICY "Admin master can delete admin users" ON public.admin_users FOR DELETE TO authenticated USING (public.has_admin_access(auth.uid()));

-- ===================== LEADS =====================
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  origin TEXT,
  interest TEXT,
  interest_type TEXT,
  related_property_id UUID,
  initial_message TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  responsible TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE TO authenticated USING (public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_admin_access(auth.uid()));

-- ===================== PROPERTIES =====================
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  reference_code TEXT UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'venda',
  property_type TEXT NOT NULL DEFAULT 'apartamento',
  description TEXT,
  price NUMERIC(12,2),
  condo_fee NUMERIC(10,2),
  iptu NUMERIC(10,2),
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  bedrooms INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_spots INTEGER DEFAULT 0,
  built_area NUMERIC(10,2),
  land_area NUMERIC(10,2),
  additional_features TEXT,
  status public.property_status NOT NULL DEFAULT 'rascunho',
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  responsible TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin access policies
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL TO authenticated USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));
-- Public read for published properties (site consumption)
CREATE POLICY "Public can view published properties" ON public.properties FOR SELECT TO anon USING (published = true AND status = 'ativo');

-- Add FK from leads to properties
ALTER TABLE public.leads ADD CONSTRAINT fk_leads_property FOREIGN KEY (related_property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

-- ===================== PROPERTY IMAGES =====================
CREATE TABLE public.property_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage property images" ON public.property_images FOR ALL TO authenticated USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));
CREATE POLICY "Public can view published property images" ON public.property_images FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND published = true AND status = 'ativo')
);

-- ===================== CLIENTS =====================
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  client_type TEXT DEFAULT 'pessoa_fisica',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL TO authenticated USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));

-- ===================== CONTRACTS =====================
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_cpf TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status public.contract_status NOT NULL DEFAULT 'pendente',
  value NUMERIC(12,2),
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_contracts_cpf ON public.contracts(client_cpf);
CREATE INDEX idx_contracts_client ON public.contracts(client_id);

CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL TO authenticated USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));

-- ===================== CONTRACT FILES =====================
CREATE TABLE public.contract_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract files" ON public.contract_files FOR ALL TO authenticated USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));

-- ===================== AUDIT LOGS =====================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_admin_access(auth.uid()));

-- ===================== STORAGE BUCKETS =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-files', 'contract-files', false);

-- Storage policies for property images (public read, admin write)
CREATE POLICY "Public can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Admins can upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can update property images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images' AND public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can delete property images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND public.has_admin_access(auth.uid()));

-- Storage policies for contract files (admin only)
CREATE POLICY "Admins can view contract files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contract-files' AND public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can upload contract files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contract-files' AND public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can update contract files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contract-files' AND public.has_admin_access(auth.uid()));
CREATE POLICY "Admins can delete contract files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contract-files' AND public.has_admin_access(auth.uid()));
