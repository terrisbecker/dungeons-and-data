import Link from "next/link";
import { ChevronRightIcon, MapPinIcon } from "lucide-react";
import type { LocationDetail, LocationRow } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteLocationDialog } from "./delete-location-dialog";
import { LocationCreatures } from "./location-creatures";
import { LocationFormDialog } from "./location-form-dialog";
import { ancestorsOf, childrenOf, indexLocations } from "./location-tree";

// One component for every level of the hierarchy: `current` is null at the top
// (the campaign's root locations) and the location being viewed below that.
// Stays a server component — only the create/edit/delete dialogs are client.
export function LocationsBrowser({
  campaignId,
  all,
  current,
  canManage,
}: {
  campaignId: string;
  all: LocationRow[];
  current: LocationDetail | null;
  canManage: boolean;
}) {
  const base = `/campaigns/${campaignId}/locations`;
  const index = indexLocations(all);
  const trail = current ? ancestorsOf(current.id, index) : [];
  const children = childrenOf(current?.id ?? null, all);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
      >
        <Link href={base} className="hover:text-foreground">
          Locations
        </Link>
        {trail.map((step) => (
          <span key={step.id} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3" />
            <Link href={`${base}/${step.id}`} className="hover:text-foreground">
              {step.locationName}
            </Link>
          </span>
        ))}
        {current && (
          <span className="flex items-center gap-1">
            <ChevronRightIcon className="size-3" />
            <span className="text-foreground">{current.locationName}</span>
          </span>
        )}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading flex items-center gap-2 text-lg font-medium">
            {current ? current.locationName : "Locations"}
            {current && <Badge variant="outline">{current.type}</Badge>}
          </h1>
          <p className="text-muted-foreground max-w-prose text-sm">
            {current
              ? (current.description ?? "No description yet.")
              : "The top level of this campaign's world. Open one to go a level deeper."}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <LocationFormDialog
              campaignId={campaignId}
              all={all}
              defaultParentId={current?.id ?? null}
            />
            {current && (
              <>
                <LocationFormDialog
                  campaignId={campaignId}
                  all={all}
                  editing={current}
                />
                <DeleteLocationDialog
                  campaignId={campaignId}
                  location={current}
                  childCount={children.length}
                />
              </>
            )}
          </div>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {current ? "Sub-locations" : "Top level"}
        </h2>
        {children.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {current
              ? "Nothing inside this location yet."
              : "No locations in this campaign yet."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const grandchildren = childrenOf(child.id, all).length;
              return (
                <li key={child.id}>
                  <Link href={`${base}/${child.id}`} className="block h-full">
                    <Card className="hover:border-ring h-full transition-colors">
                      <CardHeader className="gap-1">
                        <CardTitle className="flex items-center gap-2">
                          <MapPinIcon className="text-muted-foreground size-3.5 shrink-0" />
                          <span className="truncate">{child.locationName}</span>
                        </CardTitle>
                        <Badge variant="outline">{child.type}</Badge>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        {child.description && (
                          <p className="text-muted-foreground line-clamp-3 text-xs/relaxed">
                            {child.description}
                          </p>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {grandchildren === 0
                            ? "No sub-locations"
                            : `${grandchildren} sub-location${grandchildren === 1 ? "" : "s"}`}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {current && (
        <LocationCreatures
          campaignId={campaignId}
          location={current}
          canManage={canManage}
        />
      )}
    </div>
  );
}
