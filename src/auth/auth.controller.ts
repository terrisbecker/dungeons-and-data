import type { Request, Response } from "express";
import { unauthorized } from "../http/http-error.js";
import { loginService, meService, registerService } from "./auth.service.js";

export async function postRegister(req: Request, res: Response): Promise<void> {
  res.status(201).json(await registerService(req.body));
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  res.status(200).json(await loginService(req.body));
}

export async function getMe(req: Request, res: Response): Promise<void> {
  // Behind requireAuth, so req.auth is set; the check keeps the type honest.
  if (!req.auth) throw unauthorized();
  res.json(await meService(req.auth.playerId));
}
