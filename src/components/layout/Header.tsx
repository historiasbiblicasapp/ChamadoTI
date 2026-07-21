import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { showToast } from '../ui/Toaster';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(searchQuery.trim() ? `/tickets?search=${encodeURIComponent(searchQuery.trim())}` : '/tickets');
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('info', 'Sessao encerrada', 'Voce saiu do sistema');
      navigate('/login', { replace: true });
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel sair');
    }
  };

  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Pesquisar chamados, ativos, usuarios..."
            className="pl-10 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netvision-500 focus:border-transparent w-96"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
        </span>

        <NotificationBell />

        {profile && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-sm font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-all"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
