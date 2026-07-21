import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Save, X, Plus } from 'lucide-react';
import { KNOWLEDGE_CATEGORIES } from '../../utils/constants';

const articleSchema = z.object({
  title: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteudo deve ter pelo menos 10 caracteres'),
  category: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData> & { tags?: string[] };
  onSubmit: (data: ArticleFormData & { tags: string[] }) => Promise<void>;
  isLoading?: boolean;
}

export function ArticleForm({ initialData, onSubmit, isLoading }: ArticleFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      category: initialData?.category || '',
    },
  });

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFormSubmit = (data: ArticleFormData) => {
    onSubmit({ ...data, tags });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Artigo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Titulo *</label>
            <input {...register('title')} className="input" placeholder="Titulo do artigo" disabled={isLoading} />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoria</label>
            <select {...register('category')} className="select" disabled={isLoading}>
              <option value="">Selecione...</option>
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Conteudo *</label>
            <textarea
              {...register('content')}
              className="input resize-none min-h-[300px] font-mono text-sm leading-relaxed"
              placeholder="Escreva o conteudo do artigo aqui... (suporta Markdown)"
              disabled={isLoading}
            />
            {errors.content && <p className="text-xs text-red-400 mt-1">{errors.content.message}</p>}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Tags</h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="input flex-1"
            placeholder="Digite uma tag e pressione Enter"
            disabled={isLoading}
          />
          <button type="button" onClick={addTag} className="btn-secondary btn-sm flex items-center gap-1" disabled={isLoading}>
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-netvision-600/20 text-netvision-400 text-xs font-medium">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-netvision-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
