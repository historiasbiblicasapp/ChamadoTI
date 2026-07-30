import { formatDate, formatTicketNumber } from '../../utils/formatters';
import { STATUSES } from '../../utils/constants';
import type { TicketHistory } from '../../types';
import { Clock, ArrowRight, MessageSquare, File, AlertCircle, UserPlus } from 'lucide-react';

interface TicketTimelineProps {
  history: TicketHistory[];
}

function getActionIcon(action: string) {
  switch (action) {
    case 'status_changed': return ArrowRight;
    case 'assigned_changed': return UserPlus;
    case 'priority_changed': return AlertCircle;
    case 'comment_added': return MessageSquare;
    case 'file_uploaded': return File;
    default: return Clock;
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'status_changed': return 'Status alterado';
    case 'assigned_changed': return 'Atribuicao alterada';
    case 'priority_changed': return 'Prioridade alterada';
    case 'comment_added': return 'Comentario adicionado';
    case 'file_uploaded': return 'Arquivo enviado';
    default: return action;
  }
}

export function TicketTimeline({ history }: TicketTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhum registro de historico
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {[...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((entry, index) => {
        const Icon = getActionIcon(entry.action);
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              {index < history.length - 1 && (
                <div className="w-px flex-1 bg-gray-800 mt-1" />
              )}
            </div>
            <div className="pb-6 flex-1">
              <p className="text-sm font-medium text-gray-200">{getActionLabel(entry.action)}</p>
              <div className="flex items-center gap-2 mt-1">
                {entry.old_value && entry.new_value && (
                  <span className="text-xs text-gray-500">
                    <span className="text-gray-600">{entry.old_value}</span>
                    {' -> '}
                    <span className="text-gray-400">{entry.new_value}</span>
                  </span>
                )}
                {entry.new_value && !entry.old_value && (
                  <span className="text-xs text-gray-400">{entry.new_value}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {entry.user && (
                  <span className="text-xs text-gray-500">{entry.user.full_name}</span>
                )}
                <span className="text-xs text-gray-600">{formatDate(entry.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
