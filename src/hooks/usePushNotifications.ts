import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './useToast';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
        setSubscription(sub);
        setPermissionStatus(Notification.permission);
      } catch (error) {
        console.error("Error checking push subscription:", error);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [user, checkSubscription]);

  const subscribe = async () => {
    if (!user) {
      addToast('Você precisa estar logado para ativar as notificações.', 'error');
      return;
    }
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY') {
      console.error('VAPID public key is not defined.');
      addToast('Erro de configuração: Chave de notificação não encontrada.', 'error');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        subscription: sub.toJSON(),
      });

      if (error) throw error;

      setSubscription(sub);
      setIsSubscribed(true);
      setPermissionStatus('granted');
      addToast('Notificações ativadas com sucesso!', 'success');
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      if (error.name === 'NotAllowedError') {
        addToast('Permissão de notificação bloqueada. Altere nas configurações do navegador.', 'error');
        setPermissionStatus('denied');
      } else {
        addToast(`Falha ao ativar notificações: ${error.message}`, 'error');
      }
      setIsSubscribed(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription || !user) return;
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('subscription->>endpoint', subscription.endpoint);

      if (error) throw error;
      
      await subscription.unsubscribe();
      
      setSubscription(null);
      setIsSubscribed(false);
      addToast('Notificações desativadas.', 'info');
    } catch (error: any) {
      console.error('Failed to unsubscribe:', error);
      addToast(`Falha ao desativar notificações: ${error.message}`, 'error');
    }
  };

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      if (Notification.permission === 'denied') {
        addToast('As notificações estão bloqueadas. Por favor, habilite-as nas configurações do seu navegador.', 'warning');
        return;
      }
      await subscribe();
    }
  };

  return { isSubscribed, handleToggle, permissionStatus, isLoading };
};
