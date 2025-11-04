# Security & Testing Checklist - Phase 3 & 4

## 🔒 Security Verification

### Database Security (RLS Policies)

#### ✅ **requisition_lists** Table
- [ ] **SELECT Policy**: Users can only view their own requisitions OR requisitions pending their approval
- [ ] **INSERT Policy**: Authenticated users can create requisitions
- [ ] **UPDATE Policy**: Only requisition owner OR manager with approval rights can update
- [ ] **DELETE Policy**: Only requisition owner can delete (draft status only)

#### ✅ **requisition_list_items** Table
- [ ] **SELECT Policy**: Users can view items from requisitions they have access to
- [ ] **INSERT Policy**: Users can add items to their own requisitions
- [ ] **UPDATE Policy**: Users can update items in their own requisitions (draft only)
- [ ] **DELETE Policy**: Users can delete items from their own requisitions (draft only)

#### ✅ **requisition_status_history** Table
- [ ] **SELECT Policy**: Users can view history for requisitions they have access to
- [ ] **INSERT Policy**: System can insert history entries
- [ ] **UPDATE Policy**: No updates allowed (audit trail)
- [ ] **DELETE Policy**: No deletes allowed (audit trail)

#### ✅ **notifications** Table
- [ ] **SELECT Policy**: Users can only view their own notifications
- [ ] **INSERT Policy**: System can create notifications for any user
- [ ] **UPDATE Policy**: Users can only update their own notifications (mark as read)
- [ ] **DELETE Policy**: Users can only delete their own notifications

### Role-Based Access Control (RBAC)

#### Manager Permissions
- [ ] Can view all pending requisitions (status: 'pending_manager_approval')
- [ ] Can approve requisitions
- [ ] Can reject requisitions with reason
- [ ] Can request clarification (returns to draft)
- [ ] Can bulk approve multiple requisitions
- [ ] Cannot modify requisition items directly
- [ ] Cannot see other managers' approved/rejected history (only their own)

#### Purchase Executive Permissions
- [ ] Can create requisitions
- [ ] Can view own requisitions
- [ ] Can edit own draft requisitions
- [ ] Can delete own draft requisitions
- [ ] Cannot approve requisitions
- [ ] Cannot view all requisitions list

#### General User Permissions
- [ ] Can create requisitions (if role allows)
- [ ] Can view own requisitions only
- [ ] Can edit own draft requisitions only
- [ ] Cannot access manager dashboard
- [ ] Cannot access pending approvals page

### Route Protection

#### Protected Routes
- [ ] `/procurement/manager-dashboard` - Manager only
- [ ] `/procurement/pending-approvals` - Manager only
- [ ] `/procurement/approval-history` - Manager only
- [ ] `/procurement/my-requisitions` - Authenticated users
- [ ] `/procurement/requisitions/:id` - Owner or Manager only
- [ ] `/procurement/create-requisition` - Authenticated users

#### Navigation Guards
- [ ] Manager menu items only visible to managers
- [ ] Approval actions only available to managers
- [ ] Requisition creation available to all authenticated users

### Data Leakage Prevention

#### API Queries
- [ ] Requisition list queries filtered by user access
- [ ] Status history queries filtered by requisition access
- [ ] Notification queries filtered by user_id
- [ ] Manager queries only return pending approvals for manager role

#### UI Components
- [ ] Requisition details hide sensitive data from unauthorized users
- [ ] Manager actions (approve/reject) hidden from non-managers
- [ ] Bulk operations only available to managers
- [ ] User cannot see other users' requisitions in UI

---

## 🧪 Phase 3 Testing Checklist (Requisition Creation & Management)

### Requisition Creation Flow
- [ ] Can select property from dropdown
- [ ] Can set priority (low, normal, high, urgent)
- [ ] Can set expected delivery date
- [ ] Can add optional notes
- [ ] Can search and add items from master list
- [ ] Can specify quantity and unit for each item
- [ ] Can add custom items not in master list
- [ ] Can remove items from requisition
- [ ] Order number auto-generated on submission
- [ ] Status set to 'pending_manager_approval' on submission
- [ ] Toast notification shows on successful creation
- [ ] Redirects to "My Requisitions" after creation
- [ ] Handles validation errors gracefully

### My Requisitions Page
- [ ] Shows all user's requisitions
- [ ] Filters by status (all, draft, pending, approved, rejected)
- [ ] Search by order number works
- [ ] Displays correct status badges
- [ ] Displays priority badges with correct colors
- [ ] Shows item count per requisition
- [ ] Shows created date
- [ ] Click on row navigates to detail page
- [ ] "Create New" button visible and functional
- [ ] Empty state shows when no requisitions

### Requisition Detail Page
- [ ] Shows all requisition information
- [ ] Displays property name
- [ ] Shows priority and status
- [ ] Lists all items with quantities and units
- [ ] Shows status history timeline
- [ ] Edit button available for draft status only
- [ ] Delete button available for draft status only
- [ ] Submit button available for draft status only
- [ ] Shows manager remarks if rejected
- [ ] Shows rejection reason if rejected
- [ ] Back button navigates correctly

### Item Master Management
- [ ] Can add new items to master list
- [ ] Can categorize items
- [ ] Can specify standard units
- [ ] Items appear in requisition creation search
- [ ] Duplicate items prevented

---

## 🧪 Phase 4 Testing Checklist (Approval Workflow & Manager Interface)

### Manager Dashboard
- [ ] Shows count of pending approvals
- [ ] Shows count of urgent requisitions
- [ ] Shows count of approved requisitions (this month)
- [ ] Shows count of rejected requisitions (this month)
- [ ] Quick action: Review Pending Approvals (with count)
- [ ] Quick action: View Approval History
- [ ] Recent activity shows last 5 requisitions
- [ ] Recent activity items clickable to detail
- [ ] Only visible to manager role
- [ ] Redirects non-managers to access denied

### Pending Approvals Page
- [ ] Shows all requisitions with status 'pending_manager_approval'
- [ ] Sorted by priority (urgent first), then date (oldest first)
- [ ] Select all checkbox works
- [ ] Individual checkboxes work
- [ ] Bulk approve button appears when items selected
- [ ] Bulk approve processes all selected items
- [ ] Bulk approve shows success count
- [ ] Click row opens approval detail modal
- [ ] Priority badges show correct colors
- [ ] Empty state shows when no pending approvals

### Approval Detail Modal
- [ ] Shows complete requisition information
- [ ] Shows property name
- [ ] Shows requester name
- [ ] Shows all items in table format
- [ ] Shows notes if provided
- [ ] Approve button opens remarks form
- [ ] Reject button opens rejection reason form (required)
- [ ] Request Clarification button opens message form (required)
- [ ] Confirmation step before final action
- [ ] Updates status correctly after approval
- [ ] Updates status correctly after rejection
- [ ] Returns to draft status after clarification request
- [ ] Closes modal after action
- [ ] Refreshes list after action

### Approval History Page
- [ ] Shows all requisitions reviewed by current manager
- [ ] Filter by status (all, approved, rejected, returned)
- [ ] Search by order number works
- [ ] Search by requester name works
- [ ] Shows correct status badges
- [ ] Shows review date
- [ ] Shows manager remarks
- [ ] Click row navigates to detail page
- [ ] Sorted by review date (newest first)
- [ ] Empty state shows when no history

### Notification System
- [ ] Notification bell shows unread count
- [ ] New requisition submission creates notification for managers
- [ ] Approval creates notification for requester
- [ ] Rejection creates notification for requester
- [ ] Clarification request creates notification for requester
- [ ] Click notification navigates to correct page
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Real-time updates when new notification arrives
- [ ] Shows notification type badge (info, success, error, warning)
- [ ] Shows relative time (e.g., "2 minutes ago")

### Status Workflow
- [ ] Draft → Pending Manager Approval (on submit)
- [ ] Pending Manager Approval → Manager Approved (on approve)
- [ ] Pending Manager Approval → Manager Rejected (on reject)
- [ ] Pending Manager Approval → Draft (on clarification request)
- [ ] Cannot transition from approved/rejected to other statuses
- [ ] Status history recorded for all transitions
- [ ] Status history shows who made the change
- [ ] Status history shows timestamp
- [ ] Status history shows remarks/reason

---

## 🔍 Cross-Functional Testing

### User Experience
- [ ] All forms validate input before submission
- [ ] Error messages are clear and helpful
- [ ] Success messages confirm actions
- [ ] Loading states show during async operations
- [ ] No flickering or layout shifts
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works
- [ ] Focus management is intuitive

### Performance
- [ ] Page load times < 2 seconds
- [ ] Search responses < 500ms
- [ ] No unnecessary re-renders
- [ ] Queries properly cached
- [ ] Infinite scroll/pagination if many items
- [ ] Optimistic updates where appropriate

### Data Integrity
- [ ] No duplicate order numbers
- [ ] No orphaned requisition items
- [ ] Status history always recorded
- [ ] Timestamps accurate
- [ ] User IDs properly recorded
- [ ] Foreign keys enforced
- [ ] Cascading deletes work correctly

---

## 🚨 Known Issues & Warnings

### Database Linter Warnings (Non-Critical)
1. **Function Search Path Mutable** - Database functions should have search_path set
2. **Extension in Public** - Extensions in public schema (not critical for this app)
3. **Auth OTP Long Expiry** - OTP expiry time may be too long (security enhancement)
4. **Leaked Password Protection Disabled** - Should enable for production
5. **Postgres Version Patches** - Update Postgres version for security patches

**Action Required**: These are Supabase-level configurations that should be addressed before production deployment but don't affect current functionality.

---

## ✅ Phase Completion Criteria

### Phase 3: Complete (98%)
- [x] Requisition creation flow
- [x] Item selection and management
- [x] My Requisitions page
- [x] Requisition detail page
- [x] Status tracking
- [x] Item master management
- [ ] Build error resolved (Type instantiation)

### Phase 4: Complete (95%)
- [x] Manager dashboard
- [x] Pending approvals page
- [x] Approval detail modal
- [x] Approval history page
- [x] Notification system
- [x] Status workflow
- [x] Bulk operations
- [ ] Full security audit

---

## 📋 Next Steps

1. **Resolve Build Error** - Fix type instantiation in RequisitionSummaryStep
2. **Security Audit** - Verify all RLS policies are in place
3. **User Testing** - Get feedback from actual managers and purchase executives
4. **Documentation** - Create user manual for requisition workflow
5. **Performance Testing** - Test with large datasets (100+ requisitions)
6. **Phase 5 Planning** - Begin procurement operations (vendor management, POs)

---

## 🎯 Success Metrics

- [ ] Zero security vulnerabilities
- [ ] 100% role-based access working
- [ ] < 2 second page load times
- [ ] Zero data leakage between users
- [ ] 100% test coverage on critical paths
- [ ] User acceptance testing passed
