import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, unauthorized, badRequest } from "@/lib/api-error";
import { sanitizeString } from "@/lib/utils";
import { recordCoachEvent } from "@/lib/ai-coach";

const noteCategories = new Set([
  "second_brain",
  "learning",
  "interview",
  "project",
  "research",
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const search = sanitizeString(searchParams.get("q") || "");
    const requestedCategory = sanitizeString(searchParams.get("category") || "");
    const category = noteCategories.has(requestedCategory) ? requestedCategory : "";

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
                { tags: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100, // Limit to prevent excessive data
    });

    return NextResponse.json(notes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const body = await req.json();
    const { title, content, tags } = body;
    const category =
      typeof body.category === "string" && noteCategories.has(body.category)
        ? body.category
        : "second_brain";

    if (!title || typeof title !== "string") {
      throw badRequest("Title is required and must be a string");
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      throw badRequest("Title cannot be empty");
    }

    if (trimmedTitle.length > 255) {
      throw badRequest("Title cannot exceed 255 characters");
    }

    const trimmedContent = content && typeof content === "string" ? content.trim() : "";

    const note = await prisma.note.create({
      data: {
        title: trimmedTitle,
        content: trimmedContent,
        tags: tags && typeof tags === "string" ? tags.trim() : null,
        category,
        userId: session.user.id,
      },
    });

    await recordCoachEvent(session.user.id, {
      type: "note_created",
      module: "Second Brain",
      title: `Created ${category.replace("_", " ")} note: ${note.title}`,
      detail: "Second Brain knowledge added for AI Coach memory.",
      impact: category === "project" || category === "interview" ? 3 : 2,
      metadata: { noteId: note.id, category },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
