-- Add island column to events for multi-island Caribbean expansion
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS island TEXT NOT NULL DEFAULT 'tt';

COMMENT ON COLUMN events.island IS 'ISO-style island code: tt=Trinidad & Tobago, jm=Jamaica, bb=Barbados, etc.';

-- Index for efficient island-filtered queries on the discover page
CREATE INDEX IF NOT EXISTS idx_events_island ON events (island);
CREATE INDEX IF NOT EXISTS idx_events_island_status ON events (island, status, starts_at);
