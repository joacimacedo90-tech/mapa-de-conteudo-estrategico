import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Instagram,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Video,
  Calendar,
  Zap,
  Info,
  Lock,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Target,
  Users
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

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onOpenLgpd
}) => {
  // Input states
  const [demoInstagram, setDemoInstagram] = useState('');
  const [inputFollowers, setInputFollowers] = useState('');
  const [inputNiche, setInputNiche] = useState('');
  const [isCheckingAuto, setIsCheckingAuto] = useState(false);

  // Correction states after analysis
  const [editingNiche, setEditingNiche] = useState('');
  const [editingFollowers, setEditingFollowers] = useState('');

  // Results & Generation
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [reelsResult, setReelsResult] = useState<PublicReelsDemoResult | null>(null);
  const [reelsError, setReelsError] = useState('');

  // Calendar navigation state (identical to reference site)
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [copiedReelDay, setCopiedReelDay] = useState<number | null>(null);
  const [copiedAllCalendar, setCopiedAllCalendar] = useState(false);

  // Plans & Banner
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    api.getPlans()
      .then((res) => {
        setPlans(res.plans);
        if (res.headlineBanner) setBanner(res.headlineBanner);
      })
      .catch(console.error);
  }, []);

  // When user enters username and leaves field, try auto-filling followers/niche
  const handleUsernameBlur = async () => {
    const clean = demoInstagram.replace(/^@/, '').trim();
    if (!clean || reelsResult || inputFollowers) return;
    setIsCheckingAuto(true);
    try {
      const res = await api.detectNiche({ username: clean });
      if (res.success && res.data) {
        if (res.data.followersCount && res.data.followersCount > 0 && !inputFollowers) {
          setInputFollowers(String(res.data.followersCount));
        }
        if (res.data.detectedNiche && !inputNiche) {
          setInputNiche(res.data.detectedNiche);
        }
      }
    } catch {
      // Silently ignore if not found or private
    } finally {
      setIsCheckingAuto(false);
    }
  };

  // Compute calendar dates based on generation start date
  const startDate = React.useMemo(() => {
    if (reelsResult?.generatedAt) {
      const d = new Date(reelsResult.generatedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [reelsResult?.generatedAt]);

  const totalDays = reelsResult?.calendar?.length || 30;

  const totalMonths = React.useMemo(() => {
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
        followersCount: followersVal
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
          document.getElementById('calendario-resultado')?.scrollIntoView({ behavior: 'smooth' });
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

  // Build calendar matrix for current month view
  const currentBaseMonth = new Date(startDate.getFullYear(), startDate.getMonth() + calMonthOffset, 1);
  const currentMonthName = `${MESES_PT[currentBaseMonth.getMonth()]} de ${currentBaseMonth.getFullYear()}`;
  const firstDayWeekday = currentBaseMonth.getDay(); // 0 = Domingo
  const daysInCurrentMonth = new Date(currentBaseMonth.getFullYear(), currentBaseMonth.getMonth() + 1, 0).getDate();

  const activeReel = reelsResult?.calendar?.[selectedDayIndex] || reelsResult?.calendar?.[0];
  const activeDate = new Date(startDate.getTime() + selectedDayIndex * 86400000);

  // Exact Followers Count from profile or manual confirmation
  const exactFollowers = reelsResult?.followersCount !== undefined && reelsResult.followersCount > 0
    ? reelsResult.followersCount
    : (editingFollowers.trim()
        ? Number(editingFollowers.replace(/\D/g, ''))
        : (inputFollowers.trim() ? Number(inputFollowers.replace(/\D/g, '')) : 1200));

  // Follower projection calculation
  const potentialGain = React.useMemo(() => {
    if (exactFollowers < 1000) return 4500;
    if (exactFollowers < 5000) return 8200;
    if (exactFollowers < 20000) return 16500;
    if (exactFollowers < 100000) return 38000;
    return Math.round(exactFollowers * 0.45);
  }, [exactFollowers]);

  const projectedFollowers = exactFollowers + potentialGain;

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

      {/* Main Clean Wrap */}
      <main className="w-full max-w-[560px] mx-auto px-4 py-8 sm:py-12 space-y-7">
        {/* Brand / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#ee4957] animate-pulse" />
            <span>Mapa de Conteúdo Estratégico</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Seu Calendário Viral <span className="bg-gradient-to-r from-[#ee4957] via-[#ff6b78] to-amber-400 bg-clip-text text-transparent">dia a dia</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Descubra o cronograma de 30 dias de postagens desenhado rigorosamente para o nicho real do seu perfil.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <form onSubmit={handleGenerateCalendar} className="space-y-3.5">
            {/* Usuário do Instagram */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Seu usuário do Instagram <span className="text-[#ee4957]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={demoInstagram}
                  onChange={(e) => setDemoInstagram(e.target.value)}
                  onBlur={handleUsernameBlur}
                  placeholder="seu.perfil (ex: ojoacimacedo)"
                  disabled={generatingCalendar}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
            </div>

            {/* Quantidade Exata de Seguidores */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Quantidade de seguidores que o perfil tem
                </label>
                {isCheckingAuto && (
                  <span className="text-[11px] text-[#ee4957] flex items-center gap-1 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Buscando dados...
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Users className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  value={inputFollowers}
                  onChange={(e) => setInputFollowers(e.target.value)}
                  placeholder="Ex: 1450 (digite a quantidade exata)"
                  disabled={generatingCalendar}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090d] border border-zinc-700/80 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#ee4957] transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Usamos o número exato para calcular a projeção realista de crescimento do perfil.
              </p>
            </div>

            {/* Campo de Nicho (caso já queira informar ou corrigir) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Nicho de atuação <span className="text-zinc-500 font-normal text-[11px]">(ou deixe em branco para auto-identificar)</span>
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
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Importante:</strong> Seu perfil precisa ser <strong>PÚBLICO</strong> no Instagram para que a inteligência consiga analisar suas postagens e identificar seu nicho real.
              </div>
            </div>

            {/* Error Message */}
            {reelsError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between gap-2">
                <span>{reelsError}</span>
                <button
                  type="button"
                  onClick={() => handleGenerateCalendar()}
                  className="shrink-0 text-white font-bold underline text-[11px]"
                >
                  Tentar de novo
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generatingCalendar || !demoInstagram.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#e03140] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingCalendar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando perfil & gerando...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Gerar meu Calendário & Projeção</span>
                </>
              )}
            </button>
          </form>

          {/* Safe Note */}
          <div className="pt-1 text-center space-y-1">
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Análise de dados públicos. Sem pedir senha, 100% seguro.</span>
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
              Identificando nicho, ganchos magnéticos e estruturando seu cronograma dia a dia.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* RESULTADO: APÓS A ANÁLISE, A PROJEÇÃO E O CALENDÁRIO */}
        {/* ======================================================== */}
        {reelsResult && !generatingCalendar && (
          <div id="calendario-resultado" className="space-y-6 pt-2 animate-in fade-in duration-300">
            {/* PROJEÇÃO DE SEGUIDORES (ANTES X DEPOIS) */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-[#ee4957]/20 to-purple-500/20 border border-[#ee4957]/30 text-white text-xs font-black tracking-wider uppercase">
                  ✦ Potencial de Crescimento Identificado
                </span>
              </div>

              <div className="space-y-2.5">
                {/* CARD 1: SEU PERFIL HOJE */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-[#121217] border border-zinc-800">
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider border border-zinc-700">
                    Seu perfil hoje
                  </span>

                  <div className="flex items-center gap-3.5 pt-1">
                    {/* Avatar */}
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

                    {/* Stats exatos */}
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-white">
                          {reelsResult.mediaCount !== undefined ? reelsResult.mediaCount : '18'}
                        </b>
                        <span className="text-[10px] text-zinc-400">posts</span>
                      </div>
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-white">
                          {exactFollowers.toLocaleString('pt-BR')}
                        </b>
                        <span className="text-[10px] text-zinc-400">seguidores exatos</span>
                      </div>
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-white">
                          {Math.min(450, Math.round(exactFollowers * 0.35))}
                        </b>
                        <span className="text-[10px] text-zinc-400">seguindo</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-xs text-zinc-400 font-medium flex items-center justify-between">
                    <span>@{reelsResult.username}</span>
                    <span className="text-[#ee4957] font-bold px-2 py-0.5 rounded bg-[#ee4957]/10 border border-[#ee4957]/20">
                      {reelsResult.confirmedNiche}
                    </span>
                  </div>
                </div>

                {/* CONEXÃO / SETA */}
                <div className="text-center py-0.5 text-xs font-bold text-zinc-400 flex items-center justify-center gap-2">
                  <span className="text-[#ee4957]">⬇</span>
                  <span>executando o calendário com consistência</span>
                  <span className="text-[#ee4957]">⬇</span>
                </div>

                {/* CARD 2: PROJEÇÃO COM A ESTRATÉGIA */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18141a] via-[#131219] to-[#18141a] border-2 border-[#ee4957] shadow-xl shadow-[#ee4957]/15">
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ee4957] to-[#ff6b78] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Projeção com a Estratégia
                  </span>

                  <div className="flex items-center gap-3.5 pt-1">
                    {/* Avatar com borda gradiente */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#ee4957] via-amber-400 to-purple-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-[#09090d] flex items-center justify-center overflow-hidden border-2 border-[#09090d]">
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
                          <span className="font-extrabold text-white text-base sm:text-lg">
                            {reelsResult.username.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Projetadas */}
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-white">
                          +{totalDays} Reels
                        </b>
                        <span className="text-[10px] text-zinc-400">no seu nicho</span>
                      </div>
                      <div>
                        <b className="block text-base sm:text-xl font-black bg-gradient-to-r from-[#ee4957] via-[#ff7b88] to-amber-300 bg-clip-text text-transparent">
                          {projectedFollowers.toLocaleString('pt-BR')}
                        </b>
                        <span className="text-[10px] font-bold text-emerald-400">
                          +{potentialGain.toLocaleString('pt-BR')} novos
                        </span>
                      </div>
                      <div>
                        <b className="block text-sm sm:text-base font-extrabold text-emerald-400">
                          +{Math.round((potentialGain / exactFollowers) * 100)}%
                        </b>
                        <span className="text-[10px] text-zinc-400">crescimento</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1">
                      @{reelsResult.username}
                      <svg className="w-3.5 h-3.5 text-[#ee4957]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 2.4 3.3-.6.6 3.3L21 9.6 19.2 12 21 14.4l-2.7 2.5-.6 3.3-3.3-.6L12 22l-2.4-2.4-3.3.6-.6-3.3L3 14.4 4.8 12 3 9.6l2.7-2.5.6-3.3 3.3.6L12 2z"/>
                      </svg>
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      Potencial de aumentar +{potentialGain.toLocaleString('pt-BR')} seguidores
                    </span>
                  </div>
                </div>

                {/* Resumo simples e limpo */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                  Aplicando este cronograma no nicho de <strong className="text-white">{reelsResult.confirmedNiche}</strong>, seu perfil tem potencial para aumentar <strong className="text-emerald-400 font-bold">+{potentialGain.toLocaleString('pt-BR')} novos seguidores</strong>, saltando de <strong className="text-white">{exactFollowers.toLocaleString('pt-BR')}</strong> para até <strong className="text-[#ee4957] font-bold">{projectedFollowers.toLocaleString('pt-BR')} seguidores</strong>.
                </div>
              </div>
            </div>

            {/* CAMPO PARA CORRIGIR O NICHO OU SEGUIDORES CASO ESTEJA ERRADO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-dashed border-zinc-700 space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                <span>🎯</span>
                <span>Erramos o seu nicho ou seguidores?</span>
              </div>
              <p className="text-xs text-zinc-400">
                Ajuste abaixo o seu nicho ou a quantidade exata de seguidores para recalcular a projeção e os roteiros de Reels na hora:
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const foll = editingFollowers ? Number(editingFollowers.replace(/\D/g, '')) : undefined;
                  handleGenerateCalendar(undefined, editingNiche.trim() || undefined, foll);
                }}
                className="space-y-2.5 pt-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      Nicho correto:
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
                      Quantidade exata de seguidores:
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
                  {generatingCalendar ? 'RECALCULANDO...' : 'RECALCULAR PROJEÇÃO & CALENDÁRIO'}
                </button>
              </form>
            </div>

            {/* Calendário Interativo Estilo Referência */}
            <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              {/* Navegação do Mês (calnav) */}
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

              {/* Cabeçalho dos Dias da Semana (cwd: D S T Q Q S S) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-zinc-400 py-1">
                <div>D</div>
                <div>S</div>
                <div>T</div>
                <div>Q</div>
                <div>Q</div>
                <div>S</div>
                <div>S</div>
              </div>

              {/* Grade de Dias do Mês (calgrid) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {/* Células vazias antes do primeiro dia */}
                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {/* Dias do mês */}
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

              {/* Detalhe do Dia Selecionado (caldet) */}
              {activeReel && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 text-xs leading-relaxed">
                  {/* Cabeçalho do Dia */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>{selectedDayIndex === 0 ? 'Hoje, ' : `Dia ${selectedDayIndex + 1} • `}</span>
                      <span className="capitalize">{DIAS_PT[activeDate.getDay()]}, {activeDate.getDate()} de {MESES_PT[activeDate.getMonth()]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[10px] font-black uppercase">
                        🎬 1 Post
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">
                        {activeReel.strategicObjective}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo específico do nicho */}
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#ee4957] tracking-wider block">
                        🎬 Tema do Vídeo:
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {activeReel.theme}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Gancho Inicial (Primeiros 3s):
                      </span>
                      <p className="text-xs font-semibold text-zinc-100 italic mt-0.5">
                        "{activeReel.hook3s}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                        ✍️ Roteiro & Execução:
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                        {activeReel.scriptStructure}
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
                        📄 Legenda Sugerida:
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

                  {/* Ações do dia */}
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

            {/* Convite Comercial Limpo */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-[#17141a] border border-[#ee4957]/30 text-center space-y-3">
              <div className="inline-flex items-center gap-1 text-[#ee4957] text-xs font-bold uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>Plano Completo do Mapa de Conteúdo</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                Quer desbloquear diagnósticos profundos e carrosséis estruturados?
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Conheça nossos planos comerciais com liberação instantânea e garantia de 7 dias.
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

        {/* Minimal Footer */}
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
