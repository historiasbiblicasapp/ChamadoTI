import { useNavigate } from 'react-router-dom';
import { Clock, Eye, Tag, User } from 'lucide-react';
import type { KnowledgeArticle } from '../../types';
import { formatDate } from '../../utils/formatters';
import { KNOWLEDGE_CATEGORIES } from '../../utils/constants';

interface ArticleCardProps {
  article: KnowledgeArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const navigate = useNavigate();

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return null;
    return KNOWLEDGE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  };

  const categoryLabel = getCategoryLabel(article.category);

  return (
    <div
      onClick={() => navigate(`/knowledge/${article.id}`)}
      className="card hover:border-netvision-500/30 cursor-pointer transition-all duration-200 group"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-200 group-hover:text-netvision-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
          {categoryLabel && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs font-medium">
              {categoryLabel}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-400 line-clamp-3">
          {article.content.replace(/[#*_`]/g, '').substring(0, 200)}...
        </p>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/50 text-gray-400 text-xs">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {article.tags.length > 5 && (
              <span className="text-xs text-gray-500">+{article.tags.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-800/50">
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
  );
}
