import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assignJob } from "@/lib/dispatch";
import { assignmentSchema } from "@/lib/validation/dispatch";

function dispatchError(error: unknown) {
  if (!(error instanceof Error)) return "The dispatch action could not be completed.";

  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Authentication is required.",
    DISPATCHER_REQUIRED: "Dispatcher or admin access is required.",
    JOB_NOT_FOUND: "The job was not found.",
    JOB_NOT_ASSIGNABLE: "This job cannot be assigned in its current state.",
    TECHNICIAN_NOT_AVAILABLE: "That technician is not active in this organization.",
    ASSIGNMENT_FAILED: "The technician assignment could not be saved.",
  };

  return messages[error.message] ?? error.message;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = assignmentSchema.safeParse({
    job_id: formData.get("job_id"),
    technician_id: formData.get("technician_id"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL("/dispatch?error=Choose%20a%20valid%20technician.", request.url),
      303,
    );
  }

  try {
    await assignJob(parsed.data.job_id, parsed.data.technician_id);

    revalidatePath("/dispatch");
    revalidatePath(`/dispatch/jobs/${parsed.data.job_id}`);

    return NextResponse.redirect(
      new URL(`/dispatch/jobs/${parsed.data.job_id}?saved=assigned`, request.url),
      303,
    );
  } catch (error) {
    const message = dispatchError(error);
    return NextResponse.redirect(
      new URL(
        `/dispatch/jobs/${parsed.data.job_id}?error=${encodeURIComponent(message)}`,
        request.url,
      ),
      303,
    );
  }
}
