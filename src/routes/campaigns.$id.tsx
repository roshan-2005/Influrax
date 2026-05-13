import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlan } from "@/lib/usePlan";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Bookmark,
  CheckCircle2,
  MessageCircle,
  Trash2,
  Download,
  Instagram,
  Youtube,
  Facebook,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { OutreachDialog } from "@/components/OutreachDialog";
import { formatFollowers } from "@/lib/influencers";

type Status = "saved" | "contacted" | "replied";

interface Campaign {
  id: string;
  name: string;
  niche: string | null;
  budget: number | null;
  description: string | null;
}

interface SavedInfluencer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  influencer_name: string;
  influencer_handle: string | null;
  influencer_avatar: string | null;
  platform: string;
  niche: string | null;
  followers: number | null;
  engagement_rate: number | null;
  authenticity_score: number | null;
  location: string | null;
  status: Status;
}

export const Route = createFileRoute("/campaigns/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Campaign — InfluraX` },
      { name: "description", content: `Manage outreach for campaign ${params.id}.` },
    ],
  }),
  component: CampaignDetailPage,
});

function PlatformIcon({ p }: { p: string }) {
  if (p === "Instagram") return <Instagram className="h-3.5 w-3.5" />;
  if (p === "YouTube") return <Youtube className="h-3.5 w-3.5" />;
  if (p === "Facebook") return <Facebook className="h-3.5 w-3.5" />;
  return <span className="font-bold text-xs leading-none">𝕏</span>;
}

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { limits } = usePlan();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rows, setRows] = useState<SavedInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [outreachFor, setOutreachFor] = useState<SavedInfluencer | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function load() {
    setLoading(true);
    const [{ data: c, error: cErr }, { data: ci }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id,name,niche,budget,description")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("campaign_influencers")
        .select(
          "id,campaign_id,influencer_id,influencer_name,influencer_handle,influencer_avatar,platform,niche,followers,engagement_rate,authenticity_score,location,status",
        )
        .eq("campaign_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (cErr || !c) {
      toast.error("Campaign not found");
      navigate({ to: "/dashboard" });
      return;
    }
    setCampaign(c as Campaign);
    setRows((ci ?? []) as SavedInfluencer[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      saved: rows.filter((r) => r.status === "saved").length,
      contacted: rows.filter((r) => r.status === "contacted").length,
      replied: rows.filter((r) => r.status === "replied").length,
    }),
    [rows],
  );

  async function updateStatus(rowId: string, status: Status) {
    const { error } = await supabase.from("campaign_influencers").update({ status }).eq("id", rowId);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status } : r)));
  }

  async function removeRow(rowId: string) {
    const { error } = await supabase.from("campaign_influencers").delete().eq("id", rowId);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    toast.success("Removed");
  }

  function exportCsv() {
    const headers = [
      "name",
      "handle",
      "platform",
      "niche",
      "followers",
      "engagement_rate",
      "authenticity_score",
      "location",
      "status",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          JSON.stringify(r.influencer_name ?? ""),
          JSON.stringify(r.influencer_handle ?? ""),
          r.platform,
          r.niche ?? "",
          r.followers ?? "",
          r.engagement_rate ?? "",
          r.authenticity_score ?? "",
          JSON.stringify(r.location ?? ""),
          r.status,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign?.name ?? "campaign"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading || !user || loading || !campaign) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
          <Button variant="glass" size="sm" asChild>
            <Link to="/dashboard">Discover more</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Campaign</div>
            <h1 className="text-3xl sm:text-4xl font-bold">{campaign.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {campaign.niche && <Badge variant="secondary" className="rounded-full">{campaign.niche}</Badge>}
              {campaign.budget && (
                <span>Budget: <span className="text-foreground font-medium">₹{campaign.budget.toLocaleString("en-IN")}</span></span>
              )}
              <span>{rows.length} influencer{rows.length === 1 ? "" : "s"}</span>
            </div>
            {campaign.description && (
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="glass" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Saved" value={counts.saved} icon={<Bookmark className="h-4 w-4" />} />
          <Stat label="Contacted" value={counts.contacted} icon={<Send className="h-4 w-4" />} />
          <Stat label="Replied" value={counts.replied} icon={<CheckCircle2 className="h-4 w-4" />} />
          <Stat
            label="Reply rate"
            value={
              counts.contacted + counts.replied > 0
                ? `${Math.round((counts.replied / (counts.contacted + counts.replied)) * 100)}%`
                : "—"
            }
            icon={<MessageCircle className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({counts.saved})</TabsTrigger>
            <TabsTrigger value="contacted">Contacted ({counts.contacted})</TabsTrigger>
            <TabsTrigger value="replied">Replied ({counts.replied})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <Sparkles className="h-6 w-6 mx-auto mb-3 text-accent" />
              {rows.length === 0 ? "No influencers in this campaign yet." : "Nothing matches this filter."}
              <div className="mt-4">
                <Button variant="hero" asChild>
                  <Link to="/dashboard">Discover influencers</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Creator</th>
                    <th className="text-left font-medium px-4 py-3">Platform</th>
                    <th className="text-right font-medium px-4 py-3">Followers</th>
                    <th className="text-right font-medium px-4 py-3">ER</th>
                    <th className="text-right font-medium px-4 py-3">Auth</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.influencer_avatar && (
                            <img src={r.influencer_avatar} alt={r.influencer_name} className="h-9 w-9 rounded-full bg-secondary" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{r.influencer_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.influencer_handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5"><PlatformIcon p={r.platform} /> {r.platform}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.followers ? formatFollowers(r.followers) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-accent">
                        {r.engagement_rate ? `${r.engagement_rate}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {limits.authenticityScore ? (
                          r.authenticity_score ?? "—"
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                            <Lock className="h-3 w-3" /> Pro
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Status)}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saved">📌 Saved</SelectItem>
                            <SelectItem value="contacted">✉️ Contacted</SelectItem>
                            <SelectItem value="replied">✅ Replied</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="hero" onClick={() => setOutreachFor(r)}>
                            <Sparkles className="h-3.5 w-3.5" /> Outreach
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeRow(r.id)} aria-label="Remove">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {outreachFor && (
        <OutreachDialog
          open={!!outreachFor}
          onOpenChange={(o) => !o && setOutreachFor(null)}
          campaign={campaign}
          saved={outreachFor}
          aiEnabled={limits.aiOutreach}
          onMarkContacted={() => {
            setRows((prev) =>
              prev.map((r) => (r.id === outreachFor.id ? { ...r, status: "contacted" as Status } : r)),
            );
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
