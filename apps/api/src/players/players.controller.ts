import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  deletePlayerService,
  getPlayerService,
  listPlayersService,
  updatePlayerService,
} from "./players.service.js";

export async function getPlayers(_req: Request, res: Response): Promise<void> {
  res.json(await listPlayersService());
}

export async function getPlayer(req: Request, res: Response): Promise<void> {
  res.json(await getPlayerService(requireUuid(req.params.id)));
}

export async function patchPlayer(req: Request, res: Response): Promise<void> {
  res.json(await updatePlayerService(requireUuid(req.params.id), req.body));
}

export async function deletePlayerHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await deletePlayerService(requireUuid(req.params.id));
  res.status(204).send();
}
