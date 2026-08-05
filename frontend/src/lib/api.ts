const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('god_token');
}

export function setToken(token: string) {
  window.sessionStorage.setItem('god_token', token);
}

export function clearToken() {
  window.sessionStorage.removeItem('god_token');
}

export type Role = 'super_admin' | 'company_admin' | 'employee';

/** Décode la charge utile du JWT (non signée côté client — usage UI uniquement,
 * chaque appel API est de toute façon revalidé par le backend). */
export function getSession(): { role: Role; email: string; companyId: string | null } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { role: payload.role, email: payload.email, companyId: payload.companyId };
  } catch {
    return null;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (identifier: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  listCompanies: () => request('/api/companies'),
  stats: () => request('/api/companies/stats'),
  createCompany: (payload: Record<string, unknown>) =>
    request('/api/companies', { method: 'POST', body: JSON.stringify(payload) }),
  suspend: (id: string) => request(`/api/companies/${id}/suspend`, { method: 'POST' }),
  reactivate: (id: string) => request(`/api/companies/${id}/reactivate`, { method: 'POST' }),
  renew: (id: string, days: number) =>
    request(`/api/companies/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    }),
  remove: (id: string) => request(`/api/companies/${id}`, { method: 'DELETE' }),

  // --- Espace entreprise (company_admin / employee) ---
  listClients: () => request('/api/clients'),
  createClient: (payload: Record<string, unknown>) =>
    request('/api/clients', { method: 'POST', body: JSON.stringify(payload) }),
  updateClient: (id: string, payload: Record<string, unknown>) =>
    request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  removeClient: (id: string) => request(`/api/clients/${id}`, { method: 'DELETE' }),

  listAppointments: () => request('/api/appointments'),
  todayAppointments: () => request('/api/appointments/today'),
  createAppointment: (payload: Record<string, unknown>) =>
    request('/api/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointmentStatus: (id: string, status: string, amountPaid?: number) =>
    request(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, amountPaid }),
    }),
  removeAppointment: (id: string) => request(`/api/appointments/${id}`, { method: 'DELETE' }),

  // --- Paiements (espace entreprise) ---
  initiatePayment: (payload: Record<string, unknown>) =>
    request('/api/payments/initiate', { method: 'POST', body: JSON.stringify(payload) }),
  myPayments: () => request('/api/payments/mine'),
  devConfirmPayment: (reference: string) =>
    request(`/api/payments/dev-confirm/${reference}`, { method: 'POST' }),

  // --- Paiements (super admin) ---
  allPayments: () => request('/api/payments'),
  revenueStats: () => request('/api/payments/revenue'),
  recordManualPayment: (payload: Record<string, unknown>) =>
    request('/api/payments/manual', { method: 'POST', body: JSON.stringify(payload) }),

  // --- Notifications ---
  myNotifications: () => request('/api/notifications/mine'),
  allNotifications: () => request('/api/notifications'),

  // --- IA (espace entreprise) ---
  aiInfo: () => request('/api/ai/info'),
  aiSettings: () => request('/api/ai/settings'),
  updateAiSettings: (payload: Record<string, unknown>) =>
    request('/api/ai/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  aiTestChat: (message: string, clientPhone?: string) =>
    request('/api/ai/test-chat', { method: 'POST', body: JSON.stringify({ message, clientPhone }) }),
  aiConversations: () => request('/api/ai/conversations'),
};

export const platformAi = {
  anomalies: () => request('/api/platform-ai/anomalies'),
  report: () => request('/api/platform-ai/report'),
};
