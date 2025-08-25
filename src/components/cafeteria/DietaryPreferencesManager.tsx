import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UtensilsCrossed, AlertTriangle, Heart, Leaf } from "lucide-react";

const dietarySchema = z.object({
  dietary_restrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferred_cuisines: z.array(z.string()).optional(),
  spice_tolerance: z.enum(["none", "mild", "medium", "hot", "very_hot"]).optional(),
});

type DietaryFormData = z.infer<typeof dietarySchema>;

interface DietaryPreferences {
  id: string;
  dietary_restrictions: string[] | null;
  allergies: string[] | null;
  preferred_cuisines: string[] | null;
  spice_tolerance: string | null;
  meal_preferences: any;
  notification_preferences: any;
}

const commonDietaryRestrictions = [
  "Vegetarian", "Vegan", "Halal", "Kosher", "Keto", "Paleo", 
  "Gluten-Free", "Dairy-Free", "Sugar-Free", "Low-Sodium", "Low-Carb"
];

const commonAllergies = [
  "Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", 
  "Fish", "Sesame", "Sulfites", "MSG", "Corn"
];

const cuisineTypes = [
  "Indian", "Chinese", "Italian", "Mexican", "Thai", "Japanese", 
  "Mediterranean", "American", "Continental", "South Indian", "North Indian"
];

export function DietaryPreferencesManager() {
  const [preferences, setPreferences] = useState<DietaryPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<DietaryFormData>({
    resolver: zodResolver(dietarySchema),
    defaultValues: {
      dietary_restrictions: [],
      allergies: [],
      preferred_cuisines: [],
      spice_tolerance: "medium",
    },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from("dietary_preferences")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences(data);
        form.reset({
          dietary_restrictions: data.dietary_restrictions || [],
          allergies: data.allergies || [],
          preferred_cuisines: data.preferred_cuisines || [],
          spice_tolerance: (data.spice_tolerance || "medium") as "none" | "mild" | "medium" | "hot" | "very_hot",
        });
      }
    } catch (error) {
      console.error("Error fetching dietary preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load dietary preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DietaryFormData) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const upsertData = {
        user_id: user.user.id,
        dietary_restrictions: data.dietary_restrictions || [],
        allergies: data.allergies || [],
        preferred_cuisines: data.preferred_cuisines || [],
        spice_tolerance: data.spice_tolerance || "medium",
        meal_preferences: {},
        notification_preferences: {
          new_items: true,
          daily_specials: true,
          allergen_alerts: true,
        },
      };

      // Use upsert to handle unique constraint elegantly
      const { error } = await supabase
        .from("dietary_preferences")
        .upsert(upsertData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        // Handle constraint violations gracefully
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.warn('Preferences already exist, updating instead:', error);
          // Try a direct update as fallback
          const { error: updateError } = await supabase
            .from("dietary_preferences")
            .update(upsertData)
            .eq("user_id", user.user.id);
          
          if (updateError) {
            console.error("Fallback update failed:", updateError);
            throw updateError;
          }
        } else {
          console.error("Database operation error:", error);
          throw error;
        }
      }

      toast({
        title: "Preferences saved",
        description: "Your dietary preferences have been updated successfully",
      });

      fetchPreferences();
    } catch (error) {
      console.error("Error saving dietary preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save dietary preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (
    fieldName: keyof DietaryFormData,
    value: string,
    checked: boolean
  ) => {
    const currentValues = form.getValues(fieldName) as string[] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    form.setValue(fieldName, newValues);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Dietary Preferences</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dietary Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                Dietary Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dietary_restrictions"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {commonDietaryRestrictions.map((restriction) => (
                        <FormItem key={restriction} className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={(form.watch("dietary_restrictions") || []).includes(restriction)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange("dietary_restrictions", restriction, checked as boolean)
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {restriction}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Allergies & Intolerances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="allergies"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {commonAllergies.map((allergy) => (
                        <FormItem key={allergy} className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={(form.watch("allergies") || []).includes(allergy)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange("allergies", allergy, checked as boolean)
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {allergy}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferred Cuisines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600" />
                Preferred Cuisines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferred_cuisines"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {cuisineTypes.map((cuisine) => (
                        <FormItem key={cuisine} className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={(form.watch("preferred_cuisines") || []).includes(cuisine)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange("preferred_cuisines", cuisine, checked as boolean)
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {cuisine}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Spice Tolerance */}
          <Card>
            <CardHeader>
              <CardTitle>Spice Tolerance</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="spice_tolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your spice tolerance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Spice</SelectItem>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="very_hot">Very Hot</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Current Preferences Summary */}
          {preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Current Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Dietary Restrictions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {preferences.dietary_restrictions.map((restriction, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.allergies && preferences.allergies.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Allergies:</h5>
                    <div className="flex flex-wrap gap-2">
                      {preferences.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_cuisines && preferences.preferred_cuisines.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Preferred Cuisines:</h5>
                    <div className="flex flex-wrap gap-2">
                      {preferences.preferred_cuisines.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="text-blue-700 border-blue-200">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.spice_tolerance && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Spice Tolerance:</h5>
                    <Badge variant="outline">
                      {preferences.spice_tolerance.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Dietary Preferences"}
          </Button>
        </form>
      </Form>
    </div>
  );
}