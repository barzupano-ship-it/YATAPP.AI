import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import {
  authenticate,
  isSuperadminEmail,
  signToken,
} from "../../middleware/auth";
import { HttpError } from "../../utils/http";

const authRouter = Router();

const roleSchema = z
  .enum(["customer", "restaurant", "courier_company"])
  .transform((role) => role.toUpperCase() as UserRole);

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  password: z.string().min(6),
  role: roleSchema.default(UserRole.CUSTOMER),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const pushTokenSchema = z.object({
  push_token: z.string().trim().min(1),
});

function toPublicUser(user: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isModerator: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.toLowerCase(),
    isModerator: user.isModerator,
    isSuperadmin: isSuperadminEmail(user.email),
  };
}

authRouter.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) {
    throw new HttpError(409, "User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      role: input.role,
    },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  res.status(201).json({
    user: toPublicUser(user),
    token,
  });
});

authRouter.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  res.json({
    user: toPublicUser(user),
    token,
  });
});

authRouter.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isModerator: true,
    },
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  res.json(toPublicUser(user));
});

authRouter.patch("/me/push-token", authenticate, async (req, res) => {
  const input = pushTokenSchema.parse(req.body);
  await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { pushToken: input.push_token },
  });
  res.json({ ok: true });
});

export { authRouter };
