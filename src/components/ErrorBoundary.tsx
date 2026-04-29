'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-14 h-14 bg-danger/10 border border-danger/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-danger" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Qualcosa è andato storto</h2>
          <p className="text-sm text-ink-secondary mb-4">Ricarica la pagina o torna alla dashboard.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm text-white hover:border-primary-500/30 transition-all"
          >
            Ricarica
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
