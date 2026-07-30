import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Ticket, AlertTriangle, CheckCircle, Clock, BarChart3, Users,
  TrendingUp, Calendar, ArrowRight, AlertCircle, Timer
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { ChartWidget } from '../components/dashboard/ChartWidget';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SLAIndicator } from '../components/tickets/SLAIndicator';
import { showToast } from '../components/ui/Toaster';
import { formatTicketNumber, formatDate, timeAgo, cleanTicketTitle } from '../utils/formatters';
import { STATUSES, PRIORITIES } from '../utils/constants';
import { api } from '../services/api';
import type { TicketStatus, TicketPriority } from '../types';
import {
  useTicketStats,
  useDashboardByMonth,
  useDashboardByCategory,
  useDashboardByDepartment,
  useDashboardByPriority,
  useDashboardAvgTimes,
  useDashboardRecent,
  useDashboardSlaAlerts,
} from '../hooks/useTickets';

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useTicketStats();
  const { data: byMonth, isLoading: monthLoading } = useDashboardByMonth();
  const { data: byCategory, isLoading: catLoading } = useDashboardByCategory();
  const { data: byDepartment, isLoading: deptLoading } = useDashboardByDepartment();
  const { data: byPriority, isLoading: priLoading } = useDashboardByPriority();
  const { data: avgTimes, isLoading: avgLoading } = useDashboardAvgTimes();
  const { data: recent, isLoading: recentLoading } = useDashboardRecent(8);
  const { data: slaAlerts, isLoading: slaLoading } = useDashboardSlaAlerts();
  const [slaHoursMap, setSlaHoursMap] = useState<Record<string, number>>({});
  const [resolvingAll, setResolvingAll] = useState(false);

  useEffect(() => {
    api.sla.list().then((rules) => {
      const map: Record<string, number> = {};
      rules.forEach((r) => { map[r.priority] = r.hours; });
      setSlaHoursMap(map);
    }).catch(() => {});
  }, []);

  const priorityData = useMemo(() => {
    if (!byPriority) return [];
    const colors: Record<string, string> = {
      'Baixa': '#3b82f6',
      'Media': '#eab308',
      'Alta': '#f97316',
      'Critica': '#ef4444',
    };
    return byPriority.map((p) => ({ ...p, color: colors[p.name] || '#6b7280' }));
  }, [byPriority]);

  const slaAlertsWithTime = useMemo(() => {
    if (!slaAlerts) return [];
    return slaAlerts.map((t: any) => ({
      ...t,
      slaInfo: SLAIndicator({
        priority: t.priority,
        createdAt: t.created_at,
        status: t.status,
        slaHours: slaHoursMap[t.priority],
      }),
    }));
  }, [slaAlerts, slaHoursMap]);

  const handleResolveAllExpired = async () => {
    setResolvingAll(true);
    try {
      const count = await api.tickets.resolveAllExpired();
      showToast('success', 'Chamados Resolvidos', `${count} chamado(s) com SLA vencido foram resolvidos com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-sla-alerts'] });
    } catch {
      showToast('error', 'Erro', 'Não foi possível resolver os chamados vencidos.');
    } finally {
      setResolvingAll(false);
    }
  };

  if (statsLoading) {
    return <LoadingSpinner text="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Visao geral do sistema de chamados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Atualizacao automatica</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="Abertos"
          value={stats?.open || 0}
          icon={Ticket}
          color="text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          title="Em Atendimento"
          value={stats?.inProgress || 0}
          icon={Clock}
          color="text-yellow-400"
          loading={statsLoading}
        />
        <StatCard
          title="Pendentes"
          value={stats?.pending || 0}
          icon={AlertTriangle}
          color="text-orange-400"
          loading={statsLoading}
        />
        <StatCard
          title="Resolvidos"
          value={stats?.resolved || 0}
          icon={CheckCircle}
          color="text-green-400"
          loading={statsLoading}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Geral"
          value={stats?.total || 0}
          icon={BarChart3}
          color="text-netvision-400"
          loading={statsLoading}
        />
        <StatCard
          title="Chamados Hoje"
          value={stats?.today || 0}
          icon={Calendar}
          color="text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          title="Chamados Semana"
          value={stats?.week || 0}
          icon={TrendingUp}
          color="text-purple-400"
          loading={statsLoading}
        />
        <StatCard
          title="SLA Vencidos"
          value={stats?.slaExpired || 0}
          icon={AlertCircle}
          color="text-red-400"
          loading={statsLoading}
        />
      </div>

      {/* Avg Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Timer className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tempo Medio Resolucao</p>
              <p className="text-2xl font-bold text-green-400">
                {avgLoading ? '-' : avgTimes?.avgResolution ? `${avgTimes.avgResolution.toFixed(1)}h` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="card border-netvision-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-netvision-500/10">
              <BarChart3 className="w-6 h-6 text-netvision-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total de Chamados</p>
              <p className="text-2xl font-bold text-netvision-400">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Chamados por Mes (ultimos 12 meses)"
          type="bar"
          data={byMonth || []}
          dataKey="value"
          xKey="name"
          color="#0c8ee2"
          height={300}
          loading={monthLoading}
        />
        <ChartWidget
          title="Chamados por Categoria"
          type="pie"
          data={byCategory || []}
          dataKey="value"
          xKey="name"
          height={300}
          loading={catLoading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Chamados por Setor"
          type="bar"
          data={byDepartment || []}
          dataKey="value"
          xKey="name"
          color="#22c55e"
          height={300}
          loading={deptLoading}
        />
        <ChartWidget
          title="Chamados por Prioridade"
          type="pie"
          data={priorityData}
          dataKey="value"
          xKey="name"
          height={300}
          loading={priLoading}
        />
      </div>

      {/* Bottom Row: Recent + SLA Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Chamados Recentes</h3>
            <button
              onClick={() => navigate('/tickets')}
              className="text-xs text-netvision-400 hover:text-netvision-300 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
            ) : !recent || recent.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">Nenhum chamado encontrado</p>
            ) : (
              recent.map((ticket: any) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <span className="font-mono text-xs font-medium text-netvision-400 w-20 shrink-0">
                    {formatTicketNumber(ticket.ticket_number)}
                  </span>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm text-gray-200 truncate">{cleanTicketTitle(ticket.title)}</p>
                    <p className="text-xs text-gray-500">{ticket.requester?.full_name || '-'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUSES[ticket.status as TicketStatus]?.bgColor || ''
                  } ${STATUSES[ticket.status as TicketStatus]?.color || ''}`}>
                    {STATUSES[ticket.status as TicketStatus]?.label || ticket.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SLA Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Alertas de SLA</h3>
            <span className="text-xs text-red-400 font-medium">
              {slaAlerts?.length || 0} pendente(s)
            </span>
          </div>
          {slaAlerts && slaAlerts.length > 0 && (
            <div className="mb-3">
              <button
                onClick={handleResolveAllExpired}
                disabled={resolvingAll}
                className="btn-success btn-sm w-full flex items-center justify-center gap-2"
              >
                {resolvingAll ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resolvendo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Resolver Todos os Vencidos
                  </>
                )}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {slaLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
            ) : !slaAlerts || slaAlerts.length === 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">Todos os SLAs dentro do prazo</p>
                  <p className="text-xs text-gray-500">Nenhum chamado com SLA vencido</p>
                </div>
              </div>
            ) : (
              slaAlerts.slice(0, 8).map((ticket: any) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${
                    ticket.priority === 'critical' ? 'text-red-400' :
                    ticket.priority === 'high' ? 'text-orange-400' : 'text-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-netvision-400">
                        {formatTicketNumber(ticket.ticket_number)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        PRIORITIES[ticket.priority as TicketPriority]?.bgColor || ''
                      } ${PRIORITIES[ticket.priority as TicketPriority]?.color || ''}`}>
                        {PRIORITIES[ticket.priority as TicketPriority]?.label}
                      </span>
                    </div>
                     <p className="text-sm text-gray-300 truncate">{cleanTicketTitle(ticket.title)}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{timeAgo(ticket.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
