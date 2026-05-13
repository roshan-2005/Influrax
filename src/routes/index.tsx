import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";
import heroImg from "@/assets/hero-network.jpg";
import {
  Search,
  Shield,
  Layers,
  MessagesSquare,
  Sparkles,
  Check,
  ArrowRight,
  Instagram,
  Youtube,
  Facebook,
  Zap,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Smooth-scroll to hash sections
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, []);

  const goStart = () => navigate({ to: user ? "/dashboard" : "/signup" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground mb-6">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Built for India's D2C brands
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                Find the right influencer.{" "}
                <span className="text-gradient-primary">Predict the right outcome.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                InfluraX helps brands, startups, and marketing teams discover authentic creators
                across Instagram, YouTube, Facebook & X — and run campaigns that actually convert.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="hero" size="xl" onClick={goStart}>
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/" hash="preview">See dashboard</Link>
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> No agency fees
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Authenticity scoring
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Free to start
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-[2rem] opacity-60 blur-3xl"
                style={{ background: "var(--gradient-primary)" }} />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-elegant)] glass">
                <img src={heroImg} alt="InfluraX network visualization" className="w-full h-auto" />
              </div>
              <div className="absolute -bottom-4 -left-4 glass-strong rounded-xl px-4 py-3 shadow-[var(--shadow-card)] hidden sm:flex items-center gap-3 animate-float">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                  <div className="text-sm font-semibold">+38% lift</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 glass-strong rounded-xl px-4 py-3 shadow-[var(--shadow-card)] hidden sm:flex items-center gap-3 animate-float" style={{ animationDelay: "1.5s" }}>
                <Shield className="h-5 w-5 text-success" />
                <div>
                  <div className="text-xs text-muted-foreground">Authenticity</div>
                  <div className="text-sm font-semibold">92 / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social proof / platforms */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
            <span className="text-xs uppercase tracking-widest">Works with</span>
            <Instagram className="h-5 w-5" />
            <Youtube className="h-5 w-5" />
            <Facebook className="h-5 w-5" />
            <span className="font-display font-semibold">𝕏</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to run smart campaigns</h2>
            <p className="mt-4 text-muted-foreground">
              From discovery to outreach — InfluraX gives you the data and tools agencies charge lakhs for.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Search, title: "Discovery Engine", desc: "Search across Instagram, YouTube, Facebook & X with smart filters." },
              { icon: Shield, title: "Authenticity Score", desc: "Detect fake followers and engagement before you spend." },
              { icon: Layers, title: "Campaign Builder", desc: "Group influencers into campaigns with budget and niche tracking." },
              { icon: MessagesSquare, title: "Outreach Tracker", desc: "Track every creator from saved → contacted → replied." },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:border-primary/40 transition-all hover:translate-y-[-2px]">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--gradient-primary)" }}>
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full glass border border-border px-3 py-1 text-xs text-muted-foreground mb-4">
              <Zap className="h-3.5 w-3.5 text-accent" /> Live preview
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">A dashboard built for marketers, not engineers</h2>
          </div>
          <div className="glass-strong rounded-3xl border border-border p-3 sm:p-4 shadow-[var(--shadow-elegant)]">
            <div className="rounded-2xl bg-background/60 border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground">app.influrax.com / dashboard</span>
              </div>
              <div className="p-6 grid lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full" style={{ background: "var(--gradient-primary)", opacity: 0.7 }} />
                      <div className="flex-1 min-w-0">
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="mt-1.5 h-2.5 w-16 bg-muted/60 rounded" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                        <div className="text-sm font-semibold">{(120 + i * 32).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">ER</div>
                        <div className="text-sm font-semibold text-accent">{(3 + i * 0.6).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Auth</div>
                        <div className="text-sm font-semibold text-success">{80 + i}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Simple pricing for every stage</h2>
            <p className="mt-4 text-muted-foreground">Start free. Upgrade as your campaigns scale.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "₹0",
                tagline: "For founders exploring influencer marketing",
                features: ["50 influencer searches/mo", "1 campaign", "Basic engagement metrics"],
                cta: "Start free",
                variant: "glass" as const,
              },
              {
                name: "Pro",
                price: "₹2,499",
                tagline: "For growing D2C brands & marketing teams",
                features: [
                  "Unlimited searches",
                  "10 campaigns",
                  "Authenticity scoring",
                  "Outreach tracker",
                ],
                cta: "Start Pro",
                variant: "hero" as const,
                featured: true,
              },
              {
                name: "Premium",
                price: "₹6,999",
                tagline: "For agencies and high-volume teams",
                features: [
                  "Everything in Pro",
                  "Unlimited campaigns",
                  "ROI prediction (beta)",
                  "Priority support",
                ],
                cta: "Talk to us",
                variant: "glass" as const,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative glass rounded-2xl p-7 flex flex-col ${
                  p.featured ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                    Most popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={p.variant} className="mt-7" onClick={goStart}>
                  {p.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="glass-strong rounded-3xl p-10 sm:p-14 text-center border border-border shadow-[var(--shadow-elegant)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">Ready to run smarter campaigns?</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Join brands using InfluraX to discover, vet, and manage influencers — all in one place.
              </p>
              <Button variant="hero" size="xl" className="mt-7" onClick={goStart}>
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} InfluraX. Built for India.</div>
          <div className="flex gap-6">
            <Link to="/" hash="features" className="hover:text-foreground">Features</Link>
            <Link to="/" hash="pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
