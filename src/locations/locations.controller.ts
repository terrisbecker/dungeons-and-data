import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createLocationService,
  deleteLocationService,
  getLocationService,
  listLocationsService,
  updateLocationService,
} from "./locations.service.js";

export async function postLocation(req: Request, res: Response) {
  res.status(201).json(await createLocationService(req.body));
}

export async function getLocations(_req: Request, res: Response) {
  res.json(await listLocationsService());
}

export async function getLocation(req: Request, res: Response) {
  res.json(await getLocationService(requireUuid(req.params.id)));
}

export async function patchLocation(req: Request, res: Response) {
  res.json(await updateLocationService(requireUuid(req.params.id), req.body));
}

export async function deleteLocationHandler(req: Request, res: Response) {
  await deleteLocationService(requireUuid(req.params.id));
  res.status(204).send();
}
