// A lightweight error type carrying an HTTP status. Controllers and services
// throw these; the central error middleware turns them into responses. Messages
// are intentionally generic for now.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message = "Bad Request"): HttpError {
  return new HttpError(400, message);
}

export function notFound(message = "Not Found"): HttpError {
  return new HttpError(404, message);
}

export function conflict(message = "Conflict"): HttpError {
  return new HttpError(409, message);
}
