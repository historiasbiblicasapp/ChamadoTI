import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously in session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-gray-900 border border-netvision-500/40 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-netvision-600/20 text-netvision-400 border border-netvision-500/30 flex items-center justify-center shrink-0">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Instalar ChamadosTI Raitz</h3>
          <p className="text-xs text-gray-400 mt-0.5">Instale na sua tela inicial para acesso rápido e modo offline.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-netvision-600 hover:bg-netvision-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
