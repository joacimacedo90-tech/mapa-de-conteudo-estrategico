import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { api, setAuthToken } from '../api';
import { User } from '../types';

interface ActivateAccountProps {
  tokenFromUrl?: string;
  onLoginSuccess: (user: User) => void;
  onNavigate: (page: string) => void;
  onOpenLgpd: () => void;
}

export const ActivateAccount: React.FC<ActivateAccountProps> = ({
  tokenFromUrl,
  onLoginSuccess,
  onNavigate,
  onOpenLgpd
}) => {
  const [token, setToken] = useState(tokenFromUrl || '');
  const [verifying, setVerifying] = useState(true);
  const [invite, setInvite] = useState<{ name: string; email: string; expiresAt?: string } | null>(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    // If not passed as prop, look for token in window.location.search
    let activeToken = tokenFromUrl;
    if (!activeToken) {
      const params = new URLSearchParams(window.location.search);
      activeToken = params.get('token') || '';
    }
    setToken(activeToken);

    if (!activeToken) {
      setVerifying(false);
      setTokenError('Nenhum link ou código de ativação fornecido. Por favor, utilize o link enviado para o seu e-mail.');
      return;
    }

    const checkToken = async () => {
      try {
        setVerifying(true);
        setTokenError('');
        const res = await api.verifyFreeAccessInvite(activeToken);
        if (res.valid && res.name && res.email) {
          setInvite({
            name: res.name,
            email: res.email,
            expiresAt: res.expiresAt
          });
        } else {
          setTokenError(res.message || 'Convite inválido ou expirado.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao validar convite de ativação.';
        setTokenError(msg);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    if (!lgpdConsent) {
      setFormError('É necessário aceitar os termos de armazenamento de dados conforme a LGPD.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.activateFreeAccess({
        token,
        password,
        lgpdConsent
      });

      if (res.success && res.token && res.user) {
        setAuthToken(res.token);
        setActivated(true);
        setTimeout(() => {
          onLoginSuccess(res.user);
          onNavigate('my-reports');
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ativar conta.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#ee4957] border-t-transparent animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
          Validando seu convite de acesso...
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Verificando a chave de segurança única e o prazo de validade de 48 horas.
        </p>
      </div>
    );
  }

  if (tokenError || !invite) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#121216] border border-red-200 dark:border-red-900/50 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
              Convite Inválido ou Expirado
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {tokenError || 'Este link de convite é de uso único e pode ter expirado ou já ter sido utilizado para ativar a conta.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigate('solicitar-acesso')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Nova Solicitação
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#121216] border border-emerald-300 dark:border-emerald-800 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
              Conta Ativada com Sucesso!
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Seu acesso gratuito foi liberado. Redirecionando para o seu painel de relatórios...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 transition-colors duration-200">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-[#ee4957] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#ee4957]/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
          Ativar sua Conta Gratuita
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Sua solicitação foi aprovada pelo administrador. Crie sua senha de acesso para começar.
        </p>
      </div>

      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm transition-colors">
        {/* Approved User Info */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Acesso aprovado para:</span>
          </div>
          <div className="font-bold text-zinc-900 dark:text-white pl-6">{invite.name}</div>
          <div className="text-zinc-600 dark:text-zinc-400 pl-6 text-[11px] font-mono">{invite.email}</div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Criar Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[#ee4957] focus:ring-[#ee4957]"
              />
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                Concordo com o armazenamento dos meus dados e relatórios em conformidade com a{' '}
                <button
                  type="button"
                  onClick={onOpenLgpd}
                  className="text-[#ee4957] underline cursor-pointer"
                >
                  LGPD
                </button>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Ativando...' : 'Criar Senha e Ativar Acesso Gratuito'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          Este link é pessoal, criptografado e expira automaticamente após o primeiro uso.
        </div>
      </div>
    </div>
  );
};
