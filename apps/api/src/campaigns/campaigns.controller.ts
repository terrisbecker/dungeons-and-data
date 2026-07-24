import type { Request, Response } from "express";
import { unauthorized } from "../http/http-error.js";
import { requireUuid } from "../http/validate.js";
import {
  createCampaignService,
  deleteCampaignService,
  getCampaignService,
  listCampaignsService,
  updateCampaignService,
} from "./campaigns.service.js";

export async function postCampaign(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees req.auth; the check keeps the type honest.
  if (!req.auth) throw unauthorized();
  res
    .status(201)
    .json(await createCampaignService(req.body, req.auth.playerId));
}

export async function getCampaigns(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await listCampaignsService());
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  res.json(await getCampaignService(requireUuid(req.params.id)));
}

export async function patchCampaign(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(await updateCampaignService(requireUuid(req.params.id), req.body));
}

export async function deleteCampaignHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteCampaignService(requireUuid(req.params.id));
  res.status(204).send();
}
