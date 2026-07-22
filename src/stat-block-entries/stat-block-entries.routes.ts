import { Router } from "express";
import {
  deleteStatBlockEntryHandler,
  getStatBlockEntries,
  getStatBlockEntry,
  patchStatBlockEntry,
  postStatBlockEntry,
} from "./stat-block-entries.controller.js";

export const statBlockEntriesRouter = Router();

statBlockEntriesRouter.post("/", postStatBlockEntry);
statBlockEntriesRouter.get("/", getStatBlockEntries);
statBlockEntriesRouter.get("/:id", getStatBlockEntry);
statBlockEntriesRouter.patch("/:id", patchStatBlockEntry);
statBlockEntriesRouter.delete("/:id", deleteStatBlockEntryHandler);
