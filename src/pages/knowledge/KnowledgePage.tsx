import { useState, useMemo } from 'react';
import { Search, Plus, Filter, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../../hooks/useKnowledge';
import { ArticleCard } from '../../components/knowledge/ArticleCard';
import { KNOWLEDGE_CATEGORIES } from '../../utils/constants';

export function KnowledgePage() {
  const navigate = useNavigate();
  const { articles, isLoading } = useArticles();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const matchSearch = !search ||
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        article.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = categoryFilter === 'all' || article.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [articles, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Base de Conhecimento</h1>
              <p className="text-sm text-gray-500 mt-1">Artigos, tutoriais e FAQ do TI</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/knowledge/new')} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Novo Artigo
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar artigos..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select !w-auto !py-1.5 text-xs"
          >
            <option value="all">Todas as Categorias</option>
            {KNOWLEDGE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">{filtered.length} artigo(s)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netvision-400"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center min-h-[300px]">
          <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-500">Nenhum artigo encontrado</p>
          <p className="text-xs text-gray-600 mt-1">Crie o primeiro artigo da base de conhecimento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
