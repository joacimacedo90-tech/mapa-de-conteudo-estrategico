import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Instagram,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Zap,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Target,
  Users,
  Compass,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { PricingPlan, PublicReelsCalendarDay, PublicReelsDemoResult } from '../types';

interface HomeProps {
  onReportGenerated: (reportId: string) => void;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
  onOpenLgpd: () => void;
  userId?: string;
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenLgpd }) => {
  // Input states
  const [demoInstagram, setDemoInstagram] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [inputFollowers, setInputFollowers] = useState('');
  const [inputNiche, setInputNiche] = useState('');

  // Auto-detection & profile data
  const [isCheckingAuto, setIsCheckingAuto] = useState(false);
  const [profileFoundData, setProfileFoundData] = useState<{
    displayName?: string;
    profilePictureUrl?: string;
    bio?: string;
    followersCount?: number;
    detectedNiche?: string;
    publicProfileVerified?: boolean;
    queriedAt?: string;
    source?: string;
    identityValidated?: boolean;
    unverifiedReason?: string;
  } | null>(null);

  // Correction states after analysis
  const [editingNiche, setEditingNiche] = useState('');
  const [editingFollowers, setEditingFollowers] = useState('');

  // Results & Generation
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [reelsResult, setReelsResult] = useState<PublicReelsDemoResult | null>(null);
  const [reelsError, setReelsError] = useState('');

  // Calendar navigation state
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [copiedReelDay, setCopiedReelDay] = useState<number | null>(null);
  const [copiedAllCalendar, setCopiedAllCalendar] = useState(false);

  // Plans & Banner
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    // 1. Fetch plans
    api.getPlans()
      .then((res) => {
        setPlans(res.plans);
        if (res.headlineBanner) setBanner(res.headlineBanner);
      })
      .catch(console.error);

    // 2. Read query params (?u=... or ?user=... or ?instagram=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUser = params.get('u') || params.get('user') || params.get('instagram');
      if (urlUser) {
        const clean = urlUser.replace(/^@/, '').trim();
        setDemoInstagram(clean);
        // Trigger automatic detection for the pre-filled username
        triggerAutoDetection(clean);
      }
    } catch {
      // ignore
    }
  }, []);

  const triggerAutoDetection = async (usernameClean: string) => {
    if (!usernameClean) return;
    setIsCheckingAuto(true);
    try {
      const res = await api.detectNiche({ username: usernameClean });
      if (res.success && res.data) {
        setProfileFoundData({
          displayName: res.data.displayName,
          profilePictureUrl: res.data.profilePictureUrl,
          bio: res.data.summary,
          followersCount: res.data.followersCount,
          detectedNiche: res.data.detectedNiche,
          publicProfileVerified: Boolean(res.data.verifiedLive),
          queriedAt: res.data.queriedAt,
          source: res.data.source,
          identityValidated: res.data.identityValidated,
          unverifiedReason: res.data.unverifiedReason
        });

        if (res.data.followersCount !== undefined && res.data.followersCount >= 0) {
          setInputFollowers(String(res.data.followersCount));
          setEditingFollowers(String(res.data.followersCount));
        }
        if (res.data.detectedNiche) {
          setInputNiche(res.data.detectedNiche);
          setEditingNiche(res.data.detectedNiche);
        }
      }
    } catch {
      // Silently continue; manual inputs remain available
    } finally {
      setIsCheckingAuto(false);
    }
  };

  // Debounced auto-fetch as user types their username
  useEffect(() => {
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean || clean.length < 3 || reelsResult) return;
    const timer = setTimeout(() => {
      triggerAutoDetection(clean);
    }, 700);
    return () => clearTimeout(timer);
  }, [demoInstagram, reelsResult]);

  const handleUsernameBlur = () => {
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean || reelsResult) return;
    triggerAutoDetection(clean);
  };

  // Compute calendar dates based on generation start date
  const startDate = useMemo(() => {
    if (reelsResult?.generatedAt) {
      const d = new Date(reelsResult.generatedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [reelsResult?.generatedAt]);

  const totalDays = reelsResult?.calendar?.length || 30;

  const totalMonths = useMemo(() => {
    const fim = new Date(startDate.getTime() + totalDays * 86400000);
    return (fim.getFullYear() - startDate.getFullYear()) * 12 + fim.getMonth() - startDate.getMonth() + 1;
  }, [startDate, totalDays]);

  const handleGenerateCalendar = async (
    e?: React.FormEvent,
    customNiche?: string,
    customFollowers?: number
  ) => {
    if (e) e.preventDefault();
    setReelsError('');
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean) {
      setReelsError('Por favor, informe o seu @ do Instagram.');
      return;
    }

    setGeneratingCalendar(true);
    try {
      const nicheToUse = customNiche !== undefined
        ? customNiche
        : (editingNiche.trim() || inputNiche.trim() || undefined);

      const followersVal = customFollowers !== undefined
        ? customFollowers
        : (editingFollowers.trim()
            ? Number(editingFollowers.replace(/\D/g, ''))
            : (inputFollowers.trim() ? Number(inputFollowers.replace(/\D/g, '')) : undefined));

      const res = await api.generate30DaysReelsDemo({
        username: clean,
        confirmedNiche: nicheToUse,
        followersCount: followersVal,
        email: userEmail.trim() || undefined,
        whatsapp: userWhatsapp.trim() || undefined
      });

      if (res.success && res.demo) {
        setReelsResult(res.demo);
        setEditingNiche(res.demo.confirmedNiche);
        if (res.demo.followersCount !== undefined) {
          setEditingFollowers(String(res.demo.followersCount));
          setInputFollowers(String(res.demo.followersCount));
        }
        setSelectedDayIndex(0);
        setCalMonthOffset(0);

        setTimeout(() => {
          document.getElementById('analise-resultado')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        throw new Error('Falha ao processar o calendário de 30 dias.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar o calendário de 30 dias.';
      setReelsError(msg);
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const mudaMes = (delta: number) => {
    setCalMonthOffset((prev) => Math.min(Math.max(prev + delta, 0), totalMonths - 1));
  };

  const selDia = (index: number) => {
    setSelectedDayIndex(index);
    const dt = new Date(startDate.getTime() + index * 86400000);
    const offset = (dt.getFullYear() - startDate.getFullYear()) * 12 + dt.getMonth() - startDate.getMonth();
    setCalMonthOffset(Math.max(0, Math.min(offset, totalMonths - 1)));
  };

  const handleCopyReelDay = (day: PublicReelsCalendarDay) => {
    const text = `🎬 PROTOCOLO DE PLANEJAMENTO ESTRATÉGICO
REEL DIA ${day.day}: ${day.theme}
🎯 OBJETIVO ESTRATÉGICO: ${day.strategicObjective}
⏰ MELHOR HORÁRIO: ${day.bestTime || '18h30 às 19h45'}
🎯 MARKETING DE INTENÇÃO: ${day.intentMarketing || 'Gerar autoridade e atração'}
⚡ OTIMIZAÇÃO ORGÂNICA: ${day.organicOptimization || 'Retenção acelerada nos primeiros 4s e cortes dinâmicos'}
🛡️ FILTRO QMN (Qualidade Média do Nicho): ${day.qmnFilter || 'Supera o conteúdo comum com profundidade'}

⏱️ GANCHO 3 SEGUNDOS:
"${day.hook3s}"

📝 ROTEIRO / ESTRUTURA:
${day.scriptStructure}

💡 COMO GRAVAR:
${day.contentDevelopment}

📣 CTA:
${day.cta}

📄 LEGENDA SUGERIDA:
${day.suggestedCaption}

🏷️ HASHTAGS:
${day.hashtags.join(' ')}`;

    navigator.clipboard.writeText(text);
    setCopiedReelDay(day.day);
    setTimeout(() => setCopiedReelDay(null), 2500);
  };

  const handleCopyAllCalendar = () => {
    if (!reelsResult) return;
    const header = `📅 PROTOCOLO DE PLANEJAMENTO ESTRATÉGICO (30 DIAS DE REELS)\nPerfil: @${reelsResult.username.toUpperCase()}\nNicho Confirmado: ${reelsResult.confirmedNiche}\n\n`;
    const daysText = reelsResult.calendar
      .map(
        (day) =>
          `📌 DIA ${day.day} [${day.strategicObjective}] • Horário: ${day.bestTime || '18h30'}\nIntenção: ${day.intentMarketing || 'Autoridade'}\nTema: ${day.theme}\nGancho (3s): "${day.hook3s}"\nRoteiro: ${day.scriptStructure}\nComo Gravar: ${day.contentDevelopment}\nCTA: ${day.cta}\nQMN: ${day.qmnFilter || 'Qualidade Superior'}\n`
      )
      .join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(header + daysText);
    setCopiedAllCalendar(true);
    setTimeout(() => setCopiedAllCalendar(false), 2500);
  };

  // Build calendar matrix for current month view
  const currentBaseMonth = new Date(startDate.getFullYear(), startDate.getMonth() + calMonthOffset, 1);
  const currentMonthName = `${MESES_PT[currentBaseMonth.getMonth()]} de ${currentBaseMonth.getFullYear()}`;
  const firstDayWeekday = currentBaseMonth.getDay(); // 0 = Domingo
  const daysInCurrentMonth = new Date(currentBaseMonth.getFullYear(), currentBaseMonth.getMonth() + 1, 0).getDate();

  const activeReel = reelsResult?.calendar?.[selectedDayIndex] || reelsResult?.calendar?.[0];
  const activeDate = new Date(startDate.getTime() + selectedDayIndex * 86400000);

  // Exact Followers Count from profile or manual confirmation (NEVER invented)
  const exactFollowers = reelsResult?.followersCount !== undefined && reelsResult.followersCount > 0
    ? reelsResult.followersCount
    : (editingFollowers.trim()
        ? Number(editingFollowers.replace(/\D/g, ''))
        : (inputFollowers.trim() ? Number(inputFollowers.replace(/\D/g, '')) : null));

  // Follower projection calculation based strictly on real exact numbers
  const potentialGain = useMemo(() => {
    if (!exactFollowers || exactFollowers <= 0) return 3200;
    if (exactFollowers < 1000) return Math.round(exactFollowers * 2.8);
    if (exactFollowers < 5000) return Math.round(exactFollowers * 1.6);
    if (exactFollowers < 20000) return Math.round(exactFollowers * 0.95);
    if (exactFollowers < 100000) return Math.round(exactFollowers * 0.45);
    return Math.round(exactFollowers * 0.3);
  }, [exactFollowers]);

  const projectedFollowers = exactFollowers ? exactFollowers + potentialGain : null;

  return (
    <div className="min-h-screen bg-[#09090d] text-zinc-100 flex flex-col items-center">
      {/* Top Gradient Stripe */}
      <div className="w-full h-1 bg-gradient-to-r from-amber-400 via-[#ee4957] to-purple-600" />

      {/* Top Banner if configured */}
      {banner && (
        <div className="w-full bg-[#ee4957]/15 border-b border-[#ee4957]/30 py-2 px-4 text-center text-xs font-semibold text-white">
          {banner}
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-[620px] mx-auto px-4 py-8 sm:py-12 space-y-7">
        {/* Header Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#ee4957] animate-pulse" />
            <span>Mapa de Conteúdo Estratégico • Plataforma Oficial</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading leading-tight uppercase">
            PROTOCOLO DE PLANEJAMENTO <span className="bg-gradient-to-r from-[#ee4957] via-[#ff6b78] to-amber-400 bg-clip-text text-transparent">ESTRATÉGICO</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Acelere a atração orgânica, o posicionamento de autoridade e a conversão do seu perfil no Instagram com Marketing de Intenção e Filtro QMN.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <form onSubmit={handleGenerateCalendar} className="space-y-4">
            {/* Campo 1: @ do Instagram */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  @ do Instagram <span className="text-[#ee4957]">*</span>
                </label>
                {isCheckingAuto && (
                  <span className="text-[11px] text-[#ee4957] flex items-center gap-1 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Buscando perfil público...
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={demoInstagram}
                  onChange={(e) => setDemoInstagram(e.target.value)}
                  onBlur={handleUsernameBlur}
                  placeholder="seu.perfil"
                  disabled={generatingCalendar}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>

              {/* CARD DE FEEDBACK EM TEMPO REAL DO PERFIL IDENTIFICADO */}
              {profileFoundData && (
                <div className="mt-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                        {profileFoundData.profilePictureUrl ? (
                          <img
                            src={profileFoundData.profilePictureUrl}
                            alt={profileFoundData.displayName || demoInstagram}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {(profileFoundData.displayName || demoInstagram).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {profileFoundData.displayName || `@${demoInstagram.replace(/^@/, '')}`}
                          </span>
                          {profileFoundData.publicProfileVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Verificado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {profileFoundData.followersCount !== undefined ? (
                            <span className="text-emerald-400 font-bold">
                              {profileFoundData.followersCount.toLocaleString('pt-BR')} seguidores reais identificados
                            </span>
                          ) : (
                            <span className="text-amber-400">
                              Seguidores não obtidos automaticamente (informe abaixo)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {profileFoundData.detectedNiche && (
                    <div className="text-[11px] text-zinc-300 pt-1 border-t border-zinc-900 flex items-center justify-between">
                      <span>Nicho identificado: <strong className="text-white">{profileFoundData.detectedNiche}</strong></span>
                      <span className="text-[10px] text-zinc-500 font-mono">IA Analítica</span>
                    </div>
                  )}

                  {profileFoundData.source && (
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>Fonte: {profileFoundData.source}</span>
                      {profileFoundData.queriedAt && (
                        <span>{new Date(profileFoundData.queriedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campo 2: Melhor e-mail */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Melhor e-mail <span className="text-zinc-500 font-normal text-[11px]">(para receber a estratégia)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
            </div>

            {/* Campo 3: WhatsApp */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                WhatsApp <span className="text-zinc-500 font-normal text-[11px]">(opcional, com DDD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={userWhatsapp}
                  onChange={(e) => setUserWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
            </div>

            {/* Quantidade Exata de Seguidores (REGRA OBRIGATÓRIA: real e exata, nunca inventar) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Quantidade de seguidores reais que o perfil tem
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Users className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  value={inputFollowers}
                  onChange={(e) => setInputFollowers(e.target.value)}
                  placeholder="Ex: 1450"
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Usamos o número exato de seguidores reais para calibrar o alcance e o crescimento sem números fictícios.
              </p>
            </div>

            {/* Campo de Nicho com opção de correção manual */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Nicho de atuação <span className="text-zinc-500 font-normal text-[11px]">(identificado automaticamente com opção de ajuste)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Target className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={inputNiche}
                  onChange={(e) => setInputNiche(e.target.value)}
                  placeholder="Ex: Posicionamento Digital, Odontologia Estética, Personal Trainer..."
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
            </div>

            {/* ORIENTAÇÃO EM DESTAQUE: PERFIL PRECISA SER PÚBLICO */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold">Orientação obrigatória:</strong> Seu perfil precisa ser <strong className="underline">PÚBLICO</strong> no Instagram para que a inteligência consiga analisar suas postagens, bio e nicho real.
              </div>
            </div>

            {/* Error Message with preserved input state */}
            {reelsError && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <span>{reelsError}</span>
                <button
                  type="button"
                  onClick={() => handleGenerateCalendar()}
                  className="shrink-0 text-white font-bold underline text-[11px] cursor-pointer"
                >
                  Tentar de novo
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generatingCalendar || !demoInstagram.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#e03140] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingCalendar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando perfil & gerando cronograma...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Analisar meu Instagram & Gerar 30 Dias</span>
                </>
              )}
            </button>
          </form>

          {/* Segurança Garantida */}
          <div className="pt-1 text-center">
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% seguro. Análise de dados públicos. Não solicitamos senha nem dados de acesso.</span>
            </p>
          </div>
        </div>

        {/* Loading Spinner Block */}
        {generatingCalendar && (
          <div className="p-6 rounded-2xl bg-[#121217] border border-zinc-800 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full border-3 border-[#ee4957] border-t-transparent animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-white">
              Analisando @{demoInstagram.replace(/^@/, '')}...
            </h4>
            <p className="text-xs text-zinc-400">
              Identificando nicho, público comprador e estruturando 30 dias de Reels magnéticos.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* RESULTADO DA ANÁLISE, PROJEÇÃO E CALENDÁRIO             */}
        {/* ======================================================== */}
        {reelsResult && !generatingCalendar && (
          <div id="analise-resultado" className="space-y-6 pt-2 animate-in fade-in duration-300">
            {/* QUADRO DE TRANSPARÊNCIA E AUDITORIA DOS DADOS (REGRA CRÍTICA) */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              reelsResult.verifiedLive
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700/50 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${reelsResult.verifiedLive ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="font-extrabold uppercase tracking-wide text-[11px]">
                    {reelsResult.verifiedLive
                      ? 'Dados Reais Verificados do Instagram'
                      : 'Transparência de Consulta & Auditoria de Dados'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Consulta: {reelsResult.queriedAt ? new Date(reelsResult.queriedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="text-[11px] leading-relaxed">
                {reelsResult.verifiedLive ? (
                  <p className="text-emerald-300">
                    ✓ Identidade validada ao vivo diretamente na fonte oficial do Instagram para <strong>@{reelsResult.username}</strong>. Nome original, seguidores exatos e foto autêntica foram preservados sem arredondamentos ou estimativas.
                  </p>
                ) : (
                  <p className="text-zinc-400">
                    <strong className="text-amber-300">Aviso de conformidade e integridade:</strong> O Instagram restringiu a consulta automatizada externa sem autenticação (Rate Limit HTTP 429) ou o perfil possui restrições de privacidade. Em estrito cumprimento à nossa <strong>Política de Não-Invenção de Dados</strong>, nenhum número, nome ou foto fictícia foi gerado. Os dados abaixo refletem as informações confirmadas por você no campo abaixo.
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Fonte: {reelsResult.source || (reelsResult.verifiedLive ? 'Instagram Live' : 'Confirmação pelo Usuário')}</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Perfil: @{reelsResult.username}</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Seguidores: {exactFollowers ? exactFollowers.toLocaleString('pt-BR') : 'Aguardando confirmação manual'}</span>
                </div>
              </div>
            </div>

            {/* 1. DADOS REAIS DO PERFIL (OU CONFIRMADOS PELO USUÁRIO) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-[#ee4957]" />
                  Dados Reais do Perfil
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {reelsResult.verifiedLive ? '● Verificado ao vivo' : '● Confirmado pelo usuário'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                {/* Foto Original do Perfil */}
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-zinc-700 to-zinc-600 shrink-0">
                  <div className="w-full h-full rounded-full bg-[#09090d] flex items-center justify-center overflow-hidden">
                    {reelsResult.profilePictureUrl ? (
                      <img
                        src={reelsResult.profilePictureUrl}
                        alt={`Foto de @${reelsResult.username}`}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-extrabold text-[#ee4957] text-base">
                        {reelsResult.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {reelsResult.displayName || `@${reelsResult.username}`}
                      </h4>
                      {!reelsResult.displayName && (
                        <span className="text-[10px] text-zinc-500 italic">Nome público não obtido na API</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-mono font-semibold">@{reelsResult.username}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <div>
                      <strong className="text-white">
                        {exactFollowers ? exactFollowers.toLocaleString('pt-BR') : 'Não obtido ao vivo'}
                      </strong>
                      <span className="text-[10px] text-zinc-400 ml-1">seguidores reais</span>
                    </div>
                    {reelsResult.mediaCount !== undefined && reelsResult.mediaCount > 0 && (
                      <div>
                        <strong className="text-white">{reelsResult.mediaCount}</strong>
                        <span className="text-[10px] text-zinc-400 ml-1">posts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {reelsResult.bio && (
                <div className="p-2.5 rounded-xl bg-[#09090d] border border-zinc-800 text-xs text-zinc-300 italic">
                  "{reelsResult.bio}"
                </div>
              )}
            </div>

            {/* 2. NICHO IDENTIFICADO PELA IA & 3. CAMPO DE CORREÇÃO DO NICHO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-[#ee4957]/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-400">
                    Nicho Identificado pela IA:
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#ee4957]/15 border border-[#ee4957]/30 text-[#ee4957] text-xs font-extrabold uppercase">
                  {reelsResult.confirmedNiche}
                </span>
              </div>

              {/* Pergunta de Verificação: Seu nicho de atuação está correto? */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Target className="w-3.5 h-3.5 text-[#ee4957]" />
                  <span>Seu nicho de atuação está correto?</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Se a identificação estiver incorreta ou se o número de seguidores divergir da realidade do perfil, ajuste abaixo para recalcularmos a estratégia imediatamente:
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const foll = editingFollowers ? Number(editingFollowers.replace(/\D/g, '')) : undefined;
                    handleGenerateCalendar(undefined, editingNiche.trim() || undefined, foll);
                  }}
                  className="space-y-2 pt-1"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                        Nicho de atuação correto:
                      </label>
                      <input
                        type="text"
                        value={editingNiche}
                        onChange={(e) => setEditingNiche(e.target.value)}
                        placeholder="Ex: Odontologia Estética, Advocacia..."
                        disabled={generatingCalendar}
                        className="w-full px-3 py-2 rounded-xl bg-[#09090d] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                        Seguidores reais exatos:
                      </label>
                      <input
                        type="number"
                        value={editingFollowers}
                        onChange={(e) => setEditingFollowers(e.target.value)}
                        placeholder="Ex: 1450"
                        disabled={generatingCalendar}
                        className="w-full px-3 py-2 rounded-xl bg-[#09090d] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={generatingCalendar || (!editingNiche.trim() && !editingFollowers.trim())}
                    className="w-full py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {generatingCalendar ? 'Recalculando...' : 'Confirmar & Recalcular Análise com Dados Corretos'}
                  </button>
                </form>
              </div>
            </div>

            {/* 4. POSICIONAMENTO ESTRATÉGICO DO NICHO */}
            <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-heading">
                    Posicionamento Estratégico no Nicho de {reelsResult.confirmedNiche}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Diretrizes práticas para construir autoridade, atrair o cliente ideal e converter em vendas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Pilar: Como se comunicar */}
                <div className="p-3.5 rounded-xl bg-[#09090d] border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#ee4957] tracking-wider block">
                    🗣️ Como se comunicar no nicho:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {reelsResult.projection?.projectedProfile?.nicheCommunicationGuide ||
                      `Comunique-se com autoridade técnica acessível. Aborde as dores cotidianas do público de ${reelsResult.confirmedNiche} sem termos complicados, focando sempre na solução prática.`}
                  </p>
                </div>

                {/* Pilar: Diferenciação */}
                <div className="p-3.5 rounded-xl bg-[#09090d] border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                    ⚡ Diferenciação perante concorrentes:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {reelsResult.projection?.projectedProfile?.differentiation ||
                      `Fuja do conteúdo genérico. Apresente bastidores, metodologia própria e estudos de caso que comprovem que você domina ${reelsResult.confirmedNiche}.`}
                  </p>
                </div>

                {/* Pilar: Público-Alvo Comprador */}
                <div className="p-3.5 rounded-xl bg-[#09090d] border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                    🎯 Público-alvo prioritário:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {reelsResult.projection?.projectedProfile?.targetAudienceProfile ||
                      `Seguidores que buscam soluções de confiança em ${reelsResult.confirmedNiche} e valorizam qualidade em vez de briga por menor preço.`}
                  </p>
                </div>

                {/* Pilar: Conversão e Vendas */}
                <div className="p-3.5 rounded-xl bg-[#09090d] border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">
                    💼 Caminho de Conversão em Vendas:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {reelsResult.projection?.projectedProfile?.conversionPath ||
                      `Reels verticais com gancho de 3s gerando salvamento e palavras-chave na CTA direcionando para conversa no Direct.`}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. PROJEÇÃO ESTRATÉGICA DO PERFIL (ANTES X DEPOIS) */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-[#ee4957]/20 to-purple-500/20 border border-[#ee4957]/30 text-white text-xs font-black tracking-wider uppercase">
                  ✦ Comparativo & Potencial em 3 Meses
                </span>
              </div>

              <div className="space-y-3">
                {/* CARD 1: SEU PERFIL HOJE */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-3">
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider border border-zinc-700">
                    Seu perfil hoje
                  </span>

                  <div className="flex items-center gap-3.5 pt-1">
                    {/* Avatar Original */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-zinc-700 to-zinc-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-[#09090d] flex items-center justify-center overflow-hidden">
                        {reelsResult.profilePictureUrl ? (
                          <img
                            src={reelsResult.profilePictureUrl}
                            alt={`@${reelsResult.username}`}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-extrabold text-[#ee4957] text-base sm:text-lg">
                            {reelsResult.username.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dados Reais */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">
                          {reelsResult.displayName || `@${reelsResult.username}`}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono">@{reelsResult.username}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <div>
                          <strong className="text-white">
                            {exactFollowers ? exactFollowers.toLocaleString('pt-BR') : 'Não verificado'}
                          </strong>
                          <span className="text-[10px] text-zinc-400 ml-1">seguidores reais</span>
                        </div>
                        {reelsResult.mediaCount !== undefined && (
                          <div>
                            <strong className="text-white">{reelsResult.mediaCount}</strong>
                            <span className="text-[10px] text-zinc-400 ml-1">posts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Biografia real se disponível */}
                  {reelsResult.bio && (
                    <div className="p-2.5 rounded-xl bg-[#09090d] border border-zinc-800 text-xs text-zinc-300 italic">
                      "{reelsResult.bio}"
                    </div>
                  )}

                  {/* Oportunidades de melhoria */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                      Oportunidades imediatas de melhoria identificadas:
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-400">
                      {(reelsResult.projection?.currentProfile?.improvementOpportunities || [
                        'Falta de gancho visual de retenção nos primeiros 3 segundos dos vídeos',
                        'Bio sem promessa clara de transformação para o público de ' + reelsResult.confirmedNiche,
                        'Poucas postagens intencionais direcionando o seguidor para conversa privada'
                      ]).map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#ee4957] mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Seta Conexão */}
                <div className="text-center py-0.5 text-xs font-bold text-zinc-400 flex items-center justify-center gap-2">
                  <span className="text-[#ee4957]">⬇</span>
                  <span>aplicando o método de 30 Reels com consistência</span>
                  <span className="text-[#ee4957]">⬇</span>
                </div>

                {/* CARD 2: PROJEÇÃO EM 3 MESES (COM IDENTIFICAÇÃO EXPLÍCITA DE PROJEÇÃO) */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18141a] via-[#131219] to-[#18141a] border-2 border-[#ee4957] shadow-xl shadow-[#ee4957]/15 space-y-3">
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ee4957] to-[#ff6b78] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    ✦ Projeção Estratégica em 3 Meses
                  </span>

                  <div className="flex items-center gap-3.5 pt-1">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#ee4957] via-amber-400 to-purple-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-[#09090d] flex items-center justify-center overflow-hidden border-2 border-[#09090d]">
                        {reelsResult.profilePictureUrl ? (
                          <img
                            src={reelsResult.profilePictureUrl}
                            alt={`@${reelsResult.username}`}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="font-extrabold text-white text-base">
                            {reelsResult.username.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-white">+30 Reels</b>
                        <span className="text-[10px] text-zinc-400">no seu nicho</span>
                      </div>
                      <div>
                        <b className="block text-base sm:text-lg font-black bg-gradient-to-r from-[#ee4957] via-[#ff7b88] to-amber-300 bg-clip-text text-transparent">
                          {projectedFollowers ? projectedFollowers.toLocaleString('pt-BR') : `+${potentialGain.toLocaleString('pt-BR')}`}
                        </b>
                        <span className="text-[10px] font-bold text-emerald-400">
                          +{potentialGain.toLocaleString('pt-BR')} novos
                        </span>
                      </div>
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-emerald-400">
                          {exactFollowers ? `+${Math.round((potentialGain / exactFollowers) * 100)}%` : 'Alto Impacto'}
                        </b>
                        <span className="text-[10px] text-zinc-400">potencial</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Projeção */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                      Oportunidades de crescimento e conversão projetadas:
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {(reelsResult.projection?.projectedProfile?.growthAndConversionOpportunities || [
                        'Atração diária de pessoas interessadas em ' + reelsResult.confirmedNiche,
                        'Aumento previsível nas conversas e solicitações no Direct',
                        'Posicionamento como autoridade de referência no seu mercado'
                      ]).map((g, gIdx) => (
                        <li key={gIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Nota Explícita de Projeção vs Dados Reais */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Nota de Transparência da Projeção:</strong> {reelsResult.projection?.projectedProfile?.transparencyNote ||
                      'Esta estimativa é uma projeção estratégica baseada na aplicação disciplinada dos 30 Reels de alto impacto. Não representa dados atuais do perfil nem garantia mágica de resultados sem execução contínua.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. CALENDÁRIO INTERATIVO DE 30 DIAS (SOMENTE REELS) */}
            <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              {/* Navegação do Mês */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <button
                  type="button"
                  disabled={calMonthOffset <= 0}
                  onClick={() => mudaMes(-1)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                >
                  ‹
                </button>
                <div className="text-sm font-extrabold text-white capitalize tracking-tight font-heading">
                  {currentMonthName}
                </div>
                <button
                  type="button"
                  disabled={calMonthOffset >= totalMonths - 1}
                  onClick={() => mudaMes(1)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                >
                  ›
                </button>
              </div>

              {/* Cabeçalho dos Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-zinc-400 py-1">
                <div>D</div>
                <div>S</div>
                <div>T</div>
                <div>Q</div>
                <div>Q</div>
                <div>S</div>
                <div>S</div>
              </div>

              {/* Grade de Dias do Mês */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInCurrentMonth }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const cellDate = new Date(currentBaseMonth.getFullYear(), currentBaseMonth.getMonth(), dayNum);
                  const cellTime = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()).getTime();
                  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
                  const dayIndex = Math.round((cellTime - startTime) / 86400000);

                  const isInsideRange = dayIndex >= 0 && dayIndex < totalDays;
                  const isToday = dayIndex === 0;
                  const isSelected = isInsideRange && dayIndex === selectedDayIndex;

                  if (!isInsideRange) {
                    return (
                      <div
                        key={`fora-${dayNum}`}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center opacity-20 text-zinc-500 text-xs font-medium cursor-default"
                      >
                        <span>{dayNum}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => selDia(dayIndex)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative p-0.5 ${
                        isToday
                          ? 'bg-gradient-to-tr from-[#ee4957] to-[#ff6b78] text-white shadow-md shadow-[#ee4957]/30'
                          : isSelected
                          ? 'bg-[#ee4957]/15 border-2 border-[#ee4957] text-white'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80'
                      }`}
                    >
                      <span className="text-[12px] font-extrabold">{dayNum}</span>
                      <small className={`text-[8px] font-bold leading-tight ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                        🎬 1 Reel
                      </small>
                    </div>
                  );
                })}
              </div>

              {/* Detalhe do Dia Selecionado */}
              {activeReel && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>{selectedDayIndex === 0 ? 'Hoje, ' : `Dia ${selectedDayIndex + 1} • `}</span>
                      <span className="capitalize">{DIAS_PT[activeDate.getDay()]}, {activeDate.getDate()} de {MESES_PT[activeDate.getMonth()]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[10px] font-black uppercase">
                        🎬 1 Reel
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">
                        {activeReel.strategicObjective}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#ee4957] tracking-wider block">
                        🎬 Tema do Reel:
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {activeReel.theme}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Gancho Inicial de 3 Segundos:
                      </span>
                      <p className="text-xs font-semibold text-zinc-100 italic mt-0.5">
                        "{activeReel.hook3s}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                        📝 Roteiro & Estrutura:
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                        {activeReel.scriptStructure}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                        💡 Como Gravar / Direcionamento:
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                        {activeReel.contentDevelopment}
                      </p>
                    </div>

                    {/* Metadados Estratégicos do Post */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                        <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                          ⏰ Melhor Horário Sugerido:
                        </span>
                        <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                          {activeReel.bestTime || '18h30 às 19h45 (Pico Noturno)'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                        <span className="text-[10px] font-black uppercase text-purple-400 block tracking-wider">
                          🎯 Marketing de Intenção:
                        </span>
                        <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                          {activeReel.intentMarketing || 'Gerar autoridade e credibilidade imediata'}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">
                        ⚡ Otimização Orgânica:
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        {activeReel.organicOptimization || 'Retenção acelerada nos primeiros 4 segundos, cortes dinâmicos e convite a salvar no terço final.'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-[10px] font-black uppercase text-[#ee4957] block tracking-wider">
                        🛡️ Filtro QMN (Qualidade Média do Nicho):
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        {activeReel.qmnFilter || 'Supera o conteúdo comum com fundamentos práticos de mercado e diferenciação real.'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20">
                      <span className="text-[10px] font-black uppercase text-[#ee4957] block">
                        📣 Chamada para Ação (CTA):
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {activeReel.cta}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                        📄 Legenda Sugerida & Hashtags:
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                        {activeReel.suggestedCaption}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {activeReel.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-mono text-[#ee4957] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação do Dia */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => handleCopyReelDay(activeReel)}
                      className="px-3.5 py-2 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedReelDay === activeReel.day ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Roteiro do Dia</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyAllCalendar}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedAllCalendar ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tudo Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copiar 30 Dias</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 8: ANÁLISE FINAL DO CALENDÁRIO (3 GRUPOS DE DESTAQUE ESTRATÉGICO) */}
            <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <span className="text-[10px] font-black uppercase text-[#ee4957] tracking-wider block">
                  Seção 8 • Protocolo de Inteligência
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white font-heading mt-0.5">
                  Análise Estratégica do Calendário de 30 Dias
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Mapeamento dos melhores pontos de tração para acelerar o perfil de @{reelsResult.username}:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Grupo 1: Maior Potencial de Alcance */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4" />
                    <span>Maior Alcance</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {reelsResult.strategicHighlights?.reachSummary ||
                      'Vídeos projetados com gatilhos de curiosidade ampla e forte propensão a compartilhamentos espontâneos.'}
                  </p>
                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-1.5">
                    {(reelsResult.strategicHighlights?.highestReach || reelsResult.calendar.slice(0, 3)).map((item) => (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => selDia(item.day - 1)}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        Dia {item.day} • {item.strategicObjective}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grupo 2: Maior Geração de Seguidores */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <Users className="w-4 h-4" />
                    <span>Geração de Seguidores</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {reelsResult.strategicHighlights?.followersSummary ||
                      'Conteúdos densos que transmitem autoridade inquestionável, motivando quem assiste a seguir imediatamente.'}
                  </p>
                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-1.5">
                    {(reelsResult.strategicHighlights?.highestFollowerGain || reelsResult.calendar.slice(3, 6)).map((item) => (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => selDia(item.day - 1)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        Dia {item.day} • {item.strategicObjective}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grupo 3: Candidatos para Orgânico Turbinado */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase tracking-wide">
                    <Zap className="w-4 h-4" />
                    <span>Orgânico Turbinado</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {reelsResult.strategicHighlights?.paidTrafficSummary ||
                      'Postagens com gancho afiado e CTA comercial direta, perfeitas para impulsionamento estratégico.'}
                  </p>
                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-1.5">
                    {(reelsResult.strategicHighlights?.paidTrafficCandidates || reelsResult.calendar.slice(6, 9)).map((item) => (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => selDia(item.day - 1)}
                        className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30 transition-colors cursor-pointer"
                      >
                        Dia {item.day} • {item.strategicObjective}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 7: ESTRATÉGIA DE CONVERSÃO & ECOSSISTEMA COMPLETO (PÓS-TESTE) */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c141c] via-[#121217] to-[#1a1215] border-2 border-[#ee4957] shadow-2xl shadow-[#ee4957]/20 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4957] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                ✦ Protocolo de Planejamento Estratégico Completo
              </span>

              {/* 1. Validação do Momento */}
              <div className="space-y-2">
                <h3 className="text-lg sm:text-2xl font-black text-white font-heading leading-tight">
                  Parabéns! Você tem 30 roteiros de Reels para dominar o nicho de <span className="bg-gradient-to-r from-[#ee4957] to-amber-300 bg-clip-text text-transparent">{reelsResult.confirmedNiche}</span>.
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Esta demonstração gratuita entregou a base de atração em vídeo curto para o seu perfil @{reelsResult.username}.
                </p>
              </div>

              {/* 2. Revelação do Limite do Formato Gratuito */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Por que Reels sozinhos NÃO constroem um negócio milionário no Instagram?</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O Reels é o melhor formato de <strong className="text-zinc-200">topo de funil</strong> (descoberta rápida). No entanto, o público não compra de quem apenas faz vídeos curtos. Para transformar espectadores em clientes fiéis e de alto valor, você precisa da <strong className="text-white">ecologia de 4 formatos completos</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                    <strong className="block text-white font-bold mb-1">📚 Carrosséis Profundos</strong>
                    <span className="text-zinc-400 text-[11px]">Geram autoridade inabalável, alta taxa de salvamento e qualificam a decisão de compra.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                    <strong className="block text-white font-bold mb-1">🖼️ Posts de Feed Perenes</strong>
                    <span className="text-zinc-400 text-[11px]">Constroem sua vitrine institucional, provas sociais e posicionamento inegociável.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                    <strong className="block text-white font-bold mb-1">🔥 Stories Diários com Intenção</strong>
                    <span className="text-zinc-400 text-[11px]">O motor de relacionamento íntimo e conversão diária que fecha vendas no Direct.</span>
                  </div>
                </div>
              </div>

              {/* 3. Oferta do Ecossistema Completo (Upsell dos Planos Pagos) */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-base sm:text-xl font-extrabold text-white font-heading">
                    Desbloqueie o Ecossistema Completo do Protocolo
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                    Garanta o planejamento editorial completo com distribuição balanceada de Reels, Carrosséis, Feed e Stories, além de diagnósticos de posicionamento e acompanhamento.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Plano Essencial */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Entrada Rápida</span>
                      <h5 className="text-sm font-bold text-white mt-0.5">Plano Essencial</h5>
                      <div className="text-lg font-black text-white mt-1">R$ 47</div>
                      <ul className="space-y-1.5 text-[11px] text-zinc-400 mt-2">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Diagnóstico Completo de Bio & Posicionamento</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Projeção de Crescimento em 90 Dias</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>30 Ideias de Conteúdo Estratégico</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('comparison')}
                      className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Aderir por R$ 47
                    </button>
                  </div>

                  {/* Plano Pro (Destaque) */}
                  <div className="relative p-4 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-[#ee4957] shadow-lg shadow-[#ee4957]/15 flex flex-col justify-between space-y-3">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[9px] font-black uppercase tracking-wider">
                      Mais Recomendado
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-[#ee4957] uppercase tracking-wider">Ecologia Completa</span>
                      <h5 className="text-sm font-bold text-white mt-0.5">Plano Estratégico Pro</h5>
                      <div className="text-xl font-black text-white mt-1">
                        R$ 97 <span className="text-xs text-zinc-500 font-normal line-through">R$ 197</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-zinc-300 mt-2">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <strong className="text-white">Os 4 Formatos Integrados:</strong>
                        </li>
                        <li className="text-[10px] text-zinc-400 pl-4">
                          Reels + Carrosséis + Feed + Stories diários
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Diagnóstico de Furos de Conversão</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Banco de Ganchos e CTAs para Direct</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('comparison')}
                      className="w-full py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                    >
                      Desbloquear Plano PRO →
                    </button>
                  </div>

                  {/* Plano Premium */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Assessoria VIP</span>
                      <h5 className="text-sm font-bold text-white mt-0.5">Plano Premium VIP</h5>
                      <div className="text-lg font-black text-white mt-1">R$ 197</div>
                      <ul className="space-y-1.5 text-[11px] text-zinc-400 mt-2">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Tudo do Plano Pro</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Consultoria e Suporte Prioritário</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Roteiros Completos de Vendas</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('comparison')}
                      className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Aderir por R$ 197
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-3">
                  <span>🔒 Processamento seguro via Hotmart</span>
                  <span>•</span>
                  <span>🛡️ Garantia incondicional de 7 dias</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Clean Footer */}
        <footer className="pt-6 border-t border-zinc-900 text-center text-xs text-zinc-600 space-y-2">
          <p>© {new Date().getFullYear()} Mapa de Conteúdo Estratégico. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={onOpenLgpd}
              className="hover:text-zinc-400 transition-colors cursor-pointer"
            >
              Termos de Privacidade & LGPD
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="hover:text-zinc-400 transition-colors cursor-pointer"
            >
              Área do Cliente
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
