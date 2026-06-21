"use client";

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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function StudyPage() {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "DSA",
    difficulty: "medium",
    notes: "",
  });

  const fetchTopics = async () => {
    const res = await fetch("/api/study");
    const data = await res.json();
    setTopics(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTopics();
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

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/study/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTopics();
  };

  const deleteTopic = async (id: string) => {
    await fetch(`/api/study/${id}`, { method: "DELETE" });
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

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const categories = ["all", ...Array.from(new Set(topics.map((t) => t.category)))];

  const dsaNotAdded = DSA_TOPICS.filter(
    (name) => !topics.some((t) => t.name === name && t.category === "DSA")
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your DSA, LeetCode, and learning progress
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Topics", value: stats.total, color: "text-white" },
          { label: "Completed", value: stats.completed, color: "text-green-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-400" },
          { label: "Not Started", value: stats.notStarted, color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completion Bar */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Overall Progress</span>
                <span className="text-purple-400 font-medium">{completionRate}%</span>
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
            <CardTitle className="text-sm text-gray-300">Quick Add DSA Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dsaNotAdded.slice(0, 10).map((name) => (
                <button
                  key={name}
                  onClick={() => addDSATopic(name)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
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
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                categoryFilter === cat
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
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
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
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
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No study topics found</p>
            <Button variant="ghost" className="text-purple-400" onClick={() => setShowAdd(true)}>
              Add your first topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((topic) => {
            const status = statusConfig[topic.status as keyof typeof statusConfig] || statusConfig.not_started;
            const StatusIcon = status.icon;
            return (
              <div
                key={topic.id}
                className="group p-4 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">{topic.name}</h3>
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
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                    onClick={() => deleteTopic(topic.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {topic.notes && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{topic.notes}</p>
                )}
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                  <Select
                    value={topic.status}
                    onValueChange={(v) => updateStatus(topic.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 border-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Add Topic</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
