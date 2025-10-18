-- Fix Security Definer views and add missing columns to profiles_public
-- This migration addresses the Security Definer View linter errors and TypeScript build errors

-- Drop and recreate profiles_public with all public-safe columns
DROP VIEW IF EXISTS public.profiles_public CASCADE;
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.monthly_leaderboard CASCADE;

-- Recreate profiles_public with security_invoker and all public-safe columns
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  last_name,
  office_number,
  phone_number,
  created_at,
  updated_at,
  avatar_url,
  floor,
  zone,
  department,
  approval_status,
  approved_by,
  approved_at,
  rejection_reason,
  profile_visibility,
  notification_preferences,
  bio,
  skills,
  interests,
  specialization,
  designation,
  supervisor_id,
  shift_start,
  shift_end,
  onboarding_date,
  is_active,
  mobile_number,
  assigned_role_title,
  email,
  user_category,
  role
FROM public.profiles;

-- Create public_profiles as alias
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT * FROM public.profiles_public;

-- Recreate monthly_leaderboard with security_invoker
CREATE VIEW public.monthly_leaderboard
WITH (security_invoker = true) AS
SELECT 
  tp.technician_id,
  p.first_name,
  p.last_name,
  p.role,
  tp.points_earned,
  tp.points_balance,
  tp.current_tier,
  tp.updated_at,
  COUNT(mr.id) FILTER (
    WHERE mr.status = 'completed' 
    AND mr.completed_at >= date_trunc('month', CURRENT_DATE::timestamp with time zone)
  ) AS tickets_completed
FROM public.technician_points tp
JOIN public.profiles p ON p.id = tp.technician_id
LEFT JOIN public.maintenance_requests mr ON mr.assigned_to = tp.technician_id
GROUP BY tp.technician_id, p.first_name, p.last_name, p.role, 
         tp.points_earned, tp.points_balance, tp.current_tier, tp.updated_at;

-- Drop and recreate active_maintenance_requests with security_invoker
DROP VIEW IF EXISTS public.active_maintenance_requests CASCADE;

CREATE VIEW public.active_maintenance_requests
WITH (security_invoker = true) AS
SELECT * FROM public.maintenance_requests
WHERE deleted_at IS NULL;