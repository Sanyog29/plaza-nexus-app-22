-- Clean up duplicate purchase orders
-- Keep the first PO (earliest created_at) for each requisition and delete the rest

-- Delete purchase_order_items for duplicate POs
DELETE FROM purchase_order_items
WHERE po_id IN (
  SELECT po.id
  FROM purchase_orders po
  INNER JOIN (
    SELECT requisition_list_id, MIN(created_at) as first_created_at
    FROM purchase_orders
    GROUP BY requisition_list_id
    HAVING COUNT(*) > 1
  ) first_po ON po.requisition_list_id = first_po.requisition_list_id
  WHERE po.created_at > first_po.first_created_at
);

-- Delete duplicate purchase orders (keeping the first one)
DELETE FROM purchase_orders
WHERE id IN (
  SELECT po.id
  FROM purchase_orders po
  INNER JOIN (
    SELECT requisition_list_id, MIN(created_at) as first_created_at
    FROM purchase_orders
    GROUP BY requisition_list_id
    HAVING COUNT(*) > 1
  ) first_po ON po.requisition_list_id = first_po.requisition_list_id
  WHERE po.created_at > first_po.first_created_at
);

-- Now add the unique index to prevent future duplicates
CREATE UNIQUE INDEX purchase_orders_requisition_unique 
ON purchase_orders(requisition_list_id);

-- Add comment explaining the constraint
COMMENT ON INDEX purchase_orders_requisition_unique IS 'Ensures each requisition can only have one purchase order';