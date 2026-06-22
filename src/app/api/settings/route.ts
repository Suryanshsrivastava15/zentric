import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return NextResponse.json({ settings, user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      theme: body.theme ?? "dark",
      openaiApiKey: body.openaiApiKey ?? null,
      displayName: body.displayName ?? null,
      bio: body.bio ?? null,
      leetcodeUsername: body.leetcodeUsername ?? null,
    },
    update: {
      theme: body.theme ?? undefined,
      openaiApiKey: body.openaiApiKey !== undefined ? body.openaiApiKey : undefined,
      displayName: body.displayName !== undefined ? body.displayName : undefined,
      bio: body.bio !== undefined ? body.bio : undefined,
      leetcodeUsername: body.leetcodeUsername !== undefined ? body.leetcodeUsername : undefined,
    },
  });

  if (body.name !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name },
    });
  }

  return NextResponse.json(settings);
}
