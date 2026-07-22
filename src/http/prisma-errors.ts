import { Prisma } from "@prisma/client";
import { badRequest, conflict, HttpError, notFound } from "./http-error.js";

// Translate a Prisma known-request error into an HttpError. Services wrap their
// write calls with this so callers get a clean status instead of a raw Prisma
// error. Anything unrecognized is rethrown for the error middleware to 500.
export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025": // record required by the operation was not found
        throw notFound();
      case "P2002": // unique constraint violation
        throw conflict();
      case "P2003": // foreign key constraint violation
        throw badRequest();
    }
  }
  if (error instanceof HttpError) {
    throw error;
  }
  throw error;
}
