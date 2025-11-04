-- =====================================================
-- Phase 1B: Procurement System Tables and RLS Policies
-- =====================================================

-- Drop existing types if they exist and recreate
DO $$ BEGIN
  DROP TYPE IF EXISTS public.requisition_status CASCADE;
  DROP TYPE IF EXISTS public.requisition_priority CASCADE;
  DROP TYPE IF EXISTS public.vendor_document_type CASCADE;
END $$;

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

-- Create requisition_categories table
CREATE TABLE public.requisition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create requisition_items_master table
CREATE TABLE public.requisition_items_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.requisition_categories(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'units',
  unit_limit INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(category_id, item_name)
);

-- Create requisition_lists table
CREATE TABLE public.requisition_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  po_number TEXT UNIQUE,
  property_id UUID NOT NULL REFERENCES public.properties(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL,
  status public.requisition_status NOT NULL DEFAULT 'draft',
  priority public.requisition_priority NOT NULL DEFAULT 'normal',
  manager_id UUID REFERENCES auth.users(id),
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  manager_remarks TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expected_delivery_date DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  grn_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  rejection_reason TEXT
);

-- Create requisition_list_items table
CREATE TABLE public.requisition_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_list_id UUID NOT NULL REFERENCES public.requisition_lists(id) ON DELETE CASCADE,
  item_master_id UUID NOT NULL REFERENCES public.requisition_items_master(id),
  item_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_limit INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_profiles table
CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_address TEXT NOT NULL,
  gst_number TEXT,
  pan_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create vendor_documents table
CREATE TABLE public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  document_type public.vendor_document_type NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create requisition_status_history table
CREATE TABLE public.requisition_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_list_id UUID NOT NULL REFERENCES public.requisition_lists(id) ON DELETE CASCADE,
  old_status public.requisition_status,
  new_status public.requisition_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_by_role public.app_role,
  remarks TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create procurement_notifications table
CREATE TABLE public.procurement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_list_id UUID NOT NULL REFERENCES public.requisition_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HELPER FUNCTIONS FOR RLS POLICIES
CREATE OR REPLACE FUNCTION public.is_procurement_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role IN ('procurement_manager', 'purchase_executive')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_property_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role = 'property_manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_field_executive(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role = 'fe'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_property(user_id UUID, property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_assignments
    WHERE property_assignments.user_id = $1
    AND property_assignments.property_id = $2
  );
$$;

-- Enable RLS
ALTER TABLE public.requisition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_items_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Procurement staff can manage categories" ON public.requisition_categories FOR ALL TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "FE can view active categories" ON public.requisition_categories FOR SELECT TO authenticated USING (is_field_executive(auth.uid()) AND is_active = true);
CREATE POLICY "Block tenants from categories" ON public.requisition_categories FOR ALL TO authenticated USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('tenant', 'super_tenant')));

CREATE POLICY "Procurement staff can manage items master" ON public.requisition_items_master FOR ALL TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "FE can view active items" ON public.requisition_items_master FOR SELECT TO authenticated USING (is_field_executive(auth.uid()) AND is_active = true);
CREATE POLICY "Block tenants from items master" ON public.requisition_items_master FOR ALL TO authenticated USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('tenant', 'super_tenant')));

CREATE POLICY "FE can create requisitions for their property" ON public.requisition_lists FOR INSERT TO authenticated WITH CHECK (is_field_executive(auth.uid()) AND created_by = auth.uid() AND user_belongs_to_property(auth.uid(), property_id));
CREATE POLICY "FE can view their own requisitions" ON public.requisition_lists FOR SELECT TO authenticated USING (is_field_executive(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "FE can update draft requisitions" ON public.requisition_lists FOR UPDATE TO authenticated USING (is_field_executive(auth.uid()) AND created_by = auth.uid() AND status = 'draft');
CREATE POLICY "Managers can view property requisitions" ON public.requisition_lists FOR SELECT TO authenticated USING (is_property_manager(auth.uid()) AND user_belongs_to_property(auth.uid(), property_id));
CREATE POLICY "Managers can update requisitions for approval" ON public.requisition_lists FOR UPDATE TO authenticated USING (is_property_manager(auth.uid()) AND user_belongs_to_property(auth.uid(), property_id) AND status = 'pending_manager_approval');
CREATE POLICY "Procurement can view approved requisitions" ON public.requisition_lists FOR SELECT TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "Procurement can update requisitions" ON public.requisition_lists FOR UPDATE TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all requisitions" ON public.requisition_lists FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Block tenants from requisition lists" ON public.requisition_lists FOR ALL TO authenticated USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('tenant', 'super_tenant')));

CREATE POLICY "Users can view items of accessible requisitions" ON public.requisition_list_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.requisition_lists rl WHERE rl.id = requisition_list_items.requisition_list_id AND (rl.created_by = auth.uid() OR user_belongs_to_property(auth.uid(), rl.property_id) OR is_procurement_staff(auth.uid()) OR is_admin(auth.uid()))));
CREATE POLICY "FE can insert items to their requisitions" ON public.requisition_list_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.requisition_lists rl WHERE rl.id = requisition_list_items.requisition_list_id AND rl.created_by = auth.uid() AND rl.status = 'draft'));
CREATE POLICY "Block tenants from requisition items" ON public.requisition_list_items FOR ALL TO authenticated USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('tenant', 'super_tenant')));

CREATE POLICY "Anyone can create vendor profile" ON public.vendor_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Procurement can manage vendor profiles" ON public.vendor_profiles FOR ALL TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "Users can upload documents for vendors" ON public.vendor_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Procurement can manage vendor documents" ON public.vendor_documents FOR ALL TO authenticated USING (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Users can view history of accessible requisitions" ON public.requisition_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.requisition_lists rl WHERE rl.id = requisition_status_history.requisition_list_id AND (rl.created_by = auth.uid() OR user_belongs_to_property(auth.uid(), rl.property_id) OR is_procurement_staff(auth.uid()) OR is_admin(auth.uid()))));
CREATE POLICY "System can insert status history" ON public.requisition_status_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own notifications" ON public.procurement_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.procurement_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.procurement_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Triggers
CREATE OR REPLACE FUNCTION public.log_requisition_status_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_role public.app_role;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.requisition_status_history (requisition_list_id, old_status, new_status, changed_by, changed_by_role, remarks)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), user_role, NEW.manager_remarks);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER requisition_status_change_trigger AFTER UPDATE ON public.requisition_lists FOR EACH ROW EXECUTE FUNCTION public.log_requisition_status_change();
CREATE TRIGGER update_requisition_lists_updated_at BEFORE UPDATE ON public.requisition_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requisition_categories_updated_at BEFORE UPDATE ON public.requisition_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requisition_items_master_updated_at BEFORE UPDATE ON public.requisition_items_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_requisition_lists_property_id ON public.requisition_lists(property_id);
CREATE INDEX idx_requisition_lists_created_by ON public.requisition_lists(created_by);
CREATE INDEX idx_requisition_lists_status ON public.requisition_lists(status);
CREATE INDEX idx_requisition_lists_assigned_to ON public.requisition_lists(assigned_to);
CREATE INDEX idx_requisition_lists_order_number ON public.requisition_lists(order_number);
CREATE INDEX idx_requisition_lists_po_number ON public.requisition_lists(po_number);
CREATE INDEX idx_requisition_list_items_requisition_id ON public.requisition_list_items(requisition_list_id);
CREATE INDEX idx_requisition_list_items_item_master_id ON public.requisition_list_items(item_master_id);
CREATE INDEX idx_requisition_items_master_category_id ON public.requisition_items_master(category_id);
CREATE INDEX idx_requisition_items_master_is_active ON public.requisition_items_master(is_active);
CREATE INDEX idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);
CREATE INDEX idx_requisition_status_history_requisition_id ON public.requisition_status_history(requisition_list_id);
CREATE INDEX idx_procurement_notifications_user_id ON public.procurement_notifications(user_id);
CREATE INDEX idx_procurement_notifications_is_read ON public.procurement_notifications(is_read);