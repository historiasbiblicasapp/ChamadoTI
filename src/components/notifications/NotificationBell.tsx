import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, BellRing } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { formatDate } from '../../utils/formatters';

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, newCount, clearNewCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { permission, requestPermission } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && newCount > 0) {
      clearNewCount();
    }
  }, [isOpen, newCount, clearNewCount]);

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
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200">Notificacoes</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-netvision-400 hover:text-netvision-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {permission === 'default' && (
            <div className="p-3 bg-netvision-600/10 border-b border-netvision-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <BellRing className="w-4 h-4 text-netvision-400 shrink-0" />
                <span>Receber alertas nativos de chamados?</span>
              </div>
              <button
                onClick={() => requestPermission()}
                className="px-2.5 py-1 bg-netvision-600 hover:bg-netvision-500 text-white text-xs font-semibold rounded transition-all shrink-0"
              >
                Ativar
              </button>
            </div>
          )}


          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Nenhuma notificacao
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 ${
                    !notification.read ? 'bg-netvision-600/5' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-200 truncate">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-netvision-400 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notification.id); }}
                        className="p-1 text-gray-500 hover:text-green-400 rounded"
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notification.id); }}
                      className="p-1 text-gray-500 hover:text-red-400 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-800 text-center">
              <button
                onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                className="text-xs text-netvision-400 hover:text-netvision-300 font-medium"
              >
                Ver todas as notificacoes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
