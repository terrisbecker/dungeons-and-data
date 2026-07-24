import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./http-error.js";

// Central error handler, mounted last in createApp(). Express 5 forwards
// rejected promises from async handlers here automatically. Responses are kept
// generic on purpose.
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // Express treats a 4-arg function as error middleware; `next` must be present.
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
