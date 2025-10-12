-- Insert "All floors" option into building_floors table
INSERT INTO public.building_floors (name, description, floor_number, is_active, sort_order)
VALUES (
  'All floors',
  'Option for requests spanning multiple floors or general building-wide issues',
  NULL,
  true,
  -1
)
ON CONFLICT DO NOTHING;