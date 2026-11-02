import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Calendar,
  Video,
  Layers,
  MessageSquare,
  Flame,
  HelpCircle,
  CreditCard,
  QrCode,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { api } from '../api';
import { PricingPlan } from '../types';

interface ComparisonProps {
  reportId?: string;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
}

export const Comparison: React.FC<ComparisonProps> = ({ reportId, onNavigate }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportUsername, setReportUsername] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getPlans(),
      reportId ? api.getReport(reportId).catch(() => null) : Promise.resolve(null)
    ])
      .then(([plansRes, reportRes]) => {
        setPlans(plansRes.plans);
        if (reportRes?.report) {
          setReportUsername(reportRes.report.username);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportId]);

  const getCheckoutLink = (plan: PricingPlan) => {
    if (!plan.hotmartCheckoutUrl) return '#';
    const base = plan.hotmartCheckoutUrl;
    const separator = base.includes('?') ? '&' : '?';
    const sckParam = reportId ? `sck=${encodeURIComponent(reportId)}&custom_data=${encodeURIComponent(reportId)}` : 'src=mapa_comparativo';
    return `${base}${separator}${sckParam}`;
  };

  const getPlanById = (id: string) => plans.find((p) => p.id === id) || plans[0];

  const planEssencial = getPlanById('essencial');
  const planPro = getPlanById('pro');
  const planPremium = getPlanById('premium');

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#ee4957] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">Carregando comparativo de planos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12 transition-colors duration-200">
      {/* Top back navigation */}
      <div>
        <button
          onClick={() => {
            if (reportId) onNavigate('report', reportId);
            else onNavigate('home');
          }}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{reportId ? `Voltar ao Relatório de @${reportUsername || 'perfil'}` : 'Voltar para a Página Inicial'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ee4957]/10 dark:bg-[#ee4957]/20 border border-[#ee4957]/30 text-[#ee4957] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Comparativo Oficial de Planos Hotmart</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white font-heading tracking-tight leading-tight">
          Escolha o Plano Ideal para o seu Instagram
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          {reportUsername ? (
            <>
              Desbloqueie o planejamento estratégico de <strong className="text-zinc-900 dark:text-white">@{reportUsername}</strong>. Todos os planos contam com acesso liberado automaticamente após aprovação do pagamento.
            </>
          ) : (
            'Compare os recursos de cada plano e acelere seu alcance, engajamento e vendas com roteiros validados e cronograma estratégico.'
          )}
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* PLAN 1: ESSENCIAL */}
        <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Entrada Estratégica
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold uppercase">
                30 Dias
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-heading">
                {planEssencial.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 min-h-[36px]">
                {planEssencial.description}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-400 line-through">
                De R$ {planEssencial.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-zinc-900 dark:text-white">
                  R$ {planEssencial.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-zinc-500">à vista</span>
              </div>
              {planEssencial.installments && (
                <p className="text-xs text-[#ee4957] font-semibold mt-1">
                  ou {planEssencial.installments}
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Diagnóstico de Posicionamento & Bio</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Projeção de Seguidores em 90 Dias</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>30 Ideias de Conteúdo Estratégico</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Calendário Editorial de 30 Dias</strong> (Mês 1)</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-400 dark:text-zinc-500">
                <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0 mt-0.5" />
                <span>10 Roteiros de Reels Prontos</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-400 dark:text-zinc-500">
                <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0 mt-0.5" />
                <span>10 Carrosséis Estruturados</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-400 dark:text-zinc-500">
                <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0 mt-0.5" />
                <span>10 Sequências de Stories</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <a
              href={getCheckoutLink(planEssencial)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
            >
              <span>Comprar Plano Essencial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <p className="text-[10px] text-zinc-400 text-center mt-2.5">
              Pagamento único via Hotmart
            </p>
          </div>
        </div>

        {/* PLAN 2: PRO (RECOMENDADO / MAIS VENDIDO) */}
        <div className="rounded-3xl p-6 sm:p-7 bg-zinc-900 text-white dark:bg-[#18171f] border-2 border-[#ee4957] flex flex-col justify-between shadow-xl shadow-[#ee4957]/15 relative transform md:-translate-y-2">
          {/* Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
            🔥 Mais Escolhido & Recomendado
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#ee4957] uppercase tracking-wider">
                Acelerador Completo
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ee4957]/20 border border-[#ee4957]/40 text-[#ee4957] text-[10px] font-extrabold uppercase">
                60 Dias
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-heading">
                {planPro.name}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 min-h-[36px]">
                {planPro.description}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <span className="text-xs text-zinc-400 line-through">
                De R$ {planPro.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-4xl font-black text-white">
                  R$ {planPro.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-zinc-400">à vista</span>
              </div>
              {planPro.installments && (
                <p className="text-xs text-[#ee4957] font-semibold mt-1">
                  ou {planPro.installments}
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-800 text-xs">
              <div className="flex items-start gap-2 text-zinc-100 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                <span>Tudo do Plano Essencial</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10 Roteiros de Reels Prontos</strong> (Ganchos + CTA)</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10 Carrosséis Estruturados</strong> Slide a Slide</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10 Sequências de Stories</strong> de Alta Conversão</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Banco de Ganchos Magnéticos</strong> & Legendas</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Calendário Editorial de 60 Dias</strong> (Mês 1 e 2)</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-400">
                <XCircle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <span>Mês 3 do Calendário (Escala Trimestral)</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <a
              href={getCheckoutLink(planPro)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/30 transition-all transform hover:scale-[1.02] cursor-pointer text-center"
            >
              <span>Comprar Plano Pro (R$ {planPro.price.toFixed(2).replace('.', ',')})</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Acesso imediato via Hotmart Webhook
            </p>
          </div>
        </div>

        {/* PLAN 3: PREMIUM VIP */}
        <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#121216] border border-amber-300 dark:border-amber-500/30 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Acesso Total & Escala
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase">
                90 Dias
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-heading">
                {planPremium.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 min-h-[36px]">
                {planPremium.description}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-400 line-through">
                De R$ {planPremium.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-zinc-900 dark:text-white">
                  R$ {planPremium.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-zinc-500">à vista</span>
              </div>
              {planPremium.installments && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  ou {planPremium.installments}
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Tudo do Plano Pro Incluso</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Calendário Trimestral de 90 Dias</strong> (Mês 1, 2 e 3)</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Estratégia de Escala & Conversão para Mês 3</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Todos os 10 Reels + 10 Carrosséis + 10 Stories</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Exportação Ilimitada em PDF e Markdown</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Checklist de Otimização de Perfil de Alta Conversão</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Selo VIP de Alta Performance & Suporte Prioritário</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <a
              href={getCheckoutLink(planPremium)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center shadow-md shadow-amber-600/20"
            >
              <span>Comprar Plano Premium VIP</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Pagamento único com garantia total
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED FEATURE COMPARISON TABLE */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-heading">
            Matriz Comparativa Detalhada
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Veja exatamente o que você recebe em cada opção e garanta o melhor retorno sobre o investimento.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-4 px-4 font-bold text-zinc-900 dark:text-white w-2/5">
                  Recursos & Benefícios
                </th>
                <th className="py-4 px-4 font-bold text-center text-zinc-900 dark:text-white w-1/5">
                  ESSENCIAL
                  <div className="text-[11px] font-normal text-zinc-500">R$ {planEssencial.price.toFixed(2).replace('.', ',')}</div>
                </th>
                <th className="py-4 px-4 font-bold text-center text-[#ee4957] w-1/5 bg-[#ee4957]/5 dark:bg-[#ee4957]/10 rounded-t-xl">
                  PRO (Recomendado)
                  <div className="text-[11px] font-normal text-[#ee4957]">R$ {planPro.price.toFixed(2).replace('.', ',')}</div>
                </th>
                <th className="py-4 px-4 font-bold text-center text-amber-600 dark:text-amber-400 w-1/5">
                  PREMIUM VIP
                  <div className="text-[11px] font-normal text-zinc-500">R$ {planPremium.price.toFixed(2).replace('.', ',')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {/* Row 1 */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Diagnóstico de Posicionamento & Bio Otimizada
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Projeção de Crescimento de Seguidores em 90 Dias (3 Cenários)
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  30 Ideias de Conteúdo Estratégico (Autoridade, Conexão, Educação, Venda)
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
              </tr>

              {/* Row 4: Calendar */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Dias de Calendário Editorial Liberados
                </td>
                <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                  30 Dias (Mês 1)
                </td>
                <td className="py-3 px-4 text-center font-black text-[#ee4957] bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  60 Dias (Mês 1 e 2)
                </td>
                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400">
                  90 Dias (Mês 1, 2 e 3)
                </td>
              </tr>

              {/* Row 5: Reels */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  10 Roteiros Prontos de Reels (Ganchos + Quebra + CTA + Áudio)
                </td>
                <td className="py-3 px-4 text-center">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  10 Roteiros
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  10 Roteiros
                </td>
              </tr>

              {/* Row 6: Carousels */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  10 Carrosséis Estruturados Slide a Slide
                </td>
                <td className="py-3 px-4 text-center">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  10 Carrosséis
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  10 Carrosséis
                </td>
              </tr>

              {/* Row 7: Stories */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  10 Sequências de Stories de Alta Conversão (Enquetes, Caixas, DMs)
                </td>
                <td className="py-3 px-4 text-center">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  10 Sequências
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  10 Sequências
                </td>
              </tr>

              {/* Row 8: Hooks */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Banco de Ganchos Magnéticos & Modelos de Legenda
                </td>
                <td className="py-3 px-4 text-center">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
              </tr>

              {/* Row 9: Export */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Copiar e Exportar Conteúdo para o Instagram
                </td>
                <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">
                  Individual
                </td>
                <td className="py-3 px-4 text-center font-semibold text-zinc-900 dark:text-white bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  Completo
                </td>
                <td className="py-3 px-4 text-center font-semibold text-zinc-900 dark:text-white">
                  Ilimitado (90 Dias)
                </td>
              </tr>

              {/* Row 10: VIP badge / scale */}
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                  Selo VIP de Alta Performance & Suporte Prioritário
                </td>
                <td className="py-3 px-4 text-center">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto" />
                </td>
              </tr>

              {/* Bottom Action Row */}
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-800">
                <td className="py-5 px-4 font-bold text-zinc-900 dark:text-white">
                  Acesso Imediato
                </td>
                <td className="py-5 px-4 text-center">
                  <a
                    href={getCheckoutLink(planEssencial)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                  >
                    <span>R$ {planEssencial.price.toFixed(2).replace('.', ',')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="py-5 px-4 text-center bg-[#ee4957]/5 dark:bg-[#ee4957]/10">
                  <a
                    href={getCheckoutLink(planPro)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#ee4957]/20 transition-all transform hover:scale-105"
                  >
                    <span>R$ {planPro.price.toFixed(2).replace('.', ',')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
                <td className="py-5 px-4 text-center">
                  <a
                    href={getCheckoutLink(planPremium)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                  >
                    <span>R$ {planPremium.price.toFixed(2).replace('.', ',')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security, Hotmart & Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
            Ambiente 100% Criptografado Hotmart
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Seus dados são protegidos pela maior plataforma de produtos digitais da América Latina.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
            Liberação Instantânea via Webhook
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pagamentos via PIX ou Cartão liberam os recursos do seu plano automaticamente em segundos.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
            Garantia Incondicional de 7 Dias
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Se não ficar 100% satisfeito com o direcionamento estratégico, solicite reembolso com 1 clique na Hotmart.
          </p>
        </div>
      </div>
    </div>
  );
};
