"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Link2, Plus, Trash2, FileText, Save,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[400px] outline-none prose dark:prose-invert max-w-none p-4",
      },
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

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (docId && editor) {
      loadDocument(docId);
    }
  }, [docId, editor, loadDocument]);

  const handleSave = async () => {
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
  };

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

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title: btnTitle,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={btnTitle}
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full gap-4">
      <div className="w-56 flex-shrink-0 hidden lg:block">
        <Card className="h-full">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documentos</span>
              <button onClick={handleNewDocument} className="text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
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
                    className="hidden group-hover:block text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 flex items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 border-b rounded-none px-0 focus:ring-0 bg-transparent"
            placeholder="Título do documento"
          />
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saved ? "Salvo!" : "Salvar"}
          </Button>
        </div>

        <Card className="flex-1 flex flex-col">
          <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2 dark:border-gray-700">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive("underline")}
              title="Sublinhado"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive("strike")}
              title="Tachado"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1 self-center" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              active={editor?.isActive({ textAlign: "left" })}
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              active={editor?.isActive({ textAlign: "center" })}
              title="Centralizar"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              active={editor?.isActive({ textAlign: "right" })}
              title="Alinhar à direita"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1 self-center" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive("orderedList")}
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1 self-center" />
            {["1", "2", "3"].map((level) => (
              <ToolbarButton
                key={level}
                onClick={() => editor?.chain().focus().toggleHeading({ level: parseInt(level) as 1 | 2 | 3 }).run()}
                active={editor?.isActive("heading", { level: parseInt(level) })}
                title={`Título ${level}`}
              >
                <span className="text-xs font-bold">H{level}</span>
              </ToolbarButton>
            ))}
          </div>
          <CardContent className="flex-1 p-0 overflow-auto">
            <EditorContent editor={editor} className="h-full" />
          </CardContent>
        </Card>

        {currentDoc && (
          <p className="mt-2 text-xs text-gray-400 text-right">
            Última edição: {formatDate(currentDoc.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>}>
      <EditorPageInner />
    </Suspense>
  );
}
