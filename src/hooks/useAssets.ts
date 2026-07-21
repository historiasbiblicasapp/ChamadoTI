import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Asset } from '../types';

export function useAssets(filters?: { type?: string; status?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery<Asset[]>({
    queryKey: ['assets', filters],
    queryFn: () => api.assets.list(filters),
    refetchInterval: 30000,
  });

  const createAsset = useMutation({
    mutationFn: (asset: Partial<Asset>) => api.assets.create(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Asset> }) =>
      api.assets.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
    },
  });

  return {
    assets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAsset,
    updateAsset,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  };
}

export function useAsset(id: string | null) {
  return useQuery<Asset | null>({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      return api.assets.get(id);
    },
    enabled: !!id,
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: () => api.assets.getStats(),
    refetchInterval: 60000,
  });
}
