import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2,
  CreditCard,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '../api';
import { Report, User, PricingPlan, PlanResourceLimits, CustomerAccess } from '../types';

interface MyReportsProps {
  currentUser: User | null;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
  onOpenLgpd: () => void;
  onLogout: () => void;
}

export const MyReports: React.FC<MyReportsProps> = ({
  currentUser,
  onNavigate,
  onOpenLgpd,
  onLogout
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [userPlanData, setUserPlanData] = useState<{
    hasActivePlan: boolean;
    activePlanId: string | null;
    planDetails: PricingPlan | null;
    planLimits: PlanResourceLimits | null;
    customerAccess: CustomerAccess | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  // Manual link purchase
  const [linkInput, setLinkInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [reportsRes, planRes] = await Promise.all([
        api.getUserReports(),
        api.getUserPlan().catch(() => null)
      ]);
      setReports(reportsRes.reports);
      if (planRes) {
        setUserPlanData(planRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleDeleteReport = async (id: string, username: string) => {
    if (!window.confirm(`Tem certeza que deseja apagar permanentemente o relatório de @${username}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteUserReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setMessage('Relatório excluído permanentemente da base de dados conforme a LGPD.');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLinkPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    try {
      setLinking(true);
      setLinkMessage(null);
      const res = await api.linkPurchase({
        reportId: linkInput.trim(),
        transactionId: linkInput.trim()
      });
      setLinkMessage({ type: 'success', text: res.message || 'Compra vinculada com sucesso!' });
      setLinkInput('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao vincular compra';
      setLinkMessage({ type: 'error', text: msg });
    } finally {
      setLinking(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccountLgpd();
      alert('Sua conta e todos os relatórios foram completamente apagados dos nossos servidores.');
      onLogout();
      onNavigate('home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir conta';
      alert(msg);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mx-auto">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
          Identifique-se para acessar seus relatórios
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Faça login com seu e-mail para visualizar todo o histórico de planejamentos salvos e suas compras.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-3 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Fazer Login ou Criar Conta
        </button>
      </div>
    );
  }

  const activePlan = userPlanData?.planDetails;
  const limits = userPlanData?.planLimits;
  const access = userPlanData?.customerAccess;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 transition-colors duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold text-[#ee4957] uppercase tracking-wider">
            Área do Cliente
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading mt-1">
            Painel do Assinante & Meus Relatórios
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Acessos registrados e histórico de análises para <strong>{currentUser.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('comparison')}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#ee4957]" />
            <span>Comparar Planos</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Nova Análise</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* =================================================== */}
      {/* CARD: MEU PLANO CONTRATADO                          */}
      {/* =================================================== */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ee4957]">
              Status da Assinatura Hotmart
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-heading mt-0.5">
              Meu Plano Contratado
            </h2>
          </div>

          <div>
            {userPlanData?.hasActivePlan && access?.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Acesso Ativo e Liberado</span>
              </span>
            ) : access?.status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Pagamento Pendente na Hotmart</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
                <span>Nenhum plano pago ativo (Prévia Gratuita)</span>
              </span>
            )}
          </div>
        </div>

        {userPlanData?.hasActivePlan && activePlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Plano Vigente</span>
              <div className="text-xl font-black text-zinc-900 dark:text-white font-heading">
                {activePlan.name}
              </div>
              <div className="text-sm font-bold text-[#ee4957]">
                R$ {activePlan.price.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{activePlan.description}</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Recursos Liberados</span>
              <ul className="text-xs space-y-1.5 text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Calendário: <strong>{limits?.calendarDays || 30} dias liberados</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  {limits?.hasReels ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>10 Roteiros de Reels: {limits?.hasReels ? 'Liberado' : 'Bloqueado (Requer PRO)'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  {limits?.hasCarousels ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>10 Carrosséis: {limits?.hasCarousels ? 'Liberado' : 'Bloqueado (Requer PRO)'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  {limits?.hasStories ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>10 Stories: {limits?.hasStories ? 'Liberado' : 'Bloqueado (Requer PRO)'}</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Detalhes da Transação</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono mt-1 truncate">
                  ID: {access?.transactionId || 'Ativado via Webhook'}
                </p>
                {access?.purchasedAt && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Ativado em: {new Date(access.purchasedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              {activePlan.id !== 'premium' ? (
                <button
                  onClick={() => onNavigate('comparison')}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#ee4957]/20"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Fazer Upgrade de Plano</span>
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center text-xs font-bold text-amber-700 dark:text-amber-300">
                  👑 Você possui o Plano Máximo (VIP)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Você ainda não contratou um plano completo
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md">
                Desbloqueie roteiros prontos de Reels, carrosséis estruturados e o calendário de até 90 dias com planos a partir de R$ 47.
              </p>
            </div>

            <button
              onClick={() => onNavigate('comparison')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-[#ee4957]/20 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver os 3 Planos Disponíveis (a partir de R$ 47)</span>
            </button>
          </div>
        )}

        {/* Sync purchase form */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500">
            Comprou na Hotmart e precisa vincular sua transação ou relatório existente?
          </div>
          <form onSubmit={handleLinkPurchase} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Cole o código do relatório ou transação..."
              className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#ee4957] w-full sm:w-64"
            />
            <button
              type="submit"
              disabled={linking || !linkInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-800 hover:bg-[#ee4957] text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
              {linking ? 'Vinculando...' : 'Vincular'}
            </button>
          </form>
        </div>
        {linkMessage && (
          <p className={`text-xs ${linkMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
            {linkMessage.text}
          </p>
        )}
      </div>

      {/* =================================================== */}
      {/* REPORTS LIST                                        */}
      {/* =================================================== */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
          Histórico de Relatórios Gerados
        </h3>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#ee4957] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Carregando relatórios...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
            <FileText className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
              Nenhum relatório encontrado para sua conta
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              Gere uma análise gratuita com o @ do seu Instagram na página inicial.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl bg-[#ee4957] text-white text-xs font-bold cursor-pointer"
            >
              Analisar meu Instagram Agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => {
              const planTag = r.isPaid
                ? r.paidPlanId === 'premium'
                  ? 'PLANO PREMIUM VIP'
                  : r.paidPlanId === 'essencial'
                  ? 'PLANO ESSENCIAL'
                  : 'PLANO PRO'
                : 'PRÉVIA GRATUITA';

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white font-heading">
                        @{r.username}
                      </span>
                      {r.isPaid ? (
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          r.paidPlanId === 'premium'
                            ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <Unlock className="w-3 h-3" />
                          {planTag}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#ee4957]" />
                          {planTag}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                      {r.niche && <p>Nicho: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{r.niche}</span></p>}
                      {r.profession && <p>Atuação: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{r.profession}</span></p>}
                      <p>Pontuação de Perfil: <strong className="text-zinc-900 dark:text-white">{r.diagnosis?.overallScore}/100</strong></p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Criado em: {new Date(r.createdAt).toLocaleDateString('pt-BR')} às {new Date(r.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('report', r.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-[#ee4957] hover:text-white dark:bg-zinc-900 dark:hover:bg-[#ee4957] border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Abrir Relatório</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {!r.isPaid && (
                        <button
                          onClick={() => onNavigate('comparison', r.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Desbloquear</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteReport(r.id, r.username)}
                      disabled={deletingId === r.id}
                      title="Excluir relatório conforme LGPD"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LGPD Management Box */}
      <div className="p-6 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/90 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#ee4957]" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
            Seus Direitos de Privacidade e Dados (LGPD)
          </h3>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Em cumprimento ao artigo 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode consultar a qualquer momento nossa{' '}
          <button onClick={onOpenLgpd} className="text-[#ee4957] underline cursor-pointer">
            Política de Privacidade
          </button>{' '}
          ou solicitar a eliminação definitiva de toda a sua conta e dados dos nossos servidores.
        </p>

        <div className="pt-2">
          {!confirmDeleteAccount ? (
            <button
              onClick={() => setConfirmDeleteAccount(true)}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Desejo excluir definitivamente minha conta e todos os dados</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 space-y-3">
              <p className="text-xs text-red-800 dark:text-red-200 font-semibold">
                ⚠️ Confirmação irreversível: Todos os relatórios, análises geradas e acessos vinculados ao email {currentUser.email} serão deletados para sempre.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  Sim, excluir tudo permanentemente
                </button>
                <button
                  onClick={() => setConfirmDeleteAccount(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
