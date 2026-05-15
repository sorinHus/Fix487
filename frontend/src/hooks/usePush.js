import { useEffect } from 'react';
import api from '../api/axios';

function urlB64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function usePush() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    const subscribe = async () => {
      try {
        const permission = Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
        if (permission !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed on this browser

        const { data } = await api.get('/push/vapid-key/');
        if (!data.public_key) return; // VAPID not configured yet

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(data.public_key),
        });

        const json = sub.toJSON();
        await api.post('/push/subscribe/', {
          endpoint: json.endpoint,
          p256dh:   json.keys.p256dh,
          auth:     json.keys.auth,
        });
      } catch {
        // Browser may block or VAPID not configured — fail silently
      }
    };

    navigator.serviceWorker.ready.then(subscribe);
  }, []);
}
