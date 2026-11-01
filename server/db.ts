import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Report, PricingPlan, AdminSettings, WebhookLog, CustomerAccess, PlanResourceLimits, FreeAccessRequest, ClientDiagnostic, DemoAccessRequest } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: (User & { passwordHash?: string; salt?: string })[];
  reports: Report[];
  settings: AdminSettings & {
    adminPasswordHash?: string;
    adminSalt?: string;
    metaToken?: string;
  };
  webhookLogs: WebhookLog[];
  customerAccesses?: CustomerAccess[];
  freeAccessRequests?: FreeAccessRequest[];
  clientDiagnostics?: ClientDiagnostic[];
  demoAccessRequests?: DemoAccessRequest[];
}

export const DEFAULT_PLANS: PricingPlan[] = [
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
      'Calendário Trimestral Completo de 90 Dias (Mês 1, 2 e 3)',
      'Estratégias de Escala & Conversão para o Mês 3',
      'Exportação Ilimitada em PDF e Markdown',
      'Checklist de Otimização de Perfil de Alta Performance',
      'Selo VIP de Alta Performance & Suporte Prioritário'
    ],
    hotmartCheckoutUrl: 'https://pay.hotmart.com/D108257746C?off=4bce8my0',
    hotmartProductId: 'D108257746C',
    hotmartOfferCode: '4bce8my0',
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

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

let cache: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (cache) return cache;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      cache = JSON.parse(content);
      if (cache) {
        if (!cache.customerAccesses) cache.customerAccesses = [];
        if (!cache.freeAccessRequests) cache.freeAccessRequests = [];
        if (!cache.clientDiagnostics) cache.clientDiagnostics = [];
        if (!cache.demoAccessRequests) cache.demoAccessRequests = [];
        // Ensure 3 plans are present and properly structured with limits
        if (!cache.settings.plans || cache.settings.plans.length !== 3 || cache.settings.plans.some(p => p.id === 'vip' || !p.limits)) {
          cache.settings.plans = DEFAULT_PLANS;
          saveDatabase(cache);
        }
        return cache;
      }
    } catch (err) {
      console.error('Error loading db.json, recreating defaults', err);
    }
  }

  const defaultAdmin = hashPassword('admin123');

  const initialData: DatabaseSchema = {
    users: [],
    reports: [],
    settings: {
      adminPasswordConfigured: true,
      adminPasswordHash: defaultAdmin.hash,
      adminSalt: defaultAdmin.salt,
      hotmartWebhookToken: process.env.HOTMART_WEBHOOK_TOKEN || 'HOTMART_TOKEN_MAPA_2026',
      metaConfigured: Boolean(process.env.META_INSTAGRAM_TOKEN),
      metaAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
      metaToken: process.env.META_INSTAGRAM_TOKEN || '',
      plans: DEFAULT_PLANS,
      headlineBanner: 'Oferta Especial de Lançamento: Desbloqueie sua estratégia completa com desconto exclusivo!'
    },
    webhookLogs: [],
    customerAccesses: [],
    freeAccessRequests: [],
    clientDiagnostics: [],
    demoAccessRequests: []
  };

  saveDatabase(initialData);
  cache = initialData;
  return cache;
}


function saveDatabase(data: DatabaseSchema) {
  cache = data;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export const db = {
  // Users
  getUserByEmail(email: string) {
    const data = loadDatabase();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById(id: string) {
    const data = loadDatabase();
    return data.users.find((u) => u.id === id);
  },
  createUser(email: string, password: string, name: string): User {
    const data = loadDatabase();
    const existing = db.getUserByEmail(email);
    if (existing) {
      throw new Error('Email já cadastrado');
    }
    const { hash, salt } = hashPassword(password);
    const user: User & { passwordHash: string; salt: string } = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt
    };
    data.users.push(user);
    saveDatabase(data);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser;
  },
  verifyUserCredentials(email: string, password: string): User | null {
    const user = db.getUserByEmail(email);
    if (!user || !user.passwordHash || !user.salt) return null;
    if (verifyPassword(password, user.passwordHash, user.salt)) {
      const { passwordHash: _, salt: __, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  // LGPD: Data erasure
  deleteUserData(userId: string) {
    const data = loadDatabase();
    data.users = data.users.filter((u) => u.id !== userId);
    // Anonymize or remove reports
    data.reports = data.reports.filter((r) => r.userId !== userId);
    saveDatabase(data);
    return true;
  },

  // Reports
  createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'isPaid'>): Report {
    const data = loadDatabase();
    const newReport: Report = {
      ...report,
      id: crypto.randomUUID(),
      isPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.reports.unshift(newReport);
    saveDatabase(data);
    return newReport;
  },
  getReportById(id: string): Report | null {
    const data = loadDatabase();
    return data.reports.find((r) => r.id === id) || null;
  },
  getReportsByUser(userId: string): Report[] {
    const data = loadDatabase();
    return data.reports.filter((r) => r.userId === userId);
  },
  getAllReports(): Report[] {
    const data = loadDatabase();
    return [...data.reports];
  },
  unlockReport(id: string, planId?: string, transactionId?: string) {
    const data = loadDatabase();
    const report = data.reports.find((r) => r.id === id);
    if (!report) return null;
    report.isPaid = true;
    report.paidAt = new Date().toISOString();
    report.paidPlanId = planId || report.paidPlanId || 'pro';
    if (transactionId) report.hotmartTransactionId = transactionId;
    report.updatedAt = new Date().toISOString();
    saveDatabase(data);
    return report;
  },
  deleteReport(id: string) {
    const data = loadDatabase();
    const initialLen = data.reports.length;
    data.reports = data.reports.filter((r) => r.id !== id);
    saveDatabase(data);
    return data.reports.length < initialLen;
  },

  // Settings & Admin
  getSettings(): AdminSettings {
    const data = loadDatabase();
    return {
      adminPasswordConfigured: Boolean(data.settings.adminPasswordHash),
      hotmartWebhookToken: data.settings.hotmartWebhookToken,
      metaConfigured: Boolean(data.settings.metaToken && data.settings.metaAccountId),
      metaAccountId: data.settings.metaAccountId || '',
      plans: data.settings.plans || DEFAULT_PLANS,
      headlineBanner: data.settings.headlineBanner || ''
    };
  },
  updateSettings(newSettings: Partial<AdminSettings> & { metaToken?: string }) {
    const data = loadDatabase();
    if (newSettings.plans) data.settings.plans = newSettings.plans;
    if (newSettings.hotmartWebhookToken !== undefined) data.settings.hotmartWebhookToken = newSettings.hotmartWebhookToken;
    if (newSettings.headlineBanner !== undefined) data.settings.headlineBanner = newSettings.headlineBanner;
    if (newSettings.metaAccountId !== undefined) data.settings.metaAccountId = newSettings.metaAccountId;
    if (newSettings.metaToken !== undefined) data.settings.metaToken = newSettings.metaToken;
    data.settings.metaConfigured = Boolean(data.settings.metaToken && data.settings.metaAccountId);
    saveDatabase(data);
    return db.getSettings();
  },
  verifyAdminPassword(password: string): boolean {
    const data = loadDatabase();
    if (!data.settings.adminPasswordHash || !data.settings.adminSalt) {
      return password === 'admin123';
    }
    return verifyPassword(password, data.settings.adminPasswordHash, data.settings.adminSalt);
  },
  updateAdminPassword(newPassword: string) {
    const data = loadDatabase();
    const { hash, salt } = hashPassword(newPassword);
    data.settings.adminPasswordHash = hash;
    data.settings.adminSalt = salt;
    saveDatabase(data);
    return true;
  },
  getMetaCredentials() {
    const data = loadDatabase();
    return {
      token: data.settings.metaToken || process.env.META_INSTAGRAM_TOKEN || '',
      accountId: data.settings.metaAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || ''
    };
  },

  // Webhooks
  logWebhook(log: Omit<WebhookLog, 'id' | 'timestamp'>) {
    const data = loadDatabase();
    const newLog: WebhookLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    data.webhookLogs.unshift(newLog);
    // Keep max 100 logs
    if (data.webhookLogs.length > 100) {
      data.webhookLogs = data.webhookLogs.slice(0, 100);
    }
    saveDatabase(data);
    return newLog;
  },
  getWebhookLogs(): WebhookLog[] {
    const data = loadDatabase();
    return data.webhookLogs;
  },

  // Customer Access & Plans Control
  revokeReportAccess(id: string) {
    const data = loadDatabase();
    const report = data.reports.find((r) => r.id === id);
    if (!report) return null;
    report.isPaid = false;
    report.updatedAt = new Date().toISOString();
    saveDatabase(data);
    return report;
  },

  getPlanById(planId?: string): PricingPlan | undefined {
    const settings = db.getSettings();
    return settings.plans.find((p) => p.id === planId);
  },

  getPlanLimits(planId?: string): PlanResourceLimits {
    const plan = db.getPlanById(planId);
    if (plan && plan.limits) {
      return plan.limits;
    }
    if (planId === 'essencial') {
      return {
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
      };
    }
    if (planId === 'premium') {
      return {
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
      };
    }
    // Default to 'pro'
    return {
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
    };
  },

  registerOrUpdateAccess(access: Omit<CustomerAccess, 'id' | 'updatedAt'>): CustomerAccess {
    const data = loadDatabase();
    if (!data.customerAccesses) data.customerAccesses = [];

    const existingIndex = data.customerAccesses.findIndex(
      (a) =>
        (access.transactionId && a.transactionId === access.transactionId) ||
        (access.email && a.email.toLowerCase() === access.email.toLowerCase() && access.planId === a.planId)
    );

    let record: CustomerAccess;
    if (existingIndex >= 0) {
      record = {
        ...data.customerAccesses[existingIndex],
        ...access,
        email: access.email.toLowerCase(),
        updatedAt: new Date().toISOString()
      };
      data.customerAccesses[existingIndex] = record;
    } else {
      record = {
        ...access,
        id: crypto.randomUUID(),
        email: access.email.toLowerCase(),
        updatedAt: new Date().toISOString()
      };
      data.customerAccesses.unshift(record);
    }

    // If active, update user's activePlanId and customerAccess
    const user = data.users.find((u) => u.email.toLowerCase() === access.email.toLowerCase());
    if (user) {
      if (access.status === 'active') {
        user.activePlanId = access.planId;
        user.customerAccess = record;
      } else if (access.status === 'refunded' || access.status === 'canceled' || access.status === 'chargeback') {
        if (user.activePlanId === access.planId) {
          user.activePlanId = undefined;
        }
        user.customerAccess = record;
      }
    }

    saveDatabase(data);
    return record;
  },

  getCustomerAccessByEmail(email: string): CustomerAccess | null {
    const data = loadDatabase();
    if (!data.customerAccesses) return null;
    return data.customerAccesses.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getAllCustomerAccesses(): CustomerAccess[] {
    const data = loadDatabase();
    return data.customerAccesses || [];
  },

  revokeAccessByTransaction(transactionId: string, reason: string): CustomerAccess | null {
    const data = loadDatabase();
    if (!data.customerAccesses) return null;
    const access = data.customerAccesses.find((a) => a.transactionId === transactionId);
    if (access) {
      access.status = reason.includes('REFUND')
        ? 'refunded'
        : reason.includes('CHARGEBACK')
        ? 'chargeback'
        : 'canceled';
      access.updatedAt = new Date().toISOString();
      access.notes = `Acesso revogado: ${reason}`;

      // Revoke user active plan
      const user = data.users.find((u) => u.email.toLowerCase() === access.email.toLowerCase());
      if (user && user.activePlanId === access.planId) {
        user.activePlanId = undefined;
      }

      // Revoke report if linked
      if (access.reportId) {
        const rep = data.reports.find((r) => r.id === access.reportId);
        if (rep) {
          rep.isPaid = false;
          rep.updatedAt = new Date().toISOString();
        }
      }

      saveDatabase(data);
      return access;
    }
    return null;
  },

  // Free Access Requests
  createFreeAccessRequest(name: string, email: string): FreeAccessRequest {
    const data = loadDatabase();
    if (!data.freeAccessRequests) data.freeAccessRequests = [];

    const normalizedEmail = email.toLowerCase().trim();
    const existing = data.freeAccessRequests.find(
      (r) => r.email.toLowerCase() === normalizedEmail && r.status === 'Aguardando aprovação'
    );
    if (existing) {
      existing.name = name.trim();
      existing.updatedAt = new Date().toISOString();
      saveDatabase(data);
      return existing;
    }

    const newReq: FreeAccessRequest = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      status: 'Aguardando aprovação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.freeAccessRequests.unshift(newReq);
    saveDatabase(data);
    return newReq;
  },

  getFreeAccessRequests(): FreeAccessRequest[] {
    const data = loadDatabase();
    return data.freeAccessRequests || [];
  },

  getFreeAccessRequestById(id: string): FreeAccessRequest | null {
    const data = loadDatabase();
    if (!data.freeAccessRequests) return null;
    return data.freeAccessRequests.find((r) => r.id === id) || null;
  },

  getFreeAccessRequestByToken(token: string): FreeAccessRequest | null {
    const data = loadDatabase();
    if (!data.freeAccessRequests) return null;
    return data.freeAccessRequests.find((r) => r.inviteToken === token) || null;
  },

  approveFreeAccessRequest(id: string): { request: FreeAccessRequest; inviteToken: string } {
    const data = loadDatabase();
    if (!data.freeAccessRequests) data.freeAccessRequests = [];
    const req = data.freeAccessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Solicitação não encontrada');
    }

    const token = crypto.randomBytes(24).toString('hex');
    req.status = 'Aprovado';
    req.reviewedAt = new Date().toISOString();
    req.inviteToken = token;
    req.inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    req.inviteUsedAt = undefined;
    req.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return { request: req, inviteToken: token };
  },

  rejectFreeAccessRequest(id: string, reason?: string): FreeAccessRequest {
    const data = loadDatabase();
    if (!data.freeAccessRequests) data.freeAccessRequests = [];
    const req = data.freeAccessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Solicitação não encontrada');
    }

    req.status = 'Recusado';
    req.reviewedAt = new Date().toISOString();
    req.rejectionReason = reason || 'Solicitação recusada pelo administrador.';
    req.inviteToken = undefined;
    req.inviteExpiresAt = undefined;
    req.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return req;
  },

  activateFreeAccessInvite(token: string, password: string): { user: User; request: FreeAccessRequest } {
    const data = loadDatabase();
    if (!data.freeAccessRequests) data.freeAccessRequests = [];
    const req = data.freeAccessRequests.find((r) => r.inviteToken === token);
    if (!req) {
      throw new Error('Convite inválido ou não encontrado.');
    }

    if (req.status !== 'Aprovado') {
      throw new Error('Esta solicitação não foi aprovada pelo administrador.');
    }

    if (req.inviteUsedAt) {
      throw new Error('Este convite já foi utilizado para ativar uma conta.');
    }

    if (req.inviteExpiresAt && new Date() > new Date(req.inviteExpiresAt)) {
      throw new Error('Este convite expirou (validade de 48 horas excedida). Solicite um novo acesso.');
    }

    // Check if user already exists
    let existingUser = data.users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    if (existingUser) {
      const { hash, salt } = hashPassword(password);
      existingUser.passwordHash = hash;
      existingUser.salt = salt;
    } else {
      const { hash, salt } = hashPassword(password);
      const newUser = {
        id: crypto.randomUUID(),
        email: req.email.toLowerCase(),
        name: req.name,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt
      };
      data.users.push(newUser);
      existingUser = newUser;
    }

    req.inviteUsedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    saveDatabase(data);
    const { passwordHash: _, salt: __, ...safeUser } = existingUser;
    return { user: safeUser, request: req };
  },

  // Client Strategic Diagnostics (Admin Exclusive)
  createClientDiagnostic(params: {
    clientName: string;
    clientEmail: string;
    instagramUsername: string;
    profession?: string;
    niche?: string;
    product?: string;
    objective?: string;
    reportData: Report;
  }): ClientDiagnostic {
    const data = loadDatabase();
    if (!data.clientDiagnostics) data.clientDiagnostics = [];

    const newDiagnostic: ClientDiagnostic = {
      id: crypto.randomUUID(),
      clientName: params.clientName.trim(),
      clientEmail: params.clientEmail.trim().toLowerCase(),
      instagramUsername: params.instagramUsername.replace(/^@/, '').trim(),
      profession: params.profession || '',
      niche: params.niche || '',
      product: params.product || '',
      objective: params.objective || '',
      createdAt: new Date().toISOString(),
      status: 'Gerado (Aguardando Envio)',
      reportData: params.reportData
    };

    data.clientDiagnostics.unshift(newDiagnostic);
    saveDatabase(data);
    return newDiagnostic;
  },

  getAllClientDiagnostics(): ClientDiagnostic[] {
    const data = loadDatabase();
    return data.clientDiagnostics || [];
  },

  getClientDiagnosticById(id: string): ClientDiagnostic | null {
    const data = loadDatabase();
    return (data.clientDiagnostics || []).find((d) => d.id === id) || null;
  },

  updateClientDiagnosticStatus(
    id: string,
    status: 'Gerado (Aguardando Envio)' | 'Enviado por E-mail',
    emailSendLog?: { attemptedAt: string; success: boolean; error?: string }
  ): ClientDiagnostic | null {
    const data = loadDatabase();
    if (!data.clientDiagnostics) return null;

    const item = data.clientDiagnostics.find((d) => d.id === id);
    if (!item) return null;

    item.status = status;
    if (status === 'Enviado por E-mail') {
      item.sentAt = new Date().toISOString();
    }
    if (emailSendLog) {
      item.emailSendLog = emailSendLog;
    }

    saveDatabase(data);
    return item;
  },

  deleteClientDiagnostic(id: string): boolean {
    const data = loadDatabase();
    if (!data.clientDiagnostics) return false;

    const initialLength = data.clientDiagnostics.length;
    data.clientDiagnostics = data.clientDiagnostics.filter((d) => d.id !== id);

    if (data.clientDiagnostics.length !== initialLength) {
      saveDatabase(data);
      return true;
    }
    return false;
  },

  // ==========================================
  // TESTES DO PLANO ESSENCIAL (DEMONSTRAÇÃO)
  // ==========================================

  createDemoAccessRequest(name: string, email: string): DemoAccessRequest {
    const data = loadDatabase();
    if (!data.demoAccessRequests) data.demoAccessRequests = [];

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if there is already an active pending or approved request
    const existing = data.demoAccessRequests.find(
      (r) => r.email.toLowerCase() === cleanEmail && (r.status === 'Aguardando aprovação' || r.status === 'Aprovado')
    );

    if (existing && existing.status === 'Aguardando aprovação') {
      return existing;
    }

    const newRequest: DemoAccessRequest = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      planId: 'essencial',
      status: 'Aguardando aprovação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.demoAccessRequests.unshift(newRequest);
    saveDatabase(data);
    return newRequest;
  },

  getAllDemoAccessRequests(): DemoAccessRequest[] {
    const data = loadDatabase();
    return data.demoAccessRequests || [];
  },

  getDemoAccessRequestById(id: string): DemoAccessRequest | undefined {
    const data = loadDatabase();
    return (data.demoAccessRequests || []).find((r) => r.id === id);
  },

  getDemoAccessRequestByToken(token: string): DemoAccessRequest | undefined {
    const data = loadDatabase();
    return (data.demoAccessRequests || []).find((r) => r.inviteToken === token);
  },

  approveDemoAccessRequest(id: string): { request: DemoAccessRequest; inviteToken: string } {
    const data = loadDatabase();
    if (!data.demoAccessRequests) data.demoAccessRequests = [];

    const req = data.demoAccessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Solicitação de demonstração não encontrada');
    }

    const token = crypto.randomBytes(24).toString('hex');
    req.status = 'Aprovado';
    req.reviewedAt = new Date().toISOString();
    req.inviteToken = token;
    req.inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    req.updatedAt = new Date().toISOString();

    // If user already had an active account, re-activate demo
    if (req.userId) {
      const u = data.users.find((user) => user.id === req.userId);
      if (u) {
        u.isDemo = true;
        u.demoStatus = 'active';
        u.activePlanId = 'essencial';
      }
    }

    saveDatabase(data);
    return { request: req, inviteToken: token };
  },

  rejectDemoAccessRequest(id: string, reason?: string): DemoAccessRequest {
    const data = loadDatabase();
    if (!data.demoAccessRequests) data.demoAccessRequests = [];

    const req = data.demoAccessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Solicitação de demonstração não encontrada');
    }

    req.status = 'Recusado';
    req.reviewedAt = new Date().toISOString();
    req.rejectionReason = reason || 'Solicitação de demonstração recusada pelo administrador.';
    req.updatedAt = new Date().toISOString();

    saveDatabase(data);
    return req;
  },

  updateDemoAccessStatus(id: string, status: 'Aprovado' | 'Recusado' | 'Bloqueado' | 'Encerrado'): DemoAccessRequest {
    const data = loadDatabase();
    if (!data.demoAccessRequests) data.demoAccessRequests = [];

    const req = data.demoAccessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Solicitação de demonstração não encontrada');
    }

    req.status = status;
    req.updatedAt = new Date().toISOString();

    if (req.userId) {
      const u = data.users.find((user) => user.id === req.userId);
      if (u) {
        if (status === 'Bloqueado') {
          u.demoStatus = 'blocked';
        } else if (status === 'Encerrado') {
          u.demoStatus = 'expired';
        } else if (status === 'Aprovado') {
          u.demoStatus = 'active';
          u.activePlanId = 'essencial';
        }
      }
    }

    saveDatabase(data);
    return req;
  },

  activateDemoAccessInvite(token: string, password: string): { user: User; request: DemoAccessRequest } {
    const data = loadDatabase();
    if (!data.demoAccessRequests) data.demoAccessRequests = [];

    const req = data.demoAccessRequests.find((r) => r.inviteToken === token);
    if (!req) {
      throw new Error('Convite de demonstração inválido ou não encontrado.');
    }

    if (req.status !== 'Aprovado') {
      throw new Error('Esta demonstração não está aprovada para ativação.');
    }

    if (req.inviteUsedAt) {
      throw new Error('Este convite de demonstração já foi utilizado.');
    }

    if (req.inviteExpiresAt && new Date() > new Date(req.inviteExpiresAt)) {
      throw new Error('O prazo de ativação deste convite expirou (48h). Solicite uma nova liberação.');
    }

    let existingUser = data.users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    if (existingUser) {
      const { hash, salt } = hashPassword(password);
      existingUser.passwordHash = hash;
      existingUser.salt = salt;
      existingUser.activePlanId = 'essencial';
      existingUser.isDemo = true;
      existingUser.demoStatus = 'active';
      existingUser.demoRequestId = req.id;
    } else {
      const { hash, salt } = hashPassword(password);
      const newUser = {
        id: crypto.randomUUID(),
        email: req.email.toLowerCase(),
        name: req.name,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt,
        activePlanId: 'essencial',
        isDemo: true,
        demoStatus: 'active' as const,
        demoRequestId: req.id
      };
      data.users.push(newUser);
      existingUser = newUser;
    }

    req.inviteUsedAt = new Date().toISOString();
    req.activatedAt = new Date().toISOString();
    req.userId = existingUser.id;
    req.updatedAt = new Date().toISOString();

    saveDatabase(data);
    const { passwordHash: _, salt: __, ...safeUser } = existingUser;
    return { user: safeUser, request: req };
  },

  getDemoUsers(): User[] {
    const data = loadDatabase();
    return data.users
      .filter((u) => u.isDemo)
      .map(({ passwordHash: _, salt: __, ...safeUser }) => safeUser);
  },

  toggleUserDemoStatus(userId: string, newStatus: 'active' | 'blocked' | 'expired'): User {
    const data = loadDatabase();
    const user = data.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    user.demoStatus = newStatus;
    if (user.demoRequestId && data.demoAccessRequests) {
      const req = data.demoAccessRequests.find((r) => r.id === user.demoRequestId);
      if (req) {
        if (newStatus === 'active') req.status = 'Aprovado';
        else if (newStatus === 'blocked') req.status = 'Bloqueado';
        else if (newStatus === 'expired') req.status = 'Encerrado';
        req.updatedAt = new Date().toISOString();
      }
    }

    saveDatabase(data);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser;
  }
};


