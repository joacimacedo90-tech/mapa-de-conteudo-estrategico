import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border ${
        isDark
          ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-amber-400 hover:text-amber-300 hover:border-amber-400/40'
          : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-[#ee4957] hover:border-[#ee4957]/40 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
