"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Flame,
  GitBranch,
  GraduationCap,
  Lightbulb,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalNotes: number;
    totalStudyTopics: number;
    completedStudyTopics: number;
    totalGoals: number;
    productivityScore: number;
  };
  growth: GrowthDashboard;
}

type MissionBreakdownItem = {
  label: string;
  value: number;
  color: string;
  source?: string;
};

type CompanyReadiness = {
  company: string;
  readiness: number;
  weakest: string;
  prepTime: string;
  missing: string[];
  roadmap: string[];
};

type GrowthPlanItem = {
  time: string;
  title: string;
  duration: string;
  priority: string;
  impact: string;
  href: string;
};

type CoachSignal = {
  insight: string;
  action: string;
  href: string;
};

type LabelValue = {
  label: string;
  value: string;
};

type CareerProgressItem = {
  label: string;
  value: number;
};

type GrowthDashboard = {
  currentMission: string;
  growthScore: number;
  currentReadiness: string;
  estimatedDaysRemaining: number;
  estimatedStudyHoursToday: number;
  readinessIncrease: number;
  recommendations: string[];
  missionProgress: {
    mission: string;
    overallProgress: number;
    breakdown: MissionBreakdownItem[];
  };
  companyReadiness: CompanyReadiness[];
  growthPlan: GrowthPlanItem[];
  coachSignals: CoachSignal[];
  knowledgeRetention: LabelValue[];
  learningAnalytics: LabelValue[];
  leetcodeInsights: LabelValue[];
  secondBrainSummary: LabelValue[];
  careerProgress: CareerProgressItem[];
  focus: {
    topic: string;
    priority: string;
    estimatedTime: string;
    reason: string;
  };
  motivation: string;
  recentAchievements: string[];
  sources: {
    planner: number;
    studyTracker: number;
    secondBrain: number;
    goals: number;
    leetcode: string | null;
    codingHub: string;
    resumeCareer: string;
  };
};

const missionBreakdown: MissionBreakdownItem[] = [
  { label: "Coding", value: 85, color: "#60a5fa" },
  { label: "CS Fundamentals", value: 62, color: "#a78bfa" },
  { label: "Projects", value: 75, color: "#22d3ee" },
  { label: "Resume", value: 90, color: "#34d399" },
  { label: "Interview Skills", value: 54, color: "#f472b6" },
  { label: "Behavioral", value: 70, color: "#facc15" },
];

const companyReadiness: CompanyReadiness[] = [
  {
    company: "Google",
    readiness: 72,
    weakest: "Graphs, DP recall",
    prepTime: "38 days",
    missing: ["Advanced Graphs", "System Design", "Mock interviews"],
    roadmap: [
      "Master graph traversal, shortest paths, and union-find patterns.",
      "Ship one resume-grade project with measurable impact.",
      "Complete 4 Google-style mock interviews with feedback loops.",
    ],
  },
  {
    company: "Amazon",
    readiness: 78,
    weakest: "Leadership stories",
    prepTime: "27 days",
    missing: ["LP stories", "Trees", "Behavioral drills"],
    roadmap: [
      "Prepare STAR stories for ownership, bias for action, and customer obsession.",
      "Revise trees, heaps, and sliding window patterns.",
      "Run two behavioral mocks focused on follow-up questions.",
    ],
  },
  {
    company: "Microsoft",
    readiness: 69,
    weakest: "System design basics",
    prepTime: "34 days",
    missing: ["OOP design", "DP", "Azure basics"],
    roadmap: [
      "Build confidence in object-oriented design interviews.",
      "Revise DP patterns with spaced repetition.",
      "Add one cloud-flavored project bullet to your resume.",
    ],
  },
  {
    company: "Atlassian",
    readiness: 66,
    weakest: "Frontend systems",
    prepTime: "42 days",
    missing: ["Frontend architecture", "Collaboration tools", "Product thinking"],
    roadmap: [
      "Practice product-minded engineering tradeoffs.",
      "Document one collaboration-focused project in Second Brain.",
      "Revise frontend performance and component architecture.",
    ],
  },
  {
    company: "Adobe",
    readiness: 64,
    weakest: "Projects depth",
    prepTime: "45 days",
    missing: ["Creative tooling", "OS revision", "Portfolio polish"],
    roadmap: [
      "Improve your project case studies with problem, architecture, and outcome.",
      "Refresh OS concepts and memory management.",
      "Create a polished portfolio narrative for interviews.",
    ],
  },
  {
    company: "Uber",
    readiness: 61,
    weakest: "Scale thinking",
    prepTime: "49 days",
    missing: ["Distributed systems", "Graphs", "Rate limiting"],
    roadmap: [
      "Study high-scale design patterns: queues, caching, and rate limits.",
      "Solve graph problems tied to routing and optimization.",
      "Practice explaining tradeoffs under time pressure.",
    ],
  },
];

const growthPlan: GrowthPlanItem[] = [
  {
    time: "9:00",
    title: "Binary Search Revision",
    duration: "35 min",
    priority: "High",
    impact: "+0.4%",
    href: "/study",
  },
  {
    time: "10:00",
    title: "Practice Your Weakest Topic",
    duration: "60 min",
    priority: "Critical",
    impact: "+1.1%",
    href: "/coding-hub",
  },
  {
    time: "11:30",
    title: "Resume Improvement",
    duration: "40 min",
    priority: "High",
    impact: "+0.6%",
    href: "/planner",
  },
  {
    time: "2:00",
    title: "System Design Reading",
    duration: "45 min",
    priority: "Medium",
    impact: "+0.5%",
    href: "/notes",
  },
  {
    time: "4:00",
    title: "Mock Interview Reflection",
    duration: "30 min",
    priority: "High",
    impact: "+0.4%",
    href: "/chat",
  },
];

const coachSignals: CoachSignal[] = [
  {
    insight: "You haven't revised Dynamic Programming for 12 days.",
    action: "Revise",
    href: "/study",
  },
  {
    insight: "Arrays mastery is 94%. Focus on Graphs for the fastest readiness gain.",
    action: "Practice",
    href: "/coding-hub",
  },
  {
    insight:
      "Based on your LeetCode history, Medium Graph problems will improve interview readiness fastest.",
    action: "Practice",
    href: "/leetcode",
  },
  {
    insight: "Your resume project section needs stronger impact metrics.",
    action: "Review",
    href: "/planner",
  },
];

const retentionStats: LabelValue[] = [
  { label: "Retention Score", value: "76%" },
  { label: "Topics Forgotten", value: "8" },
  { label: "Topics To Revise", value: "14" },
  { label: "Flashcards Due Today", value: "22" },
  { label: "Revision Streak", value: "9 days" },
];

const learningAnalytics = [
  { label: "Topics Mastered", value: "42", icon: Trophy },
  { label: "Topics In Progress", value: "18", icon: Activity },
  { label: "Weakest Topic", value: "Graphs", icon: Target },
  { label: "Longest Learning Streak", value: "21 days", icon: Flame },
  { label: "Most Consistent Week", value: "Mon-Fri", icon: Calendar },
  { label: "Learning Velocity", value: "+18%", icon: LineChart },
];

const leetcodeInsights: LabelValue[] = [
  { label: "Problems Solved", value: "128" },
  { label: "Current Streak", value: "11 days" },
  { label: "Contest Rating", value: "1,642" },
  { label: "Strongest Pattern", value: "Arrays" },
  { label: "Weakest Pattern", value: "Graphs" },
  { label: "Acceptance Rate", value: "61%" },
  { label: "Predicted Rating in 30 days", value: "1,760" },
  { label: "Company-wise readiness", value: "Google 72%" },
];

const careerProgress: CareerProgressItem[] = [
  { label: "Resume Score", value: 82 },
  { label: "ATS Score", value: 78 },
  { label: "Projects Completed", value: 75 },
  { label: "GitHub Activity", value: 68 },
  { label: "LinkedIn Optimization", value: 64 },
  { label: "Interview Readiness", value: 71 },
];

const recentAchievements = [
  "Solved 5 Medium Problems",
  "Completed Operating Systems",
  "Reached 100 LeetCode Questions",
  "Completed Resume",
  "Finished Mock Interview",
];

function ProgressRing({
  value,
  label,
  color = "#8b5cf6",
  size = "md",
}: {
  value: number;
  label: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;
  const dimensions = size === "sm" ? "h-24 w-24" : "h-28 w-28";

  return (
    <div className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
      <div className={`relative ${dimensions}`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{value}%</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-gray-300">{label}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/30 hover:bg-purple-500/[0.05]">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  eyebrow,
}: {
  icon: React.ElementType;
  title: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-purple-300">
            {eyebrow}
          </p>
        )}
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h2>
      </div>
    </div>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`glass-card rounded-[1.35rem] p-5 shadow-2xl shadow-black/20 transition-all duration-300 hover:border-white/15 ${className}`}
    >
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyReadiness>(
    companyReadiness[0]!
  );

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.growth?.companyReadiness?.[0]) {
          setSelectedCompany(d.growth.companyReadiness[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const growth = data?.growth;
  const noteCount = data?.stats.totalNotes ?? 0;
  const studyCompletion = data?.stats.totalStudyTopics
    ? Math.round(
        (data.stats.completedStudyTopics / data.stats.totalStudyTopics) * 100
      )
    : 62;

  const secondBrainSummary = useMemo(
    () =>
      growth?.secondBrainSummary ?? [
        { label: "Notes Created", value: loading ? "..." : String(noteCount) },
        { label: "Knowledge Connections", value: "0" },
        { label: "Flashcards Generated", value: "0" },
        { label: "Interview Notes", value: "0" },
        { label: "AI Summaries", value: "0" },
        { label: "Recent Learning", value: "No recent note yet" },
      ],
    [growth?.secondBrainSummary, loading, noteCount]
  );

  const recommendations = growth?.recommendations ?? [
    "Add study topics",
    "Connect LeetCode",
    "Create project notes",
    "Track resume tasks",
  ];
  const missionProgress = growth?.missionProgress ?? {
    mission: growth?.currentMission ?? "Set your dream mission in AI Coach",
    overallProgress: 0,
    breakdown: missionBreakdown,
  };
  const companyReadinessItems = growth?.companyReadiness ?? companyReadiness;
  const currentMission = growth?.currentMission ?? missionProgress.mission;
  const readinessTargetLabel = companyReadinessItems[0]?.company
    ? `${companyReadinessItems[0].company} readiness`
    : "Mission readiness";
  const heroStats = [
    { label: "Current Mission", value: currentMission },
    { label: "Growth Score", value: `${growth?.growthScore ?? 0}%` },
    { label: "Current Readiness", value: growth?.currentReadiness ?? "Calculating" },
    {
      label: "Estimated Days Remaining",
      value: `${growth?.estimatedDaysRemaining ?? 0} days`,
    },
    {
      label: "Study Hours Today",
      value: `${growth?.estimatedStudyHoursToday ?? 0} hrs`,
    },
  ];
  const growthPlanItems = growth?.growthPlan ?? growthPlan;
  const coachSignalItems = growth?.coachSignals ?? coachSignals;
  const retentionItems = growth?.knowledgeRetention ?? retentionStats;
  const learningAnalyticsItems = growth?.learningAnalytics ?? learningAnalytics;
  const leetcodeInsightItems = growth?.leetcodeInsights ?? leetcodeInsights;
  const careerProgressItems = growth?.careerProgress ?? careerProgress;
  const focus = growth?.focus ?? {
    topic: "Graphs",
    priority: "High",
    estimatedTime: "90 min",
    reason: "Graphs are currently your weakest interview topic.",
  };
  const motivation =
    growth?.motivation ??
    "Keep going. Every real task, note, study topic and coding session will sharpen this score.";
  const recentAchievementItems = growth?.recentAchievements ?? recentAchievements;
  const sortedBreakdown = [...missionProgress.breakdown].sort((a, b) => a.value - b.value);
  const weakestSignal = sortedBreakdown[0] ?? missionProgress.breakdown[0];
  const strongestSignal = [...missionProgress.breakdown].sort((a, b) => b.value - a.value)[0] ?? missionProgress.breakdown[0];
  const primaryAction = growthPlanItems[0] ?? {
    time: "Now",
    title: "Start your first learning mission",
    duration: "45 min",
    priority: "High",
    impact: "+1%",
    href: "/ai-coach",
  };
  const nextPlanItems = growthPlanItems.slice(0, 4);
  const visibleCoachSignals = coachSignalItems.slice(0, 3);
  const topCompanies = companyReadinessItems.slice(0, 3);
  const systemSignalCards = [
    {
      title: "Learning + Memory",
      value: retentionItems.find((item) => item.label === "Retention Score")?.value ?? "0%",
      detail: `${learningAnalyticsItems.find((item) => item.label === "Topics Mastered")?.value ?? "0"} mastered · ${secondBrainSummary.find((item) => item.label === "Notes Created")?.value ?? "0"} notes`,
      href: "/learning-mode",
      icon: Brain,
    },
    {
      title: "Coding + Practice",
      value: `${missionProgress.breakdown.find((item) => item.label === "Coding")?.value ?? 0}%`,
      detail: leetcodeInsightItems.find((item) => item.label === "Problems Solved")?.value ?? "Practice inside Coding Hub",
      href: "/coding-hub",
      icon: Code2,
    },
    {
      title: "Career Readiness",
      value: `${careerProgressItems.find((item) => item.label === "Interview Readiness")?.value ?? 0}%`,
      detail: `${careerProgressItems.find((item) => item.label === "Resume Score")?.value ?? 0}% resume · ${careerProgressItems.find((item) => item.label === "ATS Score")?.value ?? 0}% ATS`,
      href: "/career",
      icon: Briefcase,
    },
  ];
  const learningIconMap: Record<string, React.ElementType> = {
    "Topics Mastered": Trophy,
    "Topics In Progress": Activity,
    "Weakest Topic": Target,
    "Longest Learning Streak": Flame,
    "Most Consistent Week": Calendar,
    "Learning Velocity": LineChart,
  };

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden p-5 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#05070F]/80 p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_30%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Badge className="mb-5 border-blue-400/30 bg-blue-500/10 text-blue-200">
                <Sparkles className="mr-1 h-3 w-3" />
                AI Growth Operating System
              </Badge>

              <p className="text-sm font-medium text-gray-300">
                Good Morning,{" "}
                <span className="gradient-text font-semibold">{firstName}</span>{" "}
                👋
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Today&apos;s AI Growth Brief
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Your command center is optimizing Planner, Study Tracker,
                LeetCode, Coding Hub, Second Brain, Resume, Career Hub and AI
                Coach into one mission: the next best action for your dream
                career.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 rounded-2xl" />
                    ))
                  : heroStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white sm:text-base">
                          {stat.value}
                        </p>
                      </div>
                    ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation}
                    className="flex items-center gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3 text-sm text-gray-200"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />
                    {recommendation}
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 text-white shadow-lg shadow-purple-600/25 transition-transform hover:scale-[1.02]"
                >
                  <Link href={primaryAction.href}>
                    Start Today&apos;s Mission
                    <Rocket className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-blue-100/80">
                  Completing today&apos;s plan increases your mission readiness
                  by{" "}
                  <span className="font-semibold text-white">
                    {growth?.readinessIncrease ?? 0}%
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">
                    Next best action
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {primaryAction.title}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">{readinessTargetLabel}</span>
                    <span className="font-medium text-white">
                      {companyReadinessItems[0]?.readiness ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={companyReadinessItems[0]?.readiness ?? 0}
                    className="h-2.5"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Study system confidence</span>
                    <span className="font-medium text-white">
                      {studyCompletion}%
                    </span>
                  </div>
                  <Progress value={studyCompletion} className="h-2.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs text-gray-500">Focus</p>
                    <p className="mt-1 font-semibold text-white">{focus.topic}</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="mt-1 font-semibold text-white">
                      {focus.estimatedTime}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-400/10 bg-blue-400/[0.05] p-4">
                  <p className="text-sm leading-6 text-blue-100/90">
                    {focus.reason} This is the fastest visible readiness gain
                    Zentric found from your connected modules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassPanel className="border-blue-400/15 bg-blue-500/[0.03]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                  What matters now
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  {primaryAction.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                  Zentric picked this from your mission, weak area, planner,
                  learning progress, coding activity, Second Brain, and Career
                  Hub signals.
                </p>
              </div>
              <Badge className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                {primaryAction.impact} expected lift
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.75fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Mission progress</p>
                    <p className="mt-1 text-4xl font-bold text-white">
                      {missionProgress.overallProgress}%
                    </p>
                  </div>
                  <ProgressRing value={missionProgress.overallProgress} label="Mission" />
                </div>
                <Progress value={missionProgress.overallProgress} className="h-2.5" />
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <p className="text-xs text-gray-500">Weakest</p>
                    <p className="mt-1 font-semibold text-red-200">
                      {weakestSignal?.label ?? "Calculating"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <p className="text-xs text-gray-500">Strongest</p>
                    <p className="mt-1 font-semibold text-emerald-200">
                      {strongestSignal?.label ?? "Calculating"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {nextPlanItems.map((item, index) => (
                  <Link
                    key={`${item.time}-${item.title}`}
                    href={item.href}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500/[0.05] ${
                      index === 0
                        ? "border-blue-400/40 bg-blue-500/[0.08]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-sm font-bold text-white">
                      {item.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{item.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          {item.duration}
                        </Badge>
                        <Badge className="border-purple-400/30 bg-purple-400/10 text-purple-200">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-200" />
                  </Link>
                ))}
              </div>
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel>
              <SectionHeader icon={Bot} eyebrow="AI Coach" title="Next decisions" />
              <div className="space-y-3">
                {visibleCoachSignals.map((signal) => (
                  <div
                    key={signal.insight}
                    className="rounded-2xl border border-purple-400/10 bg-purple-500/[0.05] p-4"
                  >
                    <p className="text-sm leading-6 text-gray-200">{signal.insight}</p>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="mt-3 h-8 rounded-full text-purple-200 hover:bg-purple-500/10"
                    >
                      <Link href={signal.href}>
                        {signal.action}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel>
              <SectionHeader icon={Lightbulb} eyebrow="Momentum" title="Coach message" />
              <p className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05] p-4 text-sm leading-6 text-emerald-50/90">
                {motivation}
              </p>
            </GlassPanel>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {systemSignalCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-blue-500/[0.05]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-200">
                  <card.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-200" />
              </div>
              <p className="text-sm text-gray-400">{card.title}</p>
              <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-gray-500">{card.detail}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <GlassPanel>
            <SectionHeader icon={ShieldCheck} eyebrow="Company Readiness" title="Top targets" />
            <div className="space-y-3">
              {topCompanies.map((company) => (
                <button
                  key={company.company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCompany.company === company.company
                      ? "border-purple-400/50 bg-purple-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-white">{company.company}</p>
                    <p className="font-bold text-blue-200">{company.readiness}%</p>
                  </div>
                  <Progress value={company.readiness} className="h-2" />
                  <p className="mt-2 text-xs text-gray-500">
                    Missing: {company.missing.slice(0, 2).join(", ")}
                  </p>
                </button>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader icon={BarChart3} eyebrow="Connected system" title="Mission breakdown" />
            <div className="space-y-3">
              {missionProgress.breakdown.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-200">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <Progress value={item.value} />
                  {item.source && <p className="mt-2 text-xs text-gray-500">{item.source}</p>}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="hidden">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel>
            <SectionHeader
              icon={BarChart3}
              eyebrow="Mission Progress"
              title={missionProgress.mission}
            />
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                    Overall Progress
                  </p>
                  <p className="mt-2 text-4xl font-bold text-white">
                    {missionProgress.overallProgress}%
                  </p>
                </div>
                <ProgressRing
                  value={missionProgress.overallProgress}
                  label="Mission"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {missionProgress.breakdown.map((item) => (
                <ProgressRing
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  color={item.color}
                  size="sm"
                />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="AI Readiness Engine"
              title="Recruiter Readiness"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {companyReadinessItems.map((company) => (
                <button
                  key={company.company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCompany.company === company.company
                      ? "border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-950/20"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{company.company}</h3>
                    <span className="text-lg font-bold text-blue-200">
                      {company.readiness}%
                    </span>
                  </div>
                  <Progress value={company.readiness} className="mb-3 h-2" />
                  <p className="text-xs text-gray-400">
                    Weakest: {company.weakest}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Prep time: {company.prepTime}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {company.missing.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-[10px]">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-blue-400/10 bg-blue-500/[0.05] p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-200/70">
                    Detailed roadmap
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {selectedCompany.company} readiness path
                  </h3>
                </div>
                <Badge>{selectedCompany.readiness}% ready</Badge>
              </div>
              <div className="space-y-3">
                {selectedCompany.roadmap.map((step, index) => (
                  <div key={step} className="flex gap-3 text-sm text-gray-300">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-400/10 text-xs font-semibold text-blue-200">
                      {index + 1}
                    </span>
                    <p className="leading-6">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <GlassPanel>
            <SectionHeader
              icon={Calendar}
              eyebrow="Today's Roadmap"
              title="Today's Growth Plan"
            />
            <div className="space-y-4">
              {growthPlanItems.map((item, index) => (
                <Link
                  key={`${item.time}-${item.title}`}
                  href={item.href}
                  className="group grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-blue-500/[0.04] sm:grid-cols-[72px_1fr_auto]"
                >
                  <div className="flex items-center gap-3 sm:block">
                    <p className="text-lg font-bold text-white">{item.time}</p>
                    <div className="mt-0 hidden h-8 w-px bg-gradient-to-b from-purple-400 to-transparent sm:ml-5 sm:mt-2 sm:block" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-xs font-semibold text-purple-200">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        {item.duration}
                      </Badge>
                      <Badge
                        variant={
                          item.priority === "Critical" ? "destructive" : "warning"
                        }
                      >
                        Priority: {item.priority}
                      </Badge>
                      <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        Growth impact {item.impact}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 self-center text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-200" />
                </Link>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader icon={Bot} eyebrow="AI Coach" title="Coach Signals" />
            <div className="space-y-3">
              {coachSignalItems.map((signal) => (
                <div
                  key={signal.insight}
                  className="rounded-2xl border border-purple-400/10 bg-purple-500/[0.05] p-4"
                >
                  <p className="text-sm leading-6 text-gray-200">{signal.insight}</p>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="mt-3 h-8 rounded-full text-purple-200 hover:bg-purple-500/10"
                  >
                    <Link href={signal.href}>
                      {signal.action}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <GlassPanel>
            <SectionHeader
              icon={Brain}
              eyebrow="Knowledge Retention"
              title="Memory Health"
            />
            <div className="space-y-3">
              {retentionItems.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-gray-400">{stat.label}</span>
                  <span className="font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="xl:col-span-2">
            <SectionHeader
              icon={GraduationCap}
              eyebrow="Learning Analytics"
              title="Skill Momentum"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {learningAnalyticsItems.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  icon={learningIconMap[metric.label] ?? Activity}
                />
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <GlassPanel>
            <SectionHeader
              icon={Code2}
              eyebrow="LeetCode Insights"
              title="Interview Pattern Intelligence"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {leetcodeInsightItems.map((insight) => (
                <div
                  key={insight.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-xs text-gray-500">{insight.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {insight.value}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader
              icon={BookOpen}
              eyebrow="Second Brain Summary"
              title="Knowledge Graph"
            />
            <div className="space-y-3">
              {secondBrainSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <GlassPanel>
            <SectionHeader
              icon={Briefcase}
              eyebrow="Career Progress"
              title="Career Launch System"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {careerProgressItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <Progress value={item.value} />
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel>
              <SectionHeader icon={Zap} eyebrow="Focus Mode" title="Today's Focus" />
              <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      {focus.topic}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Priority:{" "}
                      <span className="font-semibold text-red-300">
                        {focus.priority}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Estimated Time:{" "}
                      <span className="font-semibold text-white">
                        {focus.estimatedTime}
                      </span>
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                    <GitBranch className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-gray-300">
                  Reason: {focus.reason}
                </p>
              </div>
            </GlassPanel>

            <GlassPanel>
              <SectionHeader icon={Lightbulb} eyebrow="Motivation" title="AI Momentum" />
              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05] p-5">
                <p className="text-lg font-semibold leading-7 text-white">
                  {motivation}
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  This message is generated from your current tasks, study
                  topics, notes, goals, and LeetCode sync when connected.
                </p>
              </div>
            </GlassPanel>
          </div>
        </div>

        <GlassPanel>
          <SectionHeader
            icon={Star}
            eyebrow="Recent Achievements"
            title="Proof That The System Is Working"
          />
          <div className="grid gap-3 md:grid-cols-5">
            {recentAchievementItems.map((achievement, index) => (
              <div
                key={achievement}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/30"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300/10 text-yellow-200">
                  <Trophy className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium leading-6 text-white">
                  {achievement}
                </p>
                <p className="mt-3 text-xs text-gray-500">Milestone {index + 1}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
        </div>
      </div>
    </div>
  );
}
