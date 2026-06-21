import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, unauthorized, badRequest } from "@/lib/api-error";
import { sanitizeString } from "@/lib/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const search = sanitizeString(searchParams.get("q") || "");

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
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
        userId: session.user.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
