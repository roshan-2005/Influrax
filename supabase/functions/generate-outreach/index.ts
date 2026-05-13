import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  influencer: {
    name: string;
    handle: string;
    platform: string;
    niche: string;
    followers: number;
    engagementRate: number;
    authenticityScore: number;
    location: string;
  };
  campaign: {
    name: string;
    niche?: string | null;
    budget?: number | null;
    description?: string | null;
  };
  brand?: {
    name?: string;
    senderName?: string;
  };
  channel: "email" | "dm";
  tone?: "warm" | "professional" | "casual";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { influencer, campaign, brand, channel, tone = "warm" } = body;
    const isEmail = channel === "email";

    const systemPrompt = `You are an expert influencer marketing manager writing personalised outreach to creators in India. Be ${tone}, specific, and respectful of the creator's craft. Reference their niche and audience. Keep it short and human — no fluff, no emojis spam, no clichés like "I hope this email finds you well". Indian-English friendly.`;

    const userPrompt = `Write a ${isEmail ? "short outreach email" : "concise Instagram/X DM"} from ${brand?.senderName ?? "our team"} at ${brand?.name ?? "our brand"} to this creator.

CREATOR
- Name: ${influencer.name}
- Handle: ${influencer.handle}
- Platform: ${influencer.platform}
- Niche: ${influencer.niche}
- Location: ${influencer.location}
- Followers: ${influencer.followers.toLocaleString("en-IN")}
- Engagement rate: ${influencer.engagementRate}%
- Authenticity score: ${influencer.authenticityScore}/100

CAMPAIGN
- Name: ${campaign.name}
- Niche: ${campaign.niche ?? "—"}
- Budget: ${campaign.budget ? `₹${campaign.budget.toLocaleString("en-IN")}` : "flexible"}
- Brief: ${campaign.description ?? "Brand collaboration to drive awareness and conversions."}

GOAL: invite them to collaborate, propose a quick call.

Use the structured tool to return your output.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "draft_outreach",
          description: "Return a personalised outreach draft.",
          parameters: {
            type: "object",
            properties: {
              subject: {
                type: "string",
                description: isEmail
                  ? "A short, specific email subject line (no clickbait)."
                  : "Empty string — DMs do not have subjects.",
              },
              body: {
                type: "string",
                description: isEmail
                  ? "The email body, 90-140 words. Use line breaks. End with a clear CTA."
                  : "The DM body, 50-80 words. One clear CTA at the end.",
              },
            },
            required: ["subject", "body"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "draft_outreach" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Add credits in Settings → Workspace → Usage to continue generating drafts.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return a draft" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({ subject: args.subject ?? "", body: args.body ?? "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-outreach error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
