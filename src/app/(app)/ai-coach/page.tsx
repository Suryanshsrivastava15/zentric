"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  Loader2,
  MemoryStick,
  Repeat2,
  Route,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CoachSnapshot = {
  user: { name: string; email: string };
  goalProfiles: Array<{
    id: string;
    goalKey: string;
    careerGoal: string;
    dreamCompany: string;
    isActive: boolean;
    currentStage: string;
    updatedAt: string;
    roadmapStartedAt: string;
  }>;
  onboarding: {
    complete: boolean;
    completionPercent: number;
    missing: string[];
    message: string;
  };
  goalTrack: {
    id: string;
    title: string;
    questionMode: string;
    defaultWeakTopic: string;
    defaultStrongTopic: string;
  };
  memory: {
    careerGoal: string;
    dreamCompany: string;
    educationStage: string;
    schoolClass: string;
    engineeringYear: string;
    graduationStatus: string;
    currentStage: string;
    skillLevel: string;
    preferredLanguage: string;
    dailyStudyTime: string;
    targetDeadline: string;
    roadmapStartedAt: string;
    strongTopics: string;
    weakTopics: string;
    currentPhase: string;
  };
  connectedModules: Array<{ name: string; count: number; status: string }>;
  metrics: {
    growthScore: number;
    strongestArea: { label: string; value: number; module: string; href: string };
    weakestArea: { label: string; value: number; module: string; href: string };
    completedTasks: number;
    completedTopics: number;
    inProgressTopics: number;
    notes: number;
    eventsThisWeek: number;
    targetRoleMatch: number | null;
    feedbackThisWeek: number;
    negativeFeedback: number;
  };
  roadmap: Array<{
    phase: string;
    level: string;
    project: string;
    goalFit: string;
    topics: Array<{
      id: string;
      title: string;
      mastered: boolean;
      status: string;
      videoUrl: string;
      resourceUrl: string;
      codingUrl: string;
      questions: string[];
    }>;
  }>;
  dailyPlan: Array<{
    id: string;
    title: string;
    phase: string;
    day: number;
    time: string;
    duration: string;
    priority: string;
    videoUrl: string;
    resourceUrl: string;
    codingUrl: string;
    questions: string[];
    mastered: boolean;
    recapPrompt: string;
    completedSteps?: string[];
  }>;
  dayRecap: {
    day: number;
    completedTopics: number;
    topics: string[];
    summary: string;
    nextDayHint: string;
  };
  revisionQueue: Array<{
    topicId: string;
    topicTitle: string;
    phase: string;
    daysSince: number;
    due: boolean;
    reason: string;
    actions: string[];
    quiz: string[];
  }>;
  timeline: Array<{
    id: string;
    date: string;
    achievement: string;
    module: string;
    growthImpact: string;
    insight: string;
    nextMilestone: string;
  }>;
  quickActions: Array<{ label: string; href: string }>;
};

function getMemoryFormFromCoach(data: CoachSnapshot) {
  return {
    careerGoal: data.memory.careerGoal === "your dream role" ? "" : data.memory.careerGoal,
    dreamCompany: data.memory.dreamCompany === "your target company" ? "" : data.memory.dreamCompany,
    educationStage: data.memory.educationStage === "Not set" ? "" : data.memory.educationStage,
    schoolClass: data.memory.schoolClass,
    engineeringYear: data.memory.engineeringYear,
    graduationStatus: data.memory.graduationStatus,
    skillLevel: data.memory.skillLevel === "Not set" ? "" : data.memory.skillLevel,
    preferredLanguage: data.memory.preferredLanguage === "Not set" ? "" : data.memory.preferredLanguage,
    dailyStudyMinutes: data.memory.dailyStudyTime === "AI estimated" ? "" : data.memory.dailyStudyTime.replace(/\D/g, ""),
    targetDeadline: data.memory.targetDeadline ? data.memory.targetDeadline.slice(0, 10) : "",
    strongTopics: data.memory.strongTopics,
    weakTopics: data.memory.weakTopics,
  };
}

export default function AICoachPage() {
  const [coach, setCoach] = useState<CoachSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMemory, setSavingMemory] = useState(false);
  const [switchingGoal, setSwitchingGoal] = useState("");
  const [coachMessage, setCoachMessage] = useState("");
  const [memoryForm, setMemoryForm] = useState({
    careerGoal: "",
    dreamCompany: "",
    educationStage: "",
    schoolClass: "",
    engineeringYear: "",
    graduationStatus: "",
    skillLevel: "",
    preferredLanguage: "",
    dailyStudyMinutes: "",
    targetDeadline: "",
    strongTopics: "",
    weakTopics: "",
  });

  useEffect(() => {
    fetch("/api/coach")
      .then((response) => response.json())
      .then((data: CoachSnapshot) => {
        setCoach(data);
        setMemoryForm(getMemoryFormFromCoach(data));
      })
      .finally(() => setLoading(false));
  }, []);

  const saveMemory = async () => {
    setSavingMemory(true);
    setCoachMessage("");
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_memory", ...memoryForm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update AI Coach memory.");
      setCoach(data);
      setMemoryForm(getMemoryFormFromCoach(data));
      setCoachMessage("Goal profile saved. If this goal already existed, Zentric resumed it from where you left.");
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "Unable to update AI Coach memory.");
    } finally {
      setSavingMemory(false);
    }
  };

  const switchGoal = async (goalKey: string) => {
    setSwitchingGoal(goalKey);
    setCoachMessage("");
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_goal", goalKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to switch goal profile.");
      setCoach(data);
      setMemoryForm(getMemoryFormFromCoach(data));
      setCoachMessage("Goal switched. AI Coach, roadmap, planner suggestions, and timeline are now focused on this profile.");
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "Unable to switch goal profile.");
    } finally {
      setSwitchingGoal("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
      </main>
    );
  }

  if (!coach) {
    return (
      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            Unable to load AI Coach right now.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="zentric-page-shell relative mx-auto max-w-7xl overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-56 h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl" />

      <section className="zentric-human-card relative mb-6 overflow-hidden rounded-[1.75rem] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 border-[#CFE0F2] bg-[#EEF4FF] text-[#315F8F]">
              <BrainCircuit className="mr-1 h-3 w-3" />
              Central Intelligence
            </Badge>
            <p className="text-sm text-[#315F8F]">Hi, {coach.user.name}</p>
            <h1 className="mt-2 text-3xl font-bold text-[#172033] md:text-5xl">AI Coach</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">
              Not a chatbot — this is Zentric&apos;s mentor brain. It watches your roadmap, planner activity,
              completed topics, coding practice, Second Brain, and Career Hub progress to keep your growth plan accurate.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <MetricCard label="Growth Score" value={`${coach.metrics.growthScore}%`} />
            <MetricCard label="Target Match" value={typeof coach.metrics.targetRoleMatch === "number" ? `${coach.metrics.targetRoleMatch}%` : "Upload resume"} />
            <MetricCard label="Coach Setup" value={`${coach.onboarding.completionPercent}%`} />
          </div>
        </div>
      </section>

      {coachMessage && (
        <div className="relative mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {coachMessage}
        </div>
      )}

      <section className="relative mb-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-blue-400/20 bg-blue-500/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-blue-300" />
              Current Goal Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Active mission</p>
              <p className="mt-2 text-xl font-semibold text-white">{coach.memory.careerGoal}</p>
              <p className="mt-1 text-sm text-blue-200">{coach.memory.dreamCompany} · {coach.memory.currentStage}</p>
            </div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-100">Detected track</Badge>
                <Badge variant="outline">{coach.goalTrack.questionMode === "coding" ? "Coding practice" : "Study / exam practice"}</Badge>
              </div>
              <p className="text-lg font-semibold text-white">{coach.goalTrack.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                Zentric will prioritize {coach.goalTrack.defaultWeakTopic}, build from {coach.goalTrack.defaultStrongTopic},
                and generate roadmap topics for this specific goal instead of forcing the software-engineering plan.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-purple-100">Setup accuracy</p>
                <Badge className={coach.onboarding.complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-yellow-400/30 bg-yellow-400/10 text-yellow-100"}>
                  {coach.onboarding.completionPercent}%
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${coach.onboarding.completionPercent}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-300">{coach.onboarding.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-400/20 bg-purple-500/[0.04]">
          <CardHeader>
            <CardTitle>Saved Goal Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coach.goalProfiles.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-500">
                Save your first Coach Memory to create a reusable goal profile.
              </p>
            ) : coach.goalProfiles.map((profile) => (
              <div key={profile.goalKey} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{profile.careerGoal}</p>
                    {profile.isActive && <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">Active</Badge>}
                  </div>
                  <p className="text-sm text-gray-400">{profile.dreamCompany} · {profile.currentStage}</p>
                  <p className="mt-1 text-xs text-gray-600">Updated {new Date(profile.updatedAt).toLocaleDateString()}</p>
                </div>
                <Button
                  variant={profile.isActive ? "secondary" : "default"}
                  disabled={profile.isActive || switchingGoal === profile.goalKey}
                  onClick={() => switchGoal(profile.goalKey)}
                  className={profile.isActive ? "" : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"}
                >
                  {switchingGoal === profile.goalKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {profile.isActive ? "Using now" : "Resume"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="relative mb-6">
        <Card className="border-purple-400/20 bg-purple-500/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-purple-300" />
              Goal Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-gray-400">
              Tell Zentric these once. Your deadline and daily study minutes directly control how intense
              the roadmap and Planner routine become. Entering a different goal starts a clean profile;
              entering a previous goal resumes that profile from where you left.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <CoachField label="Career Goal">
                <Input value={memoryForm.careerGoal} onChange={(event) => setMemoryForm({ ...memoryForm, careerGoal: event.target.value })} placeholder="Google SDE Internship" />
              </CoachField>
              <CoachField label="Dream Company">
                <Input value={memoryForm.dreamCompany} onChange={(event) => setMemoryForm({ ...memoryForm, dreamCompany: event.target.value })} placeholder="Google" />
              </CoachField>
              <CoachField label="Current Stage">
                <Select value={memoryForm.educationStage || "none"} onValueChange={(value) => setMemoryForm({ ...memoryForm, educationStage: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Choose stage</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="diploma">Diploma Student</SelectItem>
                    <SelectItem value="college">College Student</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="working">Working Professional</SelectItem>
                  </SelectContent>
                </Select>
              </CoachField>
              {memoryForm.educationStage === "school" && (
                <CoachField label="Class">
                  <Input value={memoryForm.schoolClass} onChange={(event) => setMemoryForm({ ...memoryForm, schoolClass: event.target.value })} placeholder="10, 11, 12" />
                </CoachField>
              )}
              {memoryForm.educationStage === "engineering" && (
                <CoachField label="Engineering Year">
                  <Input value={memoryForm.engineeringYear} onChange={(event) => setMemoryForm({ ...memoryForm, engineeringYear: event.target.value })} placeholder="1st year, 2nd year..." />
                </CoachField>
              )}
              {memoryForm.educationStage === "graduated" && (
                <CoachField label="Graduation Status">
                  <Input value={memoryForm.graduationStatus} onChange={(event) => setMemoryForm({ ...memoryForm, graduationStatus: event.target.value })} placeholder="Graduated 2026, job seeker..." />
                </CoachField>
              )}
              <CoachField label="Skill Level">
                <Input value={memoryForm.skillLevel} onChange={(event) => setMemoryForm({ ...memoryForm, skillLevel: event.target.value })} placeholder="Beginner / Intermediate" />
              </CoachField>
              <CoachField label="Preferred Language">
                <Input value={memoryForm.preferredLanguage} onChange={(event) => setMemoryForm({ ...memoryForm, preferredLanguage: event.target.value })} placeholder="C++, Java, Python" />
              </CoachField>
              <CoachField label="Daily Study Minutes">
                <Input type="number" min="15" max="720" value={memoryForm.dailyStudyMinutes} onChange={(event) => setMemoryForm({ ...memoryForm, dailyStudyMinutes: event.target.value })} placeholder="120" />
              </CoachField>
              <CoachField label="Target Deadline">
                <Input type="date" value={memoryForm.targetDeadline} onChange={(event) => setMemoryForm({ ...memoryForm, targetDeadline: event.target.value })} />
              </CoachField>
              <div className="flex items-end">
                <Button onClick={saveMemory} disabled={savingMemory} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {savingMemory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Save Coach Memory
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <CoachField label="Strong Topics">
                <Input value={memoryForm.strongTopics} onChange={(event) => setMemoryForm({ ...memoryForm, strongTopics: event.target.value })} placeholder="Arrays, Binary Search" />
              </CoachField>
              <CoachField label="Weak Topics">
                <Input value={memoryForm.weakTopics} onChange={(event) => setMemoryForm({ ...memoryForm, weakTopics: event.target.value })} placeholder="Graphs, DP, OS" />
              </CoachField>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="relative mb-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-blue-400/20 bg-blue-500/[0.03]">
          <CardHeader>
            <CardTitle>Goal Roadmap: Basic to Advanced</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-gray-400">
              Built from your goal, company, current stage ({coach.memory.currentStage}), skill level,
              weak topics, and preferred language.
            </p>
            <div className="space-y-4">
              {coach.roadmap.map((phase) => (
                <div key={phase.phase} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Badge className="mb-2 border-blue-400/30 bg-blue-400/10 text-blue-100">{phase.level}</Badge>
                      <p className="text-lg font-semibold text-white">{phase.phase}</p>
                      <p className="mt-1 text-xs text-gray-500">{phase.goalFit}</p>
                    </div>
                    <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-purple-200">Project</p>
                      <p className="mt-1 max-w-xs text-sm text-white">{phase.project}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {phase.topics.map((topic) => (
                      <div key={topic.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{topic.title}</p>
                          <Badge className={topic.mastered ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : topic.status === "priority" ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-100" : "border-white/10 bg-white/5 text-gray-300"}>
                            {topic.mastered ? "mastered" : topic.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link className="text-xs text-blue-300 hover:text-blue-200" href={topic.videoUrl} target="_blank">Video</Link>
                          <Link className="text-xs text-purple-300 hover:text-purple-200" href={topic.resourceUrl} target="_blank">Resource</Link>
                          <Link className="text-xs text-emerald-300 hover:text-emerald-200" href={topic.codingUrl}>Questions</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-emerald-400/20 bg-emerald-500/[0.03]">
            <CardHeader>
              <CardTitle>Day {coach.dayRecap.day} Recap Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-gray-300">{coach.dayRecap.summary}</p>
              <div className="space-y-2">
                {coach.dayRecap.topics.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-500">
                    Visit a Planner topic today to unlock your recap.
                  </p>
                ) : coach.dayRecap.topics.map((topic) => (
                  <div key={topic} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    {topic}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
                {coach.dayRecap.nextDayHint}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-400/20 bg-purple-500/[0.04]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat2 className="h-5 w-5 text-purple-300" />
                Revision Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coach.revisionQueue.map((item) => (
                <div key={item.topicId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{item.topicTitle}</p>
                      <p className="text-xs text-gray-500">{item.phase}</p>
                    </div>
                    <Badge className={item.due ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-100" : "border-blue-400/30 bg-blue-400/10 text-blue-100"}>
                      {item.due ? "Due now" : "Queued"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-gray-400">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <span key={action} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
                        {action}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-purple-300">Sample recall: {item.quiz[0]}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative mb-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-blue-300" />
              Coach Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(coach.memory).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Modules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coach.connectedModules.map((module) => (
              <div key={module.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-white">{module.name}</p>
                  <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">{module.count}</Badge>
                </div>
                <p className="text-sm text-gray-500">{module.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="relative">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-purple-300" />
              Growth Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coach.timeline.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/15 text-sm font-bold text-purple-100">
                      {index + 1}
                    </div>
                    {index < coach.timeline.length - 1 && <div className="mt-2 h-full min-h-12 w-px bg-white/10" />}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="border-blue-400/20 bg-blue-400/10 text-blue-200">{event.module}</Badge>
                      <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                      <span className="text-xs text-emerald-300">{event.growthImpact}</span>
                    </div>
                    <p className="font-semibold text-white">{event.achievement}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{event.insight}</p>
                    <p className="mt-3 text-xs text-purple-300">Next: {event.nextMilestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function CoachField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

