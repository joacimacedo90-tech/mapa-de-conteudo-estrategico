import { User, Report, PricingPlan, AdminSettings, WebhookLog, MetaDiscoveryResult, FreeAccessRequest, ClientDiagnostic, DemoAccessRequest, ExecutionMetrics, NicheDetectionResult, PublicReelsDemoResult } from './types';

const TOKEN_KEY = 'mapa_auth_token';
const ADMIN_TOKEN_KEY = 'mapa_admin_token';

// In-memory fallback for environments with blocked localStorage (e.g. mobile incognito)
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStorage[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStorage[key] = value;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    delete memoryStorage[key];
  }
}

export function getAuthToken(): string | null {
  return safeGetItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    safeSetItem(TOKEN_KEY, token);
  } else {
    safeRemoveItem(TOKEN_KEY);
  }
}

export function getAdminToken(): string | null {
  return safeGetItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) {
    safeSetItem(ADMIN_TOKEN_KEY, token);
  } else {
    safeRemoveItem(ADMIN_TOKEN_KEY);
  }
}

export const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: 'essencial',
    name: 'Plano Essencial',
    price: 47,
    originalPrice: 97,
    installments: '5x de R$ 10,23',
    description: 'Ideal para quem busca clareza de posicionamento e direção para os primeiros 30 dias.',
    features: [
      'Diagnóstico Completo de Posicionamento & Bio',
      'Projeção de Crescimento de Seguidores em 90 Dias (3 Cenários)',
      'Análise de Público-Alvo, Dores Profundas & Desejos',
      '30 Ideias de Conteúdo Estratégico',
      'Calendário Estratégico Editorial de 30 Dias (Mês 1)',
      'Identificação do Diferencial Competitivo Único'
    ],
    hotmartCheckoutUrl: 'https://pay.hotmart.com/D108257746C?off=a42sa4ug',
    hotmartProductId: 'D108257746C',
    hotmartOfferCode: 'a42sa4ug',
    limits: {
      calendarDays: 30,
      hasDiagnosis: true,
      hasGrowthProjection: true,
      hasContentIdeas: true,
      hasReels: false,
      hasCarousels: false,
      hasStories: false,
      hasHooks: false,
      hasExportMarkdown: false,
      hasVipBadge: false
    },
    isPopular: false
  },
  {
    id: 'pro',
    name: 'Plano Estratégico Pro',
    badge: 'Mais Vendido',
    price: 97,
    originalPrice: 197,
    installments: '10x de R$ 11,28',
    description: 'Acelerador com roteiros prontos e 60 dias de calendário para crescer e atrair clientes.',
    features: [
      'Tudo do Plano Essencial',
      '10 Roteiros Prontos de Reels (Ganchos + Quebra + CTA)',
      '10 Carrosséis Estruturados Slide a Slide',
      '10 Sequências de Stories de Alta Conversão',
      'Banco de Ganchos Magnéticos & Modelos de Legenda',
      'Calendário Estratégico Editorial de 60 Dias (Mês 1 e Mês 2)',
      'Exportação de Conteúdo em Texto e Markdown'
    ],
    hotmartCheckoutUrl: 'https://pay.hotmart.com/D108257746C?off=vp8mrq3g',
    hotmartProductId: 'D108257746C',
    hotmartOfferCode: 'vp8mrq3g',
    limits: {
      calendarDays: 60,
      hasDiagnosis: true,
      hasGrowthProjection: true,
      hasContentIdeas: true,
      hasReels: true,
      hasCarousels: true,
      hasStories: true,
      hasHooks: true,
      hasExportMarkdown: true,
      hasVipBadge: false
    },
    isPopular: true
  },
  {
    id: 'premium',
    name: 'Plano Premium VIP',
    badge: 'Acesso Completo',
    price: 197,
    originalPrice: 397,
    installments: '12x de R$ 19,78',
    description: 'Acesso total e irrestrito: cronograma trimestral completo de 90 dias e suporte prioritário.',
    features: [
      'Tudo do Plano Estratégico Pro',
      'Calendário Trimestral Completo de 90 Dias (Mês 1, Mês 2 e Mês 3)',
      'Acesso Prioritário a Atualizações e Novos Recursos',
      'Selo VIP no Painel do Cliente',
      'Roteiros Avançados de Conversão Direta'
    ],
    hotmartCheckoutUrl: 'https://pay.hotmart.com/D108257746C?off=h8rve3k7',
    hotmartProductId: 'D108257746C',
    hotmartOfferCode: 'h8rve3k7',
    limits: {
      calendarDays: 90,
      hasDiagnosis: true,
      hasGrowthProjection: true,
      hasContentIdeas: true,
      hasReels: true,
      hasCarousels: true,
      hasStories: true,
      hasHooks: true,
      hasExportMarkdown: true,
      hasVipBadge: true
    },
    isPopular: false
  }
];

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

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && endpoint.startsWith('/api/')) {
      throw new Error(`Servidor retornou HTML ao invés de dados para ${endpoint}. O endpoint pode não estar roteado.`);
    }

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
    try {
      const res = await request<{ plans?: PricingPlan[]; headlineBanner?: string; metaConfigured?: boolean }>('/api/plans');
      if (res && Array.isArray(res.plans) && res.plans.length > 0) {
        return {
          plans: res.plans,
          headlineBanner: res.headlineBanner || '',
          metaConfigured: Boolean(res.metaConfigured)
        };
      }
      return {
        plans: FALLBACK_PLANS,
        headlineBanner: 'Oferta Especial: Desbloqueie seu plano estratégico de 90 dias com liberação imediata!',
        metaConfigured: false
      };
    } catch (e) {
      console.warn('[API_PLANS_FALLBACK] Utilizando planos padrões do sistema:', e);
      return {
        plans: FALLBACK_PLANS,
        headlineBanner: 'Oferta Especial: Desbloqueie seu plano estratégico de 90 dias com liberação imediata!',
        metaConfigured: false
      };
    }
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
    followersCount?: number;
    email?: string;
    whatsapp?: string;
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


