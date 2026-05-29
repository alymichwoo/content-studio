-- Content Studio initial schema

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE pillar AS ENUM ('train', 'live', 'think', 'feel', 'fuel');
CREATE TYPE platform AS ENUM ('tiktok', 'instagram', 'linkedin');
CREATE TYPE post_status AS ENUM ('idea', 'drafting', 'ready', 'scheduled', 'posted');
CREATE TYPE post_type AS ENUM ('reel', 'carousel', 'story', 'static', 'video');
CREATE TYPE schedule_type AS ENUM ('event', 'travel', 'competition', 'launch', 'personal');
CREATE TYPE brand_status AS ENUM ('prospect', 'active', 'past');
CREATE TYPE campaign_status AS ENUM ('pitching', 'negotiating', 'active', 'delivered', 'wrapped');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  handle text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  contact_name text,
  contact_email text,
  logo_url text,
  notes text,
  status brand_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands (id) ON DELETE CASCADE,
  title text NOT NULL,
  status campaign_status NOT NULL,
  start_date date,
  end_date date,
  brief text,
  compensation text,
  payment_status payment_status NOT NULL,
  disclosure_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  platform platform NOT NULL,
  post_type post_type NOT NULL,
  quantity_required integer NOT NULL,
  due_date date,
  notes text
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text,
  caption text,
  hook text,
  notes text,
  platforms platform[] NOT NULL DEFAULT '{}',
  pillar pillar,
  post_type post_type,
  series text,
  status post_status,
  scheduled_date date,
  posted_date date,
  deliverable_id uuid REFERENCES deliverables (id) ON DELETE SET NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  type schedule_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  platform platform NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  views integer,
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  impressions integer,
  reach integer,
  reactions integer,
  reposts integer,
  follows_gained integer,
  profile_visits integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX posts_user_id_scheduled_date_idx ON posts (user_id, scheduled_date);
CREATE INDEX schedule_items_user_id_start_date_end_date_idx ON schedule_items (user_id, start_date, end_date);
CREATE INDEX metrics_post_id_idx ON metrics (post_id);
CREATE INDEX deliverables_campaign_id_idx ON deliverables (campaign_id);
CREATE INDEX campaigns_brand_id_idx ON campaigns (brand_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own_row ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY brands_own_rows ON brands
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY campaigns_own_rows ON campaigns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY deliverables_own_rows ON deliverables
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_own_rows ON posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY schedule_items_own_rows ON schedule_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY metrics_own_rows ON metrics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'handle'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
