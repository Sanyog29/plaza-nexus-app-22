-- Fix profiles_public view security by adding proper RLS policies to profiles table
-- This ensures profiles_public respects access control since it uses security_invoker

-- Add policy for public profile viewing (authenticated users can see basic info)
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add policy for users to view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Staff can view all profiles
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can manage profiles
CREATE POLICY "Staff can manage profiles"
ON public.profiles
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for crisis_keywords (public read, staff manage)
CREATE POLICY "Anyone can view crisis keywords"
ON public.crisis_keywords
FOR SELECT
USING (true);

CREATE POLICY "Staff can manage crisis keywords"
ON public.crisis_keywords
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for operational_departments (public read, staff manage)
CREATE POLICY "Authenticated users can view departments"
ON public.operational_departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage departments"
ON public.operational_departments
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for operational_zones (public read, staff manage)
CREATE POLICY "Authenticated users can view zones"
ON public.operational_zones
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage zones"
ON public.operational_zones
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for skills_master (public read, staff manage)
CREATE POLICY "Authenticated users can view skills"
ON public.skills_master
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage skills"
ON public.skills_master
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for item_feedback (users own their data, staff view all)
CREATE POLICY "Users can manage their own feedback"
ON public.item_feedback
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all feedback"
ON public.item_feedback
FOR SELECT
USING (is_staff(auth.uid()));

-- Create RLS policies for staff_area_assignments (staff only)
CREATE POLICY "Staff can access area assignments"
ON public.staff_area_assignments
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for staff_certifications (staff only)
CREATE POLICY "Staff can access certifications"
ON public.staff_certifications
FOR ALL
USING (is_staff(auth.uid()));

-- Create RLS policies for ticket_assignment_attempts (staff only)
CREATE POLICY "Staff can access assignment attempts"
ON public.ticket_assignment_attempts
FOR ALL
USING (is_staff(auth.uid()));