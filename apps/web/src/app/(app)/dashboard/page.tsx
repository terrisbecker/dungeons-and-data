import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import type { CharacterSummary, MeResponse } from "@dnd/shared";
import { ApiRequestError, getMe, getMyCharacters } from "@/lib/api";
import { getSessionClaims } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import { JoinCampaignDialog } from "./join-campaign-dialog";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  // playerId comes from the session cookie's JWT, so the character list can load
  // in parallel with /auth/me instead of waiting on it (memberships/displayName
  // still need /auth/me). Promise.all fires both on one round-trip.
  const claims = await getSessionClaims();
  if (!claims) redirect("/api/auth/logout");

  let me: MeResponse;
  let characters: CharacterSummary[];
  try {
    [me, characters] = await Promise.all([
      getMe(),
      getMyCharacters(claims.playerId),
    ]);
  } catch (error) {
    // Token missing/expired at the API — clear it and bounce to login (a plain
    // redirect would loop against the proxy, which still sees the cookie).
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  const dmOf = me.memberships.filter((m) => m.role === "DUNGEON_MASTER");
  // Only Admins and DMs may author the shared catalogs (the API's guardCatalog
  // enforces this; we hide the entry point for everyone else).
  const canManageCatalogs = me.systemRole === "ADMIN" || dmOf.length > 0;
  const CATALOGS = [
    { href: "/catalog/items", label: "Items" },
    { href: "/catalog/spells", label: "Spells" },
    { href: "/catalog/feats", label: "Feats" },
    { href: "/catalog/features", label: "Features" },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {me.displayName ?? me.username}
          </h1>
          <p className="text-muted-foreground text-sm">@{me.username}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your global role on the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-1 text-sm font-medium">
              {me.systemRole}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              {me.memberships.length === 0
                ? "You are not in any campaigns yet."
                : `${me.memberships.length} membership(s), ${dmOf.length} as Dungeon Master.`}
            </CardDescription>
            <CardAction className="flex gap-2">
              <JoinCampaignDialog />
              <CreateCampaignDialog />
            </CardAction>
          </CardHeader>
          {me.memberships.length > 0 && (
            <CardContent className="flex flex-col gap-2">
              {me.memberships.map((m) => (
                <Link
                  key={m.id}
                  href={`/campaigns/${m.campaign.id}`}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{m.campaign.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.campaign.status}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {m.role === "DUNGEON_MASTER" ? "Dungeon Master" : "Player"}
                  </span>
                </Link>
              ))}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Characters</CardTitle>
            <CardDescription>
              {characters.length === 0
                ? "No characters yet."
                : `${characters.length} character(s).`}
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/characters/new" />}
              >
                <PlusIcon />
                New character
              </Button>
            </CardAction>
          </CardHeader>
          {characters.length > 0 && (
            <CardContent className="flex flex-col gap-2">
              {characters.map((c) => (
                <Link
                  key={c.id}
                  href={`/characters/${c.id}`}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{c.characterName}</p>
                    <p className="text-muted-foreground text-xs">{c.race}</p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    HP {c.currentHitPoints}/{c.maxHitPoints} · AC {c.armorClass}
                  </span>
                </Link>
              ))}
            </CardContent>
          )}
        </Card>

        {canManageCatalogs && (
          <Card>
            <CardHeader>
              <CardTitle>Catalogs</CardTitle>
              <CardDescription>
                Shared items, spells, feats, and features players can add to
                their characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {CATALOGS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                >
                  <span className="font-medium">{c.label}</span>
                  <ChevronRightIcon className="text-muted-foreground size-4" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
