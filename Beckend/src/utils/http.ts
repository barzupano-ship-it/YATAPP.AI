export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function parseId(value: string | string[] | undefined, fieldName = "id"): number {
  const str = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(str ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }
  return parsed;
}
