import { Router } from "express";
import {
  guardMembershipByParamId,
  guardMembershipCreate,
} from "../auth/guards.js";
import {
  deleteMembershipHandler,
  getMembership,
  getMemberships,
  patchMembership,
  postMembership,
} from "./campaign-memberships.controller.js";

export const campaignMembershipsRouter = Router();

campaignMembershipsRouter.post("/", guardMembershipCreate, postMembership);
campaignMembershipsRouter.get("/", getMemberships);
campaignMembershipsRouter.get("/:id", getMembership);
campaignMembershipsRouter.patch(
  "/:id",
  guardMembershipByParamId,
  patchMembership,
);
campaignMembershipsRouter.delete(
  "/:id",
  guardMembershipByParamId,
  deleteMembershipHandler,
);
