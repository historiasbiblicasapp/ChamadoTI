import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { AssetList } from '../../components/assets/AssetList';

export function AssetsPage() {
  const navigate = useNavigate();
  const { assets, isLoading } = useAssets();

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Ativos de TI</h1>
            <p className="text-sm text-gray-500 mt-1">Gerenciamento de equipamentos e patrimonios</p>
          </div>
        </div>
      </div>

      <AssetList assets={assets} isLoading={isLoading} />
    </div>
  );
}
