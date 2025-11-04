-- =====================================================
-- Phase 1A: Add new enum values (must be committed separately)
-- =====================================================

-- Extend app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'procurement_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'purchase_executive';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_manager';

-- Create new enums for requisition system
CREATE TYPE public.requisition_status AS ENUM (
  'draft',
  'pending_manager_approval',
  'manager_approved',
  'manager_rejected',
  'assigned_to_procurement',
  'po_raised',
  'in_transit',
  'received',
  'closed',
  'cancelled'
);

CREATE TYPE public.requisition_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TYPE public.vendor_document_type AS ENUM (
  'gst_certificate',
  'tds_certificate',
  'address_proof',
  'identity_proof_front',
  'identity_proof_back',
  'other'
);