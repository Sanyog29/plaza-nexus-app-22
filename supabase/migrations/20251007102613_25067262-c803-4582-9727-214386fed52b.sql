-- 1) Create missing enums used by auth/profile flows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'admin','ops_supervisor','field_staff','mst','fe','hk','se','staff',
      'assistant_manager','assistant_floor_manager','assistant_general_manager','assistant_vice_president',
      'vp','cxo','ceo','tenant_manager','tenant','vendor'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='approval_status') THEN
    CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');
  END IF;
END $$;

-- 2) Ensure profiles RLS is safe and present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

    -- Create policies only if they do not already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can select own profile'
    ) THEN
      CREATE POLICY "Users can select own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id OR public.is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile'
    ) THEN
      CREATE POLICY "Users can insert own profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile'
    ) THEN
      CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can manage profiles'
    ) THEN
      CREATE POLICY "Admins can manage profiles"
      ON public.profiles
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
    END IF;
  END IF;
END $$;

-- 3) Backfill missing profiles for existing users (default role=tenant, status=pending)
--    This prevents users from being stuck at approval check due to missing profile rows
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    INSERT INTO public.profiles (id, role, approval_status)
    SELECT u.id, 'tenant'::public.app_role, 'pending'::public.approval_status
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL;
  END IF;
END $$;

-- 4) Harden the cascade delete RPC that admin-delete-user edge function depends on
--    to avoid errors like: column "created_by" does not exist
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use guarded blocks so missing tables/columns don’t break the whole operation
  BEGIN DELETE FROM public.vendor_staff WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.dietary_preferences WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.delivery_notifications WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET received_by = NULL WHERE received_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET logged_by = NULL WHERE logged_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET pickup_by = NULL WHERE pickup_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.communication_messages WHERE sender_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.communication_threads SET participants = participants - target_user_id::text WHERE participants ? (target_user_id::text); EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.communication_threads WHERE created_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.cafeteria_orders WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;

  -- Finally remove profile; if FK cascade exists, it will handle dependents too
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;