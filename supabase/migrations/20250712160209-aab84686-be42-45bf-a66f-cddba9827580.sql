-- Phase 1: Database Schema Transformation for Multi-Vendor Cafeteria System

-- Create vendor management tables
CREATE TABLE public.vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    operating_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "18:00", "closed": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false}, "friday": {"open": "09:00", "close": "18:00", "closed": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false}}'::jsonb,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    stall_location TEXT,
    cuisine_type TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    permissions JSONB DEFAULT '{"manage_menu": true, "manage_orders": true, "view_analytics": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(vendor_id, user_id)
);

-- Add vendor_id to existing cafeteria tables
ALTER TABLE public.cafeteria_menu_categories 
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create new enhanced menu items table (migrate from existing)
CREATE TABLE public.vendor_menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.cafeteria_menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    preparation_time_minutes INTEGER DEFAULT 15,
    ingredients JSONB,
    nutritional_info JSONB,
    dietary_tags TEXT[] DEFAULT '{}',
    availability_schedule JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}'::jsonb,
    stock_quantity INTEGER,
    low_stock_threshold INTEGER DEFAULT 5,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor offers and discounts
CREATE TABLE public.vendor_offers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_one_get_one')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2),
    maximum_discount_amount DECIMAL(10,2),
    offer_code TEXT UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    applicable_items JSONB, -- Array of item IDs or categories
    is_active BOOLEAN DEFAULT true,
    requires_admin_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced orders system
ALTER TABLE public.cafeteria_orders 
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
ADD COLUMN is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN scheduled_pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN order_type TEXT DEFAULT 'instant' CHECK (order_type IN ('instant', 'scheduled', 'pre_booking')),
ADD COLUMN discount_applied DECIMAL(10,2) DEFAULT 0,
ADD COLUMN offer_code_used TEXT,
ADD COLUMN commission_amount DECIMAL(10,2),
ADD COLUMN vendor_payout_amount DECIMAL(10,2),
ADD COLUMN preparation_time_minutes INTEGER DEFAULT 15,
ADD COLUMN customer_instructions TEXT,
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN feedback_text TEXT,
ADD COLUMN feedback_submitted_at TIMESTAMP WITH TIME ZONE;

-- Order items enhancement
ALTER TABLE public.order_items
ADD COLUMN vendor_item_id UUID REFERENCES public.vendor_menu_items(id) ON DELETE SET NULL,
ADD COLUMN special_instructions TEXT,
ADD COLUMN item_rating INTEGER CHECK (item_rating >= 1 AND item_rating <= 5),
ADD COLUMN item_feedback TEXT;

-- Detailed feedback and ratings
CREATE TABLE public.order_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.cafeteria_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
    hygiene_rating INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
    speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    feedback_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Item-specific feedback
CREATE TABLE public.item_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    vendor_item_id UUID NOT NULL REFERENCES public.vendor_menu_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commission and financial tracking
CREATE TABLE public.commission_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.cafeteria_orders(id) ON DELETE CASCADE,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    vendor_payout_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_payouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    payout_period_start DATE NOT NULL,
    payout_period_end DATE NOT NULL,
    total_sales_amount DECIMAL(10,2) NOT NULL,
    total_commission_amount DECIMAL(10,2) NOT NULL,
    net_payout_amount DECIMAL(10,2) NOT NULL,
    orders_count INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'paid')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial reports and analytics
CREATE TABLE public.financial_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    report_date DATE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE, -- NULL for aggregate reports
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_sales_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_payout_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2),
    top_selling_items JSONB,
    peak_hours JSONB,
    customer_satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(report_type, report_date, vendor_id)
);

-- Vendor notifications and alerts
CREATE TABLE public.vendor_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'alert', 'promotion', 'system')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock management and alerts
CREATE TABLE public.stock_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_item_id UUID NOT NULL REFERENCES public.vendor_menu_items(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'restock_needed')),
    current_stock_quantity INTEGER,
    threshold_quantity INTEGER,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced loyalty points for multi-vendor
ALTER TABLE public.loyalty_points
ADD COLUMN vendor_specific_points JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.loyalty_transactions
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access to vendors and menu
CREATE POLICY "Anyone can view active vendors" 
ON public.vendors FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view available menu items" 
ON public.vendor_menu_items FOR SELECT 
USING (is_available = true);

CREATE POLICY "Anyone can view active offers" 
ON public.vendor_offers FOR SELECT 
USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- RLS Policies for vendor staff
CREATE POLICY "Vendor staff can manage their vendor data" 
ON public.vendors FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.vendor_staff 
        WHERE vendor_id = vendors.id 
        AND user_id = auth.uid() 
        AND is_active = true
    ) OR is_admin(auth.uid())
);

CREATE POLICY "Vendor staff can manage their menu items" 
ON public.vendor_menu_items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.vendor_staff 
        WHERE vendor_id = vendor_menu_items.vendor_id 
        AND user_id = auth.uid() 
        AND is_active = true
    ) OR is_admin(auth.uid())
);

-- RLS Policies for user feedback
CREATE POLICY "Users can create feedback for their orders" 
ON public.order_feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.order_feedback FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Vendors can view feedback for their orders" 
ON public.order_feedback FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.vendor_staff 
        WHERE vendor_id = order_feedback.vendor_id 
        AND user_id = auth.uid() 
        AND is_active = true
    ) OR is_admin(auth.uid())
);

-- RLS Policies for financial data (admin and vendor access)
CREATE POLICY "Vendors can view their commission records" 
ON public.commission_records FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.vendor_staff 
        WHERE vendor_id = commission_records.vendor_id 
        AND user_id = auth.uid() 
        AND is_active = true
    ) OR is_admin(auth.uid())
);

CREATE POLICY "Admin can manage all financial data" 
ON public.vendor_payouts FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage all reports" 
ON public.financial_reports FOR ALL 
USING (is_admin(auth.uid()));

-- Update triggers for timestamps
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_menu_items_updated_at
    BEFORE UPDATE ON public.vendor_menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_offers_updated_at
    BEFORE UPDATE ON public.vendor_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_payouts_updated_at
    BEFORE UPDATE ON public.vendor_payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate commission automatically
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
    vendor_commission_rate DECIMAL(5,2);
    commission_amt DECIMAL(10,2);
    payout_amt DECIMAL(10,2);
BEGIN
    -- Get vendor commission rate
    SELECT commission_rate INTO vendor_commission_rate
    FROM public.vendors 
    WHERE id = NEW.vendor_id;
    
    -- Calculate commission and payout amounts
    commission_amt := (NEW.total_amount * vendor_commission_rate / 100);
    payout_amt := NEW.total_amount - commission_amt;
    
    -- Update the order with calculated amounts
    NEW.commission_amount := commission_amt;
    NEW.vendor_payout_amount := payout_amt;
    
    -- Create commission record when order is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.commission_records (
            vendor_id, order_id, order_amount, commission_rate, 
            commission_amount, vendor_payout_amount
        ) VALUES (
            NEW.vendor_id, NEW.id, NEW.total_amount, vendor_commission_rate,
            commission_amt, payout_amt
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic commission calculation
CREATE TRIGGER calculate_commission_on_order_update
    BEFORE UPDATE ON public.cafeteria_orders
    FOR EACH ROW
    WHEN (NEW.vendor_id IS NOT NULL)
    EXECUTE FUNCTION public.calculate_order_commission();

-- Function to update vendor and item ratings
CREATE OR REPLACE FUNCTION public.update_ratings_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vendor average rating
    UPDATE public.vendors 
    SET average_rating = (
        SELECT AVG(overall_rating) 
        FROM public.order_feedback 
        WHERE vendor_id = NEW.vendor_id
    )
    WHERE id = NEW.vendor_id;
    
    -- Update vendor total orders count
    UPDATE public.vendors 
    SET total_orders = (
        SELECT COUNT(*) 
        FROM public.cafeteria_orders 
        WHERE vendor_id = NEW.vendor_id AND status = 'completed'
    )
    WHERE id = NEW.vendor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update ratings when feedback is added
CREATE TRIGGER update_vendor_ratings_on_feedback
    AFTER INSERT ON public.order_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ratings_on_feedback();