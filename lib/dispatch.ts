import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

type Job = Tables<"jobs">;
type Assignment = Tables<"assignments">;
type Profile = Tables<"profiles">;

type DispatchRequest = Tables<"service_requests"> & {
  customers: Pick<Tables<"customers">, "id" | "name" | "email" | "phone"> | null;
  sites: Pick<Tables<"sites">, "id" | "name" | "address_line1" | "city" | "state" | "postal_code"> | null;
};

export type DispatchJob = Job & {
  service_requests: DispatchRequest | null;
};

export type DispatcherContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  organizationIds: string[];
  role: "dispatcher" | "admin";
};

export async function getDispatcherContext(): Promise<DispatcherContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships, error } = await supabase
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["dispatcher", "admin"]);

  if (error) throw new Error(error.message);
  if (!memberships?.length) return null;

  const adminMembership = memberships.find((membership) => membership.role === "admin");

  return {
    supabase,
    user: { id: user.id, email: user.email },
    organizationIds: memberships.map((membership) => membership.organization_id),
    role: adminMembership ? "admin" : "dispatcher",
  };
}

export async function listDispatchQueue(filters: {
  status?: string;
  priority?: string;
  search?: string;
}) {
  const context = await getDispatcherContext();
  if (!context) return { authorized: false as const, items: [] };

  let query = context.supabase
    .from("service_requests")
    .select(
      "id,organization_id,customer_id,site_id,title,description,priority,status,created_at,updated_at,customers(id,name,email),sites(id,name,city,state)",
    )
    .in("organization_id", context.organizationIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data: requests, error } = await query;
  if (error) throw new Error(error.message);

  const requestIds = (requests ?? []).map((request) => request.id);
  if (!requestIds.length) return { authorized: true as const, items: [] };

  const { data: jobs, error: jobsError } = await context.supabase
    .from("jobs")
    .select("id,request_id,organization_id,status,scheduled_start,scheduled_end,created_at,updated_at")
    .in("request_id", requestIds);

  if (jobsError) throw new Error(jobsError.message);

  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: assignments, error: assignmentError } = jobIds.length
    ? await context.supabase
        .from("assignments")
        .select("id,job_id,technician_id,assigned_at,unassigned_at")
        .in("job_id", jobIds)
        .is("unassigned_at", null)
    : { data: [], error: null };

  if (assignmentError) throw new Error(assignmentError.message);

  const technicianIds = [...new Set((assignments ?? []).map((assignment) => assignment.technician_id))];
  const { data: profiles, error: profileError } = technicianIds.length
    ? await context.supabase.from("profiles").select("id,full_name,phone,status").in("id", technicianIds)
    : { data: [], error: null };

  if (profileError) throw new Error(profileError.message);

  const jobByRequest = new Map((jobs ?? []).map((job) => [job.request_id, job]));
  const assignmentByJob = new Map((assignments ?? []).map((assignment) => [assignment.job_id, assignment]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    authorized: true as const,
    items: (requests ?? []).map((request) => {
      const job = jobByRequest.get(request.id) ?? null;
      const assignment = job ? assignmentByJob.get(job.id) ?? null : null;
      return {
        request,
        job,
        assignment,
        technician: assignment ? profileById.get(assignment.technician_id) ?? null : null,
      };
    }),
  };
}

export async function listAvailableTechnicians() {
  const context = await getDispatcherContext();
  if (!context) return { authorized: false as const, technicians: [] };

  const { data: memberships, error } = await context.supabase
    .from("organization_memberships")
    .select("organization_id,user_id")
    .in("organization_id", context.organizationIds)
    .eq("role", "technician")
    .eq("status", "active");

  if (error) throw new Error(error.message);

  const userIds = [...new Set((memberships ?? []).map((membership) => membership.user_id))];
  if (!userIds.length) return { authorized: true as const, technicians: [] };

  const { data: profiles, error: profileError } = await context.supabase
    .from("profiles")
    .select("id,full_name,phone,status")
    .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  const { data: activeAssignments, error: assignmentError } = await context.supabase
    .from("assignments")
    .select("technician_id")
    .in("technician_id", userIds)
    .is("unassigned_at", null);

  if (assignmentError) throw new Error(assignmentError.message);

  const workload = new Map<string, number>();
  for (const assignment of activeAssignments ?? []) {
    workload.set(assignment.technician_id, (workload.get(assignment.technician_id) ?? 0) + 1);
  }

  return {
    authorized: true as const,
    technicians: (profiles ?? []).map((profile: Profile) => ({
      ...profile,
      activeJobCount: workload.get(profile.id) ?? 0,
    })),
  };
}

export async function getDispatchJob(jobId: string) {
  const context = await getDispatcherContext();
  if (!context) return { authorized: false as const, job: null, assignments: [] };

  const { data: job, error } = await context.supabase
    .from("jobs")
    .select(
      "id,organization_id,request_id,status,scheduled_start,scheduled_end,started_at,completed_at,completion_notes,created_at,updated_at,service_requests(id,title,description,priority,status,customer_id,site_id,customers(id,name,email,phone),sites(id,name,address_line1,city,state,postal_code))",
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!job) return { authorized: true as const, job: null, assignments: [] };

  const { data: assignments, error: assignmentError } = await context.supabase
    .from("assignments")
    .select("id,job_id,technician_id,assigned_by,assigned_at,unassigned_at")
    .eq("job_id", jobId)
    .order("assigned_at", { ascending: false });

  if (assignmentError) throw new Error(assignmentError.message);

  const technicianIds = [...new Set((assignments ?? []).map((assignment) => assignment.technician_id))];
  const { data: profiles, error: profileError } = technicianIds.length
    ? await context.supabase.from("profiles").select("id,full_name,phone,status").in("id", technicianIds)
    : { data: [], error: null };

  if (profileError) throw new Error(profileError.message);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    authorized: true as const,
    job: job as DispatchJob,
    assignments: (assignments ?? []).map((assignment: Assignment) => ({
      ...assignment,
      technician: profileById.get(assignment.technician_id) ?? null,
    })),
  };
}

export async function createJobForRequest(requestId: string) {
  const context = await getDispatcherContext();
  if (!context) throw new Error("DISPATCHER_REQUIRED");

  const { data, error } = await context.supabase
    .rpc("create_job_for_request", { p_request_id: requestId })
    .single()
    .overrideTypes<Job>();

  if (error) throw new Error(error.message);
  return data;
}

export async function assignJob(jobId: string, technicianId: string) {
  const context = await getDispatcherContext();
  if (!context) throw new Error("DISPATCHER_REQUIRED");

  const { data, error } = await context.supabase
    .rpc("assign_job", {
      p_job_id: jobId,
      p_technician_id: technicianId,
    })
    .single()
    .overrideTypes<Assignment>();

  if (error) throw new Error(error.message);
  return data;
}

export async function unassignJob(jobId: string, assignmentId: string) {
  const context = await getDispatcherContext();
  if (!context) throw new Error("DISPATCHER_REQUIRED");

  const { data, error } = await context.supabase
    .rpc("unassign_job", {
      p_job_id: jobId,
      p_assignment_id: assignmentId,
    })
    .single()
    .overrideTypes<Assignment>();

  if (error) throw new Error(error.message);
  return data;
}
