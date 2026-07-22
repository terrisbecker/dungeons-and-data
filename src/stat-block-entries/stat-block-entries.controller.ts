import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createStatBlockEntryService,
  deleteStatBlockEntryService,
  getStatBlockEntryService,
  listStatBlockEntriesService,
  updateStatBlockEntryService,
} from "./stat-block-entries.service.js";

export async function postStatBlockEntry(req: Request, res: Response) {
  res.status(201).json(await createStatBlockEntryService(req.body));
}

export async function getStatBlockEntries(req: Request, res: Response) {
  const creatureId = requireUuid(req.query.creatureId);
  res.json(await listStatBlockEntriesService(creatureId));
}

export async function getStatBlockEntry(req: Request, res: Response) {
  res.json(await getStatBlockEntryService(requireUuid(req.params.id)));
}

export async function patchStatBlockEntry(req: Request, res: Response) {
  res.json(
    await updateStatBlockEntryService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteStatBlockEntryHandler(req: Request, res: Response) {
  await deleteStatBlockEntryService(requireUuid(req.params.id));
  res.status(204).send();
}
