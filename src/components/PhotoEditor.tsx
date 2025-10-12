"use client";

import { useRef, useState } from "react";

type PhotoEditorProps = {
  photoUrl?: string | null;
  onPhotoChange: (file: File) => void;
  onPhotoRemove: () => void;
  saving: boolean;
};

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Normalize different photo representations into a usable image src string.
const normalizePhoto = (v: any): string | null => {
  if (!v && v !== '') return null;
  try {
    // If already a full data URL or blob or http(s) URL
    if (typeof v === 'string') {
      const s = v.trim();
      // If it's a Google-hosted avatar leave it unchanged (these URLs often include size hints)
      if (/googleusercontent\.com|lh3\.googleusercontent\.com|avatars\.googleusercontent\.com/i.test(s)) return s;
      if (/^data:\w+\/[\w+.-]+;base64,/.test(s)) return s; // already a data URL
      if (/^(https?:|blob:|data:)/i.test(s)) return s; // valid URL-like

      // If it's raw base64 without data: prefix, try to heuristically detect mime
      // JPEG often starts with '/9j' when base64-encoded, PNG with 'iVBOR', GIF with 'R0lG'
      if (/^[A-Za-z0-9+/]+=*$/.test(s) && s.length > 64) {
        const prefix = s.slice(0, 4);
        let mime = 'image/jpeg';
        if (prefix.startsWith('iVB')) mime = 'image/png';
        else if (prefix.startsWith('R0l')) mime = 'image/gif';
        else if (prefix.startsWith('UEs')) mime = 'application/zip';
        return `data:${mime};base64,${s}`;
      }

      // Otherwise treat as URL string
      return s;
    }

    // If it's an object, try common properties
    if (typeof v === 'object') {
      if (typeof v.url === 'string') return normalizePhoto(v.url);
      if (typeof v.src === 'string') return normalizePhoto(v.src);
      if (typeof v.data === 'string') return normalizePhoto(v.data);
      if (typeof v.base64 === 'string') return normalizePhoto(v.base64);
      if (typeof v.picture === 'string') return normalizePhoto(v.picture);
      // Some providers return nested objects
      if (v.profile && typeof v.profile === 'object') {
        return normalizePhoto(v.profile.picture || v.profile.photo || v.profile.image || v.profile.avatar);
      }
    }
  } catch (err) {
    // ignore and return null
  }
  return null;
};

export function PhotoEditor({ photoUrl, onPhotoChange, onPhotoRemove, saving }: PhotoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const imgErrorAttempts = useRef<Record<string, number>>({});

  const normalizedPhoto = normalizePhoto(photoUrl);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoChange(file);
      setImgError(false);
    }
    // Reset input value to allow re-selecting the same file again
    event.target.value = "";
  };

  const handleImgError = async (el: HTMLImageElement) => {
    const src = el?.src || normalizedPhoto || '';
    if (!src) {
      setImgError(true);
      return;
    }
    imgErrorAttempts.current[src] = (imgErrorAttempts.current[src] || 0) + 1;
    
    // Try adding a size parameter for Google URLs
    if (imgErrorAttempts.current[src] === 1) {
      if (/googleusercontent\.com|lh3\.googleusercontent\.com|avatars\.googleusercontent\.com/i.test(src)) {
        try {
          const u = new URL(src);
          if (!u.searchParams.has('sz') && !u.search) {
            u.searchParams.set('sz', '256');
            el.src = u.toString();
            return;
          }
        } catch {}
      }
    }

    // Give up and show fallback
    setImgError(true);
  };

  return (
    <div className="relative h-32 w-32">
      <div className="group h-full w-full overflow-hidden rounded-2xl border-2 border-base-content/10">
        {normalizedPhoto && !imgError ? (
          <img 
            src={normalizedPhoto} 
            alt="Profile" 
            className="h-full w-full object-cover"
            onError={(e) => handleImgError(e.currentTarget)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-base-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/30">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
      </div>
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
          <div className="loading loading-spinner loading-md"></div>
        </div>
      )}
      <div className="absolute -bottom-2 -right-2 flex items-center gap-2">
        <button
          className="btn btn-circle btn-sm"
          onClick={handleIconClick}
          disabled={saving}
          aria-label="Change photo"
        >
          <EditIcon />
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}
