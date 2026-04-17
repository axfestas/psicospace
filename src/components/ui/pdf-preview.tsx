"use client";

import { FileText, Presentation, Globe } from "lucide-react";

interface PdfPreviewProps {
  type: "PDF" | "SLIDE" | "LINK";
  title: string;
  thumbnailUrl?: string | null;
  onClick?: () => void;
}

/** Renders a small preview thumbnail for library items. */
export function PdfPreview({ type, title, thumbnailUrl, onClick }: PdfPreviewProps) {

  const wrapperClass =
    "w-full h-44 flex items-center justify-center rounded-t-lg cursor-pointer overflow-hidden";

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

  // PDF
  return (
    <div
      className={`${wrapperClass} bg-gray-50 dark:bg-gray-800 relative`}
      onClick={onClick}
      title={title}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
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
