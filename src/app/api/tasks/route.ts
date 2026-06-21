import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, unauthorized, badRequest } from "@/lib/api-error";
import { isValidPriority } from "@/lib/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const where: { userId: string; completed?: boolean } = { userId: session.user.id };
    if (filter === "active") where.completed = false;
    if (filter === "completed") where.completed = true;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
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
    const { title, description, priority, deadline } = body;

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

    if (priority && !isValidPriority(priority)) {
      throw badRequest('Priority must be "low", "medium", or "high"');
    }

    if (deadline && isNaN(Date.parse(deadline))) {
      throw badRequest("Invalid deadline date format");
    }

    const task = await prisma.task.create({
      data: {
        title: trimmedTitle,
        description: description && typeof description === "string" ? description.trim() : null,
        priority: priority || "medium",
        deadline: deadline ? new Date(deadline) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
