import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  QrCode,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api, FALLBACK_PLANS } from '../api';
import { PricingPlan, Report } from '../types';

interface CheckoutProps {
  reportId: string;
  initialPlanId?: string;
  onNavigate: (page: string, reportId?: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  reportId,
  initialPlanId = 'pro',
  onNavigate
}) => {
  const [plans, setPlans] = useState<PricingPlan[]>(FALLBACK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    checked: boolean;
    isPaid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([api.getPlans(), api.getReport(reportId)])
      .then(([plansRes, reportRes]) => {
        if (plansRes && Array.isArray(plansRes.plans) && plansRes.plans.length > 0) {
          setPlans(plansRes.plans);
        }
        setReport(reportRes.report);
        if (reportRes.report.isPaid) {
          onNavigate('report', reportId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || FALLBACK_PLANS.find((p) => p.id === selectedPlanId) || plans[0] || FALLBACK_PLANS[0];

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyPayment(reportId);
      setVerifyStatus({
        checked: true,
        isPaid: res.isPaid,
        message: res.message
      });
      if (res.isPaid) {
        setTimeout(() => {
          onNavigate('report', reportId);
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao checar status';
      setVerifyStatus({
        checked: true,
        isPaid: false,
        message: msg
      });
    } finally {
      setVerifying(false);
    }
  };

  // Generate real Hotmart checkout URL with sck tracking parameter attached
  const getHotmartCheckoutUrl = () => {
    if (!selectedPlan?.hotmartCheckoutUrl) return '#';
    const baseUrl = selectedPlan.hotmartCheckoutUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}sck=${encodeURIComponent(reportId)}&custom_data=${encodeURIComponent(reportId)}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#ee4957] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">Preparando checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 transition-colors duration-200">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('report', reportId)}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o relatório de @{report?.username || 'perfil'}</span>
        </button>
      </div>

      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading">
          Desbloqueie seu Planejamento Estratégico
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Escolha o plano ideal para alavancar <span className="text-zinc-900 dark:text-white font-semibold">@{report?.username}</span>. Pagamento único com liberação imediata via Hotmart.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => onNavigate('comparison', reportId)}
            className="inline-flex items-center gap-1.5 text-xs text-[#ee4957] hover:underline font-bold cursor-pointer"
          >
            <span>Ver tabela comparativa dos 3 planos (Recursos & Limites)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Plan selection pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlanId(p.id)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
              selectedPlanId === p.id
                ? 'bg-zinc-50 dark:bg-[#18171f] border-2 border-[#ee4957] shadow-lg shadow-[#ee4957]/15'
                : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
            }`}
          >
            {p.isPopular && (
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#ee4957] text-white text-[9px] font-black uppercase">
                Recomendado
              </span>
            )}
            {p.id === 'premium' && (
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase">
                90 Dias VIP
              </span>
            )}
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">{p.name}</h4>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-zinc-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 line-through">
                R$ {p.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            {p.installments && (
              <p className="text-[10px] text-[#ee4957] font-semibold mt-0.5">{p.installments}</p>
            )}
            <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">
              {p.limits?.calendarDays ? `${p.limits.calendarDays} dias de calendário` : 'Acesso imediato'}
            </p>
          </button>
        ))}
      </div>


      {/* Checkout Box */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#ee4957] tracking-wider">
              Plano Selecionado:
            </span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-0.5">
              {selectedPlan?.name}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md">{selectedPlan?.description}</p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
              De R$ {selectedPlan?.originalPrice.toFixed(2).replace('.', ',')}
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              R$ {selectedPlan?.price.toFixed(2).replace('.', ',')}
            </div>
            {selectedPlan?.installments && (
              <p className="text-xs text-[#ee4957] font-semibold">{selectedPlan.installments}</p>
            )}
          </div>
        </div>

        {/* Features included */}
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
            O que está incluso no seu acesso:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedPlan?.features.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods supported */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <QrCode className="w-4 h-4 text-[#ee4957]" />
              <strong>PIX</strong> (Liberação Imediata)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <CreditCard className="w-4 h-4 text-[#ee4957]" />
              <strong>Cartão de Crédito</strong> (em até 12x)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <FileCheck className="w-4 h-4 text-[#ee4957]" />
              <strong>Boleto</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-4 h-4" />
            <span>Processado com Segurança pela Hotmart</span>
          </div>
        </div>

        {/* Action button to Hotmart checkout */}
        <div className="space-y-3">
          <a
            href={getHotmartCheckoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-[#ee4957]/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>Ir para Pagamento Seguro na Hotmart</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
            🔒 Você será direcionado para o ambiente criptografado da Hotmart. O código do seu relatório (<code>{reportId.slice(0, 8)}...</code>) já foi anexado para liberação automática.
          </p>
        </div>

        {/* Verification section */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3 text-center">
          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
            Já concluiu o pagamento na Hotmart?
          </p>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-white inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#ee4957] ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Consultando webhook...' : 'Verificar confirmação do pagamento'}</span>
          </button>

          {verifyStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs max-w-md mx-auto text-left ${
                verifyStatus.isPaid
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Status da Transação:</p>
                  <p>{verifyStatus.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
