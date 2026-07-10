import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildAICoachSnapshot,
  recordCoachEvent,
  recordRecommendationFeedback,
  switchCoachGoal,
  updateCoachMemory,
} from "@/lib/ai-coach";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await buildAICoachSnapshot(session.user.id);
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action = String(body.action || "");

  if (action === "record_event") {
    await recordCoachEvent(session.user.id, {
      type: String(body.type || "manual_event"),
      module: String(body.module || "AI Coach"),
      title: String(body.title || "Coach activity"),
      detail: body.detail ? String(body.detail) : undefined,
      impact: Number.isFinite(Number(body.impact)) ? Number(body.impact) : 1,
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : undefined,
    });

    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  if (action === "update_memory") {
    const dailyStudyMinutes = Number(body.dailyStudyMinutes);
    const targetDeadline = body.targetDeadline ? new Date(String(body.targetDeadline)) : null;

    await updateCoachMemory(session.user.id, {
      careerGoal: body.careerGoal ? String(body.careerGoal) : undefined,
      dreamCompany: body.dreamCompany ? String(body.dreamCompany) : undefined,
      educationStage: body.educationStage ? String(body.educationStage) : undefined,
      schoolClass: body.schoolClass ? String(body.schoolClass) : undefined,
      engineeringYear: body.engineeringYear ? String(body.engineeringYear) : undefined,
      graduationStatus: body.graduationStatus ? String(body.graduationStatus) : undefined,
      skillLevel: body.skillLevel ? String(body.skillLevel) : undefined,
      preferredLanguage: body.preferredLanguage ? String(body.preferredLanguage) : undefined,
      dailyStudyMinutes: Number.isFinite(dailyStudyMinutes) ? dailyStudyMinutes : null,
      targetDeadline: targetDeadline && !Number.isNaN(targetDeadline.getTime()) ? targetDeadline : null,
      strongTopics: body.strongTopics ? String(body.strongTopics) : undefined,
      weakTopics: body.weakTopics ? String(body.weakTopics) : undefined,
    });

    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  if (action === "switch_goal") {
    await switchCoachGoal(session.user.id, String(body.goalKey || ""));
    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  if (action === "visit_roadmap_topic") {
    const topicTitle = String(body.topicTitle || "Roadmap topic");
    const topicId = String(body.topicId || topicTitle.toLowerCase().replace(/\s+/g, "-"));
    await recordCoachEvent(session.user.id, {
      type: "roadmap_topic_visited",
      module: "AI Coach Roadmap",
      title: `Visited topic: ${topicTitle}`,
      detail: body.reflection
        ? String(body.reflection).slice(0, 500)
        : body.phase
          ? `Opened ${topicTitle} from ${String(body.phase)} daily roadmap.`
          : "Opened a roadmap topic from Planner.",
      impact: 2,
      metadata: {
        topicId,
        topicTitle,
        phase: body.phase ? String(body.phase) : undefined,
        day: body.day ? Number(body.day) : undefined,
        reflection: body.reflection ? String(body.reflection).slice(0, 1000) : undefined,
      },
    });

    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  if (action === "complete_learning_step") {
    const topicTitle = String(body.topicTitle || "Roadmap topic");
    const topicId = String(body.topicId || topicTitle.toLowerCase().replace(/\s+/g, "-"));
    const stepId = String(body.stepId || "learning-step");
    const stepTitle = String(body.stepTitle || "Learning step");
    const score = Number(body.score);
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
    const evidence = body.evidence ? String(body.evidence).slice(0, 1200) : undefined;
    const answers = Array.isArray(body.answers)
      ? body.answers.map((answer: unknown) => String(answer).slice(0, 500)).slice(0, 12)
      : undefined;
    const quality = body.quality ? String(body.quality).slice(0, 80) : undefined;
    const impact =
      safeScore !== null
        ? Math.max(1, Math.round(safeScore / 25))
        : ["quiz", "practice", "project", "reflection"].includes(stepId)
          ? 2
          : 1;

    await recordCoachEvent(session.user.id, {
      type: "learning_step_completed",
      module: "Learning Mode",
      title: `Completed ${stepTitle}: ${topicTitle}`,
      detail: safeScore !== null
        ? `Finished ${stepTitle} for ${topicTitle} with ${safeScore}% quality score.`
        : evidence
          ? `Finished ${stepTitle} for ${topicTitle} with submitted evidence.`
          : `Finished ${stepTitle} for ${topicTitle}.`,
      impact,
      metadata: {
        topicId,
        topicTitle,
        stepId,
        stepTitle,
        day: body.day ? Number(body.day) : undefined,
        score: safeScore,
        quality,
        evidence,
        answers,
        checkedAt: new Date().toISOString(),
      },
    });

    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  if (action === "recommendation_feedback") {
    await recordRecommendationFeedback(session.user.id, {
      recommendationTitle: String(body.recommendationTitle || "Untitled recommendation"),
      module: String(body.module || "AI Coach"),
      rating: String(body.rating || "helpful"),
      reason: body.reason ? String(body.reason) : undefined,
    });

    const snapshot = await buildAICoachSnapshot(session.user.id);
    return NextResponse.json(snapshot);
  }

  return NextResponse.json({ error: "Unknown coach action." }, { status: 400 });
}
