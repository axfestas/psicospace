"use client";

import { useEffect } from "react";
import { X, Download, Presentation, Globe, ExternalLink } from "lucide-react";

interface DocumentViewerModalProps {
  url: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  onClose: () => void;
}

export function DocumentViewerModal({ url, title, type, onClose }: DocumentViewerModalProps) {
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

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {type === "SLIDE" ? (
          /* Presentations (PPTX/PPT) cannot be displayed inline in a browser.
             Offer a download link instead. */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-white">
            <Presentation className="h-20 w-20 text-orange-400" />
            <p className="text-lg font-medium text-center px-4">{title}</p>
            <p className="text-sm text-gray-400 text-center px-8">
              Apresentações não podem ser visualizadas diretamente no navegador.<br />
              Faça o download para abrir no PowerPoint ou LibreOffice.
            </p>
            <a
              href={url}
              download
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
              Baixar Apresentação
            </a>
          </div>
        ) : type === "LINK" ? (
          /* External links often block iframe embedding (X-Frame-Options).
             Open them reliably in a new tab instead. */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-white">
            <Globe className="h-20 w-20 text-blue-400" />
            <p className="text-lg font-medium text-center px-4">{title}</p>
            <p className="text-sm text-gray-400 text-center px-8">
              Links externos são abertos em uma nova aba do navegador.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              Abrir Link
            </a>
          </div>
        ) : (
          /* PDF files can be rendered inline in an iframe */
          <iframe
            src={url}
            className="w-full h-full border-0"
            title={title}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}
