import { User, Report, PricingPlan, AdminSettings, WebhookLog, MetaDiscoveryResult, FreeAccessRequest, ClientDiagnostic, DemoAccessRequest, ExecutionMetrics, NicheDetectionResult, PublicReelsDemoResult } from './types';

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

// Resilient request helper with 35s client timeout to prevent infinite UI loading
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

  // Create an abort controller with 35s timeout unless caller supplied one
  let signal = options.signal;
  let timer: NodeJS.Timeout | null = null;
  if (!signal) {
    const controller = new AbortController();
    timer = setTimeout(() => {
      controller.abort(new Error('A requisição excedeu o limite de tempo (35 segundos). Por favor, tente novamente.'));
    }, 35000);
    signal = controller.signal;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      signal
    });

    if (timer) clearTimeout(timer);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Ocorreu um erro na solicitação.');
    }

    return data as T;
  } catch (err: unknown) {
    if (timer) clearTimeout(timer);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('A requisição demorou mais do que o esperado e foi interrompida para sua proteção. Clique em "Tentar Novamente".');
      }
      throw err;
    }
    throw new Error('Falha de conexão com o servidor. Verifique sua internet.');
  }
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
  },

  // Client Diagnostics (Admin)
  async adminVerify(): Promise<{ valid: boolean; role: string }> {
    return request('/api/admin/verify');
  },

  async adminGetEmailStatus(): Promise<{
    configured: boolean;
    missing: string[];
    smtpHost: string | null;
    smtpUser: string | null;
    smtpFrom: string | null;
  }> {
    return request('/api/admin/email-status');
  },

  async getAdminClientDiagnostics(): Promise<{ diagnostics: ClientDiagnostic[] }> {
    return request('/api/admin/client-diagnostics');
  },

  async adminGenerateClientDiagnostic(payload: {
    clientName: string;
    clientEmail: string;
    instagramUsername: string;
    profession?: string;
    niche?: string;
    product?: string;
    objective?: string;
  }): Promise<{
    success: boolean;
    message: string;
    diagnostic: ClientDiagnostic;
  }> {
    return request('/api/admin/client-diagnostics/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminSendClientDiagnosticEmail(id: string): Promise<{
    success: boolean;
    message: string;
    diagnostic?: ClientDiagnostic;
  }> {
    return request(`/api/admin/client-diagnostics/${id}/send-email`, {
      method: 'POST'
    });
  },

  async adminDeleteClientDiagnostic(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return request(`/api/admin/client-diagnostics/${id}`, {
      method: 'DELETE'
    });
  },

  // Demonstração Pública Inteligente (Identificação de Nicho & 30 Dias de Reels)
  async detectNiche(payload: {
    username: string;
    manualBio?: string;
    manualCaptions?: string;
  }): Promise<{ success: boolean; data: NicheDetectionResult }> {
    return request('/api/demo/detect-niche', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async generate30DaysReelsDemo(payload: {
    username: string;
    confirmedNiche?: string;
    segment?: string;
    targetAudience?: string;
  }): Promise<{ success: boolean; demo: PublicReelsDemoResult }> {
    return request('/api/demo/generate-30-reels', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Testes do Plano Essencial (Demonstração Essencial Privada)
  async requestDemoAccess(payload: { name: string; email: string }): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
  }> {
    return request('/api/demo-access/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyDemoInvite(token: string): Promise<{
    valid: boolean;
    name?: string;
    email?: string;
    planId?: string;
    planName?: string;
    expiresAt?: string;
    error?: string;
  }> {
    return request(`/api/demo-access/verify-invite?token=${encodeURIComponent(token)}`);
  },

  async activateDemoAccount(payload: {
    token: string;
    password: string;
    lgpdConsent: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }> {
    return request('/api/demo-access/activate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getAdminDemoRequests(): Promise<{ requests: DemoAccessRequest[] }> {
    return request('/api/admin/demo-access-requests');
  },

  async adminCreateDemoGrant(payload: { name: string; email: string }): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
    inviteUrl: string;
    inviteToken: string;
    emailStatus?: string;
  }> {
    return request('/api/admin/demo-grants/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminProrrogarDemo(id: string, additionalDays = 7): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
  }> {
    return request(`/api/admin/demo-grants/${id}/prorrogar`, {
      method: 'POST',
      body: JSON.stringify({ additionalDays })
    });
  },

  async adminApproveDemoRequest(id: string): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
    inviteUrl: string;
    inviteToken: string;
    emailStatus?: string;
  }> {
    return request(`/api/admin/demo-access-requests/${id}/approve`, {
      method: 'POST'
    });
  },

  async adminRejectDemoRequest(id: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
  }> {
    return request(`/api/admin/demo-access-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async adminUpdateDemoRequestStatus(id: string, status: string): Promise<{
    success: boolean;
    message: string;
    request: DemoAccessRequest;
  }> {
    return request(`/api/admin/demo-access-requests/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async getAdminDemoUsers(): Promise<{ demoUsers: User[] }> {
    return request('/api/admin/demo-users');
  },

  async adminToggleDemoUserStatus(id: string, status: 'active' | 'blocked' | 'expired'): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    return request(`/api/admin/demo-users/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }
};


