import React, { useState } from 'react';
import { Compass, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken, setAdminToken } from '../api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onAdminLoginSuccess: () => void;
  onNavigate: (page: string) => void;
  onOpenLgpd: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onAdminLoginSuccess,
  onNavigate,
  onOpenLgpd
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'admin') {
        const res = await api.adminLogin(password);
        if (res.success && res.token) {
          setAdminToken(res.token);
          onAdminLoginSuccess();
          onNavigate('admin');
        }
      } else if (mode === 'login') {
        const res = await api.login({ email, password });
        setAuthToken(res.token);
        onLoginSuccess(res.user);
        onNavigate('my-reports');
      } else {
        if (!lgpdConsent) {
          throw new Error('É necessário concordar com a LGPD para cadastrar uma conta.');
        }
        const res = await api.register({ name, email, password, lgpdConsent });
        setAuthToken(res.token);
        onLoginSuccess(res.user);
        onNavigate('my-reports');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 transition-colors duration-200">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ee4957] to-[#ff7b88] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#ee4957]/20">
          {mode === 'admin' ? <Shield className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
          {mode === 'admin'
            ? 'Acesso Administrativo'
            : mode === 'login'
            ? 'Acessar seus Relatórios'
            : 'Criar Conta no Mapa de Conteúdo'}
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {mode === 'admin'
            ? 'Painel restrito para gestão de relatórios, preços e webhooks'
            : 'Mantenha seus relatórios salvos e acesse suas estratégias a qualquer momento'}
        </p>
      </div>

      {/* Mode Selector */}
      {mode !== 'admin' && (
        <div className="flex rounded-xl bg-zinc-200/80 dark:bg-zinc-900 p-1 border border-zinc-300 dark:border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-[#18171f] text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-[#18171f] text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-none transition-colors">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Seu Nome</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                />
              </div>
            </div>
          )}

          {mode !== 'admin' && (
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              {mode === 'admin' ? 'Senha Mestra do Administrador' : 'Senha'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'admin' ? 'Senha de administrador' : '••••••••'}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ee4957]"
              />
            </div>
            {mode === 'admin' && (
              <p className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                (Senha padrão inicial do sistema: <code>admin123</code> - alterável no painel)
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[#ee4957] focus:ring-[#ee4957]"
                />
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                  Concordo com o armazenamento de relatórios e dados da conta em conformidade com a{' '}
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/25 transition-all cursor-pointer"
          >
            <span>{loading ? 'Processando...' : mode === 'admin' ? 'Entrar no Painel' : mode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          {mode === 'admin' ? (
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              ← Voltar ao login de usuários
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('admin');
                setError('');
              }}
              className="text-xs text-zinc-500 hover:text-[#ee4957] flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Acesso restrito para administradores</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
