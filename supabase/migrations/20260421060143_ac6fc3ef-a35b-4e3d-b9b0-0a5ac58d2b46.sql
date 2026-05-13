
-- =========================================================
-- 1. ROLE SYSTEM
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('brand', 'influencer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'influencer',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own role" ON public.user_roles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create user_roles row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, onboarded)
  VALUES (NEW.id, 'influencer', false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Backfill existing users
INSERT INTO public.user_roles (user_id, role, onboarded)
SELECT id, 'influencer', false FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================
-- 2. BRANDS
-- =========================================================
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  industry text,
  website text,
  logo_url text,
  bio text,
  instagram_handle text,
  youtube_channel text,
  target_age_min int DEFAULT 18,
  target_age_max int DEFAULT 45,
  target_gender text DEFAULT 'mixed',
  target_cities text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can view brand profiles (needed for marketplace cards)
CREATE POLICY "Authenticated can view brands" ON public.brands
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert brand" ON public.brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update brand" ON public.brands
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete brand" ON public.brands
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3. INFLUENCER PROFILES
-- =========================================================
CREATE TABLE public.influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  city text,
  niches text[] DEFAULT '{}',
  instagram_handle text,
  instagram_followers bigint DEFAULT 0,
  youtube_channel_url text,
  youtube_subscribers bigint DEFAULT 0,
  x_handle text,
  x_followers bigint DEFAULT 0,
  engagement_rate numeric(5,2),
  authenticity_score numeric(4,1),
  rates_json jsonb DEFAULT '{}'::jsonb,
  payout_details_json jsonb DEFAULT '{}'::jsonb,
  avatar_url text,
  is_verified boolean DEFAULT false,
  total_campaigns_completed int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view influencer profiles" ON public.influencer_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert influencer profile" ON public.influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update influencer profile" ON public.influencer_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete influencer profile" ON public.influencer_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_influencer_profiles_updated_at
BEFORE UPDATE ON public.influencer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. EXTEND CAMPAIGNS TABLE
-- =========================================================
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_url text,
  ADD COLUMN IF NOT EXISTS product_image text,
  ADD COLUMN IF NOT EXISTS deliverables text,
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_followers bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Allow influencers to view PUBLISHED campaigns
CREATE POLICY "Authenticated can view published campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (is_published = true);

-- =========================================================
-- 5. CAMPAIGN REQUESTS (influencer pitches)
-- =========================================================
CREATE TYPE public.request_status AS ENUM (
  'pending', 'reviewing', 'accepted', 'rejected', 'contracted', 'withdrawn'
);

CREATE TABLE public.campaign_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  pitch_message text NOT NULL,
  proposed_rate numeric,
  platforms text[] DEFAULT '{}',
  portfolio_links text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, influencer_id)
);

ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;

-- Influencer policies (own pitches)
CREATE POLICY "Influencer view own pitches" ON public.campaign_requests
  FOR SELECT USING (auth.uid() = influencer_id);
CREATE POLICY "Influencer insert own pitch" ON public.campaign_requests
  FOR INSERT WITH CHECK (auth.uid() = influencer_id);
CREATE POLICY "Influencer update own pitch" ON public.campaign_requests
  FOR UPDATE USING (auth.uid() = influencer_id);
CREATE POLICY "Influencer delete own pitch" ON public.campaign_requests
  FOR DELETE USING (auth.uid() = influencer_id);

-- Brand policies (pitches on their own campaigns)
CREATE POLICY "Brand view received pitches" ON public.campaign_requests
  FOR SELECT USING (auth.uid() = brand_user_id);
CREATE POLICY "Brand update received pitches" ON public.campaign_requests
  FOR UPDATE USING (auth.uid() = brand_user_id);

CREATE TRIGGER update_campaign_requests_updated_at
BEFORE UPDATE ON public.campaign_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_campaign_requests_influencer ON public.campaign_requests(influencer_id);
CREATE INDEX idx_campaign_requests_brand ON public.campaign_requests(brand_user_id);
CREATE INDEX idx_campaign_requests_campaign ON public.campaign_requests(campaign_id);
CREATE INDEX idx_campaigns_published ON public.campaigns(is_published) WHERE is_published = true;
