import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, X } from 'lucide-react';

interface LgpdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LgpdModal: React.FC<LgpdModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#26262e] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ee4957]/10 border border-[#ee4957]/20 flex items-center justify-center text-[#ee4957]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-heading">
              Política de Privacidade & Conformidade LGPD
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
            <p>
              <strong>Transparência e Respeito:</strong> O MAPA DE CONTEÚDO trata apenas as informações públicas e fornecidas voluntariamente por você (como @ de usuário, nicho e bio) com a finalidade exclusiva de gerar seu diagnóstico e planejamento de conteúdo.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <EyeOff className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
            <p>
              <strong>Sem Scraping Ilegal:</strong> Respeitamos integralmente os Termos da Meta/Instagram. Consultamos dados apenas quando autorizados via Meta Graph API oficial. Nunca solicitamos sua senha do Instagram nem simulamos dados falsos.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#ee4957] shrink-0 mt-0.5" />
            <p>
              <strong>Direito à Exclusão (Art. 18):</strong> Você possui controle total sobre suas informações. A qualquer momento, na seção 'Meus Relatórios', você pode excluir permanentemente seus dados e históricos com um único clique.
            </p>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p><strong>Segurança:</strong> Seus relatórios ficam armazenados com proteção em banco de dados isolado e nenhuma chave de API ou credencial confidencial é exposta ao navegador.</p>
            <p><strong>Processamento de Pagamento:</strong> O processamento financeiro é realizado com segurança pela Hotmart, que atua como controladora e operadora conforme as normas bancárias e PCI-DSS.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-[#ee4957]/20"
          >
            Entendi e concordo
          </button>
        </div>
      </div>
    </div>
  );
};
