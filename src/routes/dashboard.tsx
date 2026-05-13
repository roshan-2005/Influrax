import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { usePlan } from "@/lib/usePlan";
import { PLAN_LABELS } from "@/lib/plan";
import { INFLUENCERS, formatFollowers, type Influencer, type Platform } from "@/lib/influencers";
import { formatINRCompact, daysUntil } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { BrandLogo } from "@/components/BrandLogo";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Plus,
  LogOut,
  Instagram,
  Youtube,
  Facebook,
  MapPin,
  Shield,
  TrendingUp,
  Users,
  Sparkles,
  CheckCircle2,
  Send,
  Bookmark,
  Trash2,
  Layers,
  Lock,
  Zap,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InfluraX" },
      { name: "description", content: "Discover influencers, build campaigns, and track outreach." },
    ],
  }),
  component: DashboardPage,
});

type Status = "saved" | "contacted" | "replied";

interface Campaign {
  id: string;
  name: string;
  niche: string | null;
  budget: number | null;
  description: string | null;
  product_name: string | null;
  product_url: string | null;
  product_image: string | null;
  deliverables: string | null;
  platforms: string[] | null;
  min_followers: number | null;
  deadline: string | null;
  is_published: boolean | null;
}

interface BrandRow {
  brand_name: string;
  logo_url: string | null;
  website: string | null;
}

interface SavedInfluencer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  influencer_name: string;
  platform: string;
  niche: string | null;
  followers: number | null;
  status: Status;
}

const NICHES = ["Beauty", "Fashion", "Fitness", "Tech", "Food", "Travel", "Lifestyle", "Gaming", "Finance", "Education", "Comedy", "Parenting"];
const PLATFORMS: Platform[] = ["Instagram", "YouTube", "Facebook", "X"];
const CAMPAIGN_PLATFORMS = ["Instagram", "YouTube", "X", "Facebook"];
const FOLLOWER_BUCKETS = [
  { label: "Any", min: 0, max: Infinity },
  { label: "Nano (< 10K)", min: 0, max: 10_000 },
  { label: "Micro (10K–100K)", min: 10_000, max: 100_000 },
  { label: "Mid (100K–500K)", min: 100_000, max: 500_000 },
  { label: "Macro (500K+)", min: 500_000, max: Infinity },
];

function PlatformIcon({ p }: { p: string }) {
  if (p === "Instagram") return <Instagram className="h-4 w-4" />;
  if (p === "YouTube") return <Youtube className="h-4 w-4" />;
  if (p === "Facebook") return <Facebook className="h-4 w-4" />;
  return <span className="font-bold text-sm leading-none">𝕏</span>;
}

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, onboarded, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { plan, limits, searchesToday, recordSearch } = usePlan();

  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [niche, setNiche] = useState<string>("all");
  const [bucket, setBucket] = useState<string>("Any");
  const [searchBlocked, setSearchBlocked] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedInfluencer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [brand, setBrand] = useState<BrandRow | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newDeliverables, setNewDeliverables] = useState("");
  const [newPlatforms, setNewPlatforms] = useState<string[]>([]);
  const [newMinFollowers, setNewMinFollowers] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPublished, setNewPublished] = useState(false);
  const [fetchingOg, setFetchingOg] = useState(false);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (!onboarded) {
      void navigate({ to: "/onboarding" });
      return;
    }
    if (role === "influencer") {
      void navigate({ to: "/requests" });
    }
  }, [user, role, onboarded, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    setLoadingData(true);
    const [{ data: cs }, { data: si }, { data: br }] = await Promise.all([
      supabase
        .from("campaigns")
        .select(
          "id,name,niche,budget,description,product_name,product_url,product_image,deliverables,platforms,min_followers,deadline,is_published",
        )
        .order("created_at", { ascending: false }),
      supabase.from("campaign_influencers").select("id,campaign_id,influencer_id,influencer_name,platform,niche,followers,status"),
      supabase.from("brands").select("brand_name,logo_url,website").maybeSingle(),
    ]);
    const camps = (cs ?? []) as Campaign[];
    setCampaigns(camps);
    setSaved((si ?? []) as SavedInfluencer[]);
    setBrand((br as BrandRow) ?? null);
    if (camps.length && !activeCampaignId) setActiveCampaignId(camps[0].id);
    setLoadingData(false);
  }

  async function handleFetchOg() {
    if (!newProductUrl.trim()) return toast.error("Enter a product URL first");
    setFetchingOg(true);
    try {
      const res = await fetch(`/api/fetch-og?url=${encodeURIComponent(newProductUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      if (data.image) setNewProductImage(data.image);
      if (data.title && !newProductName) setNewProductName(data.title);
      toast.success("Pulled product details");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fetch URL");
    } finally {
      setFetchingOg(false);
    }
  }

  // Track searches: when the user types a query or applies a filter that's not the default,
  // count it as a search (debounced, once per "session" of typing).
  useEffect(() => {
    if (!user) return;
    const hasFilter = query.trim().length > 0 || platform !== "all" || niche !== "all" || bucket !== "Any";
    if (!hasFilter) return;
    const t = setTimeout(async () => {
      const ok = await recordSearch();
      if (!ok) {
        setSearchBlocked(true);
        toast.error(`Daily search limit reached on the ${PLAN_LABELS[plan]} plan. Upgrade to Pro for unlimited searches.`);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, platform, niche, bucket, user]);

  const filtered = useMemo(() => {
    if (searchBlocked) return [];
    const b = FOLLOWER_BUCKETS.find((x) => x.label === bucket) ?? FOLLOWER_BUCKETS[0];
    return INFLUENCERS.filter((i) => {
      if (platform !== "all" && i.platform !== platform) return false;
      if (niche !== "all" && i.niche !== niche) return false;
      if (i.followers < b.min || i.followers > b.max) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !i.handle.toLowerCase().includes(q) && !i.niche.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [query, platform, niche, bucket, searchBlocked]);

  const savedInActiveCampaign = useMemo(
    () => saved.filter((s) => s.campaign_id === activeCampaignId),
    [saved, activeCampaignId],
  );

  const isSaved = (infId: string) =>
    !!saved.find((s) => s.campaign_id === activeCampaignId && s.influencer_id === infId);

  async function handleCreateCampaign() {
    if (!user || !newName.trim()) return toast.error("Campaign name is required");
    if (limits.maxCampaigns !== null && campaigns.length >= limits.maxCampaigns) {
      return toast.error(`The ${PLAN_LABELS[plan]} plan allows ${limits.maxCampaigns} campaign${limits.maxCampaigns === 1 ? "" : "s"}. Upgrade to add more.`);
    }
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: newName.trim(),
        niche: newNiche || null,
        budget: newBudget ? Number(newBudget) : null,
        description: newDesc || null,
        product_name: newProductName.trim() || null,
        product_url: newProductUrl.trim() || null,
        product_image: newProductImage.trim() || null,
        deliverables: newDeliverables.trim() || null,
        platforms: newPlatforms,
        min_followers: newMinFollowers ? Number(newMinFollowers) : 0,
        deadline: newDeadline || null,
        is_published: newPublished,
      })
      .select(
        "id,name,niche,budget,description,product_name,product_url,product_image,deliverables,platforms,min_followers,deadline,is_published",
      )
      .single();
    if (error) return toast.error(error.message);
    if (data) {
      setCampaigns((prev) => [data as Campaign, ...prev]);
      setActiveCampaignId(data.id);
      toast.success(newPublished ? "Campaign created & published to marketplace" : "Campaign created");
      setNewOpen(false);
      setNewName(""); setNewNiche(""); setNewBudget(""); setNewDesc("");
      setNewProductName(""); setNewProductUrl(""); setNewProductImage("");
      setNewDeliverables(""); setNewPlatforms([]); setNewMinFollowers("");
      setNewDeadline(""); setNewPublished(false);
    }
  }

  async function handleDeleteCampaign(id: string) {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setSaved((prev) => prev.filter((s) => s.campaign_id !== id));
    if (activeCampaignId === id) setActiveCampaignId(null);
    toast.success("Campaign deleted");
  }

  async function handleSaveInfluencer(inf: Influencer) {
    if (!user) return;
    if (!activeCampaignId) return toast.error("Create or select a campaign first");
    if (isSaved(inf.id)) return toast.info("Already saved to this campaign");

    const { data, error } = await supabase
      .from("campaign_influencers")
      .insert({
        user_id: user.id,
        campaign_id: activeCampaignId,
        influencer_id: inf.id,
        influencer_name: inf.name,
        influencer_handle: inf.handle,
        influencer_avatar: inf.avatar,
        platform: inf.platform,
        niche: inf.niche,
        followers: inf.followers,
        engagement_rate: inf.engagementRate,
        authenticity_score: inf.authenticityScore,
        location: inf.location,
        status: "saved",
      })
      .select("id,campaign_id,influencer_id,influencer_name,platform,niche,followers,status")
      .single();
    if (error) return toast.error(error.message);
    if (data) {
      setSaved((prev) => [...prev, data as SavedInfluencer]);
      toast.success(`${inf.name} added to campaign`);
    }
  }

  async function handleStatusChange(rowId: string, status: Status) {
    const { error } = await supabase.from("campaign_influencers").update({ status }).eq("id", rowId);
    if (error) return toast.error(error.message);
    setSaved((prev) => prev.map((s) => (s.id === rowId ? { ...s, status } : s)));
  }

  async function handleRemoveSaved(rowId: string) {
    const { error } = await supabase.from("campaign_influencers").delete().eq("id", rowId);
    if (error) return toast.error(error.message);
    setSaved((prev) => prev.filter((s) => s.id !== rowId));
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const totalSaved = saved.length;
  const totalContacted = saved.filter((s) => s.status === "contacted").length;
  const totalReplied = saved.filter((s) => s.status === "replied").length;
  const dailyCap = limits.dailySearches;
  const searchesLeft = dailyCap === null ? null : Math.max(0, dailyCap - searchesToday);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden md:block text-sm text-muted-foreground">Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={plan === "free" ? "secondary" : "default"} className="rounded-full">
              {plan === "premium" && <Zap className="h-3 w-3 mr-1" />} {PLAN_LABELS[plan]}
              {searchesLeft !== null && (
                <span className="ml-1.5 text-[10px] opacity-80">• {searchesLeft} searches left</span>
              )}
            </Badge>
            <span className="hidden sm:block text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* MAIN */}
        <main>
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={<Bookmark className="h-5 w-5" />} label="Saved" value={totalSaved} />
            <StatCard icon={<Send className="h-5 w-5" />} label="Contacted" value={totalContacted} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Replied" value={totalReplied} />
          </div>

          {/* Search & Filters */}
          <div className="glass rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-11"
                  placeholder="Search influencers by name, handle or niche…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearchBlocked(false); }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={platform} onValueChange={(v) => { setPlatform(v); setSearchBlocked(false); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={niche}
                  onValueChange={(v) => {
                    if (!limits.advancedFilters && v !== "all") {
                      toast.error("Niche filtering is a Pro feature.");
                      return;
                    }
                    setNiche(v); setSearchBlocked(false);
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Niche" />
                    {!limits.advancedFilters && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All niches</SelectItem>
                    {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={bucket}
                  onValueChange={(v) => {
                    if (!limits.advancedFilters && v !== "Any") {
                      toast.error("Follower-tier filtering is a Pro feature.");
                      return;
                    }
                    setBucket(v); setSearchBlocked(false);
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Followers" />
                    {!limits.advancedFilters && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOWER_BUCKETS.map((b) => <SelectItem key={b.label} value={b.label}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {searchBlocked ? "Daily search limit reached" : `${filtered.length} influencers found`}
            </h2>
            {activeCampaignId && (
              <span className="text-sm text-muted-foreground">
                Saving to: <span className="text-foreground font-medium">{campaigns.find((c) => c.id === activeCampaignId)?.name}</span>
              </span>
            )}
          </div>

          {searchBlocked ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">You've hit today's search cap on Free</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Pro for unlimited searches, advanced filters, authenticity scores, and AI outreach drafts.
              </p>
              <Button variant="hero" asChild>
                <Link to="/" hash="pricing">See plans</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((inf) => (
                <InfluencerCard
                  key={inf.id}
                  inf={inf}
                  onSave={() => handleSaveInfluencer(inf)}
                  saved={isSaved(inf.id)}
                  showAuth={limits.authenticityScore}
                  showRoi={limits.roiPrediction}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-16 glass rounded-2xl">
                  No influencers match your filters.
                </div>
              )}
            </div>
          )}
        </main>

        {/* SIDE: Campaigns + Saved */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Campaigns */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" /> Campaigns
                {limits.maxCampaigns !== null && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {campaigns.length}/{limits.maxCampaigns}
                  </span>
                )}
              </h3>
              <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> New</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create campaign</DialogTitle>
                    <DialogDescription>
                      Define the product, deliverables, and audience. Publish to the marketplace to receive pitches from creators.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cname">Campaign name *</Label>
                      <Input id="cname" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Summer Skincare Push" />
                    </div>

                    {/* Product */}
                    <div className="space-y-3 rounded-xl border border-border bg-secondary/20 p-3">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">Product</div>
                      <div className="space-y-1.5">
                        <Label htmlFor="purl">Product URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="purl"
                            value={newProductUrl}
                            onChange={(e) => setNewProductUrl(e.target.value)}
                            placeholder="https://yourbrand.com/products/glow-serum"
                          />
                          <Button type="button" variant="glass" size="sm" onClick={handleFetchOg} disabled={fetchingOg}>
                            {fetchingOg ? "Fetching…" : "Auto-fill"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="pname">Product name</Label>
                          <Input id="pname" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Glow Serum 30ml" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pimg">Product image URL</Label>
                          <Input id="pimg" value={newProductImage} onChange={(e) => setNewProductImage(e.target.value)} placeholder="https://…/image.jpg" />
                        </div>
                      </div>
                      {(newProductImage || newProductName) && (
                        <div className="rounded-lg overflow-hidden border border-border">
                          <ProductImage src={newProductImage} alt={newProductName || newName || "Product"} />
                        </div>
                      )}
                    </div>

                    {/* Audience & deliverables */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Niche</Label>
                        <Select value={newNiche} onValueChange={setNewNiche}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cbudget">Budget (₹)</Label>
                        <Input id="cbudget" type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="100000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cmin">Min followers</Label>
                        <Input id="cmin" type="number" value={newMinFollowers} onChange={(e) => setNewMinFollowers(e.target.value)} placeholder="10000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cdead">Deadline</Label>
                        <Input id="cdead" type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2">
                        {CAMPAIGN_PLATFORMS.map((p) => {
                          const on = newPlatforms.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setNewPlatforms((ps) => on ? ps.filter((x) => x !== p) : [...ps, p])}
                              className={`px-3 py-1.5 rounded-full border text-sm inline-flex items-center gap-1.5 transition-colors ${
                                on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-border/80"
                              }`}
                            >
                              <PlatformIcon p={p} /> {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cdeliv">Deliverables</Label>
                      <Textarea id="cdeliv" value={newDeliverables} onChange={(e) => setNewDeliverables(e.target.value)} placeholder="1 Reel + 3 Stories, posted within 7 days" rows={2} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cdesc">Brief / description</Label>
                      <Textarea id="cdesc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Goals, tone, messaging…" rows={3} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                      <div>
                        <div className="font-medium text-sm">Publish to marketplace</div>
                        <div className="text-xs text-muted-foreground">Creators can discover and apply to this campaign.</div>
                      </div>
                      <Switch checked={newPublished} onCheckedChange={setNewPublished} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
                    <Button variant="hero" onClick={handleCreateCampaign}>
                      {newPublished ? "Create & publish" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingData ? (
              <div className="text-sm text-muted-foreground py-4">Loading…</div>
            ) : campaigns.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                <Sparkles className="h-5 w-5 mx-auto mb-2 text-accent" />
                No campaigns yet. Create one to start saving influencers.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const count = saved.filter((s) => s.campaign_id === c.id).length;
                  const active = c.id === activeCampaignId;
                  const days = daysUntil(c.deadline);
                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border transition-all overflow-hidden group ${
                        active ? "border-primary/60 bg-primary/10" : "border-border hover:border-border/80 hover:bg-secondary/30"
                      }`}
                    >
                      <button
                        onClick={() => setActiveCampaignId(c.id)}
                        className="w-full text-left"
                      >
                        <ProductImage
                          src={c.product_image}
                          alt={c.product_name || c.name}
                          aspectClass="aspect-[16/8]"
                        />
                        <div className="p-3">
                          <div className="flex items-start gap-2.5">
                            <BrandLogo
                              name={brand?.brand_name || c.name}
                              logoUrl={brand?.logo_url}
                              website={brand?.website}
                              size={32}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold truncate text-sm">{c.name}</div>
                                {c.is_published && (
                                  <Badge variant="secondary" className="rounded-full text-[10px] h-4 px-1.5">
                                    Live
                                  </Badge>
                                )}
                              </div>
                              {c.product_name && (
                                <div className="text-xs text-muted-foreground truncate">{c.product_name}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-2 gap-y-1">
                            <span>{c.niche ?? "—"}</span>
                            <span>•</span>
                            <span>{count} saved</span>
                            {c.budget ? <><span>•</span><span>{formatINRCompact(c.budget)}</span></> : null}
                            {days !== null && days >= 0 ? <><span>•</span><span>{days}d left</span></> : null}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center justify-end gap-1 px-3 pb-2 -mt-1">
                        <Link
                          to="/campaigns/$id"
                          params={{ id: c.id }}
                          className="opacity-60 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 inline-flex items-center text-xs"
                          aria-label="Open campaign"
                        >
                          Open <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); void handleDeleteCampaign(c.id); }}
                          className="opacity-60 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                          aria-label="Delete campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved influencers / outreach */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-accent" /> Outreach Tracker
              </h3>
              {activeCampaignId && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/campaigns/$id" params={{ id: activeCampaignId }}>
                    Open <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
            {!activeCampaignId ? (
              <div className="text-sm text-muted-foreground text-center py-6">Select a campaign to see saved influencers.</div>
            ) : savedInActiveCampaign.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                No influencers saved yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {savedInActiveCampaign.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border p-3 hover:border-border/80 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate text-sm">{s.influencer_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <PlatformIcon p={s.platform} />
                          {s.platform} • {s.followers ? formatFollowers(s.followers) : "—"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSaved(s.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v as Status)}>
                      <SelectTrigger className="h-8 mt-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">📌 Saved</SelectItem>
                        <SelectItem value="contacted">✉️ Contacted</SelectItem>
                        <SelectItem value="replied">✅ Replied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function InfluencerCard({
  inf,
  onSave,
  saved,
  showAuth,
  showRoi,
}: {
  inf: Influencer;
  onSave: () => void;
  saved: boolean;
  showAuth: boolean;
  showRoi: boolean;
}) {
  const authColor =
    inf.authenticityScore >= 85 ? "text-success" : inf.authenticityScore >= 70 ? "text-warning" : "text-destructive";
  const roiColor = inf.expectedRoi >= 3 ? "text-success" : inf.expectedRoi >= 2 ? "text-accent" : "text-warning";
  return (
    <div className="glass rounded-2xl p-5 hover:border-primary/40 transition-all hover:translate-y-[-2px] flex flex-col">
      <div className="flex items-start gap-3">
        <img src={inf.avatar} alt={inf.name} className="h-12 w-12 rounded-full bg-secondary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{inf.name}</h4>
            <span className="text-muted-foreground"><PlatformIcon p={inf.platform} /></span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{inf.handle}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="rounded-full">{inf.niche}</Badge>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {inf.location}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric icon={<Users className="h-3.5 w-3.5" />} label="Followers" value={formatFollowers(inf.followers)} />
        <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="ER" value={`${inf.engagementRate}%`} valueClass="text-accent" />
        <Metric
          icon={<Shield className="h-3.5 w-3.5" />}
          label="Auth"
          value={showAuth ? String(inf.authenticityScore) : ""}
          valueClass={authColor}
          locked={!showAuth}
        />
      </div>

      {showRoi ? (
        <div className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Expected ROI</div>
          <div className={`text-sm font-bold ${roiColor}`}>{inf.expectedRoi.toFixed(1)}×</div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> ROI Prediction</span>
          <span>Premium</span>
        </div>
      )}

      <Button
        variant={saved ? "glass" : "hero"}
        size="sm"
        className="w-full mt-4"
        onClick={onSave}
        disabled={saved}
      >
        {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Plus className="h-4 w-4" /> Add to campaign</>}
      </Button>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  valueClass = "",
  locked = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  locked?: boolean;
}) {
  return (
    <div className="rounded-lg bg-background/40 border border-border py-2">
      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1 justify-center">{icon} {label}</div>
      {locked ? (
        <div className="text-xs text-muted-foreground inline-flex items-center justify-center gap-1 mt-0.5">
          <Lock className="h-3 w-3" /> Pro
        </div>
      ) : (
        <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
      )}
    </div>
  );
}
