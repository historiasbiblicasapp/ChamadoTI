import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Ticket as TicketIcon } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { api } from '../../services/api';
import { formatTicketNumber, formatDate, cleanTicketTitle } from '../../utils/formatters';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import type { Ticket } from '../../types';

export function PublicMyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('my_ticket_ids') || '[]');
    if (!ids.length) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id: string) => api.tickets.get(id))).then((results) => {
      setTickets(results.filter(Boolean));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <ThemeToggle />
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-bold text-gray-100">ChamadosTiRaitz</h1>
              <p className="text-xs text-gray-500">Meus Chamados</p>
            </div>
          </div>
          <button onClick={() => navigate('/abrir-chamado')} className="btn-primary btn-sm">
            Abrir Chamado
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/abrir-chamado')} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Meus Chamados</h2>
            <p className="text-xs text-gray-500">Acompanhe seus atendimentos</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-netvision-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Carregando...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="card text-center py-8">
            <TicketIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Voce ainda nao tem chamados</p>
            <button onClick={() => navigate('/abrir-chamado')} className="btn-primary mt-4">
              Abrir Chamado
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="card p-4 space-y-2 cursor-pointer hover:border-netvision-500/50 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-netvision-400">
                    {formatTicketNumber(ticket.ticket_number)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUSES[ticket.status]?.bgColor || ''} ${STATUSES[ticket.status]?.color || ''}`}>
                    {STATUSES[ticket.status]?.label || ticket.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 line-clamp-2">{cleanTicketTitle(ticket.title)}</h3>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(ticket.scheduled_date || ticket.created_at)}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITIES[ticket.priority]?.bgColor || ''} ${PRIORITIES[ticket.priority]?.color || ''} ${PRIORITIES[ticket.priority]?.borderColor || ''}`}>
                    {PRIORITIES[ticket.priority]?.label || ticket.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
