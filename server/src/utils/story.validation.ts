import { z } from "zod";

const storyMetadataBaseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  language: z.enum(["ar", "en", "fr"]),
  minAge: z.number().int().min(0).max(18),
  maxAge: z.number().int().min(0).max(18),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const storyMetadataSchema = storyMetadataBaseSchema.refine(
  (payload) => payload.minAge <= payload.maxAge,
  {
    message: "minAge cannot be greater than maxAge",
    path: ["minAge"],
  }
);

export const storyMetadataUpdateSchema = storyMetadataBaseSchema
  .partial()
  .superRefine((payload, ctx) => {
    if (Object.keys(payload).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
      });
      return;
    }

    if (
      payload.minAge !== undefined &&
      payload.maxAge !== undefined &&
      payload.minAge > payload.maxAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minAge cannot be greater than maxAge",
        path: ["minAge"],
      });
    }
  });

export const storyPageCreateSchema = z
  .object({
    imageUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    text: z.string().trim().max(600).optional(),
    order: z.number().int().min(1).optional(),
  })
  .refine((payload) => {
    const hasImage = Boolean(payload.imageUrl?.trim());
    const hasText = Boolean(payload.text?.trim());
    return hasImage || hasText;
  }, {
    message: "Page must include imageUrl, text, or both",
    path: ["imageUrl"],
  });

export const storyPageUpdateSchema = z
  .object({
    imageUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    text: z.string().trim().max(600).optional(),
  })
  .superRefine((payload, ctx) => {
    if (Object.keys(payload).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
      });
      return;
    }

    if (payload.imageUrl !== undefined && payload.text !== undefined) {
      const hasImage = Boolean(payload.imageUrl.trim());
      const hasText = Boolean(payload.text.trim());
      if (!hasImage && !hasText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Page cannot be empty. Provide imageUrl, text, or both",
          path: ["imageUrl"],
        });
      }
    }
  });

export const storyPagesReorderSchema = z.object({
  pageIds: z.array(z.string().trim().length(24)).min(1),
});

export const storyPublishSchema = z.object({
  published: z.boolean(),
});
