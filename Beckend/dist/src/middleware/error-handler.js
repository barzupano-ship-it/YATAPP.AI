"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const http_1 = require("../utils/http");
function notFoundHandler(_req, _res, next) {
    next(new http_1.HttpError(404, "Route not found"));
}
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({
            error: error.issues[0]?.message || "Validation error",
            details: error.issues,
        });
        return;
    }
    if (error instanceof http_1.HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
}
