import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatters';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'ticket_created': return '🎫';
      case 'ticket_assigned': return '👤';
      case 'ticket_status_changed': return '🔄';
      case 'comment_added': return '💬';
      case 'sla_warning': return '⚠️';
      case 'sla_expired': return '🚨';
      default: return '🔔';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    if (notification.reference_id && notification.reference_type === 'ticket') {
      navigate(`/tickets/${notification.reference_id}`);
    } else if (notification.reference_id && notification.reference_type === 'asset') {
      navigate(`/assets/${notification.reference_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Notificacoes</h1>
              <p className="text-sm text-gray-500 mt-1">{unreadCount} nao lida(s)</p>
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-netvision-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Bell className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-500">Nenhuma notificacao</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-gray-800/30 transition-colors ${
                  !notification.read ? 'bg-netvision-600/5' : ''
                }`}
              >
                <span className="text-xl mt-0.5">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200">{notification.title}</p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-netvision-400 rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notification.id); }}
                      className="p-1.5 text-gray-500 hover:text-green-400 rounded-lg hover:bg-gray-800"
                      title="Marcar como lida"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notification.id); }}
                    className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
