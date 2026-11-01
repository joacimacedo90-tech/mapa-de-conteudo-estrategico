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
  X
} from 'lucide-react';
import { api } from '../api';
import { PricingPlan } from '../types';

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

  // Demo Plan Essencial modal states
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoError, setDemoError] = useState('');

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

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError('');

    if (!demoName.trim()) {
      setDemoError('Por favor, digite seu nome completo.');
      return;
    }
    if (!demoEmail.trim() || !demoEmail.includes('@')) {
      setDemoError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setDemoSubmitting(true);
    try {
      await api.requestDemoAccess({
        name: demoName.trim(),
        email: demoEmail.trim().toLowerCase()
      });
      setDemoSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação de demonstração.';
      setDemoError(msg);
    } finally {
      setDemoSubmitting(false);
    }
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

        {/* Highlighted Experimentar Plano Essencial Button */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDemoSubmitted(false);
              setDemoError('');
              setShowDemoModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#15151c] hover:bg-zinc-50 dark:hover:bg-[#1a1a24] border-2 border-[#ee4957] text-xs font-bold text-zinc-900 dark:text-white transition-all transform hover:scale-105 shadow-md shadow-[#ee4957]/15 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#ee4957]" />
            <span>Experimentar Plano Essencial</span>
            <span className="px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[10px] font-black uppercase tracking-wider">
              Demonstração Gratuita
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

        {/* Dual Banner: Demonstração Plano Essencial & Solicitação de Acesso Gratuito */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Demonstração Gratuita do Plano Essencial */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#ee4957]/10 via-white dark:via-[#131318] to-white dark:to-[#101014] border-2 border-[#ee4957]/50 text-left space-y-3.5 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4957]/15 text-[#ee4957] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demonstração Gratuita</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                Experimentar Plano Essencial
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Quer testar o potencial do Mapa de Conteúdo antes de contratar? Solicite a liberação manual pelo administrador e receba acesso para gerar sua análise estratégica completa.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setDemoSubmitted(false);
                  setDemoError('');
                  setShowDemoModal(true);
                }}
                className="w-full py-3 px-5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer"
              >
                <span>Experimentar Plano Essencial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Acesso Gratuito Avaliado */}
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
                Como funciona a demonstração gratuita do Plano Essencial?
              </h4>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                Basta preencher seu nome e e-mail no formulário de demonstração. O administrador receberá a notificação para aprovação. Ao ser liberado, você recebe um convite individual com link seguro válido por 48 horas para criar sua senha e usar as funcionalidades do Plano Essencial sem custo.
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

      {/* Modal: Experimentar Plano Essencial */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#121217] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {demoSubmitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-heading">
                    Solicitação recebida! Aguarde a liberação do seu acesso.
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Seu pedido de demonstração gratuita do <strong>Plano Essencial</strong> foi registrado com sucesso. O administrador foi notificado e irá analisar sua liberação.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Você receberá um e-mail com link de ativação seguro de uso único para criar sua senha assim que aprovado.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    className="w-full py-3 px-4 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4957]/15 text-[#ee4957] text-[10px] font-black uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>Demonstração Gratuita</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white font-heading">
                    Experimentar Plano Essencial
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Preencha os campos abaixo para solicitar ao administrador sua demonstração gratuita do Plano Essencial.
                  </p>
                </div>

                {demoError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                    <span>{demoError}</span>
                  </div>
                )}

                <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      Nome completo <span className="text-[#ee4957]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      placeholder="Ex: Maria Silva"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      E-mail <span className="text-[#ee4957]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      O convite seguro de ativação com validade de 48 horas será enviado para este e-mail.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      className="w-full py-3.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{demoSubmitting ? 'Enviando solicitação...' : 'Enviar Solicitação de Demonstração'}</span>
                    </button>
                  </div>
                </form>

                <p className="text-[10px] text-zinc-500 text-center">
                  Não solicitamos dados de cartão de crédito. Liberação sujeita a aprovação manual.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
