"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The campaign id doubles as the invite code — a DM shares it and players paste
// it into "Join campaign" on their dashboard. Shown with a copy-to-clipboard
// button so it's easy to hand off.
export function InviteCard({ campaignId }: { campaignId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(campaignId);
      setCopied(true);
      toast.success("Campaign id copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite players</CardTitle>
        <CardDescription>
          Share this campaign id. Players join by pasting it into “Join
          campaign” on their dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <code className="bg-muted flex-1 truncate rounded-md px-3 py-2 font-mono text-sm">
          {campaignId}
        </code>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardContent>
    </Card>
  );
}
