"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";

type Flashcard = { front: string; back: string };

type DailyTopic = {
  id: string;
  title: string;
  phase: string;
  day: number;
  duration: string;
  priority: string;
  videoUrl: string;
  resourceUrl: string;
  codingUrl: string;
  questions: string[];
  mastered: boolean;
  completedSteps?: string[];
  difficulty?: string;
  estimatedTime?: string;
  prerequisites?: string[];
  notes?: string;
  cheatSheet?: string[];
  flashcards?: Flashcard[];
  quiz?: string[];
  miniProject?: string;
  finalProject?: string;
  interviewQuestions?: string[];
  revisionNotes?: string;
  companyQuestions?: string[];
  docsUrl?: string;
  githubUrl?: string;
  bookSuggestions?: string[];
  aiExplanation?: string;
  recapPrompt?: string;
};

type CoachSnapshot = {
  dailyMission?: {
    mission: string;
    estimatedTime: string;
    readiness: string;
    why: string;
    tasks: string[];
  };
  memory: {
    careerGoal: string;
    dreamCompany: string;
    weakTopics: string;
  };
  dailyPlan: DailyTopic[];
  dayRecap: {
    day: number;
    completedTopics: number;
    summary: string;
    topics: string[];
  };
  revisionQueue?: Array<{
    topicId: string;
    topicTitle: string;
    phase: string;
    due: boolean;
    reason: string;
    actions: string[];
    quiz: string[];
  }>;
};

const learningSteps = [
  { id: "goal", title: "Today's Goal", icon: Target, hint: "Understand why this topic matters for your active goal." },
  { id: "video", title: "Watch Video", icon: PlayCircle, hint: "Open the best video/resource and learn the main idea." },
  { id: "notes", title: "Read Notes", icon: BookOpen, hint: "Read the AI notes, prerequisites, and cheatsheet." },
  { id: "quiz", title: "Practice Quiz", icon: FileText, hint: "Answer MCQ/scenario questions to check real understanding." },
  { id: "practice", title: "Practice Problems", icon: Code2, hint: "Solve topic questions in Coding Hub or external practice." },
  { id: "project", title: "Mini Project", icon: Layers, hint: "Apply the topic in a small proof-of-work." },
  { id: "reflection", title: "Reflection", icon: Sparkles, hint: "Write what you learned and what Zentric should revise tomorrow." },
];

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

function scoreTextEvidence(value: string, keywords: string[]) {
  const trimmed = value.trim();
  if (trimmed.length < 10) return 0;
  const words = tokenize(trimmed);
  const keywordHits = keywords.filter((keyword) => words.has(keyword.toLowerCase())).length;
  const lengthScore = Math.min(60, Math.round(trimmed.length / 5));
  const keywordScore = Math.min(25, keywordHits * 8);
  const reflectionScore = /learned|stuck|mistake|project|solve|revise|example/i.test(trimmed) ? 15 : 0;
  return Math.min(100, lengthScore + keywordScore + reflectionScore);
}

function qualityLabel(score: number) {
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "needs review";
  return "incomplete";
}

function getMcqOptions(question: string) {
  return Array.from(question.matchAll(/([A-D])\)\s*([^\n]+)/g)).map((match) => ({
    option: match[1]!,
    text: match[2]!.trim(),
  }));
}

function getCorrectOption(question: string) {
  const explicitAnswer = question.match(/(?:correct|answer)\s*:\s*([A-D])/i)?.[1];
  if (explicitAnswer) return explicitAnswer.toUpperCase();
  if (question.includes("optimize first")) return "B";
  if (question.includes("input is most important")) return "B";
  if (question.includes("first thing to identify")) return "A";
  if (question.includes("method best tests")) return "B";
  if (question.includes("understanding of")) return "B";
  return null;
}

function getQuestionPrompt(question: string) {
  return (question.split(/\nA\)/)[0] ?? question).replace(/(?:correct|answer)\s*:\s*[A-D].*$/i, "").trim();
}

function getQuizQuestion(question: string, topic: string, goal: string) {
  const existingOptions = getMcqOptions(question);
  const correctOption = getCorrectOption(question);
  if (existingOptions.length && correctOption) {
    return {
      prompt: getQuestionPrompt(question),
      options: existingOptions,
      correctOption,
      explanation: `Correct answer: ${correctOption}. This checks whether you understood ${topic} for ${goal}.`,
    };
  }

  return {
    prompt: getQuestionPrompt(question).replace(/^Short Answer:\s*/i, "").replace(/^Scenario:\s*/i, ""),
    options: [
      { option: "A", text: `Identify the core idea of ${topic}, connect it to ${goal}, then practice it.` },
      { option: "B", text: "Memorize random lines without checking understanding." },
      { option: "C", text: "Skip examples, mistakes, and revision." },
      { option: "D", text: "Only watch content without solving or writing anything." },
    ],
    correctOption: "A",
    explanation: `Correct answer: A. Zentric expects concept, application, practice, and revision — not passive watching.`,
  };
}

function scoreQuizAnswers(questions: ReturnType<typeof getQuizQuestion>[], answers: string[]) {
  if (!questions.length) return 0;
  const correctCount = questions.reduce((count, question, index) => {
    return count + (answers[index]?.trim().toUpperCase() === question.correctOption ? 1 : 0);
  }, 0);
  return Math.round((correctCount / questions.length) * 100);
}

export default function LearningModePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#315F8F]" />
        </main>
      }
    >
      <LearningModeContent />
    </Suspense>
  );
}

function LearningModeContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const [coach, setCoach] = useState<CoachSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStep, setSavingStep] = useState("");
  const [message, setMessage] = useState("");
  const [videoTakeaway, setVideoTakeaway] = useState("");
  const [notesTakeaway, setNotesTakeaway] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [practiceEvidence, setPracticeEvidence] = useState("");
  const [projectEvidence, setProjectEvidence] = useState("");
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    fetch("/api/coach")
      .then((response) => response.json())
      .then((data: CoachSnapshot) => setCoach(data))
      .finally(() => setLoading(false));
  }, []);

  const topic = useMemo(() => {
    const dailyPlan = coach?.dailyPlan ?? [];
    return dailyPlan.find((item) => item.id === topicId) ?? dailyPlan.find((item) => !item.mastered) ?? dailyPlan[0] ?? null;
  }, [coach, topicId]);

  const completedSteps = new Set(topic?.completedSteps ?? []);
  const completedStepCount = learningSteps.filter((step) => completedSteps.has(step.id)).length;
  const progress = learningSteps.length ? Math.round((completedStepCount / learningSteps.length) * 100) : 0;
  const nextStep = learningSteps.find((step) => !completedSteps.has(step.id)) ?? null;
  const sessionComplete = progress === 100;
  const currentTopicIndex = coach?.dailyPlan.findIndex((item) => item.id === topic?.id) ?? -1;
  const nextTopic = currentTopicIndex >= 0 ? coach?.dailyPlan[currentTopicIndex + 1] : null;
  const topicRevision = coach?.revisionQueue?.find((item) => item.topicId === topic?.id);
  const goalLabel = `${coach?.memory.careerGoal ?? "your goal"}${coach?.memory.dreamCompany ? ` at ${coach.memory.dreamCompany}` : ""}`;
  const quizItems = topic?.quiz ?? topic?.questions ?? [];
  const visibleQuizQuestions = quizItems.slice(0, 5).map((question) => getQuizQuestion(question, topic?.title ?? "this topic", goalLabel));
  const answeredQuizCount = visibleQuizQuestions.filter((_, index) => Boolean(quizAnswers[index]?.trim())).length;
  const quizScore = scoreQuizAnswers(visibleQuizQuestions, quizAnswers);
  const quizPassed = visibleQuizQuestions.length > 0 && answeredQuizCount === visibleQuizQuestions.length && quizScore >= 60;
  const evidenceKeywords = [topic?.title ?? "", ...(topic?.cheatSheet ?? []), ...(topic?.questions ?? [])]
    .join(" ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 12);
  const currentStepReady =
    !nextStep ||
    nextStep.id === "goal" ||
    (nextStep.id === "video" && videoTakeaway.trim().length >= 10) ||
    (nextStep.id === "notes" && notesTakeaway.trim().length >= 10) ||
    (nextStep.id === "quiz" && quizPassed) ||
    (nextStep.id === "practice" && practiceEvidence.trim().length >= 10) ||
    (nextStep.id === "project" && projectEvidence.trim().length >= 10) ||
    (nextStep.id === "reflection" && reflection.trim().length >= 10);

  const completeStep = async (step: (typeof learningSteps)[number]) => {
    if (!topic || completedSteps.has(step.id)) return;
    let evidence = "";
    let score: number | null = null;
    let answers: string[] | undefined;

    if (step.id === "video") {
      evidence = videoTakeaway.trim();
      score = Math.max(60, scoreTextEvidence(evidence, evidenceKeywords));
      if (evidence.length < 10) {
        setMessage("Write 1-2 lines about what you learned from the video, then complete it.");
        return;
      }
    }

    if (step.id === "notes") {
      evidence = notesTakeaway.trim();
      score = Math.max(60, scoreTextEvidence(evidence, evidenceKeywords));
      if (evidence.length < 10) {
        setMessage("Write a short notes summary first, then complete it.");
        return;
      }
    }

    if (step.id === "quiz") {
      answers = visibleQuizQuestions.map((_, index) => quizAnswers[index] ?? "");
      const unanswered = visibleQuizQuestions.length - answers.filter((answer) => answer.trim()).length;
      if (!visibleQuizQuestions.length) {
        setMessage("No quiz questions are available for this topic yet.");
        return;
      }
      if (unanswered > 0) {
        setMessage(`Answer all ${visibleQuizQuestions.length} quiz questions before completing the quiz.`);
        return;
      }
      score = scoreQuizAnswers(visibleQuizQuestions, answers);
      if (score < 60) {
        setMessage(`Quiz score is ${score}%. Review the wrong answers and score at least 60% to complete this step.`);
        return;
      }
      evidence = `MCQ quiz checked by Zentric. Score: ${score}%. Correct answers: ${visibleQuizQuestions.map((question) => question.correctOption).join(", ")}.`;
    }

    if (step.id === "practice") {
      evidence = practiceEvidence.trim();
      score = Math.max(60, scoreTextEvidence(evidence, evidenceKeywords));
      if (evidence.length < 10) {
        setMessage("Write/paste a short practice proof first, then complete it.");
        return;
      }
    }

    if (step.id === "project") {
      evidence = projectEvidence.trim();
      score = Math.max(60, scoreTextEvidence(evidence, evidenceKeywords));
      if (evidence.length < 10) {
        setMessage("Write a short project proof first, then complete it.");
        return;
      }
    }

    if (step.id === "reflection") {
      evidence = reflection.trim();
      score = Math.max(60, scoreTextEvidence(evidence, evidenceKeywords));
      if (evidence.length < 10) {
        setMessage("Write a short reflection first, then complete it.");
        return;
      }
    }

    setSavingStep(step.id);
    setMessage("");
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_learning_step",
          topicId: topic.id,
          topicTitle: topic.title,
          stepId: step.id,
          stepTitle: step.title,
          day: topic.day,
          evidence: evidence || undefined,
          score,
          quality: score === null ? undefined : qualityLabel(score),
          answers,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save learning step.");
      setCoach(data);
      setMessage(`${step.title} completed for ${topic.title}${score === null ? "" : ` with ${score}% quality`}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save learning step.");
    } finally {
      setSavingStep("");
    }
  };

  const completeDay = async () => {
    if (!topic) return;
    setSavingStep("complete-day");
    setMessage("");
    try {
      if (!completedSteps.has("reflection")) {
        const reflectionResponse = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete_learning_step",
            topicId: topic.id,
            topicTitle: topic.title,
            stepId: "reflection",
            stepTitle: "Reflection",
            day: topic.day,
          }),
        });
        if (!reflectionResponse.ok) {
          const reflectionData = await reflectionResponse.json();
          throw new Error(reflectionData.error || "Unable to save reflection step.");
        }
      }

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "visit_roadmap_topic",
          topicId: topic.id,
          topicTitle: topic.title,
          phase: topic.phase,
          day: topic.day,
          reflection,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to complete day.");

      if (reflection.trim()) {
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Learning Recap · Day ${topic.day} · ${topic.title}`,
            category: "learning",
            tags: `learning-mode,${topic.phase},${topic.title}`,
            content: [
              `Goal: ${goalLabel}`,
              `Topic: ${topic.title}`,
              `Phase: ${topic.phase}`,
              `Reflection: ${reflection.trim()}`,
              videoTakeaway.trim() ? `Video takeaway: ${videoTakeaway.trim()}` : "",
              notesTakeaway.trim() ? `Notes takeaway: ${notesTakeaway.trim()}` : "",
              practiceEvidence.trim() ? `Practice proof: ${practiceEvidence.trim()}` : "",
              projectEvidence.trim() ? `Project proof: ${projectEvidence.trim()}` : "",
            ].filter(Boolean).join("\n\n"),
          }),
        });
      }

      setCoach(data);
      setMessage(`Day ${topic.day} updated. ${topic.title} is now marked complete${reflection.trim() ? " and saved to Second Brain" : ""}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete day.");
    } finally {
      setSavingStep("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315F8F]" />
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="zentric-page-shell mx-auto max-w-6xl">
        <EmptyState
          icon={GraduationCap}
          title="No guided learning mission yet."
          description="Set or resume a goal in AI Coach and Zentric will create your next learning session with video, notes, quiz, coding practice, project work, and recap."
          action={
            <Button asChild className="zentric-primary-action text-white">
              <Link href="/ai-coach">
                <Sparkles className="h-4 w-4" />
                Open AI Coach
              </Link>
            </Button>
          }
          secondary={
            <Button asChild variant="outline" className="border-blue-400/30 text-[#315F8F]">
              <Link href="/planner">
                View Planner
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="zentric-page-shell mx-auto max-w-7xl">
      <section className="mb-6 overflow-hidden rounded-[1.75rem] zentric-human-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 border-purple-400/30 bg-purple-500/10 text-[#315F8F]">
              <Sparkles className="mr-1 h-3 w-3" />
              Learning Mode
            </Badge>
            <h1 className="text-3xl font-bold text-[#172033] md:text-5xl">Day {topic.day}: {topic.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#344054]">
              A guided workspace for {goalLabel}. Watch, read, practice, build, reflect, and complete the day
              without planning manually.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <div className="rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">Session Progress</p>
              <p className="mt-2 text-3xl font-bold text-[#28714D]">{progress}%</p>
              <p className="mt-1 text-xs text-[#667085]">{completedStepCount}/{learningSteps.length} steps complete</p>
            </div>
            <div className="rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">Next Step</p>
              <p className="mt-2 text-lg font-bold text-[#315F8F]">{nextStep?.title ?? "Complete recap"}</p>
              <p className="mt-1 text-xs text-[#667085]">{coach?.dailyMission?.estimatedTime ?? topic.duration}</p>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div className="mb-5 rounded-2xl border border-[#BFD9C8] bg-[#F0F8F3] px-4 py-3 text-sm text-[#28714D]">
          {message}
        </div>
      )}

      <section className="mb-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-blue-400/20 bg-blue-500/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-[#315F8F]" />
              Active Mission Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg font-semibold text-[#172033]">
              {coach?.dailyMission?.mission ?? `Prepare ${topic.title} for ${goalLabel}`}
            </p>
            <p className="text-sm leading-6 text-[#667085]">
              {coach?.dailyMission?.why ?? topic.aiExplanation ?? "Zentric selected this topic from your active goal and today's Planner routine."}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Readiness" value={coach?.dailyMission?.readiness ?? "Building momentum"} />
              <Info label="Weak Focus" value={coach?.memory.weakTopics ?? topic.title} />
              <Info label="Current Phase" value={topic.phase} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-400/20 bg-purple-500/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-[#315F8F]" />
              Do This Next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
              <p className="text-sm font-semibold text-[#172033]">{nextStep?.title ?? "Finish the recap"}</p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {nextStep?.hint ?? "You completed the learning loop. Review your recap and move to the next topic when ready."}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[#667085]">
              Zentric updates Planner and AI Coach after each completed step.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-purple-400/20 bg-purple-500/[0.04]">
          <CardHeader>
            <CardTitle>Mission Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {learningSteps.map((step) => {
              const Icon = step.icon;
              const done = completedSteps.has(step.id);
              return (
                <button
                  key={step.id}
                  onClick={() => completeStep(step)}
                  disabled={done || Boolean(savingStep)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4 text-left transition hover:border-purple-400/30 hover:bg-purple-500/10 disabled:cursor-default disabled:opacity-80"
                >
                  <span className={done ? "text-[#28714D]" : "text-[#315F8F]"}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : savingStep === step.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span>
                    <span className="block font-medium text-[#172033]">{step.title}</span>
                    <span className="text-xs text-[#667085]">{done ? "Completed" : "Click when finished"}</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-emerald-400/20 bg-emerald-500/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[#28714D]" />
                Guided Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#667085]">Current action</p>
                <p className="mt-2 text-lg font-semibold text-[#172033]">{nextStep?.title ?? "Session complete"}</p>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  {nextStep?.hint ?? "All learning steps are complete. Read your recap and finish the day."}
                </p>
              </div>

              {nextStep?.id === "goal" && (
                <Panel
                  title="What you are mastering today"
                  items={[
                    `${topic.title} for ${goalLabel}`,
                    topic.aiExplanation ?? topic.notes ?? "Understand the core idea and why it matters.",
                    `Finish this session to update Planner, AI Coach, and revision tracking.`,
                  ]}
                />
              )}

              {nextStep?.id === "video" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm leading-6 text-[#315F8F]">
                    Step 1: open the video. Step 2: write 1-2 lines about what you learned. Step 3: click complete.
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Button asChild variant="outline" className="border-red-400/30 text-[#9B2C2C]">
                      <Link href={topic.videoUrl} target="_blank">Open Video</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-blue-400/30 text-[#315F8F]">
                      <Link href={topic.docsUrl ?? topic.resourceUrl} target="_blank">Backup Resource</Link>
                    </Button>
                  </div>
                  <Textarea
                    value={videoTakeaway}
                    onChange={(event) => setVideoTakeaway(event.target.value)}
                    placeholder="Example: I learned the main idea, how it is used, and one place where I got confused..."
                    className="min-h-24"
                  />
                  {videoTakeaway.trim().length > 0 && videoTakeaway.trim().length < 10 ? (
                    <p className="text-xs text-[#7A5B00]">Write a little more to unlock completion.</p>
                  ) : null}
                </div>
              )}

              {nextStep?.id === "notes" && (
                <div className="space-y-3">
                  <Panel title="Read this before practice" items={[topic.notes ?? `Learn ${topic.title} deeply.`, ...(topic.cheatSheet ?? topic.questions).slice(0, 4)]} />
                  <Textarea
                    value={notesTakeaway}
                    onChange={(event) => setNotesTakeaway(event.target.value)}
                    placeholder="Summarize the notes in your own words and mention what should be revised..."
                    className="min-h-24"
                  />
                </div>
              )}

              {nextStep?.id === "quiz" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#172033]">MCQ Practice Quiz</p>
                        <p className="mt-1 text-xs text-[#667085]">
                          Answer all questions. You need at least 60% to complete this step.
                        </p>
                      </div>
                      <Badge className={quizPassed ? "border-emerald-400/30 bg-emerald-400/10 text-[#28714D]" : "border-yellow-400/30 bg-yellow-400/10 text-[#7A5B00]"}>
                        Score {answeredQuizCount}/{visibleQuizQuestions.length}: {quizScore}%
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {visibleQuizQuestions.map((question, index) => {
                      const selectedAnswer = (quizAnswers[index] ?? "").trim().toUpperCase();
                      const isAnswered = selectedAnswer.length > 0;
                      const isCorrect = selectedAnswer === question.correctOption;

                      return (
                        <div key={`${question.prompt}-${index}`} className="block rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">Question {index + 1}</span>
                          <p className="mt-1 text-sm text-[#344054]">{question.prompt}</p>

                          <div className="mt-3 grid gap-2">
                            {question.options.map((item) => {
                              const selected = selectedAnswer === item.option;
                              const correct = isAnswered && item.option === question.correctOption;
                              return (
                                <button
                                  key={item.option}
                                  type="button"
                                  onClick={() => {
                                    const nextAnswers = [...quizAnswers];
                                    nextAnswers[index] = item.option;
                                    setQuizAnswers(nextAnswers);
                                  }}
                                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                                    selected
                                      ? isCorrect
                                        ? "border-emerald-400/40 bg-emerald-400/10 text-[#28714D]"
                                        : "border-red-400/40 bg-red-400/10 text-[#9B2C2C]"
                                      : correct
                                        ? "border-emerald-400/30 bg-emerald-400/5 text-[#28714D]"
                                        : "border-[#D6E4F5] bg-[#FFFDF9] text-[#344054] hover:border-[#A8BFD8]"
                                  }`}
                                >
                                  <span className="font-semibold">{item.option})</span> {item.text}
                                </button>
                              );
                            })}
                            {isAnswered ? (
                              <p className={isCorrect ? "text-xs font-medium text-[#28714D]" : "text-xs font-medium text-[#9B2C2C]"}>
                                {isCorrect ? "Correct." : `Wrong — correct answer is ${question.correctOption}.`} {question.explanation}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {nextStep?.id === "practice" && (
                <div className="space-y-3">
                  <Panel title="Practice targets" items={topic.companyQuestions ?? topic.questions} />
                  <Button asChild className="zentric-primary-action text-white">
                    <Link href={topic.codingUrl} target={topic.codingUrl.startsWith("/") ? undefined : "_blank"}>
                      Open Practice
                    </Link>
                  </Button>
                  <Textarea
                    value={practiceEvidence}
                    onChange={(event) => setPracticeEvidence(event.target.value)}
                    placeholder="Paste your solution approach, code snippet, edge cases, or solved-question proof..."
                    className="min-h-28 font-mono text-sm"
                  />
                </div>
              )}

              {nextStep?.id === "project" && (
                <div className="space-y-3">
                  <Panel
                    title="Build proof-of-work"
                    items={[
                      topic.miniProject ?? `Create a mini project for ${topic.title}.`,
                      topic.finalProject ?? `Connect ${topic.title} to a larger portfolio or preparation file.`,
                    ]}
                  />
                  <Textarea
                    value={projectEvidence}
                    onChange={(event) => setProjectEvidence(event.target.value)}
                    placeholder="Describe what you built, files/links if any, and how it proves this topic..."
                    className="min-h-24"
                  />
                </div>
              )}

              {nextStep?.id === "reflection" && (
                <Textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="Write what you learned, where you got stuck, and what should be revised tomorrow..."
                  className="min-h-28"
                />
              )}

              {nextStep ? (
                <Button
                  onClick={() => completeStep(nextStep)}
                  disabled={Boolean(savingStep) || !currentStepReady}
                  className="zentric-primary-action text-white"
                >
                  {savingStep === nextStep.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {nextStep.id === "video" && !currentStepReady
                    ? "Open video and write takeaway"
                    : nextStep.id === "quiz" && !currentStepReady
                      ? "Answer all MCQs and score 60%+"
                      : `Mark ${nextStep.title} Complete`}
                </Button>
              ) : (
                <Button
                  onClick={completeDay}
                  disabled={savingStep === "complete-day"}
                  className="zentric-primary-action text-white"
                >
                  {savingStep === "complete-day" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Finish Day Recap
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-400/20 bg-blue-500/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#315F8F]" />
                Topic Mastery Kit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Info label="Difficulty" value={topic.difficulty ?? "Adaptive"} />
                <Info label="Estimated Time" value={topic.estimatedTime ?? topic.duration} />
                <Info label="Phase" value={topic.phase} />
              </div>
              <p className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4 text-sm leading-6 text-[#344054]">
                {topic.aiExplanation ?? topic.notes}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Button asChild variant="outline" className="border-red-400/30 text-[#9B2C2C]">
                  <Link href={topic.videoUrl} target="_blank">Best Video</Link>
                </Button>
                <Button asChild variant="outline" className="border-blue-400/30 text-[#315F8F]">
                  <Link href={topic.docsUrl ?? topic.resourceUrl} target="_blank">Docs / Notes</Link>
                </Button>
                <Button asChild variant="outline" className="border-emerald-400/30 text-[#28714D]">
                  <Link href={topic.codingUrl} target={topic.codingUrl.startsWith("/") ? undefined : "_blank"}>Practice</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#315F8F]" />
                Notes, Cheatsheet & Revision
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <Panel title="AI Notes" items={[topic.notes ?? `Learn ${topic.title} deeply and practice it today.`]} />
              <Panel title="Cheatsheet" items={topic.cheatSheet ?? topic.questions} />
              <Panel title="Prerequisites" items={topic.prerequisites ?? ["Foundation concepts"]} />
              <Panel title="Revision Notes" items={[topic.revisionNotes ?? topic.recapPrompt ?? "Revise this topic tomorrow."]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-300" />
                Quiz, Practice & Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <Panel title="Practice Quiz Questions" items={visibleQuizQuestions.map((question) => question.prompt)} />
              <Panel title="Company / Exam Questions" items={topic.companyQuestions ?? topic.questions} />
              <Panel title="Mini Project" items={[topic.miniProject ?? `Create a mini project for ${topic.title}.`]} />
              <Panel title="Final Project" items={[topic.finalProject ?? `Add ${topic.title} to a larger portfolio project.`]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-300" />
                Session Recap & Reflection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Info label="Session Status" value={sessionComplete ? "Ready to complete" : `${progress}% complete`} />
                <Info label="Next Topic" value={nextTopic?.title ?? "Generated tomorrow"} />
                <Info label="Revision Trigger" value={topicRevision?.due ? "Due now" : "Queued by AI Coach"} />
              </div>

              <div className="rounded-2xl border border-[#BFD9C8] bg-[#F0F8F3] p-4">
                <p className="font-semibold text-[#28714D]">AI recap preview</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                  Today you are building mastery in {topic.title}. After you complete the day, AI Coach will use your
                  finished steps and reflection to update Planner progress, your growth timeline, and tomorrow&apos;s revision queue.
                </p>
              </div>

              {topicRevision && (
                <Panel title="Revision handoff" items={[topicRevision.reason, ...topicRevision.actions, ...(topicRevision.quiz ?? []).slice(0, 2)]} />
              )}

              <div className="grid gap-3 md:grid-cols-3">
                {(topic.flashcards ?? []).map((card) => (
                  <div key={card.front} className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                    <p className="text-sm font-semibold text-[#172033]">{card.front}</p>
                    <p className="mt-2 text-xs leading-5 text-[#667085]">{card.back}</p>
                  </div>
                ))}
              </div>
              <Textarea
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                placeholder="Write what you learned, where you got stuck, and what should be revised tomorrow..."
                className="min-h-28"
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={completeDay}
                  disabled={savingStep === "complete-day" || !sessionComplete}
                  className="zentric-primary-action text-white"
                >
                  {savingStep === "complete-day" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Complete Day
                </Button>
                {nextTopic && (
                  <Button asChild variant="outline" className="border-blue-400/30 text-[#315F8F]">
                    <Link href={`/learning-mode?topic=${nextTopic.id}`}>
                      Next Topic
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="border-purple-400/30 text-[#315F8F]">
                  <Link href="/planner">
                    <RefreshCw className="h-4 w-4" />
                    Back to Planner
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#667085]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#172033]">{value}</p>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
      <p className="mb-3 font-semibold text-[#172033]">{title}</p>
      <ul className="space-y-2 text-sm leading-6 text-[#667085]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

