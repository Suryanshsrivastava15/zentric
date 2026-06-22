"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Code2,
  RefreshCw,
  ExternalLink,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

interface SubmissionCount {
  difficulty: string;
  count: number;
}

interface LeetCodeData {
  user: {
    username: string;
    submitStats: { acSubmissionNum: SubmissionCount[] };
    profile: { ranking: number; reputation: number; solutionCount: number };
  };
  allCounts: SubmissionCount[];
  recentSubmissions: {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
  }[];
}

const difficultyColor = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

const difficultyBg = {
  Easy: "bg-green-500/10 border-green-500/20",
  Medium: "bg-yellow-500/10 border-yellow-500/20",
  Hard: "bg-red-500/10 border-red-500/20",
};

function timeAgo(timestamp: string) {
  const diff = Date.now() - parseInt(timestamp) * 1000;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

export default function LeetCodePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<LeetCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveUsername = useCallback(async (uname: string) => {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leetcodeUsername: uname }),
    });
  }, []);

  const fetchData = useCallback(async (uname: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/leetcode?username=${encodeURIComponent(uname)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setData(json);
      setUsername(uname);
      setEditing(false);
      await saveUsername(uname);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setSubmitting(false);
      setRefreshing(false);
    }
  }, [saveUsername]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const uname = d.settings?.leetcodeUsername?.trim();
        if (uname) {
          setUsername(uname);
          setInputValue(uname);
          fetchData(uname);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    setLoading(false);
    fetchData(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  // No username yet OR editing
  if (!username || editing) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-orange-400" />
            LeetCode Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track your LeetCode progress</p>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                <Code2 className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">
                {editing ? "Change LeetCode Username" : "Connect your LeetCode"}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Enter your LeetCode username to see your solved problems, stats, and recent submissions.
              </p>
              <form onSubmit={handleSubmit} className="w-full space-y-3">
                <Input
                  autoFocus
                  placeholder="e.g. suryansh15"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="text-center text-base"
                />
                {error && (
                  <p className="text-red-400 text-xs flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
                <div className="flex gap-2">
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-white/10 text-gray-400"
                      onClick={() => { setEditing(false); setError(null); }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting || !inputValue.trim()}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 border-0"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Code2 className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? "Loading..." : "Track my LeetCode"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-orange-400" />
            LeetCode Tracker
          </h1>
        </div>
        <Card className="border-red-500/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-300 font-medium mb-1">Failed to load data</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchData(username, true)}
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => { setEditing(true); setError(null); }}
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Change Username
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const acCounts = data.user.submitStats.acSubmissionNum;
  const totalSolved = acCounts.find((c) => c.difficulty === "All")?.count ?? 0;
  const easySolved = acCounts.find((c) => c.difficulty === "Easy")?.count ?? 0;
  const mediumSolved = acCounts.find((c) => c.difficulty === "Medium")?.count ?? 0;
  const hardSolved = acCounts.find((c) => c.difficulty === "Hard")?.count ?? 0;

  const totalAll = data.allCounts.find((c) => c.difficulty === "All")?.count ?? 1;
  const easyAll = data.allCounts.find((c) => c.difficulty === "Easy")?.count ?? 1;
  const mediumAll = data.allCounts.find((c) => c.difficulty === "Medium")?.count ?? 1;
  const hardAll = data.allCounts.find((c) => c.difficulty === "Hard")?.count ?? 1;

  const difficulties = [
    { label: "Easy", solved: easySolved, total: easyAll },
    { label: "Medium", solved: mediumSolved, total: mediumAll },
    { label: "Hard", solved: hardSolved, total: hardAll },
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-orange-400" />
            LeetCode Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tracking{" "}
            <a
              href={`https://leetcode.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline inline-flex items-center gap-1"
            >
              {username} <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { setEditing(true); setInputValue(username ?? ""); setError(null); }}
            variant="outline"
            size="sm"
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Change
          </Button>
          <Button
            onClick={() => fetchData(username, true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalSolved}</p>
            <p className="text-xs text-gray-400 mt-1">Total Solved</p>
            <p className="text-xs text-gray-600">/ {totalAll}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              {data.user.profile.ranking > 0
                ? `#${data.user.profile.ranking.toLocaleString()}`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Global Rank</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Zap className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{data.user.profile.reputation}</p>
            <p className="text-xs text-gray-400 mt-1">Reputation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Target className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.round((totalSolved / totalAll) * 100)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Problem Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {difficulties.map(({ label, solved, total }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs border ${difficultyBg[label]} ${difficultyColor[label]}`}
                  >
                    {label}
                  </Badge>
                </div>
                <span className="text-sm text-gray-300 font-medium">
                  {solved}{" "}
                  <span className="text-gray-600 font-normal">/ {total}</span>
                </span>
              </div>
              <Progress
                value={(solved / total) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Accepted Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Recent Accepted Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentSubmissions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent submissions found.</p>
          ) : (
            <div className="space-y-1">
              {data.recentSubmissions.map((sub, i) => (
                <a
                  key={sub.id}
                  href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                      {sub.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs text-gray-600">{timeAgo(sub.timestamp)}</span>
                    <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
