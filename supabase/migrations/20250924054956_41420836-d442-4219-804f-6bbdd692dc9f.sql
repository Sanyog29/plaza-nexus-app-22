-- Fix critical security vulnerabilities by securing publicly accessible tables

-- First, let's check and fix vendors table policies
DO $$
BEGIN
  -- Drop overly permissive vendor policies if they exist
  DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;
  DROP POLICY IF EXISTS "Public can view active vendors" ON public.vendors;
  
  -- Only create vendor policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendors' 
    AND policyname = 'Vendor staff can view their own vendor'
  ) THEN
    CREATE POLICY "Vendor staff can view their own vendor" ON public.vendors
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM vendor_staff vs 
        WHERE vs.vendor_id = vendors.id 
        AND vs.user_id = auth.uid() 
        AND vs.is_active = true
      ) OR is_admin(auth.uid()) OR is_staff(auth.uid())
    );
  END IF;
END $$;

-- Fix cafeteria_menu_items table security
DO $$
BEGIN
  -- Drop overly permissive menu policies
  DROP POLICY IF EXISTS "Anyone can view cafeteria menu items" ON public.cafeteria_menu_items;
  
  -- Create secure menu item policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cafeteria_menu_items' 
    AND policyname = 'Authenticated users can view available menu items'
  ) THEN
    CREATE POLICY "Authenticated users can view available menu items" ON public.cafeteria_menu_items
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_available = true);
  END IF;
END $$;

-- Fix building areas and floors security
DO $$
BEGIN
  -- Drop overly permissive building policies
  DROP POLICY IF EXISTS "Anyone can view building areas" ON public.building_areas;
  DROP POLICY IF EXISTS "Anyone can view building floors" ON public.building_floors;
  
  -- Create secure building area policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'building_areas' 
    AND policyname = 'Authenticated users can view active areas'
  ) THEN
    CREATE POLICY "Authenticated users can view active areas" ON public.building_areas
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
  END IF;
  
  -- Create secure building floor policy  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'building_floors' 
    AND policyname = 'Authenticated users can view active floors'
  ) THEN
    CREATE POLICY "Authenticated users can view active floors" ON public.building_floors  
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
  END IF;
END $$;