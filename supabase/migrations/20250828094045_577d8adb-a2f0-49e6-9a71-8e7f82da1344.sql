
-- 1) Ensure the backend recognizes MST/HK/Security as staff
-- Creates or replaces a helper function used by RLS policies
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      -- Treat these roles as staff (matches the app's L1/L2/L3 + admin)
      and p.role::text = any (
        array[
          'admin',
          'ops_supervisor',
          'field_staff',
          -- L1 operational roles
          'mst','hk','se','fe',
          -- L2/L3 management roles (if used in your org)
          'assistant_manager','assistant_floor_manager',
          'assistant_general_manager','assistant_vice_president',
          'vp','ceo','cxo'
        ]::text[]
      )
  );
$$;

-- 2) Allow staff to read attachments from the maintenance-attachments bucket
-- Note: Policies on storage.objects are per-bucket via bucket_id column.
-- If a similar policy already exists, this will add a specific one for staff.
create policy "Staff can read maintenance attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'maintenance-attachments'
  and public.is_staff(auth.uid())
);
