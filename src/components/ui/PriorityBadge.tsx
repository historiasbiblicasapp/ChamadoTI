import { TicketPriority } from '../../types';
import { PRIORITIES } from '../../utils/constants';

interface Props {
  priority: TicketPriority;
  showLabel?: boolean;
}

export function PriorityBadge({ priority, showLabel = true }: Props) {
  const config = PRIORITIES[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}>
      {showLabel && config.label}
    </span>
  );
}
