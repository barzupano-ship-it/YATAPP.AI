import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, requireRole, signToken } from "../../middleware/auth";
import { HttpError, parseId } from "../../utils/http";

const courierCompanyRouter = Router();

const registerSchema = z.object({
  company_name: z.string().trim().min(1),
  owner_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  password: z.string().min(6),
});

courierCompanyRouter.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    throw new HttpError(409, "User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.owner_name,
      email,
      phone: input.phone,
      passwordHash,
      role: "COURIER_COMPANY",
    },
  });

  const company = await prisma.courierCompany.create({
    data: {
      name: input.company_name,
      ownerId: user.id,
    },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "courier_company",
    },
    company_id: company.id,
    token,
  });
});

const createCourierSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  password: z.string().min(6),
});

const MAX_DELIVERY_FEE = 20;

const updateCompanySchema = z.object({
  name: z.string().trim().min(1).optional(),
  delivery_fee: z
    .coerce.number()
    .min(0)
    .max(MAX_DELIVERY_FEE, { message: "Максимальная стоимость доставки — 20 сомони" })
    .optional(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

courierCompanyRouter.get(
  "/me",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY, UserRole.ADMIN]),
  async (req, res) => {
    if (req.auth!.role === UserRole.ADMIN) {
      throw new HttpError(400, "Admin must specify company");
    }
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
      include: {
        _count: { select: { couriers: true } },
      },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    res.json({
      id: company.id,
      name: company.name,
      delivery_fee: company.deliveryFee,
      phone: company.phone,
      address: company.address,
      courier_count: company._count.couriers,
      created_at: company.createdAt,
    });
  }
);

courierCompanyRouter.patch(
  "/me",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const input = updateCompanySchema.parse(req.body);
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    const updated = await prisma.courierCompany.update({
      where: { id: company.id },
      data: {
        ...(input.name != null && { name: input.name }),
        ...(input.delivery_fee != null && { deliveryFee: input.delivery_fee }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.address !== undefined && { address: input.address }),
      },
    });
    res.json({
      id: updated.id,
      name: updated.name,
      delivery_fee: updated.deliveryFee,
      phone: updated.phone,
      address: updated.address,
    });
  }
);

courierCompanyRouter.get(
  "/couriers",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    const couriers = await prisma.user.findMany({
      where: {
        courierCompanyId: company.id,
        role: UserRole.COURIER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      couriers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        is_active: c.isActive,
        created_at: c.createdAt,
      }))
    );
  }
);

courierCompanyRouter.post(
  "/couriers",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
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
        courierCompanyId: company.id,
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      id: courier.id,
      name: courier.name,
      email: courier.email,
      phone: courier.phone,
      is_active: courier.isActive,
      created_at: courier.createdAt,
    });
  }
);

const courierProfileSchema = z.object({
  firstName: z.union([z.string().trim(), z.null()]).optional(),
  lastName: z.union([z.string().trim(), z.null()]).optional(),
  phone: z.union([z.string().trim(), z.null()]).optional(),
  inn: z.union([z.string().trim(), z.null()]).optional(),
  passportNumber: z.union([z.string().trim(), z.null()]).optional(),
  profilePhoto: z.union([z.string().trim(), z.null()]).optional(),
  passportPhoto: z.union([z.string().trim(), z.null()]).optional(),
});

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

courierCompanyRouter.get(
  "/couriers/:id/profile",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    const courierId = parseId(req.params.id, "courier id");
    const courier = await prisma.user.findFirst({
      where: { id: courierId, courierCompanyId: company.id },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        profilePhoto: true,
        passportPhoto: true,
        inn: true,
        passportNumber: true,
      },
    });
    if (!courier) {
      throw new HttpError(404, "Courier not found");
    }
    res.json(mapCourierProfile(courier));
  }
);

courierCompanyRouter.patch(
  "/couriers/:id/profile",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    const courierId = parseId(req.params.id, "courier id");
    const courier = await prisma.user.findFirst({
      where: { id: courierId, courierCompanyId: company.id },
    });
    if (!courier) {
      throw new HttpError(404, "Courier not found");
    }
    const input = courierProfileSchema.parse(req.body);
    const firstName = input.firstName !== undefined ? input.firstName : courier.firstName;
    const lastName = input.lastName !== undefined ? input.lastName : courier.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || courier.name;
    const updated = await prisma.user.update({
      where: { id: courierId },
      data: {
        name: fullName,
        firstName,
        lastName,
        phone: input.phone !== undefined ? input.phone : courier.phone,
        inn: input.inn !== undefined ? input.inn : courier.inn,
        passportNumber: input.passportNumber !== undefined ? input.passportNumber : courier.passportNumber,
        profilePhoto: input.profilePhoto !== undefined ? input.profilePhoto : courier.profilePhoto,
        passportPhoto: input.passportPhoto !== undefined ? input.passportPhoto : courier.passportPhoto,
      },
    });
    res.json({
      courier: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        is_active: updated.isActive,
        created_at: updated.createdAt,
      },
      profile: mapCourierProfile(updated),
    });
  }
);

courierCompanyRouter.delete(
  "/couriers/:id",
  authenticate,
  requireRole([UserRole.COURIER_COMPANY]),
  async (req, res) => {
    const company = await prisma.courierCompany.findFirst({
      where: { ownerId: req.auth!.userId },
    });
    if (!company) {
      throw new HttpError(404, "Courier company not found");
    }
    const courierId = parseId(req.params.id, "courier id");
    const courier = await prisma.user.findUnique({
      where: { id: courierId },
    });
    if (!courier || courier.courierCompanyId !== company.id) {
      throw new HttpError(404, "Courier not found");
    }
    await prisma.user.update({
      where: { id: courierId },
      data: { courierCompanyId: null },
    });
    res.json({ ok: true });
  }
);

export { courierCompanyRouter };
