import { useState, useEffect } from 'react';
import { showToast } from '../components/ui/Toaster';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      showToast('error', 'Não suportado', 'Notificações não são suportadas neste navegador.');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        showToast('success', 'Notificações Ativadas', 'Você receberá alertas nativos de chamados.');
        return true;
      } else if (res === 'denied') {
        showToast('info', 'Notificações Bloqueadas', 'Você bloqueou as permissões de notificação.');
        return false;
      }
    } catch {
      showToast('error', 'Erro', 'Não foi possível solicitar permissão de notificação.');
    }
    return false;
  };

  const sendLocalNotification = (title: string, body: string, url: string = '/tickets') => {
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/logo.jpeg',
          data: { url },
        });
      });
    } else if ('Notification' in window) {
      new Notification(title, { body, icon: '/logo.jpeg' });
    }
  };

  return {
    permission,
    requestPermission,
    sendLocalNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}
