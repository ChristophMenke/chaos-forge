-- Ergänzt move_to_party_loot um ein actor-Feld im Log-Detail mit dem
-- Charakter-Namen. Damit bleibt die Chronik auch dann lesbar, wenn das
-- Frontend den character_map nicht vollständig geladen hat.

CREATE OR REPLACE FUNCTION move_to_party_loot(
  p_character_id uuid,
  p_source_type text,
  p_source_row_id uuid,
  p_quantity integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loot_id uuid;
  v_item_id uuid;
  v_custom_name text;
  v_available integer;
  v_caller uuid;
  v_weapon_id uuid;
  v_armor_id uuid;
  v_hit_bonus integer;
  v_damage_bonus integer;
  v_magic_effects jsonb;
  v_custom_label text;
  v_magic_item_id uuid;
  v_label text;
  v_actor text;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  SELECT name INTO v_actor FROM characters WHERE id = p_character_id;

  IF p_source_type = 'inventory' THEN
    SELECT item_id, custom_name, quantity
      INTO v_item_id, v_custom_name, v_available
      FROM character_inventory
      WHERE id = p_source_row_id AND character_id = p_character_id
      FOR UPDATE;

    IF v_available IS NULL THEN
      RAISE EXCEPTION 'source_not_found';
    END IF;
    IF p_quantity > v_available THEN
      RAISE EXCEPTION 'insufficient_quantity';
    END IF;

    IF p_quantity = v_available THEN
      DELETE FROM character_inventory WHERE id = p_source_row_id;
    ELSE
      UPDATE character_inventory
        SET quantity = quantity - p_quantity
        WHERE id = p_source_row_id;
    END IF;

    INSERT INTO party_loot_items (
      item_id, custom_name, quantity, added_by,
      source_character_id, source_type, source_row_id
    ) VALUES (
      v_item_id, v_custom_name, p_quantity, v_caller,
      p_character_id, 'inventory', p_source_row_id
    )
    RETURNING id INTO v_loot_id;

    v_label := COALESCE(v_custom_name, (SELECT name FROM general_items WHERE id = v_item_id));

  ELSIF p_source_type = 'equipment' THEN
    IF p_quantity <> 1 THEN
      RAISE EXCEPTION 'equipment_quantity_must_be_one';
    END IF;

    SELECT weapon_id, armor_id, hit_bonus, damage_bonus,
           magic_effects, custom_label, magic_item_id
      INTO v_weapon_id, v_armor_id, v_hit_bonus, v_damage_bonus,
           v_magic_effects, v_custom_label, v_magic_item_id
      FROM character_equipment
      WHERE id = p_source_row_id AND character_id = p_character_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'source_not_found';
    END IF;

    DELETE FROM character_equipment WHERE id = p_source_row_id;

    INSERT INTO party_loot_items (
      item_id, custom_name, quantity, added_by,
      source_character_id, source_type, source_row_id,
      weapon_id, armor_id, hit_bonus, damage_bonus,
      magic_effects, custom_label, magic_item_id
    ) VALUES (
      NULL, NULL, 1, v_caller,
      p_character_id, 'equipment', p_source_row_id,
      v_weapon_id, v_armor_id, v_hit_bonus, v_damage_bonus,
      COALESCE(v_magic_effects, '{}'::jsonb), v_custom_label, v_magic_item_id
    )
    RETURNING id INTO v_loot_id;

    v_label := COALESCE(
      v_custom_label,
      (SELECT name FROM weapons WHERE id = v_weapon_id),
      (SELECT name FROM armor WHERE id = v_armor_id),
      'Equipment'
    );

  ELSE
    RAISE EXCEPTION 'invalid_source_type';
  END IF;

  INSERT INTO party_loot_log (action, user_id, character_id, details)
  VALUES (
    'add_item',
    v_caller,
    p_character_id,
    jsonb_build_object(
      'source_type', p_source_type,
      'quantity', p_quantity,
      'item_name', v_label,
      'actor', v_actor
    )
  );

  RETURN v_loot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION move_to_party_loot(uuid, text, uuid, integer) TO authenticated;
