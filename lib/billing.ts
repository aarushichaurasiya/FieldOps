import { createClient } from "@/lib/supabase/server";

type Invoice = {
  id: string;
  job_id: string;
  number: string;
  status: "draft" | "issued" | "paid" | "void";
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  issued_at: string | null;
  created_at: string;
};

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number | null;
};

export type ServiceReport = {
  job: {
    id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    completion_notes: string | null;
  };
  request: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  site: {
    id: string;
    name: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  technician_name: string | null;
  work_logs: Array<{
    id: string;
    note: string | null;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
  }>;
  parts: Array<{
    id: string;
    part_name: string;
    quantity: number;
    unit_price_snapshot_cents: number;
    created_at: string;
  }>;
  sign_off: {
    id: string;
    signed_at: string;
    signer_name: string;
    notes: string | null;
  } | null;
  invoice: Invoice | null;
  invoice_lines: InvoiceLine[];
};

export async function createInvoiceForJob(jobId: string, laborChargeCents: number, taxRateBps: number) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .rpc("create_invoice_for_job", {
      p_job_id: jobId,
      p_labor_charge_cents: laborChargeCents,
      p_tax_rate_bps: taxRateBps,
    })
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("INVOICE_CREATION_FAILED");
  return data as Invoice;
}

export async function issueInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("issue_invoice", { p_invoice_id: invoiceId }).single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("INVOICE_ISSUE_FAILED");
  return data as Invoice;
}

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("mark_invoice_paid", { p_invoice_id: invoiceId }).single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("INVOICE_PAYMENT_UPDATE_FAILED");
  return data as Invoice;
}

export async function getServiceReport(jobId: string): Promise<ServiceReport | null> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase.rpc("get_job_service_report", { p_job_id: jobId });
  if (error) throw new Error(error.message);
  return (data as ServiceReport | null) ?? null;
}

export async function getCustomerInvoice(requestId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase.rpc("get_customer_invoice", { p_request_id: requestId });
  if (error) throw new Error(error.message);
  return data as { invoice: Invoice; lines: InvoiceLine[] } | null;
}
