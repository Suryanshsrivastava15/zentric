"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useZentricContext, setUseZentricContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const fetchConversations = async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let cancelled = false;

    fetch("/api/conversations")
      .then((response) => response.json())
      .then(async (data) => {
        if (cancelled) return;

        const conversationList: Conversation[] = Array.isArray(data) ? data : [];
        setConversations(conversationList);

        const conversationId = new URLSearchParams(window.location.search).get("conversation");
        const selectedConversation = conversationList.find(
          (conversation) => conversation.id === conversationId,
        );
        if (!selectedConversation) return;

        const response = await fetch(`/api/conversations/${selectedConversation.id}`);
        const selectedData = await response.json();
        if (cancelled) return;

        setActiveConversation(selectedConversation);
        setMessages(selectedData.messages || []);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setLoadingMessages(true);
    const res = await fetch(`/api/conversations/${conv.id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingMessages(false);
  };

  const createConversation = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    });
    const conv = await res.json();
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setStreamingMessage("");

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          message: userMessage,
          useZentricContext,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        // Fallback (no streaming)
        const data = await res.json();
        const assistantMsg: Message = {
          id: `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: data.content,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            accumulated += chunk;
            setStreamingMessage(accumulated);
          }

          const finalMsg: Message = {
            id: `temp-assistant-${Date.now()}`,
            role: "assistant",
            content: accumulated,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, finalMsg]);
          setStreamingMessage("");
        }
      }

      // Update conversation title
      await fetchConversations();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    "Explain a difficult topic in simple words",
    "Explain the two-pointer technique with examples",
    "Review my approach to solving binary search problems",
    "Give me a mock interview question for a software engineer role",
    "Help me write a cleaner project explanation",
    "Debug this code and explain the issue",
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Conversation List Sidebar */}
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-[#D9E3EE] bg-[#FFFDF9]/90">
        <div className="border-b border-[#D9E3EE] p-4">
          <Button
            onClick={createConversation}
            className="zentric-primary-action w-full border-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No chats yet"
              description="Start a focused conversation with Ask Zentric. Your previous coaching, interview, and study chats will stay here."
              className="p-4"
              action={
                <Button onClick={createConversation} size="sm" className="zentric-primary-action text-white">
                  <Plus className="h-4 w-4" />
                  Start chat
                </Button>
              }
            />
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                  activeConversation?.id === conv.id
                    ? "border border-[#B8CCE2] bg-[#EDF3FB] shadow-sm"
                    : "hover:bg-[#F4F8FC]"
                }`}
                onClick={() => loadConversation(conv)}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#8A98A8]" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-[#172033]">{conv.title}</p>
                  <p className="text-xs text-[#667085]">{formatRelativeTime(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="rounded p-1 text-[#98A2B3] opacity-0 group-hover:opacity-100 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!activeConversation ? (
          /* Welcome Screen */
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-lg w-full text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#274C77] shadow-lg shadow-blue-100">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#172033]">Ask Zentric</h2>
              <p className="mb-8 text-sm text-[#667085]">
                Ask anything like a normal chatbot. Your AI Coach context stays off unless you turn it on.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      await createConversation();
                      setInput(prompt);
                    }}
                    className="rounded-xl border border-[#D9E3EE] bg-[#FFFDF9] p-3 text-left text-xs text-[#536578] shadow-sm shadow-blue-100/40 transition-all hover:-translate-y-0.5 hover:border-[#B8CCE2] hover:bg-[#F4F8FC] hover:text-[#172033]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <Button
                onClick={createConversation}
                className="zentric-primary-action border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a Conversation
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#D9E3EE] bg-[#FFFDF9]/70 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                <Bot className="w-5 h-5 flex-shrink-0 text-[#274C77]" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[#172033]">
                    {activeConversation.title}
                  </span>
                  <span className="block truncate text-xs text-[#667085]">
                    {useZentricContext
                      ? "Goal-aware mode is on for your next replies."
                      : "Independent chat mode. AI Coach context is off."}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUseZentricContext((current) => !current)}
                className={`flex w-full max-w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all sm:w-fit ${
                  useZentricContext
                    ? "border-[#8BA9C6] bg-[#EDF3FB] text-[#172033] shadow-sm shadow-blue-100"
                    : "border-[#D9E3EE] bg-[#FFFDF9] text-[#536578] hover:border-[#B8CCE2] hover:bg-[#F4F8FC]"
                }`}
                aria-pressed={useZentricContext}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">Use my </span>Zentric context
                  </span>
                </span>
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    useZentricContext ? "bg-[#274C77]" : "bg-[#C9D6E3]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      useZentricContext ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#667085]">
                  Start a normal chat. Turn on Zentric context only when you want a goal-aware answer.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#274C77]">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`group max-w-[80%] relative ${
                        msg.role === "user"
                          ? "rounded-2xl rounded-tr-sm bg-[#274C77] px-4 py-3 text-white shadow-sm"
                          : "rounded-2xl rounded-tl-sm border border-[#D9E3EE] bg-[#FFFDF9] px-4 py-3 shadow-sm shadow-blue-100/40"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-[#314154]">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ children, className, ...rest }) {
                                const isBlock = className?.includes("language-");
                                return isBlock ? (
                                  <pre className="my-2 overflow-x-auto rounded-lg border border-[#D9E3EE] bg-[#172033] p-3">
                                    <code className={`${className} text-xs text-emerald-100`} {...rest}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="rounded bg-[#EDF3FB] px-1.5 py-0.5 text-xs text-[#274C77]" {...rest}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-white">{msg.content}</p>
                      )}
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="absolute -right-2 -top-2 rounded-full border border-[#D9E3EE] bg-[#FFFDF9] p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#667085]" />
                        )}
                      </button>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#D9E3EE] bg-[#EDF3FB]">
                        <User className="w-3.5 h-3.5 text-[#536578]" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#274C77]">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-[#D9E3EE] bg-[#FFFDF9] px-4 py-3 shadow-sm shadow-blue-100/40">
                    <div className="prose prose-sm max-w-none text-[#314154]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-[#274C77]" />
                  </div>
                </div>
              )}

              {sending && !streamingMessage && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#274C77]">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[#D9E3EE] bg-[#FFFDF9] px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#274C77]" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#274C77]" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#274C77]" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#D9E3EE] bg-[#FFFDF9]/70 p-4">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Zentric anything... (Enter to send, Shift+Enter for new line)"
                    className="resize-none min-h-[52px] max-h-32 pr-12 text-sm"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="zentric-primary-action h-[52px] flex-shrink-0 border-0 px-4"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-[#667085]">
                {useZentricContext
                  ? "Goal context is on. Ask Zentric may use your AI Coach data for this chat."
                  : "Independent mode is on. Ask Zentric will not use your AI Coach data."}{" "}
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
