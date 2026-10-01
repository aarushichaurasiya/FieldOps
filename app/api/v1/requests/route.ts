import { NextResponse } from "next/server";
import { createCustomerRequest, getCurrentCustomer, listCustomerRequests } from "@/lib/requests";
import { serviceRequestSchema } from "@/lib/validation/service-request";

export async function GET() {
  try {
    const { user } = await getCurrentCustomer();
    if (!user) return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "Authentication required." } }, { status: 401 });

    const data = await listCustomerRequests();
    return NextResponse.json({ data, meta: { count: data.length } });
  } catch (error) {
    return NextResponse.json({ error: { code: "REQUEST_LIST_FAILED", message: error instanceof Error ? error.message : "Unable to load requests." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = serviceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request." } }, { status: 400 });
    }

    const data = await createCustomerRequest(parsed.data);
    return NextResponse.json({ data, meta: {} }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create request.";
    const status = message === "AUTH_REQUIRED" ? 401 : message === "CUSTOMER_PROFILE_REQUIRED" ? 403 : 500;
    return NextResponse.json({ error: { code: "REQUEST_CREATE_FAILED", message } }, { status });
  }
}
