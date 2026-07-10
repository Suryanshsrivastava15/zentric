import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, unauthorized, badRequest } from "@/lib/api-error";
import { recordCoachEvent } from "@/lib/ai-coach";
import {
  buildInterviewReport,
  evaluateInterviewAnswer,
  type InterviewAnswer,
  type InterviewQuestion,
  type InterviewReport,
} from "@/lib/interview-engine";

type StoredCareerProfile = {
  resumeText: string | null;
};

type StoredInterviewSession = {
  id: string;
  role: string;
  company: string;
  mode: string;
  difficulty: string;
  status: string;
  questions: unknown;
  answers: unknown;
  report: unknown;
  averageScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

const careerInterviewDb = prisma as typeof prisma & {
  careerProfile: {
    findUnique(args: unknown): Promise<StoredCareerProfile | null>;
  };
  interviewSession: {
    findFirst(args: unknown): Promise<StoredInterviewSession | null>;
    update(args: unknown): Promise<StoredInterviewSession>;
  };
};

function serializeSession(session: StoredInterviewSession) {
  return {
    ...session,
    questions: session.questions as InterviewQuestion[],
    answers: (session.answers ?? []) as InterviewAnswer[],
    report: session.report as InterviewReport | null,
  };
}

function averageScore(answers: InterviewAnswer[]) {
  return answers.length ? Math.round(answers.reduce((sum, item) => sum + item.score, 0) / answers.length) : null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const { id } = await context.params;
    const body = await req.json();
    const interview = await careerInterviewDb.interviewSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!interview) {
      throw badRequest("Interview session not found.");
    }

    const questions = interview.questions as InterviewQuestion[];
    const answers = (interview.answers ?? []) as InterviewAnswer[];

    if (body.action === "answer") {
      const questionIndex = Number(body.questionIndex);
      const question = questions[questionIndex];
      const answer = String(body.answer || "").trim().slice(0, 8_000);

      if (!Number.isInteger(questionIndex) || questionIndex < 0 || !question) {
        throw badRequest("Invalid interview question.");
      }

      if (answer.length < 8) {
        throw badRequest("Write an answer before scoring.");
      }

      const evaluation = evaluateInterviewAnswer({
        answer,
        question,
        role: interview.role,
        company: interview.company,
      });
      const nextAnswer: InterviewAnswer = {
        questionIndex,
        mode: question.mode,
        question: question.question,
        answer,
        ...evaluation,
        idealPoints: question.idealPoints,
        skillArea: question.skillArea,
        createdAt: new Date().toISOString(),
      };
      const nextAnswers = [...answers.filter((item) => item.questionIndex !== questionIndex), nextAnswer].sort(
        (a, b) => a.questionIndex - b.questionIndex,
      );

      const updated = await careerInterviewDb.interviewSession.update({
        where: { id: interview.id },
        data: {
          answers: nextAnswers,
          averageScore: averageScore(nextAnswers),
        },
      });

      await recordCoachEvent(session.user.id, {
        type: "interview_answer_scored",
        module: "Career Hub",
        title: `Interview answer scored: ${evaluation.score}%`,
        detail: evaluation.feedback,
        impact: evaluation.score >= 75 ? 3 : 2,
        metadata: {
          interviewId: interview.id,
          mode: interview.mode,
          role: interview.role,
          difficulty: interview.difficulty,
          question: question.question,
          skillArea: question.skillArea,
          score: evaluation.score,
          technicalDepth: evaluation.technicalDepth,
          clarity: evaluation.clarity,
          structure: evaluation.structure,
          roleFit: evaluation.roleFit,
          confidence: evaluation.confidence,
          resumeProof: evaluation.resumeProof,
          followUpQuestion: evaluation.followUpQuestion,
        },
      });

      return NextResponse.json(serializeSession(updated));
    }

    if (body.action === "finish") {
      const profile = await careerInterviewDb.careerProfile.findUnique({
        where: { userId: session.user.id },
      });
      const report = buildInterviewReport(answers, Boolean(profile?.resumeText?.trim()));
      const updated = await careerInterviewDb.interviewSession.update({
        where: { id: interview.id },
        data: {
          status: "completed",
          report,
          averageScore: report.overall,
        },
      });

      await recordCoachEvent(session.user.id, {
        type: "interview_simulation_completed",
        module: "Career Hub",
        title: `Completed ${interview.role} mock interview: ${report.overall}%`,
        detail: `Weak areas: ${report.plannerTopics.slice(0, 3).join(", ")}.`,
        impact: 4,
        metadata: {
          interviewId: interview.id,
          mode: interview.mode,
          role: interview.role,
          difficulty: interview.difficulty,
          report,
        },
      });

      return NextResponse.json(serializeSession(updated));
    }

    throw badRequest("Unsupported interview action.");
  } catch (error) {
    return handleApiError(error);
  }
}
