import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TicketForm } from '../../components/tickets/TicketForm';
import { useTickets } from '../../hooks/useTickets';
import { showToast } from '../../components/ui/Toaster';
import { TICKET_CATEGORIES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';

export function NewTicketPage() {
  const navigate = useNavigate();
  const { createTicket, isLoading } = useTickets();

  const handleSubmit = async (data: any) => {
    try {
      let categoryId = data.category_id;
      const cat = TICKET_CATEGORIES.find((c) => c.value === data.category_id);
      if (cat) {
        const { data: catRow } = await supabase.from('ticket_categories').select('id').eq('name', cat.label).single();
        if (catRow) categoryId = catRow.id;
        else categoryId = null;
      }

      await createTicket.mutateAsync({
        title: data.title,
        description: data.description,
        category_id: categoryId || null,
        priority: data.priority,
        scheduled_date: data.scheduled_date || null,
        location: data.location,
      });
      showToast('success', 'Chamado aberto', 'Seu chamado foi registrado com sucesso');
      navigate('/tickets');
    } catch (error: any) {
      showToast('error', 'Erro', error?.message || 'Nao foi possivel abrir o chamado');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tickets')} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Novo Chamado</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para abrir um novo chamado</p>
          </div>
        </div>
      </div>

      <div className="card">
        <TicketForm onSubmit={handleSubmit} isLoading={isLoading || createTicket.isPending} />
      </div>
    </div>
  );
}
