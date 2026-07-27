import { CreatureKind } from "@prisma/client";
import type { Request, Response } from "express";
import { optionalEnum, requireUuid } from "../http/validate.js";
import {
  createCreatureService,
  deleteCreatureService,
  getCreatureService,
  getCreatureSheetService,
  listCreaturesService,
  updateCreatureService,
} from "./creatures.service.js";

export async function postCreature(req: Request, res: Response) {
  res.status(201).json(await createCreatureService(req.body));
}

export async function getCreatures(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  res.json(
    await listCreaturesService({
      campaignId:
        typeof query.campaignId === "string"
          ? requireUuid(query.campaignId)
          : undefined,
      // Opt-in so a campaign browse can show the shared bestiary alongside its
      // own creatures; on its own it narrows to the shared rows.
      includeShared: query.includeShared === "true",
      kind: optionalEnum(query, "kind", Object.values(CreatureKind)),
    }),
  );
}

export async function getCreature(req: Request, res: Response) {
  res.json(await getCreatureService(requireUuid(req.params.id)));
}

export async function getCreatureSheet(req: Request, res: Response) {
  res.json(await getCreatureSheetService(requireUuid(req.params.id)));
}

export async function patchCreature(req: Request, res: Response) {
  res.json(await updateCreatureService(requireUuid(req.params.id), req.body));
}

export async function deleteCreatureHandler(req: Request, res: Response) {
  await deleteCreatureService(requireUuid(req.params.id));
  res.status(204).send();
}
