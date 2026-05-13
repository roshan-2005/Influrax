import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { BrandLogo } from "@/components/BrandLogo";
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
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/brand")({
  head: () => ({
    meta: [
      { title: "Brand setup — InfluraX" },
      { name: "description", content: "Set up your brand workspace." },
    ],
  }),
  component: BrandWizard,
});

const INDUSTRIES = [
  "Fashion", "Beauty", "Fitness", "Food & Beverage", "Tech", "Finance",
  "Gaming", "Education", "Home & Living", "Travel", "Health", "Other",
];

const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune",
  "Kolkata", "Jaipur", "Ahmedabad", "Goa", "Chandigarh", "Lucknow",
];

function BrandWizard() {
  const { user, loading: authLoading } = useAuth();
  const { setRoleAndOnboard } = useRole();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Step 2
  const [instagramHandle, setInstagramHandle] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(45);
  const [gender, setGender] = useState("mixed");
  const [cities, setCities] = useState<string[]>([]);

  // Step 3
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  function toggleCity(city: string) {
    setCities((cs) => (cs.includes(city) ? cs.filter((c) => c !== city) : [...cs, city]));
  }

  function next() {
    if (step === 1) {
      if (!brandName.trim()) return toast.error("Brand name is required");
      if (!website.trim()) return toast.error("Website is required");
    }
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  async function finish() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("brands").upsert(
      {
        user_id: user.id,
        brand_name: brandName.trim(),
        industry: industry || null,
        website: website.trim(),
        logo_url: logoUrl || null,
        bio: bio || null,
        instagram_handle: instagramHandle || null,
        youtube_channel: youtubeChannel || null,
        target_age_min: ageMin,
        target_age_max: ageMax,
        target_gender: gender,
        target_cities: cities,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      setSubmitting(false);
      return toast.error(error.message);
    }
    const { error: rErr } = await setRoleAndOnboard("brand", true);
    if (rErr) {
      setSubmitting(false);
      return toast.error(rErr);
    }
    toast.success("Welcome to InfluraX 🎉");
    void navigate({ to: "/dashboard" });
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
        {/* Progress */}
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
                Brand identity
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tell us about your brand</h1>
              <p className="text-muted-foreground">This is how creators will see you in the marketplace.</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bn">Brand name *</Label>
                <Input id="bn" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Nykaa, Boat, MamaEarth" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ws">Website *</Label>
                  <Input id="ws" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbrand.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lu">Logo URL (optional)</Label>
                <Input id="lu" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Leave blank to auto-fetch from your website" />
                <div className="flex items-center gap-3 mt-2 p-3 rounded-lg border border-border bg-secondary/30">
                  <BrandLogo name={brandName || "?"} logoUrl={logoUrl} website={website} size={48} />
                  <div className="text-sm text-muted-foreground">
                    Preview — auto-fetched from your domain if no URL given.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Audience & socials
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Who are you trying to reach?</h1>
              <p className="text-muted-foreground">Helps us match the right creators to your campaigns.</p>
            </div>

            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ig">Instagram handle</Label>
                  <Input id="ig" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourbrand" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yt">YouTube channel</Label>
                  <Input id="yt" value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder="https://youtube.com/@yourbrand" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amin">Age min</Label>
                  <Input id="amin" type="number" min={13} max={80} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amax">Age max</Label>
                  <Input id="amax" type="number" min={13} max={80} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="female">Primarily female</SelectItem>
                      <SelectItem value="male">Primarily male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target cities</Label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => {
                    const on = cities.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCity(c)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                          on
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-border hover:border-border/80 text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Final touch
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Review your brand</h1>
              <p className="text-muted-foreground">Add a short bio that creators will see.</p>
            </div>

            <div className="glass rounded-2xl p-5 flex items-start gap-4">
              <BrandLogo name={brandName || "?"} logoUrl={logoUrl} website={website} size={64} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-lg truncate">{brandName || "Your brand"}</div>
                <div className="text-sm text-muted-foreground truncate">{website}</div>
                {industry && <Badge variant="secondary" className="rounded-full mt-2">{industry}</Badge>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">About your brand</Label>
              <Textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you make? Who is it for?"
              />
            </div>
          </div>
        )}

        {/* Nav */}
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
              {submitting ? "Saving…" : <>Finish <CheckCircle2 className="h-4 w-4 ml-1" /></>}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
