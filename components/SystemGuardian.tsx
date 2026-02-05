
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

interface SystemGuardianProps {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fix: Changed interface name to SystemGuardianProps and ensured correct inheritance from React.Component.
class SystemGuardian extends Component<SystemGuardianProps, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL UI CRASH:", error, errorInfo);
  }

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {
      console.error("Failed to clear storage during reset:", e);
    } finally {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    // Fix: Accessing children via this.props which is correctly typed via Component<SystemGuardianProps, State>.
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans overflow-hidden">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-red-500/30 p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
               <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Recuperação de Sistema</h1>
            <p className="text-slate-400 mb-6 text-sm">O Guardião interceptou um erro crítico (v{SYSTEM_IDENTITY.VERSION}).</p>
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32 border border-slate-700 custom-scrollbar">
              <code className="text-[10px] text-red-300 font-mono whitespace-pre-wrap">
                {error?.name}: {error?.message || "Erro inesperado detectado."}
              </code>
            </div>
            <button onClick={this.handleHardReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg">
              Reiniciar e Recarregar
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}
export default SystemGuardian;
