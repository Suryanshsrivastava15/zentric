export type CareerProfileInput = {
  dreamRole?: string | null;
  targetCompany?: string | null;
  resumeText?: string | null;
  skillsText?: string | null;
  projectsText?: string | null;
  experienceText?: string | null;
  educationText?: string | null;
  preferredKeywords?: string | null;
  jobDescriptionText?: string | null;
};

const defaultDreamRole = "Your Dream Role";
const defaultTargetCompany = "Your Target Company";

const companyKeywords: Record<string, string[]> = {
  Google: ["Graph Algorithms", "Dynamic Programming", "System Design", "Distributed Systems", "Testing", "Leadership"],
  Amazon: ["Leadership Principles", "System Design", "Scalability", "Java", "Ownership", "Behavioral Stories"],
  Microsoft: ["OOP", "System Design", "Cloud", "C#", "Distributed Systems", "Collaboration"],
  Atlassian: ["Frontend Architecture", "TypeScript", "Product Thinking", "Collaboration", "Testing", "APIs"],
  Adobe: ["Projects", "Creative Tools", "Performance", "Operating Systems", "Portfolio", "Design Thinking"],
  Uber: ["Graphs", "Distributed Systems", "Rate Limiting", "Backend", "System Design", "Scalability"],
};

function getCompanyKeywords(company: string, dreamRole: string) {
  const knownKeywords = companyKeywords[company];
  if (knownKeywords) return knownKeywords;

  const role = normalize(dreamRole);
  const roleKeywords = role.includes("frontend")
    ? ["React", "TypeScript", "Frontend Architecture", "Performance", "Accessibility", "Testing"]
    : role.includes("backend")
      ? ["REST API", "Databases", "System Design", "Scalability", "Caching", "Testing"]
      : role.includes("data")
        ? ["SQL", "Python", "Statistics", "Machine Learning", "Data Pipelines", "Communication"]
        : ["Data Structures", "Algorithms", "System Design", "Projects", "APIs", "Problem Solving"];

  return [
    ...roleKeywords,
    "Resume Metrics",
    "Project Impact",
    "Communication",
    "Ownership",
  ];
}

const baseKeywords = [
  "Next.js",
  "TypeScript",
  "React",
  "PostgreSQL",
  "Prisma",
  "REST API",
  "Docker",
  "System Design",
  "Graph Algorithms",
  "OpenAI",
  "Testing",
  "Metrics",
];

const keywordDictionary = [
  ...baseKeywords,
  "JavaScript",
  "Node.js",
  "Express",
  "NestJS",
  "MongoDB",
  "SQL",
  "Databases",
  "Python",
  "Java",
  "C++",
  "AWS",
  "Cloud",
  "Kubernetes",
  "CI/CD",
  "Redis",
  "GraphQL",
  "Microservices",
  "Authentication",
  "Security",
  "Accessibility",
  "Performance",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Data Structures",
  "Algorithms",
  "Dynamic Programming",
  "Graphs",
  "Operating Systems",
  "DBMS",
  "Computer Networks",
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalize(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function hasAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value.toLowerCase()));
}

function countMatches(text: string, values: string[]) {
  return values.filter((value) => text.includes(value.toLowerCase())).length;
}

function splitKeywords(value?: string | null) {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractKeywordsFromText(value?: string | null) {
  const text = normalize(value);
  return Array.from(new Set(keywordDictionary.filter((keyword) => text.includes(keyword.toLowerCase()))));
}

function percent(part: number, total: number, fallback = 0) {
  return total > 0 ? (part / total) * 100 : fallback;
}

function extractResumeSections(text: string) {
  return {
    hasSummary: hasAny(text, ["summary", "objective", "profile"]),
    hasContact: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text) || /\+?\d[\d\s().-]{8,}\d/.test(text),
    hasLinks: hasAny(text, ["linkedin.com", "github.com", "portfolio", "vercel.app", "netlify.app", "leetcode.com"]),
    hasSkillsSection: hasAny(text, ["skills", "technical skills", "technologies", "tools"]),
    hasProjectsSection: hasAny(text, ["projects", "project experience", "personal projects", "academic projects"]),
    hasExperienceSection: hasAny(text, ["experience", "work experience", "internship", "intern", "freelance"]),
    hasEducationSection: hasAny(text, ["education", "degree", "university", "college", "b.tech", "bachelor"]),
    hasCertifications: hasAny(text, ["certification", "certified", "course", "training"]),
  };
}

function getRoleKeywords(role: string) {
  const normalizedRole = normalize(role);

  if (hasAny(normalizedRole, ["frontend", "front end", "react", "ui"])) {
    return ["React", "TypeScript", "JavaScript", "Next.js", "Accessibility", "Performance", "Testing", "REST API"];
  }

  if (hasAny(normalizedRole, ["backend", "back end", "server", "api"])) {
    return ["Node.js", "REST API", "PostgreSQL", "SQL", "Authentication", "System Design", "Redis", "Docker", "Testing"];
  }

  if (hasAny(normalizedRole, ["full stack", "fullstack"])) {
    return ["React", "Node.js", "TypeScript", "REST API", "PostgreSQL", "System Design", "Authentication", "Testing"];
  }

  if (hasAny(normalizedRole, ["data analyst", "analyst", "data"])) {
    return ["SQL", "Python", "Statistics", "Data Pipelines", "Communication", "Metrics", "Machine Learning"];
  }

  if (hasAny(normalizedRole, ["ai", "ml", "machine learning"])) {
    return ["Python", "Machine Learning", "Data Structures", "Algorithms", "Metrics", "Testing", "OpenAI"];
  }

  if (hasAny(normalizedRole, ["sde", "software", "developer", "engineer"])) {
    return ["Data Structures", "Algorithms", "System Design", "REST API", "Databases", "Testing", "Projects", "Problem Solving"];
  }

  return ["Projects", "Communication", "Problem Solving", "Ownership", "Metrics", "Leadership"];
}

function getResumeQualitySignals(text: string, wordCount: number) {
  const bulletCount = (text.match(/(^|\n)\s*[-•*]/g) ?? []).length;
  const metricCount = (text.match(/\b\d+(\.\d+)?\s*(%|x|k|m|\+|users|ms|sec|minutes|hours|days|questions|problems)?\b/gi) ?? []).length;
  const actionVerbCount = countMatches(text, [
    "built",
    "created",
    "designed",
    "implemented",
    "developed",
    "launched",
    "optimized",
    "improved",
    "automated",
    "reduced",
    "increased",
    "led",
    "collaborated",
    "integrated",
  ]);
  const weakPhraseCount = countMatches(text, [
    "hard working",
    "quick learner",
    "good communication",
    "team player",
    "responsible for",
    "basic knowledge",
  ]);
  const words = text.match(/[a-z][a-z0-9+#.-]*/gi) ?? [];
  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  const alphabeticChars = text.toLowerCase().replace(/[^a-z]/g, "");
  const vowelCount = (alphabeticChars.match(/[aeiou]/g) ?? []).length;
  const vowelRatio = alphabeticChars.length ? vowelCount / alphabeticChars.length : 0;
  const hasRandomToken = words.some(
    (word) =>
      word.length >= 16 &&
      !keywordDictionary.some((keyword) => keyword.toLowerCase() === word.toLowerCase()),
  );

  return {
    bulletCount,
    metricCount,
    actionVerbCount,
    weakPhraseCount,
    uniqueWordRatio: words.length ? uniqueWords.size / words.length : 0,
    hasHealthyLength: wordCount >= 220 && wordCount <= 900,
    isTooThin: wordCount < 160,
    isTooLong: wordCount > 1100,
    looksUnreadable:
      alphabeticChars.length >= 18 &&
      (hasRandomToken || vowelRatio < 0.18 || vowelRatio > 0.72 || (words.length >= 8 && uniqueWords.size <= 3)),
  };
}

function strongSectionsFromPartialEvidence(
  sections: ReturnType<typeof extractResumeSections>,
  hasSkills: boolean,
  hasProjects: boolean,
  hasMetrics: boolean,
  hasActionVerbs: boolean,
) {
  return [
    sections.hasContact ? "Contact Info" : "",
    sections.hasLinks ? "Profile Links" : "",
    hasSkills ? "Skills" : "",
    hasProjects ? "Projects" : "",
    hasMetrics ? "Impact Metrics" : "",
    hasActionVerbs ? "Action Verbs" : "",
  ].filter(Boolean);
}

export function analyzeCareerProfile(profile: CareerProfileInput | null) {
  const dreamRole = profile?.dreamRole?.trim() || defaultDreamRole;
  const targetCompany = profile?.targetCompany?.trim() || defaultTargetCompany;
  const allText = [
    profile?.resumeText,
    profile?.skillsText,
    profile?.projectsText,
    profile?.experienceText,
    profile?.educationText,
  ]
    .filter(Boolean)
    .join("\n");
  const text = normalize(allText);
  const hasProfileEvidence = allText.replace(/\s+/g, "").length >= 20;
  const wordCount = allText.trim().split(/\s+/).filter(Boolean).length;
  const customKeywords = splitKeywords(profile?.preferredKeywords);
  const jobDescriptionText = profile?.jobDescriptionText ?? "";
  const jobDescriptionKeywords = extractKeywordsFromText(jobDescriptionText);
  const targetKeywords = [
    ...baseKeywords,
    ...getRoleKeywords(dreamRole),
    ...getCompanyKeywords(targetCompany, dreamRole),
    ...customKeywords,
  ];
  const uniqueKeywords = Array.from(new Set(targetKeywords));
  const hasJobDescription = jobDescriptionText.replace(/\s+/g, "").length >= 40;

  if (!hasProfileEvidence) {
    return {
      isAnalyzed: false,
      dreamRole,
      targetCompany,
      resumeScore: null,
      atsScore: null,
      resumeMatch: null,
      careerReadinessScore: null,
      jobDescriptionMatch: null,
      strongSections: [],
      needsImprovement: ["Paste your resume text or fill Skills, Projects, and Experience to start analysis."],
      matchedKeywords: [],
      missingKeywords: [],
      missingFromJobDescription: [],
      suggestions: [
        "Add your resume text or fill the profile sections, then click Save and Recalculate.",
        "Scores will appear only after Zentric has real resume/profile evidence to analyze.",
      ],
      suggestedBullet: "",
      scoreBreakdown: [],
      recommendedLearningPath: [],
      interviewPrep: ["Add resume/profile data first to generate personalized interview prep."],
      generatedInterviewQuestions: ["Upload or paste your resume first to unlock role-specific technical questions."],
      companies: Array.from(new Set([targetCompany, ...Object.keys(companyKeywords)])).map((company) => ({
        company,
        readiness: null,
        weakestSkills: ["Add resume/profile data first"],
        estimatedPrepTime: "Not analyzed yet",
        missingTopics: [],
      })),
    };
  }

  const matchedKeywords = uniqueKeywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  const missingKeywords = uniqueKeywords.filter((keyword) => !text.includes(keyword.toLowerCase())).slice(0, 8);
  const matchedJobDescriptionKeywords = jobDescriptionKeywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  const missingFromJobDescription = jobDescriptionKeywords.filter((keyword) => !text.includes(keyword.toLowerCase())).slice(0, 8);

  const sections = extractResumeSections(text);
  const quality = getResumeQualitySignals(text, wordCount);
  const hasMetrics = quality.metricCount >= 2 || /reduced|improved|increased|decreased|optimized|saved/.test(text);
  const hasActionVerbs = quality.actionVerbCount >= 3;
  const hasProjects = sections.hasProjectsSection || hasAny(text, ["project", "github", "deployed", "vercel"]);
  const hasSkills = sections.hasSkillsSection || matchedKeywords.length >= 4;
  const hasExperience = sections.hasExperienceSection || hasAny(text, ["intern", "experience", "freelance", "worked", "team"]);
  const hasEducation = sections.hasEducationSection;
  const recruiterEvidenceCount = [
    sections.hasContact,
    sections.hasLinks,
    hasSkills,
    hasProjects,
    hasExperience,
    hasEducation,
    hasMetrics,
    hasActionVerbs,
    matchedKeywords.length >= 3,
  ].filter(Boolean).length;
  const isResumeLike = recruiterEvidenceCount >= 3 && !quality.looksUnreadable;

  if (!isResumeLike && wordCount < 120) {
    const lowScore = quality.looksUnreadable
      ? 4
      : clamp(8 + recruiterEvidenceCount * 5 + Math.min(matchedKeywords.length, 3) * 3, 5, 28);
    const companies = Array.from(new Set([targetCompany, ...Object.keys(companyKeywords)])).map((company) => ({
      company,
      readiness: lowScore,
      weakestSkills: getCompanyKeywords(company, dreamRole).slice(0, 3),
      estimatedPrepTime: "Upload a real resume first",
      missingTopics: getCompanyKeywords(company, dreamRole).slice(0, 4),
    }));

    return {
      isAnalyzed: true,
      dreamRole,
      targetCompany,
      resumeScore: lowScore,
      atsScore: lowScore,
      resumeMatch: lowScore,
      careerReadinessScore: lowScore,
      jobDescriptionMatch: hasJobDescription ? lowScore : null,
      strongSections: strongSectionsFromPartialEvidence(sections, hasSkills, hasProjects, hasMetrics, hasActionVerbs),
      needsImprovement: [
        "Readable resume content",
        "Contact Info",
        "Skills Section",
        "Projects/Experience",
        "Impact Metrics",
        "Target Keywords",
      ],
      matchedKeywords,
      missingKeywords,
      missingFromJobDescription,
      suggestions: [
        quality.looksUnreadable
          ? "This upload does not look readable. Upload a proper PDF/DOCX/TXT resume or paste clean resume text."
          : "This looks too thin to score like a real resume. Add contact, skills, projects, education, and experience.",
        "Use bullet points with action verb + what you built + tech used + measurable result.",
        `Add role keywords for ${dreamRole}: ${uniqueKeywords.slice(0, 5).join(", ")}.`,
        "After adding real resume sections, recalculate to get a useful ATS-style score.",
      ],
      suggestedBullet: "",
      scoreBreakdown: [
        {
          label: "Resume Validity",
          value: lowScore,
          detail: "Input is too thin or unreadable for a reliable industry-style scan",
        },
        {
          label: "Keyword Match",
          value: clamp(percent(matchedKeywords.length, uniqueKeywords.length, 0)),
          detail: `${matchedKeywords.length}/${uniqueKeywords.length} target keywords found`,
        },
        {
          label: "Resume Sections",
          value: clamp((recruiterEvidenceCount / 9) * 100),
          detail: "Contact, links, skills, projects, experience, education, metrics, action verbs",
        },
        {
          label: "ATS Format",
          value: quality.looksUnreadable ? 4 : 18,
          detail: `${wordCount} words, ${quality.bulletCount} bullets, ${quality.weakPhraseCount} generic phrases`,
        },
      ],
      recommendedLearningPath: uniqueKeywords.slice(0, 5).map((keyword) => ({
        topic: keyword,
        action: "Add resume proof and practice this skill",
      })),
      interviewPrep: ["Upload a real resume first to unlock reliable resume-based interview prep."],
      generatedInterviewQuestions: [
        "Upload or paste a readable resume first. Random or very thin input cannot produce accurate questions.",
      ],
      companies,
    };
  }

  const structureScore =
    (sections.hasContact ? 6 : 0) +
    (sections.hasLinks ? 4 : 0) +
    (sections.hasSummary ? 3 : 0) +
    (hasSkills ? 6 : 0) +
    (hasProjects ? 6 : 0) +
    (hasExperience ? 5 : 0) +
    (hasEducation ? 4 : 0) +
    (sections.hasCertifications ? 2 : 0);
  const skillsMatchScore = percent(matchedKeywords.length, uniqueKeywords.length, 0) * 0.24;
  const impactScore =
    Math.min(10, quality.metricCount * 2.5) +
    Math.min(8, quality.actionVerbCount * 1.25) +
    (quality.bulletCount >= 5 ? 5 : quality.bulletCount >= 2 ? 3 : 0) +
    (hasProjects ? 6 : 0) +
    (hasExperience ? 6 : 0);
  const roleAlignmentScore =
    percent(matchedKeywords.length, uniqueKeywords.length, 0) * 0.2 +
    (targetCompany !== defaultTargetCompany ? 4 : 0);
  const readabilityScore =
    (quality.hasHealthyLength ? 6 : quality.isTooThin ? 1 : quality.isTooLong ? 2 : 4) +
    (quality.bulletCount >= 4 ? 3 : 1) -
    Math.min(4, quality.weakPhraseCount);
  const qualityScore = clamp(
    structureScore + skillsMatchScore + impactScore + roleAlignmentScore + readabilityScore - (quality.looksUnreadable ? 30 : 0),
  );
  const atsScore = clamp(
    (sections.hasContact ? 10 : 2) +
      (hasSkills ? 10 : 3) +
      (hasExperience || hasProjects ? 12 : 4) +
      (hasEducation ? 8 : 2) +
      percent(matchedKeywords.length, uniqueKeywords.length, 0) * 0.42 +
      (quality.bulletCount >= 4 ? 8 : 3) +
      (quality.hasHealthyLength ? 6 : 2) +
      (hasMetrics ? 4 : 0) -
      (quality.looksUnreadable ? 25 : 0),
  );
  const resumeScore = clamp(
    atsScore * 0.45 +
      qualityScore * 0.35 +
      percent(matchedKeywords.length, uniqueKeywords.length, 0) * 0.2 -
      (quality.weakPhraseCount ? Math.min(8, quality.weakPhraseCount * 2) : 0),
  );
  const resumeMatch = clamp(resumeScore * 0.5 + atsScore * 0.2 + percent(matchedKeywords.length, uniqueKeywords.length, 0) * 0.3);
  const jobDescriptionMatch = hasJobDescription
    ? clamp(percent(matchedJobDescriptionKeywords.length, jobDescriptionKeywords.length, 0) * 0.75 + resumeScore * 0.25)
    : null;

  const strongSections = [
    sections.hasContact ? "Contact Info" : "",
    sections.hasLinks ? "Profile Links" : "",
    hasProjects ? "Projects" : "",
    hasSkills ? "Skills" : "",
    hasMetrics ? "Impact Metrics" : "",
    hasActionVerbs ? "Action Verbs" : "",
  ].filter(Boolean);
  const needsImprovement = [
    !sections.hasContact ? "Contact Info" : "",
    !sections.hasLinks ? "LinkedIn/GitHub/Portfolio" : "",
    !hasExperience ? "Experience" : "",
    !hasMetrics ? "Metrics" : "",
    missingKeywords.length ? "Target Keywords" : "",
    !hasProjects ? "Projects" : "",
    quality.isTooThin ? "Resume Depth" : "",
    quality.weakPhraseCount ? "Generic Phrases" : "",
  ].filter(Boolean);

  const suggestedBullet =
    "Built an AI Growth Operating System using Next.js, TypeScript, PostgreSQL, Prisma, and OpenAI with personalized roadmaps, coding analytics, and intelligent revision planning.";

  const suggestions = [
    !sections.hasContact
      ? "Add clear contact info: email, phone/location, LinkedIn, and GitHub or portfolio link."
      : "Contact/profile basics are present. Keep links easy to scan at the top.",
    hasMetrics
      ? "Your resume has measurable impact signals. Keep adding numbers to each project bullet."
      : "Add measurable outcomes such as users, speed, accuracy, completion rate, or time saved.",
    hasProjects
      ? "Your project section is a strength. Make the first bullet explain product impact, not only tech stack."
      : "Add 2-3 project bullets with problem, tech stack, and measurable outcome.",
    hasActionVerbs
      ? "Action verbs are present. Keep bullets active: built, optimized, automated, improved, reduced."
      : "Start bullets with stronger action verbs like built, optimized, automated, improved, or led.",
    missingKeywords.length
      ? `Add missing ATS keywords naturally: ${missingKeywords.slice(0, 4).join(", ")}.`
      : "Your target keywords are well covered. Focus on sharper achievements.",
    `Improve your ${targetCompany} ${dreamRole} readiness by adding proof for: ${missingKeywords.slice(0, 3).join(", ") || "projects, metrics, and interview depth"}.`,
  ];

  const keywordMatchPercent = clamp(percent(matchedKeywords.length, uniqueKeywords.length, 0));
  const sectionPercent = clamp(
    percent(
      [sections.hasContact, sections.hasLinks, hasSkills, hasProjects, hasExperience, hasEducation].filter(Boolean).length,
      6,
      0,
    ),
  );
  const impactPercent = clamp(
    Math.min(100, quality.metricCount * 18 + quality.actionVerbCount * 8 + (quality.bulletCount >= 4 ? 18 : quality.bulletCount * 4)),
  );
  const formatPercent = clamp(
    (quality.hasHealthyLength ? 45 : quality.isTooThin ? 15 : 25) +
      (quality.bulletCount >= 4 ? 35 : quality.bulletCount * 7) +
      (quality.weakPhraseCount ? 5 : 20),
  );
  const scoreBreakdown = [
    {
      label: "Keyword Match",
      value: keywordMatchPercent,
      detail: `${matchedKeywords.length}/${uniqueKeywords.length} target keywords found`,
    },
    {
      label: "Resume Sections",
      value: sectionPercent,
      detail: "Contact, links, skills, projects, experience, education",
    },
    {
      label: "Impact & Metrics",
      value: impactPercent,
      detail: `${quality.metricCount} metrics and ${quality.actionVerbCount} action verbs detected`,
    },
    {
      label: "ATS Format",
      value: formatPercent,
      detail: `${wordCount} words, ${quality.bulletCount} bullets, ${quality.weakPhraseCount} generic phrases`,
    },
    {
      label: "Role Alignment",
      value: clamp(roleAlignmentScore * 5),
      detail: `Based on selected goal: ${dreamRole} at ${targetCompany}`,
    },
    {
      label: "Quality Signal",
      value: qualityScore,
      detail: "Recruiter-style quality before ATS weighting",
    },
  ];

  const companies = Array.from(new Set([targetCompany, ...Object.keys(companyKeywords)])).map((company) => {
    const keywords = getCompanyKeywords(company, dreamRole);
    const matched = keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
    const companyKeywordCoverage = percent(matched.length, keywords.length, 0);
    const readiness = clamp(
      companyKeywordCoverage * 0.55 +
        resumeScore * 0.25 +
        (hasProjects ? 8 : 0) +
        (hasMetrics ? 6 : 0) +
        (hasExperience ? 6 : 0),
    );
    return {
      company,
      readiness,
      weakestSkills: keywords.filter((keyword) => !matched.includes(keyword)).slice(0, 3),
      estimatedPrepTime: `${Math.max(10, Math.ceil((100 - readiness) / 1.6))} days`,
      missingTopics: keywords.filter((keyword) => !matched.includes(keyword)).slice(0, 4),
    };
  });
  const selectedCompanyReadiness = companies.find((company) => company.company === targetCompany)?.readiness ?? resumeMatch;
  const careerReadinessScore = clamp(resumeScore * 0.35 + resumeMatch * 0.3 + selectedCompanyReadiness * 0.35);

  return {
    isAnalyzed: true,
    dreamRole,
    targetCompany,
    resumeScore,
    atsScore,
    resumeMatch,
    careerReadinessScore,
    jobDescriptionMatch,
    strongSections: strongSections.length ? strongSections : ["Profile Basics"],
    needsImprovement: needsImprovement.length ? needsImprovement : ["Interview Storytelling"],
    matchedKeywords,
    missingKeywords,
    missingFromJobDescription,
    suggestions,
    suggestedBullet,
    scoreBreakdown,
    recommendedLearningPath: missingKeywords.slice(0, 5).map((keyword) => ({
      topic: keyword,
      action:
        keyword.toLowerCase().includes("graph") || keyword.toLowerCase().includes("dynamic")
          ? "Practice in Study Tracker and Coding Hub"
          : "Add notes, projects, or interview prep evidence",
    })),
    interviewPrep: [
      "Prepare a 90-second introduction mapped to your dream role.",
      "Write 5 STAR stories: leadership, conflict, failure, ownership, and impact.",
      `Practice technical rounds focused on ${missingKeywords.slice(0, 3).join(", ") || "system design and DSA"}.`,
      "Create one project deep-dive story covering architecture, tradeoffs, and metrics.",
    ],
    generatedInterviewQuestions: [
      `Explain why your resume matches ${targetCompany} ${dreamRole}.`,
      `Deep-dive into your strongest project: architecture, APIs, database, scaling, and tradeoffs.`,
      `Solve a technical problem involving ${missingKeywords[0] || "graphs"} and explain complexity.`,
      `What evidence do you have for ${matchedKeywords[0] || "problem solving"} in your resume?`,
      `Which missing skill for ${targetCompany} ${dreamRole} will you improve first, and what proof will you build?`,
    ],
    companies,
  };
}
