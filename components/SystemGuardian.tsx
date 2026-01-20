
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { restoreFromBackup, factoryReset } from '../services/systemGuardianService';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SYSTEM GUARDIAN COMPONENT
 * This is the final safety net. If React crashes, this component catches it
 * and prevents the "White Screen of Death".
 */
// Fix: Explicitly extend React.Component to ensure the compiler correctly recognizes the generic props and state properties.
class SystemGuardian extends React.Component<Props, State> {
  // Ensure the state is correctly typed and initialized
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[System Guardian] CRITICAL APPLICATION ERROR CAUGHT:", error, errorInfo);
    // In a real scenario, we would send this to a logging service (Sentry, etc)
  }

  private handleAutoFix = () => {
    const success = restoreFromBackup();
    if (success) {
      alert("System restored to last known stable state. Reloading...");
      window.location.reload();
    } else {
      alert("No backup found. Performing partial reset...");
      window.location.reload();
    }
  };

  private handleHardReset = () => {
    if (window.confirm("Are you sure? This will clear all local data and reset the app to factory settings.")) {
      factoryReset();
    }
  };

  render() {
    // Fix: Accessing children from this.props now that the class correctly extends the React.Component base class.
    const { children } = this.props;

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-white">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-red-500/30 p-8 text-center">
            
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
               <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">System Protection Activated</h1>
            <p className="text-slate-400 mb-6">
              The System Guardian prevented a critical crash. <br/>
              Platform integrity is preserved, but we need to reload.
            </p>

            <div className="bg-black/30 rounded-lg p-4 mb-8 text-left overflow-auto max-h-32 border border-slate-700">
              <code className="text-xs text-red-300 font-mono">
                Error: {this.state.error?.message || "Unknown Runtime Error"}
              </code>
            </div>

            <div className="grid gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                Reload Application (Try this first)
              </button>

              <button 
                onClick={this.handleAutoFix}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                Restore Last Stable Version
              </button>

              <button 
                onClick={this.handleHardReset}
                className="w-full bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition"
              >
                Factory Reset (Clear Data)
              </button>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700 text-xs text-slate-500">
              <p>{SYSTEM_IDENTITY.NAME} • v{SYSTEM_IDENTITY.VERSION}</p>
              <p>Protected by AI System Guardian</p>
            </div>

          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
}

export default SystemGuardian;
