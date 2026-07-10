import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordCoachEvent } from "@/lib/ai-coach";

const noteCategories = new Set([
  "second_brain",
  "learning",
  "interview",
  "project",
  "research",
]);

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

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title: body.title ?? note.title,
      content: body.content !== undefined ? body.content : note.content,
      tags: body.tags !== undefined ? body.tags : note.tags,
      category:
        typeof body.category === "string" && noteCategories.has(body.category)
          ? body.category
          : note.category,
    },
  });

  await recordCoachEvent(session.user.id, {
    type: "note_updated",
    module: "Second Brain",
    title: `Updated note: ${updated.title}`,
    detail: `${updated.category.replace("_", " ")} note refreshed for coach memory.`,
    impact: 1,
    metadata: { noteId: updated.id, category: updated.category },
  });

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

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
