import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeCareerProfile } from "@/lib/career-engine";

const LEETCODE_GQL = "https://leetcode.com/graphql/";

type TaskRecord = Awaited<ReturnType<typeof prisma.task.findMany>>[number];
type NoteRecord = Awaited<ReturnType<typeof prisma.note.findMany>>[number];
type StudyTopicRecord = Awaited<ReturnType<typeof prisma.studyTopic.findMany>>[number];
type GoalRecord = Awaited<ReturnType<typeof prisma.goal.findMany>>[number];

type ProgressEvent = {
  id: string;
  type: string;
  module: string;
  title: string;
  detail: string | null;
  impact: number;
  metadata: unknown;
  createdAt: Date;
};

type PracticeProgressRecord = {
  id: string;
  questionId: string;
  completedAt: Date;
  studyTopicId: string;
};

type InterviewSessionRecord = {
  id: string;
  status: string;
  averageScore: number | null;
  report: unknown;
  updatedAt: Date;
};

type CareerProfileRecord = Parameters<typeof analyzeCareerProfile>[0];

const dashboardDb = prisma as typeof prisma & {
  careerProfile: {
    findUnique(args: unknown): Promise<CareerProfileRecord | null>;
  };
  studyPracticeProgress: {
    findMany(args: unknown): Promise<PracticeProgressRecord[]>;
  };
  coachEvent: {
    findMany(args: unknown): Promise<ProgressEvent[]>;
  };
  interviewSession: {
    findMany(args: unknown): Promise<InterviewSessionRecord[]>;
  };
};

type LeetCodeStats = {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  reputation: number;
  recentSolved: number;
  contestRating: number | null;
  acceptanceRate: number | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function percent(part: number, total: number, fallback = 0) {
  return total > 0 ? clamp((part / total) * 100) : fallback;
}

function average(values: number[], fallback = 0) {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function daysAgo(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function includesAny(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

async function fetchLeetCodeStats(username?: string | null): Promise<LeetCodeStats | null> {
  if (!username?.trim()) return null;

  try {
    const response = await fetch(LEETCODE_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: `query dashboardLeetCode($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            profile {
              ranking
              reputation
            }
          }
          recentAcSubmissionList(username: $username, limit: 20) {
            id
            timestamp
          }
          userContestRanking(username: $username) {
            rating
          }
        }`,
        variables: { username: username.trim() },
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const user = payload.data?.matchedUser;
    if (!user) return null;

    const solvedRows: Array<{ difficulty: string; count: number; submissions: number }> =
      user.submitStats?.acSubmissionNum ?? [];
    const total = solvedRows.find((row) => row.difficulty === "All");
    const easy = solvedRows.find((row) => row.difficulty === "Easy");
    const medium = solvedRows.find((row) => row.difficulty === "Medium");
    const hard = solvedRows.find((row) => row.difficulty === "Hard");
    const totalSolved = total?.count ?? 0;
    const totalSubmissions = total?.submissions ?? 0;
    const recentSolved = new Set(
      (payload.data?.recentAcSubmissionList ?? []).map((submission: { id: string }) => submission.id),
    ).size;

    return {
      username: user.username,
      totalSolved,
      easySolved: easy?.count ?? 0,
      mediumSolved: medium?.count ?? 0,
      hardSolved: hard?.count ?? 0,
      ranking: user.profile?.ranking ?? 0,
      reputation: user.profile?.reputation ?? 0,
      recentSolved,
      contestRating: payload.data?.userContestRanking?.rating
        ? Math.round(payload.data.userContestRanking.rating)
        : null,
      acceptanceRate: totalSubmissions > 0 ? clamp((totalSolved / totalSubmissions) * 100) : null,
    };
  } catch {
    return null;
  }
}

function buildGrowthEngine({
  tasks,
  notes,
  studyTopics,
  goals,
  leetcode,
  events = [],
  practiceProgress = [],
  interviewSessions = [],
  careerProfile = null,
}: {
  tasks: TaskRecord[];
  notes: NoteRecord[];
  studyTopics: StudyTopicRecord[];
  goals: GoalRecord[];
  leetcode: LeetCodeStats | null;
  events?: ProgressEvent[];
  practiceProgress?: PracticeProgressRecord[];
  interviewSessions?: InterviewSessionRecord[];
  careerProfile?: CareerProfileRecord | null;
}) {
  const completedTasks = tasks.filter((task) => task.completed);
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTopics = studyTopics.filter((topic) => topic.status === "completed");
  const inProgressTopics = studyTopics.filter((topic) => topic.status === "in_progress");
  const dsaTopics = studyTopics.filter((topic) =>
    includesAny(`${topic.category} ${topic.name}`, ["dsa", "leetcode", "array", "graph", "dp", "tree", "coding"]),
  );
  const csTopics = studyTopics.filter((topic) =>
    includesAny(`${topic.category} ${topic.name}`, [
      "system",
      "os",
      "operating",
      "dbms",
      "network",
      "computer",
      "backend",
      "frontend",
    ]),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentCutoff = new Date(Date.now() - 7 * 86_400_000);
  const recentNotes = notes.filter((note) => note.updatedAt >= recentCutoff);
  const recentCompletedTasks = completedTasks.filter((task) => task.updatedAt >= recentCutoff);
  const recentStudyUpdates = studyTopics.filter((topic) => topic.updatedAt >= recentCutoff);
  const recentEvents = events.filter((event) => event.createdAt >= recentCutoff);
  const hasCareerProfileEvidence = Boolean(
    careerProfile?.dreamRole?.trim() ||
      careerProfile?.targetCompany?.trim() ||
      careerProfile?.resumeText?.trim() ||
      careerProfile?.skillsText?.trim() ||
      careerProfile?.projectsText?.trim(),
  );
  const hasGrowthEvidence =
    tasks.length > 0 ||
    notes.length > 0 ||
    studyTopics.length > 0 ||
    goals.length > 0 ||
    events.length > 0 ||
    practiceProgress.length > 0 ||
    interviewSessions.length > 0 ||
    hasCareerProfileEvidence ||
    Boolean(leetcode);

  if (!hasGrowthEvidence) {
    const onboardingBreakdown = [
      { label: "Goal Setup", value: 0, color: "#60a5fa", source: "AI Coach onboarding" },
      { label: "Learning Plan", value: 0, color: "#a78bfa", source: "Generated roadmap" },
      { label: "Practice", value: 0, color: "#22d3ee", source: "Study Tracker + Coding Hub" },
      { label: "Second Brain", value: 0, color: "#34d399", source: "Learning notes and recap memory" },
      { label: "Career Proof", value: 0, color: "#f472b6", source: "Resume, projects and interview evidence" },
    ];

    return {
      currentMission: "Set your growth mission in AI Coach",
      growthScore: 0,
      currentReadiness: "Waiting for mission",
      estimatedDaysRemaining: 0,
      estimatedStudyHoursToday: 0,
      readinessIncrease: 0,
      recommendations: [
        "Open AI Coach and enter your goal",
        "Add your current stage and target date",
        "Generate your first roadmap",
        "Sync today's mission to Planner",
      ],
      missionProgress: {
        mission: "Set your dream mission in AI Coach",
        overallProgress: 0,
        breakdown: onboardingBreakdown,
      },
      companyReadiness: [
        {
          company: "Dream Mission",
          readiness: 0,
          weakest: "Goal setup",
          prepTime: "Set goal first",
          missing: ["Goal", "Stage", "Deadline"],
          roadmap: [
            "Open AI Coach and define your target.",
            "Add current stage, available study time, and target date.",
            "Generate your first roadmap and daily mission.",
          ],
        },
      ],
      growthPlan: [
        { time: "Now", title: "Set Your Growth Mission", duration: "5 min", priority: "Critical", impact: "+10%", href: "/ai-coach" },
        { time: "Next", title: "Generate Roadmap", duration: "5 min", priority: "High", impact: "+8%", href: "/ai-coach" },
        { time: "After", title: "Sync Planner", duration: "3 min", priority: "High", impact: "+5%", href: "/planner" },
      ],
      coachSignals: [
        { insight: "Zentric needs your goal before it can personalize the dashboard.", action: "Set goal", href: "/ai-coach" },
        { insight: "After AI Coach setup, Planner, Learning Mode, Second Brain, and Career Hub will connect automatically.", action: "Start", href: "/ai-coach" },
      ],
      knowledgeRetention: [
        { label: "Retention Score", value: "0%" },
        { label: "Topics Forgotten", value: "0" },
        { label: "Topics To Revise", value: "0" },
        { label: "Flashcards Due Today", value: "0" },
        { label: "Revision Streak", value: "0 days" },
      ],
      learningAnalytics: [
        { label: "Topics Mastered", value: "0" },
        { label: "Topics In Progress", value: "0" },
        { label: "Weakest Topic", value: "Goal not set" },
        { label: "Longest Learning Streak", value: "0 days" },
        { label: "Most Consistent Week", value: "Start today" },
        { label: "Learning Velocity", value: "+0%" },
      ],
      leetcodeInsights: [
        { label: "Problems Solved", value: "Connect profile" },
        { label: "Current Streak", value: "Not connected" },
        { label: "Contest Rating", value: "No rating yet" },
        { label: "Strongest Pattern", value: "After practice" },
        { label: "Weakest Pattern", value: "After practice" },
        { label: "Acceptance Rate", value: "Sync LeetCode" },
        { label: "Predicted Rating in 30 days", value: "After sync" },
        { label: "Target readiness", value: "Mission 0%" },
      ],
      secondBrainSummary: [
        { label: "Notes Created", value: "0" },
        { label: "Knowledge Connections", value: "0" },
        { label: "Flashcards Generated", value: "0" },
        { label: "Interview Notes", value: "0" },
        { label: "AI Summaries", value: "0" },
        { label: "Recent Learning", value: "No recent note yet" },
      ],
      careerProgress: [
        { label: "Resume Score", value: 0 },
        { label: "ATS Score", value: 0 },
        { label: "Projects Completed", value: 0 },
        { label: "GitHub Activity", value: 0 },
        { label: "LinkedIn Optimization", value: 0 },
        { label: "Interview Readiness", value: 0 },
      ],
      focus: {
        topic: "AI Coach Setup",
        priority: "High",
        estimatedTime: "5 min",
        reason: "Zentric needs your mission before it can decide today's best action.",
      },
      motivation: "Start by setting one clear mission. Zentric will turn it into a roadmap, planner, learning sessions, and career proof.",
      recentAchievements: ["Account created", "Zentric is ready to build your growth system"],
      scoreEvidence: {
        taskScore: 0,
        studyScore: 0,
        codingScore: 0,
        leetcodeScore: 0,
        connectedCodingScore: 0,
        learningQualityScore: 0,
        secondBrainScore: 0,
        resumeCareer: "waiting for Career Hub data",
        progressEvents: 0,
        learningSteps: 0,
        interviews: 0,
      },
    };
  }
  const learningStepEvents = events.filter((event) => event.type === "learning_step_completed");
  const codingPassedEvents = events.filter((event) =>
    ["coding_run_passed", "coding_problem_solved", "study_question_set_completed"].includes(event.type),
  );
  const noteMemoryEvents = events.filter((event) => event.type === "note_created" || event.type === "note_updated");
  const interviewCompletedEvents = events.filter((event) => event.type === "interview_simulation_completed");
  const learningQualityScores = learningStepEvents
    .map((event) => {
      const metadata = event.metadata as { score?: unknown } | null;
      const score = Number(metadata?.score);
      return Number.isFinite(score) ? score : null;
    })
    .filter((score): score is number => score !== null);
  const codingQualityScores = events
    .filter((event) => event.type === "coding_run_passed" || event.type === "coding_run_failed")
    .map((event) => {
      const metadata = event.metadata as { score?: unknown } | null;
      const score = Number(metadata?.score);
      return Number.isFinite(score) ? score : null;
    })
    .filter((score): score is number => score !== null);
  const learningSignalScore = clamp(average(learningQualityScores, learningStepEvents.length ? 65 : 0));
  const completedInterviewSessions = interviewSessions.filter((session) => session.status === "completed");
  const averageInterviewSessionScore = average(
    completedInterviewSessions
      .map((session) => session.averageScore)
      .filter((score): score is number => typeof score === "number"),
    0,
  );

  const taskScore = percent(completedTasks.length, tasks.length, tasks.length ? 0 : 35);
  const goalScore = clamp(
    average(
      goals.map((goal) => (goal.target > 0 ? (goal.progress / goal.target) * 100 : goal.progress)),
      goals.length ? 0 : 40,
    ),
  );
  const studyScore = clamp(
    average(
      studyTopics.map((topic) =>
        topic.status === "completed" ? 100 : topic.status === "in_progress" ? 55 : 12,
      ),
      studyTopics.length ? 0 : 35,
    ),
  );
  const dsaStudyScore = clamp(
    average(
      dsaTopics.map((topic) =>
        topic.status === "completed" ? 100 : topic.status === "in_progress" ? 58 : 15,
      ),
      40,
    ),
  );
  const csScore = clamp(
    average(
      csTopics.map((topic) =>
        topic.status === "completed" ? 100 : topic.status === "in_progress" ? 55 : 18,
      ),
      studyTopics.length ? studyScore * 0.85 : 35,
    ),
  );
  const noteCategoryCoverage = new Set(notes.map((note) => note.category)).size;
  const secondBrainScore = clamp(
    Math.min(notes.length, 20) * 3 +
      Math.min(recentNotes.length, 8) * 4 +
      Math.min(noteCategoryCoverage, 5) * 8 +
      Math.min(noteMemoryEvents.length, 12) * 1.5,
  );
  const leetcodeScore = leetcode
    ? clamp(
        Math.min(leetcode.totalSolved, 220) * 0.26 +
          Math.min(leetcode.mediumSolved, 100) * 0.22 +
          Math.min(leetcode.hardSolved, 35) * 0.42 +
          Math.min(leetcode.recentSolved, 12) * 1.3,
      )
    : dsaStudyScore;
  const codingScore = clamp(leetcode ? leetcodeScore * 0.75 + dsaStudyScore * 0.25 : dsaStudyScore);
  const practiceProgressScore = clamp(Math.min(practiceProgress.length, 75) * 1.2 + Math.min(codingPassedEvents.length, 40) * 1.4);
  const codingActivityScore = clamp(average(codingQualityScores, codingPassedEvents.length ? 70 : 0));
  const connectedCodingScore = clamp(codingScore * 0.62 + practiceProgressScore * 0.24 + codingActivityScore * 0.14);

  const projectNotes = notes.filter((note) => note.category === "project");
  const projectTasks = tasks.filter((task) => includesAny(`${task.title} ${task.description ?? ""}`, ["project", "portfolio", "github"]));
  const projectGoals = goals.filter((goal) => includesAny(goal.title, ["project", "portfolio", "github", "build"]));
  const projectScore = clamp(
    Math.min(projectNotes.length, 6) * 11 +
      percent(projectTasks.filter((task) => task.completed).length, projectTasks.length, projectTasks.length ? 0 : 24) * 0.35 +
      average(projectGoals.map((goal) => (goal.target ? (goal.progress / goal.target) * 100 : goal.progress)), 20) * 0.35,
  );

  const resumeSignals = [...tasks.map((task) => task.title), ...goals.map((goal) => goal.title), ...notes.map((note) => note.title)].filter(
    (value) => includesAny(value, ["resume", "ats", "linkedin", "cv"]),
  );
  const interviewNotes = notes.filter((note) => note.category === "interview");
  const careerAnalysis = analyzeCareerProfile(careerProfile);
  const resumeScore = careerAnalysis.resumeScore ?? clamp(35 + Math.min(resumeSignals.length, 8) * 7 + Math.min(interviewNotes.length, 5) * 3);
  const interviewScore = clamp(
    connectedCodingScore * 0.34 +
      csScore * 0.2 +
      resumeScore * 0.13 +
      Math.min(interviewNotes.length, 10) * 2.5 +
      Math.min(interviewCompletedEvents.length, 8) * 4 +
      averageInterviewSessionScore * 0.13,
  );
  const behavioralScore = clamp(
    35 +
      Math.min(
        notes.filter((note) => includesAny(`${note.title} ${note.content}`, ["behavioral", "star", "leadership", "story"])).length,
        8,
      ) *
        7 +
      Math.min(interviewNotes.length, 5) * 3,
  );

  const missionBreakdown = [
    { label: "Coding", value: connectedCodingScore, color: "#60a5fa", source: leetcode ? "LeetCode + Coding Hub + Study Tracker" : "Coding Hub + Study Tracker" },
    { label: "CS Fundamentals", value: csScore, color: "#a78bfa", source: "Study Tracker topics" },
    { label: "Projects", value: projectScore, color: "#22d3ee", source: "Project notes, goals and tasks" },
    { label: "Resume", value: resumeScore, color: "#34d399", source: "Resume/ATS/LinkedIn signals" },
    { label: "Interview Skills", value: interviewScore, color: "#f472b6", source: "Coding, CS and interview notes" },
    { label: "Behavioral", value: behavioralScore, color: "#facc15", source: "Interview and behavioral notes" },
  ];

  const weightedGrowthScore = clamp(
    connectedCodingScore * 0.24 +
      csScore * 0.17 +
      projectScore * 0.14 +
      resumeScore * 0.14 +
      interviewScore * 0.17 +
      secondBrainScore * 0.08 +
      taskScore * 0.04 +
      goalScore * 0.02,
  );
  const weakestArea = [...missionBreakdown].sort((a, b) => a.value - b.value)[0]!;
  const strongestArea = [...missionBreakdown].sort((a, b) => b.value - a.value)[0]!;
  const careerRole = careerProfile?.dreamRole?.trim();
  const careerCompany = careerProfile?.targetCompany?.trim();
  const hasCareerMission =
    Boolean(careerRole && careerRole !== "Your Dream Role") ||
    Boolean(careerCompany && careerCompany !== "Your Target Company");
  const currentMission =
    goals[0]?.title ??
    (hasCareerMission
      ? [careerRole && careerRole !== "Your Dream Role" ? careerRole : null, careerCompany && careerCompany !== "Your Target Company" ? `at ${careerCompany}` : null]
          .filter(Boolean)
          .join(" ")
      : "Set your growth mission in AI Coach");
  const readinessLabel =
    weightedGrowthScore >= 85
      ? "Interview ready"
      : weightedGrowthScore >= 70
        ? "Interview warm-up"
        : weightedGrowthScore >= 50
          ? "Building momentum"
          : "Foundation phase";
  const dailyGain = weightedGrowthScore >= 70 ? 1.4 : weightedGrowthScore >= 50 ? 1.8 : 2.2;
  const estimatedDaysRemaining = Math.max(7, Math.ceil((100 - weightedGrowthScore) / dailyGain));
  const estimatedStudyHoursToday = Math.max(
    1.5,
    Math.min(
      5,
      1.5 +
        pendingTasks.filter((task) => task.priority === "high").length * 0.6 +
        pendingTasks.filter((task) => task.priority === "medium").length * 0.35 +
        (weakestArea.value < 65 ? 0.75 : 0.25),
    ),
  );

  const recommendations = [
    weakestArea.label === "Coding" ? "Solve 2 Graph problems" : `Improve ${weakestArea.label}`,
    csScore < 70 ? "Complete Operating Systems revision" : "Review CS fundamentals flashcards",
    connectedCodingScore < 75 ? "Revise Dynamic Programming" : "Maintain coding streak",
    resumeScore < 75 ? "Improve Resume Projects" : "Add one achievement to Second Brain",
  ];

  const targetCompany = careerCompany && careerCompany !== "Your Target Company" ? careerCompany : null;
  const roleSpecificTopics = includesAny(careerRole ?? "", ["upsc", "ias", "civil"])
    ? ["Current affairs depth", "GS revision", "Mock tests"]
    : includesAny(careerRole ?? "", ["jee", "neet", "gate", "cat"])
      ? ["Core syllabus mastery", "Timed practice", "Revision accuracy"]
      : includesAny(careerRole ?? "", ["design", "ui", "ux"])
        ? ["Portfolio case studies", "Design critique", "Product thinking"]
        : ["Target skills", "Project proof", "Mock interviews"];
  const companyProfiles = targetCompany
    ? [
        { company: targetCompany, base: 0, topics: roleSpecificTopics },
        { company: "Dream Role", base: -3, topics: ["Role fundamentals", "Project proof", "Interview practice"] },
        { company: "Current Mission", base: -5, topics: ["Weakest area", "Revision loop", "Daily execution"] },
      ]
    : [
        { company: "Dream Mission", base: 0, topics: ["Set target role", "Upload resume/proof", "Start daily mission"] },
        { company: "Learning Readiness", base: -3, topics: ["Roadmap setup", "Study tracker", "Revision loop"] },
        { company: "Career Readiness", base: -5, topics: ["Resume proof", "Interview practice", "Project evidence"] },
      ];

  const companyReadiness = companyProfiles.map((profile) => {
    const readiness = clamp(
        connectedCodingScore * 0.32 +
        csScore * 0.2 +
        projectScore * 0.14 +
        resumeScore * 0.14 +
        interviewScore * 0.14 +
        behavioralScore * 0.06 +
        profile.base,
    );
    const missing = profile.topics.filter((topic) => {
      if (includesAny(topic, ["graph", "dynamic", "dp"])) return connectedCodingScore < 78;
      if (includesAny(topic, ["system", "os", "distributed", "rate"])) return csScore < 75;
      if (includesAny(topic, ["project", "portfolio"])) return projectScore < 75;
      if (includesAny(topic, ["behavioral", "leadership"])) return behavioralScore < 75;
      return true;
    });

    return {
      company: profile.company,
      readiness,
      weakest: weakestArea.label,
      prepTime: `${Math.max(10, Math.ceil((100 - readiness) / 1.25))} days`,
      missing: missing.length ? missing : [weakestArea.label, "Mock interview polish"],
      roadmap: [
        `Raise ${weakestArea.label} from ${weakestArea.value}% to ${Math.min(100, weakestArea.value + 12)}%.`,
        `Use ${strongestArea.label} strength (${strongestArea.value}%) to create stronger interview answers.`,
        `Complete ${Math.max(2, Math.ceil((100 - readiness) / 12))} focused practice loops for ${profile.company}.`,
      ],
    };
  });

  const dueTopics = studyTopics
    .filter((topic) => topic.status !== "completed")
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  const staleCompletedTopic = completedTopics.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())[0];
  const forgottenDays = staleCompletedTopic ? daysAgo(staleCompletedTopic.updatedAt) : 0;
  const focusTopic =
    dueTopics.find((topic) => includesAny(topic.name, ["graph", "dp", "system", "os"]))?.name ??
    (weakestArea.label === "Coding" ? "Graphs" : weakestArea.label);

  const growthPlan = [
    {
      time: "9:00",
      title: `${focusTopic} Revision`,
      duration: "35 min",
      priority: "High",
      impact: "+0.4%",
      href: "/study",
    },
    {
      time: "10:00",
      title: connectedCodingScore < 75 ? "Practice Your Weakest Topic" : "Solve Targeted Challenge",
      duration: "60 min",
      priority: "Critical",
      impact: "+1.1%",
      href: leetcode ? "/leetcode" : "/coding-hub",
    },
    {
      time: "11:30",
      title: resumeScore < 75 ? "Resume Project Metrics" : "Second Brain Career Note",
      duration: "40 min",
      priority: "High",
      impact: "+0.6%",
      href: resumeScore < 75 ? "/planner" : "/notes",
    },
    {
      time: "2:00",
      title: csScore < 70 ? "Operating Systems Reading" : "System Design Reading",
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

  const coachSignals = [
    {
      insight: staleCompletedTopic
        ? `You haven't revised ${staleCompletedTopic.name} for ${forgottenDays} days.`
        : "Add completed study topics so Zentric can track revision gaps.",
      action: "Revise",
      href: "/study",
    },
    {
      insight: `${strongestArea.label} is ${strongestArea.value}%. Focus next on ${weakestArea.label}.`,
      action: weakestArea.label === "Coding" ? "Practice" : "Review",
      href: weakestArea.label === "Coding" ? "/coding-hub" : "/planner",
    },
    {
      insight: leetcode
        ? `Your LeetCode profile has ${leetcode.totalSolved} solved problems and Zentric has ${practiceProgress.length} tracked Coding Hub completions.`
        : `Coding Hub has ${practiceProgress.length} tracked study completions. Connect LeetCode for an external signal too.`,
      action: leetcode ? "Practice" : "Connect",
      href: "/leetcode",
    },
    {
      insight:
        resumeScore < 75
          ? "Your resume project section needs more measurable impact signals."
          : "Your resume signals are improving. Keep adding project outcomes.",
      action: "Review",
      href: "/planner",
    },
  ];

  const flashcardsDue = Math.max(
    0,
    studyTopics.filter((topic) => topic.status !== "completed" || daysAgo(topic.updatedAt) >= 7).length * 3,
  );
  const retentionScore = clamp(
    100 -
      Math.min(45, dueTopics.length * 5) -
      Math.min(25, completedTopics.filter((topic) => daysAgo(topic.updatedAt) >= 10).length * 4) +
      Math.min(16, recentStudyUpdates.length * 3) +
      Math.min(14, learningStepEvents.length * 2 + learningSignalScore / 12),
  );

  const noteCategories = {
    interview: notes.filter((note) => note.category === "interview").length,
    project: notes.filter((note) => note.category === "project").length,
    learning: notes.filter((note) => note.category === "learning").length,
    research: notes.filter((note) => note.category === "research").length,
    second_brain: notes.filter((note) => note.category === "second_brain").length,
  };

  const achievements = [
    recentCompletedTasks.length ? `Completed ${recentCompletedTasks.length} growth tasks this week` : "Created your AI Growth Mission",
    leetcode ? `Reached ${leetcode.totalSolved} LeetCode problems` : `Tracked ${completedTopics.length} study topics`,
    projectNotes.length ? `Documented ${projectNotes.length} project notes` : "Started project readiness tracking",
    interviewNotes.length ? `Created ${interviewNotes.length} interview notes` : "Interview readiness engine activated",
    goals.length ? `Tracking ${goals.length} career goals` : "Dashboard connected to your growth system",
  ];

  return {
    currentMission,
    growthScore: weightedGrowthScore,
    currentReadiness: readinessLabel,
    estimatedDaysRemaining,
    estimatedStudyHoursToday: Number(estimatedStudyHoursToday.toFixed(1)),
    readinessIncrease: clamp(1.2 + (100 - weightedGrowthScore) / 35, 1, 4),
    recommendations,
    missionProgress: {
      mission: currentMission,
      overallProgress: weightedGrowthScore,
      breakdown: missionBreakdown,
    },
    companyReadiness,
    growthPlan,
    coachSignals,
    knowledgeRetention: [
      { label: "Retention Score", value: `${retentionScore}%` },
      { label: "Topics Forgotten", value: String(completedTopics.filter((topic) => daysAgo(topic.updatedAt) >= 10).length) },
      { label: "Topics To Revise", value: String(dueTopics.length) },
      { label: "Flashcards Due Today", value: String(flashcardsDue) },
      { label: "Revision Streak", value: `${Math.min(21, recentStudyUpdates.length + recentCompletedTasks.length)} days` },
    ],
    learningAnalytics: [
      { label: "Topics Mastered", value: String(completedTopics.length) },
      { label: "Topics In Progress", value: String(inProgressTopics.length) },
      { label: "Weakest Topic", value: focusTopic },
      { label: "Longest Learning Streak", value: `${Math.min(30, recentStudyUpdates.length + completedTopics.length)} days` },
      { label: "Most Consistent Week", value: recentStudyUpdates.length >= 5 ? "This week" : "Building" },
      {
        label: "Learning Velocity",
        value: `+${Math.max(
          1,
          recentStudyUpdates.length * 3 +
            recentCompletedTasks.length * 2 +
            learningStepEvents.length +
            Math.round(learningSignalScore / 25),
        )}%`,
      },
    ],
    leetcodeInsights: [
      { label: "Problems Solved", value: leetcode ? String(leetcode.totalSolved) : "Connect profile" },
      { label: "Current Streak", value: leetcode ? `${Math.min(leetcode.recentSolved, 14)} days` : "Not connected" },
      { label: "Contest Rating", value: leetcode?.contestRating ? String(leetcode.contestRating) : "No rating yet" },
      { label: "Strongest Pattern", value: strongestArea.label === "Coding" ? "Arrays / DSA" : strongestArea.label },
      { label: "Weakest Pattern", value: weakestArea.label === "Coding" ? "Graphs" : weakestArea.label },
      { label: "Acceptance Rate", value: leetcode?.acceptanceRate ? `${leetcode.acceptanceRate}%` : "Sync LeetCode" },
      {
        label: "Predicted Rating in 30 days",
        value: leetcode?.contestRating ? String(leetcode.contestRating + Math.max(35, Math.round((100 - connectedCodingScore) * 2.2))) : "After sync",
      },
      { label: "Target readiness", value: `${companyReadiness[0]?.company ?? "Mission"} ${companyReadiness[0]?.readiness ?? weightedGrowthScore}%` },
    ],
    secondBrainSummary: [
      { label: "Notes Created", value: String(notes.length) },
      { label: "Knowledge Connections", value: String(Math.max(0, notes.length * 2 + noteCategoryCoverage * 4)) },
      { label: "Flashcards Generated", value: String(Math.max(0, notes.length * 3 + completedTopics.length + noteMemoryEvents.length)) },
      { label: "Interview Notes", value: String(noteCategories.interview + completedInterviewSessions.length) },
      { label: "AI Summaries", value: String(notes.filter((note) => note.content.length > 400).length) },
      { label: "Recent Learning", value: recentNotes[0]?.title ?? "No recent note yet" },
    ],
    careerProgress: [
      { label: "Resume Score", value: resumeScore },
      { label: "ATS Score", value: clamp(resumeScore * 0.9 + projectScore * 0.1) },
      { label: "Projects Completed", value: projectScore },
      { label: "GitHub Activity", value: clamp(projectScore * 0.7 + connectedCodingScore * 0.3) },
      { label: "LinkedIn Optimization", value: clamp(resumeScore * 0.75 + secondBrainScore * 0.25) },
      { label: "Interview Readiness", value: interviewScore },
    ],
    focus: {
      topic: focusTopic,
      priority: weakestArea.value < 65 ? "High" : "Medium",
      estimatedTime: weakestArea.value < 65 ? "90 min" : "60 min",
      reason: `${weakestArea.label} is currently your weakest career-readiness area.`,
    },
    motivation:
      weightedGrowthScore >= 70
        ? `You've built real momentum. Your strongest area is ${strongestArea.label} at ${strongestArea.value}%.`
        : `Keep going. Improving ${weakestArea.label} today will create the fastest visible progress.`,
    recentAchievements: achievements,
    sources: {
      planner: tasks.length,
      studyTracker: studyTopics.length,
      secondBrain: notes.length,
      goals: goals.length,
      leetcode: leetcode ? leetcode.username : null,
      codingHub: `${practiceProgress.length} database-tracked practice completion${practiceProgress.length === 1 ? "" : "s"} plus ${codingPassedEvents.length} coding event${codingPassedEvents.length === 1 ? "" : "s"}`,
      resumeCareer: "derived from Career Hub resume analysis, interview sessions, project tasks/goals/notes",
      progressEvents: recentEvents.length,
      learningSteps: learningStepEvents.length,
      interviews: completedInterviewSessions.length,
    },
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [tasks, notes, studyTopics, goals, settings, careerProfile, practiceProgress, events, interviewSessions] = await Promise.all([
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.studyTopic.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
    dashboardDb.careerProfile.findUnique({ where: { userId } }),
    dashboardDb.studyPracticeProgress.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
    dashboardDb.coachEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    dashboardDb.interviewSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  const leetcode = await fetchLeetCodeStats(settings?.leetcodeUsername);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const completedTopics = studyTopics.filter((topic) => topic.status === "completed").length;

  const productivityScore = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const upcomingDeadlines = tasks
    .filter((task) => !task.completed && task.deadline)
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
    growth: buildGrowthEngine({
      tasks,
      notes,
      studyTopics,
      goals,
      leetcode,
      careerProfile,
      practiceProgress,
      events,
      interviewSessions,
    }),
  });
}
