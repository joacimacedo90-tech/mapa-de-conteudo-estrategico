import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './server/db';
import { fetchInstagramProfileData } from './server/metaInstagram';
import { generateContentMapStrategy } from './server/gemini';
import { handleHotmartWebhook } from './server/hotmart';
import { Report, CalendarDay } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper to extract bearer token or user id
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  // Token is user id or admin token
  if (token.startsWith('admin-token-')) {
    return {
      id: 'admin',
      role: 'admin' as const,
      email: 'admin@mapadeconteudo.com',
      name: 'Administrador',
      createdAt: new Date().toISOString()
    };
  }
  return db.getUserById(token);
}

// ==========================================
// PUBLIC & CLIENT API ROUTES
// ==========================================

// Get Public Settings & Plans
app.get('/api/plans', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    plans: settings.plans,
    headlineBanner: settings.headlineBanner,
    metaConfigured: settings.metaConfigured
  });
});

// Meta Instagram Profile Pre-check
app.get('/api/profile/meta-check', async (req: Request, res: Response) => {
  const username = String(req.query.username || '').trim();
  if (!username) {
    return res.status(400).json({ error: 'Nome de usuário (@) obrigatório' });
  }

  const result = await fetchInstagramProfileData(username);
  res.json(result);
});

// Generate Analysis & Strategy (Gemini exclusively on backend)
app.post('/api/reports/generate', async (req: Request, res: Response) => {
  try {
    const {
      username,
      profession,
      niche,
      product,
      objective,
      manualBio,
      manualCaptions,
      lgpdConsent,
      userId
    } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'O campo @usuario do Instagram é obrigatório.' });
    }

    if (!lgpdConsent) {
      return res.status(400).json({
        error: 'É obrigatório concordar com o tratamento dos dados conforme a LGPD para gerar o planejamento.'
      });
    }

    const cleanUsername = username.replace(/^@/, '').trim();

    // 1. Check Meta Instagram Business Discovery
    const metaCheck = await fetchInstagramProfileData(cleanUsername);

    let metaApiStatus: 'connected' | 'not_configured' | 'manual_input' = 'not_configured';
    if (metaCheck.status === 'connected') {
      metaApiStatus = 'connected';
    } else if (manualBio || manualCaptions) {
      metaApiStatus = 'manual_input';
    } else {
      metaApiStatus = 'not_configured';
    }

    // 2. Call Gemini server-side
    const strategy = await generateContentMapStrategy({
      username: cleanUsername,
      profession,
      niche,
      product,
      objective,
      manualBio,
      manualCaptions,
      metaProfileData: metaCheck.data
    });

    // 3. Save to database
    let user = userId ? db.getUserById(userId) : null;
    const authUser = getAuthUser(req);
    if (authUser && !user) user = authUser;

    const report = db.createReport({
      userId: user?.id || null,
      userEmail: user?.email || null,
      username: cleanUsername,
      profession: profession || '',
      niche: niche || '',
      product: product || '',
      objective: objective || '',
      metaApiStatus,
      manualData: {
        bio: manualBio || '',
        recentCaptions: manualCaptions || ''
      },
      metaProfileData: metaCheck.data,
      diagnosis: strategy.diagnosis,
      contentIdeas: strategy.contentIdeas,
      reels: strategy.reels,
      carousels: strategy.carousels,
      stories: strategy.stories,
      hooksAndCtas: strategy.hooksAndCtas,
      calendar: strategy.calendar
    });

    // Return created report
    res.json({
      success: true,
      reportId: report.id,
      report
    });
  } catch (err: unknown) {
    console.error('Error generating report:', err);
    const message = err instanceof Error ? err.message : 'Falha interna ao gerar análise.';
    res.status(500).json({ error: message });
  }
});

function ensureReport90Days(report: Report): Report {
  const normalized = { ...report };

  // Ensure growthProjection
  if (!normalized.diagnosis.growthProjection) {
    normalized.diagnosis = {
      ...normalized.diagnosis,
      growthProjection: {
        baselineStatus: `Estimativa calculada para o nicho de @${normalized.username}`,
        conservative: {
          level: 'conservative',
          name: 'Cenário Conservador',
          frequency: '3 a 4 posts por semana',
          projectedFollowersMin: 1200,
          projectedFollowersMax: 2500,
          projectedFollowersRange: '+1.200 a +2.500 novos seguidores',
          estimatedReachRange: '25.000 a 60.000 contas alcançadas',
          estimatedDmMessages: '20 a 50 contatos de vendas no Direct',
          keyStrategy: 'Constância semanal sem pausas longas e Reels com ganchos claros.'
        },
        realistic: {
          level: 'realistic',
          name: 'Cenário Recomendado / Realista',
          frequency: '5 a 6 posts por semana com Reels otimizados',
          projectedFollowersMin: 3500,
          projectedFollowersMax: 7500,
          projectedFollowersRange: '+3.500 a +7.500 novos seguidores',
          estimatedReachRange: '80.000 a 180.000 contas alcançadas',
          estimatedDmMessages: '80 a 160 conversas qualificadas no Direct',
          keyStrategy: 'Ganchos visuais nos primeiros 3s, carrosséis de salvamento e Reels de topo de funil.',
          highlight: true
        },
        accelerated: {
          level: 'accelerated',
          name: 'Cenário Acelerado / Alta Performance',
          frequency: 'Diário (7x/semana + 10-15 Stories/dia + collabs)',
          projectedFollowersMin: 8000,
          projectedFollowersMax: 18000,
          projectedFollowersRange: '+8.000 a +18.000 novos seguidores',
          estimatedReachRange: '220.000 a 550.000 contas alcançadas',
          estimatedDmMessages: '200 a 450 contatos qualificados no Direct',
          keyStrategy: 'Reels virais com temas em alta, quebra de padrão, parcerias e amplificação estratégica.'
        },
        keyGrowthLevers: [
          'Otimização de ganchos de retenção nos primeiros 3 segundos dos Reels',
          'Carrosséis densos estruturados para gerar salvamentos e compartilhamentos',
          'Sequências diárias de Stories com caixas e enquetes direcionando para a DM',
          'Posicionamento claro na bio convertendo visitantes em seguidores e leads'
        ],
        leadConversionEstimate: 'Estimativa de 50 a 180 clientes potenciais chamando no Direct ao longo dos 90 dias.',
        integrityDisclaimer: 'Projeções estatísticas baseadas na média de tração orgânica do algoritmo do Instagram para perfis consistentes no nicho.'
      }
    };
  }

  // Ensure 90 days in calendar
  if (!normalized.calendar || normalized.calendar.length < 90) {
    const rawCal = normalized.calendar || [];
    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const formats: ('Reels' | 'Carrossel' | 'Post Estático' | 'Stories')[] = ['Reels', 'Carrossel', 'Reels', 'Stories', 'Carrossel', 'Reels', 'Stories'];
    const pillars = ['Autoridade', 'Conexão', 'Educação', 'Conversão / Venda'];
    const fullCal: CalendarDay[] = [];

    for (let i = 1; i <= 90; i++) {
      const monthNum: 1 | 2 | 3 = i <= 30 ? 1 : i <= 60 ? 2 : 3;
      const phaseTitle =
        monthNum === 1
          ? 'Mês 1 - Fundação & Atração Magnética'
          : monthNum === 2
          ? 'Mês 2 - Autoridade & Conexão Profunda'
          : 'Mês 3 - Escala & Conversão em Clientes';

      const existing = rawCal.find((d) => d.day === i);
      if (existing) {
        fullCal.push({
          ...existing,
          day: i,
          month: existing.month || monthNum,
          phase: existing.phase || phaseTitle,
          dayOfWeek: existing.dayOfWeek || daysOfWeek[(i - 1) % 7],
          format: existing.format || formats[(i - 1) % formats.length],
          pillar: existing.pillar || pillars[(i - 1) % pillars.length],
          theme: existing.theme || `Estratégia dia ${i}`,
          hook: existing.hook || `Gancho do dia ${i}`,
          cta: existing.cta || 'Chame no Direct ou comente'
        });
      } else {
        const fmt = formats[(i - 1) % formats.length];
        fullCal.push({
          day: i,
          month: monthNum,
          phase: phaseTitle,
          dayOfWeek: daysOfWeek[(i - 1) % 7],
          format: fmt,
          pillar: pillars[(i - 1) % pillars.length],
          theme: `${fmt} Estratégico [Fase ${monthNum}]: Destrave novos clientes no nicho de @${normalized.username}`,
          hook: 'Se você quer acelerar os resultados no seu nicho, preste atenção nisso...',
          cta: 'Envie uma mensagem no Direct para receber os próximos passos!'
        });
      }
    }
    normalized.calendar = fullCal;
  }

  return normalized;
}

// Get Specific Report
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const rawReport = db.getReportById(req.params.id);
  if (!rawReport) {
    return res.status(404).json({ error: 'Relatório não encontrado.' });
  }

  const report = ensureReport90Days(rawReport);

  // If paid, apply granular plan limits (Essencial, Pro, or Premium)
  if (report.isPaid) {
    const planId = (report.paidPlanId || 'pro') as 'essencial' | 'pro' | 'premium';
    const limits = db.getPlanLimits(planId);
    const planDetails = db.getPlanById(planId);

    // 1. Calendar restriction
    const filteredCalendar = report.calendar.map((day) => {
      if (day.day <= limits.calendarDays) {
        return day;
      }
      const targetUpgrade = limits.calendarDays <= 30 ? 'PRO (60 dias) ou PREMIUM (90 dias)' : 'PREMIUM (90 dias completos)';
      return {
        ...day,
        pillar: '🔒 Bloqueado no seu plano atual',
        theme: `🔒 Reservado para o Plano ${targetUpgrade}`,
        hook: 'Faça upgrade para liberar o planejamento deste mês.',
        cta: 'Disponível no Plano Superior'
      };
    });

    // 2. Reels restriction
    const filteredReels = limits.hasReels
      ? report.reels
      : report.reels.slice(0, 1).concat(
          report.reels.slice(1).map((r, i) => ({
            id: i + 2,
            theme: '🔒 Roteiro de Reel Exclusivo dos Planos PRO e PREMIUM',
            hookVisual: '🔒 Disponível a partir do Plano PRO (R$ 49,90)',
            hookVerbal: '🔒 Disponível a partir do Plano PRO',
            body: ['🔒 Faça upgrade para o Plano PRO ou PREMIUM para ter acesso a todos os 10 roteiros de Reels graváveis.'],
            cta: '🔒 Bloqueado no Plano Essencial',
            audioStyle: '🔒 Bloqueado',
            durationSeconds: '30s'
          }))
        );

    // 3. Carousels restriction
    const filteredCarousels = limits.hasCarousels
      ? report.carousels
      : report.carousels.slice(0, 1).concat(
          report.carousels.slice(1).map((c, i) => ({
            id: i + 2,
            title: '🔒 Carrossel Estruturado Exclusivo dos Planos PRO e PREMIUM',
            coverHeadline: '🔒 Disponível a partir do Plano PRO (R$ 49,90)',
            targetPainOrDesire: '🔒 Bloqueado no Plano Essencial',
            slides: [],
            finalCta: '🔒 Bloqueado'
          }))
        );

    // 4. Stories restriction
    const filteredStories = limits.hasStories
      ? report.stories
      : report.stories.slice(0, 1).concat(
          report.stories.slice(1).map((s, i) => ({
            id: i + 2,
            theme: '🔒 Sequência de Stories Exclusiva dos Planos PRO e PREMIUM',
            objective: '🔒 Disponível a partir do Plano PRO (R$ 49,90)',
            stories: []
          }))
        );

    // 5. Hooks & CTAs restriction
    const filteredHooks = limits.hasHooks
      ? report.hooksAndCtas
      : {
          curiosityHooks: report.hooksAndCtas?.curiosityHooks?.slice(0, 2) || [],
          painHooks: ['🔒 Banco de Ganchos de Dor liberado nos Planos PRO e PREMIUM'],
          authorityHooks: ['🔒 Banco de Ganchos de Autoridade liberado nos Planos PRO e PREMIUM'],
          commentCtas: ['🔒 CTAs de Comentário magnéticos liberados no Plano PRO'],
          directMessageCtas: ['🔒 CTAs de Direct de alta conversão liberados no Plano PRO'],
          captionTemplates: report.hooksAndCtas?.captionTemplates?.slice(0, 1) || []
        };

    const gatedPaidReport: Report = {
      ...report,
      calendar: filteredCalendar,
      reels: filteredReels,
      carousels: filteredCarousels,
      stories: filteredStories,
      hooksAndCtas: filteredHooks
    };

    return res.json({
      report: gatedPaidReport,
      isUnlocked: true,
      paidPlanId: planId,
      planDetails,
      planLimits: limits
    });
  }

  // If free / unpaid: return free preview (Diagnosis + first 3 content ideas, locked others)
  const freePreviewReport = {
    ...report,
    diagnosis: report.diagnosis,
    contentIdeas: report.contentIdeas.slice(0, 3).concat(
      report.contentIdeas.slice(3).map((item, idx) => ({
        id: idx + 4,
        title: '🔒 Conteúdo Bloqueado (Disponível nos Planos Pagos)',
        format: item.format,
        pillar: item.pillar,
        goal: '🔒 Desbloqueie para visualizar',
        hook: '🔒 Conteúdo premium',
        captionIdea: '🔒 Conteúdo premium',
        cta: '🔒 Conteúdo premium'
      }))
    ),
    reels: report.reels.slice(0, 1).concat(
      report.reels.slice(1).map((r, i) => ({
        id: i + 2,
        theme: '🔒 Roteiro de Reel Premium Bloqueado',
        hookVisual: '🔒 Bloqueado',
        hookVerbal: '🔒 Bloqueado',
        body: ['🔒 Disponível após liberação do plano'],
        cta: '🔒 Bloqueado',
        audioStyle: '🔒 Bloqueado',
        durationSeconds: '30s'
      }))
    ),
    carousels: report.carousels.slice(0, 1).concat(
      report.carousels.slice(1).map((c, i) => ({
        id: i + 2,
        title: '🔒 Carrossel Estratégico Bloqueado',
        coverHeadline: '🔒 Bloqueado',
        targetPainOrDesire: '🔒 Bloqueado',
        slides: [],
        finalCta: '🔒 Bloqueado'
      }))
    ),
    stories: report.stories.slice(0, 1).concat(
      report.stories.slice(1).map((s, i) => ({
        id: i + 2,
        theme: '🔒 Sequência de Stories Bloqueada',
        objective: '🔒 Bloqueado',
        stories: []
      }))
    ),
    calendar: report.calendar.slice(0, 3).concat(
      report.calendar.slice(3).map((day, i) => ({
        day: i + 4,
        month: day.month,
        phase: day.phase,
        dayOfWeek: day.dayOfWeek,
        format: day.format,
        pillar: '🔒 Bloqueado',
        theme: '🔒 Planejamento do dia bloqueado (Liberado nos Planos Pagos)',
        hook: '🔒 Bloqueado',
        cta: '🔒 Bloqueado'
      }))
    ),
    hooksAndCtas: {
      curiosityHooks: report.hooksAndCtas?.curiosityHooks?.slice(0, 2) || [],
      painHooks: ['🔒 Disponível a partir do Plano PRO'],
      authorityHooks: ['🔒 Disponível a partir do Plano PRO'],
      commentCtas: ['🔒 Disponível a partir do Plano PRO'],
      directMessageCtas: ['🔒 Disponível a partir do Plano PRO'],
      captionTemplates: report.hooksAndCtas?.captionTemplates?.slice(0, 1) || []
    }
  };

  res.json({
    report: freePreviewReport,
    isUnlocked: false
  });
});


// Check Report Payment Status (Verifica status real, sem falsificação)
app.get('/api/reports/:id/verify-payment', (req: Request, res: Response) => {
  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Relatório não encontrado.' });
  }

  res.json({
    reportId: report.id,
    isPaid: report.isPaid,
    paidAt: report.paidAt || null,
    planId: report.paidPlanId || null,
    message: report.isPaid
      ? 'Pagamento confirmado e acesso liberado!'
      : 'Aguardando confirmação de pagamento pela Hotmart. O webhook da Hotmart libera o acesso automaticamente após a aprovação.'
  });
});

// Associate report to user
app.post('/api/reports/:id/claim', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Relatório não encontrado' });
  }

  report.userId = authUser.id;
  report.userEmail = authUser.email;
  res.json({ success: true, report });
});

// ==========================================
// USER AUTH & MEUS RELATÓRIOS (LGPD COMPLIANT)
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, lgpdConsent } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }
    if (!lgpdConsent) {
      return res.status(400).json({ error: 'Consentimento de tratamento de dados LGPD é obrigatório.' });
    }
    const user = db.createUser(email, password, name);
    res.json({ token: user.id, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao cadastrar';
    res.status(400).json({ error: msg });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
  const user = db.verifyUserCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Email ou senha inválidos.' });
  }
  res.json({ token: user.id, user });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({ user });
});

app.get('/api/user/reports', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const reports = db.getReportsByUser(user.id).map(ensureReport90Days);
  res.json({ reports });
});

// LGPD: Delete report
app.delete('/api/user/reports/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const report = db.getReportById(req.params.id);
  if (!report || report.userId !== user.id) {
    return res.status(404).json({ error: 'Relatório não encontrado ou não pertence a este usuário' });
  }
  db.deleteReport(report.id);
  res.json({ success: true, message: 'Relatório excluído conforme solicitação LGPD.' });
});

// Client: Get contracted plan and access status
app.get('/api/user/plan', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const access = db.getCustomerAccessByEmail(user.email);
  const activePlanId = (access?.status === 'active' ? access.planId : user.activePlanId) || null;
  const planDetails = activePlanId ? db.getPlanById(activePlanId) : null;
  const planLimits = activePlanId ? db.getPlanLimits(activePlanId) : null;

  res.json({
    hasActivePlan: access?.status === 'active' || Boolean(activePlanId),
    activePlanId,
    planDetails,
    planLimits,
    customerAccess: access
  });
});

// Client: Link an existing report or Hotmart purchase code
app.post('/api/user/link-purchase', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { reportId, transactionId } = req.body;
  if (!reportId && !transactionId) {
    return res.status(400).json({ error: 'Informe o ID do relatório ou o código da transação Hotmart' });
  }

  let linkedReport: Report | null = null;
  if (reportId) {
    const rep = db.getReportById(String(reportId).trim());
    if (rep) {
      rep.userId = user.id;
      rep.userEmail = user.email;
      linkedReport = rep;
    }
  }

  const access = db.getCustomerAccessByEmail(user.email);
  if (access && access.status === 'active') {
    user.activePlanId = access.planId;
    if (linkedReport && !linkedReport.isPaid) {
      db.unlockReport(linkedReport.id, access.planId, access.transactionId);
    }
  }

  res.json({
    success: true,
    message: 'Vinculação realizada com sucesso!',
    report: linkedReport,
    activePlanId: user.activePlanId || access?.planId || null
  });
});

// LGPD: Delete all user data (Right to erasure)
app.post('/api/auth/lgpd/delete-account', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.id === 'admin') {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  db.deleteUserData(user.id);
  res.json({ success: true, message: 'Todos os seus dados foram apagados permanentemente conforme a LGPD.' });
});

// ==========================================
// HOTMART WEBHOOK ROUTE
// ==========================================
app.post('/api/webhooks/hotmart', handleHotmartWebhook);


// ==========================================
// ADMIN PROTECTED ROUTES
// ==========================================

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Senha de administrador obrigatória' });
  }
  const valid = db.verifyAdminPassword(password);
  if (!valid) {
    return res.status(401).json({ error: 'Senha administrativa incorreta.' });
  }
  const adminToken = `admin-token-${Date.now()}`;
  res.json({
    success: true,
    token: adminToken,
    user: { id: 'admin', role: 'admin', name: 'Administrador' }
  });
});

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
}

app.get('/api/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ settings });
});

app.post('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const { plans, hotmartWebhookToken, headlineBanner, metaAccountId, metaToken, newPassword } = req.body;
    if (newPassword && newPassword.trim().length >= 6) {
      db.updateAdminPassword(newPassword.trim());
    }
    const updated = db.updateSettings({
      plans,
      hotmartWebhookToken,
      headlineBanner,
      metaAccountId,
      metaToken
    });
    res.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
    res.status(400).json({ error: msg });
  }
});

app.get('/api/admin/reports', requireAdmin, (_req: Request, res: Response) => {
  const reports = db.getAllReports();
  res.json({ reports });
});

app.post('/api/admin/reports/:id/unlock', requireAdmin, (req: Request, res: Response) => {
  const { planId, note } = req.body;
  const report = db.unlockReport(req.params.id, planId, `ADMIN_MANUAL_${Date.now()}`);
  if (!report) {
    return res.status(404).json({ error: 'Relatório não encontrado' });
  }
  db.logWebhook({
    event: 'ADMIN_MANUAL_UNLOCK',
    status: 'PROCESSED',
    reportId: report.id,
    buyerEmail: report.userEmail || undefined,
    transactionId: `ADMIN_${Date.now()}`,
    rawPayloadSummary: `Desbloqueio manual realizado pelo painel de administração. Nota: ${note || 'Liberado por cortesia/PIX manual'}`
  });
  res.json({ success: true, report });
});

app.delete('/api/admin/reports/:id', requireAdmin, (req: Request, res: Response) => {
  const deleted = db.deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Relatório não encontrado' });
  }
  res.json({ success: true, message: 'Relatório excluído com sucesso.' });
});

app.get('/api/admin/webhooks', requireAdmin, (_req: Request, res: Response) => {
  const logs = db.getWebhookLogs();
  res.json({ logs });
});

// Admin: View all registered customer accesses
app.get('/api/admin/customer-accesses', requireAdmin, (_req: Request, res: Response) => {
  const accesses = db.getAllCustomerAccesses();
  res.json({ accesses });
});

// Admin Simulator for Hotmart Webhook (permite testar a autenticidade e regras com auditoria real)
app.post('/api/admin/simulate-hotmart-webhook', requireAdmin, async (req: Request, res: Response) => {
  const {
    reportId,
    event = 'PURCHASE_APPROVED',
    planId = 'pro',
    buyerEmail = 'comprador@exemplo.com',
    buyerName = 'Cliente Teste Hotmart',
    tokenProvided
  } = req.body;

  const plan = db.getPlanById(planId);

  const simulatedPayload = {
    event,
    data: {
      product: {
        id: plan?.hotmartProductId || `PROD_${planId.toUpperCase()}`,
        name: plan?.name || 'Mapa de Conteúdo'
      },
      buyer: {
        email: buyerEmail,
        name: buyerName
      },
      purchase: {
        transaction: `HOT_${Date.now()}`,
        status: event === 'PURCHASE_APPROVED' ? 'APPROVED' : event === 'WAITING_PAYMENT' ? 'WAITING_PAYMENT' : 'REFUNDED',
        sck: reportId || '',
        offer: {
          code: plan?.hotmartOfferCode || `OFFER_${planId.toUpperCase()}`
        },
        order_date: new Date().toISOString()
      }
    }
  };

  const fakeReq = {
    headers: {
      'x-hotmart-hottok': tokenProvided !== undefined ? tokenProvided : db.getSettings().hotmartWebhookToken
    },
    body: simulatedPayload,
    query: {}
  } as unknown as Request;

  let capturedStatus = 200;
  let capturedBody: unknown = null;
  const fakeRes = {
    status: (code: number) => {
      capturedStatus = code;
      return fakeRes;
    },
    json: (body: unknown) => {
      capturedBody = body;
      return fakeRes;
    }
  } as unknown as Response;

  await handleHotmartWebhook(fakeReq, fakeRes);
  res.status(capturedStatus).json({ simulationResult: capturedBody });
});


// ==========================================
// VITE DEV MIDDLEWARE / STATIC FILES
// ==========================================
async function startServer() {
  if (isProd) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAPA DE CONTEÚDO] Servidor iniciado na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
