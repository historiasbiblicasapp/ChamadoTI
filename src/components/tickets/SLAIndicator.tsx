import { calculateSLARemaining } from '../../utils/formatters';
import { SLA_HOURS } from '../../utils/constants';
import type { TicketPriority } from '../../types';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SLAIndicatorProps {
  priority: TicketPriority;
  createdAt: string;
  status: string;
  slaHours?: number;
}

export function SLAIndicator({ priority, createdAt, status, slaHours: slaHoursProp }: SLAIndicatorProps) {
  if (status === 'resolved' || status === 'cancelled') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Concluido</span>
      </div>
    );
  }

  const slaHours = slaHoursProp || SLA_HOURS[priority] || 24;
  const sla = calculateSLARemaining(createdAt, slaHours);

  if (sla.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>SLA Vencido</span>
      </div>
    );
  }

  if (sla.isWarning) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>{Math.round(sla.remaining)}h restantes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <Clock className="w-3.5 h-3.5" />
      <span>{Math.round(sla.remaining)}h restantes</span>
    </div>
  );
}

interface SLABarProps {
  priority: TicketPriority;
  createdAt: string;
  status: string;
  slaHours?: number;
}

export function SLABar({ priority, createdAt, status, slaHours: slaHoursProp }: SLABarProps) {
  if (status === 'resolved' || status === 'cancelled') {
    return null;
  }

  const slaHours = slaHoursProp || SLA_HOURS[priority] || 24;
  const sla = calculateSLARemaining(createdAt, slaHours);

  const barColor = sla.isExpired
    ? 'bg-red-500'
    : sla.isWarning
    ? 'bg-orange-500'
    : 'bg-green-500';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>SLA</span>
        <span>{Math.round(sla.remaining)}h / {slaHours}h</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, 100 - sla.percentage)}%` }}
        />
      </div>
    </div>
  );
}
