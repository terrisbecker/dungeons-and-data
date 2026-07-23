import { Router } from "express";
import {
  guardCreatureByBody,
  guardStatBlockEntryByParam,
} from "../auth/guards.js";
import {
  deleteStatBlockEntryHandler,
  getStatBlockEntries,
  getStatBlockEntry,
  patchStatBlockEntry,
  postStatBlockEntry,
} from "./stat-block-entries.controller.js";

export const statBlockEntriesRouter = Router();

statBlockEntriesRouter.post("/", guardCreatureByBody, postStatBlockEntry);
statBlockEntriesRouter.get("/", getStatBlockEntries);
statBlockEntriesRouter.get("/:id", getStatBlockEntry);
statBlockEntriesRouter.patch(
  "/:id",
  guardStatBlockEntryByParam,
  patchStatBlockEntry,
);
statBlockEntriesRouter.delete(
  "/:id",
  guardStatBlockEntryByParam,
  deleteStatBlockEntryHandler,
);
