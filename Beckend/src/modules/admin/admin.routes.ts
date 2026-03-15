import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import {
  authenticate,
  isSuperadminEmail,
  requireAdminAccess,
  requireSuperadminAccess,
} from "../../middleware/auth";
import { HttpError, parseId } from "../../utils/http";

const adminRouter = Router();

const createCourierSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  password: z.string().min(6),
});

const courierProfileSchema = z.object({
  firstName: z.union([z.string().trim(), z.null()]).optional(),
  lastName: z.union([z.string().trim(), z.null()]).optional(),
  phone: z.union([z.string().trim(), z.null()]).optional(),
  inn: z.union([z.string().trim(), z.null()]).optional(),
  passportNumber: z.union([z.string().trim(), z.null()]).optional(),
  profilePhoto: z.union([z.string().trim(), z.null()]).optional(),
  passportPhoto: z.union([z.string().trim(), z.null()]).optional(),
});

function mapAdminUser(user: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isModerator: boolean;
  isActive: boolean;
  createdAt: Date;
  _count: { restaurants: number };
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.toLowerCase(),
    isModerator: user.isModerator,
    isSuperadmin: isSuperadminEmail(user.email),
    isActive: user.isActive,
    restaurant_count: user._count.restaurants,
    created_at: user.createdAt,
  };
}

function mapCourierProfile(user: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profilePhoto: string | null;
  passportPhoto: string | null;
  inn: string | null;
  passportNumber: string | null;
}) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    phone: user.phone,
    profile_photo: user.profilePhoto,
    passport_photo: user.passportPhoto,
    inn: user.inn,
    passport_number: user.passportNumber,
  };
}

function mapAdminRestaurant(restaurant: {
  id: number;
  name: string;
  address: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  owner: {
    id: number;
    name: string;
    email: string;
    isModerator: boolean;
  };
}) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    description: restaurant.description,
    is_active: restaurant.isActive,
    created_at: restaurant.createdAt,
    owner: {
      id: restaurant.owner.id,
      name: restaurant.owner.name,
      email: restaurant.owner.email,
      isModerator: restaurant.owner.isModerator,
      isSuperadmin: isSuperadminEmail(restaurant.owner.email),
    },
  };
}

adminRouter.get("/users", authenticate, requireAdminAccess(), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          restaurants: true,
        },
      },
    },
  });

  res.json(users.map(mapAdminUser));
});

adminRouter.post(
  "/couriers",
  authenticate,
  requireSuperadminAccess(),
  async (req, res) => {
    const input = createCourierSchema.parse(req.body);
    const email = input.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new HttpError(409, "User already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const courier = await prisma.user.create({
      data: {
        name: input.name,
        email,
        phone: input.phone,
        passwordHash,
        role: UserRole.COURIER,
      },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    res.status(201).json(mapAdminUser(courier));
  }
);

adminRouter.get(
  "/couriers/pending",
  authenticate,
  requireAdminAccess(),
  async (_req, res) => {
    const pending = await prisma.user.findMany({
      where: {
        role: UserRole.COURIER,
        courierCompanyId: { not: null },
        isActive: false,
      },
      include: {
        courierCompany: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      pending.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        created_at: u.createdAt,
        courier_company_id: u.courierCompanyId,
        courier_company_name: u.courierCompany?.name ?? null,
      }))
    );
  }
);

adminRouter.patch(
  "/couriers/:id/approve",
  authenticate,
  requireAdminAccess(),
  async (req, res) => {
    const userId = parseId(req.params.id, "user id");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { restaurants: true } },
      },
    });
    if (!user || user.role !== UserRole.COURIER) {
      throw new HttpError(404, "Courier not found");
    }
    if (!user.courierCompanyId) {
      throw new HttpError(400, "Courier was not created by a company");
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      include: {
        _count: { select: { restaurants: true } },
      },
    });
    res.json(mapAdminUser(updated));
  }
);

adminRouter.get(
  "/couriers/:id/profile",
  authenticate,
  requireAdminAccess(),
  async (req, res) => {
    const userId = parseId(String(req.params.id), "user id");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePhoto: true,
        passportPhoto: true,
        inn: true,
        passportNumber: true,
      },
    });
    if (!user || user.role !== UserRole.COURIER) {
      throw new HttpError(404, "Courier not found");
    }

    res.json(mapCourierProfile(user));
  }
);

adminRouter.patch(
  "/couriers/:id/profile",
  authenticate,
  requireAdminAccess(),
  async (req, res) => {
    const userId = parseId(String(req.params.id), "user id");
    const input = courierProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });
    if (!user || user.role !== UserRole.COURIER) {
      throw new HttpError(404, "Courier not found");
    }

    const firstName = input.firstName !== undefined ? (input.firstName || null) : user.firstName;
    const lastName = input.lastName !== undefined ? (input.lastName || null) : user.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user.name;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: fullName,
        firstName,
        lastName,
        phone: input.phone !== undefined ? (input.phone || null) : user.phone,
        inn: input.inn !== undefined ? (input.inn || null) : user.inn,
        passportNumber: input.passportNumber !== undefined ? (input.passportNumber || null) : user.passportNumber,
        profilePhoto: input.profilePhoto !== undefined ? input.profilePhoto : user.profilePhoto,
        passportPhoto: input.passportPhoto !== undefined ? input.passportPhoto : user.passportPhoto,
      },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    res.json({
      user: mapAdminUser(updatedUser),
      profile: mapCourierProfile(updatedUser),
    });
  }
);

adminRouter.patch(
  "/users/:id/moderator",
  authenticate,
  requireSuperadminAccess(),
  async (req, res) => {
    const userId = parseId(String(req.params.id), "user id");
    const enabled = req.body?.enabled;

    if (typeof enabled !== "boolean") {
      throw new HttpError(400, "enabled must be a boolean");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    if (isSuperadminEmail(user.email)) {
      throw new HttpError(400, "Superadmin access cannot be changed");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isModerator: enabled },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    res.json(mapAdminUser(updatedUser));
  }
);

adminRouter.delete(
  "/users/:id",
  authenticate,
  requireAdminAccess(),
  async (req, res) => {
    const userId = parseId(String(req.params.id), "user id");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    if (isSuperadminEmail(user.email)) {
      throw new HttpError(400, "Superadmin account cannot be deleted");
    }
    if (req.auth!.userId === user.id) {
      throw new HttpError(400, "You cannot delete your own account");
    }
    if (req.auth!.isModerator && user.isModerator) {
      throw new HttpError(403, "Moderators cannot delete another moderator");
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(204).send();
  }
);

adminRouter.get(
  "/restaurants",
  authenticate,
  requireAdminAccess(),
  async (_req, res) => {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            isModerator: true,
          },
        },
      },
    });

    res.json(restaurants.map(mapAdminRestaurant));
  }
);

adminRouter.delete(
  "/restaurants/:id",
  authenticate,
  requireAdminAccess(),
  async (req, res) => {
    const restaurantId = parseId(String(req.params.id), "restaurant id");

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!restaurant) {
      throw new HttpError(404, "Restaurant not found");
    }
    if (req.auth!.isModerator && isSuperadminEmail(restaurant.owner.email)) {
      throw new HttpError(403, "Moderators cannot delete superadmin restaurants");
    }

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    res.status(204).send();
  }
);

export { adminRouter };
