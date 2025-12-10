-- Remove extra property assignments for Vasant Raj (keep only Rabale)
DELETE FROM property_assignments 
WHERE user_id = '8d0f7a59-8229-465f-a0a6-674465a22231'
  AND property_id != '0c4e0804-503d-456a-ac7c-1f0178bde8ca';