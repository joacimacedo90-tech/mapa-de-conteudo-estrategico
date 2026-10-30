import React, { useState } from 'react';
import {
  Zap,
  Flame,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Video,
  MessageSquare,
  Calendar,
  Award,
  Activity,
  ArrowUpRight,
  Instagram,
  Target
} from 'lucide-react';
import { Report } from '../types';
import { getReportPowerPreview } from '../utils/powerPreview';

interface PowerPreviewSectionProps {
  report: Report;
  isUnlocked: boolean;
  onNavigateToCheckout: (planId?: string) => void;
  onNavigateToComparison: () => void;
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const PowerPreviewSection: React.FC<PowerPreviewSectionProps> = ({
  report,
  isUnlocked,
  onNavigateToCheckout,
  onNavigateToComparison,
  onCopyText,
  copiedId
}) => {
  const power = getReportPowerPreview(report);
  const [activePillarIndex, setActivePillarIndex] = useState(0);

  // SVG Gauge Calculations
  const radius = 58;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Semicircle gauge (from -180 to 0) or 270 degree arc
  const arcLength = circumference * 0.75;
  const currentOffset = arcLength - (power.currentPowerScore / 100) * arcLength;
  const potentialOffset = arcLength - (power.maxPowerScore / 100) * arcLength;

  // First sample reel
  const sampleReel = report.reels && report.reels[0];
  // First sample ideas
  const sampleIdeas = report.contentIdeas ? report.contentIdeas.slice(0, 3) : [];
  // Suggested Bio
  const suggestedBio = report.diagnosis?.bioAnalysis?.suggestedBio || 'Especialista em posicionamento e crescimento acelerado no Instagram.';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. TOP POWER HEADER HERO                                 */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-[#16151a] to-zinc-950 text-white border-2 border-[#ee4957]/50 shadow-2xl shadow-[#ee4957]/15 overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ee4957]/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Text Column */}
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ee4957]/20 border border-[#ee4957]/40 text-[#ff7582] text-xs font-black uppercase tracking-wider shadow-sm">
              <Zap className="w-4 h-4 fill-[#ee4957] text-[#ee4957] animate-pulse" />
              <span>Raio-X de Potência do Instagram • Prévia Oficial</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-tight leading-tight">
              Potência Atual: <span className="text-[#ee4957]">{power.currentPowerScore}%</span>
              <br className="hidden sm:inline" />
              {' '}Potencial a Destravar:{' '}
              <span className="text-emerald-400">+{power.untappedPotentialPercentage}%</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              Analisamos o algoritmo, posicionamento e formato de conteúdo do perfil{' '}
              <strong className="text-white">@{report.username}</strong>. O seu motor está operando em{' '}
              <span className="text-amber-300 font-semibold">{power.powerStatusLabel}</span>.
              Descubra abaixo onde você está perdendo alcance e como ativar sua potência máxima.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Alcance Reprimido
                </span>
                <span className="text-xs sm:text-sm font-black text-white mt-0.5 block truncate">
                  {power.estimatedMonthlyLostReach}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Vendas Perdidas no Direct
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 block truncate">
                  {power.estimatedLostLeads}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Potência Máxima Possível
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5 block">
                  {power.maxPowerScore}/100 Pontos
                </span>
              </div>
            </div>
          </div>

          {/* Right Power Meter Visual Gauge */}
          <div className="shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md relative w-full sm:w-auto">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#ee4957]" />
              Termômetro de Potência
            </span>

            {/* Circular Gauge Graphic */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-135" viewBox="0 0 120 120">
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={normalizedRadius}
                  stroke="currentColor"
                  className="text-zinc-800"
                  strokeWidth={stroke}
                  fill="transparent"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeLinecap="round"
                />
                {/* Max Potential Target Ghost Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={normalizedRadius}
                  stroke="currentColor"
                  className="text-emerald-500/30"
                  strokeWidth={stroke}
                  fill="transparent"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={potentialOffset}
                  strokeLinecap="round"
                />
                {/* Current Power Level Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={normalizedRadius}
                  stroke="#ee4957"
                  strokeWidth={stroke}
                  fill="transparent"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={currentOffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Gauge Center Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-white font-heading">
                  {power.currentPowerScore}
                  <span className="text-lg text-zinc-400 font-normal">%</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ee4957] mt-0.5">
                  Potência Atual
                </span>
                <span className="text-[9px] text-zinc-400">
                  Meta: {power.maxPowerScore}%
                </span>
              </div>
            </div>

            {/* Quick status pill */}
            <div className="mt-2 text-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +{power.untappedPotentialPercentage}% de Capacidade Inexplorada
              </span>
            </div>

            {/* CTA under gauge */}
            {!isUnlocked && (
              <button
                onClick={() => onNavigateToCheckout('pro')}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#ee4957]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Destravar Potência</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THE 4 POWER PILLARS COMPARISON (ATUAL VS. DESTRAVADO) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#ee4957]" />
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white font-heading">
                Os 4 Pilares de Potência do seu Instagram
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Compare a tração que você tem hoje com o nível que o perfil atingirá ao aplicar os 90 dias de estratégia.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              Nível Atual
            </span>
            <span className="flex items-center gap-1.5 text-[#ee4957]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ee4957]" />
              Potência Destravada
            </span>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {power.powerPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 space-y-3 hover:border-[#ee4957]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {pillar.name}
                </h3>
                <span className="text-xs font-black text-[#ee4957]">
                  {pillar.currentPercentage}% ➔ {pillar.potentialPercentage}%
                </span>
              </div>

              {/* Dual Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Atual: {pillar.currentPercentage}%</span>
                  <span className="text-emerald-500 font-bold">Meta com Mapa: {pillar.potentialPercentage}%</span>
                </div>
                <div className="relative w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  {/* Potential Ghost Fill */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-emerald-500/20 dark:bg-emerald-500/30"
                    style={{ width: `${pillar.potentialPercentage}%` }}
                  />
                  {/* Current Fill */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ee4957] to-[#ff6b78] rounded-full"
                    style={{ width: `${pillar.currentPercentage}%` }}
                  />
                </div>
              </div>

              {/* Diagnosis text */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {pillar.diagnosis}
              </p>

              {/* What unlocks this */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Como destravar:
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate ml-2">
                  {pillar.unlockedWith}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. OS 3 VAZAMENTOS CRÍTICOS DETECTADOS NO PERFIL         */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerta de Perda de Tráfego</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white font-heading">
            3 Vazamentos Críticos Onde @{report.username} Está Perdendo Seguidores e Vendas
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Estes 3 pontos de atrito foram identificados como os principais responsáveis por frear o crescimento orgânico da conta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {power.powerLeaks.map((leak, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-red-400/50 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    leak.impactLevel === 'Crítica'
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    Perda {leak.impactLevel}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                  {leak.title}
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {leak.leakDescription}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider block">
                  ✓ Solução Imediata:
                </span>
                <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug">
                  {leak.unlockedSolution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DEMONSTRAÇÃO REAL DA POTÊNCIA: BIO + AMOSTRAS GRÁTIS   */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-[#141318] dark:via-[#111115] dark:to-[#141318] border-2 border-[#ee4957]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-1">
              <Check className="w-3.5 h-3.5" />
              <span>Amostra Gratuita da Prévia</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white font-heading">
              Sua Nova Bio Magnética de Alta Potência
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Formulada sob medida para reter visitantes e converter visitas em seguidores na hora.
            </p>
          </div>

          <button
            onClick={() => onCopyText(suggestedBio, 'power-bio')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#ee4957]/20 transition-all self-start sm:self-auto shrink-0"
          >
            {copiedId === 'power-bio' ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Bio Copiada com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Nova Bio para o Instagram</span>
              </>
            )}
          </button>
        </div>

        {/* Bio Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              ❌ Bio Atual (Fuga de Atenção):
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 italic min-h-[60px]">
              "{report.metaProfileData?.biography || report.manualData?.bio || report.diagnosis?.bioAnalysis?.currentStatus}"
            </p>
            <div className="pt-2 text-[10px] text-zinc-400">
              Diagnóstico: Baixa promessa de valor e ausência de chamada clara.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#ee4957]/5 dark:bg-[#ee4957]/10 border-2 border-[#ee4957]/40 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ee4957] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ✓ Bio Magnética Recomendada (Alta Potência):
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ee4957] text-white text-[9px] font-black uppercase">
                Pronta para Usar
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white whitespace-pre-line min-h-[60px] leading-relaxed">
              {suggestedBio}
            </p>
            <div className="pt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Retenção estimada: até 3x mais seguidores a partir das mesmas visitas.
            </div>
          </div>
        </div>

        {/* Sample Reel Preview */}
        {sampleReel && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#ee4957]" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Amostra de Roteiro de Reel Liberada na Prévia (Reel #1):
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                Tema: {sampleReel.theme}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#ee4957]">
                  👁️ Gancho Visual (0 a 3 segundos):
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">{sampleReel.hookVisual}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#ee4957]">
                  🎙️ Gancho Verbal (Frase Inicial):
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">"{sampleReel.hookVerbal}"</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div>
                <span className="font-bold text-[#ee4957] mr-1.5">Chamada CTA:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{sampleReel.cta}</span>
              </div>

              <button
                onClick={() => onCopyText(`REEL #1: ${sampleReel.theme}\nGancho Visual: ${sampleReel.hookVisual}\nGancho Verbal: "${sampleReel.hookVerbal}"\nCTA: ${sampleReel.cta}`, 'power-reel-1')}
                className="text-[11px] font-bold text-[#ee4957] hover:underline flex items-center gap-1 cursor-pointer ml-3 shrink-0"
              >
                {copiedId === 'power-reel-1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'power-reel-1' ? 'Copiado!' : 'Copiar Roteiro'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. CALL TO ACTION: DESTRAVAR POTÊNCIA COMPLETA            */}
      {/* ======================================================== */}
      <div className="rounded-3xl p-6 sm:p-10 bg-zinc-900 text-white dark:bg-[#15141b] border-2 border-[#ee4957] shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-[600px] h-[300px] bg-[#ee4957]/15 rounded-full blur-[110px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Destravamento Imediato de Potência</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Pronto para colocar @{report.username} na Potência Máxima?
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300">
            Você acabou de ver a prévia. Ao desbloquear o plano completo, você recebe todos os roteiros de Reels graváveis, carrosséis prontos, sequências de stories e os 90 dias de calendário editorial.
          </p>
        </div>

        {/* 3 Quick Action Plan Pills */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          {/* Plan 1 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 flex flex-col justify-between transition-all">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">30 Dias</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Plano Essencial</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Bio + 30 Ideias + Mês 1</p>
              <div className="mt-3 text-lg font-black text-white">R$ 47,00</div>
            </div>
            <button
              onClick={() => onNavigateToCheckout('essencial')}
              className="mt-3 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold text-center cursor-pointer transition-colors"
            >
              Destravar R$ 47
            </button>
          </div>

          {/* Plan 2: Pro */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border-2 border-[#ee4957] flex flex-col justify-between shadow-lg shadow-[#ee4957]/20 relative">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[9px] font-black uppercase">
              Mais Vendido
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#ee4957] uppercase">60 Dias</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Estratégico PRO</h4>
              <p className="text-[11px] text-zinc-300 mt-1">10 Reels + 10 Carrosséis + 10 Stories</p>
              <div className="mt-3 text-xl font-black text-white">R$ 97,00</div>
            </div>
            <button
              onClick={() => onNavigateToCheckout('pro')}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-extrabold text-center shadow-md cursor-pointer transition-colors"
            >
              Destravar PRO R$ 97
            </button>
          </div>

          {/* Plan 3: VIP */}
          <div className="p-4 rounded-2xl bg-white/5 border border-amber-400/30 hover:border-amber-400 flex flex-col justify-between transition-all">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase">90 Dias Completo</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Premium VIP</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Trimestre Todo + Suporte VIP</p>
              <div className="mt-3 text-lg font-black text-amber-300">R$ 197,00</div>
            </div>
            <button
              onClick={() => onNavigateToCheckout('premium')}
              className="mt-3 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center cursor-pointer transition-colors"
            >
              Destravar VIP R$ 197
            </button>
          </div>
        </div>

        {/* View full comparison link */}
        <div className="relative z-10 pt-2">
          <button
            onClick={onNavigateToComparison}
            className="text-xs text-zinc-300 hover:text-white underline font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            <span>Ver tabela comparativa completa dos 3 planos da Hotmart</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
