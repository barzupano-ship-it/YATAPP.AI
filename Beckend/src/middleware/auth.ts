import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";

type TokenPayload = {
  userId: number;
  role: UserRole;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function isSuperadminEmail(email: string): boolean {
  return email.trim().toLowerCase() === env.SUPERADMIN_EMAIL.toLowerCase();
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = readBearerToken(req);
  if (!token) {
    return next(new HttpError(401, "Unauthorized"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isModerator: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) {
      return next(new HttpError(401, "Unauthorized"));
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isModerator: user.isModerator,
      isSuperadmin: isSuperadminEmail(user.email),
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid token"));
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new HttpError(401, "Unauthorized"));
    }
    if (!roles.includes(req.auth.role as UserRole)) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}

export function requireAdminAccess() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new HttpError(401, "Unauthorized"));
    }
    if (!req.auth.isSuperadmin && !req.auth.isModerator) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}

export function requireSuperadminAccess() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new HttpError(401, "Unauthorized"));
    }
    if (!req.auth.isSuperadmin) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}
