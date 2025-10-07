-- Add audit columns to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at timestamptz NOT NULL DEFAULT now();