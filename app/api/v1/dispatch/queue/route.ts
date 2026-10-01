import { NextResponse, type NextRequest } from "next/server";
import { listDispatchQueue } from "@/lib/dispatch";
import { dispatchFilterSchema } from "@/lib/validation/dispatch";

export async function GET(request: NextRequest) {
  try {
    const parsed = dispatchFilterSchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? "all",
      priority: request.nextUrl.searchParams.get("priority") ?? "all",
      search: request.nextUrl.searchParams.get("search") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_FILTER", message: "Invalid dispatch queue filters." } },
        { status: 400 },
      );
    }

    const result = await listDispatchQueue(parsed.data);
    if (!result.authorized) {
      return NextResponse.json(
        { error: { code: "DISPATCHER_REQUIRED", message: "Dispatcher or admin access is required." } },
        { status: 403 },
      );
    }

    return NextResponse.json({ data: result.items, meta: { count: result.items.length } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "DISPATCH_QUEUE_ERROR", message: error instanceof Error ? error.message : "Unable to load dispatch queue." } },
      { status: 500 },
    );
  }
}
