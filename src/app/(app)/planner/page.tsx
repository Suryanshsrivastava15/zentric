"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  BrainCircuit,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  Circle,
  Clock3,
  Filter,
  Flag,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  deadline?: string | null;
  completed: boolean;
  createdAt: string;
}

type CoachSnapshot = {
  dailyMission?: {
    mission: string;
    estimatedTime: string;
    growthScore: number;
    readiness: string;
    why: string;
    tasks: string[];
  };
  memory: {
    careerGoal: string;
    dreamCompany: string;
    weakTopics: string;
    dailyStudyTime: string;
    targetDeadline: string;
  };
  metrics: {
    growthScore: number;
  };
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
    difficulty?: string;
    estimatedTime?: string;
  }>;
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
    daysSince: number;
    due: boolean;
    reason: string;
    actions: string[];
    quiz: string[];
  }>;
};

type ReminderSettings = {
  enabled: boolean;
  leadMinutes: number;
};

const reminderStorageKey = "zentric-planner-reminders";
const learningStepLabels = [
  { id: "goal", label: "Goal" },
  { id: "video", label: "Video" },
  { id: "notes", label: "Notes" },
  { id: "quiz", label: "Quiz" },
  { id: "practice", label: "Practice" },
  { id: "project", label: "Project" },
  { id: "reflection", label: "Reflect" },
];

function getTaskDueDate(deadline?: string | null) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(9, 0, 0, 0);
  return date;
}

function getRelativeReminderLabel(task: Task, leadMinutes: number) {
  const due = getTaskDueDate(task.deadline);
  if (!due) return "No reminder";
  const reminderAt = new Date(due.getTime() - leadMinutes * 60_000);
  const now = new Date();
  const dueStart = new Date(due);
  dueStart.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueStart.getTime() < today.getTime()) return "Overdue";
  if (dueStart.getTime() === today.getTime()) return "Due today";
  if (reminderAt <= now) return "Reminder ready";
  return `Reminder ${reminderAt.toLocaleDateString()} ${reminderAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getDeadlineDaysLeft(deadline?: string) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86_400_000));
}

function getTodayAt(time: string) {
  const [hourValue, minuteValue = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number(hourValue) || 9, Number(minuteValue) || 0, 0, 0);
  return date;
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coach, setCoach] = useState<CoachSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncingMission, setSyncingMission] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [currentTime, setCurrentTime] = useState(0);
  const [reminders, setReminders] = useState<ReminderSettings>({
    enabled: false,
    leadMinutes: 30,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
  });

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/tasks?filter=${filter === "all" ? "" : filter}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter]);

  const fetchCoach = useCallback(async () => {
    try {
      const response = await fetch("/api/coach");
      const data = await response.json();
      if (response.ok) setCoach(data);
    } catch {
      setCoach(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTasks();
      fetchCoach();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCoach, fetchTasks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(reminderStorageKey);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch {
          window.localStorage.removeItem(reminderStorageKey);
        }
      }
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
      setCurrentTime(Date.now());
    }, 0);

    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(reminderStorageKey, JSON.stringify(reminders));
  }, [reminders]);

  const activeTasks = tasks.filter((task) => !task.completed);

  const reminderItems = useMemo(() => {
    const now = currentTime || 0;
    return activeTasks
      .map((task) => {
        const due = getTaskDueDate(task.deadline);
        if (!due) return null;
        const reminderAt = new Date(due.getTime() - reminders.leadMinutes * 60_000);
        const status =
          due.getTime() < now
            ? "overdue"
            : reminderAt.getTime() <= now
              ? "ready"
              : "upcoming";
        return { task, due, reminderAt, status };
      })
      .filter(Boolean)
      .sort((a, b) => a!.due.getTime() - b!.due.getTime()) as Array<{
        task: Task;
        due: Date;
        reminderAt: Date;
        status: "overdue" | "ready" | "upcoming";
      }>;
  }, [activeTasks, currentTime, reminders.leadMinutes]);

  useEffect(() => {
    if (!reminders.enabled || notificationPermission !== "granted" || typeof window === "undefined") return;

    const notified = new Set<string>();
    const timers = reminderItems
      .filter((item) => item.status !== "overdue")
      .map((item) => {
        const delay = Math.max(0, item.reminderAt.getTime() - Date.now());
        return window.setTimeout(() => {
          if (notified.has(item.task.id) || item.task.completed) return;
          notified.add(item.task.id);
          new Notification("Zentric Planner Reminder", {
            body: `${item.task.title} is due ${formatDate(item.task.deadline || item.due.toISOString())}.`,
          });
        }, Math.min(delay, 2_147_483_647));
      });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reminderItems, reminders.enabled, notificationPermission]);

  const dailyPlan = useMemo(() => coach?.dailyPlan ?? [], [coach?.dailyPlan]);
  const revisionQueue = coach?.revisionQueue ?? [];
  const revisionDueCount = revisionQueue.filter((item) => item.due).length;
  const completedToday = coach?.dayRecap.completedTopics ?? 0;
  const remainingRoadmapItems = dailyPlan.filter((item) => !item.mastered).length;
  const completedLearningSteps = dailyPlan.reduce((sum, item) => sum + (item.completedSteps?.length ?? 0), 0);
  const totalLearningSteps = dailyPlan.length * learningStepLabels.length;
  const todayPlanTotal = completedToday + remainingRoadmapItems || dailyPlan.length;
  const todayCompletion =
    totalLearningSteps > 0
      ? Math.min(100, Math.round((completedLearningSteps / totalLearningSteps) * 100))
      : todayPlanTotal > 0
        ? Math.min(100, Math.round((completedToday / todayPlanTotal) * 100))
        : 0;
  const focusTopic = dailyPlan.find((item) => !item.mastered)?.title ?? dailyPlan[0]?.title ?? coach?.memory.weakTopics ?? "Set your goal";
  const nextPhase = dailyPlan.find((item) => !item.mastered)?.phase ?? dailyPlan[0]?.phase ?? "Roadmap";
  const plannedMinutes = dailyPlan.reduce((sum, item) => {
    const minutes = Number(item.duration.match(/\d+/)?.[0] ?? 0);
    return sum + minutes;
  }, 0);
  const plannedTimeLabel =
    plannedMinutes > 0
      ? plannedMinutes >= 60
        ? `${Math.round((plannedMinutes / 60) * 10) / 10} hours`
        : `${plannedMinutes} minutes`
      : coach?.memory.dailyStudyTime ?? "Set in AI Coach";
  const deadlineLabel = coach?.memory.targetDeadline
    ? new Date(coach.memory.targetDeadline).toLocaleDateString()
    : "No deadline";
  const deadlineDaysLeft = getDeadlineDaysLeft(coach?.memory.targetDeadline);
  const deadlineDaysLabel = deadlineDaysLeft === null ? "No deadline" : `${deadlineDaysLeft} days left`;
  const dayNumber = coach?.dailyPlan[0]?.day ?? coach?.dayRecap.day ?? 1;
  const missionMarkerPrefix = `[ZENTRIC_DAILY_MISSION:${dayNumber}:`;
  const revisionMarkerPrefix = `[ZENTRIC_REVISION:${dayNumber}:`;
  const syncedMissionTasks = tasks.filter((task) => task.description?.includes(missionMarkerPrefix));
  const syncedRevisionTasks = tasks.filter((task) => task.description?.includes(revisionMarkerPrefix));
  const syncedMissionIds = new Set(
    syncedMissionTasks
      .map((task) => task.description?.match(/\[ZENTRIC_DAILY_MISSION:\d+:([^\]]+)\]/)?.[1])
      .filter(Boolean) as string[],
  );
  const missionReminderItems = useMemo(() => {
    const now = currentTime || 0;
    return dailyPlan.map((item) => {
      const due = getTodayAt(item.time);
      const reminderAt = new Date(due.getTime() - reminders.leadMinutes * 60_000);
      const status =
        due.getTime() < now
          ? "overdue"
          : reminderAt.getTime() <= now
            ? "ready"
            : "upcoming";
      return { item, due, reminderAt, status };
    });
  }, [currentTime, dailyPlan, reminders.leadMinutes]);

  useEffect(() => {
    if (!reminders.enabled || notificationPermission !== "granted" || typeof window === "undefined") return;

    const notified = new Set<string>();
    const timers = missionReminderItems
      .filter((item) => item.status !== "overdue")
      .map((item) => {
        const delay = Math.max(0, item.reminderAt.getTime() - Date.now());
        return window.setTimeout(() => {
          if (notified.has(item.item.id)) return;
          notified.add(item.item.id);
          new Notification("Zentric Mission Reminder", {
            body: `${item.item.title} starts at ${item.item.time} for ${coach?.memory.careerGoal ?? "today's mission"}.`,
          });
        }, Math.min(delay, 2_147_483_647));
      });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [coach?.memory.careerGoal, missionReminderItems, notificationPermission, reminders.enabled]);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", priority: "medium", deadline: "" });
    setShowAddDialog(false);
    setSubmitting(false);
    fetchTasks();
  };

  const createRoadmapTask = async (title: string, priority: string) => {
    setPlannerMessage("");
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: `AI Coach roadmap task for ${coach?.memory.careerGoal || "your target role"}.`,
        priority,
        deadline: new Date().toISOString().slice(0, 10),
      }),
    });
    setPlannerMessage("Roadmap task added to Planner.");
    fetchTasks();
  };

  const syncDailyMissionToTasks = async () => {
    if (!coach || dailyPlan.length === 0) {
      setPlannerMessage("Set your AI Coach goal first so Zentric can generate today's mission.");
      return;
    }

    setSyncingMission(true);
    setPlannerMessage("");

    try {
      const allTasksResponse = await fetch("/api/tasks?filter=");
      const allTasks = await allTasksResponse.json();
      const existingTasks: Task[] = Array.isArray(allTasks) ? allTasks : tasks;
      const existingDescriptions = new Set(existingTasks.map((task) => task.description || ""));
      const today = new Date().toISOString().slice(0, 10);
      const created: string[] = [];

      for (const item of dailyPlan) {
        const marker = `[ZENTRIC_DAILY_MISSION:${item.day}:${item.id}]`;
        if ([...existingDescriptions].some((description) => description.includes(marker))) continue;

        const description = [
          marker,
          `AI Coach daily mission for ${coach.memory.careerGoal}.`,
          `Phase: ${item.phase}`,
          `Time: ${item.time}`,
          `Duration: ${item.duration}`,
          `Roadmap topic: ${item.title}`,
        ].join("\n");

        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${item.time} · ${item.title}`,
            description,
            priority: item.priority.toLowerCase(),
            deadline: today,
          }),
        });
        existingDescriptions.add(description);
        created.push(item.title);
      }

      for (const item of revisionQueue.filter((revision) => revision.due).slice(0, 3)) {
        const marker = `[ZENTRIC_REVISION:${dayNumber}:${item.topicId}]`;
        if ([...existingDescriptions].some((description) => description.includes(marker))) continue;

        const description = [
          marker,
          `AI Coach spaced revision for ${coach.memory.careerGoal}.`,
          `Phase: ${item.phase}`,
          item.reason,
        ].join("\n");

        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Revision · ${item.topicTitle}`,
            description,
            priority: "high",
            deadline: today,
          }),
        });
        existingDescriptions.add(description);
        created.push(`Revision: ${item.topicTitle}`);
      }

      await fetchTasks();
      await fetchCoach();
      setPlannerMessage(
        created.length
          ? `${created.length} AI mission task${created.length === 1 ? "" : "s"} added to Planner.`
          : "Today's AI mission is already synced to Planner tasks.",
      );
    } finally {
      setSyncingMission(false);
    }
  };

  const visitDailyTopic = async (topic: NonNullable<CoachSnapshot["dailyPlan"]>[number], url: string) => {
    setPlannerMessage("");
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "visit_roadmap_topic",
        topicId: topic.id,
        topicTitle: topic.title,
        phase: topic.phase,
        day: topic.day,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setCoach(data);
      setPlannerMessage(`${topic.title} marked complete for Day ${topic.day}.`);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEdit = async () => {
    if (!editingTask || !form.title.trim()) return;
    setSubmitting(true);
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditingTask(null);
    setSubmitting(false);
    fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    const completing = !task.completed;
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: completing }),
    });

    if (completing) {
      const missionMatch = task.description?.match(/\[ZENTRIC_DAILY_MISSION:(\d+):([^\]]+)\]/);
      const revisionMatch = task.description?.match(/\[ZENTRIC_REVISION:(\d+):([^\]]+)\]/);
      const topicId = missionMatch?.[2] || revisionMatch?.[2];
      const planItem = topicId ? dailyPlan.find((item) => item.id === topicId) : null;
      const revisionItem = topicId ? revisionQueue.find((item) => item.topicId === topicId) : null;

      if (topicId && (planItem || revisionItem)) {
        const topicTitle = planItem?.title ?? revisionItem?.topicTitle ?? task.title;
        const phase = planItem?.phase ?? revisionItem?.phase ?? "Planner";
        const day = Number(missionMatch?.[1] || revisionMatch?.[1] || dayNumber);

        await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "visit_roadmap_topic",
            topicId,
            topicTitle,
            phase,
            day,
            reflection: `Completed from Planner task: ${task.title}`,
          }),
        });

        await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete_learning_step",
            topicId,
            topicTitle,
            phase,
            day,
            stepId: "goal",
            stepTitle: "Planner Mission",
            evidence: `Completed synced Planner task: ${task.title}`,
            quality: "planner-completed",
          }),
        });
      }
    }

    fetchTasks();
    fetchCoach();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const openEdit = (task: Task) => {
    const deadlineDate = (task.deadline && typeof task.deadline === "string" ? task.deadline.split("T")[0] : "") || "";
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      deadline: deadlineDate,
    });
    setEditingTask(task);
  };

  const openAdd = () => {
    setForm({ title: "", description: "", priority: "medium", deadline: "" });
    setShowAddDialog(true);
  };

  const enableReminders = async () => {
    setPlannerMessage("");
    if (!("Notification" in window)) {
      setPlannerMessage("This browser does not support notifications. In-app reminders will still work.");
      setReminders((current) => ({ ...current, enabled: true }));
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setReminders((current) => ({ ...current, enabled: true }));
      setPlannerMessage("Planner reminders enabled. Zentric will notify you only for tasks with deadlines.");
    } else {
      setReminders((current) => ({ ...current, enabled: false }));
      setPlannerMessage("Notifications were not enabled. You can still use the in-app reminder center.");
    }
  };

  const disableReminders = () => {
    setReminders((current) => ({ ...current, enabled: false }));
    setPlannerMessage("Planner notifications turned off.");
  };

  return (
    <main className="zentric-page-shell mx-auto max-w-7xl">
      <section className="mb-6 overflow-hidden rounded-[1.75rem] zentric-human-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 border-purple-400/30 bg-purple-500/10 text-[#315F8F]">
              <BrainCircuit className="mr-1 h-3 w-3" />
              AI Execution Planner
            </Badge>
            <h1 className="text-3xl font-bold text-[#172033]">Planner</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              Turn your AI Coach roadmap into focused tasks, optional reminders, and daily execution.
              The routine adapts to your selected goal, deadline, weak topics, and available study time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:min-w-[520px]">
            <MetricCard label="Mission Progress" value={`${todayCompletion}%`} tone="emerald" />
            <MetricCard label="Study Time" value={plannedTimeLabel} tone="purple" />
            <MetricCard label="Revision Due" value={String(revisionDueCount)} tone="yellow" />
            <MetricCard label="Deadline" value={deadlineDaysLabel} tone="blue" />
          </div>
        </div>
      </section>

      {plannerMessage && (
        <div className="mb-5 rounded-2xl border border-[#BFD9C8] bg-[#F0F8F3] px-4 py-3 text-sm text-[#28714D]">
          {plannerMessage}
        </div>
      )}

      <section className="mb-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-blue-400/20 bg-blue-500/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#315F8F]" />
              Today&apos;s AI Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xl font-bold text-[#172033]">
                {coach ? `Day ${dayNumber}: ${coach.dailyMission?.mission ?? `${coach.memory.careerGoal} at ${coach.memory.dreamCompany}`}` : "Set your AI Coach memory to generate a roadmap routine."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {coach ? coach.dailyMission?.why ?? "Planner uses your goal, deadline, daily study minutes, weak topics, and visited roadmap topics to decide what to do today." : "Planner will use your target role, weak topics, deadline, and progress to decide what matters today."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat icon={Clock3} label="Planned Time" value={plannedTimeLabel} />
              <MiniStat icon={Sparkles} label="Readiness" value={coach?.dailyMission?.readiness ?? `${coach?.metrics.growthScore ?? 0}% growth`} />
              <MiniStat icon={Repeat2} label="Revision Due" value={`${revisionDueCount} topics`} />
              <MiniStat icon={Flag} label="Weak Focus" value={coach?.memory.weakTopics ?? "Not set"} />
            </div>
            <div className="rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#172033]">Planner sync status</p>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    {syncedMissionTasks.length}/{dailyPlan.length} roadmap tasks synced
                    {syncedRevisionTasks.length ? ` · ${syncedRevisionTasks.length} revision tasks synced` : ""}.
                    Completing a synced task updates AI Coach and today&apos;s progress.
                  </p>
                </div>
                <Button
                  onClick={syncDailyMissionToTasks}
                  disabled={syncingMission || dailyPlan.length === 0}
                  className="zentric-primary-action text-white"
                >
                  {syncingMission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Sync Today&apos;s Mission
                </Button>
              </div>
            </div>
            {coach?.dailyMission?.tasks?.length ? (
              <div className="rounded-2xl border border-[#D6E4F5] bg-[#F4EFFF] p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#315F8F]">
                  <BookOpen className="h-4 w-4" />
                  Mission Checklist
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {coach.dailyMission.tasks.map((task) => (
                    <div key={task} className="flex gap-2 rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3 text-sm text-[#344054]">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#28714D]" />
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              {(coach?.dailyPlan ?? []).length === 0 ? (
                <p className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-4 text-sm text-[#667085]">
                  Open AI Coach and save your accuracy setup to generate a personalized execution plan.
                </p>
              ) : (coach?.dailyPlan ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-blue-400/30 bg-blue-400/10 text-[#315F8F]">Day {item.day}</Badge>
                        <Badge className={item.mastered ? "border-emerald-400/30 bg-emerald-400/10 text-[#28714D]" : "border-yellow-400/30 bg-yellow-400/10 text-[#7A5B00]"}>
                          {item.mastered ? "completed" : "visit to complete"}
                        </Badge>
                        {syncedMissionIds.has(item.id) && (
                          <Badge className="border-emerald-400/30 bg-emerald-400/10 text-[#28714D]">
                            synced to tasks
                          </Badge>
                        )}
                        <span className="text-xs text-[#667085]">{item.time} · {item.duration} · {item.priority}</span>
                      </div>
                      <p className="mt-2 font-medium text-[#172033]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#667085]">{item.phase} · {item.recapPrompt}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" className="zentric-primary-action text-white">
                        <Link href={`/learning-mode?topic=${item.id}`}>
                          <GraduationCap className="h-4 w-4" />
                          Start Session
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => createRoadmapTask(item.title, item.priority.toLowerCase())} className="border-purple-400/30 text-[#315F8F]">
                        <Plus className="h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">Learning session progress</p>
                      <span className="text-xs text-[#315F8F]">
                        {item.completedSteps?.length ?? 0}/{learningStepLabels.length} steps
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {learningStepLabels.map((step) => {
                        const done = item.completedSteps?.includes(step.id);
                        return (
                          <span
                            key={step.id}
                            className={done ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-[#28714D]" : "rounded-full border border-[#D6E4F5] bg-[#FFFDF9] px-3 py-1 text-xs text-[#667085]"}
                          >
                            {done ? "? " : ""}
                            {step.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                    <div className="rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">Resources</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="border-red-400/30 text-[#9B2C2C]" onClick={() => visitDailyTopic(item, item.videoUrl)}>
                          Video
                        </Button>
                        <Button size="sm" variant="outline" className="border-blue-400/30 text-[#315F8F]" onClick={() => visitDailyTopic(item, item.resourceUrl)}>
                          Notes
                        </Button>
                        <Button size="sm" variant="outline" className="border-emerald-400/30 text-[#28714D]" onClick={() => visitDailyTopic(item, item.codingUrl)}>
                          Questions
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">Practice Questions</p>
                      <ul className="space-y-1 text-xs leading-5 text-[#667085]">
                        {item.questions.map((question) => (
                          <li key={question}>• {question}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {coach?.dayRecap && (
              <div className="rounded-2xl border border-[#BFD9C8] bg-[#F0F8F3] p-4 text-sm leading-6 text-[#28714D]">
                <span className="font-semibold">Day {coach.dayRecap.day} recap:</span> {coach.dayRecap.summary}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild className="zentric-primary-action text-white">
                <Link href={`/learning-mode${dailyPlan[0]?.id ? `?topic=${dailyPlan[0].id}` : ""}`}>
                  <GraduationCap className="h-4 w-4" />
                  Start Today&apos;s Mission
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-purple-400/30 text-[#315F8F]">
                <Link href="/ai-coach">Tune AI Coach Accuracy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
        <Card className="border-emerald-400/20 bg-emerald-500/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat2 className="h-5 w-5 text-[#28714D]" />
              Revision Due Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisionQueue.length === 0 ? (
              <p className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-3 text-sm text-[#667085]">
                Complete a Learning Mode session and Zentric will schedule spaced revision here.
              </p>
            ) : revisionQueue.slice(0, 4).map((item) => (
              <div key={item.topicId} className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#172033]">{item.topicTitle}</p>
                    <p className="text-xs text-[#667085]">{item.phase}</p>
                  </div>
                  <Badge className={item.due ? "border-yellow-400/30 bg-yellow-400/10 text-[#7A5B00]" : "border-blue-400/30 bg-blue-400/10 text-[#315F8F]"}>
                    {item.due ? "Due" : "Queued"}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-[#667085]">{item.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.actions.map((action) => (
                    <span key={action} className="rounded-full border border-[#D6E4F5] bg-[#F8FBFF] px-3 py-1 text-xs text-[#344054]">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-purple-400/20 bg-purple-500/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {reminders.enabled ? <Bell className="h-5 w-5 text-[#315F8F]" /> : <BellOff className="h-5 w-5 text-[#667085]" />}
              Reminders & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-[#667085]">
              Reminders are optional. Zentric will only ask for browser notification permission if you enable them.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#667085]">Status</p>
                <p className={reminders.enabled ? "mt-2 font-semibold text-[#28714D]" : "mt-2 font-semibold text-[#344054]"}>
                  {reminders.enabled ? "Enabled" : "Disabled until you turn it on"}
                </p>
                <p className="mt-1 text-xs text-[#667085]">
                  {reminders.enabled
                    ? `Browser permission: ${"Notification" in globalThis ? notificationPermission : "unsupported"}`
                    : "Browser permission is not requested while reminders are off."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#667085]">Reminder Time</p>
                <Select
                  value={String(reminders.leadMinutes)}
                  onValueChange={(value) => setReminders((current) => ({ ...current, leadMinutes: Number(value) }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">At deadline day</SelectItem>
                    <SelectItem value="10">10 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {reminders.enabled ? (
                <Button variant="outline" className="border-red-400/30 text-[#9B2C2C]" onClick={disableReminders}>
                  <BellOff className="h-4 w-4" />
                  Turn Off Reminders
                </Button>
              ) : (
                <Button className="zentric-primary-action text-white" onClick={enableReminders}>
                  <Bell className="h-4 w-4" />
                  Enable Reminders
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">AI mission reminders</p>
              {missionReminderItems.length === 0 ? (
                <p className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-3 text-sm text-[#667085]">
                  AI Coach will generate timed mission reminders after your daily plan is ready.
                </p>
              ) : missionReminderItems.slice(0, 4).map((item) => (
                <div key={item.item.id} className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#172033]">{item.item.title}</p>
                    <Badge className={item.status === "overdue" ? "border-red-400/30 bg-red-400/10 text-[#9B2C2C]" : item.status === "ready" ? "border-yellow-400/30 bg-yellow-400/10 text-[#7A5B00]" : "border-blue-400/30 bg-blue-400/10 text-[#315F8F]"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#667085]">
                    Starts {item.item.time}; reminder {item.reminderAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#667085]">Manual task reminders</p>
              {reminderItems.slice(0, 5).length === 0 ? (
                <p className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-3 text-sm text-[#667085]">
                  Add deadlines to tasks to see reminders here.
                </p>
              ) : reminderItems.slice(0, 5).map((item) => (
                <div key={item.task.id} className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#172033]">{item.task.title}</p>
                    <Badge className={item.status === "overdue" ? "border-red-400/30 bg-red-400/10 text-[#9B2C2C]" : item.status === "ready" ? "border-yellow-400/30 bg-yellow-400/10 text-[#7A5B00]" : "border-blue-400/30 bg-blue-400/10 text-[#315F8F]"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#667085]">{getRelativeReminderLabel(item.task, reminders.leadMinutes)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Today's Plan", value: `${dailyPlan.length} topics`, detail: `Day ${dayNumber}`, color: "text-[#315F8F]" },
          { label: "Learning Steps", value: `${completedLearningSteps}/${totalLearningSteps || 0}`, detail: `${todayCompletion}% done`, color: "text-[#28714D]" },
          { label: "Focus Topic", value: focusTopic, detail: nextPhase, color: "text-[#315F8F]" },
          { label: "Deadline Pressure", value: deadlineDaysLabel, detail: deadlineLabel, color: "text-[#7A5B00]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[#667085]">{s.label}</div>
            <div className={`mt-2 line-clamp-2 text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-xs text-[#667085]">{s.detail}</div>
          </div>
        ))}
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#667085]" />
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "border border-purple-500/30 bg-purple-500/20 text-purple-400"
                  : "text-[#667085] hover:bg-white/5 hover:text-[#172033]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          onClick={openAdd}
          className="zentric-primary-action border-0 text-white"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={coach ? "Sync your AI mission into Planner." : "Start from AI Coach to generate your plan."}
          description={
            coach
              ? "Your goal-based roadmap is ready. Sync today's mission to create real tasks, deadlines, revision, and learning sessions."
              : "Planner becomes useful after AI Coach knows your goal, stage, deadline, and weak topics. Set that once, then Zentric plans your day."
          }
          action={
            <Button
              onClick={coach && dailyPlan.length ? syncDailyMissionToTasks : openAdd}
              disabled={syncingMission}
              className="zentric-primary-action text-white"
            >
              {syncingMission ? <Loader2 className="h-4 w-4 animate-spin" /> : coach && dailyPlan.length ? <Sparkles className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {coach && dailyPlan.length ? "Sync Today's Mission" : "Create first task"}
            </Button>
          }
          secondary={
            <Button asChild variant="outline" className="border-blue-400/30 text-[#315F8F]">
              <Link href="/ai-coach">
                <Sparkles className="h-4 w-4" />
                Generate from AI Coach
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 rounded-xl border p-4 transition-all ${
                task.completed
                  ? "bg-[#F7FAFD] border-[#D6E4F5] opacity-60"
                  : "bg-[#FFFDF9] border-[#D6E4F5] hover:border-[#A8BFD8]"
              }`}
            >
              <button onClick={() => toggleComplete(task)} className="mt-0.5 flex-shrink-0">
                {task.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-[#667085] transition-colors hover:text-purple-400" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-medium ${task.completed ? "line-through text-[#667085]" : "text-[#172033]"}`}>
                    {task.title}
                  </span>
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "destructive"
                        : task.priority === "medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    <Flag className="mr-1 h-2.5 w-2.5" />
                    {task.priority}
                  </Badge>
                  {task.deadline && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.deadline)}
                    </span>
                  )}
                  {task.deadline && !task.completed && (
                    <span className="flex items-center gap-1 text-xs text-[#315F8F]">
                      <Bell className="h-3 w-3" />
                      {reminders.enabled ? getRelativeReminderLabel(task, reminders.leadMinutes) : "Reminder optional"}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="mt-1 truncate text-xs text-[#667085]">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#667085] hover:text-[#172033]"
                  onClick={() => openEdit(task)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#667085] hover:text-red-400"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Create New Task"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleAdd}
        submitLabel="Create Task"
      />

      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        title="Edit Task"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleEdit}
        submitLabel="Save Changes"
      />
    </main>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "purple" | "yellow" | "blue" }) {
  const colorClass =
    tone === "emerald"
      ? "text-[#28714D]"
      : tone === "purple"
        ? "text-[#315F8F]"
        : tone === "yellow"
          ? "text-[#7A5B00]"
          : "text-[#315F8F]";

  return (
    <div className="rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#D6E4F5] bg-[#FFFDF9] p-4">
      <Icon className="mb-3 h-4 w-4 text-[#315F8F]" />
      <p className="text-xs text-[#667085]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#172033]">{value}</p>
    </div>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  title,
  form,
  setForm,
  submitting,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: { title: string; description: string; priority: string; deadline: string };
  setForm: (form: { title: string; description: string; priority: string; deadline: string }) => void;
  submitting: boolean;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="Task title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              onKeyDown={(event) => event.key === "Enter" && onSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Optional description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !form.title.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 border-0"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

