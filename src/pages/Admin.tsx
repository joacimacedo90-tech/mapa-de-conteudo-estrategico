import React, { useState, useEffect } from 'react';
import {
  Shield,
  Settings,
  DollarSign,
  FileText,
  Webhook,
  Unlock,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Key,
  Sparkles,
  Play,
  Copy,
  Check,
  Users,
  Award,
  Layers,
  Calendar,
  Lock,
  ArrowRight,
  UserCheck,
  UserX,
  Clock,
  Send,
  MailCheck
} from 'lucide-react';
import { api } from '../api';
import { Report, PricingPlan, AdminSettings, WebhookLog, CustomerAccess, PlanResourceLimits, FreeAccessRequest } from '../types';

interface AdminProps {
  onLogoutAdmin: () => void;
  onNavigate: (page: string, reportId?: string, planId?: string) => void;
}

export const Admin: React.FC<AdminProps> = ({ onLogoutAdmin, onNavigate }) => {
  const [tab, setTab] = useState<'reports' | 'plans' | 'settings' | 'webhooks' | 'accesses' | 'free-access'>('reports');

  // Data states
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [customerAccesses, setCustomerAccesses] = useState<CustomerAccess[]>([]);
  const [freeAccessRequests, setFreeAccessRequests] = useState<FreeAccessRequest[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter / Search
  const [searchTerm, setSearchTerm] = useState('');

  // Plans form state
  const [plansForm, setPlansForm] = useState<PricingPlan[]>([]);
  const [headlineBanner, setHeadlineBanner] = useState('');

  // Security & Meta tokens form
  const [hotmartToken, setHotmartToken] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [metaAccountId, setMetaAccountId] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Feedback notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Manual unlock modal / state
  const [unlockingReportId, setUnlockingReportId] = useState<string | null>(null);
  const [unlockPlanId, setUnlockPlanId] = useState<'essencial' | 'pro' | 'premium'>('pro');
  const [unlockNote, setUnlockNote] = useState('');

  // Webhook tester state
  const [simReportId, setSimReportId] = useState('');
  const [simPlanId, setSimPlanId] = useState<'essencial' | 'pro' | 'premium'>('pro');
  const [simEvent, setSimEvent] = useState<string>('PURCHASE_APPROVED');
  const [simEmail, setSimEmail] = useState('comprador@exemplo.com');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const webhookUrl = `${window.location.origin}/api/webhooks/hotmart`;

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsRes, settingsRes, webhooksRes, accessesRes, freeRes] = await Promise.all([
        api.getAdminReports(),
        api.getAdminSettings(),
        api.getAdminWebhooks(),
        api.getAdminCustomerAccesses().catch(() => ({ accesses: [] })),
        api.getAdminFreeAccessRequests().catch(() => ({ requests: [] }))
      ]);

      setReports(reportsRes.reports);
      setSettings(settingsRes.settings);
      setPlansForm(settingsRes.settings.plans || []);
      setHeadlineBanner(settingsRes.settings.headlineBanner || '');
      setHotmartToken(settingsRes.settings.hotmartWebhookToken || '');
      setMetaAccountId(settingsRes.settings.metaAccountId || '');
      setWebhookLogs(webhooksRes.logs);
      setCustomerAccesses(accessesRes.accesses || []);
      setFreeAccessRequests(freeRes.requests || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar dados administrativos';
      setNotice({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFreeAccess = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.adminApproveFreeAccessRequest(id);
      showNotification('Solicitação aprovada! Convite seguro gerado com validade de 48 horas.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao aprovar solicitação';
      showNotification(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectFreeAccess = async (id: string) => {
    const reason = window.prompt('Motivo da recusa (opcional):') ?? undefined;
    try {
      setActionLoadingId(id);
      await api.adminRejectFreeAccessRequest(id, reason);
      showNotification('Solicitação de acesso recusada.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao recusar solicitação';
      showNotification(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyInviteLink = (token: string, id: string) => {
    const link = `${window.location.origin}/?page=ativar-conta&token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteId(id);
    setTimeout(() => setCopiedInviteId(null), 2500);
    showNotification('Link de convite de uso único copiado para a área de transferência!');
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2500);
  };

  // Update plans
  const handleSavePlans = async () => {
    try {
      await api.updateAdminSettings({
        plans: plansForm,
        headlineBanner
      });
      showNotification('Planos, preços, limites e links da Hotmart salvos com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      showNotification(msg, 'error');
    }
  };

  // Update settings / Meta / Password
  const handleSaveSettings = async () => {
    try {
      await api.updateAdminSettings({
        hotmartWebhookToken: hotmartToken,
        metaAccountId,
        metaToken: metaToken || undefined,
        newPassword: newAdminPassword || undefined
      });
      setNewAdminPassword('');
      showNotification('Configurações do sistema atualizadas!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      showNotification(msg, 'error');
    }
  };

  // Manual unlock
  const handleManualUnlock = async () => {
    if (!unlockingReportId) return;
    try {
      await api.adminUnlockReport(unlockingReportId, unlockPlanId, unlockNote);
      showNotification(`Relatório ${unlockingReportId} liberado com sucesso no plano ${unlockPlanId.toUpperCase()}!`);
      setUnlockingReportId(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha no desbloqueio';
      showNotification(msg, 'error');
    }
  };

  // Delete report
  const handleDeleteReport = async (id: string, username: string) => {
    if (!window.confirm(`Excluir o relatório de @${username}?`)) return;
    try {
      await api.adminDeleteReport(id);
      showNotification('Relatório excluído com sucesso.');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      showNotification(msg, 'error');
    }
  };

  // Simulate Hotmart Webhook
  const handleSimulateWebhook = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.simulateWebhook({
        reportId: simReportId.trim() || undefined,
        event: simEvent,
        planId: simPlanId,
        buyerEmail: simEmail.trim()
      });
      setSimResult(res.simulationResult);
      showNotification(`Webhook ${simEvent} executado e avaliado pelo backend!`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro na execução do webhook';
      showNotification(msg, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Plan limit modifier helper
  const updatePlanLimits = (planIndex: number, field: keyof PlanResourceLimits, value: any) => {
    const updated = [...plansForm];
    if (!updated[planIndex].limits) {
      updated[planIndex].limits = {
        calendarDays: 30,
        hasDiagnosis: true,
        hasGrowthProjection: true,
        hasContentIdeas: true,
        hasReels: false,
        hasCarousels: false,
        hasStories: false,
        hasHooks: false,
        hasExportMarkdown: false,
        hasVipBadge: false
      };
    }
    updated[planIndex].limits = {
      ...updated[planIndex].limits,
      [field]: value
    };
    setPlansForm(updated);
  };

  // Calculations for KPI cards
  const totalReports = reports.length;
  const paidReports = reports.filter((r) => r.isPaid).length;
  const conversionRate = totalReports > 0 ? ((paidReports / totalReports) * 100).toFixed(1) : '0';
  const totalAccesses = customerAccesses.length;
  const activeAccesses = customerAccesses.filter((a) => a.status === 'active').length;

  const filteredReports = reports.filter(
    (r) =>
      r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ee4957]/15 border border-[#ee4957]/30 flex items-center justify-center text-[#ee4957]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-heading">
              Painel Administrativo Hotmart & Estratégia
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Gestão de relatórios, configuração dos 3 planos (R$ 47 / R$ 97 / R$ 197), links e auditoria de webhooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('comparison')}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ee4957]" />
            <span>Ver Comparativo Público</span>
          </button>

          <button
            onClick={loadData}
            title="Recarregar"
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Relatórios
          </span>
          <div className="text-xl font-black text-zinc-900 dark:text-white font-heading">{totalReports}</div>
          <p className="text-[10px] text-zinc-500">Perfis analisados</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Relatórios Pagos
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-heading">{paidReports}</div>
          <p className="text-[10px] text-zinc-500">Desbloqueados</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Assinantes Ativos
          </span>
          <div className="text-xl font-black text-[#ee4957] font-heading">{activeAccesses}</div>
          <p className="text-[10px] text-zinc-500">Hotmart oficial</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Solicitações Gratuitas
          </span>
          <div className="text-xl font-black text-amber-500 font-heading">
            {freeAccessRequests.filter((r) => r.status === 'Aguardando aprovação').length}
          </div>
          <p className="text-[10px] text-zinc-500">
            {freeAccessRequests.length} no total ({freeAccessRequests.filter((r) => r.status === 'Aprovado').length} aprovadas)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Webhooks
          </span>
          <div className="text-xl font-black text-zinc-900 dark:text-white font-heading">
            {webhookLogs.length}
          </div>
          <p className="text-[10px] text-zinc-500">Eventos na base</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'reports'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Gestão de Relatórios ({reports.length})</span>
        </button>

        <button
          onClick={() => setTab('plans')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'plans'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Configuração dos 3 Planos & Links Hotmart</span>
        </button>

        <button
          onClick={() => setTab('accesses')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'accesses'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registro de Assinantes ({customerAccesses.length})</span>
        </button>

        <button
          onClick={() => setTab('free-access')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'free-access'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Solicitações de Acesso Gratuito ({freeAccessRequests.length})</span>
          {freeAccessRequests.filter((r) => r.status === 'Aguardando aprovação').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {freeAccessRequests.filter((r) => r.status === 'Aguardando aprovação').length} pendente(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('webhooks')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'webhooks'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks & Testador ({webhookLogs.length})</span>
        </button>

        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tab === 'settings'
              ? 'bg-[#ee4957] text-white font-bold'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Segurança & Meta API</span>
        </button>
      </div>

      {/* =================================================== */}
      {/* TAB 1: REPORTS MANAGEMENT                           */}
      {/* =================================================== */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar @perfil, email ou ID..."
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-[#ee4957]"
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 self-end sm:self-auto">
              Exibindo {filteredReports.length} de {reports.length} relatórios
            </span>
          </div>

          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Instagram</th>
                    <th className="py-3 px-4">Status & Plano</th>
                    <th className="py-3 px-4">Nicho / Segmento</th>
                    <th className="py-3 px-4">Email do Usuário</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                        @{r.username}
                        <div className="text-[10px] text-zinc-500 font-mono font-normal">
                          ID: {r.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.isPaid ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            r.paidPlanId === 'premium'
                              ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            PAGO ({r.paidPlanId?.toUpperCase() || 'PRO'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                            GRATUITO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                        {r.niche || r.profession || 'Geral'}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {r.userEmail || 'Anônimo'}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => onNavigate('report', r.id)}
                          title="Visualizar"
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver</span>
                        </button>

                        {!r.isPaid && (
                          <button
                            onClick={() => {
                              setUnlockingReportId(r.id);
                              setUnlockPlanId('pro');
                            }}
                            title="Desbloquear Manualmente (PIX direto / VIP)"
                            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Liberar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReport(r.id, r.username)}
                          title="Excluir (LGPD)"
                          className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 2: PLANS & HOTMART CHECKOUT URLS CONFIGURATION  */}
      {/* =================================================== */}
      {tab === 'plans' && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                Configuração dos Três Planos, Links e Limites de Recursos
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Ajuste os preços oficiais (Essencial R$ 29,90, Pro R$ 49,90, Premium R$ 79,90), links de checkout Hotmart, códigos de oferta e limites de entrega.
              </p>
            </div>
            <button
              onClick={handleSavePlans}
              className="px-5 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#ee4957]/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

          {/* Headline banner */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-300 mb-1">
              Banner Promocional de Destaque (Topo do Site):
            </label>
            <input
              type="text"
              value={headlineBanner}
              onChange={(e) => setHeadlineBanner(e.target.value)}
              placeholder="Ex: Oferta Especial de Lançamento: Desbloqueie sua estratégia completa com desconto exclusivo!"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#ee4957]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {plansForm.map((plan, index) => (
              <div key={plan.id} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#ee4957] uppercase tracking-wider">
                    Plano {index + 1}: {plan.id.toUpperCase()}
                  </span>
                  {plan.isPopular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ee4957] text-white">
                      Mais Vendido
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Nome de Exibição</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => {
                      const updated = [...plansForm];
                      updated[index].name = e.target.value;
                      setPlansForm(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Preço Atual (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.price}
                      onChange={(e) => {
                        const updated = [...plansForm];
                        updated[index].price = parseFloat(e.target.value) || 0;
                        setPlansForm(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Preço De (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.originalPrice}
                      onChange={(e) => {
                        const updated = [...plansForm];
                        updated[index].originalPrice = parseFloat(e.target.value) || 0;
                        setPlansForm(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Texto de Parcelamento</label>
                  <input
                    type="text"
                    value={plan.installments || ''}
                    onChange={(e) => {
                      const updated = [...plansForm];
                      updated[index].installments = e.target.value;
                      setPlansForm(updated);
                    }}
                    placeholder="Ex: 5x de R$ 10,87"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                  />
                </div>

                {/* Hotmart Checkout URL */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Link de Checkout Hotmart (Individual):
                  </label>
                  <input
                    type="url"
                    value={plan.hotmartCheckoutUrl}
                    onChange={(e) => {
                      const updated = [...plansForm];
                      updated[index].hotmartCheckoutUrl = e.target.value;
                      setPlansForm(updated);
                    }}
                    placeholder="https://pay.hotmart.com/SEU_CODIGO"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957] font-mono"
                  />
                  <p className="mt-1 text-[10px] text-zinc-500">
                    O sistema anexa automaticamente <code>?sck=report_id</code> para liberar a análise certa.
                  </p>
                </div>

                {/* Hotmart Identification codes */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      ID Produto Hotmart
                    </label>
                    <input
                      type="text"
                      value={plan.hotmartProductId || ''}
                      onChange={(e) => {
                        const updated = [...plansForm];
                        updated[index].hotmartProductId = e.target.value;
                        setPlansForm(updated);
                      }}
                      placeholder="PROD_123456"
                      className="w-full px-2.5 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-[11px] font-mono text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      Código da Oferta
                    </label>
                    <input
                      type="text"
                      value={plan.hotmartOfferCode || ''}
                      onChange={(e) => {
                        const updated = [...plansForm];
                        updated[index].hotmartOfferCode = e.target.value;
                        setPlansForm(updated);
                      }}
                      placeholder="OFFER_ABC"
                      className="w-full px-2.5 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-[11px] font-mono text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Resource Limits Configuration */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">
                    Recursos & Limites de Entrega:
                  </span>

                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Dias de Calendário Liberados</label>
                    <select
                      value={plan.limits?.calendarDays || 30}
                      onChange={(e) => updatePlanLimits(index, 'calendarDays', parseInt(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value={30}>30 Dias (Mês 1)</option>
                      <option value={60}>60 Dias (Mês 1 e 2)</option>
                      <option value={90}>90 Dias Completos (Mês 1, 2 e 3)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.limits?.hasReels ?? false}
                        onChange={(e) => updatePlanLimits(index, 'hasReels', e.target.checked)}
                        className="rounded text-[#ee4957]"
                      />
                      <span>Liberar 10 Roteiros de Reels</span>
                    </label>

                    <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.limits?.hasCarousels ?? false}
                        onChange={(e) => updatePlanLimits(index, 'hasCarousels', e.target.checked)}
                        className="rounded text-[#ee4957]"
                      />
                      <span>Liberar 10 Carrosséis Estruturados</span>
                    </label>

                    <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.limits?.hasStories ?? false}
                        onChange={(e) => updatePlanLimits(index, 'hasStories', e.target.checked)}
                        className="rounded text-[#ee4957]"
                      />
                      <span>Liberar 10 Sequências de Stories</span>
                    </label>

                    <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.limits?.hasHooks ?? false}
                        onChange={(e) => updatePlanLimits(index, 'hasHooks', e.target.checked)}
                        className="rounded text-[#ee4957]"
                      />
                      <span>Liberar Banco de Ganchos & CTAs</span>
                    </label>

                    <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.limits?.hasVipBadge ?? false}
                        onChange={(e) => updatePlanLimits(index, 'hasVipBadge', e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Selo VIP de Alta Performance</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 3: CUSTOMER ACCESSES REGISTRY                   */}
      {/* =================================================== */}
      {tab === 'accesses' && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Registro de Assinantes & Compras Hotmart
              </h4>
              <p className="text-xs text-zinc-500">
                Clientes que realizaram compras registradas via Webhook oficial da Hotmart.
              </p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {customerAccesses.length} clientes registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4">Plano Contratado</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Transação Hotmart</th>
                  <th className="py-3 px-4">Oferta / Produto</th>
                  <th className="py-3 px-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {customerAccesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      Nenhum assinante registrado ainda. Quando compras forem aprovadas via Webhook, os acessos serão registrados aqui.
                    </td>
                  </tr>
                ) : (
                  customerAccesses.map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        {acc.name || 'Cliente'}
                        <div className="text-[11px] text-zinc-500 font-normal">{acc.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-black uppercase text-[#ee4957]">
                        {acc.planId}
                      </td>
                      <td className="py-3.5 px-4">
                        {acc.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            ATIVO
                          </span>
                        ) : acc.status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            PENDENTE (NÃO LIBERADO)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            REVOGADO ({acc.status.toUpperCase()})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                        {acc.transactionId}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {acc.offerCode || acc.productName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(acc.purchasedAt || acc.updatedAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* TAB: FREE ACCESS REQUESTS                           */}
      {/* =================================================== */}
      {tab === 'free-access' && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#ee4957]" />
                <span>Solicitações de Acesso Gratuito</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ee4957]/15 text-[#ee4957] border border-[#ee4957]/30">
                  {freeAccessRequests.length} solicitações
                </span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Conforme a nova regra de acesso gratuito: contas não são criadas automaticamente. O administrador analisa, aprova ou recusa, gerando um link de convite seguro de uso único válido por 48 horas.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Data do Pedido</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Convite / Validade (48h)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {freeAccessRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma solicitação de acesso gratuito registrada ainda.</p>
                        <p className="text-[11px] text-zinc-500">
                          Quando um usuário preencher o formulário público na página de Solicitar Acesso Gratuito, seu pedido aparecerá aqui para aprovação.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  freeAccessRequests.map((req) => {
                    const isApproved = req.status === 'Aprovado';
                    const isPending = req.status === 'Aguardando aprovação';
                    const isRejected = req.status === 'Recusado';
                    const isActivated = !!req.inviteUsedAt;
                    const isExpired = req.inviteExpiresAt ? new Date(req.inviteExpiresAt) < new Date() : false;

                    return (
                      <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{req.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono font-normal">{req.email}</div>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Aguardando aprovação</span>
                            </span>
                          )}
                          {isApproved && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <UserCheck className="w-3 h-3" />
                                <span>Aprovado</span>
                              </span>
                              {isActivated ? (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ Conta ativada
                                </div>
                              ) : isExpired ? (
                                <div className="text-[10px] text-red-500 font-medium">
                                  Convite expirado
                                </div>
                              ) : (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  Aguardando ativação pelo usuário
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <UserX className="w-3 h-3" />
                                <span>Recusado</span>
                              </span>
                              {req.rejectionReason && (
                                <div className="text-[10px] text-zinc-500 max-w-xs truncate" title={req.rejectionReason}>
                                  Motivo: {req.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {req.inviteToken ? (
                            <div className="space-y-1.5 max-w-xs">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteLink(req.inviteToken!, req.id)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {copiedInviteId === req.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400">Link Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-[#ee4957]" />
                                      <span>Copiar Link de Ativação</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              {req.inviteExpiresAt && (
                                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-400" />
                                  <span>
                                    Expira: {new Date(req.inviteExpiresAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(isPending || isRejected) && (
                              <button
                                type="button"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleApproveFreeAccess(req.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isRejected ? 'Reaprovar' : 'Aprovar'}</span>
                              </button>
                            )}

                            {isPending && (
                              <button
                                type="button"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleRejectFreeAccess(req.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/70 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-400 font-bold text-[11px] flex items-center gap-1 border border-red-200 dark:border-red-800 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Recusar</span>
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleApproveFreeAccess(req.id)}
                                title="Gera um novo link e estende a validade por mais 48 horas"
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Send className="w-3 h-3 text-[#ee4957]" />
                                <span>Regerar Link</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'webhooks' && (
        <div className="space-y-6">
          {/* Webhook Endpoint Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 text-white dark:bg-[#18171f] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ee4957] uppercase tracking-wider flex items-center gap-1.5">
                <Webhook className="w-4 h-4" />
                URL Oficial do Webhook Hotmart (Versão 2.0.0)
              </span>
              <span className="text-[10px] text-zinc-400">POST application/json</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-zinc-700 text-xs font-mono text-zinc-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="px-4 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedWebhookUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhookUrl ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Cole esta URL no painel da Hotmart em <strong>Ferramentas → Webhook (API e Notificações)</strong>.
              Configure o mesmo Hottok na aba <strong>Segurança & Meta API</strong> deste painel para validação de autenticidade.
            </p>
          </div>

          {/* Simulator tool */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#ee4957]" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                Testador de Notificações do Webhook Hotmart
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Dispare um teste real contra a rota de webhook para validar a avaliação de regras, o desbloqueio granular do plano selecionado e o tratamento de pagamentos pendentes ou cancelados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Evento Hotmart</label>
                <select
                  value={simEvent}
                  onChange={(e) => setSimEvent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="PURCHASE_APPROVED">PURCHASE_APPROVED (Aprovado)</option>
                  <option value="WAITING_PAYMENT">WAITING_PAYMENT (Pendente - Boleto)</option>
                  <option value="PURCHASE_REFUNDED">PURCHASE_REFUNDED (Reembolso)</option>
                  <option value="PURCHASE_CANCELED">PURCHASE_CANCELED (Cancelamento)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Plano Selecionado</label>
                <select
                  value={simPlanId}
                  onChange={(e) => setSimPlanId(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="essencial">ESSENCIAL (R$ 47)</option>
                  <option value="pro">PRO (R$ 97)</option>
                  <option value="premium">PREMIUM VIP (R$ 197)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">E-mail do Comprador</label>
                <input
                  type="email"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">ID do Relatório (Opcional)</label>
                <input
                  type="text"
                  value={simReportId}
                  onChange={(e) => setSimReportId(e.target.value)}
                  placeholder="ID do relatório"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{simulating ? 'Processando Webhook...' : 'Disparar Notificação de Teste'}</span>
              </button>
            </div>

            {simResult && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                <span className="font-bold text-zinc-500 block mb-1">Resposta do Backend:</span>
                <pre className="overflow-x-auto">{JSON.stringify(simResult, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Logs audit table */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Histórico de Eventos de Webhook Recebidos
              </h4>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {webhookLogs.length} eventos registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Evento</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Comprador</th>
                    <th className="py-3 px-4">Transação</th>
                    <th className="py-3 px-4">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {webhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                        Nenhum webhook recebido ainda.
                      </td>
                    </tr>
                  ) : (
                    webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.status === 'PROCESSED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              PROCESSADO
                            </span>
                          ) : log.status === 'ERROR' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                              ERRO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              IGNORADO / PENDENTE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-800 dark:text-zinc-200">
                          {log.event}
                        </td>
                        <td className="py-3 px-4 font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {log.planId || 'PRO'}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                          {log.reportId ? (
                            <span
                              onClick={() => onNavigate('report', log.reportId)}
                              className="text-[#ee4957] hover:underline cursor-pointer"
                            >
                              {log.reportId.slice(0, 8)}...
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                          {log.buyerEmail || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">
                          {log.transactionId || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 5: SETTINGS, META API & ADMIN PASSWORD          */}
      {/* =================================================== */}
      {tab === 'settings' && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                Configurações da Meta API e Segurança
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Gerencie credenciais oficiais da Meta, token do webhook da Hotmart e senha mestra.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#ee4957]/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>

          {/* Hotmart Webhook Token */}
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Webhook className="w-4 h-4 text-[#ee4957]" />
              Hotmart Hottok / Token Secreto do Webhook
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Copie o código de autenticação (Hottok) gerado na ferramenta de Webhooks da Hotmart e cole abaixo para validar cada evento recebido.
            </p>
            <input
              type="text"
              value={hotmartToken}
              onChange={(e) => setHotmartToken(e.target.value)}
              placeholder="Cole aqui o token Hottok da Hotmart"
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
            />
          </div>

          {/* Meta API Settings */}
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#ee4957]" />
              Credenciais Oficiais da Meta (Instagram Business Discovery)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Instagram Business Account ID
                </label>
                <input
                  type="text"
                  value={metaAccountId}
                  onChange={(e) => setMetaAccountId(e.target.value)}
                  placeholder="Ex: 17841400000000000"
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Meta User Access Token
                </label>
                <input
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAABw..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
                />
              </div>
            </div>
          </div>

          {/* Change Admin Password */}
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Alterar Senha do Administrador
            </h4>
            <div className="max-w-md">
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Nova Senha Mestra (mínimo 6 dígitos)</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#ee4957]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Unlock Modal */}
      {unlockingReportId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
              Desbloqueio Manual de Relatório
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Libere o acesso ao relatório <code>{unlockingReportId.slice(0, 8)}...</code> escolhendo o plano contratado.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-300 mb-1">
                Plano a Liberar:
              </label>
              <select
                value={unlockPlanId}
                onChange={(e) => setUnlockPlanId(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
              >
                <option value="essencial">Plano Essencial (R$ 29,90 - 30 dias)</option>
                <option value="pro">Plano Estratégico Pro (R$ 49,90 - 60 dias)</option>
                <option value="premium">Plano Premium VIP (R$ 79,90 - 90 dias)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-300 mb-1">
                Nota ou Justificativa (Opcional):
              </label>
              <input
                type="text"
                value={unlockNote}
                onChange={(e) => setUnlockNote(e.target.value)}
                placeholder="Ex: Pagamento PIX manual comprovado via WhatsApp"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnlockingReportId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleManualUnlock}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Desbloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
