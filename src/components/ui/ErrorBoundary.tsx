import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <div className="card max-w-md text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
            <h2 className="text-lg font-bold text-gray-100">Algo deu errado</h2>
            <p className="text-sm text-gray-400">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => window.location.reload()} className="btn-primary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </button>
              <a href="/dashboard" onClick={() => window.location.href = '/dashboard'} className="btn-secondary flex items-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
