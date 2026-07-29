import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Pencil, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { useTicket, useTickets } from '../../hooks/useTickets';
import { formatTicketNumber, formatDate, cleanTicketTitle } from '../../utils/formatters';
import { STATUSES, PRIORITIES, TICKET_CATEGORIES } from '../../utils/constants';
import { SLABar } from '../../components/tickets/SLAIndicator';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { TicketComments } from '../../components/tickets/TicketComments';
import { FileUpload } from '../../components/tickets/FileUpload';
import { TicketForm } from '../../components/tickets/TicketForm';
import type { CustomFieldDef } from '../../components/tickets/TicketForm';
import { showToast } from '../../components/ui/Toaster';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';
import { createWhatsAppTicketLink } from '../../utils/whatsapp';
import { ResolveTicketModal } from '../../components/tickets/ResolveTicketModal';
import type { Profile } from '../../types';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading, refetch } = useTicket(id || null);
  const { updateTicket, deleteTicket } = useTickets();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [slaHoursMap, setSlaHoursMap] = useState<Record<string, number>>({});

  useEffect(() => {
    api.users.list().then((users) => {
      const techs = users.filter((u) => u.role === 'admin' || u.role === 'analyst');
      setTechnicians(techs.length > 0 ? techs : users);
    }).catch(() => {});
  }, []);


  const handleWhatsAppNotify = () => {
    if (!ticket) return;
    const link = createWhatsAppTicketLink({
      phone: (ticket as any).phone || ticket.requester?.phone || '',
      ticketNumber: ticket.ticket_number,
      title: cleanTicketTitle(ticket.title),
      statusLabel: STATUSES[ticket.status as keyof typeof STATUSES]?.label || ticket.status,
    });
    window.open(link, '_blank');
  };

  useEffect(() => {
    api.sla.list().then((rules: any[]) => {
      const map: Record<string, number> = {};
      rules.forEach((r) => { map[r.priority] = r.hours; });
      setSlaHoursMap(map);
    }).catch(() => {});
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-netvision-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chamado nao encontrado</p>
        <button onClick={() => navigate('/tickets')} className="btn-secondary mt-4">
          Voltar
        </button>
      </div>
    );
  }

  const handleEdit = async (data: any) => {
    try {
      const cat = TICKET_CATEGORIES.find((c) => c.value === data.category_id);
      const catId = cat ? (await supabase.from('ticket_categories').select('id').eq('name', cat.label).single()).data?.id : data.category_id;

      const updates: any = {
        title: data.title,
        description: data.description,
        category_id: catId || data.category_id,
        priority: data.priority,
        location: data.location,
      };

      if (data.scheduled_date !== undefined) {
        updates.scheduled_date = data.scheduled_date || null;
      }
      if (data.custom_fields !== undefined) {
        updates.custom_fields = data.custom_fields || null;
      }

      await updateTicket.mutateAsync({
        id: ticket.id,
        updates,
      });
      showToast('success', 'Chamado atualizado', 'Alteracoes salvas com sucesso');
      setEditing(false);
      refetch();
    } catch (error: any) {
      showToast('error', 'Erro', error?.message || 'Nao foi possivel atualizar o chamado');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
      showToast('success', 'Chamado excluido', 'O chamado foi removido');
      navigate('/tickets');
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel excluir o chamado');
    }
  };

  const handleAssignTechnician = async (techId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('tickets').update({
        assigned_to: techId || null,
        updated_at: new Date().toISOString(),
      }).eq('id', ticket.id);

      const tech = technicians.find((t) => t.id === techId);
      await supabase.from('ticket_history').insert({
        ticket_id: ticket.id,
        user_id: user?.id,
        action: 'assigned',
        old_value: ticket.assigned_to || null,
        new_value: tech?.full_name || techId || 'Nenhum',
      });

      showToast('success', 'Analista Atribuído', tech ? `Chamado atribuído a ${tech.full_name}` : 'Atribuição removida');
      refetch();
    } catch {
      showToast('error', 'Erro', 'Não foi possível atribuir o técnico.');
    }
  };

  const handleConfirmResolve = async (resolveData: { resolvedBy: string; solutionApplied: string; rootCause?: string }) => {
    setIsSubmittingResolve(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      await supabase.from('tickets').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolveData.resolvedBy,
        solution_applied: resolveData.solutionApplied,
        root_cause: resolveData.rootCause || null,
        updated_at: new Date().toISOString(),
      }).eq('id', ticket.id);

      await supabase.from('ticket_history').insert({
        ticket_id: ticket.id,
        user_id: user?.id,
        action: 'status_changed',
        old_value: ticket.status,
        new_value: 'resolved',
      });

      showToast('success', 'Chamado Resolvido', 'O atendimento foi concluído e validado com sucesso.');
      setIsResolveModalOpen(false);
      refetch();
    } catch (error: any) {
      showToast('error', 'Erro', error?.message || 'Não foi possível concluir o chamado.');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'resolved') {
      setIsResolveModalOpen(true);
      return;
    }


    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (newStatus === 'open' && (ticket.status === 'resolved' || ticket.status === 'closed')) {
        await supabase.from('tickets').update({
          status: newStatus,
          resolved_at: null,
          closed_at: null,
          resolved_by: null,
          updated_at: new Date().toISOString(),
        }).eq('id', ticket.id);
      } else {
        const updates: any = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('tickets').update(updates).eq('id', ticket.id);
      }

      await supabase.from('ticket_history').insert({
        ticket_id: ticket.id,
        user_id: user?.id,
        action: 'status_changed',
        old_value: ticket.status,
        new_value: newStatus,
      });

      showToast('success', 'Status atualizado', `Chamado agora esta: ${STATUSES[newStatus as keyof typeof STATUSES]?.label || newStatus}`);
      setReopening(false);
      refetch();
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel alterar o status');
    }
  };



  const handleAddComment = async (content: string, isInternal: boolean) => {
    try {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticket.id,
        author_id: (await supabase.auth.getUser()).data.user?.id,
        content,
        is_internal: isInternal,
      });
      refetch();
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel adicionar comentario');
    }
  };

  const handleFileUpload = async (file: { file_name: string; file_url: string; file_size: number; file_type: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('ticket_files').insert({
        ticket_id: ticket.id,
        uploaded_by: user?.id,
        ...file,
      });
      refetch();
    } catch {
      showToast('error', 'Erro', 'Nao foi possivel registrar o arquivo');
    }
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditing(false)} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Editar {formatTicketNumber(ticket.ticket_number)}</h1>
              <p className="text-sm text-gray-500 mt-1">Altere os dados do chamado</p>
            </div>
          </div>
        </div>

        <div className="card">
          <TicketForm
            onSubmit={handleEdit}
            isLoading={updateTicket.isPending}
            submitLabel="Salvar Alteracoes"
            defaultValues={{
              title: cleanTicketTitle(ticket.title),
              description: ticket.description,
              category_id: ticket.category_id || '',
              priority: ticket.priority,
              scheduled_date: ticket.scheduled_date || ticket.created_at.split('T')[0],
              location: ticket.location || '',
              custom_fields: ticket.custom_fields || {},
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tickets')} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="text-2xl font-bold text-gray-100">
              {formatTicketNumber(ticket.ticket_number)}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              PRIORITIES[ticket.priority]?.bgColor || ''
            } ${PRIORITIES[ticket.priority]?.color || ''} ${PRIORITIES[ticket.priority]?.borderColor || ''}`}>
              {PRIORITIES[ticket.priority]?.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              STATUSES[ticket.status]?.bgColor || ''
            } ${STATUSES[ticket.status]?.color || ''}`}>
              {STATUSES[ticket.status]?.label}
            </span>
          </div>
           <p className="text-sm text-gray-500 mt-1">{cleanTicketTitle(ticket.title)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleWhatsAppNotify}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-all shadow-md"
            title="Enviar mensagem sobre o chamado no WhatsApp"
          >
            <span>💬 WhatsApp</span>
          </button>
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => setDeleting(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>

      </div>

      {deleting && (
        <div className="card border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-400">Tem certeza que deseja excluir?</h3>
              <p className="text-xs text-gray-500 mt-1">Esta acao nao pode ser desfeita. O chamado {formatTicketNumber(ticket.ticket_number)} sera removido permanentemente.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleting(false)} className="btn-secondary btn-sm flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteTicket.isPending} className="btn-danger btn-sm flex items-center gap-1">
                {deleteTicket.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {reopening && (
        <div className="card border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-400">Tem certeza que deseja reabrir?</h3>
              <p className="text-xs text-gray-500 mt-1">O chamado {formatTicketNumber(ticket.ticket_number)} sera reaberto e voltara para o status <strong>Em Aberto</strong>.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setReopening(false)} className="btn-secondary btn-sm flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button onClick={() => handleStatusChange('open')} className="btn-primary btn-sm flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                Reabrir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Descricao</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Comentarios</h3>
            <TicketComments
              comments={ticket.comments || []}
              onAddComment={handleAddComment}
            />
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Arquivos</h3>
            {ticket.files && ticket.files.length > 0 && (
              <div className="space-y-2 mb-4">
                {ticket.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">{file.file_name}</span>
                      <span className="text-xs text-gray-500">
                        {file.file_size ? `${(file.file_size / 1024).toFixed(0)} KB` : ''}
                      </span>
                    </div>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-netvision-400 hover:text-netvision-300">
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            )}
            <FileUpload ticketId={ticket.id} onUploadComplete={handleFileUpload} />
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Historico</h3>
            <TicketTimeline history={ticket.history || []} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Analista/Técnico Responsável */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <span>👤</span> Técnico Responsável
            </h3>
            <select
              value={ticket.assigned_to || ''}
              onChange={(e) => handleAssignTechnician(e.target.value)}
              className="select text-sm w-full"
            >
              <option value="">— Sem atribuição —</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name} ({tech.role === 'admin' ? 'Admin' : 'Analista'})
                </option>
              ))}
            </select>
            {ticket.assignee && (
              <p className="text-xs text-netvision-400 mt-1.5">
                ✓ Atribuído a <strong>{ticket.assignee.full_name}</strong>
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Informacoes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Data do Chamado</p>
                  <p className="text-sm text-gray-200">{ticket.scheduled_date ? formatDate(ticket.scheduled_date) : formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Solicitante</p>
                <p className="text-sm text-gray-200">{ticket.requester?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data de Abertura</p>
                <p className="text-sm text-gray-200">{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Categoria</p>
                <p className="text-sm text-gray-200">{ticket.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Local</p>
                <p className="text-sm text-gray-200">{ticket.location || '-'}</p>
              </div>
              <div>
                <SLABar priority={ticket.priority} createdAt={ticket.created_at} status={ticket.status} slaHours={slaHoursMap[ticket.priority]} />
              </div>
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 space-y-1">
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                    <span>✅</span> Concluído e Validado por
                  </p>
                  <p className="text-sm font-medium text-gray-200">
                    {(ticket as any).resolved_by_user?.full_name || 'Sistema'}
                  </p>
                  {ticket.resolved_at && (
                    <p className="text-xs text-gray-500">{formatDate(ticket.resolved_at)}</p>
                  )}
                  {ticket.solution_applied && (
                    <div className="mt-2 pt-2 border-t border-green-500/20">
                      <p className="text-xs text-green-400 font-medium">Solução Aplicada:</p>
                      <p className="text-xs text-gray-300 mt-0.5">{ticket.solution_applied}</p>
                    </div>
                  )}
                  {ticket.root_cause && (
                    <div className="mt-1">
                      <p className="text-xs text-orange-400 font-medium">Causa Raiz:</p>
                      <p className="text-xs text-gray-300 mt-0.5">{ticket.root_cause}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {ticket.custom_fields && Object.keys(ticket.custom_fields).length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Campos Personalizados</h3>
              <div className="space-y-3">
                {Object.entries(ticket.custom_fields).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-sm text-gray-200">{String(value || '-')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Acoes</h3>
            <div className="space-y-2">
              {ticket.status === 'open' && (
                <button onClick={() => handleStatusChange('in_progress')} className="btn-primary w-full btn-sm">
                  Iniciar Atendimento
                </button>
              )}
              {ticket.status === 'in_progress' && (
                <>
                  <button onClick={() => handleStatusChange('resolved')} className="btn-success w-full btn-sm">
                    Resolver Chamado
                  </button>
                  <button onClick={() => handleStatusChange('waiting_user')} className="btn-secondary w-full btn-sm">
                    Aguardando Usuario
                  </button>
                  <button onClick={() => handleStatusChange('waiting_parts')} className="btn-secondary w-full btn-sm">
                    Aguardando Pecas
                  </button>
                </>
              )}
              {ticket.status === 'waiting_user' && (
                <button onClick={() => handleStatusChange('in_progress')} className="btn-primary w-full btn-sm">
                  Retomar Atendimento
                </button>
              )}
              {ticket.status === 'waiting_parts' && (
                <button onClick={() => handleStatusChange('in_progress')} className="btn-primary w-full btn-sm">
                  Retomar Atendimento
                </button>
              )}
              {ticket.status === 'resolved' && (
                <>
                  <button onClick={() => handleStatusChange('closed')} className="btn-secondary w-full btn-sm">
                    Fechar Chamado
                  </button>
                  <button onClick={() => setReopening(true)} className="btn-secondary w-full btn-sm flex items-center justify-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reabrir Chamado
                  </button>
                </>
              )}
              {ticket.status === 'closed' && (
                <button onClick={() => setReopening(true)} className="btn-secondary w-full btn-sm flex items-center justify-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reabrir Chamado
                </button>
              )}
              {ticket.status !== 'cancelled' && ticket.status !== 'closed' && (
                <button onClick={() => handleStatusChange('cancelled')} className="btn-danger w-full btn-sm">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {ticket.root_cause && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Causa Raiz</h3>
              <p className="text-sm text-gray-300">{ticket.root_cause}</p>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Validação e Conclusão do Atendimento */}
      <ResolveTicketModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onConfirm={handleConfirmResolve}
        isLoading={isSubmittingResolve}
      />
    </div>
  );
}
