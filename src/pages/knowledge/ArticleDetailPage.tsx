import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Clock, Eye, Tag, User, Loader2, BookOpen } from 'lucide-react';
import { useArticle, useArticles } from '../../hooks/useKnowledge';
import { formatDate } from '../../utils/formatters';
import { KNOWLEDGE_CATEGORIES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../components/ui/Toaster';

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: article, isLoading } = useArticle(id || null);
  const { updateArticle, deleteArticle } = useArticles();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (article) {
      setEditTitle(article.title);
      setEditContent(article.content);
      setEditCategory(article.category || '');
    }
  }, [article]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-netvision-400" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/knowledge')} className="btn-ghost btn-sm flex items-center gap-1 text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>
        <div className="card flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Artigo nao encontrado</p>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return null;
    return KNOWLEDGE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'analyst';
  const categoryLabel = getCategoryLabel(editCategory || article.category);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateArticle.mutateAsync({
        id: article.id,
        updates: {
          title: editTitle,
          content: editContent,
          category: editCategory || null,
        },
      });
      showToast('success', 'Artigo Atualizado', 'As alteracoes foram salvas com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      showToast('error', 'Erro ao Salvar', error.message || 'Ocorreu um erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    try {
      await deleteArticle.mutateAsync(article.id);
      showToast('success', 'Artigo Excluido', 'O artigo foi excluido com sucesso!');
      navigate('/knowledge');
    } catch (error: any) {
      showToast('error', 'Erro ao Excluir', error.message || 'Ocorreu um erro ao excluir.');
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-200 mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-100 mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-100 mt-8 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-800 text-netvision-400 text-sm font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-300 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-gray-300 list-decimal">$2</li>')
      .replace(/\n\n/g, '<br /><br />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/knowledge')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-400" />
            </div>
            <div>
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input text-xl font-bold !bg-transparent"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-100">{article.title}</h1>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {categoryLabel && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {categoryLabel}
                  </span>
                )}
                {article.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.author.full_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(article.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views} visualizacao(es)
                </span>
              </div>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary btn-sm">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary btn-sm flex items-center gap-1.5">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button onClick={handleDelete} className="btn-ghost btn-sm text-red-400 hover:text-red-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoria</label>
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="select">
            <option value="">Selecione...</option>
            {KNOWLEDGE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {isEditing ? (
        <div className="card">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Conteudo (Markdown)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="input resize-none min-h-[500px] font-mono text-sm leading-relaxed"
          />
        </div>
      ) : (
        <div className="card">
          <div
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
        </div>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-netvision-600/20 text-netvision-400 text-xs font-medium">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
