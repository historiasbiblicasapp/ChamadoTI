import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { KnowledgeArticle } from '../types';

export function useArticles(filters?: { category?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery<KnowledgeArticle[]>({
    queryKey: ['articles', filters],
    queryFn: () => api.knowledge.list(filters),
    refetchInterval: 30000,
  });

  const createArticle = useMutation({
    mutationFn: (article: Partial<KnowledgeArticle> & { tags?: string[] }) => api.knowledge.create(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const updateArticle = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<KnowledgeArticle> }) =>
      api.knowledge.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: (id: string) => api.knowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  return {
    articles: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createArticle,
    updateArticle,
    deleteArticle,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  };
}

export function useArticle(id: string | null) {
  return useQuery<KnowledgeArticle | null>({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) return null;
      return api.knowledge.get(id);
    },
    enabled: !!id,
  });
}
