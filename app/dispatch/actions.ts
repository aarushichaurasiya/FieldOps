"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignJob,
  createJobForRequest,
  unassignJob,
} from "@/lib/dispatch";
import {
  assignmentSchema,
  createJobSchema,
  unassignmentSchema,
} from "@/lib/validation/dispatch";

function dispatchError(error: unknown) {
  if (!(error instanceof Error)) return "The dispatch action could not be completed.";

  const messages: Record<string, string> = {
    DISPATCHER_REQUIRED: "Dispatcher or admin access is required.",
    REQUEST_NOT_FOUND: "The service request was not found or is no longer accessible.",
    JOB_NOT_FOUND: "The job was not found.",
    JOB_NOT_ASSIGNABLE: "This job cannot be assigned in its current state.",
    JOB_NOT_UNASSIGNABLE: "This job is not currently assigned.",
    TECHNICIAN_NOT_AVAILABLE: "That technician is not active in this organization.",
    ASSIGNMENT_NOT_ACTIVE: "That assignment is already closed.",
    INVALID_JOB_STATUS_TRANSITION: "The requested job status transition is not allowed.",
  };

  return messages[error.message] ?? error.message;
}

export async function createJobAction(formData: FormData) {
  const parsed = createJobSchema.safeParse({ request_id: formData.get("request_id") });
  if (!parsed.success) {
    redirect("/dispatch?error=Invalid%20service%20request.");
  }

  try {
    const job = await createJobForRequest(parsed.data.request_id);
    revalidatePath("/dispatch");
    revalidatePath(`/dispatch/jobs/${job.id}`);
    redirect(`/dispatch/jobs/${job.id}`);
  } catch (error) {
    redirect(`/dispatch?error=${encodeURIComponent(dispatchError(error))}`);
  }
}

export async function assignJobAction(formData: FormData) {
  const parsed = assignmentSchema.safeParse({
    job_id: formData.get("job_id"),
    technician_id: formData.get("technician_id"),
  });

  if (!parsed.success) {
    redirect("/dispatch?error=Choose a valid technician.");
  }

  try {
    const assignment = await assignJob(parsed.data.job_id, parsed.data.technician_id);
    revalidatePath("/dispatch");
    revalidatePath(`/dispatch/jobs/${parsed.data.job_id}`);
    redirect(`/dispatch/jobs/${parsed.data.job_id}?saved=assigned`);
  } catch (error) {
    redirect(`/dispatch/jobs/${parsed.data.job_id}?error=${encodeURIComponent(dispatchError(error))}`);
  }
}

export async function unassignJobAction(formData: FormData) {
  const parsed = unassignmentSchema.safeParse({
    job_id: formData.get("job_id"),
    assignment_id: formData.get("assignment_id"),
  });

  if (!parsed.success) {
    redirect("/dispatch?error=Invalid assignment.");
  }

  try {
    await unassignJob(parsed.data.job_id, parsed.data.assignment_id);
    revalidatePath("/dispatch");
    revalidatePath(`/dispatch/jobs/${parsed.data.job_id}`);
    redirect(`/dispatch/jobs/${parsed.data.job_id}?saved=unassigned`);
  } catch (error) {
    redirect(`/dispatch/jobs/${parsed.data.job_id}?error=${encodeURIComponent(dispatchError(error))}`);
  }
}
