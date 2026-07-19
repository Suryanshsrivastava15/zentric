"use client";

import { type ElementType, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileText,
  FolderKanban,
  Hash,
  Inbox,
  Layers3,
  Lightbulb,
  Network,
  Loader2,
  Microscope,
  Plus,
  Repeat2,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";

type CategoryId = "second_brain" | "learning" | "interview" | "project" | "research";
type FilterId = "all" | CategoryId;

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  category: CategoryId;
  createdAt: string;
  updatedAt: string;
}

type GeneratedCard = {
  front: string;
  back: string;
  source: string;
};

type KnowledgeConnection = {
  label: string;
  count: number;
  notes: string[];
};

type SmartDraftKind = "learning_recap" | "interview_story" | "project_evidence" | "research_digest";

const categories = [
  {
    id: "second_brain",
    name: "Second Brain",
    shortName: "Inbox",
    description: "Ideas, references, and anything worth remembering.",
    icon: Brain,
    color: "text-purple-300",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    placeholder: "Capture an idea, insight, reference, or thought...",
    template: "",
  },
  {
    id: "learning",
    name: "Learning Notes",
    shortName: "Learning",
    description: "Concepts, courses, DSA patterns, and study summaries.",
    icon: BookOpenCheck,
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    placeholder: "Explain what you learned in your own words...",
    template: `## What I learned


## Key ideas

- Add a key idea

## Example


## Questions to revisit

- Add a question`,
  },
  {
    id: "interview",
    name: "Interview Notes",
    shortName: "Interview",
    description: "Questions, STAR stories, feedback, and company preparation.",
    icon: BriefcaseBusiness,
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    placeholder: "Save interview questions, answers, and feedback...",
    template: `## Role and company


## Questions

- Add an interview question

## My answer


## Feedback and improvements

- Add feedback

## Follow-up

- Add a follow-up`,
  },
  {
    id: "project",
    name: "Project Notes",
    shortName: "Projects",
    description: "Decisions, architecture, bugs, milestones, and next actions.",
    icon: FolderKanban,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    placeholder: "Document a project decision, bug, or milestone...",
    template: `## Goal


## Current status


## Decisions

- Add a decision

## Blockers

- Add a blocker

## Next actions

- Add a next action`,
  },
  {
    id: "research",
    name: "Research Notes",
    shortName: "Research",
    description: "Sources, comparisons, findings, and open questions.",
    icon: Microscope,
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    placeholder: "Synthesize findings and record useful sources...",
    template: `## Research question


## Findings

- Add a finding

## Sources

- Add a source

## Comparison


## Conclusion

`,
  },
] as const;

function getCategory(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId) ?? categories[0];
}

function daysSince(value: string) {
  const updated = new Date(value).getTime();
  if (Number.isNaN(updated)) return 0;
  return Math.max(0, Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24)));
}

function splitTags(value?: string | null) {
  return (value ?? "")
    .split(/[,#]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function extractImportantWords(note: Note) {
  const text = `${note.title} ${note.tags ?? ""} ${note.content}`.toLowerCase();
  const words = text.match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [];
  const ignored = new Set([
    "and",
    "the",
    "for",
    "with",
    "this",
    "that",
    "from",
    "into",
    "your",
    "what",
    "will",
    "note",
    "notes",
    "project",
  ]);
  return Array.from(new Set(words.filter((word) => !ignored.has(word)))).slice(0, 8);
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildKnowledgeConnections(notes: Note[]): KnowledgeConnection[] {
  const map = new Map<string, Set<string>>();

  notes.forEach((note) => {
    [...splitTags(note.tags), ...extractImportantWords(note).slice(0, 4)].forEach((label) => {
      if (!map.has(label)) map.set(label, new Set());
      map.get(label)?.add(note.title);
    });
  });

  return Array.from(map.entries())
    .map(([label, titles]) => ({ label, count: titles.size, notes: Array.from(titles).slice(0, 4) }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function firstUsefulLine(note: Note) {
  const strongLine = note.content
    .split(/\n|\. /)
    .map((line) => line.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "").trim())
    .find((line) => line.length > 28);
  return strongLine ?? (note.content.trim().slice(0, 160) || "Review this note and explain the main idea.");
}

function buildFlashcards(notes: Note[]): GeneratedCard[] {
  return notes
    .filter((note) => note.content.trim().length > 30)
    .slice(0, 10)
    .flatMap((note) => {
      const keywords = extractImportantWords(note).slice(0, 3);
      const mainLine =
        note.content.split(/\n|\. /).find((line) => line.trim().length > 20)?.trim() ??
        "Review this note and summarize the core idea.";
      const category = getCategory(note.category).shortName;

      return [
        {
          front: `What should you remember from "${note.title}"?`,
          back: keywords.length
            ? `Key signals: ${keywords.join(", ")}. Review the note and explain it in your own words.`
            : mainLine,
          source: note.title,
        },
        {
          front: `Explain one real use of "${note.title}".`,
          back: `${category} memory: connect it to one task, interview answer, project decision, or revision point.`,
          source: note.title,
        },
        {
          front: `What mistake should you avoid for "${note.title}"?`,
          back: `Do not only reread it. Recall the idea, write a tiny example, and update weak points after practice.`,
          source: note.title,
        },
      ];
    })
    .slice(0, 24);
}

function buildMemoryBrief(notes: Note[], connections: KnowledgeConnection[], revisionQueue: Note[]) {
  const categoriesCovered = Array.from(new Set(notes.map((note) => getCategory(note.category).shortName)));
  const latest = notes[0];
  return {
    remembers: latest
      ? `Latest memory: ${latest.title}. Zentric can reuse this for ${getCategory(latest.category).name.toLowerCase()}, revision, and coaching context.`
      : "No memories captured yet. Add one learning, interview, project, or research note.",
    connection: connections[0]
      ? `${connections[0].label} connects ${connections[0].count} notes: ${connections[0].notes.join(", ")}.`
      : "No strong topic graph yet. Reuse tags like graphs, resume, react, interview, or project to connect memories.",
    revision: revisionQueue[0]
      ? `${revisionQueue[0].title} is ${daysSince(revisionQueue[0].updatedAt)} days old and should be revised next.`
      : "No overdue revision. Add more notes or revisit older learning after 2 days.",
    coverage: categoriesCovered.length
      ? `Coverage: ${categoriesCovered.join(", ")}.`
      : "Coverage: empty.",
  };
}

function buildCareerEvidence(notes: Note[]) {
  return notes
    .filter((note) => {
      const tags = splitTags(note.tags);
      return (
        note.category === "project" ||
        note.category === "interview" ||
        tags.some((tag) => ["resume", "evidence", "portfolio", "achievement", "case-study"].includes(tag))
      );
    })
    .slice(0, 5)
    .map((note) => ({
      title: note.title,
      category: getCategory(note.category).shortName,
      proof: firstUsefulLine(note),
    }));
}

function buildMemoryPackContent({
  notes,
  flashcards,
  connections,
  revisionQueue,
}: {
  notes: Note[];
  flashcards: GeneratedCard[];
  connections: KnowledgeConnection[];
  revisionQueue: Note[];
}) {
  const recent = notes.slice(0, 6);
  const evidence = buildCareerEvidence(notes);

  return [
    "## Second Brain Memory Pack",
    "",
    "### What Zentric should remember",
    "",
    recent.length
      ? recent.map((note) => `- ${note.title}: ${firstUsefulLine(note)}`).join("\n")
      : "- Add notes from Learning Mode, Coding Hub, Career Hub, or your own study.",
    "",
    "### Knowledge connections",
    "",
    connections.length
      ? connections.slice(0, 6).map((item) => `- ${item.label}: ${item.notes.join(", ")}`).join("\n")
      : "- No strong connections yet. Add repeated tags to connect knowledge.",
    "",
    "### Flashcards",
    "",
    flashcards.length
      ? flashcards.slice(0, 8).map((card) => `- Q: ${card.front}\n  A: ${card.back}`).join("\n")
      : "- Create longer notes to generate flashcards.",
    "",
    "### Revision queue",
    "",
    revisionQueue.length
      ? revisionQueue.slice(0, 6).map((note) => `- Revise ${note.title} (${daysSince(note.updatedAt)} days old)`).join("\n")
      : "- Nothing overdue yet.",
    "",
    "### Planner-ready recall prompts",
    "",
    revisionQueue.length
      ? revisionQueue
          .slice(0, 4)
          .map((note) => {
            const cards = buildFlashcards([note]).slice(0, 3);
            return [
              `- ${note.title}`,
              ...cards.map((card) => `  - ${card.front}`),
            ].join("\n");
          })
          .join("\n")
      : "- No recall prompts yet.",
    "",
    "### Career evidence",
    "",
    evidence.length
      ? evidence.map((item) => `- ${item.title} (${item.category}): ${item.proof}`).join("\n")
      : "- Add project or interview notes to create resume/interview evidence.",
  ].join("\n");
}

function buildRevisionTaskDescription(note: Note) {
  const cards = buildFlashcards([note]).slice(0, 3);
  const recallQuestions = cards.length
    ? cards.map((card, index) => `${index + 1}. ${card.front}`).join("\n")
    : "1. What is the main idea?\n2. Where can you apply it?\n3. What mistake should you avoid?";

  return [
    `Review this ${getCategory(note.category).name.toLowerCase()} note.`,
    "",
    `Memory seed: ${firstUsefulLine(note)}`,
    "",
    "Recall questions:",
    recallQuestions,
    "",
    "After revision, update the note with weak points, examples, and next action.",
  ].join("\n");
}

function buildSmartDraft(kind: SmartDraftKind, recentLearning: Note | null) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const drafts: Record<
    SmartDraftKind,
    { title: string; category: CategoryId; tags: string; content: string }
  > = {
    learning_recap: {
      title: `Learning Recap - ${today}`,
      category: "learning",
      tags: "learning-recap,revision,ai-coach",
      content: `## Topic learned


## Explain it in my words


## Example or application


## Mistakes / weak points

- 

## 3 flashcard points

- 
- 
- 

## Next revision action

`,
    },
    interview_story: {
      title: `Interview Story - ${today}`,
      category: "interview",
      tags: "interview,star-story,career-evidence",
      content: `## Target role / company


## Question or situation


## STAR answer

Situation:

Task:

Action:

Result:

## Technical depth to mention


## Feedback / improvement

`,
    },
    project_evidence: {
      title: `Project Evidence - ${today}`,
      category: "project",
      tags: "project,resume,evidence,portfolio",
      content: `## Project / feature


## Problem solved


## What I built


## Tech used


## Impact / metric


## Resume bullet draft

- Built ...

## Proof links / screenshots

`,
    },
    research_digest: {
      title: `Research Digest - ${today}`,
      category: "research",
      tags: "research,digest,sources",
      content: `## Research question


## Best sources

- 

## Key findings

- 

## My conclusion


## How this helps my goal

${recentLearning ? `Connected memory: ${recentLearning.title}` : ""}
`,
    },
  };

  return drafts[kind];
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMemoryAction, setSavingMemoryAction] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    tags: "",
    category: "second_brain" as CategoryId,
  });

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your notes.");
      setNotes(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notes")
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Unable to load your notes.");
        setNotes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load your notes.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          notes.filter((note) => note.category === category.id).length,
        ]),
      ) as Record<CategoryId, number>,
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesCategory = activeFilter === "all" || note.category === activeFilter;
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, notes, search]);

  const revisionQueue = useMemo(
    () =>
      notes
        .filter((note) => daysSince(note.updatedAt) >= 2)
        .sort((a, b) => daysSince(b.updatedAt) - daysSince(a.updatedAt))
        .slice(0, 6),
    [notes],
  );

  const flashcards = useMemo(() => buildFlashcards(notes), [notes]);
  const knowledgeConnections = useMemo(() => buildKnowledgeConnections(notes), [notes]);
  const memoryBrief = useMemo(
    () => buildMemoryBrief(notes, knowledgeConnections, revisionQueue),
    [knowledgeConnections, notes, revisionQueue],
  );
  const careerEvidence = useMemo(() => buildCareerEvidence(notes), [notes]);
  const recentLearning = notes.find((note) => note.category === "learning") ?? notes[0] ?? null;
  const missingSpaces = useMemo(
    () => categories.filter((category) => counts[category.id] === 0).map((category) => category.shortName),
    [counts],
  );
  const memoryHealthScore = useMemo(() => {
    const coverageScore = (categories.length - missingSpaces.length) * 14;
    const notesScore = Math.min(notes.length, 12) * 3;
    const flashcardScore = Math.min(flashcards.length, 12) * 1.5;
    const connectionScore = Math.min(knowledgeConnections.length, 6) * 3;
    const revisionPenalty = Math.min(revisionQueue.length, 5) * 4;
    return clampScore(coverageScore + notesScore + flashcardScore + connectionScore - revisionPenalty);
  }, [flashcards.length, knowledgeConnections.length, missingSpaces.length, notes.length, revisionQueue.length]);

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setError("");
    setMessage("");
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags || "",
      category: note.category || "second_brain",
    });
  };

  const startCreate = (categoryId?: CategoryId) => {
    const category =
      categoryId ?? (activeFilter === "all" ? "second_brain" : activeFilter);
    const categoryConfig = getCategory(category);
    setSelectedNote(null);
    setIsCreating(true);
    setError("");
    setMessage("");
    setEditForm({
      title: "",
      content: categoryConfig.template,
      tags: "",
      category,
    });
  };

  const startCreateGenerated = ({
    title,
    content,
    category,
    tags,
  }: {
    title: string;
    content: string;
    category: CategoryId;
    tags: string;
  }) => {
    setSelectedNote(null);
    setIsCreating(true);
    setError("");
    setMessage("");
    setEditForm({ title, content, category, tags });
  };

  const createMemoryPackDraft = () => {
    startCreateGenerated({
      title: "Second Brain Memory Pack",
      category: "second_brain",
      tags: "memory-pack,flashcards,revision,career-evidence",
      content: buildMemoryPackContent({
        notes,
        flashcards,
        connections: knowledgeConnections,
        revisionQueue,
      }),
    });
  };

  const createSmartDraft = (kind: SmartDraftKind) => {
    startCreateGenerated(buildSmartDraft(kind, recentLearning));
  };

  const sendRevisionToPlanner = async () => {
    const revisionTargets = revisionQueue.length ? revisionQueue.slice(0, 5) : notes.slice(0, 3);

    if (revisionTargets.length === 0) {
      setMessage("Add a note first, then Zentric can create revision tasks.");
      return;
    }

    setSavingMemoryAction(true);
    setError("");
    setMessage("");
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadline = tomorrow.toISOString().slice(0, 10);

      await Promise.all(
        revisionTargets.map((note) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Second Brain revision: ${note.title}`,
              description: buildRevisionTaskDescription(note),
              priority: daysSince(note.updatedAt) >= 7 ? "high" : "medium",
              deadline,
            }),
          }),
        ),
      );

      setMessage(`${revisionTargets.length} Second Brain revision task${revisionTargets.length === 1 ? "" : "s"} added to Planner.`);
    } catch {
      setError("Unable to send revision tasks to Planner.");
    } finally {
      setSavingMemoryAction(false);
    }
  };

  const saveNote = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        isCreating ? "/api/notes" : `/api/notes/${selectedNote?.id}`,
        {
          method: isCreating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );
      const savedNote = await response.json();
      if (!response.ok) throw new Error(savedNote.error || "Unable to save this note.");

      setIsCreating(false);
      setSelectedNote(savedNote);
      setEditForm({
        title: savedNote.title,
        content: savedNote.content,
        tags: savedNote.tags || "",
        category: savedNote.category,
      });
      await fetchNotes();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this note.");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    setError("");
    const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to delete this note.");
      return;
    }
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsCreating(false);
    }
    await fetchNotes();
  };

  const selectedCategory = getCategory(editForm.category);

  return (
    <main className="zentric-page-shell flex min-h-full flex-col">
      <header className="zentric-human-card rounded-[1.5rem] px-5 py-5 lg:px-7">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315F8F] to-[#20364F] shadow-lg shadow-blue-200/70">
                <Brain className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#172033]">Second Brain</h1>
                <p className="text-sm text-[#667085]">
                  Turn scattered thoughts into organized knowledge you can reuse.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
              <Input
                aria-label="Search second brain"
                placeholder="Search your second brain..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 pl-9"
              />
            </div>
            <Button
              onClick={() => startCreate()}
              className="zentric-primary-action"
            >
              <Plus className="mr-2 size-4" />
              New note
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300 lg:mx-7">
          {error}
        </div>
      )}

      {message && (
        <div className="mx-5 mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 lg:mx-7">
          {message}
        </div>
      )}

      <section className="mx-auto grid w-full max-w-[1600px] gap-4 py-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="zentric-human-card rounded-[1.4rem] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge className="mb-3 border-[#CFE0F2] bg-[#EEF4FF] text-[#315F8F]">
                AI Memory System
              </Badge>
              <h2 className="text-xl font-bold text-[#172033]">Your learning memory, connected to your growth mission.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
                Second Brain now stores learning notes, interview reports, project decisions, research,
                flashcards, revision signals, and knowledge links that AI Coach can use.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={createMemoryPackDraft}
                className="zentric-primary-action"
              >
                <Brain className="mr-2 size-4" />
                Create Memory Pack
              </Button>
              <Button
                onClick={sendRevisionToPlanner}
                disabled={savingMemoryAction}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {savingMemoryAction ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Repeat2 className="mr-2 size-4" />}
                Send Revision to Planner
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MemoryStat icon={Target} label="Memory Health" value={`${memoryHealthScore}%`} />
            <MemoryStat icon={Brain} label="Notes Captured" value={String(notes.length)} />
            <MemoryStat icon={Repeat2} label="Revision Due" value={String(revisionQueue.length)} />
            <MemoryStat icon={Layers3} label="Flashcards" value={String(flashcards.length)} />
            <MemoryStat icon={Network} label="Connections" value={String(knowledgeConnections.length)} />
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
                  <ClipboardList className="size-4 text-[#315F8F]" />
                  Smart capture actions
                </p>
                <p className="mt-1 text-xs leading-5 text-[#667085]">
                  Use these after a learning session, interview simulation, project update, or research session so AI Coach gets clean memory.
                </p>
              </div>
              {missingSpaces.length > 0 && (
                <Badge className="w-fit border-yellow-400/30 bg-yellow-400/10 text-yellow-100">
                  Missing: {missingSpaces.join(", ")}
                </Badge>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Button onClick={() => createSmartDraft("learning_recap")} variant="outline" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50">
                <BookOpenCheck className="mr-2 size-4" />
                Learning Recap
              </Button>
              <Button onClick={() => createSmartDraft("interview_story")} variant="outline" className="justify-start border-orange-200 text-orange-700 hover:bg-orange-50">
                <BriefcaseBusiness className="mr-2 size-4" />
                Interview Story
              </Button>
              <Button onClick={() => createSmartDraft("project_evidence")} variant="outline" className="justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="mr-2 size-4" />
                Project Evidence
              </Button>
              <Button onClick={() => createSmartDraft("research_digest")} variant="outline" className="justify-start border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <Microscope className="mr-2 size-4" />
                Research Digest
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="zentric-panel rounded-[1.4rem] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="size-4 text-[#315F8F]" />
              <p className="font-semibold text-[#172033]">What Zentric Remembers</p>
            </div>
            <div className="space-y-2 text-sm leading-6 text-[#344054]">
              <p>{memoryBrief.remembers}</p>
              <p className="text-[#667085]">{memoryBrief.coverage}</p>
            </div>
          </div>

          <div className="zentric-panel rounded-[1.4rem] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="size-4 text-yellow-300" />
              <p className="font-semibold text-[#172033]">Next Memory Action</p>
            </div>
            <p className="text-sm leading-6 text-[#667085]">
              {revisionQueue[0]
                ? `Revise "${revisionQueue[0].title}" today so the knowledge does not fade.`
                : recentLearning
                  ? `Connect "${recentLearning.title}" with a project, quiz, or interview note.`
                  : "Create one learning note from today’s work so AI Coach has memory to use."}
            </p>
          </div>

          <div className="zentric-panel rounded-[1.4rem] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Network className="size-4 text-cyan-700" />
              <p className="font-semibold text-[#172033]">Strongest Connections</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {knowledgeConnections.length === 0 ? (
                <span className="text-sm text-[#667085]">Add tags like graph, resume, project, react, interview.</span>
              ) : knowledgeConnections.slice(0, 5).map((item) => (
                <Badge key={item.label} className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                  {item.label} · {item.count}
                </Badge>
              ))}
            </div>
          </div>

          <div className="zentric-panel rounded-[1.4rem] p-4">
            <div className="mb-3 flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-emerald-700" />
              <p className="font-semibold text-[#172033]">Career Evidence</p>
            </div>
            <div className="space-y-2">
              {careerEvidence.length === 0 ? (
                <p className="text-sm leading-6 text-[#667085]">
                  Add project or interview notes. Zentric will extract resume proof and interview stories from them.
                </p>
              ) : careerEvidence.slice(0, 3).map((item) => (
                <div key={item.title} className="rounded-xl border border-[#D9E3EE] bg-[#FFFDF9] p-3">
                  <p className="text-sm font-medium text-[#172033]">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">{item.proof}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="zentric-human-card mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 overflow-hidden rounded-[1.5rem] xl:grid-cols-[230px_330px_minmax(0,1fr)]">
        <aside className="border-b border-[#D9E3EE] p-4 xl:border-b-0 xl:border-r">
          <button
            onClick={() => setActiveFilter("all")}
            className={`mb-3 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
              activeFilter === "all"
                ? "zentric-soft-active"
                : "border-transparent hover:bg-[#F4F8FC]"
            }`}
          >
            <Inbox className="size-4 text-[#667085]" />
            <span className="flex-1 text-sm font-medium text-[#344054]">All notes</span>
            <span className="text-xs text-[#667085]">{notes.length}</span>
          </button>

          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A98A8]">
            Knowledge spaces
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    isActive
                      ? `${category.border} ${category.bg}`
                      : "border-transparent hover:border-[#D9E3EE] hover:bg-[#F4F8FC]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${category.bg}`}>
                      <Icon className={`size-4 ${category.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#344054]">
                        {category.shortName}
                      </p>
                      <p className="text-[11px] text-[#667085]">{counts[category.id]} notes</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-h-[320px] border-b border-[#D9E3EE] p-3 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">
                {activeFilter === "all" ? "All notes" : getCategory(activeFilter).name}
              </h2>
              <p className="text-xs text-[#667085]">{visibleNotes.length} results</p>
            </div>
            {activeFilter !== "all" && (
              <button
                onClick={() => startCreate(activeFilter)}
                className="flex size-8 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F4F8FC] hover:text-[#172033]"
                aria-label={`Create ${getCategory(activeFilter).name}`}
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 xl:max-h-[calc(100vh-190px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-purple-400" />
              </div>
            ) : visibleNotes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={notes.length === 0 ? "Your Second Brain is empty." : "No notes match this filter."}
                description={
                  notes.length === 0
                    ? "Capture learning notes, interview feedback, project ideas, and research. Zentric will turn them into memory, flashcards, and revision signals."
                    : "Switch category or search terms to reveal more notes."
                }
                className="p-5"
                action={
                  <Button onClick={() => startCreate()} size="sm" className="zentric-primary-action">
                    <Plus className="size-4" />
                    Capture note
                  </Button>
                }
              />
            ) : (
              visibleNotes.map((note) => {
                const category = getCategory(note.category || "second_brain");
                const Icon = category.icon;
                return (
                  <article
                    key={note.id}
                    className={`group rounded-xl border p-3 transition ${
                      selectedNote?.id === note.id
                        ? `${category.border} ${category.bg}`
                        : "border-[#D9E3EE] bg-[#FFFDF9]/70 hover:border-[#B8CCE2] hover:bg-[#F4F8FC]"
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openNote(note)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") openNote(note);
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <Icon className={`mt-0.5 size-3.5 shrink-0 ${category.color}`} />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#172033]">
                          {note.title}
                        </p>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteNote(note.id);
                          }}
                          aria-label={`Delete ${note.title}`}
                          className="opacity-0 text-[#667085] transition hover:text-red-600 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <p className="line-clamp-3 text-xs leading-5 text-[#667085]">
                        {note.content || "Empty note"}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${category.color}`}>
                          {category.shortName}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[#8A98A8]">
                          <Clock3 className="size-2.5" />
                          {formatRelativeTime(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="min-h-[520px]">
          {isCreating || selectedNote ? (
            <div className="flex h-full min-h-[520px] flex-col">
              <div className="flex flex-col gap-3 border-b border-[#D9E3EE] px-5 py-4 sm:flex-row sm:items-center">
                <Input
                  aria-label="Note title"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Give this note a clear title..."
                  className="h-10 flex-1 border-0 bg-transparent px-0 text-lg font-semibold text-[#172033] shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={editForm.category}
                    onValueChange={(value) =>
                      setEditForm((current) => ({
                        ...current,
                        category: value as CategoryId,
                      }))
                    }
                  >
                    <SelectTrigger
                      aria-label="Note category"
                      className={`h-9 min-w-[150px] border ${selectedCategory.border} ${selectedCategory.bg} ${selectedCategory.color}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={saveNote}
                    disabled={saving || !editForm.title.trim()}
                    className="h-9 zentric-primary-action"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        {isCreating ? "Create" : "Save"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-[#D9E3EE] px-5 py-2">
                <Hash className="size-3.5 text-[#667085]" />
                <Input
                  aria-label="Note tags"
                  value={editForm.tags}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="Tags separated by commas"
                  className="h-8 border-0 bg-transparent px-0 text-xs text-[#667085] shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="flex-1 p-5">
                <Textarea
                  aria-label="Note content"
                  value={editForm.content}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder={selectedCategory.placeholder}
                  className="min-h-[420px] resize-none border-0 bg-transparent p-0 text-sm leading-7 text-[#344054] shadow-none focus-visible:ring-0 xl:h-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center p-6">
              <div className="w-full max-w-3xl">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#D9E3EE] bg-[#EEF4FF]">
                  <Sparkles className="size-7 text-[#315F8F]" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-[#172033]">Build your AI memory layer</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
                    Capture what matters, connect it with tags, and let Zentric turn notes into
                    flashcards, revision, and career evidence.
                  </p>
                  <Button
                    onClick={() => startCreate()}
                    className="mt-5 zentric-primary-action"
                  >
                    <Plus className="mr-2 size-4" />
                    Capture a note
                  </Button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <MemoryPanel title="Revision Queue" icon={Repeat2}>
                    {revisionQueue.length === 0 ? (
                      <p className="text-xs leading-5 text-gray-500">No overdue notes yet.</p>
                    ) : revisionQueue.slice(0, 3).map((note) => (
                      <button
                        key={note.id}
                        onClick={() => openNote(note)}
                        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-gray-300 hover:border-purple-400/30"
                      >
                        {note.title}
                        <span className="mt-1 block text-[10px] text-gray-600">{daysSince(note.updatedAt)} days old</span>
                      </button>
                    ))}
                  </MemoryPanel>

                  <MemoryPanel title="Flashcards" icon={Layers3}>
                    {flashcards.length === 0 ? (
                      <p className="text-xs leading-5 text-gray-500">Create longer notes to generate flashcards.</p>
                    ) : flashcards.slice(0, 2).map((card) => (
                      <div key={`${card.source}-${card.front}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                        <p className="font-medium text-white">{card.front}</p>
                        <p className="mt-2 leading-5 text-gray-500">{card.back}</p>
                      </div>
                    ))}
                  </MemoryPanel>

                  <MemoryPanel title="Knowledge Graph" icon={Network}>
                    {knowledgeConnections.length === 0 ? (
                      <p className="text-xs leading-5 text-gray-500">Use repeated tags to create connections.</p>
                    ) : knowledgeConnections.slice(0, 4).map((item) => (
                      <div key={item.label} className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-gray-300">
                        {item.label}
                        <span className="float-right text-gray-600">{item.count}</span>
                      </div>
                    ))}
                  </MemoryPanel>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MemoryStat({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/80 p-4 shadow-sm">
      <Icon className="mb-3 size-4 text-[#315F8F]" />
      <p className="text-2xl font-bold text-[#172033]">{value}</p>
      <p className="text-xs text-[#667085]">{label}</p>
    </div>
  );
}

function MemoryPanel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-[#315F8F]" />
        <p className="text-sm font-semibold text-[#172033]">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
