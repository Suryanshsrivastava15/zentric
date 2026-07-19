"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Braces,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Flame,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  WandSparkles,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPracticeQuestion, getPracticeQuestions, normalizePracticeTopic } from "@/lib/practice-questions";

type Difficulty = "Easy" | "Medium" | "Hard";
type Language = "javascript" | "python" | "java" | "cpp" | "c";

type ChallengeTest = {
  args?: unknown[];
  expected?: unknown;
  stdin?: string;
  expectedOutput?: string;
};

type Challenge = {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  description: string;
  examples: { input: string; output: string }[];
  constraints: string[];
  functionName: string;
  starterCode: string;
  inputFormat?: string;
  outputFormat?: string;
  tests: ChallengeTest[];
  hint: string;
  estimatedMinutes?: number;
  pattern?: string;
  expectedComplexity?: string;
  edgeCases?: string[];
  source?: "curated" | "study-bank" | "ai";
};

const languages: Record<
  Language,
  { label: string; extension: string; badge: string; comment: string }
> = {
  javascript: {
    label: "JavaScript",
    extension: "js",
    badge: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    comment: "//",
  },
  python: {
    label: "Python",
    extension: "py",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    comment: "#",
  },
  java: {
    label: "Java",
    extension: "java",
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    comment: "//",
  },
  cpp: {
    label: "C++",
    extension: "cpp",
    badge: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    comment: "//",
  },
  c: {
    label: "C",
    extension: "c",
    badge: "border-slate-500/20 bg-slate-500/10 text-slate-300",
    comment: "//",
  },
};

const practiceTopics = [
  "Arrays",
  "Strings",
  "Linked Lists",
  "Stacks",
  "Trees",
  "Binary Search",
  "Dynamic Programming",
  "Graphs",
  "Sorting Algorithms",
  "Recursion & Backtracking",
  "Heaps",
  "Hash Maps",
  "Tries",
  "Sliding Window",
  "Two Pointers",
];

type TestResult = {
  passed: boolean;
  actual?: unknown;
  expected: unknown;
  error?: string;
};

type RunResponse = {
  results: TestResult[];
  passedCount: number;
  totalTests: number;
  score: number;
  allPassed: boolean;
  finalSubmit?: boolean;
  studyProgress?: {
    completedCount: number;
    totalQuestions: number;
    progressPercent: number;
    status: string;
  };
};

const challenges: Challenge[] = [
  {
    id: "pair-with-target-sum",
    title: "Pair With Target Sum",
    topic: "Two Pointers",
    difficulty: "Easy",
    description:
      "Given a sorted array of integers and a target, return the indexes of the two numbers whose sum equals the target. Return an empty array when no pair exists.",
    examples: [{ input: "numbers = [1, 2, 4, 6, 10], target = 8", output: "[1, 3]" }],
    constraints: ["The input array is sorted in ascending order.", "Use zero-based indexes.", "Aim for O(n) time."],
    functionName: "pairWithTargetSum",
    starterCode: `function pairWithTargetSum(numbers, target) {
  // Move two pointers toward each other.
  
}`,
    tests: [
      { args: [[1, 2, 4, 6, 10], 8], expected: [1, 3] },
      { args: [[2, 3, 5, 8, 11], 13], expected: [0, 4] },
      { args: [[1, 2, 3], 20], expected: [] },
      { args: [[-5, -2, 0, 4, 9], 4], expected: [0, 4] },
    ],
    hint: "Compare the current sum with the target. Move the left pointer up when the sum is too small.",
    estimatedMinutes: 15,
  },
  {
    id: "first-unique-character",
    title: "First Unique Character",
    topic: "Hash Maps",
    difficulty: "Easy",
    description:
      "Return the index of the first character that appears exactly once in a string. Return -1 if every character repeats.",
    examples: [{ input: 'text = "zentric"', output: "0" }],
    constraints: ["The string contains lowercase English letters.", "Aim for O(n) time."],
    functionName: "firstUniqueCharacter",
    starterCode: `function firstUniqueCharacter(text) {
  // Count characters, then find the first unique one.
  
}`,
    tests: [
      { args: ["zentric"], expected: 0 },
      { args: ["aabbc"], expected: 4 },
      { args: ["aabb"], expected: -1 },
      { args: ["leetcode"], expected: 0 },
    ],
    hint: "A frequency map lets you separate counting from finding the first valid index.",
    estimatedMinutes: 12,
  },
  {
    id: "compress-sorted-array",
    title: "Compress Sorted Array",
    topic: "Arrays",
    difficulty: "Medium",
    description:
      "Given a sorted array, return a new array containing each value once followed by its frequency when that frequency is greater than one.",
    examples: [{ input: "values = [1, 1, 1, 2, 3, 3]", output: "[1, 3, 2, 3, 2]" }],
    constraints: ["Do not convert the array to a string.", "Preserve numeric values.", "Aim for O(n) time."],
    functionName: "compressSortedArray",
    starterCode: `function compressSortedArray(values) {
  const result = [];
  
  return result;
}`,
    tests: [
      { args: [[1, 1, 1, 2, 3, 3]], expected: [1, 3, 2, 3, 2] },
      { args: [[4]], expected: [4] },
      { args: [[]], expected: [] },
      { args: [[-1, -1, 0, 0, 0]], expected: [-1, 2, 0, 3] },
    ],
    hint: "Track the start of each group and count how far the next different value is.",
    estimatedMinutes: 20,
  },
  {
    id: "valid-bracket-stream",
    title: "Valid Bracket Stream",
    topic: "Stacks",
    difficulty: "Medium",
    description:
      "Determine whether a string containing (), [], and {} is balanced. Ignore all non-bracket characters.",
    examples: [{ input: 'text = "if (ready) { run(); }"', output: "true" }],
    constraints: ["Ignore letters, spaces, and punctuation.", "Every closing bracket must match the latest opener."],
    functionName: "isBracketStreamValid",
    starterCode: `function isBracketStreamValid(text) {
  const stack = [];
  
}`,
    tests: [
      { args: ["if (ready) { run(); }"], expected: true },
      { args: ["([{}])"], expected: true },
      { args: ["([)]"], expected: false },
      { args: ["hello world"], expected: true },
    ],
    hint: "Store opening brackets on a stack and map every closing bracket to its expected opener.",
    estimatedMinutes: 18,
  },
  {
    id: "longest-focused-streak",
    title: "Longest Focused Streak",
    topic: "Sliding Window",
    difficulty: "Medium",
    description:
      "Given an array of daily focus scores and a minimum score, return the length of the longest contiguous streak where every score meets the minimum.",
    examples: [{ input: "scores = [80, 92, 75, 88, 91], minimum = 80", output: "2" }],
    constraints: ["Scores are integers from 0 to 100.", "Return 0 for an empty array."],
    functionName: "longestFocusedStreak",
    starterCode: `function longestFocusedStreak(scores, minimum) {
  let best = 0;
  let current = 0;
  
}`,
    tests: [
      { args: [[80, 92, 75, 88, 91], 80], expected: 2 },
      { args: [[90, 91, 92], 80], expected: 3 },
      { args: [[20, 30], 80], expected: 0 },
      { args: [[], 50], expected: 0 },
    ],
    hint: "Reset the current streak whenever a score drops below the minimum.",
    estimatedMinutes: 15,
  },
  {
    id: "flatten-goal-tree",
    title: "Flatten Goal Tree",
    topic: "Recursion",
    difficulty: "Hard",
    description:
      "A goal has a name and optional children. Return all goal names in depth-first preorder.",
    examples: [{ input: 'goal = { name: "Ship", children: [{ name: "Build" }] }', output: '["Ship", "Build"]' }],
    constraints: ["Children may be missing or empty.", "Visit a parent before its children."],
    functionName: "flattenGoalTree",
    starterCode: `function flattenGoalTree(goal) {
  // Return goal names in depth-first preorder.
  
}`,
    tests: [
      { args: [{ name: "Ship", children: [{ name: "Build" }, { name: "Test" }] }], expected: ["Ship", "Build", "Test"] },
      { args: [{ name: "Learn" }], expected: ["Learn"] },
      { args: [{ name: "A", children: [{ name: "B", children: [{ name: "C" }] }] }], expected: ["A", "B", "C"] },
      { args: [{ name: "Root", children: [] }], expected: ["Root"] },
    ],
    hint: "Add the current node first, then recursively combine the results from each child.",
    estimatedMinutes: 25,
  },
];

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  Medium: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  Hard: "border-red-500/20 bg-red-500/10 text-red-300",
};

const executionTests: Record<string, Array<{ stdin: string; expectedOutput: string }>> = {
  "pair-with-target-sum": [
    { stdin: "5\n1 2 4 6 10\n8\n", expectedOutput: "1 3" },
    { stdin: "5\n2 3 5 8 11\n13\n", expectedOutput: "0 4" },
    { stdin: "3\n1 2 3\n20\n", expectedOutput: "" },
    { stdin: "5\n-5 -2 0 4 9\n4\n", expectedOutput: "0 4" },
  ],
  "first-unique-character": [
    { stdin: "zentric\n", expectedOutput: "0" },
    { stdin: "aabbc\n", expectedOutput: "4" },
    { stdin: "aabb\n", expectedOutput: "-1" },
    { stdin: "leetcode\n", expectedOutput: "0" },
  ],
  "compress-sorted-array": [
    { stdin: "6\n1 1 1 2 3 3\n", expectedOutput: "1 3 2 3 2" },
    { stdin: "1\n4\n", expectedOutput: "4" },
    { stdin: "0\n\n", expectedOutput: "" },
    { stdin: "5\n-1 -1 0 0 0\n", expectedOutput: "-1 2 0 3" },
  ],
  "valid-bracket-stream": [
    { stdin: "if (ready) { run(); }\n", expectedOutput: "true" },
    { stdin: "([{}])\n", expectedOutput: "true" },
    { stdin: "([)]\n", expectedOutput: "false" },
    { stdin: "hello world\n", expectedOutput: "true" },
  ],
  "longest-focused-streak": [
    { stdin: "5\n80 92 75 88 91\n80\n", expectedOutput: "2" },
    { stdin: "3\n90 91 92\n80\n", expectedOutput: "3" },
    { stdin: "2\n20 30\n80\n", expectedOutput: "0" },
    { stdin: "0\n\n50\n", expectedOutput: "0" },
  ],
  "flatten-goal-tree": [
    { stdin: "Ship Build Test\n", expectedOutput: "Ship Build Test" },
    { stdin: "Learn\n", expectedOutput: "Learn" },
    { stdin: "A B C\n", expectedOutput: "A B C" },
    { stdin: "Root\n", expectedOutput: "Root" },
  ],
};

function challengePattern(challenge: Challenge) {
  if (challenge.pattern) return challenge.pattern;
  const topicPatterns: Record<string, string> = {
    Arrays: "Move through the array once and keep the values you need as you go.",
    Strings: "Track characters carefully using counts, two pointers, or a small lookup.",
    "Linked Lists": "Move pointers step by step and avoid losing the next node.",
    Stacks: "Use a stack when the latest unfinished item should be handled first.",
    Trees: "Visit nodes using DFS or BFS depending on the order the problem needs.",
    "Binary Search": "Reduce the search range again and again until only the answer remains.",
    "Dynamic Programming": "Break the problem into states and reuse already-computed answers.",
    Graphs: "Treat items as nodes and connections, then explore with BFS or DFS.",
    "Sorting Algorithms": "Sort first when order can make the decision easier.",
    "Recursion & Backtracking": "Try choices one by one, then undo and explore the next choice.",
    Heaps: "Use a priority queue when you repeatedly need the smallest, largest, or top-k values.",
    "Hash Maps": "Store quick lookups so you do not scan the same data again.",
    Tries: "Store words by prefix when repeated prefix checks are important.",
    "Sliding Window": "Grow and shrink a window while keeping the current answer updated.",
    "Two Pointers": "Use two positions to compare, merge, or narrow the answer efficiently.",
  };
  return topicPatterns[challenge.topic] ?? "Start with a simple approach, then remove repeated work.";
}

function challengeComplexity(challenge: Challenge) {
  if (challenge.expectedComplexity) return challenge.expectedComplexity;
  const topicComplexities: Record<string, string> = {
    Arrays: "A good solution usually checks each value once, so aim for O(n) time.",
    Strings: "Try to read the string once and use only the extra memory you really need.",
    "Linked Lists": "Most solutions walk through the list once with constant extra memory.",
    Stacks: "Expect one pass through the input while the stack stores pending items.",
    Trees: "Most solutions visit every node once. Memory depends on tree height or queue size.",
    "Binary Search": "The target should be found by repeatedly halving the search space.",
    "Dynamic Programming": "The cost depends on how many states you create and store.",
    Graphs: "A clean BFS/DFS solution usually visits every node and edge once.",
    Heaps: "Use heap operations only when priority matters, because each update costs log time.",
  };
  return topicComplexities[challenge.topic] ?? "Try to avoid brute force if the input can become large.";
}

function challengeEdgeCases(challenge: Challenge) {
  if (challenge.edgeCases?.length) return challenge.edgeCases;
  const base = ["minimum or empty input", "duplicate values", "negative or boundary values"];
  if (challenge.topic === "Graphs") return ["disconnected graph", "single node graph", "cycle or no path"];
  if (challenge.topic === "Trees") return ["empty tree", "single node", "very skewed tree"];
  if (challenge.topic === "Binary Search") return ["target not present", "first or last position", "one element"];
  if (challenge.topic === "Dynamic Programming") return ["zero state", "impossible case", "large input"];
  return base;
}

function strengthenChallenge(challenge: Challenge, source: Challenge["source"] = "study-bank"): Challenge {
  return {
    ...challenge,
    source,
    pattern: challengePattern(challenge),
    expectedComplexity: challengeComplexity(challenge),
    edgeCases: challengeEdgeCases(challenge),
  };
}

function getTests(challenge: Challenge) {
  if (challenge.tests.every((test) => test.stdin !== undefined)) {
    return challenge.tests.map((test) => ({
      stdin: test.stdin ?? "",
      expectedOutput: test.expectedOutput ?? "",
    }));
  }
  return executionTests[challenge.id] ?? [];
}

function getJudgeTests(challenge: Challenge, finalSubmit = false) {
  const tests = getTests(challenge);
  return finalSubmit ? tests : tests.slice(0, Math.min(3, tests.length));
}

function inputGuide(challenge: Challenge) {
  if (challenge.inputFormat) return challenge.inputFormat;
  const guides: Record<string, string> = {
    "pair-with-target-sum":
      "Line 1: n. Line 2: n sorted integers. Line 3: target. Print the two indexes separated by a space, or print nothing.",
    "first-unique-character":
      "One line containing the string. Print the first unique character index, or -1.",
    "compress-sorted-array":
      "Line 1: n. Line 2: n sorted integers. Print the compressed values separated by spaces.",
    "valid-bracket-stream":
      "One line containing the text. Print true or false.",
    "longest-focused-streak":
      "Line 1: n. Line 2: n focus scores. Line 3: minimum score. Print the longest streak length.",
    "flatten-goal-tree":
      "One line containing goal names in preorder separated by spaces. Print the names in preorder.",
  };
  return guides[challenge.id] ?? "Read the challenge input from standard input and print the answer.";
}

function starterCodeFor(challenge: Challenge, language: Language) {
  const guide = inputGuide(challenge);
  const title = challenge.title;
  switch (language) {
    case "python":
      return `import sys

# ${title}
# Input: ${guide}
def solve(data: str) -> str:
    # Parse data and return the exact output.
    return ""

if __name__ == "__main__":
    print(solve(sys.stdin.read()), end="")
`;
    case "java":
      return `import java.io.*;

public class Main {
    // ${title}
    // Input: ${guide}
    static String solve(String input) {
        // Parse input and return the exact output.
        return "";
    }

    public static void main(String[] args) throws Exception {
        String input = new String(System.in.readAllBytes());
        System.out.print(solve(input));
    }
}
`;
    case "cpp":
      return `#include <bits/stdc++.h>
using namespace std;

// ${title}
// Input: ${guide}
string solve(const string& input) {
    // Parse input and return the exact output.
    return "";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    cout << solve(input);
    return 0;
}
`;
    case "c":
      return `#include <stdio.h>
#include <string.h>

// ${title}
// Input: ${guide}
int main(void) {
    // Read from stdin, solve the challenge, and print the exact output.
    return 0;
}
`;
    default:
      return `const fs = require("fs");

// ${title}
// Input: ${guide}
function solve(input) {
  // Parse input and return the exact output.
  return "";
}

process.stdout.write(String(solve(fs.readFileSync(0, "utf8"))));
`;
  }
}

function dailyChallenge() {
  const date = new Date();
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  const bank = getPracticeQuestions("Arrays");
  return strengthenChallenge((bank[dayNumber % bank.length] ?? challenges[0]!) as Challenge);
}

export default function CodingHubPage() {
  const daily = dailyChallenge();
  const [selected, setSelected] = useState<Challenge>(daily);
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState(starterCodeFor(daily, "javascript"));
  const [topic, setTopic] = useState("All topics");
  const [difficulty, setDifficulty] = useState("All");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [studyContext, setStudyContext] = useState<{
    studyTopicId: string;
    questionId: string;
  } | null>(null);
  const [studyProgressMessage, setStudyProgressMessage] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("zentric-coding-completed");
      if (stored) setCompleted(JSON.parse(stored));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const bankTopic = topic === "All topics" ? "Arrays" : normalizePracticeTopic(topic);
  const filteredChallenges = (topic === "All topics"
    ? practiceTopics.flatMap((item) => getPracticeQuestions(item).slice(0, 5)).map((challenge) => strengthenChallenge(challenge as Challenge, "study-bank"))
    : getPracticeQuestions(bankTopic).map((challenge) => strengthenChallenge(challenge as Challenge, "study-bank"))
  ).filter((challenge) => difficulty === "All" || challenge.difficulty === difficulty);

  const chooseChallenge = (challenge: Challenge) => {
    setSelected(challenge);
    setCode(starterCodeFor(challenge, language));
    setResults(null);
    setReview("");
    setShowHint(false);
    setError("");
    setStudyProgressMessage("");
    setSubmissionMessage("");
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const studyTopicId = params.get("studyTopicId");
      const questionId = params.get("questionId");
      const topicParam = params.get("topic");

      if (!topicParam) return;

      const normalizedTopic = normalizePracticeTopic(topicParam);
      setTopic(normalizedTopic);
      setDifficulty("All");

      if (!studyTopicId || !questionId) {
        const firstQuestion = getPracticeQuestions(normalizedTopic)[0];
        if (firstQuestion) {
          setSelected(strengthenChallenge(firstQuestion as Challenge, "study-bank"));
          setCode(starterCodeFor(firstQuestion as Challenge, "javascript"));
          setResults(null);
          setReview("");
          setShowHint(false);
          setError("");
          setStudyProgressMessage("");
          setSubmissionMessage("");
        }
        return;
      }

      const practiceQuestion = getPracticeQuestion(normalizedTopic, questionId);
      if (!practiceQuestion) return;
      const strengthenedQuestion = strengthenChallenge(practiceQuestion as Challenge, "study-bank");

      setStudyContext({ studyTopicId, questionId });
      setSelected(strengthenedQuestion);
      setCode(starterCodeFor(strengthenedQuestion, "javascript"));
      setResults(null);
      setReview("");
      setShowHint(false);
      setError("");
      setStudyProgressMessage("");
      setSubmissionMessage("");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const runTests = async (submitForStudy = false, finalSubmit = false) => {
    if (submitForStudy || finalSubmit) {
      setSubmittingSolution(true);
    } else {
      setRunning(true);
    }
    setError("");
    setReview("");
    setSubmissionMessage("");
    if (submitForStudy) setStudyProgressMessage("");
    try {
      const response = await fetch("/api/coding-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          language,
          code,
          tests: getJudgeTests(selected, finalSubmit),
          title: selected.title,
          topic: selected.topic,
          difficulty: selected.difficulty,
          studyTopicId: studyContext?.studyTopicId,
          questionId: studyContext?.questionId,
          submitForStudy,
          finalSubmit,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to run this solution.");
      const runData = data as RunResponse;
      const testResults = runData.results;
      setResults(testResults);

      if (finalSubmit && testResults.every((result) => result.passed) && !completed.includes(selected.id)) {
        const nextCompleted = [...completed, selected.id];
        setCompleted(nextCompleted);
        window.localStorage.setItem("zentric-coding-completed", JSON.stringify(nextCompleted));
      }

      if (runData.studyProgress) {
        setStudyProgressMessage(
          `Study Tracker updated: ${runData.studyProgress.completedCount}/${runData.studyProgress.totalQuestions} questions completed. Status: ${String(runData.studyProgress.status).replace("_", " ")}.`,
        );
      } else if (submitForStudy && !testResults.every((result) => result.passed)) {
        setStudyProgressMessage("Fix the failing tests, then submit again to update Study Tracker.");
      } else if (submitForStudy) {
        setStudyProgressMessage("This question could not be linked to Study Tracker. Open it from the Study page and try again.");
      }

      if (finalSubmit && !submitForStudy) {
        setSubmissionMessage(
          runData.allPassed
            ? `Accepted: ${runData.score}% score across full judge tests. This coding practice now counts toward your growth timeline.`
            : `Not accepted yet: ${runData.score}% score on full judge tests. Fix failing tests and submit again.`,
        );
      }
    } catch (runError) {
      setResults(null);
      setError(runError instanceof Error ? runError.message : "Unable to run this solution.");
    } finally {
      setRunning(false);
      setSubmittingSolution(false);
    }
  };

  const generateChallenge = async () => {
    setGenerating(true);
    setError("");
    setReview("");
    try {
      const response = await fetch("/api/coding-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic: topic === "All topics" ? "Arrays and problem solving" : topic,
          difficulty: difficulty === "All" ? "Medium" : difficulty,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate a challenge.");

      const generated = {
        ...data.challenge,
        id: `ai-${data.challenge.id || "challenge"}-${Date.now()}`,
        estimatedMinutes: data.challenge.estimatedMinutes || 20,
        source: "ai",
      } as Challenge;
      chooseChallenge(strengthenChallenge(generated, "ai"));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate a challenge.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const requestReview = async () => {
    setReviewing(true);
    setError("");
    try {
      const response = await fetch("/api/coding-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          title: selected.title,
          description: selected.description,
          code,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review this solution.");
      setReview(data.review);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error ? reviewError.message : "Unable to review this solution.",
      );
    } finally {
      setReviewing(false);
    }
  };

  const toggleHint = async () => {
    const willShow = !showHint;
    setShowHint(willShow);
    if (!willShow) return;

    await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_event",
        type: "coding_hint_used",
        module: "Coding Hub",
        title: `Used hint: ${selected.title}`,
        detail: `Hint requested for ${selected.topic} (${selected.difficulty}).`,
        impact: 1,
        metadata: {
          challengeId: selected.id,
          topic: selected.topic,
          difficulty: selected.difficulty,
          language,
        },
      }),
    }).catch(() => undefined);
  };

  const passedCount = results?.filter((result) => result.passed).length ?? 0;
  const visibleTestCount = getJudgeTests(selected, false).length;
  const fullJudgeTestCount = getJudgeTests(selected, true).length;
  const lastRunWasFinal = Boolean(results && results.length === fullJudgeTestCount);

  return (
    <main className="zentric-page-shell mx-auto max-w-[1500px]">
      <header className="zentric-human-card mb-7 flex flex-col gap-5 rounded-[1.5rem] p-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315F8F] to-[#20364F] shadow-lg shadow-blue-200/70">
              <Braces className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#172033]">Coding Hub</h1>
              <p className="text-sm text-[#667085]">Practice, run, test, and improve without leaving Zentric.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex">
          <div className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 px-4 py-2.5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#667085]">Solved</p>
            <p className="mt-0.5 text-sm font-semibold text-[#172033]">{completed.length}</p>
          </div>
          <div className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 px-4 py-2.5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#667085]">Language</p>
            <p className="mt-0.5 text-sm font-semibold text-[#315F8F]">
              {languages[language].label}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 px-4 py-2.5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#667085]">Daily streak</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-orange-700">
              <Flame className="size-3.5" /> {completed.length ? 1 : 0}
            </p>
          </div>
        </div>
      </header>

      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <button
          onClick={() => chooseChallenge(daily)}
          className="group flex items-center gap-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-[#FFFDF9] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <Trophy className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-700">Daily challenge</span>
              <Badge className={`border ${difficultyStyles[daily.difficulty]}`}>{daily.difficulty}</Badge>
            </div>
            <p className="font-medium text-[#172033]">{daily.title}</p>
            <p className="truncate text-xs text-[#667085]">{daily.description}</p>
          </div>
          <ChevronRight className="size-5 text-[#8A98A8] transition group-hover:translate-x-1 group-hover:text-orange-700" />
        </button>

        <div className="zentric-panel flex flex-col gap-2 rounded-2xl p-4 sm:flex-row lg:min-w-[470px]">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="min-w-[165px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              {["All topics", ...practiceTopics].map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Easy", "Medium", "Hard"].map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={generateChallenge}
            disabled={generating}
            className="zentric-primary-action flex-1"
          >
            {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <WandSparkles className="mr-2 size-4" />}
            Generate with AI
          </Button>
        </div>
      </section>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <CircleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {studyContext && (
        <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          This question is linked to Study Tracker. Run tests while practicing, then use Submit solution to update that topic&apos;s progress.
          {studyProgressMessage && (
            <p className="mt-2 font-medium text-emerald-200">{studyProgressMessage}</p>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-[#172033]">Topic practice</h2>
            <span className="text-xs font-medium text-[#667085]">{filteredChallenges.length} challenges</span>
          </div>
          <div className="space-y-2">
            {filteredChallenges.map((challenge) => {
              const isSelected = selected.id === challenge.id;
              const isCompleted = completed.includes(challenge.id);
              return (
                <button
                  key={challenge.id}
                  onClick={() => chooseChallenge(challenge)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#84B8D8] bg-[#EAF6FF] shadow-sm shadow-blue-100/70 ring-1 ring-[#B9DDF2]"
                      : "border-[#D6E4F5] bg-[#FFFDF9] hover:border-[#AFCBE3] hover:bg-[#F4FAFF] hover:shadow-sm"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium ${isSelected ? "text-[#315F8F]" : "text-[#667085]"}`}>
                      {challenge.topic}
                    </span>
                    {isCompleted ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="size-3" />
                      </span>
                    ) : (
                      <Badge className={`border text-[10px] ${difficultyStyles[challenge.difficulty]}`}>
                        {challenge.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#172033]">{challenge.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#667085]">
                    <Clock3 className="size-3" /> {challenge.estimatedMinutes} min
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)]">
          <Card className="border-[#D6E4F5] bg-[#FFFDF9]">
            <CardHeader className="border-b border-[#D6E4F5]">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className={`border ${difficultyStyles[selected.difficulty]}`}>{selected.difficulty}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-400">{selected.topic}</Badge>
                {selected.id.includes("ai-") && (
                  <Badge className="border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <Sparkles className="mr-1 size-3" /> AI generated
                  </Badge>
                )}
                {selected.source === "study-bank" && (
                  <Badge className="border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                    LeetCode-style bank
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl text-[#172033]">{selected.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Problem</h3>
                <p className="text-sm leading-6 text-[#314154]">{selected.description}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#C9DDF4] bg-[#EEF6FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#315F8F]">How to think about it</p>
                  <p className="mt-1 text-xs leading-5 text-[#314154]">{challengePattern(selected)}</p>
                </div>
                <div className="rounded-xl border border-[#C9DDF4] bg-[#F4F8FD] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#315F8F]">Expected running cost</p>
                  <p className="mt-1 text-xs leading-5 text-[#314154]">{challengeComplexity(selected)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Be careful about</p>
                  <p className="mt-1 text-xs leading-5 text-[#314154]">{challengeEdgeCases(selected).join(", ")}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Example</h3>
                {selected.examples.map((example, index) => (
                  <div key={`${example.input}-${index}`} className="rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3 font-mono text-xs">
                    <p><span className="text-[#667085]">Input: </span><span className="text-[#0F6B8D]">{example.input}</span></p>
                    <p className="mt-1"><span className="text-[#667085]">Output: </span><span className="text-emerald-700">{example.output}</span></p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Constraints</h3>
                <ul className="space-y-2">
                  {selected.constraints.map((constraint) => (
                    <li key={constraint} className="flex gap-2 text-xs leading-5 text-[#536578]">
                      <Target className="mt-0.5 size-3.5 shrink-0 text-[#315F8F]" />
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  How input and output should look
                </h3>
                <p className="rounded-xl border border-[#C9DDF4] bg-[#EEF6FF] p-3 text-xs leading-5 text-[#314154]">
                  {inputGuide(selected)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Practice check</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">{visibleTestCount} visible tests</p>
                  <p className="mt-1 text-xs text-[#667085]">Use this while building your approach.</p>
                </div>
                <div className="rounded-xl border border-[#D6E4F5] bg-[#F8FBFF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Final check</p>
                  <p className="mt-1 text-sm font-semibold text-[#172033]">{fullJudgeTestCount} total tests</p>
                  <p className="mt-1 text-xs text-[#667085]">Submit final to count this as solved.</p>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHint}
                  className="border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
                >
                  <Lightbulb className="mr-2 size-3.5" />
                  {showHint ? "Hide hint" : "Show hint"}
                </Button>
                {showHint && (
                  <p className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-100/80">
                    {selected.hint}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-5">
            <Card className="overflow-hidden border-white/8 bg-[#080b14]">
              <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">
                    solution.{languages[language].extension}
                  </span>
                  <Select
                    value={language}
                    onValueChange={(value) => {
                      const nextLanguage = value as Language;
                      setLanguage(nextLanguage);
                      setCode(starterCodeFor(selected, nextLanguage));
                      setResults(null);
                      setReview("");
                      setError("");
                    }}
                  >
                    <SelectTrigger
                      aria-label="Programming language"
                      className={`h-8 min-w-[130px] border ${languages[language].badge}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(languages) as Language[]).map((languageKey) => (
                        <SelectItem key={languageKey} value={languageKey}>
                          {languages[languageKey].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCode(starterCodeFor(selected, language));
                    setResults(null);
                    setReview("");
                  }}
                  className="h-8 text-gray-500 hover:text-white"
                >
                  <RotateCcw className="mr-1.5 size-3.5" /> Reset
                </Button>
              </div>
              <textarea
                aria-label={`${languages[language].label} solution editor`}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="min-h-[360px] w-full resize-y bg-[#080b14] p-5 font-mono text-[13px] leading-6 text-slate-200 outline-none placeholder:text-gray-700"
              />
              <div className="flex flex-col gap-2 border-t border-white/8 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-gray-600">
                  Run tests uses visible samples. Submit final runs the full judge set and records accepted solutions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={requestReview}
                    disabled={reviewing}
                    className="border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
                  >
                    {reviewing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bot className="mr-2 size-4" />}
                    AI review
                  </Button>
                  <Button
                    onClick={() => runTests(false)}
                    disabled={running || submittingSolution}
                    className="border-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                  >
                    {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4 fill-white" />}
                    Run sample tests
                  </Button>
                  <Button
                    onClick={() => studyContext ? runTests(true, true) : runTests(false, true)}
                    disabled={running || submittingSolution}
                    className="border-0 bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
                  >
                    {submittingSolution ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 size-4" />
                    )}
                    {studyContext ? "Submit to Study" : "Submit final"}
                  </Button>
                </div>
              </div>
            </Card>

            {submissionMessage && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {submissionMessage}
              </div>
            )}

            {results && (
              <Card className={`border ${passedCount === results.length ? "border-emerald-500/20" : "border-red-500/20"} bg-white/[0.025]`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">
                      {lastRunWasFinal && passedCount === results.length ? "Accepted" : lastRunWasFinal ? "Judge results" : "Sample results"}
                    </CardTitle>
                    <span className={`text-sm font-semibold ${passedCount === results.length ? "text-emerald-300" : "text-red-300"}`}>
                      {passedCount}/{results.length} passed
                    </span>
                  </div>
                  <p className="pt-2 text-xs text-gray-500">
                    {passedCount === results.length
                      ? lastRunWasFinal
                        ? "Full judge accepted. This solution can now count toward Coding Hub progress."
                        : "Sample tests passed. Submit final to check hidden/edge tests and record progress."
                      : lastRunWasFinal
                        ? "Some judge tests failed. Fix the edge cases, then submit again."
                        : "Some sample tests failed. Compare expected vs received, then run again."}
                  </p>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {results.map((result, index) => (
                    <div
                      key={`${selected.id}-test-${index}`}
                      className={`rounded-xl border p-3 ${
                        result.passed
                          ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                          : "border-red-500/15 bg-red-500/[0.06]"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                        {result.passed ? <Check className="size-4 text-emerald-300" /> : <X className="size-4 text-red-300" />}
                        <span className={result.passed ? "text-emerald-200" : "text-red-200"}>Test {index + 1}</span>
                      </div>
                      {result.error ? (
                        <p className="break-words font-mono text-[11px] leading-5 text-red-300/80">{result.error}</p>
                      ) : (
                        <div className="space-y-1 font-mono text-[11px] text-gray-500">
                          <p>Expected: <span className="text-gray-300">{JSON.stringify(result.expected)}</span></p>
                          {!result.passed && <p>Received: <span className="text-red-300">{JSON.stringify(result.actual)}</span></p>}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {review && (
              <Card className="border-purple-500/20 bg-purple-500/[0.04]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Bot className="size-4 text-purple-300" /> AI code review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
