import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, unauthorized, badRequest } from "@/lib/api-error";
import { recordCoachEvent } from "@/lib/ai-coach";
import { analyzeCareerProfile } from "@/lib/career-engine";
import {
  generateInterviewQuestions,
  type InterviewAnswer,
  type InterviewDifficulty,
  type InterviewModeId,
  type InterviewQuestion,
  type InterviewReport,
} from "@/lib/interview-engine";

type StoredCareerProfile = {
  dreamRole: string;
  targetCompany: string;
  resumeText: string | null;
  skillsText: string | null;
  projectsText: string | null;
  experienceText: string | null;
  educationText: string | null;
  preferredKeywords: string | null;
  jobDescriptionText: string | null;
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
    findMany(args: unknown): Promise<StoredInterviewSession[]>;
    create(args: unknown): Promise<StoredInterviewSession>;
  };
};

const allowedModes = new Set([
  "dsa",
  "hr",
  "resume",
  "mixed",
  "system-design",
  "frontend",
  "backend",
  "fullstack",
  "ai-ml",
  "data",
  "devops",
  "product",
  "security",
  "custom",
]);
const allowedDifficulties = new Set(["Beginner", "Intermediate", "Advanced", "Real Interview"]);

function safeMode(value: unknown): InterviewModeId {
  const mode = typeof value === "string" ? value : "custom";
  return allowedModes.has(mode) ? (mode as InterviewModeId) : "custom";
}

function safeDifficulty(value: unknown): InterviewDifficulty {
  const difficulty = typeof value === "string" ? value : "Intermediate";
  return allowedDifficulties.has(difficulty) ? (difficulty as InterviewDifficulty) : "Intermediate";
}

function serializeSession(session: StoredInterviewSession) {
  return {
    ...session,
    questions: session.questions as InterviewQuestion[],
    answers: (session.answers ?? []) as InterviewAnswer[],
    report: session.report as InterviewReport | null,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw unauthorized();
    }

    const interviews = await careerInterviewDb.interviewSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
    });

    return NextResponse.json(interviews.map(serializeSession));
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
    const mode = safeMode(body.mode);
    const difficulty = safeDifficulty(body.difficulty);
    const role = String(body.role || "").trim().slice(0, 120);
    const company = String(body.company || "Your Target Company").trim().slice(0, 100) || "Your Target Company";

    if (!role || role === "your target role") {
      throw badRequest("Enter a target role before launching the interview.");
    }

    const profile = await careerInterviewDb.careerProfile.findUnique({
      where: { userId: session.user.id },
    });
    const analysis = analyzeCareerProfile(profile);
    const questions = generateInterviewQuestions({
      mode,
      role,
      difficulty,
      company,
      resumeUploaded: Boolean(profile?.resumeText?.trim()),
      resumeQuestions: analysis.generatedInterviewQuestions,
    });

    const interview = await careerInterviewDb.interviewSession.create({
      data: {
        userId: session.user.id,
        role,
        company,
        mode,
        difficulty,
        status: "active",
        questions,
        answers: [],
      },
    });

    await recordCoachEvent(session.user.id, {
      type: "interview_simulation_started",
      module: "Career Hub",
      title: `Started ${difficulty} ${mode === "custom" ? "Custom Interview" : mode} interview`,
      detail: `Role: ${role}. Company: ${company}. ${questions.length} questions generated.`,
      impact: 2,
      metadata: {
        interviewId: interview.id,
        mode,
        role,
        difficulty,
        company,
      },
    });

    return NextResponse.json(serializeSession(interview), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
