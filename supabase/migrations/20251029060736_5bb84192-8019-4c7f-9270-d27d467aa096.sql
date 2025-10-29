-- =====================================================
-- Migration: Enable RLS on bill_auditor_roles
-- Description: Secure the billing role definitions table
-- Impact: ZERO - Table is not currently used in application
-- =====================================================

-- Step 1: Enable Row Level Security
ALTER TABLE public.bill_auditor_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow all authenticated users to view role definitions
-- (These are reference data like a lookup table)
CREATE POLICY "authenticated_users_view_bill_auditor_roles"
  ON public.bill_auditor_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Only admins can manage role definitions
CREATE POLICY "admins_manage_bill_auditor_roles"
  ON public.bill_auditor_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
  );