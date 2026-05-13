export type PlanType = "free" | "pro" | "premium";

export interface PlanLimits {
  dailySearches: number | null; // null = unlimited
  maxCampaigns: number | null;
  advancedFilters: boolean;
  authenticityScore: boolean;
  roiPrediction: boolean;
  bulkOutreach: boolean;
  aiOutreach: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    dailySearches: 10,
    maxCampaigns: 1,
    advancedFilters: false,
    authenticityScore: false,
    roiPrediction: false,
    bulkOutreach: false,
    aiOutreach: false,
  },
  pro: {
    dailySearches: null,
    maxCampaigns: 10,
    advancedFilters: true,
    authenticityScore: true,
    roiPrediction: false,
    bulkOutreach: false,
    aiOutreach: true,
  },
  premium: {
    dailySearches: null,
    maxCampaigns: null,
    advancedFilters: true,
    authenticityScore: true,
    roiPrediction: true,
    bulkOutreach: true,
    aiOutreach: true,
  },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};
