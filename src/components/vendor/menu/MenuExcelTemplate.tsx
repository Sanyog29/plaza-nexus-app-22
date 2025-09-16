import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MenuExcelTemplateProps {
  vendorId?: string;
}

const MenuExcelTemplate: React.FC<MenuExcelTemplateProps> = ({ vendorId }) => {
  const generateTemplate = () => {
    // Sample categories data
    const categoriesData = [
      {
        'Category Name': 'Breakfast',
        'Description': 'Morning meals and beverages',
        'Display Order': 1,
        'Image URL': 'https://example.com/breakfast.jpg'
      },
      {
        'Category Name': 'Lunch',
        'Description': 'Midday meals and combos',
        'Display Order': 2,
        'Image URL': 'https://example.com/lunch.jpg'
      },
      {
        'Category Name': 'Dinner',
        'Description': 'Evening meals and specials',
        'Display Order': 3,
        'Image URL': 'https://example.com/dinner.jpg'
      },
      {
        'Category Name': 'Beverages',
        'Description': 'Hot and cold drinks',
        'Display Order': 4,
        'Image URL': 'https://example.com/beverages.jpg'
      },
      {
        'Category Name': 'Snacks',
        'Description': 'Light bites and appetizers',
        'Display Order': 5,
        'Image URL': 'https://example.com/snacks.jpg'
      }
    ];

    // Sample menu items data
    const menuItemsData = [
      {
        'Category Name': 'Breakfast',
        'Item Name': 'Masala Dosa',
        'Description': 'Crispy crepe with spiced potato filling',
        'Full Plate Price': 80,
        'Half Plate Price': 50,
        'Availability': true,
        'Date': '2025-09-16',
        'Preparation Time (minutes)': 15,
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian,Gluten-Free',
        'Allergens': 'None',
        'Image URL': 'https://example.com/masala-dosa.jpg'
      },
      {
        'Category Name': 'Breakfast',
        'Item Name': 'Idli Sambar',
        'Description': 'Steamed rice cakes with lentil curry',
        'Full Plate Price': 60,
        'Half Plate Price': 40,
        'Availability': true,
        'Date': '2025-09-16',
        'Preparation Time (minutes)': 10,
        'Spice Level': 'Mild',
        'Dietary Tags': 'Vegetarian,Vegan',
        'Allergens': 'None',
        'Image URL': 'https://example.com/idli-sambar.jpg'
      },
      {
        'Category Name': 'Lunch',
        'Item Name': 'Paneer Butter Masala',
        'Description': 'Rich cottage cheese curry with butter naan',
        'Full Plate Price': 180,
        'Half Plate Price': 120,
        'Availability': true,
        'Date': '2025-09-16',
        'Preparation Time (minutes)': 20,
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian',
        'Allergens': 'Dairy,Gluten',
        'Image URL': 'https://example.com/paneer-butter-masala.jpg'
      },
      {
        'Category Name': 'Lunch',
        'Item Name': 'Chicken Biryani',
        'Description': 'Aromatic basmati rice with tender chicken',
        'Full Plate Price': 220,
        'Half Plate Price': 150,
        'Availability': true,
        'Date': '2025-09-17',
        'Preparation Time (minutes)': 25,
        'Spice Level': 'Hot',
        'Dietary Tags': 'Non-Vegetarian',
        'Allergens': 'None',
        'Image URL': 'https://example.com/chicken-biryani.jpg'
      },
      {
        'Category Name': 'Beverages',
        'Item Name': 'Masala Chai',
        'Description': 'Traditional spiced tea',
        'Full Plate Price': 25,
        'Half Plate Price': '',
        'Availability': true,
        'Date': 'Daily',
        'Preparation Time (minutes)': 5,
        'Spice Level': 'Mild',
        'Dietary Tags': 'Vegetarian',
        'Allergens': 'Dairy',
        'Image URL': 'https://example.com/masala-chai.jpg'
      },
      {
        'Category Name': 'Snacks',
        'Item Name': 'Samosa',
        'Description': 'Crispy triangular pastry with savory filling',
        'Full Plate Price': 15,
        'Half Plate Price': '',
        'Availability': true,
        'Date': 'Weekly-Monday,Weekly-Wednesday,Weekly-Friday',
        'Preparation Time (minutes)': 8,
        'Spice Level': 'Medium',
        'Dietary Tags': 'Vegetarian',
        'Allergens': 'Gluten',
        'Image URL': 'https://example.com/samosa.jpg'
      }
    ];

    // Instructions data
    const instructionsData = [
      {
        'Field': 'Category Name',
        'Required': 'Yes',
        'Format': 'Text',
        'Example': 'Breakfast, Lunch, Dinner',
        'Notes': 'Categories will be auto-created if they don\'t exist'
      },
      {
        'Field': 'Item Name',
        'Required': 'Yes',
        'Format': 'Text',
        'Example': 'Masala Dosa, Chicken Biryani',
        'Notes': 'Must be unique within the same category'
      },
      {
        'Field': 'Full Plate Price',
        'Required': 'Yes',
        'Format': 'Number',
        'Example': '80, 150, 220',
        'Notes': 'Price for full portion in rupees, must be greater than 0'
      },
      {
        'Field': 'Half Plate Price',
        'Required': 'No',
        'Format': 'Number',
        'Example': '50, 100, 150',
        'Notes': 'Price for half portion in rupees (optional), should be less than full plate price'
      },
      {
        'Field': 'Availability',
        'Required': 'Yes',
        'Format': 'Boolean',
        'Example': 'true, false, TRUE, FALSE',
        'Notes': 'Whether the item is currently available'
      },
      {
        'Field': 'Date',
        'Required': 'No',
        'Format': 'Various',
        'Example': '2025-09-16, Daily, Weekly-Monday',
        'Notes': 'Specific date (YYYY-MM-DD), Daily for all days, Weekly-[Day] for weekly recurring'
      },
      {
        'Field': 'Dietary Tags',
        'Required': 'No',
        'Format': 'Comma-separated',
        'Example': 'Vegetarian,Vegan,Gluten-Free',
        'Notes': 'Multiple tags separated by commas'
      },
      {
        'Field': 'Allergens',
        'Required': 'No',
        'Format': 'Comma-separated',
        'Example': 'Dairy,Nuts,Gluten',
        'Notes': 'Common allergens, use "None" if no allergens'
      }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add Categories sheet
    const categoriesWs = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(wb, categoriesWs, 'Categories');

    // Add Menu Items sheet
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
          The template includes three sheets: Categories, Menu Items, and Instructions.
        </p>
      </div>
      
      <div className="bg-muted/50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Template Features:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Sample categories (Breakfast, Lunch, Dinner, Beverages, Snacks)</li>
          <li>• Example menu items with both full and half plate pricing</li>
          <li>• Date format examples (specific dates, daily, weekly recurring)</li>
          <li>• Dietary tags and allergen information</li>
          <li>• Detailed instructions sheet with field descriptions</li>
          <li>• Support for optional half plate pricing</li>
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