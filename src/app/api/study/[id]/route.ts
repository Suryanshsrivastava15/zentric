import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordCoachEvent } from "@/lib/ai-coach";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const topic = await prisma.studyTopic.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const updated = await prisma.studyTopic.update({
    where: { id },
    data: {
      name: body.name ?? topic.name,
      category: body.category ?? topic.category,
      status: body.status ?? topic.status,
      difficulty: body.difficulty ?? topic.difficulty,
      notes: body.notes !== undefined ? body.notes : topic.notes,
    },
  });

  if (topic.status !== "completed" && updated.status === "completed") {
    await recordCoachEvent(session.user.id, {
      type: "study_topic_completed",
      module: "Study Tracker",
      title: `Completed topic: ${updated.name}`,
      detail: "Topic mastery updated and available to AI Coach.",
      impact: 4,
      metadata: { topicId: updated.id, category: updated.category },
    });
  } else if (topic.status !== updated.status) {
    await recordCoachEvent(session.user.id, {
      type: "study_topic_updated",
      module: "Study Tracker",
      title: `Updated topic: ${updated.name}`,
      detail: `Status changed to ${updated.status.replace("_", " ")}.`,
      impact: 2,
      metadata: { topicId: updated.id, status: updated.status },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const topic = await prisma.studyTopic.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  await prisma.studyTopic.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
