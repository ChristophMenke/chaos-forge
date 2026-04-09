-- Remove magic items from general_items table.
-- These are now properly catalogued in the magic_items table (migration 00194/00195)
-- with full magic_effects. Keeping them in general_items caused confusion:
-- players could add them to inventory (no effects) instead of equipment.

-- First remove any character_inventory entries referencing magic general_items
DELETE FROM character_inventory
WHERE item_id IN (
  SELECT id FROM general_items WHERE category = 'magic'
);

-- Then remove the general_items entries themselves
DELETE FROM general_items WHERE category = 'magic';
