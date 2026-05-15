-- Blog posts for content marketing and programmatic SEO.
-- Public-readable when status = 'published'. Admins can do everything.

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_mdx TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  island TEXT,                       -- optional: scope a post to one island
  meta_title TEXT,                   -- SEO title override
  meta_description TEXT,             -- SEO description
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'published' | 'archived'
  published_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_island ON blog_posts(island) WHERE island IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
DROP POLICY IF EXISTS blog_select_published ON blog_posts;
CREATE POLICY blog_select_published ON blog_posts FOR SELECT USING (status = 'published');

-- Admin can do everything
DROP POLICY IF EXISTS blog_admin_all ON blog_posts;
CREATE POLICY blog_admin_all ON blog_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update trigger for updated_at (function defined in 0001_init.sql)
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
