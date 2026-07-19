"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  Clock,
  Circle,
  Filter,
  Loader2,
  X,
  Check,
  BarChart3,
  ChevronRight,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StudyTopic {
  id: string;
  name: string;
  category: string;
  status: string;
  difficulty: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface PracticeQuestion {
  id: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  completed: boolean;
}

interface TopicPractice {
  topic: StudyTopic;
  completedCount: number;
  totalQuestions: number;
  progressPercent: number;
  questions: PracticeQuestion[];
}

const statusConfig = {
  not_started: { label: "Not Started", icon: Circle, color: "text-gray-400", bg: "secondary" as const },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-400", bg: "default" as const },
  completed: { label: "Completed", icon: CheckCircle, color: "text-green-400", bg: "success" as const },
};

const DSA_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks & Queues",
  "Trees", "Binary Search", "Dynamic Programming", "Graphs",
  "Sorting Algorithms", "Recursion & Backtracking", "Heaps",
  "Hash Maps", "Tries", "Sliding Window", "Two Pointers",
];

function codingHubHref(topicId: string, topicName: string, questionId: string) {
  return `/coding-hub?studyTopicId=${encodeURIComponent(topicId)}&topic=${encodeURIComponent(topicName)}&questionId=${encodeURIComponent(questionId)}`;
}

export default function StudyPage() {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [practiceByTopic, setPracticeByTopic] = useState<Record<string, TopicPractice>>({});
  const [selectedPractice, setSelectedPractice] = useState<TopicPractice | null>(null);
  const [practiceLoading, setPracticeLoading] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "DSA",
    difficulty: "medium",
    notes: "",
  });

  const fetchTopics = async () => {
    const res = await fetch("/api/study");
    const data = await res.json();
    const topicList = Array.isArray(data) ? data : [];
    const practiceEntries = await Promise.all(
      topicList.map(async (topic: StudyTopic) => {
        try {
          const practiceRes = await fetch(`/api/study/${topic.id}/practice`);
          if (!practiceRes.ok) return null;
          const practice = (await practiceRes.json()) as TopicPractice;
          return [topic.id, practice] as const;
        } catch {
          return null;
        }
      })
    );
    const nextPractice = Object.fromEntries(
      practiceEntries.filter((entry): entry is readonly [string, TopicPractice] => Boolean(entry))
    );
    setPracticeByTopic(nextPractice);
    setTopics(
      topicList.map((topic: StudyTopic) => nextPractice[topic.id]?.topic ?? topic)
    );
    setLoading(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fetchTopics();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "DSA", difficulty: "medium", notes: "" });
    setShowAdd(false);
    setSubmitting(false);
    fetchTopics();
  };

  const deleteTopic = async (id: string) => {
    await fetch(`/api/study/${id}`, { method: "DELETE" });
    if (selectedPractice?.topic.id === id) setSelectedPractice(null);
    fetchTopics();
  };

  const addDSATopic = async (name: string) => {
    await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: "DSA", difficulty: "medium" }),
    });
    fetchTopics();
  };

  const openPractice = async (topicId: string) => {
    if (practiceByTopic[topicId]) {
      setSelectedPractice(practiceByTopic[topicId]);
      return;
    }

    setPracticeLoading(topicId);
    const res = await fetch(`/api/study/${topicId}/practice`);
    const data = await res.json();
    setPracticeLoading(null);

    if (!res.ok) return;
    setPracticeByTopic((current) => ({ ...current, [topicId]: data }));
    setSelectedPractice(data);
  };

  const filteredTopics = topics.filter((t) => {
    const catMatch = categoryFilter === "all" || t.category === categoryFilter;
    const statusMatch = statusFilter === "all" || t.status === statusFilter;
    return catMatch && statusMatch;
  });

  const stats = {
    total: topics.length,
    completed: topics.filter((t) => t.status === "completed").length,
    inProgress: topics.filter((t) => t.status === "in_progress").length,
    notStarted: topics.filter((t) => t.status === "not_started").length,
  };
  const practiceStats = Object.values(practiceByTopic).reduce(
    (summary, practice) => ({
      completedQuestions: summary.completedQuestions + practice.completedCount,
      totalQuestions: summary.totalQuestions + practice.totalQuestions,
    }),
    { completedQuestions: 0, totalQuestions: 0 },
  );
  const attentionTopics = topics.filter((topic) => topic.status !== "completed").length;

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const categories = ["all", ...Array.from(new Set(topics.map((t) => t.category)))];

  const dsaNotAdded = DSA_TOPICS.filter(
    (name) => !topics.some((t) => t.name === name && t.category === "DSA")
  );

  return (
    <div className="zentric-page-shell mx-auto max-w-6xl">
      {/* Header */}
      <div className="zentric-human-card mb-8 flex items-center justify-between rounded-[1.5rem] p-5">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Study Tracker</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Track topic mastery, revision status, and assigned questions. Solve them inside Coding Hub.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="zentric-primary-action"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tracked Topics", value: stats.total, color: "text-white" },
          { label: "Questions Solved", value: `${practiceStats.completedQuestions}/${practiceStats.totalQuestions}`, color: "text-green-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-400" },
          { label: "Need Attention", value: attentionTopics, color: "text-yellow-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#667085]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completion Bar */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-5 h-5 text-[#315F8F] flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#667085]">Topic Mastery Progress</span>
                <span className="font-medium text-[#315F8F]">{completionRate}%</span>
              </div>
              <Progress value={completionRate} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DSA Quick Add */}
      {dsaNotAdded.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#172033]">Quick Add DSA Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dsaNotAdded.slice(0, 10).map((name) => (
                <button
                  key={name}
                  onClick={() => addDSATopic(name)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 transition-colors hover:bg-blue-100"
                >
                  + {name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-[#667085]" />
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                categoryFilter === cat
                  ? "zentric-soft-active"
                  : "text-[#667085] hover:bg-[#F4F8FC] hover:text-[#172033]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "not_started", "in_progress", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "zentric-soft-active"
                  : "text-[#667085] hover:bg-[#F4F8FC] hover:text-[#172033]"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : filteredTopics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={topics.length === 0 ? "Build your first study track." : "No topics match this filter."}
          description={
            topics.length === 0
              ? "Add a topic and Zentric will attach practice questions, progress tracking, and Coding Hub links so the topic becomes measurable."
              : "Try another status filter or add a fresh topic for your current goal."
          }
          action={
            <Button onClick={() => setShowAdd(true)} className="zentric-primary-action">
              <Plus className="w-4 h-4" />
              Add study topic
            </Button>
          }
          secondary={
            <Button asChild variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Link href="/ai-coach">
                Generate roadmap
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((topic) => {
            const status = statusConfig[topic.status as keyof typeof statusConfig] || statusConfig.not_started;
            const StatusIcon = status.icon;
            const practice = practiceByTopic[topic.id];
            const completedCount = practice?.completedCount ?? 0;
            const totalQuestions = practice?.totalQuestions ?? 25;
            const progressPercent = practice?.progressPercent ?? 0;
            const nextQuestion = practice?.questions.find((question) => !question.completed) ?? practice?.questions[0];
            const nextHref = nextQuestion ? codingHubHref(topic.id, topic.name, nextQuestion.id) : "";
            return (
              <div
                key={topic.id}
                className="group rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#B8CCE2] hover:bg-[#F4F8FC]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-[#172033]">{topic.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
                      <Badge
                        variant={
                          topic.difficulty === "hard" ? "destructive" :
                          topic.difficulty === "medium" ? "warning" : "success"
                        }
                        className="text-xs"
                      >
                        {topic.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#667085] opacity-0 hover:text-red-600 group-hover:opacity-100"
                    onClick={() => deleteTopic(topic.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {topic.notes && (
                  <p className="mb-3 line-clamp-2 text-xs text-[#667085]">{topic.notes}</p>
                )}
                <div className="mb-3 rounded-2xl border border-[#D9E3EE] bg-[#F4F8FC] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[#667085]">Mastery progress</span>
                    <span className="font-semibold text-[#172033]">
                      {completedCount}/{totalQuestions}
                    </span>
                  </div>
                  <Progress value={progressPercent} />
                  <p className="mt-2 text-[11px] text-[#667085]">
                    {nextQuestion ? `Next: ${nextQuestion.title}` : "Load the path to start practicing."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                    <Badge variant={status.bg} className="capitalize">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {nextQuestion && (
                      <Button asChild size="sm" className="h-8 rounded-xl text-xs">
                        <Link href={nextHref}>
                          <Code2 className="mr-1.5 h-3 w-3" />
                          Practice Next
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPractice(topic.id)}
                      disabled={practiceLoading === topic.id}
                      className="h-8 rounded-xl text-xs text-[#315F8F] hover:bg-[#EEF4FF]"
                    >
                      {practiceLoading === topic.id ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronRight className="mr-1.5 h-3 w-3" />
                      )}
                      View Path
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPractice && (
        <Card className="zentric-human-card mt-6 overflow-hidden">
          <CardHeader className="border-b border-[#D9E3EE] pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#172033]">
                  <Code2 className="h-5 w-5 text-[#315F8F]" />
                  {selectedPractice.topic.name} Mastery Path
                </CardTitle>
                <p className="mt-2 text-sm text-[#667085]">
                  Study Tracker tracks this path. Coding Hub is where you solve, run tests, submit, and update progress.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:min-w-[280px]">
                <div className="rounded-2xl border border-[#D9E3EE] bg-[#F4F8FC] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[#667085]">Topic completion</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedPractice.completedCount}/{selectedPractice.totalQuestions}
                    </span>
                  </div>
                  <Progress value={selectedPractice.progressPercent} />
                </div>
                {(() => {
                  const nextQuestion = selectedPractice.questions.find((question) => !question.completed) ?? selectedPractice.questions[0];
                  return nextQuestion ? (
                    <Button asChild className="zentric-primary-action">
                      <Link href={codingHubHref(selectedPractice.topic.id, selectedPractice.topic.name, nextQuestion.id)}>
                        <Code2 className="h-4 w-4" />
                        Practice next in Coding Hub
                      </Link>
                    </Button>
                  ) : null;
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-2 md:grid-cols-2">
              {selectedPractice.questions.map((question, index) => {
                const href = `/coding-hub?studyTopicId=${encodeURIComponent(
                  selectedPractice.topic.id
                )}&topic=${encodeURIComponent(selectedPractice.topic.name)}&questionId=${encodeURIComponent(
                  question.id
                )}`;

                return (
                  <Link
                    key={question.id}
                    href={href}
                    className="group flex items-center gap-3 rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 p-3 transition hover:-translate-y-0.5 hover:border-[#B8CCE2] hover:bg-[#F4F8FC]"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        question.completed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[#EEF4FF] text-[#315F8F]"
                      }`}
                    >
                      {question.completed ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#172033]">
                          {question.title}
                        </p>
                        <Badge
                          variant={
                            question.difficulty === "Hard"
                              ? "destructive"
                              : question.difficulty === "Medium"
                                ? "warning"
                                : "success"
                          }
                          className="text-[10px]"
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {question.estimatedMinutes} min • opens in Coding Hub
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A98A8] transition group-hover:translate-x-1 group-hover:text-[#315F8F]" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Topic Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Study Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Topic Name *</Label>
              <Input
                placeholder="e.g., Dynamic Programming"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DSA">DSA</SelectItem>
                    <SelectItem value="LeetCode">LeetCode</SelectItem>
                    <SelectItem value="System Design">System Design</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Key concepts, resources..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              <X className="w-4 h-4 mr-2" />Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting || !form.name.trim()}
              className="zentric-primary-action"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Add Topic</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
