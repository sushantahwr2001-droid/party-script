import type { AuthResponse, BootstrapPayload, ForgotPasswordResponse, SetupStatusResponse } from "../types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8787/api" : "/api");

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed." }))) as { message?: string };
    throw new Error(errorBody.message ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  register(name: string, email: string, password: string, organizationName?: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, organizationName })
    });
  },
  forgotPassword(email: string) {
    return request<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  resetPassword(token: string, password: string) {
    return request<{ ok: true }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  },
  setupStatus() {
    return request<SetupStatusResponse>("/auth/setup-status", { method: "GET" });
  },
  me(token: string) {
    return request<{ user: AuthResponse["user"] }>("/auth/me", { method: "GET" }, token);
  },
  bootstrap(token: string) {
    return request<BootstrapPayload>("/bootstrap", { method: "GET" }, token);
  },
  createEvent(
    token: string,
    payload: {
      name: string;
      type: string;
      city: string;
      country: string;
      venue: string;
      startDate: string;
      endDate: string;
      expectedAttendees: number;
      expectedLeads: number;
      budgetTotal: number;
    },
  ) {
    return request<{ event: unknown }>("/events", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  createLead(
    token: string,
    payload: {
      fullName: string;
      company: string;
      title: string;
      email: string;
      phone: string;
      eventId: string;
      priority: string;
      nextAction: string;
      nextFollowUpDate: string;
      notes: string;
    },
  ) {
    return request<{ lead: unknown }>("/leads", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  createOpportunity(
    token: string,
    payload: {
      name: string;
      eventType: string;
      industry: string;
      organizer: string;
      city: string;
      country: string;
      startDate: string;
      endDate: string;
      participationType: string;
      boothNeeded: boolean;
      expectedReach: number;
      expectedLeads: number;
      strategicFitScore: number;
      estimatedCost: number;
      priority: string;
      decision: string;
      notes: string;
    },
  ) {
    return request<{ opportunity: unknown }>("/opportunities", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  createTask(
    token: string,
    payload: {
      title: string;
      eventId: string;
      assigneeUserId?: string;
      dueDate: string;
      priority: string;
      status: string;
      notes: string;
    },
  ) {
    return request<{ task: unknown }>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  createVendor(
    token: string,
    payload: {
      eventId: string;
      name: string;
      category: string;
      deliverable: string;
      ownerUserId?: string;
      status: string;
      paymentStatus: string;
    },
  ) {
    return request<{ vendor: unknown }>("/vendors", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  createBudgetItem(
    token: string,
    payload: {
      eventId: string;
      category: string;
      budgeted: number;
      actual: number;
      committed: number;
    },
  ) {
    return request<{ budget: unknown }>("/budgets", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  convertOpportunity(token: string, id: string) {
    return request<{ event: unknown }>("/opportunities/" + id + "/convert", { method: "POST" }, token);
  }
};
