"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckSquare,
  FileText,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowRight,
  Zap,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalNotes: number;
    totalStudyTopics: number;
    completedStudyTopics: number;
    totalGoals: number;
    productivityScore: number;
  };
  todaysTasks: Array<{
    id: string;
    title: string;
    priority: string;
    completed: boolean;
    deadline?: string | null;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: string;
    deadline: string;
  }>;
  recentNotes: Array<{
    id: string;
    title: string;
    content: string;
    updatedAt: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    target: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Tasks Completed",
      value: data?.stats.completedTasks ?? 0,
      total: data?.stats.totalTasks ?? 0,
      icon: CheckSquare,
      color: "text-green-400",
      bg: "bg-green-400/10",
      href: "/planner",
    },
    {
      title: "Study Topics",
      value: data?.stats.completedStudyTopics ?? 0,
      total: data?.stats.totalStudyTopics ?? 0,
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      href: "/study",
    },
    {
      title: "Notes Created",
      value: data?.stats.totalNotes ?? 0,
      total: null,
      icon: FileText,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      href: "/notes",
    },
    {
      title: "Active Goals",
      value: data?.stats.totalGoals ?? 0,
      total: null,
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      href: "/planner",
    },
  ];

  const aiSuggestions = [
    "Review your pending tasks and prioritize high-impact items",
    "Add 30 minutes of focused study time to your schedule",
    "Document your learnings from today in the Notes section",
    "Practice 2-3 LeetCode problems to maintain coding skills",
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
            ,{" "}
            <span className="gradient-text">
              {session?.user?.name?.split(" ")[0] || "there"}
            </span>{" "}
            👋
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Productivity Score */}
      {loading ? (
        <Skeleton className="h-24 w-full rounded-xl mb-6" />
      ) : (
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Productivity Score</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">
                  {data?.stats.productivityScore ?? 0}%
                </span>
                <div className="w-32">
                  <Progress value={data?.stats.productivityScore ?? 0} />
                </div>
              </div>
            </div>
          </div>
          <Link href="/chat">
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:border-white/20 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.value}
                      {stat.total !== null && (
                        <span className="text-sm font-normal text-gray-500">
                          /{stat.total}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-400" />
                  Today&apos;s Tasks
                </CardTitle>
                <Link href="/planner">
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-white h-7">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : data?.todaysTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No tasks today</p>
                  <Link href="/planner">
                    <Button variant="ghost" size="sm" className="mt-2 text-purple-400">
                      Add a task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.todaysTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/5"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.completed ? "bg-green-400" : "bg-yellow-400"
                        }`}
                      />
                      <span
                        className={`text-sm flex-1 ${
                          task.completed
                            ? "line-through text-gray-500"
                            : "text-gray-300"
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
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : data?.upcomingDeadlines.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-2">
                  {data?.upcomingDeadlines.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{task.title}</span>
                      </div>
                      <span className="text-xs text-orange-400">
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-purple-400 font-bold">{i + 1}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Goals
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : data?.goals.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No goals yet</p>
              ) : (
                <div className="space-y-3">
                  {data?.goals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 truncate">{goal.title}</span>
                        <span className="text-gray-500 ml-2 flex-shrink-0">
                          {goal.progress}/{goal.target}
                        </span>
                      </div>
                      <Progress value={(goal.progress / goal.target) * 100} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
