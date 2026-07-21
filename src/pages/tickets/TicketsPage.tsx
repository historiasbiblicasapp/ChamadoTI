import { TicketList } from '../../components/tickets/TicketList';

export function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Chamados</h1>
          <p className="text-sm text-gray-500 mt-1">Gerenciamento de chamados de suporte TI</p>
        </div>
      </div>
      <TicketList />
    </div>
  );
}
