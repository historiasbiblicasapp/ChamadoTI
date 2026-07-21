import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, color = 'text-netvision-400', subtitle, loading }: Props) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-800 animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold text-gray-100">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gray-800/50 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
