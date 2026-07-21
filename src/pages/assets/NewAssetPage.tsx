import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { AssetForm } from '../../components/assets/AssetForm';
import { showToast } from '../../components/ui/Toaster';

export function NewAssetPage() {
  const navigate = useNavigate();
  const { createAsset } = useAssets();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const asset = await createAsset.mutateAsync(data);
      showToast('success', 'Ativo Cadastrado', `${asset.name} foi cadastrado com sucesso!`);
      navigate(`/assets/${asset.id}`);
    } catch (error: any) {
      showToast('error', 'Erro ao Cadastrar', error.message || 'Ocorreu um erro ao cadastrar o ativo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/assets')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Novo Ativo</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastrar um novo equipamento no sistema</p>
      </div>

      <AssetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
