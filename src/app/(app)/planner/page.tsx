"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Flag,
  Calendar,
  Filter,
  Loader2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
  });

  const fetchTasks = async () => {
    const res = await fetch(`/api/tasks?filter=${filter === "all" ? "" : filter}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [filter]);

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
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const openEdit = (task: Task) => {
    const deadlineDate: string = (task.deadline && typeof task.deadline === "string" ? task.deadline.split("T")[0] : "") || "";
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

  const filteredTasks = tasks;
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Planner</h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats.pending} pending · {stats.completed} completed
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Completed", value: stats.completed, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No tasks found</p>
            <Button variant="ghost" className="text-purple-400" onClick={openAdd}>
              Create your first task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                task.completed
                  ? "bg-white/2 border-white/5 opacity-60"
                  : "bg-white/3 border-white/8 hover:border-white/15"
              }`}
            >
              <button
                onClick={() => toggleComplete(task)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-500 hover:text-purple-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${
                      task.completed ? "line-through text-gray-500" : "text-white"
                    }`}
                  >
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
                    <Flag className="w-2.5 h-2.5 mr-1" />
                    {task.priority}
                  </Badge>
                  {task.deadline && (
                    <span className="text-xs text-orange-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(task.deadline)}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-500 hover:text-white"
                  onClick={() => openEdit(task)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-500 hover:text-red-400"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              <X className="w-4 h-4 mr-2" />Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting || !form.title.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 border-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Create Task</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTask(null)}>
              <X className="w-4 h-4 mr-2" />Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting || !form.title.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 border-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
