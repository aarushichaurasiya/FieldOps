import { NextResponse } from "next/server";
import { getCurrentCustomer, getCustomerRequest, updateCustomerRequest } from "@/lib/requests";
import { serviceRequestUpdateSchema } from "@/lib/validation/service-request";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;

  try {
    const { user } = await getCurrentCustomer();
    if (!user) return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "Authentication required." } }, { status: 401 });

    const data = await getCustomerRequest(id);
    if (!data) return NextResponse.json({ error: { code: "REQUEST_NOT_FOUND", message: "Request not found." } }, { status: 404 });
    return NextResponse.json({ data, meta: {} });
  } catch (error) {
    return NextResponse.json({ error: { code: "REQUEST_READ_FAILED", message: error instanceof Error ? error.message : "Unable to load request." } }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = serviceRequestUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request." } }, { status: 400 });
    }

    const data = await updateCustomerRequest(id, parsed.data);
    return NextResponse.json({ data, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update request.";
    const status = message === "AUTH_REQUIRED" ? 401 : message === "CUSTOMER_PROFILE_REQUIRED" ? 403 : 500;
    return NextResponse.json({ error: { code: "REQUEST_UPDATE_FAILED", message } }, { status });
  }
}
