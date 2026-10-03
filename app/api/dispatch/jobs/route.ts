import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createJobForRequest } from "@/lib/dispatch";
import { createJobSchema } from "@/lib/validation/dispatch";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = createJobSchema.safeParse({
    request_id: formData.get("request_id"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL("/dispatch?error=Invalid%20service%20request.", request.url),
      303,
    );
  }

  try {
    const job = await createJobForRequest(parsed.data.request_id);
    if (!job) throw new Error("JOB_CREATION_FAILED");

    revalidatePath("/dispatch");
    revalidatePath(`/dispatch/jobs/${job.id}`);

    return NextResponse.redirect(
      new URL(`/dispatch/jobs/${job.id}`, request.url),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "The dispatch action could not be completed.";
    return NextResponse.redirect(
      new URL(`/dispatch?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
