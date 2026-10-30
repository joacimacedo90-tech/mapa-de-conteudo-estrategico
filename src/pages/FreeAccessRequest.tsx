import React, { useState } from 'react';
import {
  Compass,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { api } from '../api';

interface FreeAccessRequestProps {
  onNavigate: (page: string) => void;
  onOpenLgpd: () => void;
}

export const FreeAccessRequestPage: React.FC<FreeAccessRequestProps> = ({
  onNavigate,
  onOpenLgpd
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.requestFreeAccess({
        name: name.trim(),
        email: email.trim().toLowerCase()
      });

      if (res.success) {
        setSubmittedEmail(email.trim().toLowerCase());
        setSubmitted(true);
      } else {
        throw new Error(res.message || 'Falha ao processar solicitação.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar solicitação.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-6 transition-colors duration-200">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </button>
      </div>

      {submitted ? (
        /* Success Confirmation Screen */
        <div className="bg-white dark:bg-[#121217] border border-emerald-300 dark:border-emerald-800/80 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              Solicitação Registrada
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-heading mt-2">
              Sua solicitação foi enviada! Aguarde a análise do administrador.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
              Registramos o pedido para <strong className="text-zinc-900 dark:text-white">{submittedEmail}</strong> com o status <em>"Aguardando aprovação"</em>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
              <Clock className="w-4 h-4 text-[#ee4957]" />
              <span>Como funciona a liberação:</span>
            </div>
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-[#ee4957] font-bold">•</span>
                <span>Nossa equipe revisa manualmente as solicitações para evitar cadastros automatizados.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#ee4957] font-bold">•</span>
                <span>Assim que aprovado, você receberá um <strong>convite seguro por e-mail</strong>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#ee4957] font-bold">•</span>
                <span>O link do convite é de <strong>uso único e possui validade de 48 horas</strong> para você criar sua senha e ativar a conta.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            >
              Já possui conta ativada? Entrar
            </button>
          </div>
        </div>
      ) : (
        /* Request Form Screen */
        <div className="bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ee4957] to-[#ff7b88] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#ee4957]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white font-heading">
              Solicitar Acesso Gratuito
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              O acesso gratuito ao MAPA DE CONTEÚDO funciona mediante solicitação e aprovação manual da equipe.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nome Completo <span className="text-[#ee4957]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-[#ee4957] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                E-mail <span className="text-[#ee4957]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-[#ee4957] font-medium"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Você receberá o convite de ativação seguro neste endereço após a aprovação.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ee4957] to-[#ff5d6c] hover:from-[#d93c4a] hover:to-[#ee4957] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ee4957]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enviando solicitação...</span>
                ) : (
                  <>
                    <span>Solicitar Acesso Gratuito</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-center space-y-2 text-xs">
            <p className="text-zinc-500">
              Já solicitou e foi aprovado pelo administrador?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-[#ee4957] hover:underline font-bold"
              >
                Fazer login
              </button>
            </p>

            <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dados protegidos e tratados em total conformidade com a LGPD.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
