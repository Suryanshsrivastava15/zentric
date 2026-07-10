import { prisma } from "@/lib/prisma";
import { analyzeCareerProfile } from "@/lib/career-engine";

type StudyTopicRecord = Awaited<ReturnType<typeof prisma.studyTopic.findMany>>[number];

type CoachEventInput = {
  type: string;
  module: string;
  title: string;
  detail?: string;
  impact?: number;
  metadata?: Record<string, unknown>;
  goalKey?: string;
};

type CoachMemoryInput = {
  careerGoal?: string;
  dreamCompany?: string;
  educationStage?: string;
  schoolClass?: string;
  engineeringYear?: string;
  graduationStatus?: string;
  skillLevel?: string;
  preferredLanguage?: string;
  dailyStudyMinutes?: number | null;
  targetDeadline?: Date | null;
  strongTopics?: string;
  weakTopics?: string;
};

type CoachMemoryRecord = {
  id: string;
  userId: string;
  goalKey: string;
  isActive: boolean;
  careerGoal: string | null;
  dreamCompany: string | null;
  educationStage: string | null;
  schoolClass: string | null;
  engineeringYear: string | null;
  graduationStatus: string | null;
  skillLevel: string | null;
  preferredLanguage: string | null;
  learningStyle: string | null;
  dailyStudyMinutes: number | null;
  targetDeadline: Date | null;
  strongTopics: string | null;
  weakTopics: string | null;
  currentPhase: string | null;
  roadmapStartedAt: Date | null;
  lastMissionGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const coachDb = prisma as typeof prisma & {
  coachEvent: {
    create(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<Array<{
      id: string;
      type: string;
      module: string;
      title: string;
      detail: string | null;
      impact: number;
      metadata: unknown;
      createdAt: Date;
      userId: string;
    }>>;
  };
  coachMemory: {
    findUnique(args: unknown): Promise<CoachMemoryRecord | null>;
    findFirst(args: unknown): Promise<CoachMemoryRecord | null>;
    findMany(args: unknown): Promise<CoachMemoryRecord[]>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<unknown>;
    upsert(args: unknown): Promise<unknown>;
  };
  coachRecommendationFeedback: {
    create(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<Array<{
      id: string;
      recommendationTitle: string;
      module: string;
      rating: string;
      reason: string | null;
      createdAt: Date;
      userId: string;
    }>>;
  };
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

function scoreStudyTopic(topic: StudyTopicRecord) {
  if (topic.status === "completed") return 100;
  if (topic.status === "in_progress") return 58;
  return 15;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function buildGoalKey(careerGoal?: string | null, dreamCompany?: string | null) {
  const goalPart = slugify(careerGoal || "general-goal") || "general-goal";
  const companyPart = slugify(dreamCompany || "general") || "general";
  return `${goalPart}-${companyPart}`.slice(0, 140);
}

function eventGoalKey(event: { metadata: unknown }) {
  const metadata = event.metadata as { goalKey?: unknown } | null;
  return typeof metadata?.goalKey === "string" ? metadata.goalKey : null;
}

async function getActiveCoachMemory(userId: string) {
  return (
    (await coachDb.coachMemory.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await coachDb.coachMemory.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }))
  );
}

function buildOnboardingStatus(memory: CoachMemoryRecord | null, goalTrack: ReturnType<typeof inferGoalTrack>) {
  const missing: string[] = [];
  if (!memory?.careerGoal) missing.push("Career goal");
  if (!memory?.educationStage) missing.push("Current stage");
  if (memory?.educationStage === "school" && !memory.schoolClass) missing.push("Class");
  if (memory?.educationStage === "engineering" && !memory.engineeringYear) missing.push("Engineering year");
  if (memory?.educationStage === "graduated" && !memory.graduationStatus) missing.push("Graduation status");
  if (goalTrack.questionMode === "coding" && !memory?.preferredLanguage) missing.push("Preferred language");
  if (!memory?.skillLevel) missing.push("Skill level");
  if (!memory?.dailyStudyMinutes) missing.push("Daily study minutes");
  if (!memory?.targetDeadline) missing.push("Target date");
  if (!memory?.weakTopics) missing.push("Weak topics");

  const totalChecks = missing.length + 1;
  const completionPercent = clamp(((totalChecks - missing.length) / totalChecks) * 100);

  return {
    complete: missing.length === 0,
    completionPercent,
    missing,
    message: missing.length
      ? `Add ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""} to make the Coach more accurate.`
      : "Your Coach has enough context to personalize roadmap, planner, revision, and career readiness.",
  };
}

function buildRevisionQueue({
  roadmap,
  learningStepEvents,
  visitedEvents,
  dailyPlan,
}: {
  roadmap: ReturnType<typeof buildRoadmap>;
  learningStepEvents: Array<{ createdAt: Date; metadata: unknown }>;
  visitedEvents: Array<{ createdAt: Date; metadata: unknown }>;
  dailyPlan: Array<{ id: string; title: string; phase: string; questions: string[] }>;
}) {
  const topics = roadmap.flatMap((phase) => phase.topics.map((topic) => ({ ...topic, phase: phase.phase })));
  const latestByTopic = new Map<string, { topicId: string; topicTitle: string; phase: string; updatedAt: Date; steps: Set<string> }>();

  [...visitedEvents, ...learningStepEvents].forEach((event) => {
    const metadata = event.metadata as { topicId?: string; topicTitle?: string; phase?: string; stepId?: string } | null;
    if (!metadata?.topicId) return;
    const topic = topics.find((item) => item.id === metadata.topicId);
    const existing = latestByTopic.get(metadata.topicId);
    const next = existing ?? {
      topicId: metadata.topicId,
      topicTitle: metadata.topicTitle ?? topic?.title ?? "Roadmap topic",
      phase: metadata.phase ?? topic?.phase ?? "Roadmap",
      updatedAt: event.createdAt,
      steps: new Set<string>(),
    };
    if (event.createdAt > next.updatedAt) next.updatedAt = event.createdAt;
    if (metadata.stepId) next.steps.add(metadata.stepId);
    latestByTopic.set(metadata.topicId, next);
  });

  const dueItems = Array.from(latestByTopic.values())
    .map((item) => {
      const daysSince = daysAgo(item.updatedAt);
      return {
        topicId: item.topicId,
        topicTitle: item.topicTitle,
        phase: item.phase,
        daysSince,
        due: daysSince >= 1,
        reason:
          daysSince >= 7
            ? "7-day retention check is overdue."
            : daysSince >= 3
              ? "3-day spaced revision is due."
              : daysSince >= 1
                ? "24-hour revision is due."
                : "Learned today. Quick recall tomorrow will lock it in.",
        actions: ["5 flashcards", "5-question quiz", "2 practice questions"],
        quiz: buildTopicQuiz(item.topicTitle, "your active goal", true).slice(0, 3),
      };
    })
    .sort((a, b) => Number(b.due) - Number(a.due) || b.daysSince - a.daysSince)
    .slice(0, 4);

  if (dueItems.length) return dueItems;

  const starter = dailyPlan[0];
  return starter
    ? [
        {
          topicId: starter.id,
          topicTitle: starter.title,
          phase: starter.phase,
          daysSince: 0,
          due: false,
          reason: "Complete this topic in Learning Mode to unlock automatic spaced revision.",
          actions: ["Start learning session", "Finish quiz", "Submit reflection"],
          quiz: starter.questions.slice(0, 3),
        },
      ]
    : [];
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function resourceSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildTopicQuiz(topic: string, goal: string, isCoding: boolean) {
  if (isCoding) {
    return [
      `MCQ: In ${topic}, what should you usually optimize first?\nA) Only syntax\nB) Correctness and edge cases\nC) Variable names only\nD) UI design\nCorrect: B`,
      `MCQ: Which input is most important to test for ${topic}?\nA) Only the sample input\nB) Empty/minimum input\nC) Only very large input\nD) No input\nCorrect: B`,
      `MCQ: If a ${topic} solution fails on duplicates, what should you check first?\nA) Delete the solution\nB) State handling and edge cases\nC) Change the font\nD) Ignore the failed case\nCorrect: B`,
      `MCQ: What proves you understand ${topic} well enough for ${goal}?\nA) You can explain the pattern, complexity, and edge cases\nB) You only remember the problem title\nC) You watched one video passively\nD) You avoid testing\nCorrect: A`,
      `MCQ: After solving a ${topic} problem, what should you record in Zentric?\nA) Mistake, approach, complexity, and revision trigger\nB) Nothing\nC) Only the final answer\nD) Only the date\nCorrect: A`,
    ];
  }

  return [
    `MCQ: What is the first thing to identify while studying ${topic} for ${goal}?\nA) Core definition and why it matters\nB) Random facts only\nC) Skip basics\nD) Memorize without context\nCorrect: A`,
    `MCQ: Which method best tests your understanding of ${topic}?\nA) Reading once\nB) Writing an answer or solving a PYQ\nC) Only highlighting notes\nD) Ignoring mistakes\nCorrect: B`,
    `MCQ: How should you connect ${topic} with real performance?\nA) Add examples, PYQs, mistakes, and revision notes\nB) Only watch videos\nC) Avoid practice\nD) Delete weak areas\nCorrect: A`,
    `MCQ: What should happen after you get a ${topic} question wrong?\nA) Mark the mistake, revise the concept, and retry later\nB) Skip the topic forever\nC) Hide the error\nD) Only change the notebook color\nCorrect: A`,
    `MCQ: What proves ${topic} is becoming exam-ready?\nA) You can recall, explain, apply, and review mistakes\nB) You vaguely remember the title\nC) You copied notes once\nD) You skipped revision\nCorrect: A`,
  ];
}

function buildTopicLearningKit(topic: string, goal: string, company: string, track: ReturnType<typeof inferGoalTrack>, phase: string) {
  const isCoding = track.questionMode === "coding";
  return {
    difficulty: phase === "Foundation" ? "Beginner" : phase.includes("Readiness") || phase.includes("Advanced") ? "Advanced" : "Intermediate",
    estimatedTime: phase === "Foundation" ? "2-3 days" : phase.includes("Readiness") ? "3-5 days" : "4 days",
    prerequisites:
      phase === "Foundation"
        ? ["Consistency", "Basic reading habit"]
        : isCoding
          ? ["Foundation concepts", "Problem solving basics"]
          : ["Foundation notes", "Daily revision habit"],
    notes: `Master ${topic} for ${goal} by learning the core idea, writing short notes, practicing questions, and revising mistakes within 24 hours.`,
    cheatSheet: [
      `Definition and purpose of ${topic}`,
      `Most common patterns asked in ${goal}`,
      "Mistakes to avoid",
      "Revision triggers",
    ],
    flashcards: [
      { front: `What is ${topic}?`, back: `Explain ${topic} in simple language and connect it to ${goal}.` },
      { front: `Why is ${topic} important?`, back: `${topic} improves readiness for ${goal} because it appears in practice, revision, and evaluation.` },
      { front: `What is one common mistake in ${topic}?`, back: "Skipping fundamentals before practice. Revise notes before solving." },
    ],
    quiz: buildTopicQuiz(topic, goal, isCoding),
    miniProject: isCoding
      ? `Build a small ${topic} demo or solver in ${goal.includes("Data") ? "Python" : "your preferred language"}.`
      : `Create a one-page ${topic} revision sheet with examples, PYQs, and mistakes.`,
    finalProject: isCoding
      ? `Add ${topic} into a portfolio-grade project connected to ${goal}.`
      : `Create a full ${topic} mastery file with notes, quiz answers, PYQs, and revision checkpoints.`,
    interviewQuestions: isCoding
      ? [`Explain ${topic} to an interviewer.`, `Where did you use ${topic} in a project?`, `What is the hardest ${topic} problem you solved?`]
      : [`Explain ${topic} in an exam answer.`, `Connect ${topic} with current affairs.`, `Write a short analytical answer on ${topic}.`],
    revisionNotes: `Revise ${topic} after 1 day, 3 days, and 7 days. Focus on mistakes, definitions, and application questions.`,
    companyQuestions: isCoding
      ? [`${company} style ${topic} question`, `Medium ${topic} interview problem`, `${topic} project discussion`]
      : [`${goal} PYQ on ${topic}`, `${topic} mock question`, `${topic} answer-writing prompt`],
    docsUrl: resourceSearchUrl(`${topic} ${goal} official documentation syllabus`),
    githubUrl: resourceSearchUrl(`${topic} ${goal} github examples`),
    bookSuggestions: isCoding
      ? ["Cracking the Coding Interview", "Grokking Algorithms", "System Design Primer"]
      : ["NCERT basics", "Standard reference book for this subject", "Previous year question compilation"],
    aiExplanation: `${topic} is part of your ${track.title} track. Zentric will move you through video, notes, quiz, practice, project, reflection, and revision so this topic becomes usable, not just watched.`,
  };
}

function getStageLabel(memory: {
  educationStage: string | null;
  schoolClass: string | null;
  engineeringYear: string | null;
  graduationStatus: string | null;
}) {
  if (memory.educationStage === "school") return `School${memory.schoolClass ? ` · Class ${memory.schoolClass}` : ""}`;
  if (memory.educationStage === "diploma") return "Diploma Student";
  if (memory.educationStage === "college") return "College Student";
  if (memory.educationStage === "engineering") return `Engineering${memory.engineeringYear ? ` · ${memory.engineeringYear}` : ""}`;
  if (memory.educationStage === "graduated") return `Graduated${memory.graduationStatus ? ` · ${memory.graduationStatus}` : ""}`;
  if (memory.educationStage === "working") return "Working Professional";
  return "Not set";
}

function inferGoalTrack(goal: string, company: string) {
  const text = `${goal} ${company}`.toLowerCase();

  if (includesAny(text, ["upsc", "ias", "ips", "civil service", "civil services", "cse exam"])) {
    return {
      id: "upsc",
      title: "UPSC Civil Services",
      defaultWeakTopic: "Indian Polity",
      defaultStrongTopic: "Current Affairs",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["NCERT fundamentals", "Current affairs habit", "Basic Indian Polity"], project: "Build a daily current affairs and NCERT revision notebook" },
        { phase: "Core Syllabus", topics: ["Modern Indian History", "Indian Geography", "Indian Economy basics"], project: "Create GS subject-wise micro notes with weekly revision checkpoints" },
        { phase: "Mains Preparation", topics: ["Mains answer writing", "Ethics and essay practice", "Optional subject planning"], project: "Maintain an answer-writing portfolio with evaluated model answers" },
        { phase: "Exam Readiness", topics: ["Prelims mock tests", "CSAT practice", "Full-length mains test series"], project: "Run a mock-test tracker with mistakes, revision loops, and score trends" },
      ],
    };
  }

  if (includesAny(text, ["jee", "iit jee", "joint entrance"])) {
    return {
      id: "jee",
      title: "JEE Preparation",
      defaultWeakTopic: "Physics problem solving",
      defaultStrongTopic: "Math fundamentals",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Physics fundamentals", "Chemistry basics", "Mathematics fundamentals"], project: "Create a formula book and concept-error notebook" },
        { phase: "Core Practice", topics: ["Mechanics", "Organic Chemistry", "Calculus and Algebra"], project: "Build a chapter-wise practice tracker with accuracy analysis" },
        { phase: "Advanced Practice", topics: ["Advanced mixed problems", "Previous year questions", "Time-bound practice"], project: "Maintain a test-analysis journal for repeated mistake patterns" },
        { phase: "Exam Readiness", topics: ["Full mock tests", "Weak chapter revision", "Speed and accuracy drills"], project: "Run weekly mock reviews with target score improvement" },
      ],
    };
  }

  if (includesAny(text, ["neet", "medical entrance", "mbbs"])) {
    return {
      id: "neet",
      title: "NEET Preparation",
      defaultWeakTopic: "Biology NCERT mastery",
      defaultStrongTopic: "Biology basics",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Biology NCERT reading", "Physics basics", "Chemistry basics"], project: "Create a NCERT line-by-line revision and mistake notebook" },
        { phase: "Core Practice", topics: ["Human Physiology", "Organic Chemistry", "Mechanics and Electricity"], project: "Build a subject-wise question tracker with accuracy percentages" },
        { phase: "Revision", topics: ["Diagrams and examples", "Formula revision", "Previous year questions"], project: "Create flashcards for Biology facts and Chemistry reactions" },
        { phase: "Exam Readiness", topics: ["Full mock tests", "Time management", "Weak chapter repair"], project: "Run mock-test analysis with wrong-question revision cycles" },
      ],
    };
  }

  if (includesAny(text, ["gate", "psu", "engineering exam"])) {
    return {
      id: "gate",
      title: "GATE Preparation",
      defaultWeakTopic: "Engineering Mathematics",
      defaultStrongTopic: "Core subject basics",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Engineering Mathematics", "Aptitude basics", "Core subject fundamentals"], project: "Create a formula and concept-error notebook" },
        { phase: "Core Syllabus", topics: ["Subject-wise theory", "Previous year questions", "Numerical problem solving"], project: "Build a topic-wise PYQ tracker with accuracy and revision status" },
        { phase: "Advanced Practice", topics: ["Mixed subject tests", "Weak topic repair", "Time-bound problem sets"], project: "Maintain a mistake journal and weekly revision dashboard" },
        { phase: "Exam Readiness", topics: ["Full mock tests", "Rank improvement analysis", "Final formula revision"], project: "Run a mock-test score trend tracker" },
      ],
    };
  }

  if (includesAny(text, ["cat", "mba", "iim", "xat", "snap", "management entrance"])) {
    return {
      id: "mba",
      title: "MBA Entrance Preparation",
      defaultWeakTopic: "Quantitative Aptitude",
      defaultStrongTopic: "Reading habit",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Quant basics", "Reading comprehension habit", "Logical reasoning basics"], project: "Create a formula, vocabulary, and error-log notebook" },
        { phase: "Core Practice", topics: ["Arithmetic and Algebra", "Data Interpretation", "VARC practice"], project: "Build a section-wise accuracy tracker with weak-question tags" },
        { phase: "Mock Strategy", topics: ["Timed sectional tests", "Mock analysis", "Question selection strategy"], project: "Maintain a mock-test dashboard with score, attempts, accuracy, and mistakes" },
        { phase: "Interview Readiness", topics: ["GD topics", "Personal interview answers", "MBA profile building"], project: "Prepare a profile story bank with achievements, goals, and current affairs opinions" },
      ],
    };
  }

  if (includesAny(text, ["bank", "sbi", "ibps", "rbi", "ssc", "railway", "government exam", "govt exam"])) {
    return {
      id: "government-exam",
      title: "Government Exam Preparation",
      defaultWeakTopic: "Quantitative Aptitude",
      defaultStrongTopic: "General Awareness",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Quant basics", "Reasoning basics", "General Awareness habit"], project: "Create a daily GK, formula, and mistake notebook" },
        { phase: "Core Syllabus", topics: ["Arithmetic", "Puzzles and seating arrangement", "English grammar"], project: "Build a topic-wise practice tracker with accuracy and speed" },
        { phase: "Speed Practice", topics: ["Timed mock sections", "Previous year questions", "Shortcut revision"], project: "Maintain a mock analysis sheet for speed, accuracy, and repeated mistakes" },
        { phase: "Exam Readiness", topics: ["Full mock tests", "Weak topic repair", "Final revision"], project: "Run a 14-day exam sprint tracker with daily mock review" },
      ],
    };
  }

  if (includesAny(text, ["ux", "ui", "product design", "graphic design", "designer", "figma"])) {
    return {
      id: "design",
      title: "Design Career",
      defaultWeakTopic: "Case study storytelling",
      defaultStrongTopic: "Visual taste",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Design principles", "User research basics", "Figma fundamentals"], project: "Recreate and critique three high-quality product screens" },
        { phase: "Core Skills", topics: ["Wireframing", "Design systems", "Usability testing"], project: "Build a design system and usability notes for one app idea" },
        { phase: "Portfolio", topics: ["Case study writing", "Interaction design", "Product thinking"], project: "Create a portfolio case study with problem, process, decisions, and outcomes" },
        { phase: "Interview Readiness", topics: ["Portfolio presentation", "Design critique", "Whiteboard challenge"], project: "Prepare a recorded portfolio walkthrough and critique notes" },
      ],
    };
  }

  if (includesAny(text, ["product manager", "product management", "pm role", "associate product"])) {
    return {
      id: "product",
      title: "Product Management Career",
      defaultWeakTopic: "Product sense",
      defaultStrongTopic: "User empathy",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Product thinking", "User research", "Metrics basics"], project: "Write teardown notes for three products you use daily" },
        { phase: "Core Skills", topics: ["Prioritization frameworks", "PRD writing", "Experiment design"], project: "Create a PRD with user stories, success metrics, and launch plan" },
        { phase: "Portfolio", topics: ["Product case studies", "Roadmap planning", "Analytics storytelling"], project: "Build a product portfolio with teardowns, PRDs, and metric analysis" },
        { phase: "Interview Readiness", topics: ["Product sense interviews", "Execution interviews", "Behavioral stories"], project: "Prepare PM interview answer bank with frameworks and examples" },
      ],
    };
  }

  if (includesAny(text, ["cybersecurity", "security analyst", "ethical hacking", "soc analyst", "penetration testing"])) {
    return {
      id: "cybersecurity",
      title: "Cybersecurity Career",
      defaultWeakTopic: "Networking fundamentals",
      defaultStrongTopic: "Security curiosity",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Networking basics", "Linux basics", "Security fundamentals"], project: "Set up a safe home lab notes file with commands and observations" },
        { phase: "Core Skills", topics: ["Web security", "Threat analysis", "Log investigation"], project: "Complete a beginner CTF writeup and explain the vulnerability" },
        { phase: "Applied Practice", topics: ["OWASP Top 10", "SIEM basics", "Incident response"], project: "Build a security case study with detection, impact, and mitigation" },
        { phase: "Career Readiness", topics: ["Security interview questions", "Portfolio writeups", "Certification planning"], project: "Publish sanitized security writeups and a role-specific resume section" },
      ],
    };
  }

  if (includesAny(text, ["devops", "cloud engineer", "aws", "azure", "sre", "site reliability", "kubernetes", "docker"])) {
    return {
      id: "cloud-devops",
      title: "Cloud and DevOps Career",
      defaultWeakTopic: "Linux and networking",
      defaultStrongTopic: "Deployment basics",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Linux basics", "Networking basics", "Git and shell scripting"], project: "Deploy a simple app manually and document every step" },
        { phase: "Core Skills", topics: ["Docker", "CI/CD pipelines", "Cloud fundamentals"], project: "Containerize an app and deploy it with an automated pipeline" },
        { phase: "Infrastructure", topics: ["Kubernetes basics", "Monitoring and logs", "Infrastructure as code"], project: "Create a small cloud deployment with monitoring and rollback notes" },
        { phase: "Interview Readiness", topics: ["System reliability", "Incident debugging", "DevOps interview scenarios"], project: "Prepare incident case studies and architecture diagrams" },
      ],
    };
  }

  if (includesAny(text, ["digital marketing", "marketing", "content creator", "seo", "social media", "copywriting"])) {
    return {
      id: "marketing",
      title: "Marketing and Content Career",
      defaultWeakTopic: "Content strategy",
      defaultStrongTopic: "Consistency",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Audience research", "Content basics", "SEO fundamentals"], project: "Create a content swipe file and audience research document" },
        { phase: "Core Skills", topics: ["Copywriting", "Analytics basics", "Content calendar"], project: "Build a 30-day content calendar with hooks, formats, and metrics" },
        { phase: "Portfolio", topics: ["Campaign planning", "Landing page writing", "Case study storytelling"], project: "Run a small campaign and document reach, conversion, and learnings" },
        { phase: "Career Readiness", topics: ["Portfolio presentation", "Marketing interview questions", "Growth experiments"], project: "Prepare a marketing portfolio with campaigns, metrics, and insights" },
      ],
    };
  }

  if (includesAny(text, ["ca", "chartered accountant", "finance", "investment banking", "financial analyst", "cfa"])) {
    return {
      id: "finance",
      title: "Finance Career or Exam",
      defaultWeakTopic: "Accounting fundamentals",
      defaultStrongTopic: "Numerical discipline",
      questionMode: "search",
      phases: [
        { phase: "Foundation", topics: ["Accounting basics", "Financial statements", "Business economics"], project: "Create a formula and concept notebook with solved examples" },
        { phase: "Core Skills", topics: ["Ratio analysis", "Corporate finance", "Excel modeling basics"], project: "Analyze a company using financial statements and key ratios" },
        { phase: "Applied Practice", topics: ["Valuation basics", "Case studies", "Exam-style problems"], project: "Build a simple valuation model and explain assumptions" },
        { phase: "Career Readiness", topics: ["Finance interview questions", "Resume deal/project stories", "Market awareness"], project: "Prepare a finance interview notebook with market views and project evidence" },
      ],
    };
  }

  if (includesAny(text, ["data science", "machine learning", "ai engineer", "ml engineer", "data analyst"])) {
    return {
      id: "data",
      title: "Data and AI Career",
      defaultWeakTopic: "Statistics and probability",
      defaultStrongTopic: "Python basics",
      questionMode: "coding",
      phases: [
        { phase: "Foundation", topics: ["Python for data", "Statistics and probability", "SQL fundamentals"], project: "Build a data cleaning and visualization mini project" },
        { phase: "Core Skills", topics: ["Pandas and NumPy", "Exploratory data analysis", "Machine learning basics"], project: "Build an end-to-end ML notebook with clear evaluation metrics" },
        { phase: "Portfolio", topics: ["Feature engineering", "Model evaluation", "Dashboard storytelling"], project: "Create a deployed data portfolio project with business insights" },
        { phase: "Interview Readiness", topics: ["SQL interview questions", "ML case studies", "Project explanation practice"], project: "Prepare project stories and mock interview answers" },
      ],
    };
  }

  if (includesAny(text, ["frontend", "web developer", "react developer", "full stack", "backend", "software", "sde", "developer", "leetcode"])) {
    return {
      id: "software",
      title: "Software Engineering",
      defaultWeakTopic: "Graphs",
      defaultStrongTopic: "Problem solving",
      questionMode: "coding",
      phases: [
        { phase: "Foundation", topics: ["Programming fundamentals", "Language syntax and problem solving", "Time and space complexity"], project: "Build a personal learning tracker CLI/app" },
        { phase: "Core Skills", topics: ["Arrays, Strings, Hashing", "Recursion and Binary Search", "Trees and Graphs"], project: "Build a coding practice dashboard" },
        { phase: "Interview Core", topics: ["Dynamic Programming", "Operating Systems and DBMS basics", "Computer networks basics"], project: "Build a resume-grade project for your target role" },
        { phase: "Career Readiness", topics: ["System design basics", "Mock interviews and communication", "Role-specific preparation"], project: "Polish and deploy a portfolio project aligned with your goal" },
      ],
    };
  }

  return {
    id: "general",
    title: "Personal Goal",
    defaultWeakTopic: "Foundation concepts",
    defaultStrongTopic: "Consistency",
    questionMode: "search",
    phases: [
      { phase: "Foundation", topics: ["Goal fundamentals", "Basic concepts", "Daily learning habit"], project: "Create a goal notebook with resources, milestones, and mistakes" },
      { phase: "Core Skills", topics: ["Main syllabus or skill map", "Practice routine", "Revision system"], project: "Build a progress tracker for this goal" },
      { phase: "Applied Practice", topics: ["Topic-wise practice", "Mock tasks", "Weak area improvement"], project: "Create a portfolio or proof-of-work for the goal" },
      { phase: "Readiness", topics: ["Final revision", "Mock evaluation", "Performance review"], project: "Run weekly review sessions and update the next plan" },
    ],
  };
}

function buildRoadmap({
  goal,
  company,
  weakTopic,
  strongTopic,
  preferredLanguage,
  skillLevel,
  stageLabel,
  visitedTopicIds,
}: {
  goal: string;
  company: string;
  weakTopic: string;
  strongTopic: string;
  preferredLanguage: string;
  skillLevel: string;
  stageLabel: string;
  visitedTopicIds: Set<string>;
}) {
  const language = preferredLanguage && preferredLanguage !== "Not set" ? preferredLanguage : "your preferred language";
  const normalizedGoal = goal === "your dream role" ? "your career goal" : goal;
  const normalizedCompany = company === "your target company" ? "your target company" : company;
  const track = inferGoalTrack(normalizedGoal, normalizedCompany);
  const seedTopics = track.phases.map((phase) => ({
    ...phase,
    topics: phase.topics.map((topic, index) => (index === 0 && weakTopic ? weakTopic : topic.replace("Language syntax", `${language} syntax`))),
    project: phase.project
      .replace("your target role", normalizedGoal)
      .replace("your goal", normalizedGoal)
      .replace("your target company", normalizedCompany),
  }));

  return seedTopics.map((phase, phaseIndex) => ({
    phase: phase.phase,
    level: phaseIndex === 0 ? "Basic" : phaseIndex === 1 ? "Core" : phaseIndex === 2 ? "Intermediate" : "Advanced",
    project: phase.project,
    goalFit: `${phase.phase} plan for ${normalizedGoal} · ${stageLabel} · ${skillLevel || "adaptive level"}`,
    topics: phase.topics.map((topic, topicIndex) => {
      const id = slugify(`${track.id}-${phase.phase}-${topic}`);
      const practiceUrl =
        track.questionMode === "coding"
          ? `/coding-hub?topic=${encodeURIComponent(topic)}`
          : resourceSearchUrl(`${topic} ${normalizedGoal} practice questions`);
      const learningKit = buildTopicLearningKit(topic, normalizedGoal, normalizedCompany, track, phase.phase);
      return {
        id,
        title: topic,
        mastered: visitedTopicIds.has(id) || includesAny(strongTopic, [topic.toLowerCase()]),
        status: visitedTopicIds.has(id) ? "completed" : topic.toLowerCase() === weakTopic.toLowerCase() ? "priority" : "pending",
        videoUrl: youtubeSearchUrl(`${topic} ${normalizedGoal} tutorial`),
        resourceUrl: resourceSearchUrl(`${topic} ${normalizedGoal} roadmap notes`),
        codingUrl: practiceUrl,
        ...learningKit,
        questions: [
          `Explain ${topic} in simple words.`,
          track.questionMode === "coding" ? `Solve one ${topic} practice question.` : `Attempt one ${topic} practice question or PYQ.`,
          `How does ${topic} help for ${normalizedGoal}?`,
        ].slice(0, topicIndex === 0 ? 3 : 2),
      };
    }),
  }));
}

function buildDailyPlan({
  roadmap,
  dayNumber,
  availableMinutes,
  deadlineDays,
}: {
  roadmap: ReturnType<typeof buildRoadmap>;
  dayNumber: number;
  availableMinutes: number;
  deadlineDays: number | null;
}) {
  const allTopics = roadmap.flatMap((phase) =>
    phase.topics.map((topic) => ({
      ...topic,
      phase: phase.phase,
      project: phase.project,
    })),
  );
  const pending = allTopics.filter((topic) => !topic.mastered);
  const selected = (pending.length ? pending : allTopics).slice((dayNumber - 1) % Math.max(pending.length || allTopics.length, 1));
  const topicCount =
    deadlineDays !== null && deadlineDays <= 14
      ? 4
      : deadlineDays !== null && deadlineDays <= 30
        ? 3
        : availableMinutes < 75
          ? 2
          : 3;
  const dailyTopics = [...selected, ...allTopics].filter((topic, index, arr) => arr.findIndex((item) => item.id === topic.id) === index).slice(0, topicCount);
  const perTopicMinutes = Math.max(25, Math.floor(availableMinutes / Math.max(dailyTopics.length, 1)));

  return dailyTopics.map((topic, index) => ({
    ...topic,
    day: dayNumber,
    time: index === 0 ? "9:00" : index === 1 ? "11:00" : "4:00",
    duration: `${perTopicMinutes} min`,
    priority: topic.status === "priority" || index === 0 ? "High" : "Medium",
    recapPrompt: `Summarize what you learned about ${topic.title}, one mistake you made, and one question to revise tomorrow.`,
  }));
}

export async function recordCoachEvent(userId: string, event: CoachEventInput) {
  try {
    const activeMemory = event.goalKey ? null : await getActiveCoachMemory(userId);
    const goalKey = event.goalKey ?? activeMemory?.goalKey ?? "default";
    await coachDb.coachEvent.create({
      data: {
        userId,
        type: event.type,
        module: event.module,
        title: event.title.slice(0, 180),
        detail: event.detail?.slice(0, 500) ?? null,
        impact: event.impact ?? 1,
        metadata: { ...(event.metadata ?? {}), goalKey },
      },
    });
  } catch (error) {
    console.error("Coach event failed:", error);
  }
}

export async function updateCoachGoalMemory(userId: string, careerGoal: string, dreamCompany: string) {
  try {
    const goalKey = buildGoalKey(careerGoal, dreamCompany);
    await coachDb.coachMemory.updateMany({ where: { userId }, data: { isActive: false } });
    await coachDb.coachMemory.upsert({
      where: { userId_goalKey: { userId, goalKey } },
      create: {
        userId,
        goalKey,
        isActive: true,
        careerGoal,
        dreamCompany,
        currentPhase: "Career goal configured",
        roadmapStartedAt: new Date(),
      },
      update: {
        isActive: true,
        careerGoal,
        dreamCompany,
        currentPhase: "Career goal configured",
      },
    });
  } catch (error) {
    console.error("Coach memory update failed:", error);
  }
}

export async function updateCoachMemory(userId: string, input: CoachMemoryInput) {
  const activeMemory = await getActiveCoachMemory(userId);
  const dailyStudyMinutes =
    typeof input.dailyStudyMinutes === "number" && Number.isFinite(input.dailyStudyMinutes)
      ? Math.max(15, Math.min(720, Math.round(input.dailyStudyMinutes)))
      : null;

  const nextCareerGoal = input.careerGoal?.slice(0, 140) || null;
  const nextDreamCompany = input.dreamCompany?.slice(0, 100) || null;
  const goalKey = buildGoalKey(nextCareerGoal, nextDreamCompany);
  const existingForGoal = await coachDb.coachMemory.findUnique({
    where: { userId_goalKey: { userId, goalKey } },
  });
  const reusableLegacyMemory =
    !existingForGoal &&
    activeMemory?.goalKey === "default" &&
    buildGoalKey(activeMemory.careerGoal, activeMemory.dreamCompany) === goalKey
      ? activeMemory
      : null;
  const existingMemory = existingForGoal ?? reusableLegacyMemory;
  const restoringSavedGoal = Boolean(existingForGoal && activeMemory?.goalKey !== goalKey);
  const startingFreshGoal = Boolean(!existingMemory && activeMemory?.goalKey && activeMemory.goalKey !== goalKey);

  const data = {
    goalKey,
    isActive: true,
    careerGoal: nextCareerGoal,
    dreamCompany: nextDreamCompany,
    educationStage: restoringSavedGoal ? existingMemory?.educationStage ?? null : input.educationStage?.slice(0, 40) || null,
    schoolClass: restoringSavedGoal ? existingMemory?.schoolClass ?? null : input.schoolClass?.slice(0, 40) || null,
    engineeringYear: restoringSavedGoal ? existingMemory?.engineeringYear ?? null : input.engineeringYear?.slice(0, 40) || null,
    graduationStatus: restoringSavedGoal ? existingMemory?.graduationStatus ?? null : input.graduationStatus?.slice(0, 80) || null,
    skillLevel: restoringSavedGoal ? existingMemory?.skillLevel ?? null : input.skillLevel?.slice(0, 50) || null,
    preferredLanguage: restoringSavedGoal ? existingMemory?.preferredLanguage ?? null : input.preferredLanguage?.slice(0, 50) || null,
    dailyStudyMinutes: restoringSavedGoal ? existingMemory?.dailyStudyMinutes ?? null : dailyStudyMinutes,
    targetDeadline: restoringSavedGoal ? existingMemory?.targetDeadline ?? null : startingFreshGoal ? null : input.targetDeadline ?? null,
    strongTopics: restoringSavedGoal ? existingMemory?.strongTopics ?? null : startingFreshGoal ? null : input.strongTopics?.slice(0, 500) || null,
    weakTopics: restoringSavedGoal ? existingMemory?.weakTopics ?? null : startingFreshGoal ? null : input.weakTopics?.slice(0, 500) || null,
    currentPhase: restoringSavedGoal
      ? existingMemory?.currentPhase ?? "Coach memory configured"
      : input.skillLevel
        ? `${input.skillLevel} growth phase`
        : "Coach memory configured",
    roadmapStartedAt: existingMemory?.roadmapStartedAt ?? new Date(),
  };

  await coachDb.coachMemory.updateMany({ where: { userId }, data: { isActive: false } });

  if (existingMemory) {
    await coachDb.coachMemory.update({
      where: { id: existingMemory.id },
      data,
    });
  } else {
    await coachDb.coachMemory.create({
      data: { userId, ...data },
    });
  }

  await recordCoachEvent(userId, {
    type: "coach_memory_updated",
    module: "AI Coach",
    title: "Updated AI Coach memory",
    detail: "Personal goals, stage, deadline, available study time, and weak topics were saved for a more accurate roadmap.",
    impact: 3,
    metadata: data,
    goalKey,
  });
}

export async function switchCoachGoal(userId: string, goalKey: string) {
  const targetMemory = await coachDb.coachMemory.findUnique({
    where: { userId_goalKey: { userId, goalKey } },
  });

  if (!targetMemory) {
    throw new Error("Goal profile not found.");
  }

  await coachDb.coachMemory.updateMany({ where: { userId }, data: { isActive: false } });
  await coachDb.coachMemory.update({
    where: { id: targetMemory.id },
    data: { isActive: true },
  });

  await recordCoachEvent(userId, {
    type: "coach_goal_switched",
    module: "AI Coach",
    title: `Switched to ${targetMemory.careerGoal ?? "saved goal"}`,
    detail: "Zentric resumed this goal profile with its own roadmap, planner state, timeline, and learning history.",
    impact: 1,
    metadata: { restoredGoalKey: goalKey },
    goalKey,
  });
}

export async function recordRecommendationFeedback(
  userId: string,
  feedback: {
    recommendationTitle: string;
    module: string;
    rating: string;
    reason?: string;
  },
) {
  await coachDb.coachRecommendationFeedback.create({
    data: {
      userId,
      recommendationTitle: feedback.recommendationTitle.slice(0, 180),
      module: feedback.module.slice(0, 80),
      rating: feedback.rating.slice(0, 40),
      reason: feedback.reason?.slice(0, 500) ?? null,
    },
  });

  await recordCoachEvent(userId, {
    type: "recommendation_feedback",
    module: "AI Coach",
    title: `Feedback: ${feedback.rating}`,
    detail: feedback.recommendationTitle,
    impact: feedback.rating === "helpful" ? 2 : 1,
    metadata: feedback,
  });
}

export async function buildAICoachSnapshot(userId: string) {
  const memory = await getActiveCoachMemory(userId);
  const activeGoalKey = memory?.goalKey ?? "default";
  const [user, tasks, notes, studyTopics, goals, allRecentEvents, recentFeedback, savedGoalMemories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true, careerProfile: true },
    }),
    prisma.task.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.studyTopic.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    coachDb.coachEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    coachDb.coachRecommendationFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    coachDb.coachMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const recentEvents = allRecentEvents.filter((event) => {
    const key = eventGoalKey(event);
    return key === activeGoalKey || (activeGoalKey === "default" && !key);
  });

  const completedTasks = tasks.filter((task) => task.completed);
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTopics = studyTopics.filter((topic) => topic.status === "completed");
  const inProgressTopics = studyTopics.filter((topic) => topic.status === "in_progress");
  const dsaTopics = studyTopics.filter((topic) =>
    includesAny(`${topic.category} ${topic.name}`, ["dsa", "leetcode", "array", "graph", "dp", "tree", "coding"]),
  );
  const csTopics = studyTopics.filter((topic) =>
    includesAny(`${topic.category} ${topic.name}`, ["os", "dbms", "network", "system", "backend", "frontend"]),
  );
  const projectNotes = notes.filter((note) => note.category === "project");
  const interviewNotes = notes.filter((note) => note.category === "interview");
  const recentCutoff = new Date(Date.now() - 7 * 86_400_000);
  const recentEventsThisWeek = recentEvents.filter((event) => event.createdAt >= recentCutoff);
  const recentNotes = notes.filter((note) => note.updatedAt >= recentCutoff);
  const recentNegativeFeedback = recentFeedback.filter((item) =>
    ["not_helpful", "too_easy", "too_hard", "not_relevant"].includes(item.rating),
  );
  const lastDifficultyFeedback = recentFeedback.find((item) => item.rating === "too_easy" || item.rating === "too_hard");
  const visitedEvents = recentEvents.filter((event) => event.type === "roadmap_topic_visited");
  const learningEvidenceScores = recentEvents
    .filter((event) => event.type === "learning_step_completed")
    .map((event) => {
      const metadata = event.metadata as { score?: unknown } | null;
      const score = Number(metadata?.score);
      return Number.isFinite(score) ? score : null;
    })
    .filter((score): score is number => score !== null);
  const codingEvidenceScores = recentEvents
    .filter((event) => event.type === "coding_run_passed" || event.type === "coding_run_failed")
    .map((event) => {
      const metadata = event.metadata as { score?: unknown } | null;
      const score = Number(metadata?.score);
      return Number.isFinite(score) ? score : null;
    })
    .filter((score): score is number => score !== null);
  const evidenceScores = [...learningEvidenceScores, ...codingEvidenceScores];
  const learningQualityScore = clamp(average(evidenceScores, recentEvents.length ? 35 : 0));
  const visitedTopicIds = new Set(
    visitedEvents
      .map((event) => {
        const metadata = event.metadata as { topicId?: string } | null;
        return metadata?.topicId;
      })
      .filter(Boolean) as string[],
  );

  const taskScore = percent(completedTasks.length, tasks.length, tasks.length ? 0 : 35);
  const studyScore = clamp(average(studyTopics.map(scoreStudyTopic), studyTopics.length ? 0 : 35));
  const dsaScore = clamp(average(dsaTopics.map(scoreStudyTopic), 38));
  const csScore = clamp(average(csTopics.map(scoreStudyTopic), studyScore * 0.85 || 35));
  const projectScore = clamp(Math.min(projectNotes.length, 8) * 10 + Math.min(recentNotes.length, 6) * 4);
  const secondBrainScore = clamp(Math.min(notes.length, 25) * 3 + new Set(notes.map((note) => note.category)).size * 8);
  const goalScore = clamp(
    average(goals.map((goal) => (goal.target > 0 ? (goal.progress / goal.target) * 100 : goal.progress)), goals.length ? 0 : 35),
  );
  const careerAnalysis = analyzeCareerProfile(user?.careerProfile ?? null);
  const resumeScore = careerAnalysis.resumeScore ?? (user?.careerProfile?.resumeText ? 55 : 20);
  const interviewScore = clamp(dsaScore * 0.35 + csScore * 0.25 + resumeScore * 0.2 + Math.min(interviewNotes.length, 8) * 4);
  const behavioralScore = clamp(35 + Math.min(interviewNotes.length, 8) * 5 + Math.min(recentEventsThisWeek.length, 10) * 2);
  const targetRole = memory?.careerGoal ?? (
    user?.careerProfile?.dreamRole && user.careerProfile.dreamRole !== "Your Dream Role"
      ? user.careerProfile.dreamRole
      : goals[0]?.title ?? "your dream role"
  );
  const targetCompany = memory?.dreamCompany ?? (
    user?.careerProfile?.targetCompany && user.careerProfile.targetCompany !== "Your Target Company"
      ? user.careerProfile.targetCompany
      : "your target company"
  );
  const missionTitle = `Move closer to ${targetRole} at ${targetCompany}`;
  const goalTrack = inferGoalTrack(targetRole, targetCompany);
  const isCodingTrack = goalTrack.questionMode === "coding";
  const examPracticeScore = clamp(studyScore * 0.34 + taskScore * 0.2 + goalScore * 0.16 + learningQualityScore * 0.18 + Math.min(recentEventsThisWeek.length, 10) * 3);
  const notesRevisionScore = clamp(secondBrainScore * 0.5 + studyScore * 0.25 + learningQualityScore * 0.2 + Math.min(recentNotes.length, 8) * 2);
  const domainKnowledgeScore = clamp(studyScore * 0.38 + secondBrainScore * 0.24 + goalScore * 0.18 + Math.min(recentEventsThisWeek.length, 10) * 3);
  const mockReadinessScore = clamp(examPracticeScore * 0.4 + studyScore * 0.25 + taskScore * 0.2 + behavioralScore * 0.15);
  const consistencyScore = clamp(taskScore * 0.42 + goalScore * 0.22 + Math.min(recentEventsThisWeek.length, 12) * 4 + Math.min(recentNotes.length, 8) * 3);
  const growthScore = isCodingTrack
    ? clamp(
        dsaScore * 0.22 +
          csScore * 0.15 +
          projectScore * 0.13 +
          resumeScore * 0.16 +
          interviewScore * 0.16 +
          secondBrainScore * 0.08 +
          learningQualityScore * 0.06 +
          taskScore * 0.04 +
          goalScore * 0.04,
      )
    : clamp(
        studyScore * 0.24 +
          examPracticeScore * 0.18 +
          notesRevisionScore * 0.17 +
          domainKnowledgeScore * 0.14 +
          mockReadinessScore * 0.13 +
          consistencyScore * 0.1 +
          goalScore * 0.04,
      );

  const breakdown = isCodingTrack
    ? [
        { label: "Coding", value: dsaScore, module: "Coding Hub + Study Tracker", href: "/coding-hub" },
        { label: "CS Fundamentals", value: csScore, module: "Study Tracker", href: "/study" },
        { label: "Projects", value: projectScore, module: "Second Brain", href: "/notes" },
        { label: "Resume", value: resumeScore, module: "Career Hub", href: "/career" },
        { label: "Interview Skills", value: interviewScore, module: "Career Hub", href: "/career" },
        { label: "Behavioral", value: behavioralScore, module: "Career Hub", href: "/career" },
      ]
    : [
        { label: "Syllabus Mastery", value: studyScore, module: "Study Tracker + Learning Mode", href: "/learning-mode" },
        { label: "Practice & Tests", value: examPracticeScore, module: "Planner + Study Tracker", href: "/planner" },
        { label: "Notes & Revision", value: notesRevisionScore, module: "Second Brain", href: "/notes" },
        { label: goalTrack.id === "upsc" ? "Current Affairs" : "Domain Knowledge", value: domainKnowledgeScore, module: "Second Brain + Study Tracker", href: "/notes" },
        { label: "Mock Readiness", value: mockReadinessScore, module: "Planner", href: "/planner" },
        { label: "Consistency", value: consistencyScore, module: "Planner + AI Coach", href: "/planner" },
      ];

  const weakest = [...breakdown].sort((a, b) => a.value - b.value)[0]!;
  const strongest = [...breakdown].sort((a, b) => b.value - a.value)[0]!;
  const onboarding = buildOnboardingStatus(memory, goalTrack);
  const manualWeakTopic = memory?.weakTopics?.split(",").map((topic) => topic.trim()).filter(Boolean)[0];
  const manualStrongTopic = memory?.strongTopics?.split(",").map((topic) => topic.trim()).filter(Boolean)[0];
  const focusTopic =
    manualWeakTopic ??
    (goalTrack.id === "software"
      ? studyTopics.find((topic) => topic.status !== "completed" && includesAny(topic.name, ["graph", "dp", "tree", "system"]))?.name
      : null) ??
    goalTrack.defaultWeakTopic;
  const availableMinutes = memory?.dailyStudyMinutes ?? (weakest.value < 55 ? 150 : 90);
  const estimatedTime =
    availableMinutes >= 120
      ? `${Math.round((availableMinutes / 60) * 10) / 10} hours`
      : `${availableMinutes} minutes`;
  const targetDeadlineDays = memory?.targetDeadline
    ? Math.max(0, Math.ceil((memory.targetDeadline.getTime() - Date.now()) / 86_400_000))
    : null;
  const stageLabel = getStageLabel({
    educationStage: memory?.educationStage ?? null,
    schoolClass: memory?.schoolClass ?? null,
    engineeringYear: memory?.engineeringYear ?? null,
    graduationStatus: memory?.graduationStatus ?? null,
  });
  const roadmap = buildRoadmap({
    goal: targetRole,
    company: targetCompany,
    weakTopic: focusTopic,
    strongTopic: memory?.strongTopics ?? goalTrack.defaultStrongTopic,
    preferredLanguage: memory?.preferredLanguage ?? "Not set",
    skillLevel: memory?.skillLevel ?? "Adaptive",
    stageLabel,
    visitedTopicIds,
  });
  const roadmapStartedAt = memory?.roadmapStartedAt ?? new Date();
  const todayStartForRoadmap = new Date();
  todayStartForRoadmap.setHours(0, 0, 0, 0);
  const roadmapStartDay = new Date(roadmapStartedAt);
  roadmapStartDay.setHours(0, 0, 0, 0);
  const dayNumber = Math.max(
    1,
    Math.floor((todayStartForRoadmap.getTime() - roadmapStartDay.getTime()) / 86_400_000) + 1,
  );
  const dailyPlan = buildDailyPlan({ roadmap, dayNumber, availableMinutes, deadlineDays: targetDeadlineDays });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysVisited = visitedEvents.filter((event) => event.createdAt >= todayStart);
  const learningStepEvents = recentEvents.filter((event) => event.type === "learning_step_completed");
  const completedStepsByTopic = new Map<string, Set<string>>();
  learningStepEvents.forEach((event) => {
    const metadata = event.metadata as { topicId?: string; stepId?: string } | null;
    if (!metadata?.topicId || !metadata.stepId) return;
    const steps = completedStepsByTopic.get(metadata.topicId) ?? new Set<string>();
    steps.add(metadata.stepId);
    completedStepsByTopic.set(metadata.topicId, steps);
  });
  const dailyPlanWithProgress = dailyPlan.map((item) => ({
    ...item,
    completedSteps: Array.from(completedStepsByTopic.get(item.id) ?? []),
  }));
  const revisionQueue = buildRevisionQueue({
    roadmap,
    learningStepEvents,
    visitedEvents,
    dailyPlan,
  });
  const dayRecap = {
    day: dayNumber,
    completedTopics: todaysVisited.length,
    topics: todaysVisited.map((event) => event.title.replace(/^Visited topic: /, "")).slice(0, 6),
    summary: todaysVisited.length
      ? `Day ${dayNumber} recap: you visited ${todaysVisited.length} roadmap topic${todaysVisited.length === 1 ? "" : "s"}. Review the main idea, one mistake, and one follow-up question before tomorrow.`
      : `Day ${dayNumber} recap is waiting. Visit a topic from Planner, then AI Coach will summarize what you covered today.`,
    nextDayHint: `At 12:00 AM, Zentric will show Day ${dayNumber + 1} with the next roadmap topics when you open the app.`,
  };

  const primaryActionHref = isCodingTrack && weakest.label === "Coding" ? "/coding-hub" : weakest.href;
  const primaryActionLabel = isCodingTrack && weakest.label === "Coding" ? "Open Coding Hub" : "Start Focus Session";
  const practiceActionHref = isCodingTrack ? "/coding-hub" : "/learning-mode";
  const careerActionTitle = isCodingTrack
    ? resumeScore < 75
      ? "Improve resume evidence"
      : "Convert resume strength into interview stories"
    : `Build proof for ${goalTrack.title}`;
  const careerActionReason = isCodingTrack
    ? resumeScore < 75
      ? "Your target role match improves fastest when projects show measurable impact."
      : "Your resume has useful signals; turn them into strong interview answers."
    : "This goal needs visible evidence: notes, solved questions, mock analysis, case studies, or portfolio work depending on the track.";

  const recommendations = [
    {
      title:
        lastDifficultyFeedback?.rating === "too_hard"
          ? `Review ${focusTopic} fundamentals first`
          : lastDifficultyFeedback?.rating === "too_easy"
            ? `Increase difficulty in ${focusTopic}`
            : weakest.label === "Coding"
              ? `Practice ${focusTopic}`
              : `Improve ${weakest.label}`,
      reason:
        lastDifficultyFeedback?.rating === "too_hard"
          ? "Your recent feedback said a recommendation felt too hard, so the Coach is lowering the step size."
          : lastDifficultyFeedback?.rating === "too_easy"
            ? "Your recent feedback said a recommendation felt too easy, so the Coach is increasing challenge."
            : `${weakest.label} is your lowest readiness area at ${weakest.value}%.`,
      action: primaryActionLabel,
      href: primaryActionHref,
      module: weakest.module,
      priority: "High",
    },
    {
      title: completedTopics.some((topic) => daysAgo(topic.updatedAt) > 7) ? "Recover overdue revision" : "Create a revision loop",
      reason: completedTopics.some((topic) => daysAgo(topic.updatedAt) > 7)
        ? "Some completed topics have not been revised recently."
        : "Revision data is still thin, so Zentric should build retention early.",
      action: isCodingTrack ? "Open Study Tracker" : "Open Learning Mode",
      href: practiceActionHref,
      module: isCodingTrack ? "Study Tracker" : "Learning Mode",
      priority: "High",
    },
    {
      title: careerActionTitle,
      reason: careerActionReason,
      action: isCodingTrack ? "Open Career Hub" : "Create Evidence Note",
      href: isCodingTrack ? "/career" : "/notes",
      module: isCodingTrack ? "Career Hub" : "Second Brain",
      priority: "Medium",
    },
    {
      title: notes.length < 5 ? "Build your Second Brain" : "Link recent learning to your mission",
      reason: notes.length < 5
        ? "Your Coach needs more learning notes to remember what you understand."
        : "Recent notes can become flashcards, revision prompts, and interview answers.",
      action: "Open Second Brain",
      href: "/notes",
      module: "Second Brain",
      priority: "Medium",
    },
  ];

  const timeline = recentEvents.length
    ? recentEvents.map((event) => ({
        id: event.id,
        date: event.createdAt.toISOString(),
        achievement: event.title,
        module: event.module,
        growthImpact: `+${event.impact}`,
        insight: event.detail ?? `Zentric recorded this ${event.module} action for your AI Coach.`,
        nextMilestone: recommendations[0]?.title ?? "Continue today's mission",
      }))
    : [
        {
          id: "coach-start",
          date: user?.createdAt.toISOString() ?? new Date().toISOString(),
          achievement: "AI Coach activated",
          module: "AI Coach",
          growthImpact: "+1",
          insight: "Zentric is ready to learn from your study, coding, notes, planner, and career actions.",
          nextMilestone: "Upload resume or complete one study/coding action",
        },
      ];

  return {
    user: {
      name: user?.settings?.displayName || user?.name || "there",
      email: user?.email ?? "",
    },
    goalProfiles: savedGoalMemories.map((profile) => ({
      id: profile.id,
      goalKey: profile.goalKey,
      careerGoal: profile.careerGoal ?? "Untitled goal",
      dreamCompany: profile.dreamCompany ?? "General",
      isActive: profile.goalKey === activeGoalKey || profile.isActive,
      currentStage: getStageLabel({
        educationStage: profile.educationStage,
        schoolClass: profile.schoolClass,
        engineeringYear: profile.engineeringYear,
        graduationStatus: profile.graduationStatus,
      }),
      updatedAt: profile.updatedAt.toISOString(),
      roadmapStartedAt: profile.roadmapStartedAt?.toISOString() ?? "",
    })),
    onboarding,
    goalTrack: {
      id: goalTrack.id,
      title: goalTrack.title,
      questionMode: goalTrack.questionMode,
      defaultWeakTopic: goalTrack.defaultWeakTopic,
      defaultStrongTopic: goalTrack.defaultStrongTopic,
    },
    memory: {
      careerGoal: targetRole,
      dreamCompany: targetCompany,
      educationStage: memory?.educationStage ?? "Not set",
      schoolClass: memory?.schoolClass ?? "",
      engineeringYear: memory?.engineeringYear ?? "",
      graduationStatus: memory?.graduationStatus ?? "",
      currentStage: stageLabel,
      skillLevel: memory?.skillLevel ?? "Not set",
      preferredLanguage: memory?.preferredLanguage ?? "Not set",
      dailyStudyTime: memory?.dailyStudyMinutes ? `${memory.dailyStudyMinutes} min` : "AI estimated",
      targetDeadline: memory?.targetDeadline?.toISOString() ?? "",
      roadmapStartedAt: memory?.roadmapStartedAt?.toISOString() ?? "",
      strongTopics: memory?.strongTopics || manualStrongTopic || goalTrack.defaultStrongTopic,
      weakTopics: memory?.weakTopics || manualWeakTopic || goalTrack.defaultWeakTopic,
      currentPhase: growthScore >= 70 ? "Interview warm-up" : growthScore >= 45 ? "Skill building" : "Foundation phase",
    },
    dailyMission: {
      greeting: `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, ${user?.settings?.displayName || user?.name || "there"} 👋`,
      title: "Today's Roadmap Plan",
      mission: missionTitle,
      estimatedTime,
      growthScore,
      readiness: growthScore >= 80 ? "Interview ready" : growthScore >= 60 ? "Building strong momentum" : "Needs focused reps",
      why: `This plan focuses on ${focusTopic} because your Coach memory and app data point to ${weakest.label} as the next growth lever.`,
      tasks: [
        recommendations[0]!.title,
        "Complete one focused revision block",
        resumeScore < 75 ? "Improve one resume/project bullet" : "Practice one interview story",
        notes.length < 5 ? "Create one Second Brain note" : "Review recent learning notes",
      ],
    },
    nextBestAction: recommendations[0],
    recommendations,
    notifications: [
      ...(completedTopics.some((topic) => daysAgo(topic.updatedAt) > 7)
        ? [{ title: "Revision overdue", detail: "At least one completed topic needs a retention refresh.", href: "/study" }]
        : []),
      ...(user?.careerProfile?.resumeText
        ? []
        : [{ title: "Resume missing", detail: "Upload your resume so Career Hub can calculate target role match.", href: "/career" }]),
      ...(pendingTasks.length > 3
        ? [{ title: "Planner overloaded", detail: `${pendingTasks.length} tasks are pending. Let the Coach prioritize today.`, href: "/planner" }]
        : []),
      ...(targetDeadlineDays !== null && targetDeadlineDays <= 30
        ? [{ title: "Target deadline approaching", detail: `${targetDeadlineDays} days left. Coach will prioritize high-impact prep.`, href: "/ai-coach" }]
        : []),
      ...(recentNegativeFeedback.length >= 3
        ? [{ title: "Coach needs calibration", detail: "Several recent recommendations were not ideal. Update your memory settings.", href: "/ai-coach" }]
        : []),
    ],
    connectedModules: [
      { name: "Planner", count: tasks.length, status: tasks.length ? "Connected" : "Needs activity" },
      { name: "Study Tracker", count: studyTopics.length, status: studyTopics.length ? "Connected" : "Needs topics" },
      { name: "Coding Hub", count: recentEvents.filter((event) => event.module === "Coding Hub").length, status: "Event-ready" },
      { name: "Second Brain", count: notes.length, status: notes.length ? "Connected" : "Needs notes" },
      { name: "Career Hub", count: user?.careerProfile?.resumeText ? 1 : 0, status: user?.careerProfile?.resumeText ? "Resume uploaded" : "Resume needed" },
      { name: "Ask Zentric", count: recentEvents.filter((event) => event.module === "Ask Zentric").length, status: "Context-aware" },
    ],
    metrics: {
      growthScore,
      strongestArea: strongest,
      weakestArea: weakest,
      completedTasks: completedTasks.length,
      completedTopics: completedTopics.length,
      inProgressTopics: inProgressTopics.length,
      notes: notes.length,
      eventsThisWeek: recentEventsThisWeek.length,
      targetRoleMatch: careerAnalysis.resumeMatch,
      feedbackThisWeek: recentFeedback.filter((item) => item.createdAt >= recentCutoff).length,
      negativeFeedback: recentNegativeFeedback.length,
      learningQualityScore,
      scoredLearningSteps: evidenceScores.length,
    },
    feedbackOptions: ["helpful", "not_helpful", "too_easy", "too_hard"],
    roadmap,
    dailyPlan: dailyPlanWithProgress,
    dayRecap,
    revisionQueue,
    timeline,
    quickActions: [
      { label: "Start Planner Routine", href: "/planner" },
      { label: "Ask Zentric", href: "/chat" },
      { label: "Review Resume", href: "/career" },
      { label: "Open Coding Hub", href: "/coding-hub" },
    ],
  };
}
