import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority, StudyStatus } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "high":
      return "text-red-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
}

export function getPriorityBgColor(priority: Priority): string {
  switch (priority) {
    case "high":
      return "bg-red-400/10 border-red-400/20";
    case "medium":
      return "bg-yellow-400/10 border-yellow-400/20";
    case "low":
      return "bg-green-400/10 border-green-400/20";
    default:
      return "bg-gray-400/10 border-gray-400/20";
  }
}

export function getStatusColor(status: StudyStatus): string {
  switch (status) {
    case "completed":
      return "text-green-400 bg-green-400/10";
    case "in_progress":
      return "text-blue-400 bg-blue-400/10";
    case "not_started":
      return "text-gray-400 bg-gray-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function isValidPriority(value: unknown): value is Priority {
  return value === "low" || value === "medium" || value === "high";
}

export function isValidStatus(value: unknown): value is StudyStatus {
  return value === "not_started" || value === "in_progress" || value === "completed";
}

