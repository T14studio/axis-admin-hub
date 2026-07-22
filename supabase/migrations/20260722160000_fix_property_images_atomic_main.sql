-- Migration: Fix property_images is_main business logic and enforce single main image per property

-- 1. CLEANUP / NORMALIZATION: Ensure existing property_images data has EXACTLY 1 main image per property (if images exist)
WITH ranked_images AS (
  SELECT 
    id, 
    property_id, 
    is_main, 
    ROW_NUMBER() OVER (
      PARTITION BY property_id 
      ORDER BY is_main DESC, display_order ASC, created_at ASC
    ) as rn
  FROM public.property_images
)
UPDATE public.property_images pi
SET is_main = CASE WHEN r.rn = 1 THEN true ELSE false END
FROM ranked_images r
WHERE pi.id = r.id;

-- 2. PARTIAL UNIQUE INDEX: Strictly enforce at database level that at most 1 image per property can have is_main = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_single_main
ON public.property_images (property_id)
WHERE (is_main = true);

-- 3. ATOMIC RPC FUNCTION: Set Main Image in a single atomic SQL transaction
CREATE OR REPLACE FUNCTION public.set_main_image_atomic(
  p_property_id UUID,
  p_image_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unset is_main for all images of this property
  UPDATE public.property_images
  SET is_main = false
  WHERE property_id = p_property_id AND is_main = true;

  -- Set target image as main
  UPDATE public.property_images
  SET is_main = true
  WHERE id = p_image_id AND property_id = p_property_id;
END;
$$;

-- 4. ATOMIC RPC FUNCTION: Insert Image in a single atomic SQL transaction
CREATE OR REPLACE FUNCTION public.insert_property_image_atomic(
  p_property_id UUID,
  p_image_url TEXT,
  p_display_order INT DEFAULT 0,
  p_is_main BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  image_url TEXT,
  display_order INT,
  is_main BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
  v_should_be_main BOOLEAN;
  v_new_id UUID;
BEGIN
  -- Check existing image count for this property
  SELECT COUNT(*) INTO v_count
  FROM public.property_images
  WHERE property_images.property_id = p_property_id;

  -- If property has 0 images, force first image to be main
  IF v_count = 0 THEN
    v_should_be_main := true;
  ELSE
    v_should_be_main := p_is_main;
  END IF;

  -- If new image should be main, unset existing main images
  IF v_should_be_main THEN
    UPDATE public.property_images
    SET is_main = false
    WHERE property_images.property_id = p_property_id AND property_images.is_main = true;
  END IF;

  -- Insert new image
  INSERT INTO public.property_images (
    property_id,
    image_url,
    display_order,
    is_main
  )
  VALUES (
    p_property_id,
    p_image_url,
    p_display_order,
    v_should_be_main
  )
  RETURNING property_images.id INTO v_new_id;

  RETURN QUERY
  SELECT 
    pi.id,
    pi.property_id,
    pi.image_url,
    pi.display_order,
    pi.is_main,
    pi.created_at
  FROM public.property_images pi
  WHERE pi.id = v_new_id;
END;
$$;

-- 5. TRIGGER FOR DELETION AUTO-RECOVERY: If the deleted image was main, promote the next remaining image to main
CREATE OR REPLACE FUNCTION public.auto_promote_main_image_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_id UUID;
BEGIN
  IF OLD.is_main = true THEN
    -- Find remaining image with lowest display_order / oldest created_at
    SELECT id INTO v_next_id
    FROM public.property_images
    WHERE property_id = OLD.property_id
    ORDER BY display_order ASC, created_at ASC
    LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE public.property_images
      SET is_main = true
      WHERE id = v_next_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_main_image ON public.property_images;
CREATE TRIGGER trg_auto_promote_main_image
AFTER DELETE ON public.property_images
FOR EACH ROW
EXECUTE FUNCTION public.auto_promote_main_image_on_delete();
