"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Each item is a real route under /campaigns/[id]; "" is the Overview leaf.
type NavItem = { title: string; icon: LucideIcon; segment: string };

const NAV_ITEMS: NavItem[] = [
  { title: "Overview", icon: LayoutDashboardIcon, segment: "" },
  { title: "Characters", icon: UsersIcon, segment: "/characters" },
  { title: "Locations", icon: MapPinIcon, segment: "/locations" },
  { title: "Encounters", icon: SwordsIcon, segment: "/encounters" },
  { title: "Settings", icon: SettingsIcon, segment: "/settings" },
];

export function CampaignWorkspace({
  campaign,
  children,
}: {
  campaign: Campaign;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/campaigns/${campaign.id}`;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-0.5 px-2 py-3">
          <span className="font-heading text-sm font-medium">
            {campaign.name}
          </span>
          <span className="text-muted-foreground text-xs capitalize">
            {campaign.status.toLowerCase().replace("_", " ")}
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Campaign</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const href = `${base}${item.segment}`;
                  // Overview only matches exactly; the rest stay lit while
                  // drilled into a sub-route (e.g. /locations/<id>).
                  const isActive =
                    item.segment === ""
                      ? pathname === base
                      : pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
