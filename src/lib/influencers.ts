export type Platform = "Instagram" | "YouTube" | "Facebook" | "X";

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: Platform;
  niche: string;
  followers: number;
  engagementRate: number; // percentage
  authenticityScore: number; // 0-100
  fakeFollowerScore: number; // 0-100, lower is better
  engagementQualityScore: number; // 0-100
  expectedRoi: number; // multiplier, e.g. 2.4x
  avgViews: number;
  location: string;
  bio: string;
  contactEmail: string;
}

const FIRST = ["Aarav", "Diya", "Kabir", "Aanya", "Vihaan", "Saanvi", "Arjun", "Myra", "Reyansh", "Ishita", "Aryan", "Anika", "Vivaan", "Riya", "Krish", "Tara", "Aditya", "Nyra", "Dev", "Zara"];
const LAST = ["Sharma", "Patel", "Iyer", "Khan", "Reddy", "Mehta", "Kapoor", "Singh", "Verma", "Nair", "Bose", "Joshi", "Gupta", "Rao", "Shah"];
const NICHES = ["Beauty", "Fashion", "Fitness", "Tech", "Food", "Travel", "Lifestyle", "Gaming", "Finance", "Education", "Comedy", "Parenting"];
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Jaipur", "Ahmedabad", "Goa"];
const PLATFORMS: Platform[] = ["Instagram", "YouTube", "Facebook", "X"];

function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], i: number): T {
  return arr[Math.floor(seeded(i) * arr.length)];
}

/**
 * Compute simple, deterministic intelligence scores from raw metrics.
 * - Fake-follower score: penalises mismatch between follower size and engagement.
 * - Engagement quality: combines ER with authenticity & follower-tier expectations.
 * - Expected ROI: heuristic blending engagement quality, authenticity, and reach.
 */
export function computeScores(args: {
  followers: number;
  engagementRate: number;
  authenticityScore: number;
}) {
  const { followers, engagementRate, authenticityScore } = args;
  // Expected ER decays with follower count (larger accounts naturally have lower ER).
  const expectedEr = followers <= 10_000
    ? 6
    : followers <= 100_000
      ? 4
      : followers <= 500_000
        ? 2.5
        : 1.5;

  // ER ratio vs expected — too low or too high (suspiciously high) hurts.
  const erRatio = engagementRate / expectedEr;
  const erDeviation = Math.abs(erRatio - 1);
  // Fake-follower score: lower is better. 0 = clean, 100 = very suspicious.
  const fakeFollowerScore = Math.min(
    100,
    Math.round((100 - authenticityScore) * 0.6 + erDeviation * 35),
  );

  // Engagement quality 0-100
  const engagementQualityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Math.min(erRatio, 1.4) * 55 + (authenticityScore - 50) * 0.9,
      ),
    ),
  );

  // Expected ROI multiplier — heuristic
  const reachFactor = Math.log10(Math.max(followers, 1000)) / 6; // 0.5 - 1
  const expectedRoi = +(
    0.6 +
    (engagementQualityScore / 100) * 2.2 +
    (authenticityScore / 100) * 1.4 +
    reachFactor * 0.8
  ).toFixed(2);

  return { fakeFollowerScore, engagementQualityScore, expectedRoi };
}

export const INFLUENCERS: Influencer[] = Array.from({ length: 48 }, (_, i) => {
  const first = pick(FIRST, i + 1);
  const last = pick(LAST, i + 17);
  const name = `${first} ${last}`;
  const platform = pick(PLATFORMS, i + 3);
  const niche = pick(NICHES, i + 7);
  const city = pick(CITIES, i + 11);
  const followers = Math.floor(5_000 + seeded(i + 23) * 2_000_000);
  const engagement = +(1 + seeded(i + 41) * 9).toFixed(2);
  const authenticity = Math.floor(55 + seeded(i + 67) * 45);
  const handleBase = (first + last).toLowerCase();
  const avgViews = Math.floor(followers * (0.05 + seeded(i + 83) * 0.25));
  const scores = computeScores({ followers, engagementRate: engagement, authenticityScore: authenticity });
  return {
    id: `inf_${i + 1}`,
    name,
    handle: `@${handleBase}${i + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handleBase}${i}`,
    platform,
    niche,
    followers,
    engagementRate: engagement,
    authenticityScore: authenticity,
    fakeFollowerScore: scores.fakeFollowerScore,
    engagementQualityScore: scores.engagementQualityScore,
    expectedRoi: scores.expectedRoi,
    avgViews,
    location: `${city}, India`,
    bio: `${niche} creator from ${city}. Sharing real stories with a real audience.`,
    contactEmail: `${handleBase}${i + 1}@creators.in`,
  };
});

export function getInfluencerById(id: string): Influencer | undefined {
  return INFLUENCERS.find((i) => i.id === id);
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
