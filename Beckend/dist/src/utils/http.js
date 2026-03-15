"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.parseId = parseId;
class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.HttpError = HttpError;
function parseId(value, fieldName = "id") {
    const str = Array.isArray(value) ? value[0] : value;
    const parsed = Number.parseInt(String(str ?? ""), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new HttpError(400, `Invalid ${fieldName}`);
    }
    return parsed;
}
