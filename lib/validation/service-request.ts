import { z } from "zod";

export const serviceRequestSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().max(2000, "Description must be 2000 characters or fewer.").optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  site_id: z.string().uuid("Choose a valid site.").optional().or(z.literal("")),
});

export const serviceRequestUpdateSchema = serviceRequestSchema.pick({
  title: true,
  description: true,
  priority: true,
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
