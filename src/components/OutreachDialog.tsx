import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Copy, Save, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { getInfluencerById } from "@/lib/influencers";

interface OutreachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: {
    id: string;
    name: string;
    niche: string | null;
    budget: number | null;
    description: string | null;
  };
  saved: {
    id: string; // campaign_influencers row id
    influencer_id: string;
    influencer_name: string;
    influencer_handle: string | null;
    platform: string;
    niche: string | null;
    followers: number | null;
    location: string | null;
  };
  onMarkContacted?: () => void;
  aiEnabled: boolean;
}

export function OutreachDialog({
  open,
  onOpenChange,
  campaign,
  saved,
  onMarkContacted,
  aiEnabled,
}: OutreachDialogProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<"email" | "dm">("email");
  const [tone, setTone] = useState<"warm" | "professional" | "casual">("warm");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!aiEnabled) {
      toast.error("AI outreach drafts are a Pro feature. Upgrade to unlock.");
      return;
    }
    setGenerating(true);
    try {
      const inf = getInfluencerById(saved.influencer_id);
      const { data, error } = await supabase.functions.invoke("generate-outreach", {
        body: {
          influencer: {
            name: saved.influencer_name,
            handle: saved.influencer_handle ?? "",
            platform: saved.platform,
            niche: saved.niche ?? inf?.niche ?? "",
            followers: saved.followers ?? inf?.followers ?? 0,
            engagementRate: inf?.engagementRate ?? 3,
            authenticityScore: inf?.authenticityScore ?? 80,
            location: saved.location ?? inf?.location ?? "India",
          },
          campaign: {
            name: campaign.name,
            niche: campaign.niche,
            budget: campaign.budget,
            description: campaign.description,
          },
          channel,
          tone,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        toast.error((data as { error: string }).error);
        return;
      }
      setSubject((data as { subject: string }).subject ?? "");
      setBody((data as { body: string }).body ?? "");
      toast.success("Draft generated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate draft";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!user || !body.trim()) {
      toast.error("Write or generate a draft first");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("outreach_drafts").insert({
      user_id: user.id,
      campaign_influencer_id: saved.id,
      channel,
      subject: subject || null,
      body,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Draft saved");
  }

  function handleCopy() {
    const text = channel === "email" && subject ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  async function handleMarkContacted() {
    const { error } = await supabase
      .from("campaign_influencers")
      .update({ status: "contacted" })
      .eq("id", saved.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as contacted");
    onMarkContacted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Outreach to {saved.influencer_name}</DialogTitle>
          <DialogDescription>
            Personalised draft for the “{campaign.name}” campaign on {saved.platform}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "dm")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</span>
                </SelectItem>
                <SelectItem value="dm">
                  <span className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> DM</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {channel === "email" && (
          <div className="space-y-1.5">
            <Label htmlFor="subj" className="text-xs">Subject</Label>
            <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line…" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="bdy" className="text-xs">Message</Label>
          <Textarea
            id="bdy"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={aiEnabled ? "Click Generate, or write your own…" : "Write your outreach message…"}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="glass" onClick={handleSaveDraft} disabled={saving || !body.trim()}>
            <Save className="h-4 w-4" /> Save draft
          </Button>
          <Button variant="glass" onClick={handleCopy} disabled={!body.trim()}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
          {aiEnabled && (
            <Button variant="hero" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4" /> {generating ? "Generating…" : "Generate with AI"}
            </Button>
          )}
          <Button variant="hero" onClick={handleMarkContacted} disabled={!body.trim()}>
            Mark as contacted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
