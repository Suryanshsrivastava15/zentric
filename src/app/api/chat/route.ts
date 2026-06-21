import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are Zentric AI, a helpful assistant integrated into the Zentric AI Growth Operating System.
You help students, developers, and professionals with:
- Task planning and productivity
- DSA problems and coding practice
- Study strategies and learning paths
- Career development and interview preparation
- Research and information gathering
- Code review and debugging

Be concise, practical, and encouraging. Format responses with markdown when helpful.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { conversationId, message } = body;

  if (!conversationId || !message?.trim()) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
  }

  await prisma.message.create({
    data: { conversationId, role: "user", content: message.trim() },
  });

  if (conversation.messages.length === 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: message.trim().slice(0, 60) },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const fallback = `I am Zentric AI! AI responses require a Groq API key to be configured.\n\nYour message: "${message}"`;
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: fallback },
    });
    return new Response(JSON.stringify({ content: fallback }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const groq = new Groq({ apiKey });

    const history = conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const groqStream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          await prisma.message.create({
            data: { conversationId, role: "assistant", content: fullContent },
          });
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    const errorMsg = "Sorry, I encountered an error connecting to the AI. Please try again.";
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: errorMsg },
    });
    return new Response(JSON.stringify({ content: errorMsg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
