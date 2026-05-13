import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppRole = "brand" | "influencer";

export interface UserRoleRow {
  role: AppRole;
  onboarded: boolean;
}

/** Reads the current user's role + onboarding state from public.user_roles. */
export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRole(null);
      setOnboarded(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role,onboarded")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setRole(data.role as AppRole);
      setOnboarded(data.onboarded);
    } else {
      // Defensive: if the trigger didn't fire (e.g. legacy user), seed it.
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "influencer", onboarded: false });
      setRole("influencer");
      setOnboarded(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const setRoleAndOnboard = useCallback(
    async (next: AppRole, isOnboarded: boolean) => {
      if (!user) return { error: "Not signed in" };
      const { error } = await supabase
        .from("user_roles")
        .update({ role: next, onboarded: isOnboarded })
        .eq("user_id", user.id);
      if (error) return { error: error.message };
      setRole(next);
      setOnboarded(isOnboarded);
      return { error: null };
    },
    [user],
  );

  return { role, onboarded, loading: authLoading || loading, refresh, setRoleAndOnboard };
}
