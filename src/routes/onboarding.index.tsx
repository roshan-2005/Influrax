import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Choose your role — InfluraX" },
      { name: "description", content: "Tell us how you want to use InfluraX." },
    ],
  }),
  component: OnboardingPicker,
});

function OnboardingPicker() {
  const { user, loading: authLoading } = useAuth();
  const { role, onboarded, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (onboarded) {
      void navigate({ to: role === "brand" ? "/dashboard" : "/requests" });
    }
  }, [user, authLoading, role, onboarded, roleLoading, navigate]);

  if (authLoading || roleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            One last step
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            How will you use InfluraX?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick the workspace that matches how you create or run campaigns.
            You can always switch later.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <RoleCard
            to="/onboarding/brand"
            icon={<Building2 className="h-6 w-6" />}
            title="I'm a Brand"
            desc="Find creators, run campaigns, and track performance."
            tag="Discovery + analytics"
          />
          <RoleCard
            to="/onboarding/influencer"
            icon={<Sparkles className="h-6 w-6" />}
            title="I'm a Creator"
            desc="Browse open campaigns, pitch brands, and manage collabs."
            tag="Marketplace + pitches"
          />
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  to,
  icon,
  title,
  desc,
  tag,
}: {
  to: "/onboarding/brand" | "/onboarding/influencer";
  icon: React.ReactNode;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <Link
      to={to}
      className="group glass rounded-2xl p-6 border border-border/60 hover:border-primary/60 transition-all hover:translate-y-[-2px] flex flex-col"
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center text-primary-foreground mb-4"
        style={{ background: "var(--gradient-primary)" }}
      >
        {icon}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {tag}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground flex-1">{desc}</p>
      <div className="mt-5 inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
        Continue <ArrowRight className="h-4 w-4 ml-1" />
      </div>
    </Link>
  );
}
