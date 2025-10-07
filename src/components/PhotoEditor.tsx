"use client";

import { useRef } from "react";

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

export function PhotoEditor({ photoUrl, onPhotoChange, onPhotoRemove, saving }: PhotoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoChange(file);
    }
    // Reset input value to allow re-selecting the same file again
    event.target.value = "";
  };

  return (
    <div className="relative h-32 w-32">
      <div className="group h-full w-full overflow-hidden rounded-2xl border-2 border-base-content/10">
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
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
