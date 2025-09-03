
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
  -- Disambiguate function params from table columns
  v_department text := department;
  v_specialization text := specialization;
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

  if requires_dept and (v_department is null or v_department = '') then
    return jsonb_build_object('success', false, 'error', 'Department is required for this role');
  end if;

  if requires_spec and (v_specialization is null or v_specialization = '') then
    return jsonb_build_object('success', false, 'error', 'Specialization is required for this role');
  end if;

  -- Optional: validate specialization belongs to department if both provided
  if v_department is not null and v_specialization is not null then
    if not exists (
      select 1 from public.departments d
      where d.name = v_department
        and (d.specializations is null or v_specialization = any(d.specializations))
    ) then
      return jsonb_build_object('success', false, 'error', 'Invalid specialization for selected department');
    end if;
  end if;

  update public.profiles p
     set role = resolved_role,
         assigned_role_title = coalesce(role_title, role_text),
         department = case when requires_dept then v_department else null end,
         specialization = case when requires_spec then v_specialization else null end,
         updated_at = now()
   where p.id = target_user_id;

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
      'department', v_department,
      'specialization', v_specialization
    )
  );

  return jsonb_build_object('success', true);
end;
$$;
