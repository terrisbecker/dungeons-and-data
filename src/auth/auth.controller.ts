import type { Request, Response } from "express";
import { loginService, registerService } from "./auth.service.js";

export async function postRegister(req: Request, res: Response): Promise<void> {
  res.status(201).json(await registerService(req.body));
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  res.status(200).json(await loginService(req.body));
}
