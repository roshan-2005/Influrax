import { createFileRoute } from "@tanstack/react-router";

interface OgResult {
  image: string;
  title: string;
  description: string;
  siteName: string;
  url: string;
}

function getMeta(html: string, property: string): string {
  const variants = [
    new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
  ];
  for (const re of variants) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function absoluteUrl(maybeRelative: string, base: string): string {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

export const Route = createFileRoute("/api/fetch-og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");

        if (!target) {
          return Response.json({ error: "url query param is required" }, { status: 400 });
        }

        let normalized: string;
        try {
          normalized = target.startsWith("http") ? target : `https://${target}`;
          new URL(normalized);
        } catch {
          return Response.json({ error: "Invalid URL" }, { status: 400 });
        }

        try {
          const res = await fetch(normalized, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; InfluraXBot/1.0; +https://influrax.app)",
              Accept: "text/html,application/xhtml+xml",
            },
            redirect: "follow",
          });
          if (!res.ok) {
            return Response.json(
              { error: `Upstream returned ${res.status}` },
              { status: 502 },
            );
          }
          // Cap body to ~1 MB
          const text = await res.text();
          const html = text.slice(0, 1_000_000);

          const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
          const rawImage =
            getMeta(html, "og:image") || getMeta(html, "twitter:image") || "";
          const image = absoluteUrl(rawImage, normalized);
          const title =
            getMeta(html, "og:title") || getMeta(html, "twitter:title") || titleTag;
          const description =
            getMeta(html, "og:description") ||
            getMeta(html, "twitter:description") ||
            getMeta(html, "description");
          const siteName = getMeta(html, "og:site_name");

          const result: OgResult = {
            image,
            title: title.trim(),
            description: description.trim(),
            siteName: siteName.trim(),
            url: normalized,
          };
          return Response.json(result, {
            headers: { "Cache-Control": "public, max-age=3600" },
          });
        } catch (e) {
          return Response.json(
            {
              error: "Failed to fetch URL",
              details: e instanceof Error ? e.message : String(e),
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
