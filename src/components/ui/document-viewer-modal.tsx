"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Download, Presentation, Globe, ExternalLink, AlertTriangle } from "lucide-react";
import { isInternalFileUrl, normalizeStoredMaterialUrl, resolveViewerKind } from "@/lib/file-urls";
import {
  usePomodoroTimer,
  PomodoroHeaderButton,
  PomodoroBreakOverlay,
} from "@/components/ui/pomodoro-timer";
import { PdfCanvasViewer } from "@/components/ui/pdf-canvas-viewer";

interface DocumentViewerModalProps {
  url: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  onClose: () => void;
  /** Material ID used to persist reading position and highlights per material */
  materialId?: string;
  /** Last saved page from the database (used as fallback when localStorage has no entry) */
  initialPage?: number;
}

export function DocumentViewerModal({ url, title, type, onClose, materialId, initialPage }: DocumentViewerModalProps) {
  const [iframeError, setIframeError] = useState(false);
  const normalizedUrl = normalizeStoredMaterialUrl(url, type);
  const pomodoro = usePomodoroTimer();

  const viewerKind = resolveViewerKind(type, normalizedUrl);
  const showExternalLinkView = viewerKind === "LINK" && !isInternalFileUrl(normalizedUrl);
  const canDownloadFile = viewerKind !== "LINK" || isInternalFileUrl(normalizedUrl);

  // Per-material localStorage key — prefer materialId for uniqueness when multiple
  // materials share the same URL (e.g. library items).
  // PdfCanvasViewer reads this key on mount to restore the last page and highlights.
  const storageKey = `pdf_page_${materialId ?? normalizedUrl}`;

  // Seed localStorage with the DB value only when there is no more-recent local save
  useEffect(() => {
    if (viewerKind !== "PDF" || typeof window === "undefined") return;
    if (initialPage && initialPage > 0 && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, String(initialPage));
    }
  }, [viewerKind, storageKey, initialPage]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(() => {
    setIframeError(false);
  }, [normalizedUrl, type]);

  // Full absolute URL for the file (needed for new-tab links and downloads)
  const absoluteUrl =
    typeof window !== "undefined" && normalizedUrl.startsWith("/")
      ? `${window.location.origin}${normalizedUrl}`
      : normalizedUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 flex-shrink-0">
        <span className="text-sm font-medium text-white truncate max-w-[70%]">{title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download button — always present so user can get the file even if preview fails */}
          {canDownloadFile && (
            <a
              href={absoluteUrl}
              download
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded px-2 py-1 transition-colors"
              title="Baixar arquivo"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </a>
          )}
          {/* Open-in-new-tab — lets the browser render the PDF natively outside the iframe */}
          {(viewerKind === "PDF" || viewerKind === "IMAGE") && (
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded px-2 py-1 transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Nova aba
            </a>
          )}
          {/* Pomodoro timer button */}
          <PomodoroHeaderButton
            phase={pomodoro.phase}
            formattedTime={pomodoro.formattedTime}
            completedPomodoros={pomodoro.completedPomodoros}
            isActive={pomodoro.isActive}
            isBreak={pomodoro.isBreak}
            onStart={pomodoro.start}
            onStop={pomodoro.stop}
            onSkip={pomodoro.skipPhase}
          />
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white p-1"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {viewerKind === "SLIDE" ? (
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
              href={absoluteUrl}
              download
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
              Baixar Apresentação
            </a>
          </div>
        ) : showExternalLinkView ? (
          /* External links often block iframe embedding (X-Frame-Options).
             Open them reliably in a new tab instead. */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-white">
            <Globe className="h-20 w-20 text-blue-400" />
            <p className="text-lg font-medium text-center px-4">{title}</p>
            <p className="text-sm text-gray-400 text-center px-8">
              Links externos são abertos em uma nova aba do navegador.
            </p>
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              Abrir Link
            </a>
          </div>
        ) : iframeError ? (
          /* Iframe failed to load — show a friendly fallback */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-white">
            <AlertTriangle className="h-16 w-16 text-yellow-400" />
            <p className="text-lg font-medium text-center px-4">{title}</p>
            <p className="text-sm text-gray-400 text-center px-8">
              Não foi possível exibir o arquivo diretamente no navegador.<br />
              Use um dos botões abaixo para acessá-lo.
            </p>
            <div className="flex gap-3">
              <a
                href={absoluteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir em nova aba
              </a>
              <a
                href={absoluteUrl}
                download
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Baixar
              </a>
            </div>
          </div>
        ) : viewerKind === "IMAGE" ? (
          <div className="h-full w-full overflow-auto bg-black flex items-center justify-center p-4">
            <img
              src={normalizedUrl}
              alt={title}
              className="max-h-full max-w-full object-contain"
              onError={() => setIframeError(true)}
            />
          </div>
        ) : (
          /* PDF files — rendered via canvas using pdfjs-dist.
             Supports per-material page persistence and text highlights. */
          <PdfCanvasViewer
            url={normalizedUrl}
            storageKey={storageKey}
            materialId={materialId}
          />
        )}
        {/* Pomodoro break overlay — displayed on top of content during a break */}
        {(pomodoro.phase === "shortBreak" || pomodoro.phase === "longBreak") && (
          <PomodoroBreakOverlay
            phase={pomodoro.phase}
            secondsLeft={pomodoro.secondsLeft}
            totalSeconds={pomodoro.totalSeconds}
            completedPomodoros={pomodoro.completedPomodoros}
            formattedTime={pomodoro.formattedTime}
            onSkip={pomodoro.skipPhase}
          />
        )}
      </div>
    </div>
  );
}
