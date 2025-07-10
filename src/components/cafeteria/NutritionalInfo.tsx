import React from 'react';
import { Info, Zap, Wheat, Droplets } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface NutritionalInfoProps {
  item: {
    name: string;
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    allergens?: string[];
    ingredients?: string[];
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    spice_level?: string;
  };
}

const NutritionalInfo: React.FC<NutritionalInfoProps> = ({ item }) => {
  const macronutrients = [
    { name: 'Protein', value: item.protein || 0, color: 'bg-blue-500', unit: 'g' },
    { name: 'Carbs', value: item.carbs || 0, color: 'bg-green-500', unit: 'g' },
    { name: 'Fat', value: item.fat || 0, color: 'bg-yellow-500', unit: 'g' },
  ];

  const totalMacros = macronutrients.reduce((sum, macro) => sum + macro.value, 0);

  const getDietaryBadges = () => {
    const badges = [];
    if (item.is_vegetarian) badges.push({ label: 'Vegetarian', color: 'bg-green-500' });
    if (item.is_vegan) badges.push({ label: 'Vegan', color: 'bg-green-600' });
    if (item.is_gluten_free) badges.push({ label: 'Gluten Free', color: 'bg-blue-500' });
    return badges;
  };

  const getSpiceLevel = () => {
    const level = item.spice_level || 'mild';
    const spiceMap = {
      mild: { dots: 1, color: 'text-green-500' },
      medium: { dots: 2, color: 'text-yellow-500' },
      hot: { dots: 3, color: 'text-red-500' },
      very_hot: { dots: 4, color: 'text-red-600' },
    };
    
    return spiceMap[level as keyof typeof spiceMap] || spiceMap.mild;
  };

  const spiceLevel = getSpiceLevel();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dietary Information */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              Dietary Info
            </h4>
            <div className="flex flex-wrap gap-2">
              {getDietaryBadges().map((badge) => (
                <Badge key={badge.label} className={`${badge.color} text-white`}>
                  {badge.label}
                </Badge>
              ))}
              {item.spice_level && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">Spice:</span>
                  <div className="flex">
                    {[1, 2, 3, 4].map((dot) => (
                      <div
                        key={dot}
                        className={`w-2 h-2 rounded-full mr-1 ${
                          dot <= spiceLevel.dots ? spiceLevel.color : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nutritional Information */}
          {item.calories && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Nutrition (per serving)
              </h4>
              
              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{item.calories}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                </div>
              </div>

              {/* Macronutrients */}
              {totalMacros > 0 && (
                <div className="space-y-3">
                  {macronutrients.map((macro) => (
                    <div key={macro.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{macro.name}</span>
                        <span>{macro.value}{macro.unit}</span>
                      </div>
                      <Progress 
                        value={totalMacros > 0 ? (macro.value / totalMacros) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Nutrients */}
              {(item.fiber || item.sugar || item.sodium) && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  {item.fiber && (
                    <div className="text-center">
                      <div className="font-medium">{item.fiber}g</div>
                      <div className="text-xs text-muted-foreground">Fiber</div>
                    </div>
                  )}
                  {item.sugar && (
                    <div className="text-center">
                      <div className="font-medium">{item.sugar}g</div>
                      <div className="text-xs text-muted-foreground">Sugar</div>
                    </div>
                  )}
                  {item.sodium && (
                    <div className="text-center">
                      <div className="font-medium">{item.sodium}mg</div>
                      <div className="text-xs text-muted-foreground">Sodium</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Ingredients
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.ingredients.join(', ')}
              </p>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-red-600">⚠️ Allergens</h4>
              <div className="flex flex-wrap gap-1">
                {item.allergens.map((allergen) => (
                  <Badge key={allergen} variant="destructive" className="text-xs">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionalInfo;