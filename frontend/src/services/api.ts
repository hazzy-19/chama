import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Safe JSON parser — never throws on empty or non-JSON responses. */
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || text.trim() === "") return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

/** Centralized fetch wrapper to handle auth tokens and global 401 redirects */
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (res.status === 401) {
    // Token is invalid/expired — clear session and force re-login
    await auth.signOut();
    window.location.href = "/auth?mode=signin";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await safeJson(res);
  
  if (!res.ok) {
    throw new Error(data.detail || "An unexpected error occurred.");
  }
  
  return data;
}

export async function fetchBalance() {
  return fetchApi("/api/v1/user/balance");
}

export async function initiateTopUp(amount: number, phone: string) {
  return fetchApi("/api/v1/mpesa/initiate", {
    method: "POST",
    body: JSON.stringify({ amount, phone, description: "Savings deposit" }),
  });
}

export async function pollStkStatus(checkoutRequestId: string) {
  return fetchApi(`/api/v1/mpesa/stk-status/${checkoutRequestId}`);
}

export async function requestWithdrawal(amount: number, reason: string) {
  return fetchApi("/api/v1/withdrawals", {
    method: "POST",
    body: JSON.stringify({ amount, reason }),
  });
}

export async function fetchGoals() {
  return fetchApi("/api/v1/goals");
}

export async function createGoal(goalData: {
  name: string;
  target_amount: number;
  target_date: string;
  color_theme: string;
}) {
  return fetchApi("/api/v1/goals", {
    method: "POST",
    body: JSON.stringify(goalData),
  });
}

export async function requestGuardian(guardianData: {
  name: string;
  phone_number: string;
}) {
  return fetchApi("/api/v1/guardians", {
    method: "POST",
    body: JSON.stringify(guardianData),
  });
}
