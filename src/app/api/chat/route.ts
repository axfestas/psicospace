import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

interface AIProviderConfig {
  url: string;
  key: string;
  model: string;
}

function resolveAIProvider(): AIProviderConfig | null {
  let groqKey: string | undefined;
  let openaiKey: string | undefined;

  try {
    const env = getRequestContext().env as unknown as Record<string, string | undefined>;
    groqKey = env.GROQ_API_KEY;
    openaiKey = env.OPENAI_API_KEY;
  } catch {
    // Not in Cloudflare Pages request context.
  }

  groqKey ??= process.env.GROQ_API_KEY;
  openaiKey ??= process.env.OPENAI_API_KEY;

  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groqKey,
      model: "llama-3.1-8b-instant",
    };
  }

  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      key: openaiKey,
      model: "gpt-4o-mini",
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, contextText } = (await request.json()) as {
      messages?: Array<{ role: string; content: string }>;
      contextText?: string;
    };
    const validMessages = Array.isArray(messages)
      ? messages.filter((message) => message.role === "user" || message.role === "assistant")
      : [];
    if (validMessages.length === 0) {
      return NextResponse.json({ error: "Digite uma pergunta para começar." }, { status: 400 });
    }

    const provider = resolveAIProvider();
    if (!provider) {
      return NextResponse.json(
        {
          error:
            "Nenhuma chave de IA configurada. Defina GROQ_API_KEY ou OPENAI_API_KEY para usar o chat de estudos.",
        },
        { status: 503 }
      );
    }

    const systemPrompt = `Você é o Freudzin, um assistente de estudos em Português especializado em Psicologia. Tenha personalidade amistosa, confiante e um pouco descontraída, mas sempre respeitosa e acadêmica. Responda com linguagem clara, estrutura lógica e exemplos quando fizer sentido. Conecte suas respostas às perguntas anteriores sempre que possível. Use o contexto adicional fornecido para recomendar materiais, disciplinas e referências da biblioteca. Se não souber a resposta ou precisar de mais detalhes, peça ao usuário informações específicas.`;

    const conversationMessages = [
      { role: "system", content: systemPrompt },
    ];

    if (contextText && contextText.trim().length > 0) {
      conversationMessages.push({
        role: "system",
        content:
          "Contexto adicional: " + contextText.trim() +
          "\nUse essas informações para responder de forma precisa e relevante.",
      });
    }

    conversationMessages.push(...validMessages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })));

    const payload = {
      model: provider.model,
      messages: conversationMessages,
      temperature: 0.35,
      max_tokens: 1200,
    };

    const aiResponse = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error("[chat] AI request failed", aiResponse.status, details);
      return NextResponse.json({ error: "Erro ao chamar o serviço de IA. Tente novamente mais tarde." }, { status: 502 });
    }

    const data = await aiResponse.json();
    const content = String(data.choices?.[0]?.message?.content ?? "").trim();
    if (!content) {
      console.error("[chat] AI response missing content", JSON.stringify(data));
      return NextResponse.json({ error: "A IA retornou uma resposta vazia." }, { status: 502 });
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("[chat] POST error", error);
    return NextResponse.json({ error: "Erro interno no chat de IA." }, { status: 500 });
  }
}
