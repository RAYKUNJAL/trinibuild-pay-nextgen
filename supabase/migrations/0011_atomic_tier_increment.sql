-- Atomic, oversell-safe tier quantity increment.
-- The capacity check lives inside the UPDATE's WHERE clause so Postgres
-- serializes concurrent UPDATEs on the same row and only the increments
-- that actually fit will apply. No SELECT FOR UPDATE needed.

DROP FUNCTION IF EXISTS increment_tier_quantity_sold(uuid, int);

CREATE OR REPLACE FUNCTION increment_tier_quantity_sold(tier_id uuid, qty int)
RETURNS void AS $$
DECLARE
  updated_rows int;
BEGIN
  IF qty < 0 THEN
    UPDATE ticket_tiers
    SET quantity_sold = GREATEST(quantity_sold + qty, 0),
        updated_at = now()
    WHERE id = tier_id;
    RETURN;
  END IF;

  UPDATE ticket_tiers
  SET quantity_sold = quantity_sold + qty,
      updated_at = now()
  WHERE id = tier_id
    AND quantity_sold + qty <= quantity;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RAISE EXCEPTION 'tier_sold_out' USING ERRCODE = 'check_violation';
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  ALTER TABLE ticket_tiers
    ADD CONSTRAINT ticket_tiers_no_oversell CHECK (quantity_sold <= quantity);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
