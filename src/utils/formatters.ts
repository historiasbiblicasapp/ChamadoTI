export function formatLatency(ms: number): string {
  if (ms === 0) return '-';
  if (ms < 1) return '<1ms';
  return `${Math.round(ms)}ms`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR');
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '-';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  if (diff < 60000) return 'Agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
  return `${Math.floor(diff / 86400000)}d atrás`;
}

export function formatTicketNumber(number: number): string {
  return String(number).padStart(6, '0');
}

const LEGACY_TICKET_PREFIX_RE = /^\[#?([^\]]+)\]\s*\|?\s*/i;

export function cleanTicketTitle(title: string): string {
  if (!title) return '';
  return title.replace(LEGACY_TICKET_PREFIX_RE, '').trim();
}

export function calculateSLARemaining(createdAt: string, priorityHours: number): {
  remaining: number;
  percentage: number;
  isWarning: boolean;
  isExpired: boolean;
} {
  const created = new Date(createdAt).getTime();
  const deadline = created + priorityHours * 60 * 60 * 1000;
  const now = Date.now();
  const totalMs = priorityHours * 60 * 60 * 1000;
  const remainingMs = deadline - now;
  const remainingHours = remainingMs / (1000 * 60 * 60);
  const percentage = Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100));

  return {
    remaining: Math.max(0, remainingHours),
    percentage,
    isWarning: remainingHours > 0 && remainingHours < priorityHours * 0.25,
    isExpired: remainingMs <= 0,
  };
}
