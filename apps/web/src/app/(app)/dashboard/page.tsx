import { redirect } from "next/navigation";
import type { MeResponse } from "@dnd/shared";
import { ApiRequestError, getMe } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  let me: MeResponse;
  try {
    me = await getMe();
  } catch (error) {
    // Token missing/expired at the API — clear it and bounce to login (a plain
    // redirect would loop against the proxy, which still sees the cookie).
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  const dmOf = me.memberships.filter((m) => m.role === "DUNGEON_MASTER");

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
          </CardHeader>
          {me.memberships.length > 0 && (
            <CardContent className="flex flex-col gap-2">
              {me.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border p-3"
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
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}
