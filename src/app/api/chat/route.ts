import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAICoachSnapshot, recordCoachEvent } from "@/lib/ai-coach";
import Groq from "groq-sdk";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are Ask Zentric, a general-purpose AI chatbot inside Zentric.
You help students, developers, and professionals with:
- Task planning and productivity
- DSA problems and coding practice
- Study strategies and learning paths
- Career development and interview preparation
- Research and information gathering
- Code review and debugging

Behave like an independent chatbot. Do not mention the user's Zentric goal, roadmap, planner, AI Coach, or progress unless the user directly provides that information in the chat or explicit Zentric context is included in the system prompt.

Be concise, practical, and encouraging. Format responses with markdown when helpful.`;

type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function* createAIResponse(messages: AIMessage[]) {
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content ?? "";
    }
    return;
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content ?? "";
    }
    return;
  }

  throw new Error("AI_PROVIDER_NOT_CONFIGURED");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { conversationId, message, useZentricContext } = body;

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

  try {
    const history = conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let zentricContext = "";

    if (useZentricContext === true) {
      const coach = await buildAICoachSnapshot(session.user.id);
      const dailyRoadmap = coach.dailyPlan.map((item) => `${item.title} (${item.duration}, ${item.priority})`);
      zentricContext = `\n\nOptional Zentric context enabled by the user for this message:
- User: ${coach.user.name}
- Career goal: ${coach.memory.careerGoal} at ${coach.memory.dreamCompany}
- Growth score: ${coach.metrics.growthScore}%
- Strongest area: ${coach.metrics.strongestArea.label} (${coach.metrics.strongestArea.value}%)
- Weakest area: ${coach.metrics.weakestArea.label} (${coach.metrics.weakestArea.value}%)
- Today's roadmap plan: ${dailyRoadmap.length ? dailyRoadmap.join("; ") : "No daily roadmap topics yet"}
- Planner logic: deadline, weak topics, visited roadmap topics, and progress decide today's routine.

Use this context only when it improves the answer. If the user's question is general, answer normally and do not force the goal into the response.`;

      await recordCoachEvent(session.user.id, {
        type: "ask_zentric_context_message",
        module: "Ask Zentric",
        title: "Asked Zentric with Coach context",
        detail: message.trim().slice(0, 160),
        impact: 1,
      });
    }

    const aiStream = createAIResponse([
        { role: "system", content: `${conversation.systemPrompt ?? SYSTEM_PROMPT}${zentricContext}` },
        ...history,
        { role: "user", content: message.trim() },
    ]);

    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of aiStream) {
            if (text) {
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          if (fullContent) {
            await prisma.message.create({
              data: { conversationId, role: "assistant", content: fullContent },
            });
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }
        } catch (streamError) {
          console.error("AI stream error:", streamError);
          controller.enqueue(
            encoder.encode(
              fullContent ||
                "The AI provider is unavailable right now. Check the configured API key and try again.",
            ),
          );
        } finally {
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
  } catch (error) {
    console.error("AI request error:", error);
    const errorMsg =
      error instanceof Error && error.message === "AI_PROVIDER_NOT_CONFIGURED"
        ? "No AI provider is configured. Add GROQ_API_KEY or OPENAI_API_KEY to enable agent responses."
        : "Sorry, I encountered an error connecting to the AI. Please try again.";
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: errorMsg },
    });
    return new Response(JSON.stringify({ content: errorMsg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
