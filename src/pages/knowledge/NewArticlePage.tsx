import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useArticles } from '../../hooks/useKnowledge';
import { ArticleForm } from '../../components/knowledge/ArticleForm';
import { showToast } from '../../components/ui/Toaster';

export function NewArticlePage() {
  const navigate = useNavigate();
  const { createArticle } = useArticles();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const article = await createArticle.mutateAsync(data);
      showToast('success', 'Artigo Criado', 'O artigo foi criado com sucesso!');
      navigate(`/knowledge/${article.id}`);
    } catch (error: any) {
      showToast('error', 'Erro ao Criar', error.message || 'Ocorreu um erro ao criar o artigo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/knowledge')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Novo Artigo</h1>
        <p className="text-sm text-gray-500 mt-1">Criar um novo artigo na base de conhecimento</p>
      </div>

      <ArticleForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
