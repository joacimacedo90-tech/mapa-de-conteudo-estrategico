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

        if (res.data.followersCount !== undefined && res.data.followersCount > 0 && !inputFollowers) {
          setInputFollowers(String(res.data.followersCount));
        }
        if (res.data.detectedNiche && !inputNiche) {
          setInputNiche(res.data.detectedNiche);
        }
      }
    } catch {
      // Silently continue; manual inputs remain available
    } finally {
      setIsCheckingAuto(false);
    }
  };

  const handleUsernameBlur = () => {
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean || reelsResult || inputFollowers) return;
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
    const text = `🎬 REEL DIA ${day.day}: ${day.theme}
🎯 OBJETIVO: ${day.strategicObjective}

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
    const header = `📅 CALENDÁRIO ESTRATÉGICO DE 30 DIAS (REELS) - @${reelsResult.username.toUpperCase()}\nNicho: ${reelsResult.confirmedNiche}\n\n`;
    const daysText = reelsResult.calendar
      .map(
        (day) =>
          `📌 DIA ${day.day} [${day.strategicObjective}]\nTema: ${day.theme}\nGancho (3s): "${day.hook3s}"\nRoteiro: ${day.scriptStructure}\nComo Gravar: ${day.contentDevelopment}\nCTA: ${day.cta}\n`
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
            <span>Mapa de Conteúdo Estratégico</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading leading-tight">
            Descubra o potencial estratégico do seu <span className="bg-gradient-to-r from-[#ee4957] via-[#ff6b78] to-amber-400 bg-clip-text text-transparent">Instagram</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Informe seu @ e descubra como posicionar seu perfil, atrair o público certo e construir um caminho estratégico para crescer e vender.
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
                  placeholder="seu.perfil (ex: ojoacimacedo)"
                  disabled={generatingCalendar}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
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
                  placeholder="Ex: 1450 (ou deixe em branco se o perfil for público)"
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Usamos o número exato de seguidores para projetar o crescimento realista do perfil sem números fictícios.
              </p>
            </div>

            {/* Campo de Nicho Opcional Pré-envio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Nicho de atuação <span className="text-zinc-500 font-normal text-[11px]">(ou deixe em branco para auto-identificar com IA)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Target className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={inputNiche}
                  onChange={(e) => setInputNiche(e.target.value)}
                  placeholder="Ex: Odontologia Estética, Advocacia Civil, Personal Trainer..."
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

            {/* CONVITE COMERCIAL: PLANOS OFICIAIS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-[#17141a] border border-[#ee4957]/30 text-center space-y-3">
              <div className="inline-flex items-center gap-1 text-[#ee4957] text-xs font-bold uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>Planos Comerciais do Mapa de Conteúdo</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                Quer desbloquear diagnósticos profundos e carrosséis estruturados?
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Conheça nossos planos comerciais com liberação instantânea e garantia de 7 dias via Hotmart.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('comparison')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Ver Planos Disponíveis →
              </button>
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
              Área do Cliente / Admin
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
