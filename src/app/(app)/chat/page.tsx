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
    "Help me plan my study schedule for DSA",
    "Explain the two-pointer technique with examples",
    "Review my approach to solving binary search problems",
    "Give me a mock interview question for a software engineer role",
    "What should I focus on to prepare for a Google interview?",
    "Help me improve my productivity and task management",
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-64 border-r border-white/10 flex flex-col bg-gray-950 flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <Button
            onClick={createConversation}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
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
                <Button onClick={createConversation} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
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
                    ? "bg-purple-500/15 border border-purple-500/30"
                    : "hover:bg-white/5"
                }`}
                onClick={() => loadConversation(conv)}
              >
                <MessageSquare className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-600">{formatRelativeTime(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversation ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Zentric AI Assistant</h2>
              <p className="text-gray-400 text-sm mb-8">
                Your personal AI for coding, learning, and career growth
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      await createConversation();
                      setInput(prompt);
                    }}
                    className="p-3 rounded-xl bg-white/3 border border-white/8 text-left text-xs text-gray-400 hover:bg-white/8 hover:text-white hover:border-purple-500/30 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <Button
                onClick={createConversation}
                className="bg-gradient-to-r from-purple-600 to-blue-600 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a Conversation
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b border-white/10 px-6 py-3 flex items-center gap-3">
              <Bot className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-white truncate">
                {activeConversation.title}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  Start the conversation by sending a message
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`group max-w-[80%] relative ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-2xl rounded-tr-sm px-4 py-3"
                          : "bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ children, className, ...rest }) {
                                const isBlock = className?.includes("language-");
                                return isBlock ? (
                                  <pre className="bg-gray-900 rounded-lg p-3 overflow-x-auto border border-white/10 my-2">
                                    <code className={`${className} text-xs text-green-300`} {...rest}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-xs" {...rest}>
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
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-white/10 rounded-full p-1"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="max-w-[80%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-1 h-4 bg-purple-400 animate-pulse ml-1" />
                  </div>
                </div>
              )}

              {sending && !streamingMessage && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Zentric AI... (Enter to send, Shift+Enter for new line)"
                    className="resize-none min-h-[52px] max-h-32 pr-12 text-sm"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 h-[52px] px-4 flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
