-- Add plan_type to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium'));

-- Daily search usage tracker (one row per user per day)
CREATE TABLE IF NOT EXISTS public.search_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  search_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own search usage"
  ON public.search_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own search usage"
  ON public.search_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own search usage"
  ON public.search_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_search_usage_updated_at
  BEFORE UPDATE ON public.search_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic increment with daily cap. Returns new count, or -1 if cap exceeded.
CREATE OR REPLACE FUNCTION public.increment_search_count(p_daily_cap INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.search_usage (user_id, day, search_count)
  VALUES (v_user_id, v_today, 0)
  ON CONFLICT (user_id, day) DO NOTHING;

  SELECT search_count INTO v_count
  FROM public.search_usage
  WHERE user_id = v_user_id AND day = v_today
  FOR UPDATE;

  IF p_daily_cap IS NOT NULL AND v_count >= p_daily_cap THEN
    RETURN -1;
  END IF;

  UPDATE public.search_usage
  SET search_count = search_count + 1
  WHERE user_id = v_user_id AND day = v_today
  RETURNING search_count INTO v_count;

  RETURN v_count;
END;
$$;

-- Outreach drafts cache (so users can revisit AI-generated drafts)
CREATE TABLE IF NOT EXISTS public.outreach_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_influencer_id UUID NOT NULL REFERENCES public.campaign_influencers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'dm')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own drafts"
  ON public.outreach_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own drafts"
  ON public.outreach_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own drafts"
  ON public.outreach_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own drafts"
  ON public.outreach_drafts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_outreach_drafts_updated_at
  BEFORE UPDATE ON public.outreach_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_outreach_drafts_ci ON public.outreach_drafts(campaign_influencer_id);