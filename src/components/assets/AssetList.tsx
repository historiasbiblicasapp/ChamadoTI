import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { ASSET_TYPES, ASSET_STATUS_CONFIG } from '../../utils/constants';
import type { Asset, AssetStatus } from '../../types';
import { formatDate } from '../../utils/formatters';

interface AssetListProps {
  assets: Asset[];
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 15;

export function AssetList({ assets, isLoading }: AssetListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch = !search ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.patrimony?.toLowerCase().includes(search.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(search.toLowerCase()) ||
        asset.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || asset.type === typeFilter;
      const matchStatus = statusFilter === 'all' || asset.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [assets, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getTypeLabel = (type: string) => ASSET_TYPES.find((t) => t.value === type)?.label || type;
  const getStatusConfig = (status: string) => ASSET_STATUS_CONFIG[status as keyof typeof ASSET_STATUS_CONFIG];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Pesquisar por nome, patrimonio, IP, marca..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => navigate('/assets/new')}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Novo Ativo
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="select !w-auto !py-1.5 text-xs"
        >
          <option value="all">Todos os Tipos</option>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="select !w-auto !py-1.5 text-xs"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(ASSET_STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-2">{filtered.length} ativo(s)</span>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">Patrimonio</th>
                <th className="table-header">Nome</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Marca/Modelo</th>
                <th className="table-header">IP</th>
                <th className="table-header">Status</th>
                <th className="table-header">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">Carregando...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">Nenhum ativo encontrado</td>
                </tr>
              ) : (
                paginated.map((asset) => {
                  const statusCfg = getStatusConfig(asset.status);
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                    >
                      <td className="table-cell font-mono text-sm font-medium text-netvision-400">
                        {asset.patrimony || '-'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm text-gray-200">{asset.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-gray-400">{getTypeLabel(asset.type)}</td>
                      <td className="table-cell text-sm text-gray-400">
                        {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model || '-'}
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-400">{asset.ip_address || '-'}</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg?.bgColor || ''} ${statusCfg?.color || ''}`}>
                          {statusCfg?.label || asset.status}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500">{formatDate(asset.updated_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Pagina {currentPage} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary btn-sm flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary btn-sm flex items-center gap-1">
              Proximo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
