"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function EstudoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-1",
      role: "assistant",
      content:
        "Olá! Eu sou seu assistente de estudos. Faça uma pergunta sobre Psicologia ou peça ajuda para revisar um tema.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setSending(true);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    addMessage(userMessage);
    setPrompt("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "O servidor de IA falhou. Tente novamente.");
      } else {
        addMessage({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message || "A IA não retornou uma resposta.",
        });
      }
    } catch (err) {
      console.error("Estudo chat error", err);
      setError("Não foi possível conectar ao serviço de chat. Verifique sua internet e tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chat de Estudos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Converse com a IA para revisar conteúdos, tirar dúvidas ou pedir resumos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu assistente de estudos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                      : "rounded-2xl bg-blue-50 px-4 py-3 text-sm text-gray-900 shadow-sm dark:bg-blue-900/30 dark:text-gray-100"
                  }
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {message.role === "user" ? (
                      <span>Você</span>
                    ) : (
                      <span>Assistente</span>
                    )}
                  </div>
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Digite sua dúvida sobre Psicologia..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !prompt.trim()} className="justify-center gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
