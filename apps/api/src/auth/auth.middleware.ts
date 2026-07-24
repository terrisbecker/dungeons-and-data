import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../http/http-error.js";
import { verifyToken } from "./jwt.js";

// Authentication gate. Reads a Bearer token, verifies it, and attaches the
// caller to `req.auth`. Mounted globally in app.ts after the public routes, so
// every resource route below it requires a valid token. Authorization (who may
// write what) is enforced separately by the guards in guards.ts.
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw unauthorized();
  }
  const token = header.slice("Bearer ".length).trim();
  req.auth = verifyToken(token);
  next();
}
