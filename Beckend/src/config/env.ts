import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("*"),
  SUPERADMIN_EMAIL: z
    .string()
    .trim()
    .email()
    .default("barzupano@gmail.com"),
});

export const env = envSchema.parse(process.env);
