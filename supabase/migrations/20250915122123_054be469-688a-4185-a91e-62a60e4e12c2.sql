-- Add RLS policies for cafeteria_menu_categories to allow vendor staff to manage their categories

-- Allow vendor staff to create categories for their own vendor
CREATE POLICY "Vendor staff can create categories for their vendor" 
ON public.cafeteria_menu_categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_staff vs 
    WHERE vs.vendor_id = cafeteria_menu_categories.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  )
);

-- Allow vendor staff to update categories for their own vendor
CREATE POLICY "Vendor staff can update their vendor categories" 
ON public.cafeteria_menu_categories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_staff vs 
    WHERE vs.vendor_id = cafeteria_menu_categories.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_staff vs 
    WHERE vs.vendor_id = cafeteria_menu_categories.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  )
);

-- Allow vendor staff to delete categories for their own vendor
CREATE POLICY "Vendor staff can delete their vendor categories" 
ON public.cafeteria_menu_categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_staff vs 
    WHERE vs.vendor_id = cafeteria_menu_categories.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  )
);