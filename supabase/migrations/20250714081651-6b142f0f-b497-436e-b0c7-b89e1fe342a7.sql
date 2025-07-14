-- Just insert the profile with a system user as the changed_by
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
SELECT 
  '4fad7c5f-517a-46e4-8305-20df1fbd5d03',
  'Akshay',
  'Londhe',
  'tenant_manager'::app_role,
  'pending'::approval_status,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '4fad7c5f-517a-46e4-8305-20df1fbd5d03');

-- Create a simple repair function that logs as system
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  repaired_count INTEGER := 0;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    'tenant_manager'::app_role as role,
    'pending'::approval_status as approval_status,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
    AND au.deleted_at IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS repaired_count = ROW_COUNT;
  RETURN repaired_count;
END;
$$;