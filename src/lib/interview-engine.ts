export type InterviewModeId =
  | "dsa"
  | "hr"
  | "resume"
  | "mixed"
  | "system-design"
  | "frontend"
  | "backend"
  | "fullstack"
  | "ai-ml"
  | "data"
  | "devops"
  | "product"
  | "security"
  | "custom";

export type InterviewDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Real Interview";

export type InterviewQuestion = {
  id: string;
  mode: string;
  question: string;
  idealPoints: string[];
  skillArea: string;
};

export type InterviewAnswer = {
  questionIndex: number;
  mode: string;
  question: string;
  answer: string;
  score: number;
  technicalDepth: number;
  clarity: number;
  structure: number;
  roleFit: number;
  confidence: number;
  resumeProof: number;
  feedback: string;
  idealAnswer: string;
  improvedAnswer: string;
  followUpQuestion: string;
  idealPoints: string[];
  skillArea: string;
  createdAt: string;
};

export type InterviewEvaluation = Pick<
  InterviewAnswer,
  | "score"
  | "technicalDepth"
  | "clarity"
  | "structure"
  | "roleFit"
  | "confidence"
  | "resumeProof"
  | "feedback"
  | "idealAnswer"
  | "improvedAnswer"
  | "followUpQuestion"
>;

export type InterviewReport = {
  overall: number;
  technical: number;
  communication: number;
  resumeAlignment: number;
  structure: number;
  confidence: number;
  strongestSkillAreas: string[];
  weakestSkillAreas: string[];
  missingSignals: string[];
  plannerTopics: string[];
  nextSteps: string[];
};

const answerSignalWords = new Set([
  "algorithm",
  "api",
  "approach",
  "architecture",
  "auth",
  "bfs",
  "binary",
  "cache",
  "complexity",
  "constraint",
  "constraints",
  "database",
  "design",
  "dfs",
  "dynamic",
  "edge",
  "example",
  "impact",
  "index",
  "learning",
  "optimization",
  "optimize",
  "project",
  "queue",
  "reasoning",
  "recursion",
  "requirement",
  "requirements",
  "result",
  "scale",
  "security",
  "stack",
  "state",
  "structure",
  "system",
  "technical",
  "tradeoff",
  "tree",
  "visited",
]);

function clean(value: string | null | undefined, fallback: string) {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "question";
}

function roleFamily(role: string) {
  const normalized = role.toLowerCase();
  if (/front|react|ui|web/.test(normalized)) return "frontend";
  if (/back|api|server|full stack|fullstack/.test(normalized)) return "backend";
  if (/data|analyst|analytics|sql|business intelligence/.test(normalized)) return "data";
  if (/ai|ml|machine|deep learning|nlp/.test(normalized)) return "ai";
  if (/devops|cloud|sre|platform/.test(normalized)) return "devops";
  if (/product|pm|manager/.test(normalized)) return "product";
  if (/cyber|security/.test(normalized)) return "security";
  return "general";
}

function roleSkillPack(role: string) {
  const family = roleFamily(role);
  const packs: Record<string, { skills: string[]; scenario: string; projectSignal: string }> = {
    frontend: {
      skills: ["React", "TypeScript", "state management", "performance", "accessibility"],
      scenario: "A dashboard feels slow after adding charts and filters. How would you debug and improve it?",
      projectSignal: "UI architecture, reusable components, accessibility, performance metrics",
    },
    backend: {
      skills: ["APIs", "databases", "authentication", "caching", "system design"],
      scenario: "An API becomes slow when many users submit requests at once. How would you investigate and fix it?",
      projectSignal: "API design, database schema, auth, error handling, observability",
    },
    data: {
      skills: ["SQL", "dashboards", "metrics", "data cleaning", "insight communication"],
      scenario: "A stakeholder asks why weekly growth dropped. How would you analyze and present the reason?",
      projectSignal: "data source, cleaning, SQL logic, visualization, business impact",
    },
    ai: {
      skills: ["Python", "model evaluation", "data preprocessing", "experiments", "deployment"],
      scenario: "A model performs well offline but poorly for real users. How would you diagnose the issue?",
      projectSignal: "dataset, baseline, evaluation metric, experiment tracking, deployment constraints",
    },
    devops: {
      skills: ["Linux", "Docker", "CI/CD", "cloud", "monitoring"],
      scenario: "A production deployment fails and users see errors. What steps would you take?",
      projectSignal: "pipeline, rollback, logs, monitoring, reliability",
    },
    product: {
      skills: ["user research", "prioritization", "metrics", "roadmaps", "communication"],
      scenario: "Two important features compete for the same release. How would you decide what ships first?",
      projectSignal: "user problem, metric, prioritization, tradeoffs, outcome",
    },
    security: {
      skills: ["threat modeling", "networking", "secure coding", "logs", "incident response"],
      scenario: "Suspicious login activity appears for multiple users. How would you investigate and respond?",
      projectSignal: "risk, mitigation, logs, secure design, response plan",
    },
    general: {
      skills: ["role fundamentals", "projects", "communication", "problem solving", "learning plan"],
      scenario: "You are given an unfamiliar problem in this role. How would you break it down and deliver a result?",
      projectSignal: "goal, ownership, tools used, decisions, measurable impact",
    },
  };

  return packs[family] ?? packs.general!;
}

function withIds(questions: Omit<InterviewQuestion, "id">[], role: string) {
  return questions.map((question, index) => ({
    ...question,
    id: `${slug(role)}-${slug(question.mode)}-${index + 1}`,
  }));
}

export function generateInterviewQuestions({
  mode,
  role,
  difficulty,
  company,
  resumeUploaded,
  resumeQuestions = [],
}: {
  mode: InterviewModeId | string;
  role: string;
  difficulty: InterviewDifficulty | string;
  company: string;
  resumeUploaded?: boolean;
  resumeQuestions?: string[];
}) {
  const safeRole = clean(role, "your target role");
  const safeCompany = clean(company, "your target company");
  const depth =
    difficulty === "Real Interview" || difficulty === "Advanced"
      ? "with tradeoffs, edge cases, and measurable impact"
      : "clearly and step by step";
  const pack = roleSkillPack(safeRole);

  const dsaQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "DSA",
      question: `Solve a medium ${safeRole.includes("Frontend") ? "arrays/sliding window" : "graphs or dynamic programming"} problem aloud. How would you approach it ${depth}?`,
      idealPoints: ["state brute force first", "explain optimized pattern", "mention complexity", "cover edge cases"],
      skillArea: "Problem Solving",
    },
    {
      mode: "DSA",
      question: "How do you decide between BFS, DFS, binary search, and dynamic programming in an interview problem?",
      idealPoints: ["problem signals", "constraints", "state/graph structure", "complexity reasoning"],
      skillArea: "DSA Patterns",
    },
  ];

  const hrQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "HR",
      question: `Why do you want ${safeRole} at ${safeCompany}, and what makes you ready now?`,
      idealPoints: ["specific motivation", "role fit", "proof from work", "growth plan"],
      skillArea: "Motivation",
    },
    {
      mode: "HR",
      question: "Tell me about a time you struggled or failed. What did you change after that?",
      idealPoints: ["situation", "action", "result", "learning"],
      skillArea: "Behavioral Storytelling",
    },
  ];

  const resumeBased: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Resume-based",
      question: resumeUploaded
        ? resumeQuestions[0] ?? "Pick your strongest resume project. Explain the architecture, impact, and hardest technical decision."
        : "You have not uploaded a resume yet. Explain your strongest project as if it were on your resume.",
      idealPoints: ["project goal", "tech stack", "your ownership", "impact", "tradeoffs"],
      skillArea: "Resume Proof",
    },
    {
      mode: "Resume-based",
      question: `Which skill is missing or weak for ${safeRole}, and what proof will you build in the next 7 days?`,
      idealPoints: ["honest gap", "specific plan", "practice/project proof", "timeline"],
      skillArea: "Gap Ownership",
    },
  ];

  const systemDesign: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "System Design",
      question: `Design a feature for ${safeCompany}: users upload data, receive AI analysis, and track progress over time.`,
      idealPoints: ["requirements", "APIs", "database", "queues", "scaling", "security"],
      skillArea: "System Design",
    },
    {
      mode: "System Design",
      question: "How would you make an interview simulation platform reliable, secure, and fast?",
      idealPoints: ["auth", "rate limits", "data privacy", "async processing", "observability"],
      skillArea: "Reliability",
    },
  ];

  const frontendQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Frontend",
      question: "How would you design a reusable, accessible, and high-performance dashboard component?",
      idealPoints: ["component architecture", "state management", "accessibility", "performance", "testing"],
      skillArea: "Frontend Architecture",
    },
    {
      mode: "Frontend",
      question: "A React page becomes slow after adding filters and charts. How would you debug and improve it?",
      idealPoints: ["profiling", "memoization", "render optimization", "data fetching", "bundle size"],
      skillArea: "Frontend Performance",
    },
    {
      mode: "Frontend",
      question: "Explain how you would structure TypeScript types for API data, form state, and UI components.",
      idealPoints: ["type safety", "interfaces", "generics", "validation", "reusable types"],
      skillArea: "TypeScript",
    },
    {
      mode: "Frontend",
      question: "How would you make a premium auth page responsive, secure, and production-ready?",
      idealPoints: ["responsive layout", "form validation", "auth errors", "accessibility", "security"],
      skillArea: "Production UI",
    },
  ];

  const backendQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Backend",
      question: "Design an API for resume upload, parsing, scoring, and storing analysis history.",
      idealPoints: ["API design", "database schema", "file handling", "validation", "error handling"],
      skillArea: "API Design",
    },
    {
      mode: "Backend",
      question: "How would you optimize a slow database query in a career analytics product?",
      idealPoints: ["indexes", "query plan", "pagination", "caching", "schema design"],
      skillArea: "Database Optimization",
    },
    {
      mode: "Backend",
      question: "How would you secure user resumes and interview data in production?",
      idealPoints: ["authentication", "authorization", "encryption", "privacy", "audit logs"],
      skillArea: "Security",
    },
    {
      mode: "Backend",
      question: "How would you design background jobs for AI analysis without blocking the user?",
      idealPoints: ["queues", "workers", "retries", "status tracking", "observability"],
      skillArea: "Async Systems",
    },
  ];

  const fullstackQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Full Stack",
      question: "Design a complete feature from UI to database for tracking interview progress.",
      idealPoints: ["frontend flow", "API contract", "database schema", "auth", "edge cases"],
      skillArea: "End-to-End Design",
    },
    {
      mode: "Full Stack",
      question: "How would you debug a bug where the UI shows old data after a successful API update?",
      idealPoints: ["client state", "cache invalidation", "API response", "database write", "logging"],
      skillArea: "Debugging",
    },
    {
      mode: "Full Stack",
      question: "Explain how you would build notifications/reminders connected to a planner.",
      idealPoints: ["user preference", "scheduled jobs", "browser permission", "database model", "fallbacks"],
      skillArea: "Planner Systems",
    },
    {
      mode: "Full Stack",
      question: "How would you make Zentric reliable when many users submit coding answers together?",
      idealPoints: ["rate limits", "queues", "scaling", "database load", "error recovery"],
      skillArea: "Reliability",
    },
  ];

  const aiMlQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "AI/ML",
      question: "How would you evaluate whether an AI resume score is accurate and fair?",
      idealPoints: ["dataset", "metrics", "bias", "human review", "calibration"],
      skillArea: "Model Evaluation",
    },
    {
      mode: "AI/ML",
      question: "A model works well in testing but gives poor recommendations to users. How would you debug it?",
      idealPoints: ["data drift", "feedback loop", "metrics", "prompt quality", "experiments"],
      skillArea: "AI Debugging",
    },
    {
      mode: "AI/ML",
      question: "Explain the difference between rules, traditional ML, and LLM-based scoring for career guidance.",
      idealPoints: ["baseline rules", "features", "model output", "LLM reasoning", "validation"],
      skillArea: "AI System Design",
    },
    {
      mode: "AI/ML",
      question: "How would you personalize a learning roadmap using user goals, progress, and weak topics?",
      idealPoints: ["user profile", "progress signals", "recommendation logic", "ranking", "feedback"],
      skillArea: "Personalization",
    },
  ];

  const dataQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Data",
      question: "How would you analyze why users are not completing their daily learning missions?",
      idealPoints: ["funnel analysis", "cohorts", "metrics", "segmentation", "actionable insight"],
      skillArea: "Product Analytics",
    },
    {
      mode: "Data",
      question: "Write the approach for measuring weekly learning velocity and retention.",
      idealPoints: ["metric definition", "SQL logic", "time windows", "retention", "visualization"],
      skillArea: "Metrics",
    },
    {
      mode: "Data",
      question: "How would you clean messy resume/profile data before analysis?",
      idealPoints: ["normalization", "missing values", "deduplication", "validation", "quality checks"],
      skillArea: "Data Cleaning",
    },
    {
      mode: "Data",
      question: "How would you present company readiness insights to a non-technical user?",
      idealPoints: ["clear story", "visualization", "business impact", "recommendation", "limitations"],
      skillArea: "Insight Communication",
    },
  ];

  const devopsQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "DevOps",
      question: "How would you deploy Zentric safely with database migrations and rollback plans?",
      idealPoints: ["CI/CD", "migration strategy", "environment variables", "rollback", "monitoring"],
      skillArea: "Deployment",
    },
    {
      mode: "DevOps",
      question: "A production build passes locally but fails on Vercel. How would you investigate?",
      idealPoints: ["logs", "environment parity", "dependencies", "build command", "runtime config"],
      skillArea: "Build Debugging",
    },
    {
      mode: "DevOps",
      question: "How would you monitor API errors, slow pages, and failed background jobs?",
      idealPoints: ["logs", "metrics", "alerts", "tracing", "dashboards"],
      skillArea: "Observability",
    },
    {
      mode: "DevOps",
      question: "How would you secure deployment secrets and production database access?",
      idealPoints: ["secret management", "least privilege", "rotation", "audit", "network access"],
      skillArea: "Cloud Security",
    },
  ];

  const productQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Product",
      question: "How would you decide whether Zentric should build Interview Prep or Second Brain first?",
      idealPoints: ["user problem", "impact", "effort", "metrics", "tradeoffs"],
      skillArea: "Prioritization",
    },
    {
      mode: "Product",
      question: "Define success metrics for an AI Growth Operating System.",
      idealPoints: ["activation", "retention", "learning progress", "career outcomes", "quality metrics"],
      skillArea: "Product Metrics",
    },
    {
      mode: "Product",
      question: "How would you interview users to validate whether AI Coach is useful?",
      idealPoints: ["user research", "pain points", "behavior", "feedback", "decision criteria"],
      skillArea: "User Research",
    },
    {
      mode: "Product",
      question: "How would you reduce messiness in Career Hub while keeping it powerful?",
      idealPoints: ["information architecture", "user journey", "progressive disclosure", "prioritization", "UX clarity"],
      skillArea: "Product UX",
    },
  ];

  const securityQuestions: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Cybersecurity",
      question: "Threat model a resume upload and AI analysis feature.",
      idealPoints: ["assets", "threats", "validation", "storage security", "mitigation"],
      skillArea: "Threat Modeling",
    },
    {
      mode: "Cybersecurity",
      question: "How would you prevent unauthorized access to user interview sessions and notes?",
      idealPoints: ["authentication", "authorization", "session handling", "access checks", "audit logs"],
      skillArea: "Access Control",
    },
    {
      mode: "Cybersecurity",
      question: "What security risks exist when users paste resumes, projects, and personal goals into an app?",
      idealPoints: ["PII", "data retention", "privacy", "encryption", "consent"],
      skillArea: "Data Privacy",
    },
    {
      mode: "Cybersecurity",
      question: "How would you respond if suspicious login activity appears for many users?",
      idealPoints: ["incident response", "logs", "containment", "communication", "prevention"],
      skillArea: "Incident Response",
    },
  ];

  const customInterview: Omit<InterviewQuestion, "id">[] = [
    {
      mode: "Custom Interview",
      question: `For a ${safeRole} interview, introduce yourself and connect your current skills to this role.`,
      idealPoints: ["role fit", ...pack.skills.slice(0, 3), "project proof", "growth plan"],
      skillArea: "Role Fit",
    },
    {
      mode: "Custom Interview",
      question: `What are the top skills for ${safeRole}, and how can you prove each one with real work?`,
      idealPoints: [...pack.skills.slice(0, 4), "specific proof", "examples"],
      skillArea: "Role Skills",
    },
    {
      mode: "Custom Interview",
      question: `Describe one project that proves you are ready for ${safeRole}. Focus on ${pack.projectSignal}.`,
      idealPoints: ["project goal", "your ownership", "technical choices", "impact", ...pack.skills.slice(0, 2)],
      skillArea: "Project Proof",
    },
    {
      mode: "Custom Interview",
      question: pack.scenario,
      idealPoints: ["problem breakdown", "tools or methods", "tradeoffs", "communication", "result"],
      skillArea: "Role Scenario",
    },
    {
      mode: "Custom Interview",
      question: `If the interviewer finds a gap in your profile for ${safeRole}, how will you explain it and what is your improvement plan?`,
      idealPoints: ["honest gap", "specific plan", "timeline", "proof of progress"],
      skillArea: "Gap Ownership",
    },
  ];

  const pools: Record<string, Omit<InterviewQuestion, "id">[]> = {
    custom: customInterview,
    dsa: dsaQuestions,
    hr: hrQuestions,
    resume: resumeBased,
    "system-design": systemDesign,
    frontend: frontendQuestions,
    backend: backendQuestions,
    fullstack: fullstackQuestions,
    "ai-ml": aiMlQuestions,
    data: dataQuestions,
    devops: devopsQuestions,
    product: productQuestions,
    security: securityQuestions,
    mixed: [dsaQuestions[0], resumeBased[0], hrQuestions[0], systemDesign[0]].filter(Boolean) as Omit<InterviewQuestion, "id">[],
  };

  const selected = pools[mode] ?? customInterview;
  const count = difficulty === "Beginner" ? 3 : mode === "custom" ? 5 : 4;
  return withIds(selected.slice(0, count), safeRole);
}

function getAnswerQuality(answer: string, idealPoints: string[]) {
  const normalized = answer.toLowerCase().trim();
  const words = normalized.match(/[a-z][a-z+#.-]*/g) ?? [];
  const uniqueWords = new Set(words);
  const alphabeticChars = normalized.replace(/[^a-z]/g, "");
  const vowelCount = (alphabeticChars.match(/[aeiou]/g) ?? []).length;
  const vowelRatio = alphabeticChars.length ? vowelCount / alphabeticChars.length : 0;
  const hasLongRandomToken = words.some((word) => word.length >= 14 && !answerSignalWords.has(word));
  const hasMostlyRepeatedWords = words.length >= 6 && uniqueWords.size <= 2;
  const hasNoSpacing = words.length <= 1 && alphabeticChars.length >= 12;
  const hasLowVowelBalance = alphabeticChars.length >= 12 && (vowelRatio < 0.18 || vowelRatio > 0.72);
  const hasKeyword = [
    ...idealPoints.flatMap((point) => point.toLowerCase().split(/\W+/)),
    ...answerSignalWords,
  ].some((word) => word.length > 3 && normalized.includes(word));
  const meaningfulWordCount = words.filter((word) => word.length > 2 && /[aeiou]/.test(word)).length;
  const sentenceCount = Math.max(1, (answer.match(/[.!?]/g) ?? []).length);
  const technicalKeywordCount = [
    ...answerSignalWords,
    ...idealPoints.flatMap((point) => point.toLowerCase().split(/\W+/)),
  ].filter((word) => word.length > 3 && normalized.includes(word)).length;

  return {
    hasKeyword,
    hasLongRandomToken,
    meaningfulWordCount,
    sentenceCount,
    wordCount: words.length,
    uniqueWordRatio: words.length ? uniqueWords.size / words.length : 0,
    technicalKeywordCount,
    isTooShort: alphabeticChars.length < 24 || words.length < 4,
    isGibberish:
      alphabeticChars.length > 0 &&
      ((hasLongRandomToken && meaningfulWordCount <= 2) ||
        hasNoSpacing ||
        hasMostlyRepeatedWords ||
        hasLowVowelBalance) &&
      (!hasKeyword || meaningfulWordCount <= 2),
  };
}

function countIdealMatches(answer: string, idealPoints: string[]) {
  const normalized = answer.toLowerCase();
  return idealPoints.filter((point) => {
    const words = point.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
    return words.some((word) => normalized.includes(word));
  }).length;
}

function missingIdealPoints(answer: string, idealPoints: string[]) {
  const normalized = answer.toLowerCase();
  return idealPoints.filter((point) => {
    const words = point.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
    return !words.some((word) => normalized.includes(word));
  });
}

function buildIdealAnswer(question: InterviewQuestion, role: string, company: string) {
  const signals = question.idealPoints.join(", ");
  if (question.mode === "DSA") {
    return `A strong answer should first identify the pattern signals, then explain the brute force idea, optimized approach, edge cases, and time/space complexity. For this question, the key signals are: ${signals}.`;
  }
  if (question.mode === "System Design") {
    return `A strong answer should clarify requirements, define APIs/data model, explain storage and scaling choices, call out security/reliability risks, and discuss tradeoffs. For ${company}, make the design practical and measurable.`;
  }
  if (question.mode === "HR") {
    return `A strong answer should use a clear story: context, action, result, learning, and why it proves fit for ${role} at ${company}. Avoid generic motivation; use one concrete example.`;
  }
  if (question.mode === "Resume-based") {
    return `A strong answer should connect one real project or experience to the role: goal, tech stack, your ownership, hard tradeoff, measurable impact, and what you learned.`;
  }
  return `A strong answer should prove role fit for ${role}: explain the problem, the skills used, your ownership, tradeoffs, result, and next improvement plan. Key signals: ${signals}.`;
}

function buildImprovedAnswer({
  answer,
  question,
  role,
  company,
  missing,
}: {
  answer: string;
  question: InterviewQuestion;
  role: string;
  company: string;
  missing: string[];
}) {
  const missingText = missing.slice(0, 3).join(", ") || "specific proof, tradeoffs, and impact";
  if (question.mode === "DSA") {
    return `I would start by identifying the problem pattern from constraints and input shape. Then I would explain a brute-force approach, optimize using the best-fit pattern, walk through edge cases, and finish with time and space complexity. In this answer I must explicitly cover: ${missingText}.`;
  }
  if (question.mode === "System Design") {
    return `I would first clarify requirements and scale, then propose APIs, database schema, core services, caching/queue choices, security, failure handling, and tradeoffs. For ${company}, I would connect the design to reliability and user impact. Missing details to add: ${missingText}.`;
  }
  if (question.mode === "HR") {
    return `I would answer with a concise STAR story: situation, task, action, result, and learning. Then I would connect that story to ${role} at ${company}. The answer should add: ${missingText}.`;
  }
  if (answer.trim().length < 40) {
    return `I would give a complete answer instead of a one-line response: state the context, explain my approach, give one concrete example/project, mention the result, and close with how it proves readiness for ${role}. Add: ${missingText}.`;
  }
  return `I would tighten this answer by making it more interview-ready: start with the main point, add one concrete project/example, explain the technical decision, mention a measurable result, and close with the next improvement. Add: ${missingText}.`;
}

export function evaluateInterviewAnswer({
  answer,
  question,
  role,
  company,
  resumeUploaded = false,
}: {
  answer: string;
  question: InterviewQuestion;
  role: string;
  company: string;
  resumeUploaded?: boolean;
}): InterviewEvaluation {
  const quality = getAnswerQuality(answer, question.idealPoints);
  const normalized = answer.toLowerCase();
  const idealMatches = countIdealMatches(answer, question.idealPoints);
  const missing = missingIdealPoints(answer, question.idealPoints);
  const idealCoverage = question.idealPoints.length ? idealMatches / question.idealPoints.length : 0;
  const hasStructureWords = /first|second|then|because|example|result|impact|tradeoff|complexity|learned|therefore|finally/i.test(answer);
  const hasProofWords = /project|built|created|implemented|improved|reduced|increased|users|score|percent|internship|experience|metric|deployed/i.test(answer);
  const hasRoleSignal = role
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3)
    .some((word) => normalized.includes(word));
  const hasCompanySignal = company.toLowerCase() !== "your target company" && normalized.includes(company.toLowerCase());

  if (quality.isGibberish) {
    const idealAnswer = buildIdealAnswer(question, role, company);
    return {
      score: 5,
      technicalDepth: 5,
      clarity: 3,
      structure: 3,
      roleFit: 5,
      confidence: 5,
      resumeProof: resumeUploaded ? 5 : 0,
      feedback:
        "This looks random or unreadable, so Zentric scored it very low. Write a real interview answer with reasoning, examples, tradeoffs, and role-specific proof.",
      idealAnswer,
      improvedAnswer: buildImprovedAnswer({ answer, question, role, company, missing }),
      followUpQuestion: `Let's reset this. Can you answer again using: ${question.idealPoints.slice(0, 3).join(", ")}?`,
    };
  }

  const technicalDepth = clamp(18 + idealCoverage * 42 + Math.min(quality.technicalKeywordCount, 6) * 5 + (quality.wordCount > 70 ? 10 : 0));
  const clarity = clamp(15 + Math.min(quality.meaningfulWordCount, 24) * 2 + Math.min(quality.sentenceCount, 5) * 4 + (quality.uniqueWordRatio > 0.45 ? 12 : -5));
  const structure = clamp(18 + (hasStructureWords ? 34 : 0) + idealCoverage * 24 + (quality.wordCount > 45 ? 12 : 0));
  const roleFit = clamp(20 + (hasRoleSignal ? 22 : 0) + (hasCompanySignal ? 10 : 0) + idealCoverage * 24 + (question.mode === "Custom Interview" ? 10 : 0));
  const confidence = clamp(25 + (hasStructureWords ? 20 : 0) + (/\bi would\b|\bi will\b|\bmy approach\b|\bthe key\b/i.test(answer) ? 18 : 0) - (/\bmaybe\b|\bi guess\b|\bnot sure\b|\bidk\b/i.test(answer) ? 18 : 0) + Math.min(quality.wordCount, 80) / 3);
  const resumeProof = clamp((resumeUploaded ? 22 : 8) + (hasProofWords ? 35 : 0) + (/\d|%|users|reduced|increased|improved|deployed/i.test(answer) ? 18 : 0) + (question.mode === "Resume-based" ? 10 : 0));
  const rawScore = clamp(
    technicalDepth * 0.28 +
      clarity * 0.18 +
      structure * 0.18 +
      roleFit * 0.14 +
      confidence * 0.1 +
      resumeProof * 0.12,
    quality.isTooShort && !quality.hasKeyword ? 10 : 0,
    quality.isTooShort && !quality.hasKeyword ? 35 : 100,
  );
  const answerCap =
    quality.wordCount < 12
      ? 25
      : quality.wordCount < 24 && idealCoverage < 0.25
        ? 38
        : idealCoverage === 0 && quality.technicalKeywordCount < 2
          ? 45
          : idealCoverage < 0.25 && !hasProofWords && !hasStructureWords
            ? 55
            : 100;
  const score = clamp(Math.min(rawScore, answerCap));

  const feedback =
    score >= 82
      ? `Strong interview answer. You covered the main signal well. To make it excellent, add ${missing.slice(0, 2).join(", ") || "one measurable result and one tradeoff"}.`
      : score >= 65
        ? `Good base, but it needs more proof. Add ${missing.slice(0, 3).join(", ") || "specific examples, tradeoffs, and impact"} to make it interview-ready.`
        : score >= 40
          ? `Weak but usable. Structure it around ${question.idealPoints.slice(0, 4).join(", ")} and add one concrete example.`
          : `This answer is too shallow for a real interview. Rebuild it with a clear approach, role-specific proof, and these missing signals: ${question.idealPoints.slice(0, 4).join(", ")}.`;

  return {
    score,
    technicalDepth,
    clarity,
    structure,
    roleFit,
    confidence,
    resumeProof,
    feedback,
    idealAnswer: buildIdealAnswer(question, role, company),
    improvedAnswer: buildImprovedAnswer({ answer, question, role, company, missing }),
    followUpQuestion: `Follow-up: ${missing[0] ? `Can you go deeper on "${missing[0]}" with one concrete example?` : "What tradeoff would you mention if the interviewer pushed you harder?"}`,
  };
}

export function scoreInterviewAnswer(answer: string, idealPoints: string[]) {
  const normalized = answer.toLowerCase();
  const quality = getAnswerQuality(answer, idealPoints);

  if (quality.isGibberish) return 5;
  if (quality.isTooShort && !quality.hasKeyword) return 10;

  const lengthScore = Math.min(25, Math.round(answer.trim().length / 18));
  const pointScore = idealPoints.reduce((score, point) => {
    const words = point.toLowerCase().split(/\s+/).filter((word) => word.length > 4);
    return score + (words.some((word) => normalized.includes(word)) ? 15 : 0);
  }, 0);
  const structureScore = /because|first|second|example|result|impact|tradeoff|complexity|learned/i.test(answer) ? 20 : 4;
  const clarityScore = Math.min(20, quality.meaningfulWordCount * 2);

  const rawScore = lengthScore + pointScore + structureScore + clarityScore;
  const pointMatches = countIdealMatches(answer, idealPoints);
  const cap =
    quality.wordCount < 12
      ? 25
      : pointMatches === 0 && quality.technicalKeywordCount < 2
        ? 45
        : pointMatches <= 1 && !/because|first|second|example|result|impact|tradeoff|complexity|learned/i.test(answer)
          ? 55
          : 100;

  return Math.max(5, Math.min(cap, rawScore));
}

export function interviewFeedback(score: number, idealPoints: string[], answer = "") {
  const quality = getAnswerQuality(answer, idealPoints);
  if (quality.isGibberish) {
    return "This answer looks random or unreadable, so it was scored very low. Write a real interview-style explanation with reasoning, examples, and key terms.";
  }
  if (quality.isTooShort && !quality.hasKeyword) {
    return "This answer is too short to evaluate. Add your approach, reasoning, complexity, tradeoffs, and one example.";
  }
  if (score >= 80) return "Strong answer. You covered the core signal well. Keep adding numbers, tradeoffs, and examples.";
  if (score >= 60) return `Good base. Improve by adding: ${idealPoints.slice(0, 2).join(", ")}.`;
  return `Needs work. Structure the answer around: ${idealPoints.join(", ")}.`;
}

function average(items: InterviewAnswer[]) {
  return items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : 0;
}

function averageBy(items: InterviewAnswer[], key: keyof Pick<InterviewAnswer, "technicalDepth" | "clarity" | "structure" | "roleFit" | "confidence" | "resumeProof">) {
  return items.length
    ? Math.round(items.reduce((sum, item) => sum + (typeof item[key] === "number" ? item[key] : item.score), 0) / items.length)
    : 0;
}

export function buildInterviewReport(history: InterviewAnswer[], resumeUploaded: boolean): InterviewReport {
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
  const resumeAnswers = history.filter((item) => item.mode === "Resume-based" || item.skillArea === "Project Proof");
  const weakAnswers = history.filter((item) => item.score < 70);
  const strongAnswers = history.filter((item) => item.score >= 80);
  const missingSignals = Array.from(new Set(weakAnswers.flatMap((item) => item.idealPoints))).slice(0, 6);
  const weakestSkillAreas = Array.from(new Set(weakAnswers.map((item) => item.skillArea))).slice(0, 5);
  const strongestSkillAreas = Array.from(new Set(strongAnswers.map((item) => item.skillArea))).slice(0, 5);

  return {
    overall: average(history),
    technical: technicalAnswers.length ? averageBy(technicalAnswers, "technicalDepth") : averageBy(history, "technicalDepth"),
    communication: Math.round((averageBy(history, "clarity") + averageBy(history, "structure") + averageBy(history, "confidence")) / 3),
    resumeAlignment: resumeUploaded
      ? resumeAnswers.length
        ? averageBy(resumeAnswers, "resumeProof")
        : averageBy(history, "resumeProof")
      : 35,
    structure: averageBy(history, "structure"),
    confidence: averageBy(history, "confidence"),
    strongestSkillAreas,
    weakestSkillAreas,
    missingSignals,
    plannerTopics: missingSignals.length
      ? missingSignals
      : weakestSkillAreas.length
        ? weakestSkillAreas
        : ["Practice structured interview answers", "Add examples and measurable impact"],
    nextSteps: [
      "Rewrite the weakest answer using STAR or problem-approach-tradeoff-result structure.",
      "Practice one role-specific scenario before the next mock interview.",
      "Add project proof and measurable impact to your resume/Second Brain.",
      "Use the improved answer and follow-up question for a second attempt.",
    ],
  };
}

export function buildInterviewNoteContent({
  history,
  report,
  role,
  company,
  mode,
  difficulty,
}: {
  history: InterviewAnswer[];
  report: InterviewReport;
  role: string;
  company: string;
  mode: string;
  difficulty: string;
}) {
  return [
    "Interview Simulation Report",
    "",
    `Role: ${role}`,
    `Company: ${company}`,
    `Mode: ${mode}`,
    `Difficulty: ${difficulty}`,
    `Overall Score: ${report.overall}/100`,
    `Technical Score: ${report.technical}/100`,
    `Communication Score: ${report.communication}/100`,
    `Resume Alignment: ${report.resumeAlignment}/100`,
    "",
    "Weak areas to revise:",
    ...report.plannerTopics.map((item) => `- ${item}`),
    "",
    "Next steps:",
    ...report.nextSteps.map((item) => `- ${item}`),
    "",
    "Answers:",
    ...history.flatMap((item, index) => [
      `${index + 1}. ${item.question}`,
      `Skill Area: ${item.skillArea}`,
      `Score: ${item.score}/100`,
      `Technical Depth: ${item.technicalDepth ?? item.score}/100`,
      `Clarity: ${item.clarity ?? item.score}/100`,
      `Structure: ${item.structure ?? item.score}/100`,
      `Role Fit: ${item.roleFit ?? item.score}/100`,
      `Confidence: ${item.confidence ?? item.score}/100`,
      `Resume Proof: ${item.resumeProof ?? item.score}/100`,
      `Feedback: ${item.feedback}`,
      `Ideal Answer: ${item.idealAnswer ?? "Use the listed ideal signals."}`,
      `Improved Version: ${item.improvedAnswer ?? "Rewrite with structure, examples, and impact."}`,
      `Follow-up Question: ${item.followUpQuestion ?? "What tradeoff would you mention if pushed further?"}`,
      `Answer: ${item.answer}`,
      "",
    ]),
  ].join("\n");
}
