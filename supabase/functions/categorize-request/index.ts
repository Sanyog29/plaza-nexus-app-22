
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categories = [
  { id: 'maintenance', name: 'Maintenance', keywords: ['fix', 'broken', 'repair', 'not working'] },
  { id: 'cleaning', name: 'Housekeeping', keywords: ['clean', 'dirty', 'mess', 'spill', 'trash'] },
  { id: 'it', name: 'IT Support', keywords: ['computer', 'internet', 'wifi', 'network', 'printer'] },
  { id: 'security', name: 'Security', keywords: ['safety', 'threat', 'suspicious', 'door', 'access'] },
  { id: 'hvac', name: 'HVAC', keywords: ['cold', 'hot', 'temperature', 'ac', 'heat', 'air', 'conditioning', 'ventilation'] },
  { id: 'electrical', name: 'Electrical', keywords: ['light', 'power', 'outlet', 'electricity', 'switch', 'bulb'] },
  { id: 'plumbing', name: 'Plumbing', keywords: ['water', 'leak', 'drain', 'toilet', 'sink', 'pipe', 'flooding'] },
  { id: 'other', name: 'Other', keywords: [] }
];

// Helper function to categorize based on text content
function categorizeRequest(title: string, description: string): string {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // For each category, count the number of keyword matches
  const matches = categories.map(category => {
    if (category.id === 'other') return { id: category.id, name: category.name, count: 0 };
    
    let count = 0;
    category.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) count += matches.length;
    });
    
    return { id: category.id, name: category.name, count };
  });
  
  // Sort by match count (descending)
  matches.sort((a, b) => b.count - a.count);
  
  // Return the category with the most matches (or 'other' if no matches)
  return matches[0].count > 0 ? matches[0].id : 'other';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();
    
    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: 'Both title and description are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const suggestedCategory = categorizeRequest(title, description);
    
    return new Response(
      JSON.stringify({ 
        category: suggestedCategory,
        confidence: 'medium', // In a real AI implementation, we would have actual confidence scores
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in categorize-request function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
