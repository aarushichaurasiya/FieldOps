import { NextResponse, type NextRequest } from "next/server";
import { createJobForRequest } from "@/lib/dispatch";
import { createJobSchema } from "@/lib/validation/dispatch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "A valid request_id is required." } },
        { status: 400 },
      );
    }

    const job = await createJobForRequest(parsed.data.request_id);
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the job.";
    const status = message === "DISPATCHER_REQUIRED" ? 403 : message === "REQUEST_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: { code: message, message } }, { status });
  }
}
