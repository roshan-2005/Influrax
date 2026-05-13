-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Update updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  budget NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaign influencers (saved influencers per campaign with status)
CREATE TYPE public.outreach_status AS ENUM ('saved', 'contacted', 'replied');

CREATE TABLE public.campaign_influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id TEXT NOT NULL,
  influencer_name TEXT NOT NULL,
  influencer_handle TEXT,
  influencer_avatar TEXT,
  platform TEXT NOT NULL,
  niche TEXT,
  followers INTEGER,
  engagement_rate NUMERIC,
  authenticity_score INTEGER,
  location TEXT,
  status public.outreach_status NOT NULL DEFAULT 'saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, influencer_id)
);

ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own campaign influencers" ON public.campaign_influencers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campaign influencers" ON public.campaign_influencers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own campaign influencers" ON public.campaign_influencers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own campaign influencers" ON public.campaign_influencers FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_campaign_influencers_updated_at BEFORE UPDATE ON public.campaign_influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX idx_ci_user ON public.campaign_influencers(user_id);
CREATE INDEX idx_ci_campaign ON public.campaign_influencers(campaign_id);