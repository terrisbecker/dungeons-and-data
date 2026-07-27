import Link from "next/link";
import { PlusIcon, SkullIcon } from "lucide-react";
import type { CreatureKind, CreatureSummary } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CREATURE_KINDS,
  creatureSubtitle,
  formatChallengeRating,
} from "@/lib/creature-labels";
import { cn } from "@/lib/utils";
import type { CreatureScope } from "./creatures-data";

// The campaign's bestiary. Stays a server component: the filters are links that
// set ?kind / ?scope, so a filtered view is shareable and there is no client
// state to keep in sync.

type Filter = { label: string; href: string; active: boolean };

function filterHref(
  base: string,
  kind: CreatureKind | undefined,
  scope: CreatureScope,
): string {
  const query = new URLSearchParams();
  if (kind) query.set("kind", kind);
  if (scope !== "all") query.set("scope", scope);
  const search = query.toString();
  return search ? `${base}?${search}` : base;
}

function FilterRow({ label, items }: { label: string; items: Filter[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
            item.active
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:border-ring text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function CreatureGrid({
  base,
  creatures,
}: {
  base: string;
  creatures: CreatureSummary[];
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {creatures.map((creature) => (
        <li key={creature.id}>
          <Link href={`${base}/${creature.id}`} className="block h-full">
            <Card className="hover:border-ring h-full transition-colors">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2">
                  <SkullIcon className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="truncate">{creature.name}</span>
                </CardTitle>
                <span className="text-muted-foreground text-xs">
                  {creatureSubtitle(creature)}
                </span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">{CREATURE_KINDS[creature.kind]}</Badge>
                <span className="text-muted-foreground tabular-nums">
                  AC {creature.armorClass} · {creature.hitPoints} HP
                </span>
                {creature.challengeRating !== null && (
                  <span className="text-muted-foreground tabular-nums">
                    CR {formatChallengeRating(creature.challengeRating)}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CreaturesBrowser({
  campaignId,
  creatures,
  kind,
  scope,
  canManage,
  canManageShared,
}: {
  campaignId: string;
  creatures: CreatureSummary[];
  kind: CreatureKind | undefined;
  scope: CreatureScope;
  canManage: boolean;
  canManageShared: boolean;
}) {
  const base = `/campaigns/${campaignId}/creatures`;
  const own = creatures.filter((c) => c.campaignId !== null);
  const shared = creatures.filter((c) => c.campaignId === null);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-lg font-medium">Creatures</h1>
          <p className="text-muted-foreground max-w-prose text-sm">
            The NPCs and monsters of this campaign, alongside the shared
            bestiary every game can draw from.
          </p>
        </div>
        {(canManage || canManageShared) && (
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`${base}/new`} />}
          >
            <PlusIcon />
            New creature
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <FilterRow
          label="Kind"
          items={[
            {
              label: "All",
              href: filterHref(base, undefined, scope),
              active: kind === undefined,
            },
            {
              label: "NPCs",
              href: filterHref(base, "NPC", scope),
              active: kind === "NPC",
            },
            {
              label: "Monsters",
              href: filterHref(base, "MONSTER", scope),
              active: kind === "MONSTER",
            },
          ]}
        />
        <FilterRow
          label="Scope"
          items={[
            {
              label: "All",
              href: filterHref(base, kind, "all"),
              active: scope === "all",
            },
            {
              label: "This campaign",
              href: filterHref(base, kind, "campaign"),
              active: scope === "campaign",
            },
            {
              label: "Shared",
              href: filterHref(base, kind, "shared"),
              active: scope === "shared",
            },
          ]}
        />
      </div>

      {scope !== "shared" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            This campaign
          </h2>
          {own.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No creatures of your own yet.
            </p>
          ) : (
            <CreatureGrid base={base} creatures={own} />
          )}
        </section>
      )}

      {scope !== "campaign" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Shared bestiary
          </h2>
          {shared.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing in the shared bestiary yet.
            </p>
          ) : (
            <CreatureGrid base={base} creatures={shared} />
          )}
        </section>
      )}
    </div>
  );
}
