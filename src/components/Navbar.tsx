import React, { useState } from 'react';
import { Compass, User as UserIcon, LogOut, Shield, Menu, X, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string, reportId?: string) => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  currentPage,
  onNavigate,
  isAdminLoggedIn
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isRealAdmin = Boolean(isAdminLoggedIn || currentUser?.role === 'admin');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#09090b]/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ee4957] to-[#ff7b88] flex items-center justify-center shadow-lg shadow-[#ee4957]/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                MAPA DE CONTEÚDO
              </span>
              <span className="w-2 h-2 rounded-full bg-[#ee4957] animate-pulse"></span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">
              Estratégia Instagram
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'home'
                ? 'text-[#ee4957] font-bold'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Início
          </button>
          <a
            href="#como-funciona"
            onClick={(e) => {
              if (currentPage !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Como Funciona
          </a>
          <a
            href="#planos"
            onClick={(e) => {
              if (currentPage !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Planos & Preços
          </a>
          <button
            onClick={() => onNavigate('comparison')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'comparison'
                ? 'text-[#ee4957] font-bold'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Comparar Planos
          </button>
          <button
            onClick={() => onNavigate('my-reports')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'my-reports'
                ? 'text-[#ee4957] font-bold'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Meus Relatórios
          </button>
        </nav>


        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Admin shortcut - Exclusively visible to verified logged-in administrator */}
          {isRealAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              title="Painel de Administração"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                currentPage === 'admin'
                  ? 'bg-[#ee4957] text-white border-[#ee4957] shadow-sm'
                  : 'bg-[#ee4957]/15 border-[#ee4957]/40 text-[#ee4957] hover:bg-[#ee4957]/25'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Painel Admin</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => onNavigate('my-reports')}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#ee4957]/40 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#ee4957]" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
              </button>
              <button
                onClick={onLogout}
                title="Sair"
                className="text-zinc-500 hover:text-[#ee4957] p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700/80 hover:border-[#ee4957]/50 transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#ee4957]" />
              Entrar
            </button>
          )}

          <button
            onClick={() => {
              if (currentPage !== 'home') {
                onNavigate('home');
              } else {
                document.getElementById('analisador')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold shadow-lg shadow-[#ee4957]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analisar Agora
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Admin shortcut on mobile - Only visible if real administrator */}
          {isRealAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="p-2 rounded-lg bg-[#ee4957]/15 border border-[#ee4957]/40 text-[#ee4957]"
              title="Painel Admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#121216] border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-3 transition-colors">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            Início
          </button>
          <button
            onClick={() => {
              onNavigate('comparison');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            Comparar Planos
          </button>
          <button
            onClick={() => {
              onNavigate('my-reports');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            Meus Relatórios
          </button>

          {/* Admin link inside mobile drawer - Only rendered for real administrator */}
          {isRealAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-[#ee4957] font-bold hover:bg-[#ee4957]/10 rounded-lg flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-[#ee4957]" />
              <span>Painel Administrativo</span>
            </button>
          )}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {currentUser ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{currentUser.email}</span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-[#ee4957] font-semibold"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-center text-sm font-semibold text-white"
              >
                Entrar / Cadastrar
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
