import { TicketStatus } from '../../types';
import { STATUSES } from '../../utils/constants';

interface Props {
  status: TicketStatus;
  showLabel?: boolean;
}

export function StatusBadge({ status, showLabel = true }: Props) {
  const config = STATUSES[status];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border border-transparent`}>
      {showLabel && config.label}
    </span>
  );
}
