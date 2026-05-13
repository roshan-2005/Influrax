import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InfluraX — Find the right influencer. Predict the right outcome." },
      {
        name: "description",
        content:
          "InfluraX helps D2C brands discover, vet, and manage influencers across Instagram, YouTube, Facebook & X — with engagement and authenticity scoring.",
      },
      { name: "author", content: "InfluraX" },
      { property: "og:title", content: "InfluraX — Find the right influencer. Predict the right outcome." },
      {
        property: "og:description",
        content:
          "Discover influencers, score authenticity, and run campaigns that predict outcomes — built for Indian D2C brands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "InfluraX — Find the right influencer. Predict the right outcome." },
      { name: "description", content: "InfluraX is an AI-powered influencer marketing platform that helps brands discover, evaluate, and collaborate with the right influencers for product promotions." },
      { property: "og:description", content: "InfluraX is an AI-powered influencer marketing platform that helps brands discover, evaluate, and collaborate with the right influencers for product promotions." },
      { name: "twitter:description", content: "InfluraX is an AI-powered influencer marketing platform that helps brands discover, evaluate, and collaborate with the right influencers for product promotions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a26525f8-f90d-48bd-b1ce-c2cfd0d9a9d6/id-preview-0a49f3f5--a1ac7061-33a0-4d46-a2d6-dd7e4af898e5.lovable.app-1776751659356.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a26525f8-f90d-48bd-b1ce-c2cfd0d9a9d6/id-preview-0a49f3f5--a1ac7061-33a0-4d46-a2d6-dd7e4af898e5.lovable.app-1776751659356.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
