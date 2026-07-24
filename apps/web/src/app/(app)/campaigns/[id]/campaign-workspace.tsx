"use client";

import Link from "next/link";
import {
  ChevronLeftIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  SettingsIcon,
  SwordsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { Campaign } from "@dnd/shared";
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
        <main className="flex-1 p-6" />
      </SidebarInset>
    </SidebarProvider>
  );
}
