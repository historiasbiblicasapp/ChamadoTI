import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'chamados_ti_lgpd_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-netvision-600/20 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-netvision-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-200 mb-1">Politica de Privacidade e Cookies</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Utilizamos cookies estritamente necessarios para o funcionamento do sistema (autenticacao de sessao).
              Nao utilizamos cookies de rastreamento. Ao continuar navegando, voce concorda com nossa{' '}
              <a href="/privacidade" target="_blank" className="text-netvision-400 hover:text-netvision-300 underline">
                Politica de Privacidade
              </a>.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={accept} className="btn-primary btn-sm text-xs">
                Aceitar
              </button>
              <button onClick={reject} className="btn-secondary btn-sm text-xs">
                Apenas Necessarios
              </button>
            </div>
          </div>
          <button onClick={reject} className="text-gray-500 hover:text-gray-300 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
