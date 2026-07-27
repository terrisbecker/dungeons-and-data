import { notFound, redirect } from "next/navigation";
import type { CharacterSheet, MeResponse } from "@dnd/shared";
import { ApiRequestError, getCharacterSheet, getMe } from "@/lib/api";
import { CharacterSheetView } from "./character-sheet";
import { canManageCharacter } from "./character-data";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let sheet: CharacterSheet;
  let me: MeResponse;
  try {
    [sheet, me] = await Promise.all([getCharacterSheet(id), getMe()]);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // Token missing/expired at the API — clear it and bounce to login (a plain
      // redirect would loop against the proxy, which still sees the cookie).
      if (error.status === 401) redirect("/api/auth/logout");
      if (error.status === 404 || error.status === 400) notFound();
    }
    throw error;
  }

  return (
    <CharacterSheetView
      sheet={sheet}
      canManage={canManageCharacter(me, sheet)}
    />
  );
}
