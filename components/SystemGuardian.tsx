
import React, { ErrorInfo, ReactNode } from 'react';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SystemGuardian component provides a safety layer to catch UI errors.
 * Enhanced with defensive logic to prevent DOM mutation crashes.
 */
// Fix: Use React.Component to ensure proper inheritance and access to this.props and this.state
class SystemGuardian extends React.Component<Props, State> {
  // Fix: Initialize state as a class property with explicit type
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL UI CRASH:", error, errorInfo);
  }

  render(): ReactNode {
    // Fix: Access state and props via this.state and this.props specifically as a React.Component
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div key="system-error-overlay" className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans overflow-hidden">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-red-500/30 p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
               <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Recuperação de Sistema</h1>
            <p className="text-slate-400 mb-6 text-sm">O Guardião interceptou um erro crítico no núcleo do sistema (v{SYSTEM_IDENTITY.VERSION}).</p>
            
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32 border border-slate-700 custom-scrollbar">
              <code className="text-[10px] text-red-300 font-mono whitespace-pre-wrap">
                {error?.name}: {error?.message || "Erro inesperado detectado."}
              </code>
            </div>

            <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg"
                >
                  Tentar Novamente
                </button>
                <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }} 
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition text-xs opacity-60"
                >
                  Limpar Cache e Recarregar (Último Recurso)
                </button>
            </div>
          </div>
        </div>
      );
    }

    return children ? <div key="app-wrapper">{children}</div> : null;
  }
}

export default SystemGuardian;
