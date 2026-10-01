import { NextResponse, type NextRequest } from "next/server";
import { assignJob } from "@/lib/dispatch";
import { assignmentSchema } from "@/lib/validation/dispatch";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = assignmentSchema.safeParse({
      job_id: id,
      technician_id: body?.technician_id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_ASSIGNMENT", message: "A valid technician_id is required." } },
        { status: 400 },
      );
    }

    const assignment = await assignJob(parsed.data.job_id, parsed.data.technician_id);
    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to assign the job.";
    const status =
      message === "DISPATCHER_REQUIRED" ? 403 :
      message === "JOB_NOT_FOUND" || message === "TECHNICIAN_NOT_AVAILABLE" ? 404 :
      409;
    return NextResponse.json({ error: { code: message, message } }, { status });
  }
}
