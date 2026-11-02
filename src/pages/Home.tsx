import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Instagram,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Target,
  Video,
  Layers,
  Calendar,
  Zap,
  Info,
  HelpCircle,
  Lock,
  X,
  Play,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { PricingPlan, NicheDetectionResult, PublicReelsCalendarDay, PublicReelsDemoResult, ReelStrategicObjective } from '../types';

interface HomeProps {
  onReportGenerated: (reportId: string) => void;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
  onOpenLgpd: () => void;
  userId?: string;
}

export const Home: React.FC<HomeProps> = ({
  onReportGenerated,
  onNavigate,
  onOpenLgpd,
  userId
}) => {
  // Main form states
  const [username, setUsername] = useState('');
  const [profession, setProfession] = useState('');
  const [niche, setNiche] = useState('');
  const [product, setProduct] = useState('');
  const [objective, setObjective] = useState('Atrair seguidores compradores e aumentar autoridade');
  const [lgpdConsent, setLgpdConsent] = useState(true);

  // Optional alternative manual data states
  const [showOptionalForm, setShowOptionalForm] = useState(false);
  const [manualBio, setManualBio] = useState('');
  const [manualCaptions, setManualCaptions] = useState('');

  // Meta API status
  const [metaStatus, setMetaStatus] = useState<{
    tested: boolean;
    configured: boolean;
    message?: string;
  }>({ tested: false, configured: false });

  // Loading & Generation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Calendário de 30 Dias (Somente o @ do usuário)
  const [demoInstagram, setDemoInstagram] = useState('');
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [reelsResult, setReelsResult] = useState<PublicReelsDemoResult | null>(null);
  const [reelsError, setReelsError] = useState('');
  const [reelsFilterObjective, setReelsFilterObjective] = useState<string>('all');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<PublicReelsCalendarDay | null>(null);
  const [copiedReelDay, setCopiedReelDay] = useState<number | null>(null);
  const [copiedAllCalendar, setCopiedAllCalendar] = useState(false);

  // Plans
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [banner, setBanner] = useState('');

  const loadingSteps = [
    'Conectando ao perfil e checando presença no Instagram...',
    'Consultando dados oficiais da Meta Instagram Business Discovery...',
    'Escaneando nível de tração e termômetro de potência algorítmica...',
    'Detectando vazamentos de atenção na bio e pontos de fuga...',
    'Calculando potencial inexplorado de alcance e novos seguidores em 90 dias...',
    'Gerando 30 ideias estratégicas, 10 Reels, carrosséis e sequências...',
    'Montando a Prévia de Potência e o cronograma trimestral completo...'
  ];

  useEffect(() => {
    // Load plans and server configuration
    api.getPlans().then((res) => {
      setPlans(res.plans);
      if (res.headlineBanner) setBanner(res.headlineBanner);
      setMetaStatus((prev) => ({ ...prev, configured: res.metaConfigured }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 900);
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingStepIndex(0);
      setElapsedSeconds(0);
    }
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isSubmitting]);

  const handleUsernameBlur = async () => {
    const clean = username.replace(/^@/, '').trim();
    if (!clean) return;

    try {
      const res = await api.checkMetaProfile(clean);
      setMetaStatus({
        tested: true,
        configured: res.status === 'connected',
        message: res.message
      });
      if (res.status === 'connected' && res.data) {
        if (res.data.biography && !manualBio) setManualBio(res.data.biography);
      }
    } catch {
      // ignore
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSubmitting(false);
    setErrorMessage('Geração cancelada a seu pedido. Suas informações foram mantidas para você tentar novamente quando desejar.');
  };

  const cleanTypedUser = username.replace(/^@/, '').trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser) {
      setErrorMessage('Por favor, informe o seu @usuario do Instagram.');
      return;
    }

    if (!lgpdConsent) {
      setErrorMessage('Por favor, confirme seu consentimento LGPD para continuar.');
      return;
    }

    setIsSubmitting(true);
    setElapsedSeconds(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.generateReport({
        username: cleanUser,
        profession: profession.trim() || undefined,
        niche: niche.trim() || undefined,
        product: product.trim() || undefined,
        objective: objective.trim() || undefined,
        manualBio: manualBio.trim() || undefined,
        manualCaptions: manualCaptions.trim() || undefined,
        lgpdConsent,
        userId
      });

      if (response.success && response.reportId) {
        onReportGenerated(response.reportId);
      } else {
        throw new Error('Falha ao processar a resposta do servidor.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na geração do relatório. Tente novamente.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const handleGenerateCalendar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setReelsError('');
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean) {
      setReelsError('Por favor, informe o seu @ do Instagram.');
      return;
    }

    setGeneratingCalendar(true);
    try {
      const res = await api.generate30DaysReelsDemo({
        username: clean
      });
      if (res.success && res.demo) {
        setReelsResult(res.demo);
        setTimeout(() => {
          document.getElementById('calendario-30-dias-container')?.scrollIntoView({ behavior: 'smooth' });
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

  const handleCopyReelDay = (day: PublicReelsCalendarDay) => {
    const text = `🎬 REEL DIA ${day.day}: ${day.theme}
🎯 OBJETIVO: ${day.strategicObjective}

⏱️ GANCHO 3 SEGUNDOS:
${day.hook3s}

📝 ROTEIRO / ESTRUTURA:
${day.scriptStructure}

💡 SUGESTÃO DE DESENVOLVIMENTO:
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
    const header = `📅 CALENDÁRIO EDITORIAL DE 30 DIAS - @${reelsResult.username.toUpperCase()}\nNicho: ${reelsResult.confirmedNiche}\n\n`;
    const daysText = reelsResult.calendar
      .map(
        (day) =>
          `📌 DIA ${day.day} [${day.strategicObjective}]\nTema: ${day.theme}\nGancho (3s): "${day.hook3s}"\nRoteiro: ${day.scriptStructure}\nCTA: ${day.cta}\n`
      )
      .join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(header + daysText);
    setCopiedAllCalendar(true);
    setTimeout(() => setCopiedAllCalendar(false), 2500);
  };

  return (
    <div className="relative w-full overflow-hidden transition-colors duration-200">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#ee4957]/10 dark:bg-[#ee4957]/12 blur-[130px] rounded-full pointer-events-none -z-10 animate-glow" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-[#ee4957]/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Top Banner if configured */}
      {banner && (
        <div className="w-full bg-gradient-to-r from-[#ee4957]/15 via-[#ee4957]/25 to-[#ee4957]/15 dark:from-[#ee4957]/20 dark:via-[#ee4957]/30 dark:to-[#ee4957]/20 border-b border-[#ee4957]/30 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
            <Zap className="w-4 h-4 text-[#ee4957] fill-[#ee4957]" />
            <span>{banner}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#16161c] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#ee4957]"></span>
          <span>Estratégia Trimestral de 90 Dias & Projeção de Seguidores</span>
          <span className="text-zinc-400 dark:text-zinc-500">•</span>
          <span className="text-[#ee4957]">Edição 2026</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.15] font-heading">
          Descubra o potencial do seu{' '}
          <span className="bg-gradient-to-r from-[#ee4957] via-[#ff6b78] to-[#ee4957] dark:to-[#ffffff] bg-clip-text text-transparent">
            Instagram
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Transforme seguidores em clientes com um diagnóstico profundo de posicionamento, projeção realista de novos seguidores e cronograma trimestral completo de 90 dias sob medida para o seu nicho.
        </p>

        {/* Callout to Calendário de 30 Dias */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              document.getElementById('calendario-30-dias')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#15151c] hover:bg-zinc-50 dark:hover:bg-[#1a1a24] border-2 border-[#ee4957] text-xs font-bold text-zinc-900 dark:text-white transition-all transform hover:scale-105 shadow-md shadow-[#ee4957]/15 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#ee4957]" />
            <span>Gerar Calendário de 30 Dias</span>
            <span className="px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[10px] font-black uppercase tracking-wider">
              Apenas com seu @
            </span>
          </button>
        </div>

        {/* Form Container */}
        <div id="analisador" className="mt-10 max-w-2xl mx-auto text-left">
          <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-xl transition-colors">
            {/* Top coral edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ee4957] to-transparent" />

            {/* Error box with instant retry */}
            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-start justify-between gap-3 text-red-800 dark:text-red-200 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#ee4957] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Atenção na Geração:</p>
                    <p className="text-xs leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {isSubmitting ? (
              /* Resilient Loading screen with elapsed counter and Cancel button */
              <div className="py-10 px-4 text-center space-y-5">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#ee4957] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#ee4957] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                    Construindo seu Mapa de Conteúdo Estratégico
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Analisando perfil <span className="text-[#ee4957] font-semibold">@{username.replace(/^@/, '')}</span>
                  </p>
                </div>

                {/* Live elapsed timer badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tempo decorrido: <strong className="text-[#ee4957] font-mono">{elapsedSeconds}s</strong></span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500">Pipeline Rápido com Gemini 2.5</span>
                </div>

                {/* Step indicator */}
                <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl max-w-md mx-auto text-left">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ee4957] animate-ping" />
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-all duration-300">
                      {loadingSteps[loadingStepIndex]}
                    </p>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#ee4957] to-[#ff7b88] h-full transition-all duration-500"
                      style={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancelar geração
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500">
                  Gerando diagnóstico, 30 ideias, 10 reels, 10 carrosséis, 10 stories e cronograma de 90 dias.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mandatory Instagram username field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                    Usuário do Instagram <span className="text-[#ee4957]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={handleUsernameBlur}
                      placeholder="@seu.perfil"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957] focus:ring-1 focus:ring-[#ee4957] text-base transition-all font-medium"
                    />
                  </div>

                  {/* Dynamic Instagram Profile Box Preview */}
                  {cleanTypedUser && (
                    <div className="mt-3 p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ee4957] via-[#ff6b78] to-[#ffc0c6] p-0.5 shrink-0">
                          <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-xs text-[#ee4957]">
                            {cleanTypedUser.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              @{cleanTypedUser}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#ee4957]/15 text-[#ee4957]">
                              Instagram
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            Prévia de Potência, projeção de seguidores & cronograma sob medida para este perfil
                          </p>
                        </div>
                      </div>

                      <a
                        href={`https://instagram.com/${cleanTypedUser}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-[#ee4957] hover:text-white dark:hover:bg-[#ee4957] text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm group"
                        title="Ver perfil oficial no Instagram (abre em nova aba)"
                      >
                        <Instagram className="w-3.5 h-3.5 text-[#ee4957] group-hover:text-white" />
                        <span>Abrir perfil</span>
                      </a>
                    </div>
                  )}

                  <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Digite o perfil exato. Perfis públicos comerciais podem ser consultados via Meta Graph API.
                  </p>
                </div>

                {/* Transparent Meta API notice */}
                {metaStatus.tested && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      metaStatus.configured
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Info className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-900 dark:text-white">Status da Conexão Meta:</p>
                      <p>{metaStatus.message}</p>
                      {!metaStatus.configured && (
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                          💡 Dica: Preencha os campos complementares abaixo com sua bio e legendas para uma análise 100% personalizada e precisa.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Toggle Optional Form */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOptionalForm(!showOptionalForm)}
                    className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#ee4957]" />
                      Personalização Estratégica Avançada (Opcional)
                    </span>
                    {showOptionalForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showOptionalForm && (
                    <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/70 space-y-4 text-xs animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Sua Profissão / Atuação
                          </label>
                          <input
                            type="text"
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            placeholder="Ex: Nutricionista, Mentor, Loja de Roupas"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Nicho Específico
                          </label>
                          <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Ex: Emagrecimento pós-parto, Moda sustentável"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Principal Produto / Serviço Vendido
                          </label>
                          <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="Ex: Consultoria de R$ 900, Curso online"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Principal Objetivo Comercial
                          </label>
                          <select
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                          >
                            <option value="Atrair seguidores compradores e aumentar autoridade">
                              Atrair seguidores compradores e autoridade
                            </option>
                            <option value="Aumentar vendas de produtos/serviços no Direct">
                              Aumentar vendas e leads no Direct
                            </option>
                            <option value="Destravar o engajamento e alcance com Reels">
                              Destravar alcance e engajamento com Reels
                            </option>
                            <option value="Construir posicionamento premium de alto valor">
                              Construir posicionamento de alto valor
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Manual bio & captions fallback if Meta API is not connected */}
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold text-[11px]">
                          <Info className="w-3.5 h-3.5 text-[#ee4957]" />
                          <span>Alternativa Transparente (Bio & Legendas Recentes):</span>
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                            Biografia atual do Instagram:
                          </label>
                          <textarea
                            rows={2}
                            value={manualBio}
                            onChange={(e) => setManualBio(e.target.value)}
                            placeholder="Cole aqui o texto exato da sua bio atual do perfil..."
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                            Exemplos de legendas ou tópicos recentes que você já postou:
                          </label>
                          <textarea
                            rows={2}
                            value={manualCaptions}
                            onChange={(e) => setManualCaptions(e.target.value)}
                            placeholder="Cole trechos de legendas para refinarmos o tom de voz e estilo..."
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LGPD Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[#ee4957] focus:ring-[#ee4957] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                      Concordo com o tratamento dos dados informados para geração da análise estratégica conforme a{' '}
                      <button
                        type="button"
                        onClick={onOpenLgpd}
                        className="text-[#ee4957] underline hover:text-[#ff7b88]"
                      >
                        LGPD e a Política de Privacidade
                      </button>
                      . Não fazemos scraping ilegal nem vendemos seus dados.
                    </span>
                  </label>
                </div>

                {/* Main Action Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-[#ee4957]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-white text-white" />
                  <span>Analisar perfil & Gerar Prévia de Potência</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center flex items-center justify-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#ee4957]" />
                  <span>Prévia de Potência Gratuita com Raio-X de Vazamentos antes de contratar qualquer plano</span>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#ee4957]" />
            <span>100% em conformidade com LGPD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sem scraping não autorizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Processamento com Gemini 3.8 Flash</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SEÇÃO: CALENDÁRIO EDITORIAL DE 30 DIAS (FORMATO DE CALENDÁRIO) */}
      {/* ========================================================= */}
      <section id="calendario-30-dias" className="py-16 md:py-20 max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-10">
        <div id="demonstracao-inteligente" className="bg-gradient-to-b from-[#14141a] via-[#101014] to-[#0c0c10] border-2 border-[#ee4957]/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle top edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ee4957] to-transparent" />

          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ee4957]/15 border border-[#ee4957]/30 text-[#ee4957] text-xs font-black uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário Editorial de 30 Dias • Formato de Grade Mensal</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Calendário de 30 Dias do seu <span className="text-[#ee4957]">Instagram</span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Digite somente o seu @ do Instagram. Nossa inteligência artificial analisa o nicho real do seu perfil e gera instantaneamente o seu cronograma editorial completo de 30 dias em formato de calendário.
            </p>
          </div>

          {/* Único Campo: Input do Instagram @ */}
          <div className="max-w-xl mx-auto space-y-4">
            <form onSubmit={handleGenerateCalendar} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={demoInstagram}
                  onChange={(e) => setDemoInstagram(e.target.value)}
                  placeholder="seu.instagram (ex: dr.carlos, nutri.carol)"
                  disabled={generatingCalendar}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ee4957] shadow-inner disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={generatingCalendar || !demoInstagram.trim()}
                className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingCalendar ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando Calendário...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Gerar Calendário de 30 Dias</span>
                  </>
                )}
              </button>
            </form>

            {/* Loading indicator */}
            {generatingCalendar && (
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#ee4957]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando perfil @{demoInstagram.replace(/^@/, '')} e estruturando calendário com IA...</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Mapeando 30 dias com temas, ganchos de 3s, roteiros, chamadas para ação e distribuição entre os 7 pilares estratégicos.
                </p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ee4957] via-[#ff6b78] to-[#ee4957] animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {/* Error box */}
            {reelsError && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                  <span>{reelsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateCalendar()}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-[#ee4957] text-white text-[11px] font-bold cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* APRESENTAÇÃO APENAS EM FORMATO DE CALENDÁRIO */}
          {reelsResult && (
            <div id="calendario-30-dias-container" className="mt-12 space-y-6 pt-6 border-t border-zinc-800 animate-in fade-in duration-300">
              {/* Header do Calendário */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ee4957]/15 border border-[#ee4957]/30 text-[#ee4957] text-[11px] font-black uppercase">
                      @{reelsResult.username}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Nicho: <strong className="text-white font-semibold">{reelsResult.confirmedNiche}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                    Calendário Editorial Mensal de 30 Dias
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Clique em qualquer dia do calendário para ver o roteiro detalhado, gancho inicial e CTA.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Filtro por Objetivo */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Objetivo:</span>
                    <select
                      value={reelsFilterObjective}
                      onChange={(e) => setReelsFilterObjective(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#ee4957]"
                    >
                      <option value="all">Todos os Objetivos (30 Dias)</option>
                      <option value="Autoridade">Autoridade</option>
                      <option value="Educação">Educação</option>
                      <option value="Identificação com o público">Identificação com o público</option>
                      <option value="Quebra de objeções">Quebra de objeções</option>
                      <option value="Prova de conhecimento">Prova de conhecimento</option>
                      <option value="Engajamento">Engajamento</option>
                      <option value="Conversão e vendas">Conversão e vendas</option>
                    </select>
                  </div>

                  {/* Copiar Calendário Completo */}
                  <button
                    type="button"
                    onClick={handleCopyAllCalendar}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedAllCalendar ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                        <span>Copiar Calendário (Texto)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* GRADE VISUAL DO CALENDÁRIO (7 COLUNAS: SEG A DOM) */}
              <div className="space-y-2">
                {/* Cabeçalho dos Dias da Semana */}
                <div className="hidden lg:grid grid-cols-7 gap-2.5 text-center text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1">
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Segunda</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Terça</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Quarta</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Quinta</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Sexta</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Sábado</div>
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">Domingo</div>
                </div>

                {/* Grade dos 30 Dias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {reelsResult.calendar
                    .filter((item) => reelsFilterObjective === 'all' || item.strategicObjective === reelsFilterObjective)
                    .map((reel) => {
                      // Color mapping for strategic objectives
                      let badgeColor = 'bg-[#ee4957]/15 text-[#ee4957] border-[#ee4957]/30';
                      if (reel.strategicObjective === 'Educação') {
                        badgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
                      } else if (reel.strategicObjective === 'Identificação com o público') {
                        badgeColor = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
                      } else if (reel.strategicObjective === 'Quebra de objeções') {
                        badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                      } else if (reel.strategicObjective === 'Prova de conhecimento') {
                        badgeColor = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
                      } else if (reel.strategicObjective === 'Engajamento') {
                        badgeColor = 'bg-pink-500/15 text-pink-400 border-pink-500/30';
                      } else if (reel.strategicObjective === 'Conversão e vendas') {
                        badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                      }

                      return (
                        <div
                          key={reel.day}
                          onClick={() => setSelectedCalendarDay(reel)}
                          className="group relative p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ee4957] hover:bg-zinc-850/90 transition-all cursor-pointer flex flex-col justify-between min-h-[175px] shadow-sm hover:shadow-lg hover:shadow-[#ee4957]/10"
                        >
                          <div className="space-y-2">
                            {/* Top row: Day number and reel icon */}
                            <div className="flex items-center justify-between gap-1 border-b border-zinc-800 pb-2">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-800 group-hover:bg-[#ee4957] text-white text-[11px] font-black transition-colors">
                                Dia {reel.day}
                              </span>
                              <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                                <Video className="w-3 h-3 text-[#ee4957]" />
                                Reel
                              </span>
                            </div>

                            {/* Strategic Objective pill */}
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border truncate max-w-full ${badgeColor}`}>
                                {reel.strategicObjective}
                              </span>
                            </div>

                            {/* Theme */}
                            <h4 className="text-xs font-bold text-white group-hover:text-[#ee4957] transition-colors line-clamp-3 leading-snug font-heading">
                              {reel.theme}
                            </h4>
                          </div>

                          {/* Click prompt */}
                          <div className="pt-2 mt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400 group-hover:text-white">
                            <span>Ver Roteiro</span>
                            <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform text-[#ee4957]" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* MODAL DE DETALHES DO DIA DO CALENDÁRIO */}
              {selectedCalendarDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="relative w-full max-w-2xl bg-[#121217] border-2 border-[#ee4957]/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                    {/* Botão fechar */}
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarDay(null)}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header do dia */}
                    <div className="space-y-2 border-b border-zinc-800 pb-4 pr-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-[#ee4957] text-white text-xs font-black uppercase">
                          Dia {selectedCalendarDay.day} de 30
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ee4957]/15 text-[#ee4957] border border-[#ee4957]/30">
                          {selectedCalendarDay.strategicObjective}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Formato: <strong>Instagram Reel</strong>
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-2xl font-black text-white font-heading">
                        {selectedCalendarDay.theme}
                      </h3>
                    </div>

                    {/* Conteúdo do roteiro */}
                    <div className="space-y-4 text-xs">
                      {/* Gancho 3 segundos */}
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ee4957] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Gancho Inicial (Primeiros 3 Segundos):</span>
                        </span>
                        <p className="text-sm text-zinc-100 font-medium italic">
                          "{selectedCalendarDay.hook3s}"
                        </p>
                      </div>

                      {/* Roteiro */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Roteiro / Estrutura do Vídeo:</span>
                        <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                          {selectedCalendarDay.scriptStructure}
                        </p>
                      </div>

                      {/* Desenvolvimento */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sugestão de Desenvolvimento:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/50 p-3 rounded-xl border border-zinc-850">
                          {selectedCalendarDay.contentDevelopment}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="p-3 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/25 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#ee4957]">Chamada para Ação (CTA):</span>
                        <p className="text-xs text-white font-semibold">
                          {selectedCalendarDay.cta}
                        </p>
                      </div>

                      {/* Legenda */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Legenda Sugerida:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                          {selectedCalendarDay.suggestedCaption}
                        </p>
                      </div>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedCalendarDay.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] font-mono text-[#ee4957] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ações do Modal */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={selectedCalendarDay.day <= 1}
                          onClick={() => {
                            const prev = reelsResult.calendar.find((r) => r.day === selectedCalendarDay.day - 1);
                            if (prev) setSelectedCalendarDay(prev);
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Dia Anterior</span>
                        </button>
                        <button
                          type="button"
                          disabled={selectedCalendarDay.day >= 30}
                          onClick={() => {
                            const next = reelsResult.calendar.find((r) => r.day === selectedCalendarDay.day + 1);
                            if (next) setSelectedCalendarDay(next);
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                        >
                          <span>Próximo Dia</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyReelDay(selectedCalendarDay)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer"
                      >
                        {copiedReelDay === selectedCalendarDay.day ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Roteiro Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Roteiro do Dia {selectedCalendarDay.day}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Convite Comercial ao Final do Calendário */}
              <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#181822] via-[#15151e] to-[#181822] border-2 border-[#ee4957]/50 space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4957]/20 text-[#ee4957] text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Calendário de 30 Dias Gerado com Sucesso</span>
                </div>

                <h3 className="text-xl sm:text-3xl font-extrabold text-white font-heading max-w-2xl mx-auto">
                  Gostou da estratégia? Desbloqueie o <span className="text-[#ee4957]">Mapa Completo</span>
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                  Este calendário demonstrou a inteligência aplicada ao seu nicho. Para desbloquear o <strong>Diagnóstico de Posicionamento</strong>, <strong>Reescrita Magnética da Bio</strong>, <strong>Projeção de Novos Seguidores em 90 Dias</strong>, <strong>10 Carrosséis Estruturados</strong> e <strong>10 Sequências de Stories de Vendas</strong>, conheça nossos planos comerciais com liberação imediata via Hotmart.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Conhecer os Planos Oficiais</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('comparison')}
                    className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ee4957]" />
                    <span>Ver Comparativo Detalhado de Planos</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Deliverables Grid (O que você recebe) */}
      <section id="como-funciona" className="py-16 md:py-24 bg-zinc-100/60 dark:bg-[#0c0c10] border-y border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white font-heading">
              O que você recebe no seu{' '}
              <span className="text-[#ee4957]">Mapa de Conteúdo</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Chega de travar sem saber o que postar ou publicar conteúdos que não vendem. Tudo é desenhado cirurgicamente para o seu nicho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading">
                Diagnóstico de Posicionamento
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Análise crítica da sua Bio atual, o que está afastando compradores, reescrita magnética da bio e mapeamento dos 4 pilares estratégicos de autoridade.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading">
                30 Ideias de Conteúdo
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                30 temas completos, separados por objetivos estratégicos (Atração, Retenção e Conversão), com ganchos fortes e direcionamento de legenda.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading">
                10 Roteiros de Reels Prontos
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Roteiros passo a passo com ganchos visuais e verbais nos primeiros 3 segundos, quebra de padrão, tempo estimado e CTAs para comentários ou DM.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading">
                10 Carrosséis Estruturados
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Headlines magnéticas de capa e divisão slide a slide (1 ao 7+) com textos diretos e notas de design visual para reter a atenção e gerar salvamentos.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading flex items-center gap-2">
                <span>Projeção de Seguidores</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#ee4957]/15 text-[#ee4957]">
                  Novo
                </span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Estimativa matemática com 3 cenários em 90 dias (Conservador, Realista e Acelerado), volume de alcance esperado e previsão de leads que chamarão na DM.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 hover:border-[#ee4957]/40 shadow-sm transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957] mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-heading">
                Calendário Trimestral (90 Dias)
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Cronograma completo dividido nas 3 fases essenciais: Mês 1 (Fundação e Atração), Mês 2 (Autoridade e Conexão) e Mês 3 (Escala e Conversão de Clientes).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Planos Section */}
      <section id="planos" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4957]/10 text-[#ee4957] text-xs font-bold mb-3">
            <span>Investimento Inteligente</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white font-heading">
            Escolha o plano ideal para a sua fase
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Você pode gerar a prévia gratuita do seu diagnóstico agora e desbloquear o planejamento completo através do checkout seguro da Hotmart.
          </p>

          <div className="mt-4">
            <button
              onClick={() => onNavigate('comparison')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ee4957]" />
              <span>Ver Matriz Comparativa Detalhada dos 3 Planos</span>
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'bg-white dark:bg-[#15151b] border-2 border-[#ee4957] shadow-xl dark:shadow-2xl dark:shadow-[#ee4957]/20 scale-105 z-10'
                  : 'bg-white dark:bg-[#101014] border border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
              } p-6 sm:p-8`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#ee4957] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">{plan.name}</h3>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 min-h-[32px]">{plan.description}</p>

                <div className="mt-6 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                      R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {plan.installments && (
                    <p className="text-[11px] text-[#ee4957] font-semibold mt-1">
                      ou até {plan.installments}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => {
                    document.getElementById('analisador')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    plan.isPopular
                      ? 'bg-[#ee4957] hover:bg-[#d93c4a] text-white shadow-lg shadow-[#ee4957]/30'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                  }`}
                >
                  Começar com @{username.replace(/^@/, '') || 'seu.perfil'}
                </button>
                <p className="mt-2 text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  Pagamento Seguro via Hotmart • Garantia de 7 dias
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Banner: Solicitação de Acesso Gratuito */}
        <div className="mt-12 max-w-xl mx-auto">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 text-left space-y-3.5 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Processo por Análise</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                Solicitar Acesso Gratuito
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                O acesso gratuito tradicional requer aprovação prévia do administrador. Envie seus dados para análise e ativação via convite seguro por e-mail (48h).
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('solicitar-acesso')}
                className="w-full py-3 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Solicitar Acesso Gratuito</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-zinc-100/60 dark:bg-[#0c0c10] border-t border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-heading">
              Perguntas Frequentes
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Tire todas as suas dúvidas sobre a geração e liberação da estratégia.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ee4957]" />
                Preciso informar minha senha do Instagram?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                <strong>Nunca!</strong> Jamais solicitaremos sua senha. Analisamos exclusivamente os dados públicos através da API oficial da Meta ou através das informações que você mesmo preenche na tela.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ee4957]" />
                Como funciona a demonstração de 30 dias de Reels na página inicial?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                Você informa o seu @ do Instagram e a inteligência artificial analisa seu perfil para identificar automaticamente o seu nicho. Após confirmar ou ajustar seu nicho, a plataforma gera instantaneamente 30 roteiros de Reels com ganchos de 3 segundos, estrutura de roteiro, CTAs e hashtags direcionadas, distribuídos entre os 7 pilares estratégicos de conteúdo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ee4957]" />
                Como funciona o teste do Plano Essencial?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                A liberação de demonstração de 7 dias do Plano Essencial é restrita e concedida exclusivamente pelo administrador no painel de gestão para parceiros convidados. O sistema gera um convite seguro e exclusivo por e-mail com validade de 48 horas para ativação. Visitantes comuns não solicitam o teste do Plano Essencial diretamente pelo site.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ee4957]" />
                E se meu perfil for privado ou recente?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                Sem problemas! Você pode utilizar a opção de personalização avançada para informar sua bio atual, nicho e temas que pretende abordar. A IA gerará um planejamento cirúrgico adaptado aos seus objetivos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ee4957]" />
                Tenho garantia ao contratar planos pagos?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                Sim! Todos os planos pagos contam com a garantia incondicional de 7 dias da Hotmart. Se por qualquer motivo não ficar satisfeito, solicite reembolso total diretamente na Hotmart.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
