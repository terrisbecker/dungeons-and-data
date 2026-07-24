"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  SettingsIcon,
  SwordsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavItem = { title: string; icon: LucideIcon };

// Placeholder navigation — non-functional scaffold for now.
const NAV_ITEMS: NavItem[] = [
  { title: "Overview", icon: LayoutDashboardIcon },
  { title: "Characters", icon: UsersIcon },
  { title: "Locations", icon: MapPinIcon },
  { title: "Encounters", icon: SwordsIcon },
  { title: "Settings", icon: SettingsIcon },
];

// The campaign id doubles as the invite code — a DM shares it and players paste
// it into "Join campaign" on their dashboard. Shown with a copy-to-clipboard
// button so it's easy to hand off.
function InviteCard({ campaignId }: { campaignId: string }) {
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

export function CampaignWorkspace({ campaign }: { campaign: Campaign }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-0.5 px-2 py-3">
          <span className="font-heading text-sm font-medium">
            {campaign.name}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {campaign.status.toLowerCase().replace("_", " ")}
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Campaign</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={index === 0}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Back to dashboard"
                render={<Link href="/dashboard" />}
              >
                <ChevronLeftIcon />
                <span>Back to dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">{campaign.name}</span>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto grid w-full max-w-2xl gap-4">
            <InviteCard campaignId={campaign.id} />

            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
                <CardDescription>
                  {campaign.memberships.length} member(s) in this campaign.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {campaign.memberships.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="font-medium">
                      {m.player.displayName ?? m.player.username}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {m.role === "DUNGEON_MASTER"
                        ? "Dungeon Master"
                        : "Player"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
