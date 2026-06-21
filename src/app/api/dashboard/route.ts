import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [tasks, notes, studyTopics, goals] = await Promise.all([
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.studyTopic.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTopics = studyTopics.filter((t) => t.status === "completed").length;

  const productivityScore = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysTasks = tasks.filter((t) => {
    const taskDate = new Date(t.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const upcomingDeadlines = tasks
    .filter((t) => !t.completed && t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  return NextResponse.json({
    stats: {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      totalNotes: notes.length,
      totalStudyTopics: studyTopics.length,
      completedStudyTopics: completedTopics,
      totalGoals: goals.length,
      productivityScore,
    },
    todaysTasks: todaysTasks.slice(0, 5),
    upcomingDeadlines,
    recentNotes: notes.slice(0, 3),
    goals: goals.slice(0, 3),
  });
}
