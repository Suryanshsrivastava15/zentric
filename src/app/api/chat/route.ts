import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: message.trim(),
    },
  });

  // Update conversation title from first message
  if (conversation.messages.length === 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: message.trim().slice(0, 60) },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, return a helpful fallback response
  if (!apiKey || apiKey === "your-openai-api-key-here") {
    const fallback = `I'm Zentric AI Assistant! To enable real AI responses, please add your OpenAI API key in Settings → API Configuration.

In the meantime, here's what I can help you with once connected:
- **Task Planning**: Break down complex goals into actionable tasks
- **Study Guidance**: DSA concepts, LeetCode strategies, interview prep
- **Code Review**: Analyze and improve your code
- **Career Advice**: Resume tips, job search strategies
- **Research**: Find and summarize information on any topic

Your message: *"${message}"*

👉 Add your OpenAI API key to unlock full AI capabilities!`;

    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: fallback,
      },
    });

    return new Response(
      JSON.stringify({ content: fallback }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Build message history for context
    const history = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    history.push({ role: "user", content: message.trim() });

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Zentric AI, a helpful assistant integrated into the Zentric AI Growth Operating System. 
You help students, developers, and professionals with:
- Task planning and productivity
- DSA problems and coding practice
- Study strategies and learning paths
- Career development and interview preparation
- Research and information gathering
- Code review and debugging

Be concise, practical, and encouraging. Format responses with markdown when helpful.`,
          },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    // Stream the response
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.replace("data: ", "").trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } finally {
          reader.releaseLock();
          // Save assistant message
          await prisma.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: fullContent,
            },
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
  } catch (error) {
    const errorMsg = `Sorry, I encountered an error connecting to the AI service. Please check your API key in Settings and try again.`;
    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: errorMsg,
      },
    });
    return new Response(JSON.stringify({ content: errorMsg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
