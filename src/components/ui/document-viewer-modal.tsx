"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DocumentViewerModalProps {
  url: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  onClose: () => void;
}

export function DocumentViewerModal({ url, title, onClose }: DocumentViewerModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 flex-shrink-0">
        <span className="text-sm font-medium text-white truncate max-w-[90%]">{title}</span>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white p-1"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Iframe — loads the URL directly within the site */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
