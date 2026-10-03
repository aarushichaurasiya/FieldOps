"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCustomerRequest, provisionCustomerWorkspace, signOffCustomerJob, updateCustomerRequest } from "@/lib/requests";
import { serviceRequestSchema, serviceRequestUpdateSchema } from "@/lib/validation/service-request";

export async function provisionWorkspace() {
  try {
    await provisionCustomerWorkspace();
  } catch (error) {
    const message =
      error instanceof Error && error.message === "AUTH_REQUIRED"
        ? "Please sign in before provisioning a workspace."
        : error instanceof Error && error.message === "CUSTOMER_PROVISIONING_REQUIRES_ADMIN"
          ? "This account already has an organization membership. Customer provisioning must be completed by an administrator."
          : error instanceof Error
            ? error.message
            : "Unable to provision the customer workspace.";

    redirect(`/requests?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  redirect("/requests");
}

export async function createRequest(formData: FormData) {
  const parsed = serviceRequestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    site_id: formData.get("site_id"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form.";
    redirect(`/requests/new?error=${encodeURIComponent(message)}`);
  }

  let request: Awaited<ReturnType<typeof createCustomerRequest>>;

  try {
    request = await createCustomerRequest(parsed.data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "CUSTOMER_PROFILE_REQUIRED"
        ? "Your account is authenticated, but it has not been provisioned as a FieldOps customer yet."
        : error instanceof Error && error.message === "AUTH_REQUIRED"
          ? "Please sign in before creating a request."
          : error instanceof Error
            ? error.message
            : "Unable to create the service request.";

    redirect(`/requests/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}

export async function updateRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const parsed = serviceRequestUpdateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });

  if (!id || !parsed.success) {
    const message = parsed.success ? "Request ID is missing." : parsed.error.issues[0]?.message ?? "Please check the form.";
    redirect(`/requests/${encodeURIComponent(id)}?error=${encodeURIComponent(message)}`);
  }

  try {
    await updateCustomerRequest(id, parsed.data);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "CUSTOMER_PROFILE_REQUIRED"
        ? "Your account is not provisioned as a FieldOps customer."
        : error instanceof Error
          ? error.message
          : "Unable to update the request.";

    redirect(`/requests/${encodeURIComponent(id)}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  redirect(`/requests/${id}?saved=1`);
}

export async function customerSignOff(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!requestId || !jobId) {
    redirect(`/requests/${encodeURIComponent(requestId)}?error=${encodeURIComponent("The completed job could not be identified.")}`);
  }

  try {
    await signOffCustomerJob(jobId, notes);
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("SIGN_OFF_ALREADY_SUBMITTED")
        ? "This job has already been signed off."
        : error instanceof Error && error.message.includes("JOB_NOT_COMPLETED")
          ? "The job must be completed before it can be signed off."
          : error instanceof Error && error.message.includes("JOB_NOT_FOUND_OR_FORBIDDEN")
            ? "You are not authorized to sign off this job."
            : error instanceof Error && error.message.includes("CUSTOMER_PROFILE_REQUIRED")
              ? "Your account is not provisioned as a FieldOps customer."
              : error instanceof Error && error.message.includes("AUTH_REQUIRED")
                ? "Please sign in before signing off the job."
                : error instanceof Error
                  ? error.message
                  : "Unable to complete customer sign-off.";

    redirect(`/requests/${encodeURIComponent(requestId)}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}?signed=1`);
}
