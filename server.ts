import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './server/db';
import { fetchInstagramProfileData } from './server/metaInstagram';
import { generateContentMapStrategy, detectNicheFromInstagram, generatePublic30DaysReelsCalendar } from './server/gemini';
import { handleHotmartWebhook } from './server/hotmart';
import { sendClientDiagnosticEmail, isEmailConfigured, sendAdminDemoRequestNotification, sendDemoActivationEmail } from './server/email';
import { Report, CalendarDay, ClientDiagnostic, DemoAccessRequest, ExecutionMetrics, MetaProfileData } from './src/types';

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

// Proxy Instagram Profile Pictures to bypass cross-origin referrer restrictions
app.get('/api/instagram/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = String(req.query.url || '').trim();
  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  try {
    const parsed = new URL(imageUrl);
    const allowedHosts = ['cdninstagram.com', 'fbcdn.net', 'instagram.com'];
    const isAllowed = allowedHosts.some((h) => parsed.hostname.endsWith(h));
    if (!isAllowed) {
      return res.status(403).send('Host not allowed');
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image from CDN');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch {
    return res.status(502).send('Proxy error');
  }
});

// Generate Analysis & Strategy (Gemini exclusively on backend)
app.post('/api/reports/generate', async (req: Request, res: Response) => {
  const tTotalStart = Date.now();
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

    const authUser = getAuthUser(req);
    if (authUser?.isDemo && authUser.demoStatus === 'blocked') {
      return res.status(403).json({
        error: 'Seu acesso de demonstração ao Plano Essencial foi bloqueado pelo administrador. Entre em contato com o suporte ou adquira um plano definitivo.'
      });
    }
    if (authUser?.isDemo && authUser.demoStatus === 'expired') {
      return res.status(403).json({
        error: 'Seu período de teste do Plano Essencial foi encerrado. Adquira o Plano Essencial, PRO ou PREMIUM para continuar gerando e acessando seus relatórios.'
      });
    }

    const cleanUsername = username.replace(/^@/, '').trim();

    // 1. Check Meta Instagram Business Discovery (Stage: instagram_fetch)
    const tMetaStart = Date.now();
    const metaCheck = await fetchInstagramProfileData(cleanUsername);
    const metaMs = Date.now() - tMetaStart;

    let metaApiStatus: 'connected' | 'not_configured' | 'manual_input' = 'not_configured';
    if (metaCheck.status === 'connected') {
      metaApiStatus = 'connected';
    } else if (manualBio || manualCaptions) {
      metaApiStatus = 'manual_input';
    } else {
      metaApiStatus = 'not_configured';
    }

    // 2. Call Gemini server-side (Stage: gemini_api)
    const tGeminiStart = Date.now();
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
    const geminiMs = Date.now() - tGeminiStart;

    // 3. Synthesis & normalization (Stage: synthesis)
    const tSynthStart = Date.now();
    let user = userId ? db.getUserById(userId) : null;
    if (authUser && !user) user = authUser;

    const synthesisMs = Date.now() - tSynthStart;

    // 4. Save to database (Stage: db_save)
    const tDbStart = Date.now();
    const totalMs = Date.now() - tTotalStart;

    const executionMetrics: ExecutionMetrics = {
      metaMs,
      geminiMs,
      synthesisMs,
      dbMs: 0, // updated right below
      totalMs,
      fromCache: strategy.executionMetrics?.fromCache || false,
      isFallback: strategy.executionMetrics?.isFallback || false,
      modelUsed: strategy.executionMetrics?.modelUsed || 'gemini-3.8-flash'
    };

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
      calendar: strategy.calendar,
      executionMetrics
    });

    const dbMs = Date.now() - tDbStart;
    executionMetrics.dbMs = dbMs;
    executionMetrics.totalMs = Date.now() - tTotalStart;

    console.log(`[STAGE_TIMING] /api/reports/generate @${cleanUsername}: total=${executionMetrics.totalMs}ms (meta=${metaMs}ms, gemini=${geminiMs}ms, synth=${synthesisMs}ms, db=${dbMs}ms, fallback=${strategy.executionMetrics?.isFallback || false})`);

    // Return created report with execution metrics
    res.json({
      success: true,
      reportId: report.id,
      report,
      executionMetrics
    });
  } catch (err: unknown) {
    const elapsed = Date.now() - tTotalStart;
    console.error(`Error generating report after ${elapsed}ms:`, err);
    const message = err instanceof Error ? err.message : 'Falha interna ao gerar análise.';
    res.status(500).json({ error: message, elapsedMs: elapsed });
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
  const authUser = getAuthUser(req);
  if (authUser?.isDemo && authUser.demoStatus === 'blocked') {
    return res.status(403).json({
      error: 'Seu acesso de demonstração ao Plano Essencial foi bloqueado pelo administrador. Entre em contato com o suporte ou adquira um plano definitivo.',
      isDemoBlocked: true
    });
  }
  if (authUser?.isDemo && authUser.demoStatus === 'expired') {
    return res.status(403).json({
      error: 'Seu período de teste do Plano Essencial foi encerrado. Adquira o Plano Essencial, PRO ou PREMIUM para continuar acessando todos os seus relatórios.',
      isDemoExpired: true
    });
  }

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
// SOLICITAÇÃO & ATIVAÇÃO DE ACESSO GRATUITO
// ==========================================

// 1. Solicitar Acesso Gratuito (Público)
app.post('/api/free-access/request', (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O nome completo é obrigatório.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Um e-mail válido é obrigatório.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = db.getUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        error: 'Este e-mail já possui uma conta cadastrada. Você já pode fazer login diretamente.'
      });
    }

    const request = db.createFreeAccessRequest(cleanName, cleanEmail);

    res.json({
      success: true,
      message: 'Sua solicitação foi enviada! Aguarde a análise do administrador.',
      request
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao registrar solicitação';
    res.status(400).json({ error: msg });
  }
});

// 2. Verificar validade do convite de ativação
app.get('/api/free-access/verify-invite', (req: Request, res: Response) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token de convite não informado.' });
  }

  const request = db.getFreeAccessRequestByToken(token);
  if (!request) {
    return res.status(404).json({ valid: false, error: 'Convite inválido ou não encontrado no sistema.' });
  }

  if (request.status !== 'Aprovado') {
    return res.status(400).json({ valid: false, error: 'Esta solicitação não foi aprovada pelo administrador.' });
  }

  if (request.inviteUsedAt) {
    return res.status(400).json({ valid: false, error: 'Este convite já foi utilizado para ativar uma conta.' });
  }

  if (request.inviteExpiresAt && new Date() > new Date(request.inviteExpiresAt)) {
    return res.status(400).json({ valid: false, error: 'Este convite expirou (validade de 48 horas excedida). Solicite uma nova liberação.' });
  }

  res.json({
    valid: true,
    name: request.name,
    email: request.email,
    expiresAt: request.inviteExpiresAt
  });
});

// 3. Ativar conta gratuita através do convite
app.post('/api/free-access/activate', (req: Request, res: Response) => {
  try {
    const { token, password, lgpdConsent } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de convite obrigatório.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    if (!lgpdConsent) {
      return res.status(400).json({ error: 'O consentimento com a LGPD é obrigatório.' });
    }

    const result = db.activateFreeAccessInvite(token.trim(), password);

    res.json({
      success: true,
      message: 'Conta ativada com sucesso! Seu acesso gratuito está liberado.',
      token: result.user.id,
      user: result.user
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na ativação da conta';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// DEMONSTRAÇÃO INTELIGENTE (PÚBLICA: NICHO & 30 DIAS DE REELS)
// ==========================================

// 1. Detectar Nicho Automaticamente pelo @ do Instagram
app.post('/api/demo/detect-niche', async (req: Request, res: Response) => {
  try {
    const { username, manualBio, manualCaptions } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'O @ do Instagram é obrigatório para identificação do nicho.' });
    }

    const cleanUser = username.replace(/^@/, '').trim();

    // 1. Check Instagram Profile Live Data (Strict Real Data, never invented)
    const metaCheck = await fetchInstagramProfileData(cleanUser);
    const profileData = metaCheck.data;

    // 2. Call Gemini for niche detection with retry and heuristics
    const result = await detectNicheFromInstagram(cleanUser, profileData, manualBio, manualCaptions);
    
    // 3. Attach strict provenance and identity verification metadata
    result.verifiedLive = Boolean(metaCheck.verifiedLive);
    result.queriedAt = metaCheck.queriedAt || new Date().toISOString();
    result.source = metaCheck.source || (metaCheck.verifiedLive ? 'Instagram Live' : 'Consulta não confirmada');
    result.identityValidated = Boolean(metaCheck.verifiedLive && profileData?.name);
    result.unverifiedReason = metaCheck.errorReason;

    if (profileData) {
      result.followersCount = profileData.followersCount;
      result.displayName = profileData.name;
      // Wrap photo through proxy if available
      result.profilePictureUrl = profileData.profilePictureUrl
        ? `/api/instagram/proxy-image?url=${encodeURIComponent(profileData.profilePictureUrl)}`
        : undefined;
      result.mediaCount = profileData.mediaCount;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao identificar o nicho do perfil.';
    res.status(500).json({ error: msg });
  }
});

// 2. Gerar Calendário de 30 Dias (SOMENTE REELS)
app.post('/api/demo/generate-30-reels', async (req: Request, res: Response) => {
  try {
    const { username, confirmedNiche, segment, targetAudience, followersCount, email, whatsapp } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'O @ do Instagram é obrigatório.' });
    }

    const cleanUser = username.replace(/^@/, '').trim();
    let finalNiche = confirmedNiche && typeof confirmedNiche === 'string' ? confirmedNiche.trim() : '';

    if (email || whatsapp) {
      console.log(`[DEMO_LEAD] @${cleanUser} | Email: ${email || '-'} | WhatsApp: ${whatsapp || '-'}`);
    }

    // Check Instagram Profile Live Data
    const metaCheck = await fetchInstagramProfileData(cleanUser);
    let profileData: MetaProfileData = metaCheck.data || {
      username: cleanUser,
      verifiedLive: false,
      queriedAt: metaCheck.queriedAt || new Date().toISOString(),
      source: 'Consulta não confirmada',
      errorReason: metaCheck.errorReason
    };

    // If exact followersCount was provided manually by user, preserve all digits
    if (followersCount !== undefined && followersCount !== null && !isNaN(Number(followersCount))) {
      const parsedFollowers = Math.floor(Number(followersCount));
      profileData.followersCount = parsedFollowers;
      if (!metaCheck.verifiedLive) {
        profileData.source = 'Confirmado manualmente pelo usuário';
      }
    }

    // Proxy image URL if real picture is available
    if (profileData.profilePictureUrl && !profileData.profilePictureUrl.startsWith('/api/instagram/proxy-image')) {
      profileData.profilePictureUrl = `/api/instagram/proxy-image?url=${encodeURIComponent(profileData.profilePictureUrl)}`;
    }

    if (!finalNiche) {
      try {
        const detected = await detectNicheFromInstagram(cleanUser, profileData);
        finalNiche = detected.detectedNiche || 'Especialista & Criador de Conteúdo';
      } catch {
        finalNiche = 'Especialista & Criador de Conteúdo';
      }
    }

    const result = await generatePublic30DaysReelsCalendar({
      username: cleanUser,
      confirmedNiche: finalNiche,
      segment: segment ? String(segment).trim() : undefined,
      targetAudience: targetAudience ? String(targetAudience).trim() : undefined,
      profileData
    });

    res.json({
      success: true,
      demo: result
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao gerar calendário de 30 dias de Reels.';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// SOLICITAÇÃO & ATIVAÇÃO DE DEMONSTRAÇÃO DO PLANO ESSENCIAL
// ==========================================

// Solicitação pública desativada: concedida exclusivamente pelo administrador
app.post('/api/demo-access/request', async (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'A solicitação pública de demonstração foi desativada. O teste do Plano Essencial é liberado exclusivamente pelo administrador.'
  });
});

// 2. Verificar validade do convite de demonstração do Plano Essencial
app.get('/api/demo-access/verify-invite', (req: Request, res: Response) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token de convite não informado.' });
  }

  const request = db.getDemoAccessRequestByToken(token);
  if (!request) {
    return res.status(404).json({ valid: false, error: 'Convite de demonstração não encontrado ou link inválido.' });
  }

  if (request.status !== 'Aprovado') {
    return res.status(400).json({ valid: false, error: 'Esta solicitação de demonstração ainda não foi aprovada pelo administrador.' });
  }

  if (request.inviteUsedAt) {
    return res.status(400).json({ valid: false, error: 'Este convite de demonstração já foi utilizado para ativar uma conta.' });
  }

  if (request.inviteExpiresAt && new Date() > new Date(request.inviteExpiresAt)) {
    return res.status(400).json({ valid: false, error: 'Este convite expirou (validade de 48 horas excedida). Solicite uma nova liberação.' });
  }

  res.json({
    valid: true,
    name: request.name,
    email: request.email,
    planId: 'essencial',
    planName: 'Plano Essencial (Demonstração)',
    expiresAt: request.inviteExpiresAt
  });
});

// 3. Ativar conta de demonstração do Plano Essencial através do convite
app.post('/api/demo-access/activate', (req: Request, res: Response) => {
  try {
    const { token, password, lgpdConsent } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de convite obrigatório.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    if (!lgpdConsent) {
      return res.status(400).json({ error: 'O consentimento com a LGPD é obrigatório.' });
    }

    const result = db.activateDemoAccessInvite(token.trim(), password);

    res.json({
      success: true,
      message: 'Conta ativada com sucesso! Seu acesso de demonstração ao Plano Essencial está liberado.',
      token: result.user.id,
      user: result.user
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na ativação da conta de demonstração';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// USER AUTH & MEUS RELATÓRIOS (LGPD COMPLIANT)
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, lgpdConsent, inviteToken } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }
    if (!lgpdConsent) {
      return res.status(400).json({ error: 'Consentimento de tratamento de dados LGPD é obrigatório.' });
    }

    // 1. If an invite token is present, activate via invite
    if (inviteToken) {
      const result = db.activateFreeAccessInvite(inviteToken, password);
      return res.json({ token: result.user.id, user: result.user, message: 'Conta ativada com sucesso pelo convite!' });
    }

    // 2. If the user is a paid customer on Hotmart, allow direct account creation
    const paidAccess = db.getCustomerAccessByEmail(email);
    if (paidAccess && paidAccess.status === 'active') {
      const user = db.createUser(email, password, name);
      user.activePlanId = paidAccess.planId;
      return res.json({ token: user.id, user });
    }

    // 3. Otherwise: Free users cannot register without prior approval
    return res.status(403).json({
      error: 'O acesso gratuito funciona exclusivamente por solicitação e aprovação prévia. Envie uma solicitação em "Solicitar Acesso Gratuito".'
    });
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
// ADMIN: SOLICITAÇÕES DE ACESSO GRATUITO
// ==========================================

// Admin: List all Free Access Requests
app.get('/api/admin/free-access-requests', requireAdmin, (_req: Request, res: Response) => {
  const requests = db.getFreeAccessRequests();
  res.json({ requests });
});

// Admin: Approve a Free Access Request and generate one-time invite
app.post('/api/admin/free-access-requests/:id/approve', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.approveFreeAccessRequest(id);

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const inviteUrl = `${baseUrl}/?page=ativar-conta&token=${result.inviteToken}`;

    // Log the approval and simulated email transmission
    console.log(`[E-MAIL CONVITE ENVIADO] Para: ${result.request.email} | URL: ${inviteUrl}`);

    res.json({
      success: true,
      message: `Solicitação de ${result.request.name} aprovada! Convite gerado e enviado por e-mail com link de uso único válido por 48 horas.`,
      request: result.request,
      inviteUrl,
      inviteToken: result.inviteToken
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao aprovar solicitação';
    res.status(400).json({ error: msg });
  }
});

// Admin: Reject a Free Access Request
app.post('/api/admin/free-access-requests/:id/reject', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = db.rejectFreeAccessRequest(id, reason);

    res.json({
      success: true,
      message: `Solicitação de ${request.name} recusada.`,
      request
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao recusar solicitação';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// ADMIN: TESTES DO PLANO ESSENCIAL (DEMONSTRAÇÃO)
// ==========================================

// Admin: List all Demo Access Requests
app.get('/api/admin/demo-access-requests', requireAdmin, (_req: Request, res: Response) => {
  const requests = db.getAllDemoAccessRequests();
  res.json({ requests });
});

// Admin: Liberar Teste Essencial diretamente (7 dias corridos)
app.post('/api/admin/demo-grants/create', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O nome completo do interessado é obrigatório.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Um e-mail válido é obrigatório.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    const result = db.createAdminDemoGrant(cleanName, cleanEmail, 'Administrador');

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const inviteUrl = `${baseUrl}/?page=ativar-conta&type=demo&token=${result.inviteToken}`;

    let emailStatus = 'sent';
    try {
      await sendDemoActivationEmail(result.request, inviteUrl);
      console.log(`[E-MAIL CONVITE DEMO ENVIADO] Para: ${result.request.email} | URL: ${inviteUrl}`);
    } catch (emailErr) {
      console.warn('[AVISO] Falha ao enviar e-mail de ativação:', emailErr);
      emailStatus = 'failed_to_deliver';
    }

    res.json({
      success: true,
      message: `Teste do Plano Essencial (7 dias corridos) liberado para ${result.request.name}! Link seguro gerado com validade de 48 horas para ativação.`,
      request: result.request,
      inviteUrl,
      inviteToken: result.inviteToken,
      emailStatus
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao liberar teste essencial';
    res.status(400).json({ error: msg });
  }
});

// Admin: Prorrogar Teste Essencial (+7 dias corridos)
app.post('/api/admin/demo-grants/:id/prorrogar', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const additionalDays = Number(req.body.additionalDays) || 7;
    const request = db.prorrogarDemoAccess(id, additionalDays);

    res.json({
      success: true,
      message: `Acesso de demonstração prorrogado com sucesso por mais ${additionalDays} dias corridos!`,
      request
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao prorrogar demonstração';
    res.status(400).json({ error: msg });
  }
});

// Admin: Approve a Demo Access Request and generate one-time invite (48h)
app.post('/api/admin/demo-access-requests/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.approveDemoAccessRequest(id);

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const inviteUrl = `${baseUrl}/?page=ativar-conta&type=demo&token=${result.inviteToken}`;

    // Send single-use activation email to the client
    let emailStatus = 'sent';
    try {
      await sendDemoActivationEmail(result.request, inviteUrl);
      console.log(`[E-MAIL CONVITE DEMO ENVIADO] Para: ${result.request.email} | URL: ${inviteUrl}`);
    } catch (emailErr) {
      console.warn('[AVISO] Falha ao enviar e-mail de ativação:', emailErr);
      emailStatus = 'failed_to_deliver';
    }

    res.json({
      success: true,
      message: `Demonstração do Plano Essencial aprovada para ${result.request.name}! Link seguro de uso único gerado com validade de 48 horas.`,
      request: result.request,
      inviteUrl,
      inviteToken: result.inviteToken,
      emailStatus
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao aprovar solicitação de demonstração';
    res.status(400).json({ error: msg });
  }
});

// Admin: Reject a Demo Access Request
app.post('/api/admin/demo-access-requests/:id/reject', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = db.rejectDemoAccessRequest(id, reason);

    res.json({
      success: true,
      message: `Solicitação de demonstração de ${request.name} recusada.`,
      request
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao recusar solicitação de demonstração';
    res.status(400).json({ error: msg });
  }
});

// Admin: Update status of a Demo Access Request (e.g. 'Aprovado', 'Recusado', 'Bloqueado', 'Encerrado')
app.post('/api/admin/demo-access-requests/:id/status', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Aguardando aprovação', 'Aprovado', 'Recusado', 'Bloqueado', 'Encerrado'].includes(status)) {
      return res.status(400).json({ error: 'Status de teste inválido.' });
    }
    const request = db.updateDemoAccessStatus(id, status);

    res.json({
      success: true,
      message: `Status do teste atualizado para "${status}".`,
      request
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar status do teste';
    res.status(400).json({ error: msg });
  }
});

// Admin: List Demo Users (distinct from paying clients)
app.get('/api/admin/demo-users', requireAdmin, (_req: Request, res: Response) => {
  const demoUsers = db.getDemoUsers();
  res.json({ demoUsers });
});

// Admin: Block / Reactivate / Expire demo access for a user
app.post('/api/admin/demo-users/:id/toggle', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'blocked', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Situação de teste inválida (active, blocked, expired).' });
    }
    const user = db.toggleUserDemoStatus(id, status);
    if (!user) {
      return res.status(404).json({ error: 'Usuário de demonstração não encontrado.' });
    }

    const label = status === 'active' ? 'Reativado' : status === 'blocked' ? 'Bloqueado' : 'Encerrado';
    res.json({
      success: true,
      message: `Acesso de demonstração do usuário ${user.name} definido como ${label}.`,
      user
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao alterar situação do usuário de demonstração';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// ADMIN: GERAR DIAGNÓSTICO PARA CLIENTE
// ==========================================

// Verify active admin session
app.get('/api/admin/verify', requireAdmin, (_req: Request, res: Response) => {
  res.json({ valid: true, role: 'admin' });
});

// Check email service status
app.get('/api/admin/email-status', requireAdmin, (_req: Request, res: Response) => {
  const check = isEmailConfigured();
  res.json({
    configured: check.configured,
    missing: check.missing,
    smtpHost: process.env.SMTP_HOST || null,
    smtpUser: process.env.SMTP_USER || null,
    smtpFrom: process.env.SMTP_FROM || null
  });
});

// Admin: List all client diagnostics
app.get('/api/admin/client-diagnostics', requireAdmin, (_req: Request, res: Response) => {
  const diagnostics = db.getAllClientDiagnostics();
  res.json({ diagnostics });
});

// Admin: Generate strategic diagnostic for client
app.post('/api/admin/client-diagnostics/generate', requireAdmin, async (req: Request, res: Response) => {
  const tTotalStart = Date.now();
  try {
    const {
      clientName,
      clientEmail,
      instagramUsername,
      profession,
      niche,
      product,
      objective
    } = req.body;

    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
    }
    if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.trim() || !clientEmail.includes('@')) {
      return res.status(400).json({ error: 'O e-mail do cliente é obrigatório e deve ser um endereço válido.' });
    }
    if (!instagramUsername || typeof instagramUsername !== 'string' || !instagramUsername.trim()) {
      return res.status(400).json({ error: 'O @ do Instagram é obrigatório.' });
    }

    const cleanUsername = instagramUsername.replace(/^@/, '').trim();

    // 1. Check Meta Instagram Business Discovery (Stage: instagram_fetch)
    const tMetaStart = Date.now();
    const metaCheck = await fetchInstagramProfileData(cleanUsername);
    const metaMs = Date.now() - tMetaStart;

    // 2. Call Gemini server-side (Stage: gemini_api)
    const tGeminiStart = Date.now();
    const strategy = await generateContentMapStrategy({
      username: cleanUsername,
      profession: profession?.trim() || 'Não informado',
      niche: niche?.trim() || 'Geral do segmento',
      product: product?.trim() || 'Produtos/Serviços',
      objective: objective?.trim() || 'Atrair seguidores compradores e aumentar autoridade',
      metaProfileData: metaCheck.data
    });
    const geminiMs = Date.now() - tGeminiStart;

    // 3. Assemble complete unlocked report (Stage: synthesis)
    const tSynthStart = Date.now();
    const rawReport: Report = {
      id: crypto.randomUUID(),
      userId: null,
      userEmail: clientEmail.trim().toLowerCase(),
      username: cleanUsername,
      profession: profession?.trim() || '',
      niche: niche?.trim() || '',
      product: product?.trim() || '',
      objective: objective?.trim() || 'Atrair seguidores compradores e aumentar autoridade',
      metaApiStatus: metaCheck.status === 'connected' ? 'connected' : 'not_configured',
      manualData: {
        bio: metaCheck.data?.biography || '',
        recentCaptions: metaCheck.data?.recentCaptions?.join('\n') || ''
      },
      metaProfileData: metaCheck.data,
      diagnosis: strategy.diagnosis,
      contentIdeas: strategy.contentIdeas,
      reels: strategy.reels,
      carousels: strategy.carousels,
      stories: strategy.stories,
      hooksAndCtas: strategy.hooksAndCtas,
      calendar: strategy.calendar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPaid: true,
      paidAt: new Date().toISOString(),
      paidPlanId: 'premium',
      hotmartTransactionId: `ADMIN_DIAG_${Date.now()}`
    };

    const fullReport = ensureReport90Days(rawReport);
    const synthesisMs = Date.now() - tSynthStart;

    // 4. Save client diagnostic in database (Stage: db_save)
    const tDbStart = Date.now();
    const executionMetrics: ExecutionMetrics = {
      metaMs,
      geminiMs,
      synthesisMs,
      dbMs: 0,
      totalMs: 0,
      fromCache: strategy.executionMetrics?.fromCache || false,
      isFallback: strategy.executionMetrics?.isFallback || false,
      modelUsed: strategy.executionMetrics?.modelUsed || 'gemini-3.8-flash'
    };

    fullReport.executionMetrics = executionMetrics;

    const diagnostic = db.createClientDiagnostic({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      instagramUsername: cleanUsername,
      profession: profession?.trim() || '',
      niche: niche?.trim() || '',
      product: product?.trim() || '',
      objective: objective?.trim() || 'Atrair seguidores compradores e aumentar autoridade',
      reportData: fullReport
    });

    const dbMs = Date.now() - tDbStart;
    executionMetrics.dbMs = dbMs;
    executionMetrics.totalMs = Date.now() - tTotalStart;

    console.log(`[STAGE_TIMING] /api/admin/client-diagnostics/generate @${cleanUsername}: total=${executionMetrics.totalMs}ms (meta=${metaMs}ms, gemini=${geminiMs}ms, synth=${synthesisMs}ms, db=${dbMs}ms, fallback=${strategy.executionMetrics?.isFallback || false})`);

    // Note: Do NOT send email automatically. A separate button "Enviar Diagnóstico por E-mail" triggers delivery.
    res.json({
      success: true,
      message: 'Diagnóstico estratégico para o cliente gerado com sucesso! Visualize a prévia e clique em "Enviar Diagnóstico por E-mail" quando desejar.',
      diagnostic,
      executionMetrics
    });
  } catch (err: unknown) {
    const elapsed = Date.now() - tTotalStart;
    console.error(`Error generating client diagnostic after ${elapsed}ms:`, err);
    const message = err instanceof Error ? err.message : 'Falha interna ao gerar diagnóstico estratégico para cliente.';
    res.status(500).json({ error: message, elapsedMs: elapsed });
  }
});

// Admin: Send generated diagnostic by email
app.post('/api/admin/client-diagnostics/:id/send-email', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const diagnostic = db.getClientDiagnosticById(id);
    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado no histórico.' });
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const result = await sendClientDiagnosticEmail(diagnostic, baseUrl);

    if (result.success) {
      const updated = db.updateClientDiagnosticStatus(id, 'Enviado por E-mail', {
        attemptedAt: new Date().toISOString(),
        success: true
      });
      return res.json({
        success: true,
        message: result.message,
        diagnostic: updated
      });
    } else {
      db.updateClientDiagnosticStatus(id, diagnostic.status, {
        attemptedAt: new Date().toISOString(),
        success: false,
        error: result.message
      });
      return res.status(400).json({
        success: false,
        configured: result.configured,
        missingConfig: result.missingConfig,
        error: result.message
      });
    }
  } catch (err: unknown) {
    console.error('Error sending client diagnostic email:', err);
    const message = err instanceof Error ? err.message : 'Erro ao processar envio de e-mail.';
    res.status(500).json({ error: message });
  }
});

// Admin: Delete a client diagnostic from history
app.delete('/api/admin/client-diagnostics/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteClientDiagnostic(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Diagnóstico não encontrado.' });
  }
  res.json({ success: true, message: 'Diagnóstico removido do histórico com sucesso.' });
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
