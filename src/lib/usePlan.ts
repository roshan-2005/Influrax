import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PLAN_LIMITS, type PlanType } from "@/lib/plan";

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [searchesToday, setSearchesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: profile }, { data: usage }] = await Promise.all([
      supabase.from("profiles").select("plan_type").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("search_usage")
        .select("search_count")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle(),
    ]);
    if (profile?.plan_type) setPlan(profile.plan_type as PlanType);
    setSearchesToday(usage?.search_count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const limits = PLAN_LIMITS[plan];

  /** Returns true if a search was recorded; false if the daily cap is reached. */
  const recordSearch = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const cap = limits.dailySearches;
    if (cap === null) {
      // unlimited — still log usage but no cap
      await supabase.rpc("increment_search_count", { p_daily_cap: 999_999 });
      await refresh();
      return true;
    }
    const { data, error } = await supabase.rpc("increment_search_count", { p_daily_cap: cap });
    if (error) {
      console.error("increment_search_count error", error);
      return false;
    }
    if (data === -1) {
      return false;
    }
    setSearchesToday(typeof data === "number" ? data : searchesToday + 1);
    return true;
  }, [user, limits.dailySearches, refresh, searchesToday]);

  return { plan, limits, searchesToday, loading, refresh, recordSearch };
}
