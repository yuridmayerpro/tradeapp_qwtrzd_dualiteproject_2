// public/sw.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  const data = event.data.json();
  const { title, body, icon, url } = data;

  const options = {
    body: body,
    icon: icon || 'https://i.ibb.co/HLfD5wgf/dualite-favicon.png',
    badge: 'https://i.ibb.co/HLfD5wgf/dualite-favicon.png',
    data: {
      url: url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription has changed. A new subscription needs to be sent to the server.');
  // In a full implementation, you would re-trigger the subscription logic
  // from the main app when it next loads to ensure the user remains subscribed.
});
