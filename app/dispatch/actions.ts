"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assignJob, createJobForRequest, unassignJob } from "@/lib/dispatch";
import { createInvoiceForJob, issueInvoice, markInvoicePaid } from "@/lib/billing";
import { assignmentSchema, createJobSchema, unassignmentSchema } from "@/lib/validation/dispatch";

function dispatchError(error: unknown) {
  if (!(error instanceof Error)) return "The dispatch action could not be completed.";
  const messages: Record<string, string> = {
    DISPATCHER_REQUIRED: "Dispatcher or admin access is required.", REQUEST_NOT_FOUND: "The service request was not found or is no longer accessible.", JOB_NOT_FOUND: "The job was not found.", JOB_NOT_ASSIGNABLE: "This job cannot be assigned in its current state.", JOB_NOT_UNASSIGNABLE: "This job is not currently assigned.", TECHNICIAN_NOT_AVAILABLE: "That technician is not active in this organization.", ASSIGNMENT_NOT_ACTIVE: "That assignment is already closed.", INVALID_JOB_STATUS_TRANSITION: "The requested job status transition is not allowed.", JOB_NOT_SIGNED_OFF: "Customer sign-off is required before invoicing.", CUSTOMER_SIGNOFF_REQUIRED: "Customer sign-off is required before invoicing.", INVALID_LABOR_CHARGE: "Labor charge must be zero or greater.", INVALID_TAX_RATE: "Tax rate must be between 0% and 100%.", INVOICE_NOT_FOUND: "The invoice was not found.", INVOICE_NOT_DRAFT: "Only draft invoices can be issued.", INVOICE_NOT_ISSUED: "Only issued invoices can be marked paid.", INVOICE_CREATION_FAILED: "The invoice could not be created.",
  };
  return messages[error.message] ?? error.message;
}

export async function createJobAction(formData: FormData) {
  const parsed = createJobSchema.safeParse({ request_id: formData.get("request_id") });
  if (!parsed.success) redirect("/dispatch?error=Invalid%20service%20request.");
  let jobId: string;
  try { const job = await createJobForRequest(parsed.data.request_id); if (!job) throw new Error("JOB_CREATION_FAILED"); jobId = job.id; }
  catch (error) { redirect(`/dispatch?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath("/dispatch"); revalidatePath(`/dispatch/jobs/${jobId}`); redirect(`/dispatch/jobs/${jobId}`);
}

export async function assignJobAction(formData: FormData) {
  const parsed = assignmentSchema.safeParse({ job_id: formData.get("job_id"), technician_id: formData.get("technician_id") });
  if (!parsed.success) redirect("/dispatch?error=Choose a valid technician.");
  try { await assignJob(parsed.data.job_id, parsed.data.technician_id); }
  catch (error) { redirect(`/dispatch/jobs/${parsed.data.job_id}?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath("/dispatch"); revalidatePath(`/dispatch/jobs/${parsed.data.job_id}`); redirect(`/dispatch/jobs/${parsed.data.job_id}?saved=assigned`);
}

export async function unassignJobAction(formData: FormData) {
  const parsed = unassignmentSchema.safeParse({ job_id: formData.get("job_id"), assignment_id: formData.get("assignment_id") });
  if (!parsed.success) redirect("/dispatch?error=Invalid assignment.");
  try { await unassignJob(parsed.data.job_id, parsed.data.assignment_id); }
  catch (error) { redirect(`/dispatch/jobs/${parsed.data.job_id}?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath("/dispatch"); revalidatePath(`/dispatch/jobs/${parsed.data.job_id}`); redirect(`/dispatch/jobs/${parsed.data.job_id}?saved=unassigned`);
}

export async function createInvoiceAction(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const laborRupees = Number(formData.get("labor_charge") ?? 0);
  const taxPercent = Number(formData.get("tax_rate") ?? 0);
  const laborCents = Math.round(laborRupees * 100);
  const taxBps = Math.round(taxPercent * 100);
  if (!jobId || !Number.isFinite(laborCents) || !Number.isFinite(taxBps)) redirect(`/dispatch/jobs/${jobId}?error=Enter valid invoice values.`);
  let invoiceId = "";
  try { const invoice = await createInvoiceForJob(jobId, laborCents, taxBps); invoiceId = invoice.id; }
  catch (error) { redirect(`/dispatch/jobs/${jobId}?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath(`/dispatch/jobs/${jobId}`); revalidatePath(`/dispatch/invoices/${invoiceId}`); redirect(`/dispatch/invoices/${invoiceId}?saved=created`);
}

export async function issueInvoiceAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  try { await issueInvoice(invoiceId); }
  catch (error) { redirect(`/dispatch/invoices/${invoiceId}?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath(`/dispatch/jobs/${jobId}`); revalidatePath(`/dispatch/invoices/${invoiceId}`); revalidatePath(`/requests`); redirect(`/dispatch/invoices/${invoiceId}?saved=issued`);
}

export async function markInvoicePaidAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  try { await markInvoicePaid(invoiceId); }
  catch (error) { redirect(`/dispatch/invoices/${invoiceId}?error=${encodeURIComponent(dispatchError(error))}`); }
  revalidatePath(`/dispatch/jobs/${jobId}`); revalidatePath(`/dispatch/invoices/${invoiceId}`); revalidatePath(`/requests`); redirect(`/dispatch/invoices/${invoiceId}?saved=paid`);
}
