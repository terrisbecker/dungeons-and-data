import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createMembershipService,
  deleteMembershipService,
  getMembershipService,
  listMembershipsService,
  updateMembershipService,
} from "./campaign-memberships.service.js";

export async function postMembership(
  req: Request,
  res: Response,
): Promise<void> {
  res.status(201).json(await createMembershipService(req.body));
}

export async function getMemberships(
  req: Request,
  res: Response,
): Promise<void> {
  const { campaignId, playerId } = req.query;
  res.json(
    await listMembershipsService({
      campaignId:
        campaignId === undefined ? undefined : requireUuid(campaignId),
      playerId: playerId === undefined ? undefined : requireUuid(playerId),
    }),
  );
}

export async function getMembership(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(await getMembershipService(requireUuid(req.params.id)));
}

export async function patchMembership(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(await updateMembershipService(requireUuid(req.params.id), req.body));
}

export async function deleteMembershipHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteMembershipService(requireUuid(req.params.id));
  res.status(204).send();
}
