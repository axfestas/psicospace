"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

interface DocumentViewerModalProps {
  url: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  onClose: () => void;
}

export function DocumentViewerModal({ url, title, type, onClose }: DocumentViewerModalProps) {
  const [iframeSrc, setIframeSrc] = useState<string>("");

  useEffect(() => {
    if (type === "SLIDE") {
      const absolute = url.startsWith("http") ? url : window.location.origin + url;
      setIframeSrc(
        `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(absolute)}`
      );
    } else {
      setIframeSrc(url);
    }
  }, [url, type]);

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
        <span className="text-sm font-medium text-white truncate max-w-[70%]">{title}</span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white p-1"
            title="Abrir em nova aba"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 overflow-hidden">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0"
            title={title}
            allow="fullscreen"
          />
        ) : null}
      </div>
    </div>
  );
}
