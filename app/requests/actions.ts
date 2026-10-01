"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCustomerRequest, updateCustomerRequest } from "@/lib/requests";
import { serviceRequestSchema, serviceRequestUpdateSchema } from "@/lib/validation/service-request";

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
