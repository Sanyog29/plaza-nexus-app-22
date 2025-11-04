-- =====================================================
-- Phase 1A: Add New Roles to app_role Enum
-- Must be in separate transaction before usage
-- =====================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'procurement_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'purchase_executive';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_manager';