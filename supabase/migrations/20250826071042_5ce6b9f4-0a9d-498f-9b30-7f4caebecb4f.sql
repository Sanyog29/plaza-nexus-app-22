-- Add missing RLS policies for new tables

-- RLS Policies for operational_departments
DROP POLICY IF EXISTS "Staff can view operational departments" ON public.operational_departments;
DROP POLICY IF EXISTS "Admins and ops supervisors can manage departments" ON public.operational_departments;

CREATE POLICY "Staff can view operational departments" 
ON public.operational_departments 
FOR SELECT 
USING (is_staff(auth.uid()) OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'field_staff'));

CREATE POLICY "Admins and ops supervisors can manage departments" 
ON public.operational_departments 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for operational_zones
DROP POLICY IF EXISTS "Staff can view operational zones" ON public.operational_zones;
DROP POLICY IF EXISTS "Admins and ops supervisors can manage zones" ON public.operational_zones;

CREATE POLICY "Staff can view operational zones" 
ON public.operational_zones 
FOR SELECT 
USING (is_staff(auth.uid()) OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'field_staff'));

CREATE POLICY "Admins and ops supervisors can manage zones" 
ON public.operational_zones 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for staff_area_assignments
DROP POLICY IF EXISTS "Staff can view their own assignments" ON public.staff_area_assignments;
DROP POLICY IF EXISTS "L2+ can manage staff assignments" ON public.staff_area_assignments;

CREATE POLICY "Staff can view their own assignments" 
ON public.staff_area_assignments 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "L2+ can manage staff assignments" 
ON public.staff_area_assignments 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for skills_master
DROP POLICY IF EXISTS "Anyone can view skills master" ON public.skills_master;
DROP POLICY IF EXISTS "Admins can manage skills master" ON public.skills_master;

CREATE POLICY "Anyone can view skills master" 
ON public.skills_master 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage skills master" 
ON public.skills_master 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for certifications_master
DROP POLICY IF EXISTS "Anyone can view certifications master" ON public.certifications_master;
DROP POLICY IF EXISTS "Admins can manage certifications master" ON public.certifications_master;

CREATE POLICY "Anyone can view certifications master" 
ON public.certifications_master 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage certifications master" 
ON public.certifications_master 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for staff_skills
DROP POLICY IF EXISTS "Staff can view their own skills" ON public.staff_skills;
DROP POLICY IF EXISTS "Staff can manage their own skills" ON public.staff_skills;
DROP POLICY IF EXISTS "L2+ can manage all staff skills" ON public.staff_skills;

CREATE POLICY "Staff can view their own skills" 
ON public.staff_skills 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage their own skills" 
ON public.staff_skills 
FOR INSERT 
WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "L2+ can manage all staff skills" 
ON public.staff_skills 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for staff_certifications
DROP POLICY IF EXISTS "Staff can view their own certifications" ON public.staff_certifications;
DROP POLICY IF EXISTS "Staff can manage their own certifications" ON public.staff_certifications;
DROP POLICY IF EXISTS "L2+ can manage all staff certifications" ON public.staff_certifications;

CREATE POLICY "Staff can view their own certifications" 
ON public.staff_certifications 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage their own certifications" 
ON public.staff_certifications 
FOR INSERT 
WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "L2+ can manage all staff certifications" 
ON public.staff_certifications 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');