import { NextResponse, type NextRequest } from "next/server";
import { unassignJob } from "@/lib/dispatch";
import { unassignmentSchema } from "@/lib/validation/dispatch";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
) {
  try {
    const { id, assignmentId } = await params;
    const parsed = unassignmentSchema.safeParse({
      job_id: id,
      assignment_id: assignmentId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_ASSIGNMENT", message: "Invalid job or assignment identifier." } },
        { status: 400 },
      );
    }

    const assignment = await unassignJob(parsed.data.job_id, parsed.data.assignment_id);
    return NextResponse.json({ data: assignment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to unassign the job.";
    const status = message === "DISPATCHER_REQUIRED" ? 403 : message === "JOB_NOT_FOUND" || message === "ASSIGNMENT_NOT_ACTIVE" ? 404 : 409;
    return NextResponse.json({ error: { code: message, message } }, { status });
  }
}
