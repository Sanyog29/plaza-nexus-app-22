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
    price: 12.64,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '2',
    name: 'French Fries',
    price: 7.50,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '3',
    name: 'Roast Beef',
    price: 29.00,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '4',
    name: 'Sauerkraut',
    price: 11.55,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '5',
    name: 'Beef Kebab',
    price: 14.95,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: false,
    category_id: '2'
  },
  {
    id: '6',
    name: 'Fish and Chips',
    price: 23.05,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '7',
    name: 'Wagyu Steak',
    price: 31.17,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '8',
    name: 'Chicken Ramen',
    price: 17.70,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '9',
    name: 'Pasta Bolognese',
    price: 23.50,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
  {
    id: '10',
    name: 'Vegetable Salad',
    price: 15.41,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '4'
  },
  {
    id: '11',
    name: 'Grilled Skewers',
    price: 17.25,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: false,
    category_id: '4'
  },
  {
    id: '12',
    name: 'Fried Rice',
    price: 19.50,
    image_url: '/lovable-uploads/a8643d64-0d23-44d1-89a1-8dcb97e8f718.png',
    is_available: true,
    category_id: '2'
  },
];