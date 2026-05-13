import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatINRCompact } from "@/lib/format";
import { Sparkles } from "lucide-react";

interface CampaignBrief {
  id: string;
  user_id: string;
  name: string;
  product_name: string | null;
  product_image: string | null;
  budget: number | null;
  niche: string | null;
  platforms: string[] | null;
}

interface BrandInfo {
  brand_name: string;
  logo_url: string | null;
  website: string | null;
}

interface InfluencerRates {
  reel?: number | null;
  post?: number | null;
  story?: number | null;
  youtube?: number | null;
  negotiable?: boolean;
}

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignBrief;
  brand: BrandInfo | null;
  influencerRates: InfluencerRates | null;
  influencerPlatforms: string[];
  onApplied: () => void;
}

const ALL_PLATFORMS = ["Instagram", "YouTube", "X"];

function suggestRate(rates: InfluencerRates | null): number {
  if (!rates) return 0;
  const vals = [rates.reel, rates.post, rates.youtube].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function ApplyDialog({
  open,
  onOpenChange,
  campaign,
  brand,
  influencerRates,
  influencerPlatforms,
  onApplied,
}: ApplyDialogProps) {
  const { user } = useAuth();
  const [pitch, setPitch] = useState("");
  const [rate, setRate] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPitch("");
      setPortfolio("");
      const suggested = suggestRate(influencerRates);
      setRate(suggested ? String(suggested) : "");
      // Pre-select intersection of influencer's connected platforms with campaign's required ones.
      const required = (campaign.platforms ?? []).map((p) => p);
      const intersect = required.filter((p) => influencerPlatforms.includes(p));
      setPlatforms(intersect.length ? intersect : influencerPlatforms.slice(0, 1));
    }
  }, [open, campaign.platforms, influencerRates, influencerPlatforms]);

  function togglePlatform(p: string) {
    setPlatforms((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  }

  async function submit() {
    if (!user) return;
    if (pitch.trim().length < 50) {
      return toast.error("Pitch must be at least 50 characters");
    }
    if (platforms.length === 0) {
      return toast.error("Pick at least one platform");
    }
    setSubmitting(true);
    const links = portfolio
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase.from("campaign_requests").insert({
      campaign_id: campaign.id,
      influencer_id: user.id,
      brand_user_id: campaign.user_id,
      pitch_message: pitch.trim(),
      proposed_rate: rate ? Number(rate) : null,
      platforms,
      portfolio_links: links,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        return toast.error("You've already pitched this campaign");
      }
      return toast.error(error.message);
    }
    toast.success("Pitch submitted ✨");
    onApplied();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pitch this campaign</DialogTitle>
          <DialogDescription>
            Tell the brand why you're the right fit. A great pitch wins more collabs.
          </DialogDescription>
        </DialogHeader>

        {/* Campaign summary */}
        <div className="rounded-xl border border-border overflow-hidden">
          <ProductImage
            src={campaign.product_image}
            alt={campaign.product_name ?? campaign.name}
            aspectClass="aspect-[16/7]"
          />
          <div className="p-3 flex items-center gap-3">
            <BrandLogo
              name={brand?.brand_name ?? "Brand"}
              logoUrl={brand?.logo_url}
              website={brand?.website}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate text-sm">
                {campaign.product_name ?? campaign.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {brand?.brand_name ?? "Brand"} • {campaign.niche ?? "—"}
              </div>
            </div>
            {campaign.budget && (
              <Badge variant="secondary" className="rounded-full">
                {formatINRCompact(campaign.budget)}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pitch">Your pitch *</Label>
            <Textarea
              id="pitch"
              rows={4}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Hey! I'm a fitness creator from Bengaluru with a 60% female audience aged 22-35. I'd love to feature your product because…"
            />
            <div className="flex justify-between text-xs">
              <span
                className={pitch.trim().length < 50 ? "text-muted-foreground" : "text-success"}
              >
                {pitch.trim().length} / 50 min
              </span>
              {influencerRates?.negotiable && (
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Open to negotiation
                </span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rate">Proposed rate (₹)</Label>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="15000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Platforms you'll use *</Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PLATFORMS.map((p) => {
                  const on = platforms.includes(p);
                  const has = influencerPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      disabled={!has}
                      title={has ? "" : "Add this platform to your profile first"}
                      className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        on
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border text-muted-foreground"
                      } ${!has ? "opacity-50 cursor-not-allowed" : "hover:border-border/80"}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="port">Portfolio links (optional)</Label>
            <Textarea
              id="port"
              rows={2}
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="One URL per line — recent posts that show your style"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="hero" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit pitch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
