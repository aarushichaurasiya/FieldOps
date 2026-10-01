import { z } from "zod";

export const dispatchFilterSchema = z.object({
  status: z.enum(["all", "submitted", "accepted", "scheduled", "assigned"]).default("all"),
  priority: z.enum(["all", "low", "normal", "high", "urgent"]).default("all"),
  search: z.string().trim().max(120).default(""),
});

export const createJobSchema = z.object({
  request_id: z.string().uuid(),
});

export const assignmentSchema = z.object({
  job_id: z.string().uuid(),
  technician_id: z.string().uuid(),
});

export const unassignmentSchema = z.object({
  job_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
});

export type DispatchFilters = z.infer<typeof dispatchFilterSchema>;
