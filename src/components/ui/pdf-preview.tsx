"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, Presentation, Globe } from "lucide-react";
import { normalizeStoredMaterialUrl, resolveViewerKind } from "@/lib/file-urls";

interface PdfPreviewProps {
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  onClick?: () => void;
}

/** Renders a small preview thumbnail for library items. */
const THUMBNAIL_WIDTH = 280;
// 0.82 preserves readable text while keeping thumbnail upload/render lightweight.
const PDF_THUMBNAIL_QUALITY = 0.82;
const generatedPreviewCache = new Map<string, string | null>();
// Keep cache bounded for long-lived sessions with many cards open.
const MAX_PREVIEW_CACHE_ITEMS = 120;
let pdfJsModulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

function cacheGeneratedPreview(key: string, value: string | null) {
  generatedPreviewCache.set(key, value);
  while (generatedPreviewCache.size > MAX_PREVIEW_CACHE_ITEMS) {
    const oldestKey = generatedPreviewCache.keys().next().value;
    if (!oldestKey) break;
    generatedPreviewCache.delete(oldestKey);
  }
}

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist").then((pdfjsLib) => {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }
      return pdfjsLib;
    });
  }
  return pdfJsModulePromise;
}

export function PdfPreview({ type, url, title, thumbnailUrl, onClick }: PdfPreviewProps) {
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const normalizedUrl = useMemo(() => normalizeStoredMaterialUrl(url, type), [url, type]);
  const normalizedThumbnailUrl = useMemo(
    () => (thumbnailUrl ? normalizeStoredMaterialUrl(thumbnailUrl) : null),
    [thumbnailUrl]
  );
  const viewerKind = useMemo(() => resolveViewerKind(type, normalizedUrl), [type, normalizedUrl]);

  const wrapperClass =
    "w-full h-44 flex items-center justify-center rounded-t-lg cursor-pointer overflow-hidden";

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [normalizedUrl, normalizedThumbnailUrl, viewerKind]);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      if (type !== "PDF" || viewerKind !== "PDF" || normalizedThumbnailUrl) {
        setGeneratedPreview(null);
        return;
      }

      const cached = generatedPreviewCache.get(normalizedUrl);
      if (cached !== undefined) {
        setGeneratedPreview(cached);
        return;
      }

      try {
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument({ url: normalizedUrl, withCredentials: true }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = THUMBNAIL_WIDTH / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cacheGeneratedPreview(normalizedUrl, null);
          if (!cancelled) setGeneratedPreview(null);
          return;
        }

        await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise;
        const previewDataUrl = canvas.toDataURL("image/jpeg", PDF_THUMBNAIL_QUALITY);
        cacheGeneratedPreview(normalizedUrl, previewDataUrl);
        if (!cancelled) setGeneratedPreview(previewDataUrl);
      } catch (error) {
        console.warn("[biblioteca] Falha ao gerar preview de PDF", error);
        cacheGeneratedPreview(normalizedUrl, null);
        if (!cancelled) setGeneratedPreview(null);
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [type, viewerKind, normalizedUrl, normalizedThumbnailUrl]);

  if (type === "SLIDE") {
    return (
      <div
        className={`${wrapperClass} bg-orange-50 dark:bg-orange-900/20`}
        onClick={onClick}
        title={title}
      >
        <Presentation className="h-16 w-16 text-orange-300 dark:text-orange-600" />
      </div>
    );
  }

  if (type === "LINK") {
    return (
      <div
        className={`${wrapperClass} bg-blue-50 dark:bg-blue-900/20`}
        onClick={onClick}
        title={title}
      >
        <Globe className="h-16 w-16 text-blue-300 dark:text-blue-600" />
      </div>
    );
  }

  if (viewerKind === "IMAGE") {
    return (
      <div
        className={`${wrapperClass} bg-gray-50 dark:bg-gray-800 relative`}
        onClick={onClick}
        title={title}
      >
        {!imagePreviewFailed ? (
          <img
            src={normalizedThumbnailUrl ?? normalizedUrl}
            alt={`Prévia de ${title}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImagePreviewFailed(true)}
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-sky-300 dark:text-sky-600" />
        )}
      </div>
    );
  }

  // PDF
  return (
    <div
      className={`${wrapperClass} bg-gray-50 dark:bg-gray-800 relative`}
      onClick={onClick}
      title={title}
    >
      {normalizedThumbnailUrl || generatedPreview ? (
        <img
          src={normalizedThumbnailUrl ?? generatedPreview ?? undefined}
          alt={`Prévia de ${title}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <FileText className="h-16 w-16 text-red-300 dark:text-red-600" />
      )}
    </div>
  );
}
