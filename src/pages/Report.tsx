import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Check,
  Printer,
  Calendar as CalendarIcon,
  Video,
  Layers,
  MessageSquare,
  Target,
  RefreshCw,
  HelpCircle,
  Clock,
  FileText,
  Share2,
  Instagram,
  ExternalLink,
  TrendingUp,
  Users,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { api } from '../api';
import { Report, ContentIdea, ReelScript, CarouselPost, StorySequence, CalendarDay } from '../types';

interface ReportPageProps {
  reportId: string;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
  onOpenLgpd: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  reportId,
  onNavigate
}) => {
  const [report, setReport] = useState<Report | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'ideas' | 'reels' | 'carousels' | 'stories' | 'hooks' | 'calendar'>('diagnosis');
  const [selectedMonth, setSelectedMonth] = useState<0 | 1 | 2 | 3>(0);
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'realistic' | 'accelerated'>('realistic');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReport(reportId);
      setReport(res.report);
      setIsUnlocked(res.isUnlocked);
      if (res.isUnlocked) {
        triggerCelebration();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2200);
  };

  // 1. Diagnosis copy
  const copyBio = () => {
    if (!report?.diagnosis?.bioAnalysis?.suggestedBio) return;
    copyToClipboard(report.diagnosis.bioAnalysis.suggestedBio, 'bio');
  };

  const copyDiagnosisSummary = () => {
    if (!report) return;
    const d = report.diagnosis;
    const text = `
🎯 DIAGNÓSTICO DE POSICIONAMENTO - @${report.username}
Pontuação Geral: ${d.overallScore}/100

💡 Diferencial Competitivo Único:
${d.competitiveEdge}

📝 Sugestão de Bio Magnética:
${d.bioAnalysis.suggestedBio}

👥 Perfil do Cliente Ideal:
${d.targetAudience.profile}

⚡ Dores Profundas:
${d.targetAudience.deepPains.map((p) => `- ${p}`).join('\n')}

✨ Desejos Imediatos:
${d.targetAudience.coreDesires.map((p) => `- ${p}`).join('\n')}

🛑 Objeções de Compra:
${d.targetAudience.buyingObjections.map((p) => `- ${p}`).join('\n')}

📊 Pilares Recomendados:
${d.strategicPillars.map((p) => `- ${p.name} (${p.percentage}%): ${p.description}`).join('\n')}
    `.trim();
    copyToClipboard(text, 'diagnosis-summary');
  };

  // 2. Ideas copy
  const copySingleIdea = (idea: ContentIdea) => {
    const text = `
💡 IDEIA DE CONTEÚDO (Dia ${idea.id}) - @${report?.username}
📌 Título/Tema: ${idea.title}
🎯 Formato: ${idea.format} | Pilar: ${idea.pillar}
🎯 Objetivo Estratégico: ${idea.goal}

👁️ Gancho (Frase de Abertura):
"${idea.hook}"

✍️ Direcionamento da Legenda:
${idea.captionIdea}

📢 CTA (Chamada para Ação):
${idea.cta}
    `.trim();
    copyToClipboard(text, `idea-${idea.id}`);
  };

  const copyAllIdeas = () => {
    if (!report) return;
    const list = report.contentIdeas.map((idea) => `
### Dia ${idea.id}: ${idea.title} [${idea.format} | ${idea.pillar}]
- Gancho: "${idea.hook}"
- Legenda: ${idea.captionIdea}
- CTA: ${idea.cta}
    `.trim()).join('\n\n');
    copyToClipboard(`📚 30 IDEIAS DE CONTEÚDO - @${report.username}\n\n${list}`, 'all-ideas');
  };

  // 3. Reels copy
  const copySingleReel = (reel: ReelScript) => {
    const text = `
🎬 ROTEIRO DE REEL #${reel.id} - @${report?.username}
📌 Tema: ${reel.theme}
⏱️ Duração: ${reel.durationSeconds} | 🎵 Áudio Sugerido: ${reel.audioStyle}

👁️ Gancho Visual (0 a 3s):
${reel.hookVisual}

🎙️ Gancho Verbal (0 a 3s):
"${reel.hookVerbal}"

📝 Roteiro da Fala:
${reel.body?.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

📢 Chamada para Ação (CTA):
${reel.cta}
    `.trim();
    copyToClipboard(text, `reel-${reel.id}`);
  };

  const copyAllReels = () => {
    if (!report) return;
    const list = report.reels.map((reel) => `
### Reel #${reel.id}: ${reel.theme} (${reel.durationSeconds} | ${reel.audioStyle})
- Gancho Visual: ${reel.hookVisual}
- Gancho Verbal: "${reel.hookVerbal}"
- Roteiro da Fala:
${reel.body?.map((step, idx) => `  ${idx + 1}. ${step}`).join('\n')}
- CTA: ${reel.cta}
    `.trim()).join('\n\n---\n\n');
    copyToClipboard(`🎬 10 ROTEIROS DE REELS - @${report.username}\n\n${list}`, 'all-reels');
  };

  // 4. Carousels copy
  const copySingleCarousel = (carousel: CarouselPost) => {
    const slidesText = carousel.slides?.map((s) => `[SLIDE ${s.slideNumber}] ${s.headline}\nConteúdo: ${s.content}\nDesign: ${s.visualNote}`).join('\n\n');
    const text = `
🖼️ CARROSSEL #${carousel.id} - @${report?.username}
📌 Tema: ${carousel.title}
🎯 Foco/Alvo: ${carousel.targetPainOrDesire}

[CAPA]: "${carousel.coverHeadline}"

${slidesText}

📢 CTA do Último Slide:
${carousel.finalCta}
    `.trim();
    copyToClipboard(text, `carousel-${carousel.id}`);
  };

  const copyAllCarousels = () => {
    if (!report) return;
    const list = report.carousels.map((c) => `
### Carrossel #${c.id}: ${c.title}
- Capa: "${c.coverHeadline}"
- Foco: ${c.targetPainOrDesire}
- Slides:
${c.slides?.map((s) => `  [Slide ${s.slideNumber}] ${s.headline}: ${s.content}`).join('\n')}
- CTA Final: ${c.finalCta}
    `.trim()).join('\n\n---\n\n');
    copyToClipboard(`🖼️ 10 CARROSSÉIS ESTRUTURADOS - @${report.username}\n\n${list}`, 'all-carousels');
  };

  // 5. Stories copy
  const copySingleStory = (storySeq: StorySequence) => {
    const storiesText = storySeq.stories?.map((st) => `Story ${st.order} [${st.type}]:\n${st.content}\n🔘 Interativo: ${st.stickerOrInteractive}`).join('\n\n');
    const text = `
📱 SEQUÊNCIA DE STORIES #${storySeq.id} - @${report?.username}
📌 Tema: ${storySeq.theme}
🎯 Objetivo: ${storySeq.objective}

${storiesText}
    `.trim();
    copyToClipboard(text, `story-${storySeq.id}`);
  };

  const copyAllStories = () => {
    if (!report) return;
    const list = report.stories.map((s) => `
### Sequência #${s.id}: ${s.theme} (${s.objective})
${s.stories?.map((st) => `- Story ${st.order} [${st.type}]: ${st.content} (Interativo: ${st.stickerOrInteractive})`).join('\n')}
    `.trim()).join('\n\n---\n\n');
    copyToClipboard(`📱 10 SEQUÊNCIAS DE STORIES - @${report.username}\n\n${list}`, 'all-stories');
  };

  // 6. Hooks copy
  const copyHooksBank = () => {
    if (!report?.hooksAndCtas) return;
    const h = report.hooksAndCtas;
    const text = `
🪝 BANCO DE GANCHOS & CTAS - @${report.username}

⚡ Ganchos de Curiosidade:
${h.curiosityHooks?.map((g) => `- "${g}"`).join('\n')}

🔥 Ganchos de Dor & Alerta:
${h.painHooks?.map((g) => `- "${g}"`).join('\n')}

🏆 Ganchos de Autoridade:
${h.authorityHooks?.map((g) => `- "${g}"`).join('\n')}

💬 CTAs para Comentários:
${h.commentCtas?.map((g) => `- "${g}"`).join('\n')}

📥 CTAs para Direct (DM):
${h.directMessageCtas?.map((g) => `- "${g}"`).join('\n')}
    `.trim();
    copyToClipboard(text, 'all-hooks');
  };

  // 7. Calendar copy
  const copySingleDay = (day: CalendarDay) => {
    const text = `
📅 CRONOGRAMA DIA ${day.day} (${day.dayOfWeek}) - @${report?.username}
📌 Formato: ${day.format} | Pilar: ${day.pillar}
💡 Tema: ${day.theme}
👁️ Gancho: "${day.hook}"
📢 CTA: ${day.cta}
    `.trim();
    copyToClipboard(text, `day-${day.day}`);
  };

  const copyFullCalendar = () => {
    if (!report) return;
    const header = `Dia\tMês\tFase\tDia da Semana\tFormato\tPilar\tTema\tGancho\tCTA`;
    const rows = report.calendar.map((d) => `${d.day}\tMês ${d.month || 1}\t${d.phase || ''}\t${d.dayOfWeek}\t${d.format}\t${d.pillar}\t${d.theme}\t"${d.hook}"\t${d.cta}`).join('\n');
    copyToClipboard(`📅 CRONOGRAMA TRIMESTRAL COMPLETO DE 90 DIAS - @${report.username}\n\n${header}\n${rows}`, 'full-calendar');
  };

  const copyCalendarByMonth = (monthNum: 0 | 1 | 2 | 3) => {
    if (!report) return;
    const filtered = monthNum === 0 ? report.calendar : report.calendar.filter((d) => (d.month || 1) === monthNum);
    const monthLabels = {
      0: 'TODOS OS 90 DIAS',
      1: 'MÊS 1 (DIAS 1 A 30) - FUNDAÇÃO & ATRAÇÃO',
      2: 'MÊS 2 (DIAS 31 A 60) - AUTORIDADE & CONEXÃO',
      3: 'MÊS 3 (DIAS 61 A 90) - ESCALA & CONVERSÃO'
    };
    const header = `Dia\tFase\tDia da Semana\tFormato\tPilar\tTema\tGancho\tCTA`;
    const rows = filtered.map((d) => `${d.day}\t${d.phase || `Mês ${d.month}`}\t${d.dayOfWeek}\t${d.format}\t${d.pillar}\t${d.theme}\t"${d.hook}"\t${d.cta}`).join('\n');
    copyToClipboard(`📅 CRONOGRAMA ${monthLabels[monthNum]} - @${report.username}\n\n${header}\n${rows}`, `calendar-month-${monthNum}`);
  };

  const copyFollowerProjection = () => {
    if (!report?.diagnosis?.growthProjection) return;
    const gp = report.diagnosis.growthProjection;
    const text = `
📈 PROJEÇÃO DE CRESCIMENTO DE SEGUIDORES (90 DIAS) - @${report.username}
Link do Perfil: https://instagram.com/${report.username}

1️⃣ CENÁRIO CONSERVADOR (${gp.conservative.frequency}):
- Novos Seguidores Estimados: ${gp.conservative.projectedFollowersRange}
- Alcance Total Estimado: ${gp.conservative.estimatedReachRange}
- Mensagens / Leads no Direct: ${gp.conservative.estimatedDmMessages}
- Estratégia-Chave: ${gp.conservative.keyStrategy}

2️⃣ CENÁRIO RECOMENDADO / REALISTA (${gp.realistic.frequency}):
- Novos Seguidores Estimados: ${gp.realistic.projectedFollowersRange}
- Alcance Total Estimado: ${gp.realistic.estimatedReachRange}
- Mensagens / Leads no Direct: ${gp.realistic.estimatedDmMessages}
- Estratégia-Chave: ${gp.realistic.keyStrategy}

3️⃣ CENÁRIO ACELERADO / ALTA PERFORMANCE (${gp.accelerated.frequency}):
- Novos Seguidores Estimados: ${gp.accelerated.projectedFollowersRange}
- Alcance Total Estimado: ${gp.accelerated.estimatedReachRange}
- Mensagens / Leads no Direct: ${gp.accelerated.estimatedDmMessages}
- Estratégia-Chave: ${gp.accelerated.keyStrategy}

🎯 Estimativa de Conversão Comercial:
${gp.leadConversionEstimate}

⚡ Alavancas Críticas de Crescimento:
${gp.keyGrowthLevers?.map((l) => `- ${l}`).join('\n')}

🔒 Nota de Integridade:
${gp.integrityDisclaimer}
    `.trim();
    copyToClipboard(text, 'follower-projection');
  };

  const handleVerifyPayment = async () => {
    setVerifyingPayment(true);
    setVerifyMessage(null);
    try {
      const res = await api.verifyPayment(reportId);
      if (res.isPaid) {
        setIsUnlocked(true);
        triggerCelebration();
        setVerifyMessage('🎉 Pagamento aprovado com sucesso pela Hotmart! Seu acesso está liberado.');
        fetchReport();
      } else {
        setVerifyMessage(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao verificar pagamento';
      setVerifyMessage(msg);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    const gp = report.diagnosis?.growthProjection;
    const md = `
# MAPA DE CONTEÚDO TRIMESTRAL (90 DIAS) - @${report.username}
Perfil Oficial: https://instagram.com/${report.username}
Data de Geração: ${new Date(report.createdAt).toLocaleDateString('pt-BR')}

## 1. DIAGNÓSTICO DE POSICIONAMENTO
- Pontuação Geral: ${report.diagnosis.overallScore}/100
- Diferencial Único: ${report.diagnosis.competitiveEdge}
- Situação da Bio: ${report.diagnosis.bioAnalysis.currentStatus}
- Sugestão de Bio: ${report.diagnosis.bioAnalysis.suggestedBio}
- Público-Alvo: ${report.diagnosis.targetAudience.profile}

${gp ? `## 2. PROJEÇÃO DE CRESCIMENTO DE SEGUIDORES (90 DIAS)
- Cenário Conservador: ${gp.conservative.projectedFollowersRange} (${gp.conservative.frequency})
- Cenário Recomendado/Realista: ${gp.realistic.projectedFollowersRange} (${gp.realistic.frequency})
- Cenário Acelerado: ${gp.accelerated.projectedFollowersRange} (${gp.accelerated.frequency})
- Previsão de Leads no Direct: ${gp.leadConversionEstimate}
- Alavancas:
${gp.keyGrowthLevers?.map((l) => `  * ${l}`).join('\n')}
` : ''}

## 3. PILARES ESTRATÉGICOS
${report.diagnosis.strategicPillars.map((p) => `- ${p.name} (${p.percentage}%): ${p.description}`).join('\n')}

## 4. IDEIAS DE CONTEÚDO (${report.contentIdeas.length} ideias)
${report.contentIdeas.map((c) => `### Dia ${c.id}: ${c.title}
- Formato: ${c.format} | Pilar: ${c.pillar}
- Gancho: "${c.hook}"
- CTA: "${c.cta}"`).join('\n\n')}

## 5. ROTEIROS DE REELS
${report.reels.map((r) => `### Reel ${r.id}: ${r.theme}
- Gancho Visual: ${reelVisualClean(r.hookVisual)}
- Gancho Verbal: "${r.hookVerbal}"
- CTA: "${r.cta}"`).join('\n\n')}

## 6. CALENDÁRIO TRIMESTRAL DE 90 DIAS
${report.calendar.map((d) => `Dia ${d.day} [${d.phase || `Mês ${d.month}`}] (${d.dayOfWeek}): ${d.format} - ${d.theme}`).join('\n')}

---
Gerado pelo MAPA DE CONTEÚDO (mapadeconteudo.com)
    `;
    navigator.clipboard.writeText(md.trim());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  function reelVisualClean(str: string) {
    return str || '';
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-28 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#ee4957] border-t-transparent animate-spin mx-auto" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Carregando relatório estratégico...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Relatório não encontrado</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">O identificador informado não consta em nosso banco de dados.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-xl bg-[#ee4957] text-white text-xs font-bold"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 transition-colors duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ee4957]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Relatório Estratégico
              </span>
              {isUnlocked ? (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    report.paidPlanId === 'premium'
                      ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    <Unlock className="w-3 h-3" />
                    <span>
                      {report.paidPlanId === 'premium'
                        ? 'PLANO PREMIUM VIP'
                        : report.paidPlanId === 'essencial'
                        ? 'PLANO ESSENCIAL'
                        : 'PLANO PRO'}
                    </span>
                  </span>
                  {report.paidPlanId !== 'premium' && (
                    <button
                      onClick={() => onNavigate('comparison', report.id)}
                      className="text-[11px] font-bold text-[#ee4957] hover:underline cursor-pointer"
                    >
                      Fazer Upgrade →
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#ee4957]" />
                  Prévia Gratuita Disponível
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white font-heading">
              Estratégia de Conteúdo para <span className="text-[#ee4957]">@{report.username}</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              {report.niche && <span>Nicho: <strong className="text-zinc-800 dark:text-zinc-200">{report.niche}</strong></span>}
              {report.profession && <span>Segmento: <strong className="text-zinc-800 dark:text-zinc-200">{report.profession}</strong></span>}
              <span>Gerado em: {new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isUnlocked ? (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Copiar relatório completo formatado em Markdown"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                      <span>Copiar Tudo (Markdown)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Imprimir / PDF</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('comparison', report.id)}
                  className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Ver Comparativo
                </button>
                <button
                  onClick={() => onNavigate('checkout', report.id)}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ee4957]/30 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Desbloquear Plano (a partir de R$ 47)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Cartão de Destaque: Perfil do Instagram */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar Profile Ring */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#ee4957] via-[#ff6b78] to-[#ffc0c6] p-0.5 shadow-md">
                {report.metaProfileData?.profilePictureUrl ? (
                  <img
                    src={report.metaProfileData.profilePictureUrl}
                    alt={`@${report.username}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-extrabold text-lg sm:text-xl text-[#ee4957]">
                    {report.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#ee4957] text-white flex items-center justify-center shadow-sm" title="Instagram Oficial">
                <Instagram className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-heading tracking-tight truncate">
                  @{report.username}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ee4957]/15 text-[#ee4957] border border-[#ee4957]/30 flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  Perfil Analisado
                </span>
                {report.metaProfileData?.followersCount ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    👥 {report.metaProfileData.followersCount.toLocaleString('pt-BR')} seguidores
                  </span>
                ) : null}
              </div>

              {/* Bio summary */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl line-clamp-2">
                {report.metaProfileData?.biography || report.manualData?.bio || 'Perfil configurado para aceleração e captação de clientes nos próximos 90 dias.'}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {report.niche && (
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                    🎯 Nicho: <strong>{report.niche}</strong>
                  </span>
                )}
                {report.objective && (
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                    ⚡ Foco: <strong>{report.objective}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Instagram Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/80">
            <button
              onClick={() => copyToClipboard(`@${report.username}`, 'profile-handle')}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Copiar arroba para área de transferência"
            >
              {copiedId === 'profile-handle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                  <span>Copiar @usuario</span>
                </>
              )}
            </button>

            <a
              href={`https://instagram.com/${report.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#ee4957]/20 transition-all cursor-pointer"
              title={`Abrir https://instagram.com/${report.username} em nova aba`}
            >
              <Instagram className="w-4 h-4" />
              <span>Abrir no Instagram</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'diagnosis'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Diagnóstico & Projeção</span>
        </button>

        <button
          onClick={() => setActiveTab('ideas')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'ideas'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>30 Ideias de Conteúdo</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'reels'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>10 Roteiros de Reels</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>

        <button
          onClick={() => setActiveTab('carousels')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'carousels'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>10 Carrosséis Estruturados</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>10 Sequências de Stories</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>

        <button
          onClick={() => setActiveTab('hooks')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'hooks'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Banco de Ganchos & CTAs</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-[#ee4957] text-white shadow-md shadow-[#ee4957]/20 font-bold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendário de 90 Dias</span>
          {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
        </button>
      </div>

      {/* Paywall Banner / Alert if locked */}
      {!isUnlocked && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-50 via-red-50/30 to-zinc-50 dark:from-[#17151b] dark:via-[#1a1418] dark:to-[#17151b] border-2 border-[#ee4957]/50 shadow-xl dark:shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ee4957]/15 dark:bg-[#ee4957]/20 border border-[#ee4957]/30 flex items-center justify-center text-[#ee4957] shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                  Você está visualizando a Prévia Gratuita do Diagnóstico
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-[#ee4957] text-white">
                  Oferta
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Desbloqueie os 90 dias de estratégia trimestral completa: 27 ideias adicionais, 10 roteiros de Reels, 10 carrosséis slide a slide, 10 sequências de Stories e o calendário completo dos 3 meses.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('checkout', report.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-[#ee4957]/40 transition-all cursor-pointer text-center"
            >
              Liberar Estratégia Completa
            </button>
            <button
              onClick={handleVerifyPayment}
              disabled={verifyingPayment}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#ee4957] ${verifyingPayment ? 'animate-spin' : ''}`} />
              <span>{verifyingPayment ? 'Verificando...' : 'Já paguei, verificar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Verify feedback message */}
      {verifyMessage && (
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">Status da Verificação Hotmart:</p>
            <p>{verifyMessage}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 1. DIAGNÓSTICO (FREE PREVIEW INCLUDED)     */}
      {/* ======================================================== */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                Diagnóstico de Posicionamento & Oportunidades
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Análise aprofundada dos pontos fortes e gaps de conversão do perfil @{report.username}.
              </p>
            </div>
            <button
              onClick={copyDiagnosisSummary}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
              title="Copiar resumo do diagnóstico para clipboard"
            >
              {copiedId === 'diagnosis-summary' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Resumo Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                  <span>Copiar Resumo do Diagnóstico</span>
                </>
              )}
            </button>
          </div>

          {/* Top Score & Positioning Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none transition-colors">
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Pontuação de Posicionamento
              </span>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-[#22222a]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#ee4957"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (report.diagnosis?.overallScore || 75) / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-heading">
                    {report.diagnosis?.overallScore || 75}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">de 100</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Potencial de atração e vendas do perfil
              </p>
            </div>

            {/* Competitive Edge */}
            <div className="md:col-span-2 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#ee4957]" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                    Diferencial Competitivo Único (Posicionamento)
                  </h3>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
                  {report.diagnosis?.competitiveEdge}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  Situação Atual da Bio:
                </h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">
                  "{report.diagnosis?.bioAnalysis?.currentStatus}"
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PROJEÇÃO DE CRESCIMENTO DE SEGUIDORES (90 DIAS)           */}
          {/* ======================================================== */}
          {report.diagnosis?.growthProjection && (
            <div className="bg-white dark:bg-[#121216] border-2 border-[#ee4957]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md dark:shadow-none transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#ee4957]/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#ee4957]/15 text-[#ee4957] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-heading">
                      Projeção de Crescimento de Seguidores em 90 Dias
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl">
                    Estimativa analítica calculada especificamente para o perfil <strong className="text-zinc-800 dark:text-zinc-200">@{report.username}</strong> com base no algoritmo atual do Instagram e consistência de postagens.
                  </p>
                </div>

                <button
                  onClick={copyFollowerProjection}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm shrink-0"
                  title="Copiar projeção de seguidores completa para clipboard"
                >
                  {copiedId === 'follower-projection' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Projeção Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                      <span>Copiar Projeção</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3 Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                {/* 1. Conservador */}
                <div
                  onClick={() => setSelectedScenario('conservative')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedScenario === 'conservative'
                      ? 'bg-zinc-50 dark:bg-zinc-900 border-[#ee4957] ring-2 ring-[#ee4957]/30 shadow-md'
                      : 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        {report.diagnosis.growthProjection.conservative.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        3-4x / semana
                      </span>
                    </div>

                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-heading">
                        {report.diagnosis.growthProjection.conservative.projectedFollowersRange}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Alcance 90d: <strong>{report.diagnosis.growthProjection.conservative.estimatedReachRange}</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                      <strong>Rotina:</strong> {report.diagnosis.growthProjection.conservative.frequency}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {report.diagnosis.growthProjection.conservative.keyStrategy}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                    <span>Leads no Direct:</span>
                    <span className="text-zinc-900 dark:text-white">{report.diagnosis.growthProjection.conservative.estimatedDmMessages}</span>
                  </div>
                </div>

                {/* 2. Recomendado / Realista */}
                <div
                  onClick={() => setSelectedScenario('realistic')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                    selectedScenario === 'realistic'
                      ? 'bg-gradient-to-b from-[#ee4957]/10 to-transparent dark:from-[#ee4957]/20 dark:to-transparent border-[#ee4957] ring-2 ring-[#ee4957]/40 shadow-lg'
                      : 'bg-zinc-50/60 dark:bg-zinc-900/40 border-[#ee4957]/50 hover:border-[#ee4957]'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#ee4957] to-[#ff6b78] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    ⭐ Mais Recomendado
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ee4957]">
                        {report.diagnosis.growthProjection.realistic.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ee4957]/15 text-[#ee4957]">
                        5-6x / semana
                      </span>
                    </div>

                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-[#ee4957] font-heading">
                        {report.diagnosis.growthProjection.realistic.projectedFollowersRange}
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1">
                        Alcance 90d: <strong>{report.diagnosis.growthProjection.realistic.estimatedReachRange}</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200">
                      <strong>Rotina:</strong> {report.diagnosis.growthProjection.realistic.frequency}
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {report.diagnosis.growthProjection.realistic.keyStrategy}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#ee4957]/30 text-[11px] font-bold text-[#ee4957] flex items-center justify-between">
                    <span>Leads no Direct:</span>
                    <span className="text-zinc-900 dark:text-white font-black">{report.diagnosis.growthProjection.realistic.estimatedDmMessages}</span>
                  </div>
                </div>

                {/* 3. Acelerado / Alta Performance */}
                <div
                  onClick={() => setSelectedScenario('accelerated')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedScenario === 'accelerated'
                      ? 'bg-zinc-50 dark:bg-zinc-900 border-[#ee4957] ring-2 ring-[#ee4957]/30 shadow-md'
                      : 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {report.diagnosis.growthProjection.accelerated.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Diário + Collabs
                      </span>
                    </div>

                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-heading">
                        {report.diagnosis.growthProjection.accelerated.projectedFollowersRange}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Alcance 90d: <strong>{report.diagnosis.growthProjection.accelerated.estimatedReachRange}</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                      <strong>Rotina:</strong> {report.diagnosis.growthProjection.accelerated.frequency}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {report.diagnosis.growthProjection.accelerated.keyStrategy}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                    <span>Leads no Direct:</span>
                    <span className="text-zinc-900 dark:text-white">{report.diagnosis.growthProjection.accelerated.estimatedDmMessages}</span>
                  </div>
                </div>
              </div>

              {/* Lead Conversion and Growth Levers Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 relative z-10">
                {/* Alavancas */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <h4 className="text-xs font-bold text-[#ee4957] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    4 Alavancas Críticas de Crescimento:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    {report.diagnosis.growthProjection.keyGrowthLevers?.map((lever, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#ee4957] font-bold">✓</span>
                        <span>{lever}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Previsão Comercial */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-red-50/30 dark:from-zinc-900 dark:to-[#1a1215] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#ee4957]" />
                      Previsão de Conversão em Clientes (Direct):
                    </h4>
                    <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {report.diagnosis.growthProjection.leadConversionEstimate}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{report.diagnosis.growthProjection.integrityDisclaimer}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio Rewriting Section */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ee4957]" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                Engenharia de Bio Magnética
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pontos Fracos atuais */}
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
                <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  ⚠️ O que afasta potenciais clientes:
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.diagnosis?.bioAnalysis?.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 dark:text-red-400">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pontos Fortes atuais */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  ✅ Pontos fortes identificados:
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.diagnosis?.bioAnalysis?.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sugestão de Bio Pronta */}
            <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-2 border-[#ee4957]/40 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#ee4957] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Bio Magnética Recomendada para o seu perfil:
                </span>
                <button
                  onClick={copyBio}
                  className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer shadow-sm transition-all"
                >
                  {copiedId === 'bio' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Bio Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                      <span>Copiar Bio</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-line font-medium leading-relaxed">
                {report.diagnosis?.bioAnalysis?.suggestedBio}
              </p>
            </div>
          </div>

          {/* Persona & Público-Alvo */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
              Raio-X do Seu Cliente Ideal (Público-Alvo)
            </h3>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              {report.diagnosis?.targetAudience?.profile}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-[#ee4957] uppercase tracking-wider">
                  Dores Profundas
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.diagnosis?.targetAudience?.deepPains?.map((pain, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#ee4957]">→</span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Desejos Imediatos
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.diagnosis?.targetAudience?.coreDesires?.map((desire, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400">→</span>
                      <span>{desire}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Objeções Secretas de Compra
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {report.diagnosis?.targetAudience?.buyingObjections?.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 dark:text-amber-400">→</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pilares Estratégicos */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
              Os 4 Pilares de Conteúdo Recomendados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.diagnosis?.strategicPillars?.map((pilar, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{pilar.name}</span>
                    <span className="text-xs font-black text-[#ee4957]">{pilar.percentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#ee4957] h-full"
                      style={{ width: `${pilar.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{pilar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 2. 30 IDEIAS DE CONTEÚDO                   */}
      {/* ======================================================== */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                30 Ideias de Conteúdo Estratégico
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ideias formuladas sob medida para o perfil @{report.username}. Clique em "Copiar Ideia" para transferir diretamente para o Instagram.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy All Ideas Button */}
              {isUnlocked && (
                <button
                  onClick={copyAllIdeas}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Copiar todas as 30 ideias para a área de transferência"
                >
                  {copiedId === 'all-ideas' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>30 Ideias Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                      <span>Copiar Todas as 30</span>
                    </>
                  )}
                </button>
              )}

              {/* Filter by pillar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Pilar:</span>
                <select
                  value={filterPillar}
                  onChange={(e) => setFilterPillar(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                >
                  <option value="all">Todos os Pilares</option>
                  <option value="Autoridade">Autoridade</option>
                  <option value="Conexão">Conexão</option>
                  <option value="Educação">Educação</option>
                  <option value="Conversão / Venda">Conversão / Venda</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.contentIdeas
              .filter((item) => filterPillar === 'all' || item.pillar === filterPillar)
              .map((idea) => {
                const isLockedItem = !isUnlocked && idea.id > 3;

                return (
                  <div
                    key={idea.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                      isLockedItem
                        ? 'bg-zinc-100/60 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden'
                        : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 hover:border-[#ee4957]/50 shadow-sm'
                    }`}
                  >
                    {isLockedItem && (
                      <div className="absolute inset-0 backdrop-blur-sm bg-white/70 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-4 text-center">
                        <Lock className="w-6 h-6 text-[#ee4957] mb-2" />
                        <p className="text-xs font-bold text-zinc-900 dark:text-white mb-1">Conteúdo Exclusivo</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3">Liberado no Plano Completo</p>
                        <button
                          onClick={() => onNavigate('checkout', report.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#ee4957] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Desbloquear
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          Dia {idea.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#ee4957]/15 text-[#ee4957]">
                            {idea.format}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {idea.pillar}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 line-clamp-2">
                        {idea.title}
                      </h4>

                      <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <p>
                          <strong className="text-zinc-500 dark:text-zinc-400 text-[11px] block">Gancho:</strong>
                          "{idea.hook}"
                        </p>
                        {idea.captionIdea && (
                          <p>
                            <strong className="text-zinc-500 dark:text-zinc-400 text-[11px] block">Direcionamento:</strong>
                            {idea.captionIdea}
                          </p>
                        )}
                        <p>
                          <strong className="text-zinc-500 dark:text-zinc-400 text-[11px] block">CTA sugerida:</strong>
                          {idea.cta}
                        </p>
                      </div>
                    </div>

                    {/* Copy To Clipboard Button for this Idea */}
                    {!isLockedItem && (
                      <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        <button
                          onClick={() => copySingleIdea(idea)}
                          className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-900 dark:hover:bg-[#ee4957] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                          title="Copiar ideia completa para colar no Instagram"
                        >
                          {copiedId === `idea-${idea.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              <span>Copiado para o Instagram!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#ee4957] group-hover:text-white" />
                              <span>Copiar Ideia / Legenda</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 3. 10 REELS SCRIPTS                        */}
      {/* ======================================================== */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                10 Roteiros de Reels Prontos para Gravar
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Estruturados para reter atenção nos primeiros 3 segundos e direcionar para direct/comentários.
              </p>
            </div>

            {isUnlocked && (
              <button
                onClick={copyAllReels}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto transition-all"
                title="Copiar todos os 10 roteiros de Reels"
              >
                {copiedId === 'all-reels' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Todos os 10 Reels Copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                    <span>Copiar Todos os 10 Reels</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {report.reels.map((reel) => {
              const isLockedItem = !isUnlocked && reel.id > 1;

              return (
                <div
                  key={reel.id}
                  className={`rounded-2xl border p-6 relative ${
                    isLockedItem
                      ? 'bg-zinc-100/70 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800 overflow-hidden'
                      : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  {isLockedItem && (
                    <div className="absolute inset-0 backdrop-blur-md bg-white/80 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="w-8 h-8 text-[#ee4957] mb-2" />
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Roteiro de Reel #{reel.id} Bloqueado</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm mb-4">
                        Desbloqueie todos os 10 roteiros de Reels completos com ganchos visuais, quebra de padrão e CTA de alta conversão.
                      </p>
                      <button
                        onClick={() => onNavigate('checkout', report.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#ee4957] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Desbloquear Todos os Reels
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#ee4957]/10 text-[#ee4957] font-bold text-xs flex items-center justify-center">
                        #{reel.id}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                        {reel.theme}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#ee4957]" />
                          {reel.durationSeconds}
                        </span>
                        <span>•</span>
                        <span>{reel.audioStyle}</span>
                      </div>

                      {/* Copy Reel Button in Header */}
                      {!isLockedItem && (
                        <button
                          onClick={() => copySingleReel(reel)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-900 dark:hover:bg-[#ee4957] border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                          title="Copiar roteiro deste Reel para o Instagram"
                        >
                          {copiedId === `reel-${reel.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              <span>Roteiro Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#ee4957] group-hover:text-white" />
                              <span>Copiar Roteiro</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#ee4957]">
                        👁️ Gancho Visual (0 a 3s):
                      </span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200">{reel.hookVisual}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#ee4957]">
                        🎙️ Gancho Verbal (0 a 3s):
                      </span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200">"{reel.hookVerbal}"</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                      Desenvolvimento (Passo a Passo da Fala):
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                      {reel.body?.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#ee4957] font-bold">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-[#ee4957] mr-1">CTA Final:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{reel.cta}</span>
                    </div>

                    {!isLockedItem && (
                      <button
                        onClick={() => copySingleReel(reel)}
                        className="text-[11px] font-bold text-[#ee4957] hover:underline flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar para gravação</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 4. 10 CARROSÉIS                             */}
      {/* ======================================================== */}
      {activeTab === 'carousels' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                10 Carrosséis Estruturados Slide a Slide
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formatados com foco em retenção máxima e salvamentos orgânicos.
              </p>
            </div>

            {isUnlocked && (
              <button
                onClick={copyAllCarousels}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto transition-all"
                title="Copiar todos os 10 carrosséis com roteiros de slides"
              >
                {copiedId === 'all-carousels' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Todos os 10 Carrosséis Copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                    <span>Copiar Todos os 10 Carrosséis</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {report.carousels.map((carousel) => {
              const isLockedItem = !isUnlocked && carousel.id > 1;

              return (
                <div
                  key={carousel.id}
                  className={`rounded-2xl border p-6 relative ${
                    isLockedItem
                      ? 'bg-zinc-100/70 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800 overflow-hidden'
                      : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  {isLockedItem && (
                    <div className="absolute inset-0 backdrop-blur-md bg-white/80 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="w-8 h-8 text-[#ee4957] mb-2" />
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Carrossel #{carousel.id} Bloqueado</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm mb-4">
                        Acesse a divisão de todos os slides (capa magnética, conteúdo e fechamento com CTA).
                      </p>
                      <button
                        onClick={() => onNavigate('checkout', report.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#ee4957] text-white text-xs font-bold cursor-pointer"
                      >
                        Desbloquear Carrosséis
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#ee4957]/15 text-[#ee4957] font-bold text-xs flex items-center justify-center">
                        #{carousel.id}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                        {carousel.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Alvo: <strong className="text-zinc-800 dark:text-zinc-200">{carousel.targetPainOrDesire}</strong>
                      </span>

                      {!isLockedItem && (
                        <button
                          onClick={() => copySingleCarousel(carousel)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-900 dark:hover:bg-[#ee4957] border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                          title="Copiar roteiro slide a slide deste carrossel"
                        >
                          {copiedId === `carousel-${carousel.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              <span>Carrossel Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#ee4957] group-hover:text-white" />
                              <span>Copiar Slides</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cover */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                    <span className="text-[10px] uppercase font-bold text-[#ee4957]">
                      🖼️ Headline Magnética da Capa:
                    </span>
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white mt-1">
                      "{carousel.coverHeadline}"
                    </p>
                  </div>

                  {/* Slides */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {carousel.slides?.map((slide) => (
                      <div key={slide.slideNumber} className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                          <span>Slide {slide.slideNumber}</span>
                          <span className="text-[#ee4957]">{slide.visualNote}</span>
                        </div>
                        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{slide.headline}</h5>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{slide.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#ee4957] mr-1">CTA do Último Slide:</span>{' '}
                      <span className="text-zinc-700 dark:text-zinc-300">{carousel.finalCta}</span>
                    </div>

                    {!isLockedItem && (
                      <button
                        onClick={() => copySingleCarousel(carousel)}
                        className="text-[11px] font-bold text-[#ee4957] hover:underline flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar todos os slides</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 5. 10 STORIES DE CONVERSÃO                  */}
      {/* ======================================================== */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                10 Sequências de Stories de Vendas & Engajamento
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fluxos de 3 a 4 stories planejados com quebras de padrão e direcionamento para Direct.
              </p>
            </div>

            {isUnlocked && (
              <button
                onClick={copyAllStories}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto transition-all"
                title="Copiar todas as 10 sequências de Stories"
              >
                {copiedId === 'all-stories' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Todas as 10 Sequências Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                    <span>Copiar Todas as Sequências</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {report.stories.map((storySeq) => {
              const isLockedItem = !isUnlocked && storySeq.id > 1;

              return (
                <div
                  key={storySeq.id}
                  className={`rounded-2xl border p-6 relative ${
                    isLockedItem
                      ? 'bg-zinc-100/70 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800 overflow-hidden'
                      : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  {isLockedItem && (
                    <div className="absolute inset-0 backdrop-blur-md bg-white/80 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="w-8 h-8 text-[#ee4957] mb-2" />
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Sequência #{storySeq.id} Bloqueada</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm mb-4">
                        Desbloqueie os roteiros completos de Stories para aquecimento e conversão na DM.
                      </p>
                      <button
                        onClick={() => onNavigate('checkout', report.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#ee4957] text-white text-xs font-bold cursor-pointer"
                      >
                        Liberar Todas as Sequências
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#ee4957]/15 text-[#ee4957] font-bold text-xs flex items-center justify-center">
                        #{storySeq.id}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                        {storySeq.theme}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#ee4957] font-semibold">
                        {storySeq.objective}
                      </span>

                      {!isLockedItem && (
                        <button
                          onClick={() => copySingleStory(storySeq)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-900 dark:hover:bg-[#ee4957] border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                          title="Copiar sequência de stories para postar"
                        >
                          {copiedId === `story-${storySeq.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              <span>Stories Copiados!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#ee4957] group-hover:text-white" />
                              <span>Copiar Sequência</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {storySeq.stories?.map((st) => (
                      <div key={st.order} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Story {st.order}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#ee4957]/20 text-[#ee4957]">
                            {st.type}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200">{st.content}</p>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <strong>Elemento Interativo:</strong> {st.stickerOrInteractive}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 6. BANCO DE GANCHOS & CTAS                  */}
      {/* ======================================================== */}
      {activeTab === 'hooks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                Banco de Ganchos Magnéticos & Modelos de Legenda
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Copie e cole frases validadas para os primeiros segundos e estruturas persuasivas de legenda.
              </p>
            </div>

            {isUnlocked && (
              <button
                onClick={copyHooksBank}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto transition-all"
                title="Copiar todo o banco de ganchos e CTAs"
              >
                {copiedId === 'all-hooks' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Banco de Ganchos Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                    <span>Copiar Todos os Ganchos</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ee4957] uppercase tracking-wider">
                  Ganchos de Curiosidade
                </h4>
                <span className="text-[10px] text-zinc-400">{report.hooksAndCtas?.curiosityHooks?.length || 0} ganchos</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                {report.hooksAndCtas?.curiosityHooks?.map((h, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between gap-2 group hover:border-[#ee4957]/30 transition-all">
                    <span>"{h}"</span>
                    <button
                      onClick={() => copyToClipboard(h, `curiosity-${i}`)}
                      title="Copiar este gancho para o clipboard"
                      className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-[#ee4957] shrink-0 mt-0.5 cursor-pointer shadow-sm"
                    >
                      {copiedId === `curiosity-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ee4957] uppercase tracking-wider">
                  Ganchos de Dor & Alerta
                </h4>
                <span className="text-[10px] text-zinc-400">{report.hooksAndCtas?.painHooks?.length || 0} ganchos</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                {report.hooksAndCtas?.painHooks?.map((h, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between gap-2 group hover:border-[#ee4957]/30 transition-all">
                    <span>"{h}"</span>
                    <button
                      onClick={() => copyToClipboard(h, `pain-${i}`)}
                      title="Copiar este gancho para o clipboard"
                      className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-[#ee4957] shrink-0 mt-0.5 cursor-pointer shadow-sm"
                    >
                      {copiedId === `pain-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ee4957] uppercase tracking-wider">
                  Ganchos de Autoridade
                </h4>
                <span className="text-[10px] text-zinc-400">{report.hooksAndCtas?.authorityHooks?.length || 0} ganchos</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                {report.hooksAndCtas?.authorityHooks?.map((h, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between gap-2 group hover:border-[#ee4957]/30 transition-all">
                    <span>"{h}"</span>
                    <button
                      onClick={() => copyToClipboard(h, `authority-${i}`)}
                      title="Copiar este gancho para o clipboard"
                      className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-[#ee4957] shrink-0 mt-0.5 cursor-pointer shadow-sm"
                    >
                      {copiedId === `authority-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Modelos de legenda */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
              Estruturas de Legendas Prontas (Copiar & Adaptar)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.hooksAndCtas?.captionTemplates?.map((template, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[#ee4957]">{template.name}</h5>
                    <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-950 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                      {template.structure}
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 italic pt-1">{template.example}</p>
                  </div>

                  <button
                    onClick={() => {
                      const text = `📝 MODELO DE LEGENDA: ${template.name}\nEstrutura: ${template.structure}\nExemplo Prático:\n${template.example}`;
                      copyToClipboard(text, `template-${idx}`);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {copiedId === `template-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Modelo Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                        <span>Copiar Estrutura & Exemplo</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 7. CALENDÁRIO TRIMESTRAL DE 90 DIAS         */}
      {/* ======================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
                  Calendário Editorial Trimestral (90 Dias)
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ee4957]/15 text-[#ee4957] border border-[#ee4957]/30">
                  90 Dias
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Planejamento diário estruturado nas 3 fases estratégicas para @{report.username}. Copie os meses individualmente ou o cronograma completo para planilhas.
              </p>
            </div>

            {isUnlocked && (
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => copyCalendarByMonth(selectedMonth)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Copiar tabela do mês selecionado para colar no Excel, Sheets ou Notion"
                >
                  {copiedId === `calendar-month-${selectedMonth}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tabela Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ee4957]" />
                      <span>{selectedMonth === 0 ? 'Copiar Todos os 90 Dias' : `Copiar Mês ${selectedMonth}`}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Month / Phase Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedMonth(0)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                selectedMonth === 0
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Todos os 90 Dias (Fases 1, 2 e 3)
            </button>

            <button
              onClick={() => setSelectedMonth(1)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMonth === 1
                  ? 'bg-white dark:bg-zinc-800 text-[#ee4957] shadow-sm font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Mês 1 (Dias 1 a 30)</span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">• Fundação & Atração</span>
            </button>

            <button
              onClick={() => setSelectedMonth(2)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMonth === 2
                  ? 'bg-white dark:bg-zinc-800 text-[#ee4957] shadow-sm font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Mês 2 (Dias 31 a 60)</span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">• Autoridade & Conexão</span>
            </button>

            <button
              onClick={() => setSelectedMonth(3)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMonth === 3
                  ? 'bg-white dark:bg-zinc-800 text-[#ee4957] shadow-sm font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Mês 3 (Dias 61 a 90)</span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">• Escala & Vendas</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Dia</th>
                    <th className="py-3 px-4">Fase / Mês</th>
                    <th className="py-3 px-4">Dia da Semana</th>
                    <th className="py-3 px-4">Formato</th>
                    <th className="py-3 px-4">Pilar</th>
                    <th className="py-3 px-4">Tema / Ideia</th>
                    <th className="py-3 px-4">Gancho do Post</th>
                    <th className="py-3 px-4">Chamada (CTA)</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {(selectedMonth === 0
                    ? report.calendar
                    : report.calendar.filter((d) => (d.month || 1) === selectedMonth)
                  )?.map((day) => {
                    const isLockedItem = !isUnlocked && day.day > 3;

                    return (
                      <tr
                        key={day.day}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                          isLockedItem ? 'opacity-40 select-none' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                          Dia {day.day}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.month === 1
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : day.month === 2
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            Mês {day.month || 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {day.dayOfWeek}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ee4957]/15 text-[#ee4957]">
                            {day.format}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {day.pillar}
                        </td>
                        <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 min-w-[200px]">
                          {day.theme}
                        </td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 min-w-[180px] italic">
                          "{day.hook}"
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 min-w-[160px]">
                          {day.cta}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isLockedItem ? (
                            <button
                              onClick={() => copySingleDay(day)}
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-800 dark:hover:bg-[#ee4957] text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                              title="Copiar dia de postagem para o Instagram"
                            >
                              {copiedId === `day-${day.day}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 hover:text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[10px] font-medium hidden sm:inline">
                                {copiedId === `day-${day.day}` ? 'Copiado!' : 'Copiar'}
                              </span>
                            </button>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-zinc-400 inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
