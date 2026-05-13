import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/roles";
import { LogOut, LayoutDashboard } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { role, onboarded } = useRole();
  const navigate = useNavigate();
  const homeFor = (): "/dashboard" | "/requests" | "/onboarding" =>
    !onboarded ? "/onboarding" : role === "influencer" ? "/requests" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" hash="features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/" hash="preview" className="hover:text-foreground transition-colors">Preview</Link>
          <Link to="/" hash="pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: homeFor() })}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {!onboarded ? "Continue setup" : "Dashboard"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
                Log in
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate({ to: "/signup" })}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
