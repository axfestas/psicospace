"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link2, Plus, Trash2,
  FileText, Save, Undo2, Redo2, Subscript as SubIcon, Superscript as SupIcon,
  Code, Code2, Quote, Minus, Table as TableIcon, Image as ImageIcon,
  ListChecks, Highlighter, Columns, Printer, Download, X, Check,
  ChevronDown, RemoveFormatting,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const FONTS = [
  { label: "Padrão", value: "" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
];

const HEADING_OPTIONS = [
  { label: "Parágrafo", value: 0 },
  { label: "Título 1", value: 1 },
  { label: "Título 2", value: 2 },
  { label: "Título 3", value: 3 },
  { label: "Título 4", value: 4 },
  { label: "Título 5", value: 5 },
  { label: "Título 6", value: 6 },
];

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#DC2626", "#EA580C",
  "#D97706", "#16A34A", "#0284C7", "#7C3AED", "#DB2777",
  "#FFFFFF", "#F3F4F6", "#FEF3C7", "#DCFCE7", "#DBEAFE",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#BBF7D0", "#BAE6FD", "#F5D0FE", "#FED7AA",
  "#FCA5A5", "#A7F3D0", "#C7D2FE", "#FBCFE8", "#E5E7EB",
];

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 self-center flex-shrink-0" />;
}

function ToolbarButton({
  onClick, active, children, title: btnTitle, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={btnTitle}
      disabled={disabled}
      className={`rounded p-1.5 transition-colors disabled:opacity-40 flex-shrink-0 ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ColorPicker({
  colors, value, onChange, title,
}: {
  colors: string[];
  value?: string;
  onChange: (c: string) => void;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        title={title}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-0.5 rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <span
          className="h-4 w-4 rounded border border-gray-300 dark:border-gray-500"
          style={{ backgroundColor: value || "#000000" }}
        />
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="h-5 w-5 rounded border border-gray-300 dark:border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectDropdown({
  options, value, onChange, title,
}: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: string | number) => void;
  title?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(isNaN(Number(v)) ? v : Number(v));
      }}
      title={title}
      className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-1.5 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function LinkDialog({
  onConfirm, onCancel, initialUrl,
}: {
  onConfirm: (url: string) => void;
  onCancel: () => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl || "https://");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Inserir link</h3>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && onConfirm(url)}
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(url)}>
            <Check className="h-3.5 w-3.5 mr-1" />Inserir
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageDialog({ onConfirm, onCancel }: { onConfirm: (url: string, alt?: string) => void; onCancel: () => void }) {
  const [url, setUrl] = useState("https://");
  const [alt, setAlt] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Inserir imagem</h3>
        <div className="space-y-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">URL da imagem</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." autoFocus />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Texto alternativo (opcional)</label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Descrição da imagem" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(url, alt)}>
            <Check className="h-3.5 w-3.5 mr-1" />Inserir
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("id");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState("Novo Documento");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const getHeadingValue = useCallback((ed: ReturnType<typeof useEditor> | null): number => {
    if (!ed) return 0;
    for (let i = 1; i <= 6; i++) {
      if (ed.isActive("heading", { level: i })) return i;
    }
    return 0;
  }, []);

  const getCurrentFont = useCallback((ed: ReturnType<typeof useEditor> | null): string => {
    if (!ed) return "";
    const attrs = ed.getAttributes("textStyle");
    return attrs?.fontFamily || "";
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      FontFamily,
      Placeholder.configure({ placeholder: "Comece a escrever seu documento..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none prose dark:prose-invert max-w-none p-6 min-h-[600px]",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.state.doc.textContent;
      setCharCount(text.length);
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    },
  });

  const loadDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
    }
  }, []);

  const loadDocument = useCallback(async (id: string) => {
    const res = await fetch(`/api/documents/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCurrentDoc(data.document);
      setTitle(data.document.title);
      editor?.commands.setContent(data.document.content || "");
    }
  }, [editor]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  useEffect(() => {
    if (docId && editor) loadDocument(docId);
  }, [docId, editor, loadDocument]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    const content = editor.getHTML();
    if (currentDoc) {
      await fetch(`/api/documents/${currentDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
    } else {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentDoc(data.document);
        router.push(`/editor?id=${data.document.id}`);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadDocuments();
  }, [editor, currentDoc, title, router, loadDocuments]);

  const handleNewDocument = () => {
    setCurrentDoc(null);
    setTitle("Novo Documento");
    editor?.commands.setContent("");
    router.push("/editor");
  };

  const handleDeleteDocument = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (currentDoc?.id === id) handleNewDocument();
    loadDocuments();
  };

  const handlePrint = () => {
    if (!editor) return;
    const content = editor.getHTML();
    const win = window.open("", "_blank");
    if (!win) return;
    const safeTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    win.document.write(`<!DOCTYPE html><html><head><title>${safeTitle}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;}
        h1,h2,h3,h4,h5,h6{margin-top:1.5em;}
        table{border-collapse:collapse;width:100%;}
        td,th{border:1px solid #ccc;padding:8px;}
        img{max-width:100%;}
        ul,ol{padding-left:2em;}
        blockquote{border-left:4px solid #ccc;margin-left:0;padding-left:1em;color:#555;}
        @media print{body{margin:0;padding:15mm;}}
      </style>
      </head><body>
        <h1 style="font-size:1.5em;border-bottom:1px solid #eee;padding-bottom:0.5em;">${safeTitle}</h1>
        ${content}
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExportHTML = () => {
    if (!editor) return;
    const safeTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const blob = new Blob(
      [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body><h1>${safeTitle}</h1>${editor.getHTML()}</body></html>`],
      { type: "text/html" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleInsertLink = (url: string) => {
    if (!editor) return;
    setShowLinkDialog(false);
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertImage = (url: string, alt?: string) => {
    if (!editor) return;
    setShowImageDialog(false);
    editor.chain().focus().setImage({ src: url, alt: alt || "" }).run();
  };

  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSave]);

  const headingValue = getHeadingValue(editor);
  const currentFont = getCurrentFont(editor);
  const currentColor = editor?.getAttributes("textStyle")?.color || "#000000";
  const currentHighlight = editor?.getAttributes("highlight")?.color || "";

  return (
    <div className="flex h-full gap-4">
      {/* Document list sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-2">
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documentos</span>
              <button onClick={handleNewDocument} className="text-blue-600 hover:text-blue-700" title="Novo documento">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1">
              {documents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum documento</p>
              )}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`group flex items-center justify-between rounded-lg p-2 cursor-pointer ${
                    currentDoc?.id === doc.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => router.push(`/editor?id=${doc.id}`)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-xs text-gray-700 dark:text-gray-300">{doc.title}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                    className="hidden group-hover:block text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title + action buttons */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-40 text-lg font-semibold border-0 border-b rounded-none px-0 focus:ring-0 bg-transparent"
            placeholder="Título do documento"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={handlePrint} variant="outline" title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleExportHTML} variant="outline" title="Exportar HTML">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saved ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
            {/* Row 1 */}
            <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-gray-700 min-w-max">
              <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)" disabled={!editor?.can().undo()}>
                <Undo2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} title="Refazer (Ctrl+Y)" disabled={!editor?.can().redo()}>
                <Redo2 className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <SelectDropdown
                title="Estilo de parágrafo"
                options={HEADING_OPTIONS}
                value={headingValue}
                onChange={(v) => {
                  const level = Number(v);
                  if (level === 0) editor?.chain().focus().setParagraph().run();
                  else editor?.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run();
                }}
              />

              <Divider />

              <SelectDropdown
                title="Família de fonte"
                options={FONTS}
                value={currentFont}
                onChange={(v) => {
                  if (!v) editor?.chain().focus().unsetFontFamily().run();
                  else editor?.chain().focus().setFontFamily(String(v)).run();
                }}
              />

              <Divider />

              <ColorPicker
                colors={TEXT_COLORS}
                value={currentColor}
                onChange={(c) => editor?.chain().focus().setColor(c).run()}
                title="Cor do texto"
              />

              <ColorPicker
                colors={HIGHLIGHT_COLORS}
                value={currentHighlight}
                onChange={(c) => editor?.chain().focus().setHighlight({ color: c }).run()}
                title="Cor de destaque"
              />
              <ToolbarButton
                onClick={() => editor?.chain().focus().unsetHighlight().run()}
                title="Remover destaque"
              >
                <Highlighter className="h-4 w-4 opacity-50" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton
                onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
                title="Remover formatação"
              >
                <RemoveFormatting className="h-4 w-4" />
              </ToolbarButton>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-0.5 px-2 py-1 min-w-max">
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Negrito (Ctrl+B)">
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Itálico (Ctrl+I)">
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Sublinhado (Ctrl+U)">
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Tachado">
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleSubscript().run()} active={editor?.isActive("subscript")} title="Subscrito">
                <SubIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleSuperscript().run()} active={editor?.isActive("superscript")} title="Sobrescrito">
                <SupIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive("code")} title="Código inline">
                <Code className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} title="Alinhar à esquerda">
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} title="Centralizar">
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} title="Alinhar à direita">
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("justify").run()} active={editor?.isActive({ textAlign: "justify" })} title="Justificar">
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Lista de marcadores">
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Lista numerada">
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleTaskList().run()} active={editor?.isActive("taskList")} title="Lista de tarefas">
                <ListChecks className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Citação em bloco">
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock")} title="Bloco de código">
                <Code2 className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => setShowLinkDialog(true)} active={editor?.isActive("link")} title="Inserir link (Ctrl+K)">
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => setShowImageDialog(true)} title="Inserir imagem">
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={handleInsertTable} active={editor?.isActive("table")} title="Inserir tabela">
                <TableIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Linha separadora">
                <Minus className="h-4 w-4" />
              </ToolbarButton>

              {editor?.isActive("table") && (
                <>
                  <Divider />
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-1 flex-shrink-0">Tabela:</span>
                  <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Inserir coluna antes">
                    <Columns className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Inserir linha abaixo">
                    <Plus className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Excluir linha">
                    <Minus className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Excluir tabela">
                    <Trash2 className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="Mesclar células">
                    <span className="text-xs font-mono" aria-label="Mesclar células">⊞</span>
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="Dividir célula">
                    <span className="text-xs font-mono" aria-label="Dividir célula">⊟</span>
                  </ToolbarButton>
                </>
              )}
            </div>
          </div>

          {/* Bubble menu */}
          {editor && (
            <BubbleMenu editor={editor}>
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg p-1">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
                  <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
                  <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => setShowLinkDialog(true)} active={editor.isActive("link")} title="Link">
                  <Link2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Limpar formatação">
                  <RemoveFormatting className="h-3.5 w-3.5" />
                </ToolbarButton>
              </div>
            </BubbleMenu>
          )}

          <CardContent className="flex-1 p-0 overflow-auto">
            <EditorContent editor={editor} className="h-full" />
          </CardContent>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-400">
            <span>{wordCount} palavras · {charCount} caracteres</span>
            {currentDoc && (
              <span>Última edição: {formatDate(currentDoc.updatedAt)}</span>
            )}
          </div>
        </Card>
      </div>

      {showLinkDialog && (
        <LinkDialog
          initialUrl={editor?.getAttributes("link")?.href || ""}
          onConfirm={handleInsertLink}
          onCancel={() => setShowLinkDialog(false)}
        />
      )}
      {showImageDialog && (
        <ImageDialog
          onConfirm={handleInsertImage}
          onCancel={() => setShowImageDialog(false)}
        />
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <EditorPageInner />
    </Suspense>
  );
}
