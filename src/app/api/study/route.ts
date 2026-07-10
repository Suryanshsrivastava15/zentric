import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordCoachEvent } from "@/lib/ai-coach";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topics = await prisma.studyTopic.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(topics);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, difficulty, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const topic = await prisma.studyTopic.create({
    data: {
      name: name.trim(),
      category: category || "DSA",
      difficulty: difficulty || "medium",
      notes: notes || null,
      userId: session.user.id,
    },
  });

  await recordCoachEvent(session.user.id, {
    type: "study_topic_created",
    module: "Study Tracker",
    title: `Started topic: ${topic.name}`,
    detail: `${topic.category} topic added with ${topic.difficulty} difficulty.`,
    impact: 2,
    metadata: { topicId: topic.id, category: topic.category, difficulty: topic.difficulty },
  });

  return NextResponse.json(topic, { status: 201 });
}
