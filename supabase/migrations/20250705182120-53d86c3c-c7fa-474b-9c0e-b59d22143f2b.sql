-- Fix all foreign key constraints for proper user deletion handling

-- Fix cafeteria_orders - should cascade delete user's orders
ALTER TABLE public.cafeteria_orders 
DROP CONSTRAINT IF EXISTS cafeteria_orders_user_id_fkey;

ALTER TABLE public.cafeteria_orders 
ADD CONSTRAINT cafeteria_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix loyalty_points - should cascade delete user's loyalty data
ALTER TABLE public.loyalty_points 
DROP CONSTRAINT IF EXISTS loyalty_points_user_id_fkey;

ALTER TABLE public.loyalty_points 
ADD CONSTRAINT loyalty_points_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix loyalty_transactions - should cascade delete user's transactions
ALTER TABLE public.loyalty_transactions 
DROP CONSTRAINT IF EXISTS loyalty_transactions_user_id_fkey;

ALTER TABLE public.loyalty_transactions 
ADD CONSTRAINT loyalty_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix maintenance_requests - set NULL for reported_by and assigned_to to preserve request history
ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_reported_by_fkey;

ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_assigned_to_fkey;

ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix request_comments - should cascade delete user's comments
ALTER TABLE public.request_comments 
DROP CONSTRAINT IF EXISTS request_comments_user_id_fkey;

ALTER TABLE public.request_comments 
ADD CONSTRAINT request_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix room_bookings - should cascade delete user's bookings
ALTER TABLE public.room_bookings 
DROP CONSTRAINT IF EXISTS room_bookings_user_id_fkey;

ALTER TABLE public.room_bookings 
ADD CONSTRAINT room_bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix staff_role_requests - should cascade delete user's requests
ALTER TABLE public.staff_role_requests 
DROP CONSTRAINT IF EXISTS staff_role_requests_user_id_fkey;

ALTER TABLE public.staff_role_requests 
ADD CONSTRAINT staff_role_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix staff_role_requests reviewed_by - set NULL to preserve audit trail
ALTER TABLE public.staff_role_requests 
DROP CONSTRAINT IF EXISTS staff_role_requests_reviewed_by_fkey;

ALTER TABLE public.staff_role_requests 
ADD CONSTRAINT staff_role_requests_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix parking_requests - should cascade delete user's parking requests
ALTER TABLE public.parking_requests 
DROP CONSTRAINT IF EXISTS parking_requests_user_id_fkey;

ALTER TABLE public.parking_requests 
ADD CONSTRAINT parking_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix visitors - should cascade delete when host user is deleted
ALTER TABLE public.visitors 
DROP CONSTRAINT IF EXISTS visitors_host_id_fkey;

ALTER TABLE public.visitors 
ADD CONSTRAINT visitors_host_id_fkey 
FOREIGN KEY (host_id) REFERENCES auth.users(id) ON DELETE CASCADE;