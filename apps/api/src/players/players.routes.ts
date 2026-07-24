import { Router } from "express";
import { guardAdmin, guardPlayerUpdate } from "../auth/guards.js";
import {
  deletePlayerHandler,
  getPlayer,
  getPlayers,
  patchPlayer,
} from "./players.controller.js";

// Account creation lives in /auth/register; this router manages existing rows.
export const playersRouter = Router();

playersRouter.get("/", getPlayers);
playersRouter.get("/:id", getPlayer);
playersRouter.patch("/:id", guardPlayerUpdate, patchPlayer);
playersRouter.delete("/:id", guardAdmin, deletePlayerHandler);
