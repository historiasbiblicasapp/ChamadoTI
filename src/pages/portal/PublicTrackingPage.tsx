import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Share2, Copy, QrCode, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { formatTicketNumber, formatDate } from '../../utils/formatters';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import type { Ticket } from '../../types';

interface PublicTicketData {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  location: string | null;
  category_name: string;
  department_name: string;
  requester_name: string;
  public_tracking_enabled: boolean;
  public_tracking_last_access: string | null;
  public_tracking_expires_at: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  open: { label: 'Recebido', color: 'bg-blue-500', emoji: '🔵' },
  pending: { label: 'Pendente', color: 'bg-yellow-500', emoji: '🟡' },
  in_progress: { label: 'Em Atendimento', color: 'bg-orange-500', emoji: '🟠' },
  waiting_user: { label: 'Aguardando Usuário', color: 'bg-purple-500', emoji: '🟣' },
  waiting_parts: { label: 'Aguardando Revisão', color: 'bg-indigo-500', emoji: '🟠' },
  waiting_supplier: { label: 'Aguardando Deploy', color: 'bg-pink-500', emoji: '🟠' },
  resolved: { label: 'Resolvido', color: 'bg-green-500', emoji: '🟢' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', emoji: '🔴' },
};

export function PublicTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<PublicTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.tickets.getByPublicToken(token);
      const data = result[0];
      if (!data) {
        console.log('[PublicTracking] Token not found via RPC:', token);
        setError('Chamado nao encontrado ou link invalido.');
      } else {
        console.log('[PublicTracking] Ticket loaded via RPC:', data);
        setTicket(data as PublicTicketData);
      }
    } catch (err: any) {
      console.error('[PublicTracking] RPC error, trying direct query:', err);
      try {
        const { data: directData, error: directError } = await supabase
          .from('tickets')
          .select('*')
          .eq('public_token', token)
          .eq('public_tracking_enabled', true)
          .single();

        if (directError || !directData) {
          console.error('[PublicTracking] Direct query also failed:', directError);
          setError('Erro ao carregar o chamado. Verifique se a migration do Supabase foi aplicada corretamente.');
        } else {
          console.log('[PublicTracking] Ticket loaded via direct query:', directData);
          setTicket(directData as unknown as PublicTicketData);
        }
      } catch (directErr) {
        console.error('[PublicTracking] Direct query error:', directErr);
        setError('Erro ao carregar o chamado.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    if (!token) return;
    const channel = supabase
      .channel(`public-ticket-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `public_token=eq.${token}`,
        },
        () => {
          fetchTicket();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, fetchTicket]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTicket = async () => {
    const url = `${window.location.origin}/acompanhar/${token}`;
    const shareData = {
      title: `Chamado #${ticket ? String(ticket.ticket_number).padStart(4, '0') : ''}`,
      text: `Acompanhe seu chamado de TI: ${url}`,
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <ThemeToggle />
        <Loader2 className="w-8 h-8 animate-spin text-netvision-400" />
        <p className="text-sm text-gray-500 mt-2">Carregando...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <ThemeToggle />
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-100 mb-2">Acompanhamento Indisponivel</h1>
        <p className="text-sm text-gray-500 text-center max-w-md">
          {error || 'Este link nao esta mais disponivel. Entre em contato com o suporte.'}
        </p>
        <button onClick={() => navigate('/abrir-chamado')} className="btn-primary mt-6">
          Abrir Chamado
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[ticket.status] || { label: ticket.status, color: 'bg-gray-500', emoji: '⚪' };
  const priorityInfo = PRIORITIES[ticket.priority as keyof typeof PRIORITIES] || { label: ticket.priority, color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  const trackingUrl = `${window.location.origin}/acompanhar/${token}`;

  return (
    <div className="min-h-screen bg-gray-950">
      <ThemeToggle />
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-bold text-gray-100">ChamadosTiRaitz</h1>
              <p className="text-xs text-gray-500">Acompanhamento Publico</p>
            </div>
          </div>
          <button onClick={() => navigate('/abrir-chamado')} className="btn-primary btn-sm">
            Abrir Chamado
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/abrir-chamado')} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Acompanhamento do Chamado</h2>
            <p className="text-xs text-gray-500">#{String(ticket.ticket_number).padStart(4, '0')}</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white ${statusInfo.color}`}>
                {statusInfo.emoji} {statusInfo.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Prioridade</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityInfo.bgColor} ${priorityInfo.color} ${PRIORITIES[ticket.priority as keyof typeof PRIORITIES]?.borderColor || ''}`}>
                {priorityInfo.label}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assunto</p>
              <p className="text-sm text-gray-200">{ticket.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Descricao</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Setor</p>
                <p className="text-sm text-gray-200">{ticket.department_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Local</p>
                <p className="text-sm text-gray-200">{ticket.location || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Aberto em</p>
                <p className="text-sm text-gray-200">{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ultima atualizacao</p>
                <p className="text-sm text-gray-200">{formatDate(ticket.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Compartilhar</h3>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={trackingUrl} size={180} />
            </div>
            <p className="text-xs text-gray-500">Aponte a camera do celular para acompanhar</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => copyToClipboard(trackingUrl)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={shareTicket}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
