import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { BrandLogo } from "@/components/BrandLogo";
import { ApplyDialog } from "@/components/ApplyDialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatINRCompact, formatFollowersIN, daysUntil } from "@/lib/format";
import {
  Search,
  Instagram,
  Youtube,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ExternalLink,
  Filter,
  CalendarClock,
} from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Creator workspace — InfluraX" },
      { name: "description", content: "Browse open campaigns and manage your pitches." },
    ],
  }),
  component: RequestsPage,
});

const NICHES = [
  "Fashion", "Fitness", "Tech", "Food", "Travel", "Finance",
  "Gaming", "Beauty", "Lifestyle", "Education", "Parenting", "Comedy",
];
const PLATFORMS = ["Instagram", "YouTube", "X"];

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  product_name: string | null;
  product_url: string | null;
  product_image: string | null;
  description: string | null;
  niche: string | null;
  budget: number | null;
  platforms: string[] | null;
  min_followers: number | null;
  deadline: string | null;
  deliverables: string | null;
  is_published: boolean;
  created_at: string;
}

interface BrandRow {
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  website: string | null;
}

interface Pitch {
  id: string;
  campaign_id: string;
  status: "pending" | "reviewing" | "accepted" | "rejected" | "contracted" | "withdrawn";
  pitch_message: string;
  proposed_rate: number | null;
  platforms: string[] | null;
  created_at: string;
}

interface InfluencerProfile {
  display_name: string | null;
  niches: string[] | null;
  rates_json: {
    reel?: number | null;
    post?: number | null;
    story?: number | null;
    youtube?: number | null;
    negotiable?: boolean;
  } | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  youtube_channel_url: string | null;
  youtube_subscribers: number | null;
  x_handle: string | null;
  x_followers: number | null;
}

function PlatformIcon({ p }: { p: string }) {
  if (p === "Instagram") return <Instagram className="h-3.5 w-3.5" />;
  if (p === "YouTube") return <Youtube className="h-3.5 w-3.5" />;
  return <span className="font-bold text-xs leading-none">𝕏</span>;
}

function RequestsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, onboarded, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"find" | "pitches" | "active">("find");
  const [loading, setLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brandsByUserId, setBrandsByUserId] = useState<Record<string, BrandRow>>({});
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);

  // Filters for Find tab
  const [query, setQuery] = useState("");
  const [filterNiche, setFilterNiche] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");

  const [applyFor, setApplyFor] = useState<Campaign | null>(null);

  // Auth + role guards
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
    if (role === "brand") {
      void navigate({ to: "/dashboard" });
    }
  }, [user, role, onboarded, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (!user || role !== "influencer") return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  async function loadAll() {
    setLoading(true);
    const [
      { data: cs },
      { data: ps },
      { data: prof },
    ] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id,user_id,name,product_name,product_url,product_image,description,niche,budget,platforms,min_followers,deadline,deliverables,is_published,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("campaign_requests")
        .select("id,campaign_id,status,pitch_message,proposed_rate,platforms,created_at")
        .eq("influencer_id", user!.id),
      supabase
        .from("influencer_profiles")
        .select("display_name,niches,rates_json,instagram_handle,instagram_followers,youtube_channel_url,youtube_subscribers,x_handle,x_followers")
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

    const camps = (cs ?? []) as Campaign[];
    setCampaigns(camps);
    setPitches((ps ?? []) as Pitch[]);
    setProfile(prof as InfluencerProfile | null);

    // Fetch brand rows for the campaign owners we see
    const ownerIds = Array.from(new Set(camps.map((c) => c.user_id)));
    if (ownerIds.length > 0) {
      const { data: bs } = await supabase
        .from("brands")
        .select("user_id,brand_name,logo_url,website")
        .in("user_id", ownerIds);
      const map: Record<string, BrandRow> = {};
      for (const b of bs ?? []) map[(b as BrandRow).user_id] = b as BrandRow;
      setBrandsByUserId(map);
    }
    setLoading(false);
  }

  const influencerPlatforms = useMemo(() => {
    if (!profile) return [];
    const out: string[] = [];
    if (profile.instagram_handle) out.push("Instagram");
    if (profile.youtube_channel_url) out.push("YouTube");
    if (profile.x_handle) out.push("X");
    return out;
  }, [profile]);

  const totalFollowers = useMemo(() => {
    if (!profile) return 0;
    return (
      (profile.instagram_followers ?? 0) +
      (profile.youtube_subscribers ?? 0) +
      (profile.x_followers ?? 0)
    );
  }, [profile]);

  const pitchByCampaignId = useMemo(() => {
    const m: Record<string, Pitch> = {};
    for (const p of pitches) m[p.campaign_id] = p;
    return m;
  }, [pitches]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (filterNiche !== "all" && c.niche !== filterNiche) return false;
      if (filterPlatform !== "all" && !(c.platforms ?? []).includes(filterPlatform)) return false;
      if (query) {
        const q = query.toLowerCase();
        const brand = brandsByUserId[c.user_id]?.brand_name?.toLowerCase() ?? "";
        const hay = `${c.name} ${c.product_name ?? ""} ${c.niche ?? ""} ${brand}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, filterNiche, filterPlatform, query, brandsByUserId]);

  const myPitchedCampaigns = useMemo(() => {
    // Map pitches to their campaigns (campaigns may be unpublished now; refetch separately if needed)
    return pitches.map((p) => ({
      pitch: p,
      campaign: campaigns.find((c) => c.id === p.campaign_id) ?? null,
    }));
  }, [pitches, campaigns]);

  const activeCollabs = useMemo(
    () => myPitchedCampaigns.filter(({ pitch }) => pitch.status === "accepted" || pitch.status === "contracted"),
    [myPitchedCampaigns],
  );

  async function withdrawPitch(pitchId: string) {
    const { error } = await supabase
      .from("campaign_requests")
      .delete()
      .eq("id", pitchId);
    if (error) return toast.error(error.message);
    setPitches((prev) => prev.filter((p) => p.id !== pitchId));
    toast.success("Pitch withdrawn");
  }

  if (authLoading || roleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden md:block text-sm text-muted-foreground">Creator workspace</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8">
        {/* Profile snapshot */}
        <div className="glass rounded-2xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {(profile?.display_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{profile?.display_name ?? "Creator"}</h1>
              {(profile?.niches ?? []).slice(0, 3).map((n) => (
                <Badge key={n} variant="secondary" className="rounded-full">{n}</Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatFollowersIN(totalFollowers)} total followers •{" "}
              {influencerPlatforms.length} platform{influencerPlatforms.length === 1 ? "" : "s"} connected
            </div>
          </div>
          <div className="flex gap-3 text-center">
            <MiniStat label="Pitches" value={pitches.length} />
            <MiniStat label="Active" value={activeCollabs.length} />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="find">Find Campaigns ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="pitches">My Pitches ({pitches.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCollabs.length})</TabsTrigger>
          </TabsList>

          {/* FIND CAMPAIGNS */}
          <TabsContent value="find" className="mt-6">
            <div className="glass rounded-2xl p-4 mb-5 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-11"
                  placeholder="Search by brand, product, or niche…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterNiche} onValueChange={setFilterNiche}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All niches</SelectItem>
                    {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground py-20">Loading campaigns…</div>
            ) : filteredCampaigns.length === 0 ? (
              <EmptyState
                icon={<Filter className="h-6 w-6" />}
                title={campaigns.length === 0 ? "No published campaigns yet" : "No campaigns match your filters"}
                desc={
                  campaigns.length === 0
                    ? "Brands haven't published any campaigns to the marketplace yet. Check back soon."
                    : "Try clearing filters or searching differently."
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCampaigns.map((c) => {
                  const brand = brandsByUserId[c.user_id];
                  const myPitch = pitchByCampaignId[c.id];
                  return (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      brand={brand}
                      hasPitched={!!myPitch}
                      onApply={() => setApplyFor(c)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* MY PITCHES */}
          <TabsContent value="pitches" className="mt-6">
            {pitches.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="No pitches yet"
                desc="Browse the marketplace and apply to campaigns that match your style."
                cta={
                  <Button variant="hero" onClick={() => setTab("find")}>
                    Find campaigns
                  </Button>
                }
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myPitchedCampaigns.map(({ pitch, campaign }) => (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    campaign={campaign}
                    brand={campaign ? brandsByUserId[campaign.user_id] : undefined}
                    onWithdraw={() => withdrawPitch(pitch.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ACTIVE */}
          <TabsContent value="active" className="mt-6">
            {activeCollabs.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="No active collaborations yet"
                desc="When a brand accepts a pitch, it'll show up here with deliverables and payment status."
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeCollabs.map(({ pitch, campaign }) => (
                  <ActiveCard
                    key={pitch.id}
                    pitch={pitch}
                    campaign={campaign}
                    brand={campaign ? brandsByUserId[campaign.user_id] : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {applyFor && (
        <ApplyDialog
          open={!!applyFor}
          onOpenChange={(o) => !o && setApplyFor(null)}
          campaign={applyFor}
          brand={brandsByUserId[applyFor.user_id] ?? null}
          influencerRates={profile?.rates_json ?? null}
          influencerPlatforms={influencerPlatforms}
          onApplied={() => void loadAll()}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-secondary/40 border border-border min-w-[64px]">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center text-primary-foreground mb-4" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{desc}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

function CampaignCard({
  campaign,
  brand,
  hasPitched,
  onApply,
}: {
  campaign: Campaign;
  brand: BrandRow | undefined;
  hasPitched: boolean;
  onApply: () => void;
}) {
  const days = daysUntil(campaign.deadline);
  const deadlineColor =
    days === null ? "text-muted-foreground" : days < 3 ? "text-destructive" : days < 7 ? "text-warning" : "text-success";

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-all hover:translate-y-[-2px] border border-border/60">
      <ProductImage
        src={campaign.product_image}
        alt={campaign.product_name ?? campaign.name}
      />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <BrandLogo
            name={brand?.brand_name ?? "Brand"}
            logoUrl={brand?.logo_url}
            website={brand?.website}
            size={28}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground truncate">
              {brand?.brand_name ?? "Brand"}
            </div>
            <div className="font-semibold truncate">
              {campaign.product_name ?? campaign.name}
            </div>
          </div>
          {campaign.budget && (
            <Badge variant="default" className="rounded-full whitespace-nowrap">
              {formatINRCompact(campaign.budget)}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {campaign.niche && (
            <Badge variant="secondary" className="rounded-full">{campaign.niche}</Badge>
          )}
          {(campaign.platforms ?? []).map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-xs text-muted-foreground">
              <PlatformIcon p={p} /> {p}
            </span>
          ))}
        </div>

        {campaign.deliverables && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {campaign.deliverables}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/40">
          <span>
            {campaign.min_followers ? `Min ${formatFollowersIN(campaign.min_followers)} followers` : "Open to all"}
          </span>
          {days !== null && (
            <span className={`inline-flex items-center gap-1 ${deadlineColor}`}>
              <CalendarClock className="h-3 w-3" />
              {days <= 0 ? "Closed" : `${days}d left`}
            </span>
          )}
        </div>

        <Button
          variant={hasPitched ? "glass" : "hero"}
          className="w-full mt-3"
          onClick={onApply}
          disabled={hasPitched || (days !== null && days <= 0)}
        >
          {hasPitched ? <><CheckCircle2 className="h-4 w-4" /> Applied</> : "Apply for promotion"}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Pitch["status"] }) {
  const map: Record<Pitch["status"], { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30", icon: <Clock className="h-3 w-3" /> },
    reviewing: { label: "Reviewing", className: "bg-accent/15 text-accent border-accent/30", icon: <Sparkles className="h-3 w-3" /> },
    accepted: { label: "Accepted", className: "bg-success/15 text-success border-success/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    contracted: { label: "Contracted", className: "bg-primary/15 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30", icon: <XCircle className="h-3 w-3" /> },
    withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border", icon: <XCircle className="h-3 w-3" /> },
  };
  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${v.className}`}>
      {v.icon} {v.label}
    </span>
  );
}

function PitchCard({
  pitch,
  campaign,
  brand,
  onWithdraw,
}: {
  pitch: Pitch;
  campaign: Campaign | null;
  brand: BrandRow | undefined;
  onWithdraw: () => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-border/60">
      <div className="grid grid-cols-[120px_1fr]">
        <ProductImage
          src={campaign?.product_image}
          alt={campaign?.product_name ?? campaign?.name ?? "Campaign"}
          aspectClass="aspect-square"
        />
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <BrandLogo name={brand?.brand_name ?? "Brand"} logoUrl={brand?.logo_url} website={brand?.website} size={16} />
                {brand?.brand_name ?? "Brand"}
              </div>
              <div className="font-semibold truncate">
                {campaign?.product_name ?? campaign?.name ?? "Unavailable"}
              </div>
            </div>
            <StatusBadge status={pitch.status} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">"{pitch.pitch_message}"</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
            <span>
              {pitch.proposed_rate ? formatINRCompact(pitch.proposed_rate) : "No rate"} •{" "}
              {new Date(pitch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            {pitch.status === "pending" && (
              <button
                onClick={onWithdraw}
                className="inline-flex items-center gap-1 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Withdraw
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveCard({
  pitch,
  campaign,
  brand,
}: {
  pitch: Pitch;
  campaign: Campaign | null;
  brand: BrandRow | undefined;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-success/30">
      <ProductImage
        src={campaign?.product_image}
        alt={campaign?.product_name ?? "Campaign"}
        aspectClass="aspect-[16/7]"
      />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <BrandLogo name={brand?.brand_name ?? "Brand"} logoUrl={brand?.logo_url} website={brand?.website} size={28} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground truncate">{brand?.brand_name ?? "Brand"}</div>
            <div className="font-semibold truncate">{campaign?.product_name ?? campaign?.name ?? "—"}</div>
          </div>
          <StatusBadge status={pitch.status} />
        </div>

        {campaign?.deliverables && (
          <div className="text-sm mt-2 mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Deliverables</div>
            <p className="text-muted-foreground">{campaign.deliverables}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
          <span className="text-muted-foreground">Agreed rate</span>
          <span className="font-bold text-success">
            {pitch.proposed_rate ? formatINRCompact(pitch.proposed_rate) : "TBD"}
          </span>
        </div>
        <Link
          to="/requests"
          className="mt-3 text-xs text-primary inline-flex items-center gap-1 hover:underline"
        >
          Submit post URL when live <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
