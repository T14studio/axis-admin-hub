-- ============================================================
-- POLÍTICAS DE STORAGE DEFINITIVAS: Bucket "property-images"
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Allow authenticated upload to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow read property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update in property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from property-images" ON storage.objects;

-- 2. POLÍTICA: Upload (INSERT) — Público + Autenticado
CREATE POLICY "Allow public upload to property-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'property-images');

-- 3. POLÍTICA: Leitura (SELECT) — Pública
CREATE POLICY "Allow public read from property-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- 4. POLÍTICA: Atualização (UPDATE) — Pública
CREATE POLICY "Allow public update in property-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'property-images');

-- 5. POLÍTICA: Deleção (DELETE) — Pública
CREATE POLICY "Allow public delete from property-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'property-images');

-- 6. Garantir bucket público
UPDATE storage.buckets
SET public = true
WHERE id = 'property-images';
