import { z } from "zod";

export const parentRegisterSchema = z.object({
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/\d/, "Password must include at least one number"),
});

export const parentLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const childProfileCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  age: z.number().int().min(0).max(18),
  dailyReadingLimitMinutes: z.number().int().min(1).max(24 * 60),
});

export const childProfileUpdateSchema = childProfileCreateSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const createPairingCodeSchema = z.object({
  childProfileId: z.string().trim().length(24),
  expiresInMinutes: z.number().int().min(1).max(60).optional(),
});

export const claimPairingCodeSchema = z.object({
  code: z.string().trim().toUpperCase().length(6),
  deviceId: z.string().trim().min(3).max(120),
  deviceName: z.string().trim().min(1).max(120).optional(),
});

export const assignDeviceChildSchema = z.object({
  childProfileId: z.string().trim().length(24),
});

export const consumeReaderUsageSchema = z.object({
  minutes: z.number().int().min(1).max(120),
});

