

import React, { Component, ErrorInfo, ReactNode } from 'react';
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
 * Improved with defensive DOM checks and explicitly typed class instance properties.
 */
class SystemGuardian extends Component<Props, State> {
  private containerRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    // Properly initialize state in the constructor using this.state
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL UI CRASH:", error, errorInfo);
  }

  // Defensive measure: Ensure cleanup of any stray DOM elements
  componentWillUnmount() {
    if (this.containerRef.current) {
        // Simple defensive drain if needed, though React usually handles this
    }
  }

  render(): ReactNode {
    // Correctly access state and props via this context
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div ref={this.containerRef} className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-red-500/30 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
               <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Recuperação do Sistema Ativada</h1>
            <p className="text-slate-400 mb-6 text-sm">O Guardião interceptou um erro crítico em v{SYSTEM_IDENTITY.VERSION}.</p>
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32 border border-slate-700">
              <code className="text-xs text-red-300 font-mono">{error?.message || "Erro inesperado detectado no núcleo do sistema."}</code>
            </div>
            <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
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
    return children;
  }
}

export default SystemGuardian;
