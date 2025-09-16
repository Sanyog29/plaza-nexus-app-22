import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

interface CategoryData {
  name: string;
  description?: string;
  display_order?: number;
  image_url?: string;
}

interface MenuItemData {
  category_name: string;
  name: string;
  description?: string;
  price: number;
  half_plate_price?: number;
  is_available: boolean;
  date?: string;
  meal_type?: string;
  preparation_time_minutes?: number;
  spice_level?: string;
  dietary_tags?: string[];
  allergens?: string[];
  image_url?: string;
}

interface ScheduleData {
  menu_item_id: string;
  availability_date?: string;
  schedule_type: 'daily' | 'weekly' | 'specific';
  day_of_week?: number;
  is_active: boolean;
}

export const useMenuImport = (vendorId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [parsedData, setParsedData] = useState<{
    categories: CategoryData[];
    menuItems: MenuItemData[];
  } | null>(null);
  const { toast } = useToast();

  const validateRequiredFields = (data: any, requiredFields: string[], rowIndex: number): ImportError[] => {
    const errors: ImportError[] = [];
    
    requiredFields.forEach(field => {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          row: rowIndex + 2, // +2 for header row and 0-based index
          field,
          message: `${field} is required`,
          value
        });
      }
    });
    
    return errors;
  };

  const validateDataFormats = (data: any, rowIndex: number): ImportError[] => {
    const errors: ImportError[] = [];
    
    // Validate full plate price
    if (data['Full Plate Price'] !== undefined && data['Full Plate Price'] !== null && data['Full Plate Price'] !== '') {
      const price = Number(data['Full Plate Price']);
      if (isNaN(price) || price <= 0) {
        errors.push({
          row: rowIndex + 2,
          field: 'Full Plate Price',
          message: 'Full Plate Price must be a number greater than 0',
          value: data['Full Plate Price']
        });
      }
    }
    
    // Validate half plate price (optional)
    if (data['Half Plate Price'] !== undefined && data['Half Plate Price'] !== null && data['Half Plate Price'] !== '') {
      const halfPrice = Number(data['Half Plate Price']);
      if (isNaN(halfPrice) || halfPrice <= 0) {
        errors.push({
          row: rowIndex + 2,
          field: 'Half Plate Price',
          message: 'Half Plate Price must be a number greater than 0 if provided',
          value: data['Half Plate Price']
        });
      }
      
      // Business rule: Half plate should be less than full plate
      const fullPrice = Number(data['Full Plate Price']);
      if (!isNaN(fullPrice) && !isNaN(halfPrice) && halfPrice >= fullPrice) {
        errors.push({
          row: rowIndex + 2,
          field: 'Half Plate Price',
          message: 'Half Plate Price should be less than Full Plate Price',
          value: data['Half Plate Price']
        });
      }
    }
    
    // Validate availability
    if (data.Availability !== undefined && data.Availability !== null && data.Availability !== '') {
      const availability = String(data.Availability).toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(availability)) {
        errors.push({
          row: rowIndex + 2,
          field: 'Availability',
          message: 'Availability must be true/false, yes/no, or 1/0',
          value: data.Availability
        });
      }
    }
    
    // Validate date format
    if (data.Date && data.Date !== 'Daily' && !data.Date.startsWith('Weekly-')) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.Date)) {
        const testDate = new Date(data.Date);
        if (isNaN(testDate.getTime())) {
          errors.push({
            row: rowIndex + 2,
            field: 'Date',
            message: 'Date must be YYYY-MM-DD format, "Daily", or "Weekly-[Day]"',
            value: data.Date
          });
        }
      }
    }
    
    // Validate preparation time
    if (data['Preparation Time (minutes)'] !== undefined && data['Preparation Time (minutes)'] !== '') {
      const prepTime = Number(data['Preparation Time (minutes)']);
      if (isNaN(prepTime) || prepTime < 0) {
        errors.push({
          row: rowIndex + 2,
          field: 'Preparation Time (minutes)',
          message: 'Preparation time must be a non-negative number',
          value: data['Preparation Time (minutes)']
        });
      }
    }
    
    return errors;
  };

  const normalizeColumnName = (row: any, possibleNames: string[]): any => {
    for (const name of possibleNames) {
      if (row[name] !== undefined) {
        return row[name];
      }
    }
    return undefined;
  };

  const sanitizePrice = (priceValue: any): number | null => {
    if (!priceValue || priceValue === '') return null;
    
    // Convert to string and clean currency symbols and text
    let cleanPrice = String(priceValue)
      .replace(/[₹rs\s]/gi, '') // Remove ₹, rs, and spaces
      .replace(/[^\d.]/g, ''); // Keep only digits and decimal points
    
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? null : price;
  };

  const normalizeDateFormat = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    const dateStr = String(dateValue).trim();
    
    // Handle special formats
    if (dateStr === 'Daily' || dateStr.startsWith('Weekly-')) {
      return dateStr;
    }
    
    // Handle human-friendly dates like "16th Sep"
    const humanDateRegex = /^(\d{1,2})(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const match = dateStr.match(humanDateRegex);
    
    if (match) {
      const day = match[1];
      const month = match[3];
      const currentYear = new Date().getFullYear();
      
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const monthNum = monthMap[month];
      if (monthNum) {
        const formattedDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
        return formattedDate;
      }
    }
    
    // Handle standard YYYY-MM-DD format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateRegex.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse as regular date
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    
    return null;
  };

  const parseExcelFile = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData(null);
    setUploadProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      setUploadProgress(30);

      // Categories will be auto-created from menu items, no separate Categories sheet needed
      let categories: CategoryData[] = [];

      setUploadProgress(50);

      // Parse Menu Items sheet (try both 'Menu Items' and the main sheet)
      let menuItems: MenuItemData[] = [];
      let sheetName = 'Menu Items';
      
      // If Menu Items sheet doesn't exist, use the first sheet
      if (!workbook.SheetNames.includes('Menu Items')) {
        sheetName = workbook.SheetNames[0];
      }
      
      if (workbook.SheetNames.includes(sheetName)) {
        const menuItemsSheet = workbook.Sheets[sheetName];
        const menuItemsRaw = XLSX.utils.sheet_to_json(menuItemsSheet);
        
        const allErrors: ImportError[] = [];
        
        menuItems = menuItemsRaw.map((row: any, index) => {
          // Normalize column names with aliases
          const categoryName = normalizeColumnName(row, ['Category', 'Category Name']);
          const itemName = normalizeColumnName(row, ['Item Name', 'Name']);
          const priceRaw = normalizeColumnName(row, ['Price', 'Full Plate Price']);
          const halfPlateRaw = normalizeColumnName(row, ['Half Plate', 'Half Plate Price']);
          const availability = normalizeColumnName(row, ['Availability', 'Available']);
          const mealType = normalizeColumnName(row, ['Meal Type', 'Meal']);
          const dateRaw = normalizeColumnName(row, ['Date']);

          // Sanitize prices and normalize date
          const price = sanitizePrice(priceRaw);
          const halfPlatePrice = sanitizePrice(halfPlateRaw);
          const normalizedDate = normalizeDateFormat(dateRaw);
          
          // Validate required fields with flexible column names
          if (!categoryName) {
            allErrors.push({
              row: index + 2,
              field: 'Category',
              message: 'Category or Category Name is required',
              value: undefined
            });
          }
          
          if (!itemName) {
            allErrors.push({
              row: index + 2,
              field: 'Item Name',
              message: 'Item Name is required',
              value: undefined
            });
          }
          
          if (!price || price <= 0) {
            allErrors.push({
              row: index + 2,
              field: 'Price',
              message: 'Valid price is required (supports formats like "80", "₹150", "45.00 rs")',
              value: priceRaw
            });
          }
          
          // Validate half plate price (optional)
          if (halfPlateRaw && halfPlatePrice && halfPlatePrice <= 0) {
            allErrors.push({
              row: index + 2,
              field: 'Half Plate',
              message: 'Half plate price must be a valid number greater than 0',
              value: halfPlateRaw
            });
          }
          
          // Business rule: Half plate should be less than full plate
          if (price && halfPlatePrice && halfPlatePrice >= price) {
            allErrors.push({
              row: index + 2,
              field: 'Half Plate',
              message: 'Half plate price should be less than full plate price',
              value: halfPlateRaw
            });
          }
          
          // Validate availability (now optional, defaults to true)
          let isAvailable = true;
          if (availability !== undefined && availability !== null && availability !== '') {
            const availStr = String(availability).toLowerCase();
            if (!['true', 'false', '1', '0', 'yes', 'no'].includes(availStr)) {
              allErrors.push({
                row: index + 2,
                field: 'Availability',
                message: 'Availability must be true/false, yes/no, or 1/0',
                value: availability
              });
            } else {
              isAvailable = ['true', '1', 'yes'].includes(availStr);
            }
          }
          
          // Validate date format (now more flexible)
          if (dateRaw && !normalizedDate) {
            allErrors.push({
              row: index + 2,
              field: 'Date',
              message: 'Date format not recognized. Use formats like "16th Sep", "2025-09-16", "Daily", or "Weekly-Monday"',
              value: dateRaw
            });
          }
          
          // Parse dietary tags and allergens
          const dietaryTags = row['Dietary Tags'] ? 
            row['Dietary Tags'].split(',').map((tag: string) => tag.trim()) : [];
          const allergens = row['Allergens'] ? 
            row['Allergens'].split(',').map((allergen: string) => allergen.trim()) : [];
          
          return {
            category_name: categoryName || '',
            name: itemName || '',
            description: row['Description'] || '',
            price: price || 0,
            half_plate_price: halfPlatePrice || undefined,
            is_available: isAvailable,
            date: normalizedDate || null,
            meal_type: mealType || null,
            preparation_time_minutes: row['Preparation Time (minutes)'] ? 
              Number(row['Preparation Time (minutes)']) : null,
            spice_level: row['Spice Level'] || null,
            dietary_tags: dietaryTags,
            allergens: [],
            image_url: row['Image URL'] || null
          };
        }).filter(item => item.name && item.category_name); // Filter out invalid items

        setValidationErrors(prev => [...prev, ...allErrors]);
      }

      setUploadProgress(80);

      setParsedData({ categories, menuItems });
      setUploadProgress(100);

      if (validationErrors.length === 0) {
        toast({
          title: "File parsed successfully",
          description: `Found ${categories.length} categories and ${menuItems.length} menu items`,
        });
      } else {
        toast({
          title: "Validation errors found",
          description: `Found ${validationErrors.length} errors that need to be fixed`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: "Import failed",
        description: "Failed to parse Excel file. Please check the file format.",
        variant: "destructive",
      });
      setValidationErrors([{
        row: 0,
        field: 'File',
        message: 'Failed to parse Excel file. Please check the file format.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImport = async (): Promise<boolean> => {
    if (!parsedData || validationErrors.length > 0) {
      toast({
        title: "Cannot import",
        description: "Please fix validation errors before importing",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    
    try {
      // Create import batch record
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          vendor_id: vendorId,
          filename: `excel-import-${Date.now()}`,
          total_items: parsedData.menuItems.length,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;
      const batchId = batchData.id;

      // Auto-create categories from menu items
      const categoryMap = new Map<string, string>();
      const uniqueCategories = [...new Set(parsedData.menuItems.map(item => item.category_name))];
      
      for (let i = 0; i < uniqueCategories.length; i++) {
        const categoryName = uniqueCategories[i];
        
        // Check if category exists
        const { data: existingCategory } = await supabase
          .from('cafeteria_menu_categories')
          .select('id')
          .eq('name', categoryName)
          .eq('vendor_id', vendorId)
          .maybeSingle();

        if (existingCategory) {
          categoryMap.set(categoryName, existingCategory.id);
        } else {
          // Create new category with auto-generated display order
          const { data: newCategory, error: categoryError } = await supabase
            .from('cafeteria_menu_categories')
            .insert({
              name: categoryName,
              description: `Auto-created category for ${categoryName}`,
              display_order: i + 1,
              vendor_id: vendorId
            })
            .select()
            .single();

          if (categoryError) throw categoryError;
          categoryMap.set(categoryName, newCategory.id);
        }
      }

      // Process menu items
      let successCount = 0;
      const errors: any[] = [];

      for (const item of parsedData.menuItems) {
        try {
          const categoryId = categoryMap.get(item.category_name);
          if (!categoryId) {
            errors.push({
              item: item.name,
              error: `Category '${item.category_name}' not found`
            });
            continue;
          }

          // Create menu item
          const menuItemData: any = {
            vendor_id: vendorId,
            category_id: categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            half_plate_price: item.half_plate_price || null,
            is_available: item.is_available,
            dietary_tags: item.dietary_tags,
            allergens: item.allergens,
            image_url: item.image_url,
            import_batch_id: batchId
          };

          // Add optional fields with proper type conversion
          if (item.preparation_time_minutes !== null) {
            menuItemData.preparation_time_minutes = item.preparation_time_minutes;
          }

          // Convert spice_level string to integer
          if (item.spice_level) {
            const spiceLevelMap = {
              'Mild': 1,
              'Medium': 2,
              'Hot': 3,
              'Very Hot': 4
            };
            menuItemData.spice_level = spiceLevelMap[item.spice_level] || 1;
          }

          const { data: menuItem, error: itemError } = await supabase
            .from('vendor_menu_items')
            .insert(menuItemData)
            .select()
            .single();

          if (itemError) throw itemError;

          // Create schedule if date is specified
          if (item.date && menuItem) {
            await createMenuSchedule(menuItem.id, item.date, vendorId);
          }

          successCount++;
        } catch (error) {
          errors.push({
            item: item.name,
            error: error.message
          });
        }
      }

      // Update batch status
      await supabase
        .from('import_batches')
        .update({
          successful_items: successCount,
          failed_items: errors.length,
          status: errors.length === 0 ? 'completed' : 'failed',
          error_summary: errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      });

      return true;

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const createMenuSchedule = async (menuItemId: string, dateStr: string, vendorId: string) => {
    if (dateStr === 'Daily') {
      // Create daily schedule (valid for next 90 days)
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        await supabase
          .from('vendor_menu_schedules')
          .insert({
            vendor_id: vendorId,
            menu_item_id: menuItemId,
            availability_date: date.toISOString().split('T')[0],
            schedule_type: 'daily',
            is_active: true
          });
      }
    } else if (dateStr.startsWith('Weekly-')) {
      // Parse weekly schedule
      const days = dateStr.split(',').map(d => d.trim());
      const dayMap = {
        'Weekly-Sunday': 0, 'Weekly-Monday': 1, 'Weekly-Tuesday': 2, 
        'Weekly-Wednesday': 3, 'Weekly-Thursday': 4, 'Weekly-Friday': 5, 'Weekly-Saturday': 6
      };
      
      for (const dayStr of days) {
        const dayOfWeek = dayMap[dayStr];
        if (dayOfWeek !== undefined) {
          // Create weekly recurring schedule for next 12 weeks
          const today = new Date();
          for (let i = 0; i < 84; i++) { // 12 weeks
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            if (date.getDay() === dayOfWeek) {
              await supabase
                .from('vendor_menu_schedules')
                .insert({
                  vendor_id: vendorId,
                  menu_item_id: menuItemId,
                  availability_date: date.toISOString().split('T')[0],
                  schedule_type: 'weekly',
                  day_of_week: dayOfWeek,
                  is_active: true
                });
            }
          }
        }
      }
    } else {
      // Specific date
      await supabase
        .from('vendor_menu_schedules')
        .insert({
          vendor_id: vendorId,
          menu_item_id: menuItemId,
          availability_date: dateStr,
          schedule_type: 'specific',
          is_active: true
        });
    }
  };

  return {
    isProcessing,
    uploadProgress,
    validationErrors,
    parsedData,
    parseExcelFile,
    processImport,
    setValidationErrors
  };
};