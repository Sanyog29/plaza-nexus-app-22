# Row Level Security (RLS) Policies

## Critical Security Implementation

This document outlines all RLS policies that MUST be in place for the requisition system to be secure. These policies prevent data leakage between users.

---

## 1. requisition_lists Table

### SELECT Policy: "Users can view requisitions they have access to"

```sql
CREATE POLICY "Users can view requisitions they have access to"
ON requisition_lists
FOR SELECT
USING (
  auth.uid() = created_by -- Own requisitions
  OR 
  (
    -- Managers can see pending approvals
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'procurement_manager'
    ) 
    AND status = 'pending_manager_approval'
  )
  OR
  (
    -- Managers can see their approved/rejected items
    manager_id = auth.uid()
  )
  OR
  (
    -- Admins can see all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  )
);
```

### INSERT Policy: "Authenticated users can create requisitions"

```sql
CREATE POLICY "Authenticated users can create requisitions"
ON requisition_lists
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND auth.uid() IS NOT NULL
);
```

### UPDATE Policy: "Users can update their own drafts, managers can update pending"

```sql
CREATE POLICY "Users can update their own requisitions or managers can approve"
ON requisition_lists
FOR UPDATE
USING (
  -- Own draft requisitions
  (auth.uid() = created_by AND status = 'draft')
  OR
  -- Managers can update pending requisitions for approval
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'procurement_manager'
    )
    AND status = 'pending_manager_approval'
  )
  OR
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  -- Can only change own requisitions or as manager
  auth.uid() = created_by 
  OR manager_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'procurement_manager')
  )
);
```

### DELETE Policy: "Users can delete their own draft requisitions"

```sql
CREATE POLICY "Users can delete their own draft requisitions"
ON requisition_lists
FOR DELETE
USING (
  auth.uid() = created_by 
  AND status = 'draft'
);
```

---

## 2. requisition_list_items Table

### SELECT Policy: "Users can view items from accessible requisitions"

```sql
CREATE POLICY "Users can view items from accessible requisitions"
ON requisition_list_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND (
      created_by = auth.uid()
      OR manager_id = auth.uid()
      OR (
        status = 'pending_manager_approval' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() 
          AND role = 'procurement_manager'
        )
      )
    )
  )
);
```

### INSERT Policy: "Users can add items to their own requisitions"

```sql
CREATE POLICY "Users can add items to their own requisitions"
ON requisition_list_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND created_by = auth.uid()
    AND status = 'draft'
  )
);
```

### UPDATE Policy: "Users can update items in their own draft requisitions"

```sql
CREATE POLICY "Users can update items in their own draft requisitions"
ON requisition_list_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND created_by = auth.uid()
    AND status = 'draft'
  )
);
```

### DELETE Policy: "Users can delete items from their own draft requisitions"

```sql
CREATE POLICY "Users can delete items from their own draft requisitions"
ON requisition_list_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND created_by = auth.uid()
    AND status = 'draft'
  )
);
```

---

## 3. requisition_status_history Table

### SELECT Policy: "Users can view history for accessible requisitions"

```sql
CREATE POLICY "Users can view history for accessible requisitions"
ON requisition_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND (
      created_by = auth.uid()
      OR manager_id = auth.uid()
    )
  )
);
```

### INSERT Policy: "System can insert history entries"

```sql
CREATE POLICY "System can insert history entries"
ON requisition_status_history
FOR INSERT
WITH CHECK (
  -- Only allow if user is changing a requisition they have access to
  EXISTS (
    SELECT 1 FROM requisition_lists 
    WHERE id = requisition_list_id
    AND (
      created_by = auth.uid()
      OR (
        status = 'pending_manager_approval'
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() 
          AND role = 'procurement_manager'
        )
      )
    )
  )
  AND changed_by = auth.uid()
);
```

### UPDATE Policy: "No updates allowed"

```sql
-- No UPDATE policy - history is immutable
```

### DELETE Policy: "No deletes allowed"

```sql
-- No DELETE policy - history is immutable
```

---

## 4. notifications Table

### SELECT Policy: "Users can view their own notifications"

```sql
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (
  user_id = auth.uid()
);
```

### INSERT Policy: "System can create notifications"

```sql
CREATE POLICY "System can create notifications for any user"
ON notifications
FOR INSERT
WITH CHECK (
  -- Anyone can create notifications
  -- (In production, this should be restricted to service role)
  true
);
```

### UPDATE Policy: "Users can update their own notifications"

```sql
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);
```

### DELETE Policy: "Users can delete their own notifications"

```sql
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (
  user_id = auth.uid()
);
```

---

## 5. requisition_items_master & requisition_categories Tables

### SELECT Policy: "Public read access"

```sql
CREATE POLICY "Anyone can view active items"
ON requisition_items_master
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view active categories"
ON requisition_categories
FOR SELECT
USING (is_active = true);
```

### INSERT/UPDATE/DELETE Policy: "Admin only"

```sql
CREATE POLICY "Admins can manage items"
ON requisition_items_master
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can manage categories"
ON requisition_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);
```

---

## 6. properties Table

### SELECT Policy: "Users can view active properties"

```sql
CREATE POLICY "Users can view active properties"
ON properties
FOR SELECT
USING (is_active = true);
```

---

## Enable RLS on All Tables

```sql
-- Enable RLS on all relevant tables
ALTER TABLE requisition_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_items_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

---

## Testing RLS Policies

### Test 1: User A cannot see User B's requisitions

```sql
-- Login as User A
SELECT * FROM requisition_lists WHERE created_by != auth.uid();
-- Should return empty or only items they have manager access to
```

### Test 2: Non-managers cannot see pending approvals

```sql
-- Login as purchase_executive
SELECT * FROM requisition_lists WHERE status = 'pending_manager_approval';
-- Should only return their own pending requisitions, not others
```

### Test 3: Users cannot modify approved requisitions

```sql
-- Try to update an approved requisition
UPDATE requisition_lists 
SET notes = 'Modified' 
WHERE status = 'manager_approved';
-- Should fail with permission error
```

### Test 4: Users cannot delete approved requisitions

```sql
-- Try to delete an approved requisition
DELETE FROM requisition_lists WHERE status = 'manager_approved';
-- Should fail with permission error
```

---

## Security Checklist

Before going to production:

- [ ] RLS enabled on all tables
- [ ] All SELECT policies tested
- [ ] All INSERT policies tested  
- [ ] All UPDATE policies tested
- [ ] All DELETE policies tested
- [ ] Cross-user data access blocked
- [ ] Role-based access working
- [ ] Manager-only actions protected
- [ ] Audit trail (status history) immutable
- [ ] No data leakage in UI components
- [ ] API queries filtered correctly
- [ ] Test with multiple users
- [ ] Test with different roles
- [ ] Document all security decisions

---

## Emergency RLS Disable (Development Only)

**⚠️ NEVER DO THIS IN PRODUCTION ⚠️**

```sql
-- Disable RLS temporarily for debugging
ALTER TABLE requisition_lists DISABLE ROW LEVEL SECURITY;

-- Re-enable immediately after
ALTER TABLE requisition_lists ENABLE ROW LEVEL SECURITY;
```

---

## Monitoring & Auditing

### Query to check RLS status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Query to list all policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Query to find tables without RLS

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

---

## Common Security Mistakes to Avoid

1. **❌ Using `true` in USING clause** - Allows anyone to access
2. **❌ Forgetting to enable RLS** - Table wide open
3. **❌ Not checking auth.uid()** - Anonymous access
4. **❌ Overly permissive policies** - "When in doubt, allow"
5. **❌ Not testing with different roles** - Assume it works
6. **❌ Exposing sensitive data in SELECT** - Should filter columns too
7. **❌ Not auditing policy changes** - No history of security changes

---

## Support & Documentation

For more information on RLS:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
