import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sparkles, Shield, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — InfluraX" },
      { name: "description", content: "Log in to your InfluraX account to manage influencer campaigns." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else {
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    }
  }

  return <AuthLayout title="Welcome back" subtitle="Log in to your InfluraX dashboard">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
    <p className="mt-6 text-sm text-center text-muted-foreground">
      Don't have an account?{" "}
      <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
    </p>
  </AuthLayout>;
}

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
        <Logo className="mb-10" />
        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Illustration side */}
      <div className="hidden lg:block relative overflow-hidden border-l border-border">
        <div className="absolute inset-0" style={{ background: "var(--gradient-primary)", opacity: 0.15 }} />
        <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative h-full flex flex-col justify-center p-12">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Trusted by 1,000+ Indian brands
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Run campaigns that <span className="text-gradient-primary">actually convert.</span>
            </h2>
            <p className="text-muted-foreground">
              Discover, vet, and reach out to creators across Instagram, YouTube, Facebook and X — all in one workspace.
            </p>
          </div>
          <div className="mt-12 grid gap-4 max-w-md">
            <FloatCard icon={<Shield className="h-5 w-5 text-success" />} title="Authenticity Score" value="92 / 100" />
            <FloatCard icon={<TrendingUp className="h-5 w-5 text-accent" />} title="Avg. Engagement" value="+38% lift" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-card)]">
      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-background/40">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
