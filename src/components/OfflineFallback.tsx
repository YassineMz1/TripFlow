"use client";
import React, { useEffect, useState } from "react";

export default function OfflineFallback({ message = "You're offline" }: { message?: string }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine ?? true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div style={{ position: 'fixed', top: 64, left: 12, right: 12, zIndex: 60, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#0ea5a4', color: 'white', padding: '8px 12px', borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.2)' }}>
        {message}
      </div>
    </div>
  );
}
