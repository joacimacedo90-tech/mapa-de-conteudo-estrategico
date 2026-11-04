import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR_BOUNDARY_CATCH]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090d] text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121217] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ee4957]/15 border border-[#ee4957]/30 text-[#ee4957] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-white font-heading">
              Algo inesperado aconteceu
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed">
              O aplicativo encontrou uma divergência de carregamento. Você pode recarregar a página com segurança ou voltar para o início.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-left overflow-auto max-h-32 text-[11px] text-zinc-400 font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Página</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Voltar ao Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
