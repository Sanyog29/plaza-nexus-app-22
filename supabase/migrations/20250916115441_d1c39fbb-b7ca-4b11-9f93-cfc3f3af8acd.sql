-- Create public storage bucket for vendor QR codes (idempotent)
insert into storage.buckets (id, name, public)
values ('vendor-qr-codes', 'vendor-qr-codes', true)
on conflict (id) do nothing;

-- Public read for vendor-qr-codes
create policy if not exists "Public read vendor-qr-codes"
  on storage.objects for select
  using (bucket_id = 'vendor-qr-codes');

-- Vendor staff can upload QR to their own vendor folder (first path segment = vendor_id)
create policy if not exists "Vendor staff can upload vendor QR"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-qr-codes'
    and public.is_food_vendor_staff_for_vendor(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- Vendor staff can update their own vendor QR files
create policy if not exists "Vendor staff can update vendor QR"
  on storage.objects for update
  using (
    bucket_id = 'vendor-qr-codes'
    and public.is_food_vendor_staff_for_vendor(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'vendor-qr-codes'
    and public.is_food_vendor_staff_for_vendor(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- Vendor staff can delete their own vendor QR files
create policy if not exists "Vendor staff can delete vendor QR"
  on storage.objects for delete
  using (
    bucket_id = 'vendor-qr-codes'
    and public.is_food_vendor_staff_for_vendor(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- RPC to safely set a vendor's custom QR config (merge JSON, enforce authorization)
create or replace function public.set_vendor_qr(
  p_vendor_id uuid,
  p_custom_qr_url text,
  p_use_custom boolean default true
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_food_vendor_staff_for_vendor(auth.uid(), p_vendor_id) or public.is_admin(auth.uid())) then
    raise exception 'Not authorized to update vendor QR';
  end if;

  update public.vendors
  set store_config = coalesce(store_config, '{}'::jsonb)
                      || jsonb_build_object('custom_qr_url', p_custom_qr_url, 'use_custom_qr', p_use_custom),
      updated_at = now()
  where id = p_vendor_id;

  return found;
end;
$$;

-- RPC to mark an order as paid and completed (and set paid_at)
create or replace function public.mark_order_paid_and_complete(
  p_order_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid;
  v_user_id uuid;
begin
  select vendor_id, user_id into v_vendor_id, v_user_id
  from public.cafeteria_orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found';
  end if;

  if not (
    public.is_food_vendor_staff_for_vendor(auth.uid(), v_vendor_id)
    or auth.uid() = v_user_id
    or public.is_admin(auth.uid())
  ) then
    raise exception 'Not authorized to update this order';
  end if;

  update public.cafeteria_orders
  set payment_status = 'paid',
      status = 'completed',
      paid_at = now(),
      updated_at = now()
  where id = p_order_id;

  return found;
end;
$$;