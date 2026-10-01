import { createClient } from "@/lib/supabase/server";
import type { ServiceRequestInput } from "@/lib/validation/service-request";

const requestColumns = "id, organization_id, customer_id, site_id, title, description, priority, status, created_at, updated_at";

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
    .from("service_requests")
    .insert({
      organization_id: customer.organization_id,
      customer_id: customer.id,
      site_id: input.site_id || null,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
    })
    .select(requestColumns)
    .single();

  if (error) throw new Error(error.message);

  const { error: auditError } = await supabase
    .from("audit_events")
    .insert({
      organization_id: customer.organization_id,
      actor_id: user.id,
      entity_type: "service_request",
      entity_id: data.id,
      action: "request.created",
      metadata: { priority: data.priority },
    });

  if (auditError) {
    console.error("Service request audit write failed:", auditError);
  }

  return data;
}

export async function updateCustomerRequest(
  id: string,
  input: Pick<ServiceRequestInput, "title" | "description" | "priority">,
) {
  const { supabase, user, customer } = await getCurrentCustomer();

  if (!user) throw new Error("AUTH_REQUIRED");
  if (!customer) throw new Error("CUSTOMER_PROFILE_REQUIRED");

  const { data, error } = await supabase
    .from("service_requests")
    .update({
      title: input.title,
      description: input.description || null,
      priority: input.priority,
    })
    .eq("id", id)
    .eq("customer_id", customer.id)
    .select(requestColumns)
    .single();

  if (error) throw new Error(error.message);

  const { error: auditError } = await supabase
    .from("audit_events")
    .insert({
      organization_id: customer.organization_id,
      actor_id: user.id,
      entity_type: "service_request",
      entity_id: data.id,
      action: "request.updated",
      metadata: { priority: data.priority },
    });

  if (auditError) {
    console.error("Service request audit write failed:", auditError);
  }

  return data;
}
