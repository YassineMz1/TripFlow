"use client";
import React, { useEffect, useState } from 'react';
import { processQueue, queueLength } from '../lib/offline-queue';

export default function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queued, setQueued] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // mark mounted to avoid rendering during SSR (prevents hydration mismatch)
    setMounted(true);
    setQueued(queueLength());

    function onOnline() {
      setOnline(true);
      // try to process queue when back online
      processQueue().then(() => setQueued(queueLength()));
    }
    function onOffline() { setOnline(false); }

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Listen for messages from service worker (update available)
    function onMessage(ev: MessageEvent) {
      try {
        const data = ev.data || {};
        if (data?.type === 'SW_WAITING') setUpdateAvailable(true);
      } catch (e) {}
    }
    navigator.serviceWorker?.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  async function handleSync() {
    await processQueue();
    setQueued(queueLength());
  }

  function handleUpdate() {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  if (online) {
    if (!mounted) return null;
    return (
      <div style={{position:'fixed',left:12,top:12,zIndex:1200}}>
        {queued > 0 && (
          <button onClick={handleSync} style={{padding:'6px 10px',borderRadius:8,background:'#0ea5a4',color:'#fff',border:'none'}}>Sync {queued} pending</button>
        )}
        {updateAvailable && (
          <button onClick={handleUpdate} style={{marginLeft:8,padding:'6px 10px',borderRadius:8,background:'#2563eb',color:'#fff',border:'none'}}>Update available — Reload</button>
        )}
      </div>
    );
  }

  // offline view
  if (!mounted) return null;
  return (
    <div style={{position:'fixed',left:12,top:12,zIndex:1200,display:'flex',gap:8,alignItems:'center'}}>
      <div style={{background:'rgba(15,23,42,0.9)',color:'white',padding:'8px 12px',borderRadius:10,display:'flex',flexDirection:'column',gap:6,alignItems:'flex-start'}}>
        <div style={{fontWeight:600}}>You're offline</div>
        <div style={{fontSize:12,opacity:0.9}}>{queued > 0 ? `${queued} action(s) queued` : 'No network connection'}</div>
      </div>
    </div>
  );
}
