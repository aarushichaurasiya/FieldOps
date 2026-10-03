import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function redirectToJob(request: Request, jobId: string, params: Record<string, string>) {
  const url = new URL(`/technician/jobs/${jobId}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id: jobId } = await params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  let error: { message?: string } | null = null;

  if (action === "start") {
    const result = await supabase.rpc("start_job_work", { p_job_id: jobId });
    error = result.error;
  } else if (action === "work_log") {
    const note = String(formData.get("note") ?? "");
    const result = await supabase.rpc("add_work_log", {
      p_job_id: jobId,
      p_note: note,
    });
    error = result.error;
  } else if (action === "part") {
    const partName = String(formData.get("part_name") ?? "").trim();
    const quantity = Number(formData.get("quantity") ?? 0);
    const unitPriceRupees = Number(formData.get("unit_price") ?? 0);

    if (!partName || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitPriceRupees) || unitPriceRupees < 0) {
      return redirectToJob(request, jobId, { error: "Enter a valid part name, quantity, and unit price." });
    }

    const result = await supabase.rpc("add_part_usage", {
      p_job_id: jobId,
      p_part_name: partName,
      p_quantity: quantity,
      p_unit_price_snapshot_cents: Math.round(unitPriceRupees * 100),
    });
    error = result.error;
  } else if (action === "complete") {
    const notes = String(formData.get("completion_notes") ?? "");
    const result = await supabase.rpc("complete_job", {
      p_job_id: jobId,
      p_completion_notes: notes,
    });
    error = result.error;
  } else {
    return redirectToJob(request, jobId, { error: "Unknown technician action." });
  }

  if (error) {
    return redirectToJob(request, jobId, { error: error.message ?? "Technician action failed." });
  }

  const saved = action === "start" ? "started" : action === "work_log" ? "work_log" : action === "part" ? "part" : "completed";
  return redirectToJob(request, jobId, { saved });
}
