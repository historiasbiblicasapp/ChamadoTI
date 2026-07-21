import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Shield, Clock, ChevronLeft, ChevronRight, Loader2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { AuditLog } from '../../types';
import { formatDate } from '../../utils/formatters';

const ACTION_LABELS: Record<string, string> = {
  ticket_created: 'Chamado Criado',
  ticket_updated: 'Chamado Atualizado',
  ticket_status_changed: 'Status Alterado',
  ticket_assigned: 'Chamado Atribuido',
  comment_added: 'Comentario Adicionado',
  asset_created: 'Ativo Criado',
  asset_updated: 'Ativo Atualizado',
  article_created: 'Artigo Criado',
  article_updated: 'Artigo Atualizado',
  article_deleted: 'Artigo Excluido',
  user_role_changed: 'Perfil Alterado',
  login: 'Login',
  logout: 'Logout',
};

const ACTION_COLORS: Record<string, string> = {
  ticket_created: 'bg-blue-500/20 text-blue-400',
  ticket_updated: 'bg-yellow-500/20 text-yellow-400',
  ticket_status_changed: 'bg-purple-500/20 text-purple-400',
  ticket_assigned: 'bg-netvision-500/20 text-netvision-400',
  comment_added: 'bg-green-500/20 text-green-400',
  asset_created: 'bg-cyan-500/20 text-cyan-400',
  asset_updated: 'bg-cyan-500/20 text-cyan-400',
  article_created: 'bg-emerald-500/20 text-emerald-400',
  article_updated: 'bg-emerald-500/20 text-emerald-400',
  article_deleted: 'bg-red-500/20 text-red-400',
  user_role_changed: 'bg-orange-500/20 text-orange-400',
  login: 'bg-green-500/20 text-green-400',
  logout: 'bg-gray-500/20 text-gray-400',
};

const ITEMS_PER_PAGE = 20;

export function AuditPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: () => api.audit.list(),
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchSearch = !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.full_name?.toLowerCase().includes(search.toLowerCase());

      const matchAction = actionFilter === 'all' || log.action === actionFilter;

      return matchSearch && matchAction;
    });
  }, [logs, search, actionFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueActions = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l) => l.action))];
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Auditoria</h1>
              <p className="text-sm text-gray-500 mt-1">Log de atividades do sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Pesquisar por acao, entidade ou usuario..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="select !w-auto !py-1.5 text-xs"
          >
            <option value="all">Todas as Acoes</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>{ACTION_LABELS[action] || action}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">{filtered.length} registro(s)</span>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">Data/Hora</th>
                <th className="table-header">Usuario</th>
                <th className="table-header">Acao</th>
                <th className="table-header">Entidade</th>
                <th className="table-header">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">Nenhum registro encontrado</td>
                </tr>
              ) : (
                paginated.map((log) => {
                  const actionColor = ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400';
                  return (
                    <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-[10px] font-bold shrink-0">
                            {log.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm text-gray-300">{log.user?.full_name || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-400">
                        {log.entity_type ? (
                          <span className="font-mono text-xs">{log.entity_type}</span>
                        ) : '-'}
                      </td>
                      <td className="table-cell">
                        {log.old_value && log.new_value ? (
                          <span className="text-xs text-gray-500">
                            {String(log.old_value).substring(0, 30)} → {String(log.new_value).substring(0, 30)}
                          </span>
                        ) : log.new_value ? (
                          <span className="text-xs text-gray-500">{String(log.new_value).substring(0, 50)}</span>
                        ) : (
                          <span className="text-xs text-gray-600">-</span>
                        )}
                      </td>
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
