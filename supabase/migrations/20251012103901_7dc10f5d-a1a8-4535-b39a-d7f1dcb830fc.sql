-- Add Cafeteria floor to building_floors
INSERT INTO public.building_floors (name, description, floor_number, is_active, sort_order)
VALUES ('Cafeteria', 'Cafeteria dining area', 0, true, 10)
ON CONFLICT DO NOTHING;