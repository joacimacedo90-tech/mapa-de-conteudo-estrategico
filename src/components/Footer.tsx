import React from 'react';
import { Compass, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenLgpd: () => void;
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLgpd, onNavigate }) => {
  return (
    <footer className="w-full bg-zinc-100 dark:bg-[#070709] border-t border-zinc-200 dark:border-zinc-800/80 pt-12 pb-8 text-zinc-600 dark:text-zinc-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-200 dark:border-zinc-800/60">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ee4957] to-[#ff7b88] flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-heading font-black text-zinc-900 dark:text-white text-base tracking-tight">
                MAPA DE CONTEÚDO
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed max-w-md">
              A inteligência analítica que transforma o perfil do seu Instagram em um funil de atração, autoridade e conversão. Diagnósticos cirúrgicos e cronogramas de 30 dias sob medida para o seu público.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 pt-1">
              <span>Desenvolvido com</span>
              <Heart className="w-3.5 h-3.5 text-[#ee4957] fill-[#ee4957]" />
              <span>para criadores e empresários no Brasil</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase text-[11px] tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Início
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('my-reports')}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Meus Relatórios
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ee4957]" />
              Privacidade & Termos
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={onOpenLgpd}
                  className="hover:text-[#ee4957] underline transition-colors cursor-pointer"
                >
                  Política de Privacidade & LGPD
                </button>
              </li>
              <li>
                <span className="text-zinc-500">Termos de Uso e Garantia</span>
              </li>
              <li>
                <span className="text-zinc-500">Processamento Seguro via Hotmart</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimers */}
        <div className="pt-6 space-y-3 text-[11px] text-zinc-500 leading-relaxed">
          <p>
            <strong>Aviso Legal & Direitos Autorais:</strong> Este site e as ferramentas de inteligência analítica fornecidas pelo MAPA DE CONTEÚDO não possuem qualquer afiliação, patrocínio ou endosso da Meta Platforms Inc. ou do Instagram. Todas as marcas registradas são de propriedade de seus respectivos titulares.
          </p>
          <p>
            <strong>Segurança nos Pagamentos:</strong> Os pagamentos, reembolsos e emissões fiscais são processados em ambiente criptografado e seguro pela plataforma <strong>Hotmart</strong>. Garantia incondicional de 7 dias assegurada pelo Código de Defesa do Consumidor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-600 gap-2">
            <span>© 2026 MAPA DE CONTEÚDO. Todos os direitos reservados.</span>
            <span>Conformidade com a Lei Geral de Proteção de Dados (LGPD nº 13.709/2018).</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
