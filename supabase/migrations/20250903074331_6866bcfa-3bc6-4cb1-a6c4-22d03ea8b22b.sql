
-- 1) Make update_user_role_safe accept titles or enum values
create or replace function public.update_user_role_safe(
  target_user_id uuid,
  new_role_text text
) returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  resolved_role app_role;
  role_title text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only administrators can update roles';
  end if;

  -- Try resolve via invitation_roles (title, slug, or enum-as-text)
  select ir.app_role, ir.title
    into resolved_role, role_title
  from public.invitation_roles ir
  where (ir.title = new_role_text or ir.slug = new_role_text or ir.app_role::text = lower(new_role_text))
    and ir.is_active = true
  limit 1;

  -- Fallback: cast the lowercased text to enum
  if resolved_role is null then
    begin
      resolved_role := lower(new_role_text)::app_role;
      role_title := new_role_text;
    exception when others then
      raise exception 'Invalid role: %', new_role_text;
    end;
  end if;

  update public.profiles
     set role = resolved_role,
         assigned_role_title = coalesce(role_title, new_role_text),
         updated_at = now()
   where id = target_user_id;

  return found;
end;
$$;

-- 2) New RPC to atomically update role + department + specialization with validation
create or replace function public.update_user_role_and_department(
  target_user_id uuid,
  role_text text,
  department text,
  specialization text default null
) returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  resolved_role app_role;
  role_title text;
  requires_spec boolean := false;
  requires_dept boolean := false;
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'error', 'Only administrators can update users');
  end if;

  -- Resolve role from invitation_roles first
  select ir.app_role, ir.title, ir.requires_specialization
    into resolved_role, role_title, requires_spec
  from public.invitation_roles ir
  where (ir.title = role_text or ir.slug = role_text or ir.app_role::text = lower(role_text))
    and ir.is_active = true
  limit 1;

  if resolved_role is null then
    begin
      resolved_role := lower(role_text)::app_role;
      role_title := role_text;
    exception when others then
      return jsonb_build_object('success', false, 'error', format('Invalid role: %s', role_text));
    end;
  end if;

  -- Department requirement (L1 and most roles need department; tenant_manager typically does not)
  select public.role_requires_department(resolved_role) into requires_dept;

  if requires_dept and (department is null or department = '') then
    return jsonb_build_object('success', false, 'error', 'Department is required for this role');
  end if;

  if requires_spec and (specialization is null or specialization = '') then
    return jsonb_build_object('success', false, 'error', 'Specialization is required for this role');
  end if;

  -- Optional: validate specialization belongs to department if both provided
  if department is not null and specialization is not null then
    if not exists (
      select 1 from public.departments d
      where d.name = department
        and (d.specializations is null or specialization = any(d.specializations))
    ) then
      return jsonb_build_object('success', false, 'error', 'Invalid specialization for selected department');
    end if;
  end if;

  update public.profiles
     set role = resolved_role,
         assigned_role_title = coalesce(role_title, role_text),
         department = case when requires_dept then department else null end,
         specialization = case when requires_spec then specialization else null end,
         updated_at = now()
   where id = target_user_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;

  perform public.log_audit_event(
    'update_user',
    'profile',
    target_user_id,
    null,
    jsonb_build_object(
      'role', resolved_role,
      'assigned_role_title', coalesce(role_title, role_text),
      'department', department,
      'specialization', specialization
    )
  );

  return jsonb_build_object('success', true);
end;
$$;
