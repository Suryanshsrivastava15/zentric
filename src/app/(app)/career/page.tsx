"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  AlertCircle,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Mic,
  SearchCheck,
  Target,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CareerProfile = {
  dreamRole: string;
  targetCompany: string;
  resumeText: string;
  skillsText: string;
  projectsText: string;
  experienceText: string;
  educationText: string;
  preferredKeywords: string;
  jobDescriptionText: string;
};

type Analysis = {
  isAnalyzed: boolean;
  dreamRole: string;
  targetCompany: string;
  resumeScore: number | null;
  atsScore: number | null;
  resumeMatch: number | null;
  careerReadinessScore: number | null;
  jobDescriptionMatch: number | null;
  strongSections: string[];
  needsImprovement: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  missingFromJobDescription: string[];
  suggestions: string[];
  suggestedBullet: string;
  scoreBreakdown: Array<{ label: string; value: number; detail: string }>;
  recommendedLearningPath: Array<{ topic: string; action: string }>;
  interviewPrep: string[];
  generatedInterviewQuestions: string[];
  companies: Array<{
    company: string;
    readiness: number | null;
    weakestSkills: string[];
    estimatedPrepTime: string;
    missingTopics: string[];
  }>;
};

const emptyProfile: CareerProfile = {
  dreamRole: "Your Dream Role",
  targetCompany: "Your Target Company",
  resumeText: "",
  skillsText: "",
  projectsText: "",
  experienceText: "",
  educationText: "",
  preferredKeywords: "System Design, Docker, REST API, Graph Algorithms",
  jobDescriptionText: "",
};

const tabs = [
  { id: "resume", label: "Resume", icon: FileText },
  { id: "interview", label: "Interview Prep", icon: Mic },
  { id: "companies", label: "Company Readiness", icon: Building2 },
] as const;

const companyOptions = ["Google", "Amazon", "Microsoft", "Atlassian", "Adobe", "Uber"];

const interviewModes = [
  {
    id: "dsa",
    label: "DSA",
    description: "Algorithms, data structures, complexity, and problem-solving narration.",
  },
  {
    id: "hr",
    label: "HR",
    description: "Behavioral signals, motivation, ownership, teamwork, and clarity.",
  },
  {
    id: "resume",
    label: "Resume-based",
    description: "Questions grounded in projects, internships, skills, and career story.",
  },
  {
    id: "mixed",
    label: "Mixed",
    description: "A realistic blend of technical, resume, and behavioral questions.",
  },
  {
    id: "system-design",
    label: "System Design",
    description: "APIs, databases, scaling, tradeoffs, caching, and reliability.",
  },
  {
    id: "frontend",
    label: "Frontend",
    description: "React, TypeScript, UI architecture, accessibility, and performance.",
  },
  {
    id: "backend",
    label: "Backend",
    description: "APIs, databases, auth, queues, security, and backend reliability.",
  },
  {
    id: "fullstack",
    label: "Full Stack",
    description: "End-to-end product features from UI to database and deployment.",
  },
  {
    id: "ai-ml",
    label: "AI/ML",
    description: "Model evaluation, AI systems, personalization, and data pipelines.",
  },
  {
    id: "data",
    label: "Data",
    description: "SQL, analytics, metrics, dashboards, data cleaning, and insights.",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "CI/CD, cloud, monitoring, reliability, secrets, and deployments.",
  },
  {
    id: "product",
    label: "Product",
    description: "Product sense, prioritization, metrics, research, and UX clarity.",
  },
  {
    id: "security",
    label: "Cybersecurity",
    description: "Threat modeling, privacy, access control, incidents, and secure design.",
  },
] as const;

const targetRoles = [
  "Software Engineer",
  "SDE Intern",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Developer",
  "Mobile App Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Machine Learning Intern",
  "Product Intern",
  "Product Manager",
  "UI/UX Designer",
  "QA Engineer",
  "Business Analyst",
  "Custom Role",
];

const interviewDifficulties = ["Beginner", "Intermediate", "Advanced", "Real Interview"] as const;

type InterviewQuestion = {
  id?: string;
  mode: string;
  question: string;
  idealPoints: string[];
  skillArea?: string;
};

type InterviewHistoryItem = {
  questionIndex?: number;
  mode: string;
  question: string;
  answer: string;
  score: number;
  technicalDepth?: number;
  clarity?: number;
  structure?: number;
  roleFit?: number;
  confidence?: number;
  resumeProof?: number;
  feedback: string;
  idealAnswer?: string;
  improvedAnswer?: string;
  followUpQuestion?: string;
  idealPoints: string[];
  skillArea?: string;
  createdAt?: string;
};

type SavedInterviewSession = {
  id: string;
  role: string;
  company: string;
  mode: string;
  difficulty: string;
  status: string;
  questions: InterviewQuestion[];
  answers: InterviewHistoryItem[];
  report: ReturnType<typeof buildInterviewReport> | null;
  averageScore: number | null;
  createdAt: string;
  updatedAt: string;
};

function getTomorrowDateISO() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getDateOffsetISO(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function buildInterviewReport(history: InterviewHistoryItem[], resumeUploaded: boolean) {
  const average = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
    : 0;
  const averageBy = (
    items: InterviewHistoryItem[],
    key: "technicalDepth" | "clarity" | "structure" | "roleFit" | "confidence" | "resumeProof",
  ) => items.length ? Math.round(items.reduce((sum, item) => sum + (item[key] ?? item.score), 0) / items.length) : 0;
  const technicalAnswers = history.filter((item) =>
    [
      "DSA",
      "System Design",
      "Frontend",
      "Backend",
      "Full Stack",
      "AI/ML",
      "Data",
      "DevOps",
      "Cybersecurity",
      "Custom Interview",
    ].includes(item.mode),
  );
  const resumeAnswers = history.filter((item) => item.mode === "Resume-based");
  const weakAnswers = history.filter((item) => item.score < 70);
  const strongAnswers = history.filter((item) => item.score >= 80);
  const missingSignals = Array.from(new Set(weakAnswers.flatMap((item) => item.idealPoints))).slice(0, 6);

  return {
    overall: average,
    technical: technicalAnswers.length
      ? averageBy(technicalAnswers, "technicalDepth")
      : averageBy(history, "technicalDepth"),
    communication: Math.round((averageBy(history, "clarity") + averageBy(history, "structure") + averageBy(history, "confidence")) / 3),
    resumeAlignment: resumeUploaded
      ? resumeAnswers.length
        ? averageBy(resumeAnswers, "resumeProof")
        : averageBy(history, "resumeProof")
      : 35,
    structure: averageBy(history, "structure"),
    confidence: averageBy(history, "confidence"),
    strongAnswers,
    weakAnswers,
    missingSignals,
    plannerTopics: missingSignals.length ? missingSignals : ["Practice structured interview answers", "Add examples and measurable impact"],
  };
}

function buildInterviewNoteContent({
  history,
  report,
  role,
  company,
  mode,
  difficulty,
}: {
  history: InterviewHistoryItem[];
  report: ReturnType<typeof buildInterviewReport>;
  role: string;
  company: string;
  mode: string;
  difficulty: string;
}) {
  return [
    `Interview Simulation Report`,
    ``,
    `Role: ${role}`,
    `Company: ${company}`,
    `Mode: ${mode}`,
    `Difficulty: ${difficulty}`,
    `Overall Score: ${report.overall}/100`,
    `Technical Score: ${report.technical}/100`,
    `Communication Score: ${report.communication}/100`,
    `Resume Alignment: ${report.resumeAlignment}/100`,
    ``,
    `Weak areas to revise:`,
    ...report.plannerTopics.map((item) => `- ${item}`),
    ``,
    `Answers:`,
    ...history.flatMap((item, index) => [
      `${index + 1}. ${item.question}`,
      `Score: ${item.score}/100`,
      `Technical Depth: ${item.technicalDepth ?? item.score}/100`,
      `Clarity: ${item.clarity ?? item.score}/100`,
      `Structure: ${item.structure ?? item.score}/100`,
      `Role Fit: ${item.roleFit ?? item.score}/100`,
      `Confidence: ${item.confidence ?? item.score}/100`,
      `Resume Proof: ${item.resumeProof ?? item.score}/100`,
      `Feedback: ${item.feedback}`,
      `Ideal Answer: ${item.idealAnswer ?? "Use the ideal answer signals."}`,
      `Improved Version: ${item.improvedAnswer ?? "Rewrite with structure, proof, and impact."}`,
      `Follow-up Question: ${item.followUpQuestion ?? "What tradeoff would you mention if pushed harder?"}`,
      `Answer: ${item.answer}`,
      ``,
    ]),
  ].join("\n");
}

export default function CareerHubPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("resume");
  const [profile, setProfile] = useState<CareerProfile>(emptyProfile);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [customReadinessCompany, setCustomReadinessCompany] = useState("");
  const [simulationMode, setSimulationMode] = useState<(typeof interviewModes)[number]["id"]>("dsa");
  const [simulationRole, setSimulationRole] = useState("Software Engineer");
  const [customSimulationRole, setCustomSimulationRole] = useState("");
  const [simulationDifficulty, setSimulationDifficulty] = useState<(typeof interviewDifficulties)[number]>("Intermediate");
  const [simulationQuestions, setSimulationQuestions] = useState<InterviewQuestion[]>([]);
  const [currentSimulationIndex, setCurrentSimulationIndex] = useState(0);
  const [simulationAnswer, setSimulationAnswer] = useState("");
  const [simulationFeedback, setSimulationFeedback] = useState("");
  const [simulationHistory, setSimulationHistory] = useState<InterviewHistoryItem[]>([]);
  const [simulationFinished, setSimulationFinished] = useState(false);
  const [savingInterviewReport, setSavingInterviewReport] = useState(false);
  const [savingCompanyReadiness, setSavingCompanyReadiness] = useState(false);
  const [savingMissionPlan, setSavingMissionPlan] = useState(false);
  const [interviewSessionId, setInterviewSessionId] = useState("");
  const [interviewSessions, setInterviewSessions] = useState<SavedInterviewSession[]>([]);
  const [interviewActionLoading, setInterviewActionLoading] = useState(false);

  const syncMissionToInterview = useCallback((mission: CareerProfile) => {
    const role = mission.dreamRole.trim();
    if (!role || role === emptyProfile.dreamRole) return;

    if (targetRoles.includes(role)) {
      setSimulationRole(role);
      setCustomSimulationRole("");
    } else {
      setSimulationRole("Custom Role");
      setCustomSimulationRole(role);
    }

    const normalizedRole = role.toLowerCase();
    const nextMode =
      /front|react|ui|web/.test(normalizedRole)
        ? "frontend"
        : /back|api|server/.test(normalizedRole)
          ? "backend"
          : /full.?stack/.test(normalizedRole)
            ? "fullstack"
            : /ai|ml|machine|data scientist/.test(normalizedRole)
              ? "ai-ml"
              : /data|analyst|sql/.test(normalizedRole)
                ? "data"
                : /devops|cloud|sre|platform/.test(normalizedRole)
                  ? "devops"
                  : /cyber|security/.test(normalizedRole)
                    ? "security"
                    : /product|pm|manager/.test(normalizedRole)
                      ? "product"
                      : "mixed";

    setSimulationMode(nextMode as (typeof interviewModes)[number]["id"]);
  }, []);

  const fetchCareer = useCallback(async () => {
    const response = await fetch("/api/career");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load Career Hub.");

    const nextProfile = {
      ...emptyProfile,
      ...(data.profile ?? {}),
      resumeText: data.profile?.resumeText ?? "",
      skillsText: data.profile?.skillsText ?? "",
      projectsText: data.profile?.projectsText ?? "",
      experienceText: data.profile?.experienceText ?? "",
      educationText: data.profile?.educationText ?? "",
      preferredKeywords: data.profile?.preferredKeywords ?? emptyProfile.preferredKeywords,
      jobDescriptionText: data.profile?.jobDescriptionText ?? "",
    };
    setProfile(nextProfile);
    setAnalysis(data.analysis);
    syncMissionToInterview(nextProfile);
    setLoading(false);
  }, [syncMissionToInterview]);

  const fetchInterviewSessions = useCallback(async () => {
    const response = await fetch("/api/career/interviews");
    if (!response.ok) return;
    const data = await response.json();
    setInterviewSessions(data);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fetchCareer().catch(() => setLoading(false));
      fetchInterviewSessions().catch(() => undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fetchCareer, fetchInterviewSessions]);

  const isAnalyzed = Boolean(analysis?.isAnalyzed);
  const selectedCompany =
    analysis?.companies.find((company) => company.company === profile.targetCompany) ?? analysis?.companies[0] ?? null;
  const companyReadinessTopics = selectedCompany
    ? Array.from(
        new Set([
          ...selectedCompany.missingTopics,
          ...selectedCompany.weakestSkills,
          ...(analysis?.missingKeywords.slice(0, 4) ?? []),
        ]),
      ).slice(0, 6)
    : [];
  const resumeWordCount = profile.resumeText.trim().split(/\s+/).filter(Boolean).length;
  const hasResumeUpload = resumeWordCount > 0;
  const matchedKeywordCount = analysis?.matchedKeywords.length ?? 0;
  const missingKeywordCount = analysis?.missingKeywords.length ?? 0;
  const missionPlanTopics = Array.from(
    new Set([
      ...companyReadinessTopics,
      ...(analysis?.missingKeywords.slice(0, 5) ?? []),
      ...(analysis?.needsImprovement.slice(0, 3) ?? []),
      ...(analysis?.recommendedLearningPath.map((item) => item.topic).slice(0, 4) ?? []),
    ]),
  ).filter(Boolean).slice(0, 6);
  const activeSimulationQuestion = simulationQuestions[currentSimulationIndex] ?? null;
  const activeScoredAnswer = simulationHistory.find((item) => item.questionIndex === currentSimulationIndex) ?? null;
  const simulationAverage = simulationHistory.length
    ? Math.round(simulationHistory.reduce((sum, item) => sum + item.score, 0) / simulationHistory.length)
    : 0;
  const resolvedSimulationRole = simulationRole === "Custom Role" ? customSimulationRole || "your target role" : simulationRole;
  const isCustomSimulationRole = simulationRole === "Custom Role";
  const effectiveSimulationMode = isCustomSimulationRole ? "custom" : simulationMode;
  const effectiveSimulationModeLabel = isCustomSimulationRole
    ? "Custom Interview"
    : interviewModes.find((mode) => mode.id === simulationMode)?.label ?? "Interview";
  const interviewReport = simulationHistory.length ? buildInterviewReport(simulationHistory, hasResumeUpload) : null;

  const rememberInterviewSession = (session: SavedInterviewSession) => {
    setInterviewSessions((current) => [session, ...current.filter((item) => item.id !== session.id)].slice(0, 12));
  };

  const openSavedInterviewSession = (session: SavedInterviewSession) => {
    setInterviewSessionId(session.id);
    setSimulationRole(targetRoles.includes(session.role) ? session.role : "Custom Role");
    setCustomSimulationRole(targetRoles.includes(session.role) ? customSimulationRole : session.role);
    if (interviewModes.some((mode) => mode.id === session.mode)) {
      setSimulationMode(session.mode as (typeof interviewModes)[number]["id"]);
    }
    setSimulationDifficulty(
      interviewDifficulties.includes(session.difficulty as (typeof interviewDifficulties)[number])
        ? (session.difficulty as (typeof interviewDifficulties)[number])
        : "Intermediate",
    );
    setSimulationQuestions(session.questions ?? []);
    setSimulationHistory(session.answers ?? []);
    setCurrentSimulationIndex(Math.min(session.answers?.length ?? 0, Math.max(0, (session.questions?.length ?? 1) - 1)));
    setSimulationAnswer("");
    setSimulationFeedback("");
    setSimulationFinished(session.status === "completed");
    setMessage(`Loaded saved interview for ${session.role}.`);
  };

  const saveCareerProfile = async (nextProfile: CareerProfile) => {
    const response = await fetch("/api/career", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProfile),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save profile.");
    const savedProfile = {
      ...emptyProfile,
      ...(data.profile ?? nextProfile),
      resumeText: data.profile?.resumeText ?? nextProfile.resumeText,
      skillsText: data.profile?.skillsText ?? nextProfile.skillsText,
      projectsText: data.profile?.projectsText ?? nextProfile.projectsText,
      experienceText: data.profile?.experienceText ?? nextProfile.experienceText,
      educationText: data.profile?.educationText ?? nextProfile.educationText,
      preferredKeywords: data.profile?.preferredKeywords ?? nextProfile.preferredKeywords,
      jobDescriptionText: data.profile?.jobDescriptionText ?? nextProfile.jobDescriptionText,
    };
    setProfile(savedProfile);
    setAnalysis(data.analysis);
    syncMissionToInterview(savedProfile);
    return data;
  };

  const saveProfile = async (nextProfile = profile) => {
    setSaving(true);
    setMessage("");
    try {
      const data = await saveCareerProfile(nextProfile);
      setMessage(
        data.analysis?.isAnalyzed
          ? "Career mission saved. Resume scoring, Interview Prep, Company Readiness, and AI Coach are now using this target."
          : "Career mission saved. Interview Prep and AI Coach are synced; upload your resume to generate scores."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (file?: File | null) => {
    if (!file) return;
    setResumeUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await fetch("/api/career/resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to parse resume.");

      const nextProfile = {
        ...profile,
        resumeText: data.text,
      };
      await saveCareerProfile(nextProfile);
      setMessage(`Resume uploaded from ${data.fileName}. Resume analysis has been recalculated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload resume.");
    } finally {
      setResumeUploading(false);
    }
  };

  const launchInterviewSimulation = async () => {
    if (isCustomSimulationRole && !customSimulationRole.trim()) {
      setMessage("Enter your custom target role first, then launch the interview.");
      return;
    }

    setInterviewActionLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/career/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: effectiveSimulationMode,
          role: resolvedSimulationRole,
          difficulty: simulationDifficulty,
          company: profile.targetCompany,
        }),
      });
      const session = await response.json();
      if (!response.ok) throw new Error(session.error || "Unable to launch interview.");

      setInterviewSessionId(session.id);
      setSimulationQuestions(session.questions);
      setCurrentSimulationIndex(0);
      setSimulationAnswer("");
      setSimulationFeedback("");
      setSimulationHistory(session.answers ?? []);
      setSimulationFinished(false);
      rememberInterviewSession(session);
      setMessage("Interview room launched and saved. Answer the first question like a real interview.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to launch interview.");
    } finally {
      setInterviewActionLoading(false);
    }
  };

  const submitSimulationAnswer = async () => {
    if (!activeSimulationQuestion || !interviewSessionId) {
      setSimulationFeedback("Launch an interview room first.");
      return;
    }

    if (simulationAnswer.trim().length < 8) {
      setSimulationFeedback("Write an answer first. Even weak answers can be scored, but blank answers cannot.");
      return;
    }

    setInterviewActionLoading(true);
    try {
      const response = await fetch(`/api/career/interviews/${interviewSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionIndex: currentSimulationIndex,
          answer: simulationAnswer,
        }),
      });
      const session = await response.json();
      if (!response.ok) throw new Error(session.error || "Unable to score answer.");

      const scoredAnswer = session.answers?.find((item: InterviewHistoryItem) => item.questionIndex === currentSimulationIndex);
      setSimulationHistory(session.answers ?? []);
      setSimulationFeedback(scoredAnswer?.feedback ?? "Answer scored.");
      rememberInterviewSession(session);
    } catch (error) {
      setSimulationFeedback(error instanceof Error ? error.message : "Unable to score answer.");
    } finally {
      setInterviewActionLoading(false);
    }
  };

  const nextSimulationQuestion = async () => {
    if (currentSimulationIndex < simulationQuestions.length - 1) {
      setCurrentSimulationIndex((index) => index + 1);
      setSimulationAnswer("");
      setSimulationFeedback("");
      return;
    }

    if (!interviewSessionId) {
      setSimulationFinished(true);
      setMessage(`Interview simulation complete. Review your report below.`);
      return;
    }

    setInterviewActionLoading(true);
    try {
      const response = await fetch(`/api/career/interviews/${interviewSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish" }),
      });
      const session = await response.json();
      if (!response.ok) throw new Error(session.error || "Unable to finish interview.");

      setSimulationHistory(session.answers ?? simulationHistory);
      setSimulationFinished(true);
      rememberInterviewSession(session);
      setMessage(`Interview simulation complete and saved. Review your report below.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to finish interview.");
    } finally {
      setInterviewActionLoading(false);
    }
  };

  const addInterviewWeakAreasToPlanner = async () => {
    if (!interviewReport) return;
    setSavingInterviewReport(true);
    setMessage("");
    try {
      const deadline = getTomorrowDateISO();
      await Promise.all(
        interviewReport.plannerTopics.slice(0, 4).map((topic) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `Interview revision: ${topic}`,
              description: `From ${simulationDifficulty} ${effectiveSimulationModeLabel} simulation for ${resolvedSimulationRole}. Practice this weak signal before the next mock interview.`,
                priority: "high",
                deadline,
              }),
          }),
        ),
      );
      setMessage("Weak interview areas added to Planner.");
    } catch {
      setMessage("Unable to add interview weak areas to Planner.");
    } finally {
      setSavingInterviewReport(false);
    }
  };

  const addCareerMissionToPlanner = async () => {
    if (!profile.dreamRole.trim() || !profile.targetCompany.trim()) {
      setMessage("Add your dream role and target company first.");
      return;
    }

    setSavingMissionPlan(true);
    setMessage("");
    try {
      const topics = missionPlanTopics.length
        ? missionPlanTopics
        : ["Resume proof", "Role-specific interview practice", "Project improvement", "Company readiness"];
      const tasks = [
        {
          title: `Mission: improve ${profile.targetCompany} ${profile.dreamRole} readiness`,
          description: `Review your resume score, missing skills, interview gaps, and company readiness for ${profile.dreamRole} at ${profile.targetCompany}.`,
          priority: "high",
          deadline: getDateOffsetISO(1),
        },
        ...topics.slice(0, 4).map((topic, index) => ({
          title: `${profile.dreamRole} roadmap: ${topic}`,
          description: `Master ${topic} because it is connected to your dream target: ${profile.dreamRole} at ${profile.targetCompany}.`,
          priority: index < 2 ? "high" : "medium",
          deadline: getDateOffsetISO(index + 2),
        })),
        {
          title: `Mock interview for ${profile.dreamRole}`,
          description: `Open Career Hub → Interview Prep and launch a ${effectiveSimulationModeLabel} room for ${profile.dreamRole} at ${profile.targetCompany}.`,
          priority: "high",
          deadline: getDateOffsetISO(3),
        },
      ];

      await Promise.all(
        tasks.map((task) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          }),
        ),
      );

      setMessage(`Career mission plan added to Planner for ${profile.dreamRole} at ${profile.targetCompany}.`);
    } catch {
      setMessage("Unable to add career mission plan to Planner.");
    } finally {
      setSavingMissionPlan(false);
    }
  };

  const saveInterviewReportToSecondBrain = async () => {
    if (!interviewReport) return;
    setSavingInterviewReport(true);
    setMessage("");
    try {
      const content = buildInterviewNoteContent({
        history: simulationHistory,
        report: interviewReport,
        role: resolvedSimulationRole,
        company: profile.targetCompany,
        mode: effectiveSimulationModeLabel,
        difficulty: simulationDifficulty,
      });
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Interview Report: ${resolvedSimulationRole}`,
          content,
          category: "interview",
          tags: `interview,${effectiveSimulationMode},${resolvedSimulationRole}`,
        }),
      });
      if (!response.ok) throw new Error("Unable to save note.");
      setMessage("Interview report saved to Second Brain.");
    } catch {
      setMessage("Unable to save interview report to Second Brain.");
    } finally {
      setSavingInterviewReport(false);
    }
  };

  const addCompanyRoadmapToPlanner = async () => {
    if (!selectedCompany || companyReadinessTopics.length === 0) return;
    setSavingCompanyReadiness(true);
    setMessage("");
    try {
      const deadline = getTomorrowDateISO();
      await Promise.all(
        companyReadinessTopics.slice(0, 5).map((topic, index) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `${selectedCompany.company} readiness: ${topic}`,
              description: `Master ${topic} for ${profile.dreamRole} at ${selectedCompany.company}. This came from Company Readiness in Career Hub.`,
              priority: index < 2 ? "high" : "medium",
              deadline,
            }),
          }),
        ),
      );
      setMessage(`${selectedCompany.company} readiness roadmap added to Planner.`);
    } catch {
      setMessage("Unable to add company roadmap to Planner.");
    } finally {
      setSavingCompanyReadiness(false);
    }
  };

  const saveCompanyReadinessToSecondBrain = async () => {
    if (!selectedCompany) return;
    setSavingCompanyReadiness(true);
    setMessage("");
    try {
      const content = [
        `Company Readiness Report`,
        ``,
        `Company: ${selectedCompany.company}`,
        `Target Role: ${profile.dreamRole}`,
        `Readiness: ${selectedCompany.readiness ?? 0}/100`,
        `Estimated Preparation: ${selectedCompany.estimatedPrepTime}`,
        ``,
        `Missing Skills:`,
        ...selectedCompany.weakestSkills.map((item) => `- ${item}`),
        ``,
        `Areas To Master:`,
        ...selectedCompany.missingTopics.map((item) => `- ${item}`),
        ``,
        `Roadmap:`,
        ...companyReadinessTopics.map((item, index) => `${index + 1}. ${item}`),
      ].join("\n");

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedCompany.company} Readiness Report`,
          content,
          category: "interview",
          tags: `career,company-readiness,${selectedCompany.company},${profile.dreamRole}`,
        }),
      });
      if (!response.ok) throw new Error("Unable to save note.");
      setMessage(`${selectedCompany.company} readiness report saved to Second Brain.`);
    } catch {
      setMessage("Unable to save company readiness report.");
    } finally {
      setSavingCompanyReadiness(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-5 lg:p-8">
      <header className="mb-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 border-blue-400/30 bg-blue-500/10 text-blue-200">
              <BriefcaseBusiness className="mr-1 h-3 w-3" />
              AI Career Command Center
            </Badge>
            <h1 className="text-3xl font-bold text-white">Career Hub</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Resume upload, interview prep, and company readiness tied back to your Zentric growth mission.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <ScoreTile label="Resume" value={analysis?.resumeScore} />
            <ScoreTile label="Career Readiness" value={analysis?.careerReadinessScore} />
          </div>
        </div>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      {!loading && !isAnalyzed && (
        <div className="mb-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm leading-6 text-yellow-100">
          Resume scores are not analyzed yet because no resume has been uploaded. Upload your resume to generate analysis.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-purple-300" />
        </div>
      ) : (
        <>
          {activeTab === "resume" && (
            <div className="space-y-5">
              <Card className="overflow-hidden border-purple-400/20 bg-gradient-to-br from-purple-500/[0.12] via-blue-500/[0.06] to-white/[0.02]">
                <CardHeader>
                  <Badge className="w-fit border-purple-400/30 bg-purple-400/10 text-purple-100">
                    Career Mission Setup
                  </Badge>
                  <CardTitle className="text-2xl">Dream Career Target</CardTitle>
                  <p className="max-w-3xl text-sm leading-6 text-gray-400">
                    Set this once and Zentric uses it across Resume, Interview Prep, Company Readiness,
                    Planner, Second Brain, and AI Coach.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                    <Field label="Dream Role">
                      <Input
                        value={profile.dreamRole}
                        onChange={(event) => setProfile({ ...profile, dreamRole: event.target.value })}
                        placeholder="e.g. Software Engineer Intern"
                      />
                    </Field>
                    <Field label="Target Company">
                      <Input
                        value={profile.targetCompany}
                        onChange={(event) => setProfile({ ...profile, targetCompany: event.target.value })}
                        placeholder="e.g. Google, Amazon, Microsoft"
                      />
                    </Field>
                    <Button
                      onClick={() => saveProfile()}
                      disabled={saving || !profile.dreamRole.trim() || !profile.targetCompany.trim()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                      Save Mission
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <MissionSignal
                      label="Resume Scan"
                      value={isAnalyzed ? `${analysis?.resumeScore ?? 0}%` : "Needs resume"}
                      description="Role/company ATS-style scoring"
                    />
                    <MissionSignal
                      label="Company Readiness"
                      value={selectedCompany?.readiness === null || selectedCompany?.readiness === undefined ? "Waiting" : `${selectedCompany.readiness}%`}
                      description={selectedCompany ? `${selectedCompany.company} target` : "Target company match"}
                    />
                    <MissionSignal
                      label="Interview Prep"
                      value={effectiveSimulationModeLabel}
                      description={resolvedSimulationRole}
                    />
                    <MissionSignal
                      label="Planner Actions"
                      value={`${missionPlanTopics.length || 4} focus areas`}
                      description="Roadmap tasks generated"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm leading-6 text-gray-300">
                      <span className="font-medium text-white">Active mission:</span>{" "}
                      {profile.dreamRole || "Dream Role"} at {profile.targetCompany || "Target Company"}.
                      Zentric uses this target to calculate role match, company readiness, interview mode,
                      missing skills, and planner actions without requiring a job description.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={addCareerMissionToPlanner}
                        disabled={savingMissionPlan || !profile.dreamRole.trim() || !profile.targetCompany.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      >
                        {savingMissionPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Add Mission Plan to Planner
                      </Button>
                      <Button
                        onClick={() => {
                          syncMissionToInterview(profile);
                          setActiveTab("interview");
                          setMessage(`Interview Prep synced to ${profile.dreamRole} at ${profile.targetCompany}.`);
                        }}
                        variant="outline"
                        className="border-purple-400/30 text-purple-100"
                      >
                        Open Synced Interview Prep
                      </Button>
                    </div>
                  </div>

                  {missionPlanTopics.length > 0 && (
                    <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                      <p className="mb-3 text-sm font-semibold text-blue-100">Mission focus areas</p>
                      <div className="flex flex-wrap gap-2">
                        {missionPlanTopics.map((topic) => (
                          <Badge key={topic} className="border-blue-400/30 bg-blue-400/10 text-blue-100">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="overflow-hidden border-blue-400/20 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-white/[0.02]">
                  <CardContent className="relative p-6">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
                    <div className="relative space-y-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Badge className="mb-3 border-blue-400/30 bg-blue-500/10 text-blue-200">
                            <FileText className="mr-1 h-3 w-3" />
                            Smart Resume Upload
                          </Badge>
                          <h2 className="text-2xl font-bold text-white">Upload once. Let Zentric analyze the rest.</h2>
                          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                            Add your resume and Zentric will extract the text, calculate your resume score, find weak areas,
                            and connect the result to interview prep plus company readiness.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                          <p className={hasResumeUpload ? "text-sm font-semibold text-emerald-200" : "text-sm font-semibold text-yellow-100"}>
                            {hasResumeUpload ? "Resume uploaded" : "Waiting for resume"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {hasResumeUpload ? `${resumeWordCount} words extracted` : "Upload to unlock scoring"}
                          </p>
                        </div>
                      </div>

                      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-blue-300/30 bg-white/[0.04] px-6 py-10 text-center transition hover:border-blue-300/60 hover:bg-blue-400/10">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                          {resumeUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
                        </span>
                        <span className="text-base font-semibold text-white">
                          {resumeUploading ? "Reading your resume..." : "Choose your resume file"}
                        </span>
                        <span className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                          PDF, DOCX, DOC, TXT, MD, CSV, or JSON. Keep the input simple — the intelligence appears after upload.
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
                          onChange={(event) => {
                            uploadResume(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <ResumeInsightTile title="Input" value="Upload only" description="No manual form filling." />
                        <ResumeInsightTile title="Formats" value="7 types" description="PDF, DOCX, text, and more." />
                        <ResumeInsightTile title="Output" value="AI scan" description="Scores, gaps, and next steps." />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-400/20">
                  <CardHeader>
                    <CardTitle>Resume Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <BigScore value={analysis?.resumeScore} label="ATS Resume Score" />
                    <p className="text-xs leading-5 text-gray-500">
                      This score is calculated like an ATS-style resume scan: keyword match, required sections,
                      selected role/company expectations, impact metrics, formatting, and recruiter quality signals.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ResumeInsightTile title="Matched Skills" value={isAnalyzed ? `${matchedKeywordCount}` : "Locked"} description="Proof Zentric found." />
                      <ResumeInsightTile title="Missing Skills" value={isAnalyzed ? `${missingKeywordCount}` : "Locked"} description="Areas to improve." />
                    </div>
                    {(analysis?.scoreBreakdown ?? []).length > 0 && (
                      <div className="grid gap-3">
                        {(analysis?.scoreBreakdown ?? []).map((item) => (
                          <ScoreBreakdownRow key={item.label} item={item} />
                        ))}
                      </div>
                    )}
                    {!isAnalyzed && (
                      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                        Upload your resume first. After upload, this panel will show your score, strongest sections,
                        improvement areas, missing skills, and AI rewrite suggestions.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Strengths & Weak Areas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <SectionList title="Strong Sections" items={analysis?.strongSections ?? []} positive />
                    <SectionList title="Needs Improvement" items={analysis?.needsImprovement ?? []} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Missing Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(analysis?.missingKeywords ?? []).length === 0 ? (
                        <span className="text-sm text-gray-500">
                          {isAnalyzed ? "No major missing skills found." : "Upload your resume to see skill gaps."}
                        </span>
                      ) : (analysis?.missingKeywords ?? []).slice(0, 10).map((keyword) => (
                        <Badge key={keyword} className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-400/20 bg-purple-500/[0.04]">
                  <CardHeader>
                    <CardTitle>Actionable Resume Fixes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(analysis?.suggestions ?? []).length === 0 ? (
                      <p className="text-sm leading-6 text-gray-500">Upload your resume to get targeted improvements.</p>
                    ) : (analysis?.suggestions ?? []).slice(0, 4).map((suggestion) => (
                      <div key={suggestion} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-300">
                        <WandSparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-300" />
                        {suggestion}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {activeTab === "interview" && (
            <div className="space-y-5">
              <Card className="overflow-hidden border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-blue-500/[0.04] to-purple-500/[0.04]">
                <CardHeader>
                  <Badge className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                    Create Interview
                  </Badge>
                  <CardTitle className="text-2xl">Configure the next simulation</CardTitle>
                  <p className="max-w-3xl text-sm leading-6 text-gray-400">
                    Choose the mode, target role, and difficulty. Zentric creates a focused interview room,
                    scores your answer, and sends weak areas back to AI Coach.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className={`grid gap-4 ${isCustomSimulationRole ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
                    {!isCustomSimulationRole && (
                      <Field label="Interview mode">
                        <Select value={simulationMode} onValueChange={(value) => setSimulationMode(value as (typeof interviewModes)[number]["id"])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {interviewModes.map((mode) => (
                              <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                    <Field label="Target role">
                      <Select value={simulationRole} onValueChange={setSimulationRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {targetRoles.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Difficulty">
                      <Select value={simulationDifficulty} onValueChange={(value) => setSimulationDifficulty(value as (typeof interviewDifficulties)[number])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {interviewDifficulties.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {simulationRole === "Custom Role" && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                      <Field label="Custom interview role">
                        <Input
                          value={customSimulationRole}
                          onChange={(event) => setCustomSimulationRole(event.target.value)}
                          placeholder="e.g. ML Intern, Product Analyst, DevOps Engineer"
                        />
                      </Field>
                      <p className="mt-3 text-xs leading-5 text-cyan-100/70">
                        Custom role uses one clean Custom Interview mode. Zentric will generate role-fit, project,
                        skill-gap, and readiness questions for the role you enter.
                      </p>
                    </div>
                  )}

                  {isCustomSimulationRole ? (
                    <div className="rounded-2xl border border-purple-400/20 bg-purple-500/[0.06] p-4">
                      <p className="font-semibold text-white">Custom Interview</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                        No DSA/HR/Mixed selection needed here. This room adapts to your custom target role and
                        evaluates whether your answers prove fit, skills, projects, and growth plan.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-5">
                      {interviewModes.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setSimulationMode(mode.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            simulationMode === mode.id
                              ? "border-cyan-400/40 bg-cyan-400/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                        >
                          <p className="font-semibold text-white">{mode.label}</p>
                          <p className="mt-2 text-xs leading-5 text-gray-500">{mode.description}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {effectiveSimulationModeLabel} · {resolvedSimulationRole} · {simulationDifficulty}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {isCustomSimulationRole
                          ? "Custom interview mode will generate questions from the role you enter."
                          : `Resume-based mode ${hasResumeUpload ? "can use your uploaded resume." : "works better after resume upload."}`}
                      </p>
                    </div>
                    <Button
                      onClick={launchInterviewSimulation}
                      disabled={interviewActionLoading}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:from-cyan-400 hover:to-emerald-400"
                    >
                      {interviewActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Launch room
                    </Button>
                  </div>

                  {activeSimulationQuestion && (
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                      <div className="rounded-2xl border border-cyan-400/20 bg-black/30 p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                            Question {currentSimulationIndex + 1}/{simulationQuestions.length}
                          </Badge>
                          <Badge className="border-purple-400/30 bg-purple-400/10 text-purple-100">
                            {activeSimulationQuestion.mode}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold leading-7 text-white">{activeSimulationQuestion.question}</p>
                        <Textarea
                          value={simulationAnswer}
                          onChange={(event) => setSimulationAnswer(event.target.value)}
                          placeholder="Answer like a real interview. Use structure, examples, tradeoffs, and impact..."
                          className="mt-4 min-h-36"
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            onClick={submitSimulationAnswer}
                            disabled={interviewActionLoading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          >
                            {interviewActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Score answer
                          </Button>
                          <Button
                            onClick={nextSimulationQuestion}
                            variant="outline"
                            className="border-cyan-400/30 text-cyan-100"
                            disabled={!simulationFeedback || interviewActionLoading}
                          >
                            {currentSimulationIndex < simulationQuestions.length - 1 ? "Next question" : "Finish simulation"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Simulation Score</p>
                          <p className="mt-2 text-4xl font-bold text-white">{simulationAverage || 0}%</p>
                          <p className="mt-1 text-xs text-gray-400">{simulationHistory.length} answer{simulationHistory.length === 1 ? "" : "s"} scored</p>
                        </div>
                        {simulationFeedback ? (
                          <>
                            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                              <p className="font-semibold text-blue-100">AI Mentor Feedback</p>
                              <p className="mt-2 text-sm leading-6 text-gray-300">{simulationFeedback}</p>
                            </div>

                            {activeScoredAnswer && (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                  <MiniScore label="Technical depth" value={activeScoredAnswer.technicalDepth ?? activeScoredAnswer.score} />
                                  <MiniScore label="Clarity" value={activeScoredAnswer.clarity ?? activeScoredAnswer.score} />
                                  <MiniScore label="Structure" value={activeScoredAnswer.structure ?? activeScoredAnswer.score} />
                                  <MiniScore label="Role fit" value={activeScoredAnswer.roleFit ?? activeScoredAnswer.score} />
                                  <MiniScore label="Confidence" value={activeScoredAnswer.confidence ?? activeScoredAnswer.score} />
                                  <MiniScore label="Resume proof" value={activeScoredAnswer.resumeProof ?? activeScoredAnswer.score} />
                                </div>

                                <MentorPanel
                                  title="Ideal answer"
                                  tone="cyan"
                                  content={activeScoredAnswer.idealAnswer ?? "Use the ideal answer signals and cover the core points clearly."}
                                />
                                <MentorPanel
                                  title="Improved version"
                                  tone="purple"
                                  content={activeScoredAnswer.improvedAnswer ?? "Rewrite with structure, one concrete example, tradeoffs, and impact."}
                                />
                                <MentorPanel
                                  title="Follow-up question"
                                  tone="emerald"
                                  content={activeScoredAnswer.followUpQuestion ?? "What tradeoff would you mention if the interviewer pushed harder?"}
                                />
                              </>
                            )}
                          </>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="font-semibold text-white">Ideal answer signals</p>
                            <ul className="mt-2 space-y-2 text-sm text-gray-400">
                              {activeSimulationQuestion.idealPoints.map((point) => (
                                <li key={point}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {simulationFinished && interviewReport && (
                <Card className="border-emerald-400/20 bg-emerald-500/[0.04]">
                  <CardHeader>
                    <Badge className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-100">
                      AI Interview Evaluation Report
                    </Badge>
                    <CardTitle className="text-2xl">Post-interview report</CardTitle>
                    <p className="text-sm leading-6 text-gray-400">
                      Zentric analyzed your answers, interview mode, resume readiness, and ideal answer signals.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <ReportScore label="Overall" value={interviewReport.overall} />
                      <ReportScore label="Technical" value={interviewReport.technical} />
                      <ReportScore label="Communication" value={interviewReport.communication} />
                      <ReportScore label="Resume Alignment" value={interviewReport.resumeAlignment} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ReportScore label="Answer Structure" value={interviewReport.structure} />
                      <ReportScore label="Interview Confidence" value={interviewReport.confidence} />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="mb-3 font-semibold text-white">Strong answers</p>
                        {interviewReport.strongAnswers.length === 0 ? (
                          <p className="text-sm text-gray-500">No strong answer yet. Aim for specific examples, tradeoffs, and measurable impact.</p>
                        ) : interviewReport.strongAnswers.map((item) => (
                          <div key={item.question} className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-50">
                            <p className="font-medium">{item.score}% · {item.question}</p>
                            <p className="mt-1 text-emerald-100/70">{item.feedback}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="mb-3 font-semibold text-white">Weak answers</p>
                        {interviewReport.weakAnswers.length === 0 ? (
                          <p className="text-sm text-gray-500">No major weak answer found. Keep practicing at higher difficulty.</p>
                        ) : interviewReport.weakAnswers.map((item) => (
                          <div key={item.question} className="mb-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-50">
                            <p className="font-medium">{item.score}% · {item.question}</p>
                            <p className="mt-1 text-yellow-100/70">{item.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                      <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
                        <p className="mb-3 font-semibold text-purple-100">Topics to revise</p>
                        <div className="flex flex-wrap gap-2">
                          {interviewReport.plannerTopics.map((topic) => (
                            <Badge key={topic} className="border-purple-400/30 bg-purple-400/10 text-purple-100">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                        <p className="mb-3 font-semibold text-blue-100">Make this actionable</p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={addInterviewWeakAreasToPlanner}
                            disabled={savingInterviewReport}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          >
                            {savingInterviewReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                            Add weak areas to Planner
                          </Button>
                          <Button
                            onClick={saveInterviewReportToSecondBrain}
                            disabled={savingInterviewReport}
                            variant="outline"
                            className="border-blue-400/30 text-blue-100"
                          >
                            Save to Second Brain
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {interviewSessions.length > 0 && (
                <Card className="border-white/10 bg-white/[0.03]">
                  <CardHeader>
                    <CardTitle>Saved Interview Sessions</CardTitle>
                    <p className="text-sm leading-6 text-gray-400">
                      Your mock interviews are now stored, so Zentric can remember attempts, scores, weak areas, and progress.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {interviewSessions.slice(0, 4).map((session) => (
                      <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{session.role}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {session.mode === "custom" ? "Custom Interview" : session.mode} · {session.difficulty} · {session.status}
                            </p>
                          </div>
                          <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-100">
                            {session.averageScore ?? 0}%
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Progress value={session.averageScore ?? 0} />
                        </div>
                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          {session.answers.length}/{session.questions.length} answers scored
                          {session.report?.plannerTopics?.length
                            ? ` · Revise: ${session.report.plannerTopics.slice(0, 2).join(", ")}`
                            : ""}
                        </p>
                        <Button
                          onClick={() => openSavedInterviewSession(session)}
                          variant="outline"
                          className="mt-4 border-cyan-400/30 text-cyan-100"
                        >
                          Open session
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            </div>
          )}


          {activeTab === "companies" && (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Select Company for Resume Readiness</CardTitle></CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <Field label="Target Company">
                    <Select value={profile.targetCompany} onValueChange={(value) => setProfile({ ...profile, targetCompany: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {!companyOptions.includes(profile.targetCompany) && profile.targetCompany && (
                          <SelectItem value={profile.targetCompany}>{profile.targetCompany}</SelectItem>
                        )}
                        {companyOptions.map((company) => (
                          <SelectItem key={company} value={company}>{company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Or Enter Custom Company">
                    <Input
                      value={customReadinessCompany}
                      onChange={(event) => setCustomReadinessCompany(event.target.value)}
                      placeholder="e.g. Netflix, Flipkart, TCS, Stripe"
                    />
                  </Field>
                  <Button onClick={() => saveProfile()} disabled={saving} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />}
                    Check Resume for {profile.targetCompany}
                  </Button>
                  <Button
                    onClick={() => {
                      const company = customReadinessCompany.trim();
                      if (!company) return;
                      saveProfile({ ...profile, targetCompany: company });
                    }}
                    disabled={saving || !customReadinessCompany.trim()}
                    variant="outline"
                    className="border-purple-400/30 text-purple-200 lg:col-start-2"
                  >
                    Use Custom Company
                  </Button>
                </CardContent>
              </Card>

              {selectedCompany && (
                <Card className="overflow-hidden border-blue-400/20 bg-blue-500/[0.04]">
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span>{selectedCompany.company} Readiness</span>
                      <span className="text-blue-200">
                        {selectedCompany.readiness === null ? "Not analyzed yet" : `${selectedCompany.readiness}%`}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Progress value={selectedCompany.readiness ?? 0} />
                    {!isAnalyzed && (
                      <div className="flex gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        Upload or paste your resume first. Then Zentric can compare it against {selectedCompany.company} expectations.
                      </div>
                    )}
                    {isAnalyzed && (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Next Best Action</p>
                        <p className="mt-2 text-sm leading-6 text-gray-200">
                          {companyReadinessTopics[0]
                            ? `Master ${companyReadinessTopics[0]} first. It is currently the fastest way to improve your ${selectedCompany.company} readiness.`
                            : `Keep strengthening resume evidence and interview practice for ${selectedCompany.company}.`}
                        </p>
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-3">
                      <SectionList title="Skills Missing" items={selectedCompany.weakestSkills} />
                      <SectionList title="Areas To Master" items={selectedCompany.missingTopics} />
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">Estimated Preparation</p>
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
                          {selectedCompany.estimatedPrepTime}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                      <p className="mb-2 text-sm font-semibold text-purple-100">Recommended Learning Path</p>
                      {companyReadinessTopics.length === 0 ? (
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-gray-400">
                          No major missing topics detected yet. Keep adding resume proof, interview reports, and project evidence so Zentric can keep refining this roadmap.
                        </p>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {companyReadinessTopics.map((topic) => (
                            <div key={topic} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-gray-200">
                              <span>{topic}</span>
                              <ArrowRight className="h-4 w-4 text-purple-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <Button
                        onClick={addCompanyRoadmapToPlanner}
                        disabled={savingCompanyReadiness || !isAnalyzed || companyReadinessTopics.length === 0}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      >
                        {savingCompanyReadiness ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                        Add Roadmap to Planner
                      </Button>
                      <Button
                        onClick={saveCompanyReadinessToSecondBrain}
                        disabled={savingCompanyReadiness || !isAnalyzed}
                        variant="outline"
                        className="border-blue-400/30 text-blue-100"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Save to Second Brain
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function ScoreTile({ label, value }: { label: string; value?: number | null }) {
  const hasScore = typeof value === "number";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-bold ${hasScore ? "text-2xl text-white" : "text-sm text-yellow-100"}`}>
        {hasScore ? `${value}/100` : "Not analyzed yet"}
      </p>
      <Progress value={value ?? 0} className="mt-3" />
    </div>
  );
}

function MissionSignal({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  );
}

function BigScore({ value, label }: { value?: number | null; label: string }) {
  const hasScore = typeof value === "number";

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/[0.06] p-5">
      <div className="mb-3 flex items-center gap-3">
        <Target className="h-5 w-5 text-blue-300" />
        <p className="text-sm font-medium text-blue-100">{label}</p>
      </div>
      <p className={hasScore ? "text-5xl font-bold text-white" : "text-lg font-semibold text-yellow-100"}>
        {hasScore ? value : "Not analyzed yet"}
      </p>
      <p className="text-sm text-gray-500">{hasScore ? "out of 100" : "add resume/profile data to unlock this score"}</p>
      <Progress value={value ?? 0} className="mt-4" />
    </div>
  );
}
function ReportScore({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "text-emerald-100" : value >= 55 ? "text-yellow-100" : "text-red-100";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}%</p>
      <Progress value={value} className="mt-3" />
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : value >= 50
        ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100"
        : "border-red-400/20 bg-red-400/10 text-red-100";

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}%</p>
    </div>
  );
}

function MentorPanel({
  title,
  content,
  tone,
}: {
  title: string;
  content: string;
  tone: "cyan" | "purple" | "emerald";
}) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    purple: "border-purple-400/20 bg-purple-400/10 text-purple-100",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-200">{content}</p>
    </div>
  );
}

function ScoreBreakdownRow({ item }: { item: { label: string; value: number; detail: string } }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{item.label}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{item.detail}</p>
        </div>
        <span className="text-sm font-semibold text-blue-200">{item.value}%</span>
      </div>
      <Progress value={item.value} />
    </div>
  );
}

function ResumeInsightTile({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  );
}

function SectionList({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white">{title}</p>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-gray-500">
            Waiting for resume or mission data.
          </div>
        ) : items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
            {positive ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Bot className="h-4 w-4 text-purple-300" />}
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
