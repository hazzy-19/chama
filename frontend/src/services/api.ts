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

export async function fetchBalance() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/user/balance`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to load balance.");
  }
  return res.json();
}

export async function initiateTopUp(amount: number, phone: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/mpesa/initiate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount, phone, description: "Savings deposit" }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Unable to initiate STK Push.");
  }
  return data;
}

export async function requestWithdrawal(amount: number, reason: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/withdrawals`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount, reason }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Unable to submit withdrawal request.");
  }
  return data;
}

export async function fetchGoals() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/goals`, { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to load goals.");
  }
  return res.json();
}

export async function createGoal(goalData: { name: string; target_amount: number; target_date: string; color_theme: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/goals`, {
    method: "POST",
    headers,
    body: JSON.stringify(goalData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Unable to create goal.");
  }
  return data;
}

export async function requestGuardian(guardianData: { name: string; phone_number: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/guardians`, {
    method: "POST",
    headers,
    body: JSON.stringify(guardianData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Unable to request guardian.");
  }
  return data;
}
