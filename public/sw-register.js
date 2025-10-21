if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('Service worker registered:', reg);

      // If there's an updated worker waiting, notify the page
      if (reg.waiting) {
        navigator.serviceWorker.controller?.postMessage({ type: 'SW_WAITING' });
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            window.postMessage({ type: 'SW_WAITING' }, '*');
          }
        });
      });

    }).catch((err) => {
      console.warn('SW registration failed:', err);
    });

    // Listen for page requests to trigger skipWaiting
    window.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'SKIP_WAITING') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  });
} else {
  console.log('Service workers not supported in this browser');
}