import { z } from 'zod';

// ============ Authentication Schemas ============

export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .max(100, 'Password must be less than 100 characters'),
  
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export const signInSchema = z.object({
  identifier: z.string()
    .trim()
    .min(1, 'Email or phone number is required'),
  
  password: z.string()
    .min(1, 'Password is required'),
});

// ============ Maintenance Request Schemas ============

export const maintenanceRequestSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  location: z.string()
    .trim()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Priority must be low, medium, high, or urgent' }),
  }),
  
  category_id: z.string()
    .uuid('Invalid category ID'),
  
  sub_category_id: z.string()
    .uuid('Invalid sub-category ID')
    .optional(),
});

// ============ User Profile Schemas ============

export const profileUpdateSchema = z.object({
  first_name: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  
  last_name: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  
  phone_number: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  department: z.string()
    .trim()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .or(z.literal('')),
});

// ============ Vendor Schemas ============

export const vendorSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Vendor name must be at least 2 characters')
    .max(100, 'Vendor name must be less than 100 characters'),
  
  contact_name: z.string()
    .trim()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name must be less than 100 characters')
    .optional(),
  
  contact_email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  contact_phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .trim()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
});

// ============ Order Schemas ============

export const orderSchema = z.object({
  items: z.array(z.object({
    menu_item_id: z.string().uuid('Invalid menu item ID'),
    quantity: z.number()
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(99, 'Quantity cannot exceed 99'),
    price: z.number()
      .positive('Price must be positive')
      .max(99999, 'Price too high'),
  })).min(1, 'Order must contain at least one item'),
  
  customer_instructions: z.string()
    .trim()
    .max(500, 'Instructions must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  scheduled_pickup_time: z.string().datetime().optional(),
});

// ============ Asset Schemas ============

export const assetSchema = z.object({
  asset_name: z.string()
    .trim()
    .min(2, 'Asset name must be at least 2 characters')
    .max(200, 'Asset name must be less than 200 characters'),
  
  asset_type: z.string()
    .trim()
    .min(2, 'Asset type is required')
    .max(100, 'Asset type must be less than 100 characters'),
  
  location: z.string()
    .trim()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  
  floor: z.string()
    .trim()
    .min(1, 'Floor is required')
    .max(50, 'Floor must be less than 50 characters'),
  
  brand: z.string()
    .trim()
    .max(100, 'Brand must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  model_number: z.string()
    .trim()
    .max(100, 'Model number must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  serial_number: z.string()
    .trim()
    .max(100, 'Serial number must be less than 100 characters')
    .optional()
    .or(z.literal('')),
});

// ============ Requisition Schemas ============

export const requisitionItemMasterSchema = z.object({
  item_name: z.string()
    .trim()
    .min(2, 'Item name must be at least 2 characters')
    .max(200, 'Item name must be less than 200 characters'),
  
  category_id: z.string()
    .uuid('Invalid category ID'),
  
  unit: z.string()
    .trim()
    .min(1, 'Unit is required')
    .max(20, 'Unit must be less than 20 characters'),
  
  unit_limit: z.number()
    .int('Unit limit must be a whole number')
    .min(1, 'Unit limit must be at least 1')
    .max(9999, 'Unit limit cannot exceed 9999'),
  
  description: z.string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export const requisitionCategorySchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  
  description: z.string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  icon: z.string()
    .trim()
    .max(50, 'Icon name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  
  sort_order: z.number()
    .int('Sort order must be a whole number')
    .min(0)
    .optional(),
});

export const requisitionListSchema = z.object({
  property_id: z.string()
    .uuid('Invalid property ID'),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Priority must be low, normal, high, or urgent' }),
  }),
  
  expected_delivery_date: z.string()
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      { message: 'Expected delivery date must be in the future' }
    ),
  
  notes: z.string()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  
  items: z.array(z.object({
    item_master_id: z.string().uuid('Invalid item ID'),
    quantity: z.number()
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(9999, 'Quantity cannot exceed 9999'),
  })).min(1, 'At least one item must be selected'),
});

// ============ Type Exports ============

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type RequisitionItemMasterInput = z.infer<typeof requisitionItemMasterSchema>;
export type RequisitionCategoryInput = z.infer<typeof requisitionCategorySchema>;
export type RequisitionListInput = z.infer<typeof requisitionListSchema>;
