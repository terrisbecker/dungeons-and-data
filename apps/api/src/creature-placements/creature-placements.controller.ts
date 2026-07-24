import type { Request, Response } from "express";
import { badRequest } from "../http/http-error.js";
import { requireUuid } from "../http/validate.js";
import {
  createCreaturePlacementService,
  deleteCreaturePlacementService,
  getCreaturePlacementService,
  listCreaturePlacementsService,
  updateCreaturePlacementService,
} from "./creature-placements.service.js";

export async function postCreaturePlacement(req: Request, res: Response) {
  res.status(201).json(await createCreaturePlacementService(req.body));
}

export async function getCreaturePlacements(req: Request, res: Response) {
  const { creatureId, locationId } = req.query;
  if (creatureId === undefined && locationId === undefined) {
    throw badRequest();
  }
  res.json(
    await listCreaturePlacementsService({
      creatureId:
        creatureId === undefined ? undefined : requireUuid(creatureId),
      locationId:
        locationId === undefined ? undefined : requireUuid(locationId),
    }),
  );
}

export async function getCreaturePlacement(req: Request, res: Response) {
  const creatureId = requireUuid(req.params.creatureId);
  const locationId = requireUuid(req.params.locationId);
  res.json(await getCreaturePlacementService(creatureId, locationId));
}

export async function patchCreaturePlacement(req: Request, res: Response) {
  const creatureId = requireUuid(req.params.creatureId);
  const locationId = requireUuid(req.params.locationId);
  res.json(
    await updateCreaturePlacementService(creatureId, locationId, req.body),
  );
}

export async function deleteCreaturePlacementHandler(
  req: Request,
  res: Response,
) {
  const creatureId = requireUuid(req.params.creatureId);
  const locationId = requireUuid(req.params.locationId);
  await deleteCreaturePlacementService(creatureId, locationId);
  res.status(204).send();
}
