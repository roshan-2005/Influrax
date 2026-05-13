/** Indian rupee formatting & follower abbreviations (K / L / Cr). */

export const formatINR = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatINRCompact = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "—";
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
};

/** K / L / Cr — Indian-style follower formatting */
export const formatFollowersIN = (count: number | null | undefined): string => {
  if (!count) return "0";
  if (count >= 10_000_000) return `${(count / 10_000_000).toFixed(1)}Cr`;
  if (count >= 100_000) return `${(count / 100_000).toFixed(1)}L`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

/** Days remaining helper for deadline chips. */
export const daysUntil = (date: string | null | undefined): number | null => {
  if (!date) return null;
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};
