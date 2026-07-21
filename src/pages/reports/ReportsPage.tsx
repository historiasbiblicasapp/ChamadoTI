import { useState } from 'react';
import { ArrowLeft, Download, FileText, FileSpreadsheet, Table2, Filter, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useTicketStats } from '../../hooks/useTickets';
import { useAssets } from '../../hooks/useAssets';
import { STATUSES, PRIORITIES, ASSET_STATUS_CONFIG } from '../../utils/constants';

type ReportType = 'tickets' | 'assets';
type ExportFormat = 'csv' | 'pdf' | 'excel';

export function ReportsPage() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<ReportType>('tickets');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { tickets, isLoading: ticketsLoading } = useTickets();
  const { assets, isLoading: assetsLoading } = useAssets();
  const { data: stats } = useTicketStats();

  const isLoading = reportType === 'tickets' ? ticketsLoading : assetsLoading;

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const ticketDate = t.scheduled_date || t.created_at.split('T')[0];
    const matchFrom = !dateFrom || ticketDate >= dateFrom;
    const matchTo = !dateTo || ticketDate <= dateTo;
    return matchStatus && matchPriority && matchFrom && matchTo;
  });

  const filteredAssets = assets.filter((a) => {
    return assetStatusFilter === 'all' || a.status === assetStatusFilter;
  });

  const assetStatusCounts = {
    total: assets.length,
    active: assets.filter((a) => a.status === 'active').length,
    maintenance: assets.filter((a) => a.status === 'maintenance').length,
    in_stock: assets.filter((a) => a.status === 'in_stock').length,
    retired: assets.filter((a) => a.status === 'retired').length,
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const { exportToCSV, exportToPDF, exportToExcel, formatTicketsForExport, formatAssetsForExport } = await import('../../utils/export');
      if (reportType === 'tickets') {
        const data = formatTicketsForExport(filteredTickets);
        const exportData = {
          title: 'Relatorio de Chamados - ChamadosTiRaitz',
          filename: `chamados_${new Date().toISOString().split('T')[0]}`,
          columns: [
            { header: '#', accessor: '#', width: 8 },
            { header: 'Data', accessor: 'Data', width: 14 },
            { header: 'Titulo', accessor: 'Titulo', width: 40 },
            { header: 'Status', accessor: 'Status', width: 18 },
            { header: 'Prioridade', accessor: 'Prioridade', width: 12 },
            { header: 'Categoria', accessor: 'Categoria', width: 20 },
            { header: 'Solicitante', accessor: 'Solicitante', width: 25 },
            { header: 'Atendente', accessor: 'Atendente', width: 25 },
            { header: 'Criado', accessor: 'Criado', width: 20 },
            { header: 'Resolvido', accessor: 'Resolvido', width: 20 },
          ],
          rows: data,
        };

        if (format === 'csv') exportToCSV(exportData);
        else if (format === 'pdf') exportToPDF(exportData);
        else await exportToExcel(exportData);
      } else {
        const data = formatAssetsForExport(filteredAssets);
        const exportData = {
          title: 'Relatorio de Ativos - ChamadosTiRaitz',
          filename: `ativos_${new Date().toISOString().split('T')[0]}`,
          columns: [
            { header: 'Patrimonio', accessor: 'Patrimonio', width: 15 },
            { header: 'Nome', accessor: 'Nome', width: 30 },
            { header: 'Tipo', accessor: 'Tipo', width: 15 },
            { header: 'Marca', accessor: 'Marca', width: 15 },
            { header: 'Modelo', accessor: 'Modelo', width: 20 },
            { header: 'Nr Serie', accessor: 'Nr Serie', width: 20 },
            { header: 'IP', accessor: 'IP', width: 18 },
            { header: 'Status', accessor: 'Status', width: 12 },
            { header: 'Responsavel', accessor: 'Responsavel', width: 25 },
            { header: 'Local', accessor: 'Local', width: 20 },
          ],
          rows: data,
        };

        if (format === 'csv') exportToCSV(exportData);
        else if (format === 'pdf') exportToPDF(exportData);
        else await exportToExcel(exportData);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-100">Relatorios</h1>
              <p className="text-sm text-gray-500 mt-1">Gerar e exportar relatorios do sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportType === 'tickets' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-netvision-400">{stats?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total de Chamados</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats?.open || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Abertos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-400">{stats?.resolved || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Resolvidos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">{assets.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total de Ativos</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-netvision-400">{assetStatusCounts.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-400">{assetStatusCounts.active}</p>
            <p className="text-xs text-gray-500 mt-1">Ativos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">{assetStatusCounts.maintenance}</p>
            <p className="text-xs text-gray-500 mt-1">Manutencao</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">{assetStatusCounts.in_stock}</p>
            <p className="text-xs text-gray-500 mt-1">Em Estoque</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-400">{assetStatusCounts.retired}</p>
            <p className="text-xs text-gray-500 mt-1">Aposentados</p>
          </div>
        </div>
      )}

      {/* Report Config */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Configuracao do Relatorio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Tipo de Relatorio</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="select">
              <option value="tickets">Chamados</option>
              <option value="assets">Ativos</option>
            </select>
          </div>

          {reportType === 'tickets' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
                  <option value="all">Todos</option>
                  {Object.entries(STATUSES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Prioridade</label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="select">
                  <option value="all">Todas</option>
                  {Object.entries(PRIORITIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'assets' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Status do Ativo</label>
              <select value={assetStatusFilter} onChange={(e) => setAssetStatusFilter(e.target.value)} className="select">
                <option value="all">Todos</option>
                {Object.entries(ASSET_STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {reportType === 'tickets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Data Inicial</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Data Final</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Preview ({reportType === 'tickets' ? filteredTickets.length : filteredAssets.length} registro(s))</h3>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {reportType === 'tickets' ? (
                  <>
                    <th className="table-header">#</th>
                    <th className="table-header">Data</th>
                    <th className="table-header">Titulo</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Prioridade</th>
                    <th className="table-header">Solicitante</th>
                    <th className="table-header">Criado</th>
                  </>
                ) : (
                  <>
                    <th className="table-header">Patrimonio</th>
                    <th className="table-header">Nome</th>
                    <th className="table-header">Tipo</th>
                    <th className="table-header">IP</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Local</th>
                    <th className="table-header">Responsavel</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : reportType === 'tickets' ? (
                filteredTickets.slice(0, 20).map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-800/30">
                    <td className="table-cell text-gray-400">{ticket.ticket_number}</td>
                    <td className="table-cell text-gray-500 text-xs">{ticket.scheduled_date || new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="table-cell text-gray-200 max-w-[200px] truncate">{ticket.title}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUSES[ticket.status]?.bgColor || ''} ${STATUSES[ticket.status]?.color || ''}`}>
                        {STATUSES[ticket.status]?.label || ticket.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded ${PRIORITIES[ticket.priority]?.bgColor || ''} ${PRIORITIES[ticket.priority]?.color || ''}`}>
                        {PRIORITIES[ticket.priority]?.label || ticket.priority}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400">{(ticket.requester as any)?.full_name || '-'}</td>
                    <td className="table-cell text-gray-500 text-xs">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              ) : (
                filteredAssets.slice(0, 20).map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-800/30">
                    <td className="table-cell font-mono text-netvision-400">{asset.patrimony || '-'}</td>
                    <td className="table-cell text-gray-200">{asset.name}</td>
                    <td className="table-cell text-gray-400">{asset.type}</td>
                    <td className="table-cell font-mono text-xs text-gray-400">{asset.ip_address || '-'}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ASSET_STATUS_CONFIG[asset.status]?.bgColor || ''} ${ASSET_STATUS_CONFIG[asset.status]?.color || ''}`}>
                        {ASSET_STATUS_CONFIG[asset.status]?.label || asset.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400">{asset.location || '-'}</td>
                    <td className="table-cell text-gray-400">{asset.user?.full_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(reportType === 'tickets' ? filteredTickets.length : filteredAssets.length) > 20 && (
          <p className="text-xs text-gray-500 text-center mt-3">Mostrando 20 de {reportType === 'tickets' ? filteredTickets.length : filteredAssets.length} registros</p>
        )}
      </div>

      {/* Export Buttons */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2"
          >
            <Table2 className="w-4 h-4 text-green-400" />
            Exportar CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Exportar Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-red-400" />
            Exportar PDF
          </button>
          {isExporting && <Loader2 className="w-4 h-4 animate-spin text-netvision-400" />}
        </div>
      </div>
    </div>
  );
}
