import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, CheckSquare, Square, Loader2 } from 'lucide-react';
import { useTickets } from '../../hooks/useTickets';
import { formatTicketNumber, formatDate } from '../../utils/formatters';
import { STATUSES, PRIORITIES, TICKET_CATEGORIES, PERIOD_OPTIONS } from '../../utils/constants';
import { SLAIndicator } from './SLAIndicator';
import { showToast } from '../ui/Toaster';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';
import type { TicketStatus, TicketPriority } from '../../types';

const ITEMS_PER_PAGE = 15;

export function TicketList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { tickets, isLoading } = useTickets();
  const [slaHoursMap, setSlaHoursMap] = useState<Record<string, number>>({});

  useEffect(() => {
    api.sla.list().then((rules) => {
      const map: Record<string, number> = {};
      rules.forEach((r) => { map[r.priority] = r.hours; });
      setSlaHoursMap(map);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchSearch = !search ||
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        String(ticket.ticket_number).includes(search) ||
        ticket.requester?.full_name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTickets = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const allVisibleSelected = paginatedTickets.length > 0 && paginatedTickets.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedTickets.some((t) => t.id === id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...paginatedTickets.map((t) => t.id)])]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBatchUpdate = async () => {
    if (!batchStatus || selectedIds.length === 0) return;
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updates = selectedIds.map(async (id) => {
        const updatePayload: any = { status: batchStatus, updated_at: new Date().toISOString() };

        if (batchStatus === 'open') {
          updatePayload.resolved_at = null;
          updatePayload.closed_at = null;
        }

        await supabase.from('tickets').update(updatePayload).eq('id', id);
        await supabase.from('ticket_history').insert({
          ticket_id: id,
          user_id: user?.id,
          action: 'status_changed',
          old_value: null,
          new_value: batchStatus,
        });
      });

      await Promise.all(updates);
      showToast('success', 'Lote atualizado', `${selectedIds.length} chamado(s) atualizado(s) para ${STATUSES[batchStatus as keyof typeof STATUSES]?.label || batchStatus}`);
      setSelectedIds([]);
      setBatchStatus('');
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel atualizar os chamados em lote');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Pesquisar por numero, titulo, solicitante..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Novo Chamado
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="select !w-auto !py-1.5 text-xs"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
          className="select !w-auto !py-1.5 text-xs"
        >
          <option value="all">Todas Prioridades</option>
          {Object.entries(PRIORITIES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-2">
          {filtered.length} chamado(s)
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="card border-netvision-500/30 bg-netvision-500/5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-300 font-medium">{selectedIds.length} chamado(s) selecionado(s)</span>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              className="select !w-auto !py-1.5 text-xs"
            >
              <option value="">Selecionar status...</option>
              {Object.entries(STATUSES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button
              onClick={handleBatchUpdate}
              disabled={!batchStatus || isUpdating}
              className="btn-primary btn-sm flex items-center gap-1"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Executar
            </button>
            <button
              onClick={() => { setSelectedIds([]); setBatchStatus(''); }}
              className="btn-secondary btn-sm"
            >
              Limpar Selecao
            </button>
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header w-10">
                  <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-300">
                    {allVisibleSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="table-header">Data</th>
                <th className="table-header">Numero</th>
                <th className="table-header">Titulo</th>
                <th className="table-header">Solicitante</th>
                <th className="table-header">Categoria</th>
                <th className="table-header">Prioridade</th>
                <th className="table-header">Status</th>
                <th className="table-header">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Carregando chamados...
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Nenhum chamado encontrado
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-gray-800/30 transition-colors ${selectedIds.includes(ticket.id) ? 'bg-netvision-500/5' : ''}`}
                  >
                    <td className="table-cell text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(ticket.id); }}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        {selectedIds.includes(ticket.id) ? <CheckSquare className="w-4 h-4 text-netvision-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="table-cell text-xs text-gray-500" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      {ticket.scheduled_date || formatDate(ticket.created_at)}
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium text-netvision-400">
                        {formatTicketNumber(ticket.ticket_number)}
                      </span>
                    </td>
                    <td className="table-cell cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <span className="text-sm text-gray-200 line-clamp-1">{ticket.title}</span>
                    </td>
                    <td className="table-cell text-sm text-gray-300 cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      {ticket.requester?.full_name || '-'}
                    </td>
                    <td className="table-cell text-sm text-gray-400 cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      {ticket.category?.name || '-'}
                    </td>
                    <td className="table-cell cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        PRIORITIES[ticket.priority]?.bgColor || ''
                      } ${PRIORITIES[ticket.priority]?.color || ''} ${PRIORITIES[ticket.priority]?.borderColor || ''}`}>
                        {PRIORITIES[ticket.priority]?.label || ticket.priority}
                      </span>
                    </td>
                    <td className="table-cell cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUSES[ticket.status]?.bgColor || ''
                      } ${STATUSES[ticket.status]?.color || ''}`}>
                        {STATUSES[ticket.status]?.label || ticket.status}
                      </span>
                    </td>
                    <td className="table-cell cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <SLAIndicator
                        priority={ticket.priority}
                        createdAt={ticket.created_at}
                        status={ticket.status}
                        slaHours={slaHoursMap[ticket.priority]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              Proximo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
