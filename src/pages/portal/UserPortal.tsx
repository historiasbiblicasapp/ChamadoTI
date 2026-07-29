import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, LogOut, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { formatTicketNumber, formatDate, cleanTicketTitle } from '../../utils/formatters';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import { showToast } from '../../components/ui/Toaster';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { TicketPriority } from '../../types';

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

export function UserPortal() {
  const queryClient = useQueryClient();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { tickets, isLoading: ticketsLoading, error, createTicket } = useTickets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const myTickets = useMemo(() => {
    return tickets
      .filter((t) => t.requester_id === profile?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tickets, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) {
      showToast('error', 'Erro', 'Titulo deve ter no minimo 5 caracteres');
      return;
    }
    if (!description.trim() || description.length < 10) {
      showToast('error', 'Erro', 'Descricao deve ter no minimo 10 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      await createTicket.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        priority,
        phone: phone.trim() || null,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      showToast('success', 'Chamado aberto!', 'Seu chamado foi registrado com sucesso');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setPhone('');
      setShowForm(false);
      setTimeout(() => setShowForm(true), 100);
    } catch (error: any) {
      showToast('error', 'Erro', error?.message || 'Nao foi possivel abrir o chamado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <ThemeToggle />
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-bold text-gray-100">ChamadosTiRaitz</h1>
              <p className="text-xs text-gray-500">Suporte de TI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-sm text-gray-400">{profile?.full_name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-all" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Formulario de novo chamado */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-100 mb-1">Abrir Chamado</h2>
          <p className="text-sm text-gray-500 mb-4">Descreva seu problema para que possamos ajudar</p>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Data</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="input max-w-xs"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Titulo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Resumo do problema"
                  disabled={submitting}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Descricao *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-none h-28"
                  placeholder="Descreva o problema detalhadamente..."
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Prioridade</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="select" disabled={submitting}>
                    {Object.entries(PRIORITIES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="(11) 99999-9999"
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Abrir Chamado
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Lista de chamados do usuario */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Meus Chamados
            <span className="text-sm font-normal text-gray-500 ml-2">({myTickets.length})</span>
          </h2>

          {ticketsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-netvision-400 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Carregando...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-400">Erro ao carregar chamados: {error.message}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['tickets'] })}
                className="mt-2 text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded text-red-300"
              >
                Tentar novamente
              </button>
            </div>
          ) : myTickets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Voce ainda nao tem chamados</p>
          ) : (
            <div className="space-y-2">
              {myTickets.map((ticket) => {
                const StatusIcon = STATUS_ICONS[ticket.status] || AlertCircle;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 cursor-pointer transition-colors"
                  >
                    <StatusIcon className={`w-4 h-4 shrink-0 ${
                      ticket.status === 'resolved' || ticket.status === 'closed'
                        ? 'text-green-400'
                        : ticket.status === 'open'
                        ? 'text-blue-400'
                        : 'text-yellow-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-netvision-400">{formatTicketNumber(ticket.ticket_number)}</span>
                         <span className="text-sm text-gray-200 truncate">{cleanTicketTitle(ticket.title)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${STATUSES[ticket.status]?.bgColor || ''} ${STATUSES[ticket.status]?.color || ''}`}>
                          {STATUSES[ticket.status]?.label}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
