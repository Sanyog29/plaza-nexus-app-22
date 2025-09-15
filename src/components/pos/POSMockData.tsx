// Mock data for POS system until database is properly seeded

export const mockMenuCategories = [
  { id: '1', name: 'Beverages', display_order: 1 },
  { id: '2', name: 'Main Course', display_order: 2 },
  { id: '3', name: 'Dessert', display_order: 3 },
  { id: '4', name: 'Appetizer', display_order: 4 },
];

export const mockMenuItems = [
  {
    id: '1',
    name: 'Butter Chicken',
    price: 1012.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '2',
    name: 'French Fries',
    price: 600.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '3',
    name: 'Roast Beef',
    price: 2320.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '4',
    name: 'Sauerkraut',
    price: 924.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '5',
    name: 'Beef Kebab',
    price: 1196.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: false,
    category_id: '2'
  },
  {
    id: '6',
    name: 'Fish and Chips',
    price: 1844.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '7',
    name: 'Wagyu Steak',
    price: 2494.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '8',
    name: 'Chicken Ramen',
    price: 1416.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '9',
    name: 'Pasta Bolognese',
    price: 1880.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '10',
    name: 'Vegetable Salad',
    price: 1233.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '4'
  },
  {
    id: '11',
    name: 'Grilled Skewers',
    price: 1380.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: false,
    category_id: '4'
  },
  {
    id: '12',
    name: 'Fried Rice',
    price: 1560.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
];