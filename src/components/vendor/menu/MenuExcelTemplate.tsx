import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MenuExcelTemplateProps {
  vendorId?: string;
}

const MenuExcelTemplate: React.FC<MenuExcelTemplateProps> = ({ vendorId }) => {
  const generateTemplate = () => {
    // Sample menu items data in user's preferred format
    const menuItemsData = [
      {
        'Date': '16th Sep',
        'Meal Type': 'Breakfast',
        'Category': 'South Indian',
        'Item Name': 'Masala Dosa',
        'Price': 80,
        'Half Plate': 50,
        'Description': 'Crispy crepe with spiced potato filling',
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian,Gluten-Free'
      },
      {
        'Date': '16th Sep',
        'Meal Type': 'Breakfast',
        'Category': 'South Indian',
        'Item Name': 'Idli Sambar',
        'Price': 60,
        'Half Plate': 40,
        'Description': 'Steamed rice cakes with lentil curry',
        'Spice Level': 'Mild',
        'Dietary Tags': 'Vegetarian,Vegan'
      },
      {
        'Date': '17th Sep',
        'Meal Type': 'Lunch',
        'Category': 'North Indian',
        'Item Name': 'Paneer Butter Masala',
        'Price': 180,
        'Half Plate': 120,
        'Description': 'Rich cottage cheese curry',
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian'
      },
      {
        'Date': 'Daily',
        'Meal Type': 'Anytime',
        'Category': 'Beverages',
        'Item Name': 'Masala Chai',
        'Price': 25,
        'Half Plate': '',
        'Description': 'Traditional spiced tea',
        'Spice Level': 'Mild',
        'Dietary Tags': 'Vegetarian'
      },
      {
        'Date': 'Weekly-Monday,Weekly-Friday',
        'Meal Type': 'Snacks',
        'Category': 'Street Food',
        'Item Name': 'Samosa',
        'Price': 15,
        'Half Plate': '',
        'Description': 'Crispy triangular pastry',
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian'
      }
    ];

    // Instructions data for single sheet approach
    const instructionsData = [
      {
        'Field': 'Date',
        'Required': 'No',
        'Format': 'Flexible',
        'Example': '16th Sep, 2025-09-16, Daily, Weekly-Monday',
        'Notes': 'Human-friendly dates like "16th Sep" will be converted to current year. Also accepts YYYY-MM-DD, Daily, or Weekly-[Day]'
      },
      {
        'Field': 'Meal Type',
        'Required': 'No',
        'Format': 'Text',
        'Example': 'Breakfast, Lunch, Dinner, Snacks, Anytime',
        'Notes': 'Type of meal for categorization'
      },
      {
        'Field': 'Category',
        'Required': 'Yes',
        'Format': 'Text',
        'Example': 'South Indian, North Indian, Beverages, Street Food',
        'Notes': 'Categories will be auto-created if they don\'t exist. No separate Categories sheet needed'
      },
      {
        'Field': 'Item Name',
        'Required': 'Yes',
        'Format': 'Text',
        'Example': 'Masala Dosa, Chicken Biryani',
        'Notes': 'Must be unique within the same category'
      },
      {
        'Field': 'Price',
        'Required': 'Yes',
        'Format': 'Number/Text',
        'Example': '80, ₹150, 45.00 rs',
        'Notes': 'Accepts numbers or text with currency symbols (₹, rs) which will be automatically cleaned'
      },
      {
        'Field': 'Half Plate',
        'Required': 'No',
        'Format': 'Number/Text',
        'Example': '50, ₹75, 25.00 rs',
        'Notes': 'Price for half portion. Also accepts currency symbols. Leave blank if not applicable'
      },
      {
        'Field': 'Description',
        'Required': 'No',
        'Format': 'Text',
        'Example': 'Crispy crepe with spiced potato filling',
        'Notes': 'Detailed description of the menu item'
      },
      {
        'Field': 'Spice Level',
        'Required': 'No',
        'Format': 'Text',
        'Example': 'Mild, Medium, Hot, Very Hot',
        'Notes': 'Spice level indicator for customers'
      },
      {
        'Field': 'Dietary Tags',
        'Required': 'No',
        'Format': 'Comma-separated',
        'Example': 'Vegetarian,Vegan,Gluten-Free',
        'Notes': 'Multiple dietary tags separated by commas'
      }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add Menu Items sheet (single data sheet)
    const menuItemsWs = XLSX.utils.json_to_sheet(menuItemsData);
    XLSX.utils.book_append_sheet(wb, menuItemsWs, 'Menu Items');

    // Add Instructions sheet
    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Generate and download file
    const fileName = `menu-import-template-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">Excel Template Download</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download a pre-filled Excel template with sample menu data and formatting instructions.
          The template includes two sheets: Menu Items and Instructions.
        </p>
      </div>
      
      <div className="bg-muted/50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Template Features:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Single sheet design with auto-category creation</li>
          <li>• Flexible date formats including human-friendly dates like "16th Sep"</li>
          <li>• Price sanitization supports currency symbols (₹, rs)</li>
          <li>• Example menu items with full and half plate pricing</li>
          <li>• Supports daily, weekly recurring, and specific date scheduling</li>
          <li>• Comprehensive field validation and error reporting</li>
        </ul>
      </div>

      <Button onClick={generateTemplate} className="w-fit">
        <Download className="h-4 w-4 mr-2" />
        Download Template
      </Button>
    </div>
  );
};

export default MenuExcelTemplate;