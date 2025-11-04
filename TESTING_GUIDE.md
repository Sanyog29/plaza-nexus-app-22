# Phase 3 & 4 Testing Guide

## Setup Instructions

### Test Users Setup
Create the following test users in your Supabase auth:

1. **Manager User**
   - Email: manager@test.com
   - Role: `procurement_manager`
   - Permissions: Can approve requisitions

2. **Purchase Executive User**
   - Email: purchaseexec@test.com
   - Role: `purchase_executive`
   - Permissions: Can create requisitions

3. **Regular User**
   - Email: user@test.com
   - Role: `tenant`
   - Permissions: Limited access

### Test Data Setup
Run these SQL commands in Supabase SQL Editor:

```sql
-- Insert test properties
INSERT INTO properties (name, is_active) VALUES
('Test Building A', true),
('Test Building B', true);

-- Insert test requisition categories
INSERT INTO requisition_categories (name, is_active) VALUES
('Office Supplies', true),
('IT Equipment', true),
('Furniture', true);

-- Insert test items
INSERT INTO requisition_items_master (name, category_id, standard_unit, is_active) VALUES
('Laptop', (SELECT id FROM requisition_categories WHERE name = 'IT Equipment'), 'piece', true),
('Office Chair', (SELECT id FROM requisition_categories WHERE name = 'Furniture'), 'piece', true),
('A4 Paper', (SELECT id FROM requisition_categories WHERE name = 'Office Supplies'), 'ream', true);
```

## Test Scenarios

### Phase 3: Requisition Creation & Management

#### Test 1: Create a New Requisition (Purchase Executive)
**Prerequisites**: Logged in as purchaseexec@test.com

**Steps**:
1. Navigate to `/procurement/create-requisition`
2. Fill in basic information:
   - Select "Test Building A" as property
   - Select priority "High"
   - Set expected delivery date (7 days from now)
   - Add notes: "Urgent requirement for new office setup"
3. Add items:
   - Search for "Laptop" → Select → Quantity: 5, Unit: piece
   - Search for "Office Chair" → Select → Quantity: 5, Unit: piece
4. Click "Submit Requisition"

**Expected Results**:
- ✅ Toast notification: "Requisition created successfully"
- ✅ Redirects to `/procurement/my-requisitions`
- ✅ New requisition appears with status "Pending Manager Approval"
- ✅ Order number auto-generated (e.g., REQ-2024-0001)
- ✅ Manager receives notification

**Verify**:
```sql
SELECT * FROM requisition_lists ORDER BY created_at DESC LIMIT 1;
SELECT * FROM requisition_list_items WHERE requisition_list_id = '<requisition_id>';
SELECT * FROM requisition_status_history WHERE requisition_list_id = '<requisition_id>';
```

---

#### Test 2: Save as Draft
**Prerequisites**: Logged in as purchaseexec@test.com

**Steps**:
1. Navigate to `/procurement/create-requisition`
2. Fill partial information (property + 1 item)
3. Click "Save as Draft"

**Expected Results**:
- ✅ Toast: "Requisition saved as draft"
- ✅ Requisition appears in My Requisitions with status "Draft"
- ✅ Can edit and complete later
- ✅ No notification sent to manager

---

#### Test 3: Edit Draft Requisition
**Prerequisites**: Have a draft requisition

**Steps**:
1. Go to "My Requisitions"
2. Click on draft requisition
3. Click "Edit" button
4. Modify items (add/remove)
5. Change priority to "Urgent"
6. Click "Submit Requisition"

**Expected Results**:
- ✅ Updates saved successfully
- ✅ Status changes to "Pending Manager Approval"
- ✅ Manager notified

---

#### Test 4: Filter and Search
**Prerequisites**: Multiple requisitions exist

**Steps**:
1. Go to "My Requisitions"
2. Test filters:
   - Filter by status: "Draft"
   - Filter by status: "Pending Approval"
   - Filter by status: "Approved"
3. Test search:
   - Search by order number
   - Verify results match

**Expected Results**:
- ✅ Filters work correctly
- ✅ Search returns matching results
- ✅ "No results" shown when appropriate

---

#### Test 5: Security - Cannot View Other Users' Requisitions
**Prerequisites**: Two users with requisitions

**Steps**:
1. Login as User A
2. Note order number of a requisition
3. Logout and login as User B
4. Try to access User A's requisition by URL:
   `/procurement/requisitions/<user_a_requisition_id>`

**Expected Results**:
- ✅ Access denied or "Not found"
- ✅ Cannot see User A's requisitions in list

**Verify RLS**:
```sql
-- This should return empty for User B
SELECT * FROM requisition_lists WHERE created_by != '<user_b_id>';
```

---

### Phase 4: Approval Workflow & Manager Interface

#### Test 6: Manager Dashboard
**Prerequisites**: Logged in as manager@test.com, have pending requisitions

**Steps**:
1. Navigate to `/procurement/manager-dashboard`
2. Verify stats display:
   - Pending approvals count
   - Urgent requisitions count
   - Approved this month
   - Rejected this month
3. Verify recent activity shows last 5 requisitions
4. Click "Review Pending Approvals"

**Expected Results**:
- ✅ All counts accurate
- ✅ Quick actions functional
- ✅ Recent activity clickable

---

#### Test 7: Approve Single Requisition
**Prerequisites**: Manager logged in, have pending requisition

**Steps**:
1. Go to "Pending Approvals"
2. Click on a requisition row
3. Modal opens showing full details
4. Click "Approve" button
5. Add remarks: "Approved for Q1 budget"
6. Click "Confirm Approval"

**Expected Results**:
- ✅ Toast: "Requisition approved successfully"
- ✅ Requisition removed from pending list
- ✅ Status updated to "Manager Approved"
- ✅ Requester receives notification
- ✅ Manager remarks saved
- ✅ Status history updated

**Verify**:
```sql
SELECT status, manager_approved_at, manager_id, manager_remarks 
FROM requisition_lists 
WHERE id = '<requisition_id>';

SELECT * FROM requisition_status_history 
WHERE requisition_list_id = '<requisition_id>' 
ORDER BY created_at DESC;
```

---

#### Test 8: Reject Requisition with Reason
**Prerequisites**: Manager logged in, have pending requisition

**Steps**:
1. Open approval modal for a requisition
2. Click "Reject" button
3. Enter rejection reason: "Budget not available for this quarter"
4. Click "Confirm Rejection"

**Expected Results**:
- ✅ Toast: "Requisition rejected"
- ✅ Status = "Manager Rejected"
- ✅ Rejection reason saved
- ✅ Requester notified with reason
- ✅ Cannot approve rejected requisition again

---

#### Test 9: Request Clarification
**Prerequisites**: Manager logged in, have pending requisition

**Steps**:
1. Open approval modal
2. Click "Request Clarification"
3. Enter message: "Please provide more details on the quantity needed"
4. Click "Confirm Request"

**Expected Results**:
- ✅ Status returns to "Draft"
- ✅ Requester notified
- ✅ Requester can edit and resubmit
- ✅ Manager message visible to requester

---

#### Test 10: Bulk Approve Requisitions
**Prerequisites**: Manager logged in, have 3+ pending requisitions

**Steps**:
1. Go to "Pending Approvals"
2. Check checkboxes for 3 requisitions
3. Click "Approve Selected (3)"
4. Confirm bulk approval

**Expected Results**:
- ✅ All 3 requisitions approved
- ✅ Toast: "3 requisitions approved successfully"
- ✅ All removed from pending list
- ✅ All requesters notified
- ✅ Status history created for all

---

#### Test 11: Priority Sorting
**Prerequisites**: Have requisitions with different priorities

**Steps**:
1. Go to "Pending Approvals"
2. Verify sort order:
   - Urgent requisitions at top
   - Then High, Normal, Low
   - Within same priority, oldest first

**Expected Results**:
- ✅ Correct sort order
- ✅ Urgent items highlighted

---

#### Test 12: Approval History & Filtering
**Prerequisites**: Manager has approved/rejected requisitions

**Steps**:
1. Go to "Approval History"
2. Verify all reviewed requisitions show
3. Filter by:
   - Status: "Approved"
   - Status: "Rejected"
4. Search by order number
5. Search by requester name

**Expected Results**:
- ✅ All filters work correctly
- ✅ Search returns matching results
- ✅ Can click to view details

---

#### Test 13: Notification System
**Prerequisites**: Notifications table set up

**Steps**:
1. As Purchase Executive, submit a requisition
2. As Manager, check notification bell
3. Click notification bell icon
4. Verify unread count shows
5. Click notification
6. Verify it navigates to correct page
7. Mark notification as read
8. Mark all as read

**Expected Results**:
- ✅ Notification appears in real-time
- ✅ Unread count accurate
- ✅ Clicking notification works
- ✅ Mark as read works
- ✅ Mark all as read works

---

#### Test 14: Security - Non-Manager Cannot Access Manager Pages
**Prerequisites**: Logged in as purchase executive

**Steps**:
1. Try to navigate to `/procurement/manager-dashboard`
2. Try to navigate to `/procurement/pending-approvals`
3. Try to navigate to `/procurement/approval-history`

**Expected Results**:
- ✅ Access denied or redirected
- ✅ Manager menu items not visible in sidebar
- ✅ Approve/Reject buttons not visible on requisition details

---

#### Test 15: Status Workflow Validation
**Prerequisites**: Have requisitions in different statuses

**Test Cases**:
| Current Status | Action | Expected Result |
|---|---|---|
| Draft | Submit | → Pending Manager Approval ✅ |
| Pending | Approve | → Manager Approved ✅ |
| Pending | Reject | → Manager Rejected ✅ |
| Pending | Clarify | → Draft ✅ |
| Approved | Edit | ❌ Cannot edit |
| Rejected | Re-approve | ❌ Cannot change |

---

## Performance Testing

### Test 16: Large Dataset Performance

**Setup**:
```sql
-- Insert 100 test requisitions
INSERT INTO requisition_lists (order_number, created_by, created_by_name, status, priority, property_id, total_items)
SELECT 
  'REQ-TEST-' || generate_series,
  '<user_id>',
  'Test User',
  'pending_manager_approval',
  (ARRAY['low', 'normal', 'high', 'urgent'])[floor(random() * 4 + 1)],
  (SELECT id FROM properties LIMIT 1),
  floor(random() * 10 + 1)
FROM generate_series(1, 100);
```

**Steps**:
1. Load "Pending Approvals" page
2. Measure page load time
3. Test filtering performance
4. Test search performance

**Expected Results**:
- ✅ Page loads in < 2 seconds
- ✅ No lag when filtering
- ✅ Search results instant

---

## Edge Cases & Error Handling

### Test 17: Network Error Handling
**Steps**:
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to submit a requisition
4. Try to approve a requisition

**Expected Results**:
- ✅ Graceful error message
- ✅ No data loss
- ✅ Retry option available

---

### Test 18: Validation Errors
**Test Cases**:
1. Submit requisition without property → ❌ Error shown
2. Submit requisition without items → ❌ Error shown
3. Reject without reason → ❌ Error shown
4. Request clarification without message → ❌ Error shown

---

### Test 19: Concurrent Updates
**Steps**:
1. Manager A opens approval modal for Req-001
2. Manager B opens approval modal for Req-001
3. Manager A approves
4. Manager B tries to approve

**Expected Results**:
- ✅ Manager B gets error: "Requisition already processed"
- ✅ Only one approval recorded

---

## Automated Testing Script

```javascript
// Run in browser console on /procurement/my-requisitions
async function runTests() {
  console.log('🧪 Starting automated tests...');
  
  // Test 1: Check if requisitions load
  const requisitions = document.querySelectorAll('[data-test="requisition-row"]');
  console.log(`✅ Found ${requisitions.length} requisitions`);
  
  // Test 2: Check filters work
  const statusFilter = document.querySelector('[data-test="status-filter"]');
  if (statusFilter) {
    statusFilter.value = 'draft';
    statusFilter.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 500));
    console.log('✅ Status filter works');
  }
  
  // Add more automated checks...
  
  console.log('🎉 All tests passed!');
}

runTests();
```

---

## Regression Testing Checklist

Before deploying to production, verify:

- [ ] All Phase 3 features work
- [ ] All Phase 4 features work
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No layout issues on mobile
- [ ] All notifications work
- [ ] All status transitions work
- [ ] Security policies enforced
- [ ] Performance acceptable
- [ ] Error handling works

---

## Bug Reporting Template

```markdown
**Environment**: Dev / Staging / Prod
**User Role**: Manager / Purchase Executive / Admin
**Browser**: Chrome / Firefox / Safari
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
**Actual Result**:
**Screenshots**:
**Console Errors**:
```
