import { User, Report, PricingPlan, AdminSettings, WebhookLog, MetaDiscoveryResult, FreeAccessRequest } from './types';

const TOKEN_KEY = 'mapa_auth_token';
const ADMIN_TOKEN_KEY = 'mapa_admin_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  const adminToken = getAdminToken();
  const userToken = getAuthToken();

  if (endpoint.startsWith('/api/admin') && adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  } else if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Ocorreu um erro na solicitação.');
  }

  return data as T;
}

export const api = {
  // Public & Plans
  async getPlans(): Promise<{ plans: PricingPlan[]; headlineBanner: string; metaConfigured: boolean }> {
    return request('/api/plans');
  },

  async checkMetaProfile(username: string): Promise<MetaDiscoveryResult> {
    return request(`/api/profile/meta-check?username=${encodeURIComponent(username)}`);
  },

  // Reports
  async generateReport(payload: {
    username: string;
    profession?: string;
    niche?: string;
    product?: string;
    objective?: string;
    manualBio?: string;
    manualCaptions?: string;
    lgpdConsent: boolean;
    userId?: string;
  }): Promise<{ success: boolean; reportId: string; report: Report }> {
    return request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getReport(id: string): Promise<{ report: Report; isUnlocked: boolean }> {
    return request(`/api/reports/${id}`);
  },

  async verifyPayment(id: string): Promise<{ reportId: string; isPaid: boolean; paidAt?: string; planId?: string; message: string }> {
    return request(`/api/reports/${id}/verify-payment`);
  },

  async claimReport(id: string): Promise<{ success: boolean; report: Report }> {
    return request(`/api/reports/${id}/claim`, { method: 'POST' });
  },

  // User Auth
  async register(payload: { name: string; email: string; password: string; lgpdConsent: boolean }): Promise<{ token: string; user: User }> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async login(payload: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  async getUserReports(): Promise<{ reports: Report[] }> {
    return request('/api/user/reports');
  },

  async deleteUserReport(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/user/reports/${id}`, { method: 'DELETE' });
  },

  async deleteAccountLgpd(): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/lgpd/delete-account', { method: 'POST' });
  },

  async getUserPlan(): Promise<{
    hasActivePlan: boolean;
    activePlanId: string | null;
    planDetails: PricingPlan | null;
    planLimits: import('./types').PlanResourceLimits | null;
    customerAccess: import('./types').CustomerAccess | null;
  }> {
    return request('/api/user/plan');
  },

  async linkPurchase(payload: { reportId?: string; transactionId?: string }): Promise<{
    success: boolean;
    message: string;
    report?: Report | null;
    activePlanId?: string | null;
  }> {
    return request('/api/user/link-purchase', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin
  async adminLogin(password: string): Promise<{ success: boolean; token: string; user: { role: string } }> {
    return request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  async getAdminSettings(): Promise<{ settings: AdminSettings }> {
    return request('/api/admin/settings');
  },

  async updateAdminSettings(settings: Partial<AdminSettings> & { metaToken?: string; newPassword?: string }): Promise<{ success: boolean; settings: AdminSettings }> {
    return request('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  async getAdminReports(): Promise<{ reports: Report[] }> {
    return request('/api/admin/reports');
  },

  async adminUnlockReport(id: string, planId: string, note?: string): Promise<{ success: boolean; report: Report }> {
    return request(`/api/admin/reports/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ planId, note })
    });
  },

  async adminDeleteReport(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/reports/${id}`, { method: 'DELETE' });
  },

  async getAdminWebhooks(): Promise<{ logs: WebhookLog[] }> {
    return request('/api/admin/webhooks');
  },

  async getAdminCustomerAccesses(): Promise<{ accesses: import('./types').CustomerAccess[] }> {
    return request('/api/admin/customer-accesses');
  },

  async simulateWebhook(payload: {
    reportId?: string;
    event?: string;
    planId?: string;
    buyerEmail?: string;
    buyerName?: string;
    tokenProvided?: string;
  }): Promise<{ simulationResult: unknown }> {
    return request('/api/admin/simulate-hotmart-webhook', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Free Access Flow (Solicitação & Ativação)
  async requestFreeAccess(payload: { name: string; email: string }): Promise<{
    success: boolean;
    message: string;
    request: FreeAccessRequest;
  }> {
    return request('/api/free-access/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyFreeAccessInvite(token: string): Promise<{
    valid: boolean;
    name?: string;
    email?: string;
    expiresAt?: string;
    message?: string;
  }> {
    return request(`/api/free-access/verify-invite?token=${encodeURIComponent(token)}`);
  },

  async activateFreeAccess(payload: {
    token: string;
    password: string;
    lgpdConsent: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }> {
    return request('/api/free-access/activate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getAdminFreeAccessRequests(): Promise<{ requests: FreeAccessRequest[] }> {
    return request('/api/admin/free-access-requests');
  },

  async adminApproveFreeAccessRequest(id: string): Promise<{
    success: boolean;
    message: string;
    request: FreeAccessRequest;
    inviteUrl: string;
    inviteToken: string;
  }> {
    return request(`/api/admin/free-access-requests/${id}/approve`, {
      method: 'POST'
    });
  },

  async adminRejectFreeAccessRequest(id: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    request: FreeAccessRequest;
  }> {
    return request(`/api/admin/free-access-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};

