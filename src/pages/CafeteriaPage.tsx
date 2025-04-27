
import React from 'react';
import { Coffee, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample menu data
const menuData = {
  date: "Tuesday, April 27",
  specials: [
    {
      id: 'special-001',
      name: 'Teriyaki Bowl',
      description: 'Glazed chicken, vegetables, and rice',
      price: 12.99,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500&h=300'
    }
  ],
  categories: [
    {
      id: 'cat-001',
      name: 'Main Course',
      items: [
        {
          id: 'item-001',
          name: 'Grilled Chicken Salad',
          description: 'Fresh greens with grilled chicken breast',
          price: 9.99,
          isVeg: false,
        },
        {
          id: 'item-002',
          name: 'Paneer Tikka',
          description: 'Spiced cottage cheese with vegetables',
          price: 8.99,
          isVeg: true,
        }
      ]
    },
    {
      id: 'cat-002',
      name: 'Beverages',
      items: [
        {
          id: 'item-003',
          name: 'Fresh Lime Soda',
          description: 'Refreshing lime soda, sweet or salty',
          price: 2.99,
          isVeg: true,
        },
        {
          id: 'item-004',
          name: 'Cold Coffee',
          description: 'Creamy cold coffee with ice cream',
          price: 3.99,
          isVeg: true,
        }
      ]
    }
  ]
};

const CafeteriaPage = () => {
  return (
    <div className="pb-6">
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-plaza-dark">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1470&h=400" 
            alt="Cafeteria" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="absolute bottom-0 left-0 p-4">
          <h2 className="text-2xl font-bold text-white">Terrace Café</h2>
          <p className="text-gray-300">SS Plaza · 12th Floor</p>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Special</h3>
          <span className="text-sm text-gray-400">{menuData.date}</span>
        </div>
        
        {menuData.specials.map((special) => (
          <div 
            key={special.id} 
            className="bg-card rounded-lg overflow-hidden card-shadow mb-8"
          >
            <img 
              src={special.image} 
              alt={special.name} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white text-lg">{special.name}</h4>
                  <p className="text-sm text-gray-400">{special.description}</p>
                </div>
                <div className="flex items-center bg-plaza-blue bg-opacity-20 px-2 py-1 rounded">
                  <Star size={16} className="text-plaza-blue mr-1 fill-plaza-blue" />
                  <span className="text-sm text-plaza-blue">{special.rating}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-medium text-white">${special.price}</span>
                <Button className="bg-plaza-blue hover:bg-blue-700">
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {menuData.categories.map((category) => (
          <div key={category.id} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">{category.name}</h3>
            <div className="space-y-4">
              {category.items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-card rounded-lg p-4 card-shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-white">{item.name}</h4>
                        {item.isVeg && (
                          <span className="ml-2 w-4 h-4 rounded-full border border-green-500 flex items-center justify-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white">${item.price}</span>
                      <Button variant="ghost" size="sm" className="mt-2 hover:bg-plaza-blue hover:text-white">
                        <Coffee size={16} className="mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CafeteriaPage;
