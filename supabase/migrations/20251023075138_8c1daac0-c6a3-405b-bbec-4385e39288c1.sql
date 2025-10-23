-- Multi-Property Database Schema

-- 1. Add super_admin role to enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END$$;

-- 2. Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  timezone TEXT DEFAULT 'UTC',
  property_type TEXT,
  total_units INTEGER,
  total_floors INTEGER,
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_properties_code ON public.properties(code);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- 3. Property assignments
CREATE TABLE IF NOT EXISTS public.property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_property_assignments_user ON public.property_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_property ON public.property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_primary ON public.property_assignments(user_id, is_primary) WHERE is_primary = true;

-- 4. Add property_id columns
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.cafeteria_orders ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_property ON public.access_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_assets_property ON public.assets(property_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_property ON public.deliveries(property_id);
CREATE INDEX IF NOT EXISTS idx_cafeteria_orders_property ON public.cafeteria_orders(property_id);

-- 5. Security helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_property_access(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.property_assignments
    WHERE user_id = _user_id AND property_id = _property_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_properties(_user_id UUID)
RETURNS TABLE(property_id UUID, property_name TEXT, property_code TEXT, is_primary BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as property_id,
    p.name as property_name,
    p.code as property_code,
    false as is_primary
  FROM public.properties p
  WHERE public.has_role(_user_id, 'super_admin')

  UNION ALL

  SELECT 
    p.id as property_id,
    p.name as property_name,
    p.code as property_code,
    pa.is_primary
  FROM public.properties p
  INNER JOIN public.property_assignments pa ON p.id = pa.property_id
  WHERE pa.user_id = _user_id
    AND NOT public.has_role(_user_id, 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_property(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id 
  FROM public.property_assignments
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1;
$$;

-- 6. RLS policies (drop if exists, then create)
DROP POLICY IF EXISTS "super_admin_full_access_properties" ON public.properties;
CREATE POLICY "super_admin_full_access_properties"
ON public.properties
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "users_see_assigned_properties" ON public.properties;
CREATE POLICY "users_see_assigned_properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_assignments
    WHERE user_id = auth.uid() AND property_id = properties.id
  )
);

DROP POLICY IF EXISTS "super_admin_manage_assignments" ON public.property_assignments;
CREATE POLICY "super_admin_manage_assignments"
ON public.property_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "users_see_own_assignments" ON public.property_assignments;
CREATE POLICY "users_see_own_assignments"
ON public.property_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "property_scoped_maintenance_select" ON public.maintenance_requests;
CREATE POLICY "property_scoped_maintenance_select"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_maintenance_insert" ON public.maintenance_requests;
CREATE POLICY "property_scoped_maintenance_insert"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_maintenance_update" ON public.maintenance_requests;
CREATE POLICY "property_scoped_maintenance_update"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_access_logs" ON public.access_logs;
CREATE POLICY "property_scoped_access_logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_assets_select" ON public.assets;
CREATE POLICY "property_scoped_assets_select"
ON public.assets
FOR SELECT
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_deliveries_select" ON public.deliveries;
CREATE POLICY "property_scoped_deliveries_select"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "property_scoped_cafeteria_orders" ON public.cafeteria_orders;
CREATE POLICY "property_scoped_cafeteria_orders"
ON public.cafeteria_orders
FOR SELECT
TO authenticated
USING (
  property_id IS NULL OR public.user_has_property_access(auth.uid(), property_id)
);

-- 7. Default property
INSERT INTO public.properties (name, code, status, property_type)
VALUES ('Default Property', 'DEFAULT', 'active', 'mixed')
ON CONFLICT (code) DO NOTHING;

-- 8. Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;