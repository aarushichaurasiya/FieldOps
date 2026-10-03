import { createClient } from "@/lib/supabase/server";
import type { ServiceRequestInput } from "@/lib/validation/service-request";

const requestColumns = "id, organization_id, customer_id, site_id, title, description, priority, status, created_at, updated_at";

export type CustomerJobCompletion = {
  job: {
    id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    completion_notes: string | null;
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
};

export async function getCurrentCustomer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, customer: null };

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, organization_id, name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { supabase, user, customer };
}

export async function provisionCustomerWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .rpc("provision_customer_workspace")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listCustomerRequests() {
  const { supabase, user, customer } = await getCurrentCustomer();
  if (!user || !customer) return [];

  const { data, error } = await supabase
    .from("service_requests")
    .select(requestColumns)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCustomerRequest(id: string) {
  const { supabase, user, customer } = await getCurrentCustomer();
  if (!user || !customer) return null;

  const { data, error } = await supabase
    .from("service_requests")
    .select(requestColumns)
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCustomerJobCompletion(requestId: string): Promise<CustomerJobCompletion | null> {
  const { supabase, user, customer } = await getCurrentCustomer();
  if (!user || !customer) return null;

  const { data, error } = await supabase
    .rpc("get_customer_job_completion", { p_request_id: requestId });

  if (error) throw new Error(error.message);
  return (data as CustomerJobCompletion | null) ?? null;
}

export async function signOffCustomerJob(jobId: string, notes: string) {
  const { supabase, user, customer } = await getCurrentCustomer();
  if (!user) throw new Error("AUTH_REQUIRED");
  if (!customer) throw new Error("CUSTOMER_PROFILE_REQUIRED");

  const { data, error } = await supabase
    .rpc("customer_sign_off_job", {
      p_job_id: jobId,
      p_notes: notes || null,
    })
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listCustomerSites() {
  const { supabase, user, customer } = await getCurrentCustomer();
  if (!user || !customer) return [];

  const { data, error } = await supabase
    .from("sites")
    .select("id, name, address_line1, city, state, postal_code")
    .eq("customer_id", customer.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCustomerRequest(input: ServiceRequestInput) {
  const { supabase, user, customer } = await getCurrentCustomer();

  if (!user) throw new Error("AUTH_REQUIRED");
  if (!customer) throw new Error("CUSTOMER_PROFILE_REQUIRED");

  const { data, error } = await supabase
    .rpc("create_service_request", {
      p_customer_id: customer.id,
      p_site_id: input.site_id || null,
      p_title: input.title,
      p_description: input.description || null,
      p_priority: input.priority,
    })
    .single();

  if (error) throw new Error(error.message);

  if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    throw new Error("Service request creation did not return a valid request ID.");
  }

  return { id: data.id };
}

export async function updateCustomerRequest(
  id: string,
  input: Pick<ServiceRequestInput, "title" | "description" | "priority">,
) {
  const { supabase, user, customer } = await getCurrentCustomer();

  if (!user) throw new Error("AUTH_REQUIRED");
  if (!customer) throw new Error("CUSTOMER_PROFILE_REQUIRED");

  const { data, error } = await supabase
    .rpc("update_service_request", {
      p_request_id: id,
      p_title: input.title,
      p_description: input.description || null,
      p_priority: input.priority,
    })
    .single();

  if (error) throw new Error(error.message);
  return data;
}
