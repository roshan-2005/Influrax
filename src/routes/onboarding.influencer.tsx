import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Instagram, Youtube } from "lucide-react";

export const Route = createFileRoute("/onboarding/influencer")({
  head: () => ({
    meta: [
      { title: "Creator setup — InfluraX" },
      { name: "description", content: "Set up your creator profile." },
    ],
  }),
  component: InfluencerWizard,
});

const NICHES = [
  "Fashion", "Fitness", "Tech", "Food", "Travel", "Finance",
  "Gaming", "Beauty", "Lifestyle", "Education", "Parenting", "Comedy",
];

const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune",
  "Kolkata", "Jaipur", "Ahmedabad", "Goa", "Chandigarh", "Lucknow",
];

function InfluencerWizard() {
  const { user, loading: authLoading } = useAuth();
  const { setRoleAndOnboard } = useRole();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [niches, setNiches] = useState<string[]>([]);

  // Step 2
  const [igHandle, setIgHandle] = useState("");
  const [igFollowers, setIgFollowers] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytSubs, setYtSubs] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [xFollowers, setXFollowers] = useState("");

  // Step 3
  const [reelRate, setReelRate] = useState("");
  const [postRate, setPostRate] = useState("");
  const [storyRate, setStoryRate] = useState("");
  const [ytRate, setYtRate] = useState("");
  const [openToNeg, setOpenToNeg] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  function toggleNiche(n: string) {
    setNiches((arr) => (arr.includes(n) ? arr.filter((x) => x !== n) : [...arr, n]));
  }

  function next() {
    if (step === 1) {
      if (!displayName.trim()) return toast.error("Display name is required");
      if (niches.length === 0) return toast.error("Pick at least one niche");
    }
    if (step === 2) {
      if (!igHandle && !ytUrl && !xHandle) {
        return toast.error("Connect at least one platform");
      }
    }
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  async function finish() {
    if (!user) return;
    setSubmitting(true);
    const rates = {
      reel: reelRate ? Number(reelRate) : null,
      post: postRate ? Number(postRate) : null,
      story: storyRate ? Number(storyRate) : null,
      youtube: ytRate ? Number(ytRate) : null,
      negotiable: openToNeg,
    };
    const { error } = await supabase.from("influencer_profiles").upsert(
      {
        user_id: user.id,
        display_name: displayName.trim(),
        bio: bio || null,
        city: city || null,
        niches,
        instagram_handle: igHandle || null,
        instagram_followers: igFollowers ? Number(igFollowers) : 0,
        youtube_channel_url: ytUrl || null,
        youtube_subscribers: ytSubs ? Number(ytSubs) : 0,
        x_handle: xHandle || null,
        x_followers: xFollowers ? Number(xFollowers) : 0,
        rates_json: rates,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      setSubmitting(false);
      return toast.error(error.message);
    }
    const { error: rErr } = await setRoleAndOnboard("influencer", true);
    if (rErr) {
      setSubmitting(false);
      return toast.error(rErr);
    }
    toast.success("You're all set 🎉");
    void navigate({ to: "/requests" });
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="text-sm text-muted-foreground">Step {step} of 3</div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                n <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Your profile
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Set up your creator profile</h1>
              <p className="text-muted-foreground">Brands will see this when you pitch their campaigns.</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dn">Display name *</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name or creator handle" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio (max 160)</Label>
                  <Input id="bio" maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Lifestyle creator from Mumbai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Niches *</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => {
                    const on = niches.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleNiche(n)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                          on
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-border hover:border-border/80 text-muted-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Connect your platforms
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Where do you create?</h1>
              <p className="text-muted-foreground">Add at least one platform. We'll fetch real metrics later — for now, type your numbers.</p>
            </div>

            <PlatformBlock icon={<Instagram className="h-4 w-4" />} title="Instagram">
              <Input value={igHandle} onChange={(e) => setIgHandle(e.target.value)} placeholder="@yourhandle" />
              <Input type="number" value={igFollowers} onChange={(e) => setIgFollowers(e.target.value)} placeholder="Followers" />
            </PlatformBlock>

            <PlatformBlock icon={<Youtube className="h-4 w-4" />} title="YouTube">
              <Input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="Channel URL" />
              <Input type="number" value={ytSubs} onChange={(e) => setYtSubs(e.target.value)} placeholder="Subscribers" />
            </PlatformBlock>

            <PlatformBlock icon={<span className="font-bold leading-none">𝕏</span>} title="X (Twitter)">
              <Input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@yourhandle" />
              <Input type="number" value={xFollowers} onChange={(e) => setXFollowers(e.target.value)} placeholder="Followers" />
            </PlatformBlock>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Your rates
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Set your rates (in ₹)</h1>
              <p className="text-muted-foreground">Brands see this in your profile. You can edit anytime.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <RateRow label="Reel / Short" value={reelRate} onChange={setReelRate} />
              <RateRow label="Static post" value={postRate} onChange={setPostRate} />
              <RateRow label="Story" value={storyRate} onChange={setStoryRate} />
              <RateRow label="YouTube video" value={ytRate} onChange={setYtRate} />
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 cursor-pointer">
              <input
                type="checkbox"
                checked={openToNeg}
                onChange={(e) => setOpenToNeg(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <div className="font-medium text-sm">Open to negotiation</div>
                <div className="text-xs text-muted-foreground">Brands can propose different rates when applying.</div>
              </div>
            </label>

            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="text-sm text-muted-foreground">
                You'll land on your <span className="text-foreground font-medium">creator workspace</span> next, where you can browse brand campaigns and pitch.
              </div>
            </div>

            {niches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {niches.map((n) => (
                  <Badge key={n} variant="secondary" className="rounded-full">{n}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-10">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? navigate({ to: "/onboarding" }) : setStep((s) => (s - 1) as 1 | 2 | 3))}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {step === 1 ? "Change role" : "Back"}
          </Button>

          {step < 3 ? (
            <Button variant="hero" onClick={next}>
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button variant="hero" onClick={finish} disabled={submitting}>
              {submitting ? "Saving…" : <>Go to my workspace <CheckCircle2 className="h-4 w-4 ml-1" /></>}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function PlatformBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-7 w-7 rounded-lg flex items-center justify-center bg-secondary">{icon}</span>
        {title}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function RateRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
        <Input className="pl-7" type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" />
      </div>
    </div>
  );
}
