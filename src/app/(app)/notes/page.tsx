"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Save,
  Loader2,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const fetchNotes = useCallback(async (q = "") => {
    const res = await fetch(`/api/notes?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const t = setTimeout(() => fetchNotes(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchNotes]);

  const handleCreate = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const newNote = await res.json();
    setSaving(false);
    setIsCreating(false);
    await fetchNotes(search);
    setSelectedNote(newNote);
    setEditForm({ title: newNote.title, content: newNote.content, tags: newNote.tags || "" });
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setSaving(true);
    const res = await fetch(`/api/notes/${selectedNote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setSaving(false);
    setSelectedNote(updated);
    fetchNotes(search);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    fetchNotes(search);
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags || "",
    });
  };

  const startCreate = () => {
    setSelectedNote(null);
    setIsCreating(true);
    setEditForm({ title: "", content: "", tags: "" });
  };

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 0px)" }}>
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 flex flex-col bg-gray-950 h-full">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">Notes</h1>
            <Button size="sm" onClick={startCreate} className="bg-purple-600 hover:bg-purple-700 border-0 h-7 w-7 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No notes yet</p>
              <Button variant="ghost" size="sm" className="text-purple-400 mt-1 text-xs" onClick={startCreate}>
                Create one
              </Button>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-all group ${
                  selectedNote?.id === note.id
                    ? "bg-purple-500/15 border border-purple-500/30"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{note.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5 text-gray-600" />
                      <span className="text-xs text-gray-600">{formatRelativeTime(note.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.split(",").map((tag, i) => (
                      <span key={i} className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col h-full bg-gray-950">
        {isCreating || selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Note title..."
                  className="text-lg font-semibold bg-transparent border-0 border-b border-white/10 rounded-none focus-visible:ring-0 px-0 text-white placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isCreating ? handleCreate : handleSave}
                  disabled={saving || !editForm.title.trim()}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />{isCreating ? "Create" : "Save"}</>
                  )}
                </Button>
                {selectedNote && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-500 hover:text-red-400"
                    onClick={() => handleDelete(selectedNote.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="px-6 py-2 border-b border-white/5 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <Input
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="Tags (comma-separated)"
                className="h-7 text-xs bg-transparent border-0 focus-visible:ring-0 px-0 text-gray-400"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Start writing your note..."
                className="h-full resize-none bg-transparent border-0 focus-visible:ring-0 text-gray-300 text-sm leading-relaxed p-0"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Select a note or create a new one</p>
              <Button variant="ghost" className="text-purple-400" onClick={startCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
