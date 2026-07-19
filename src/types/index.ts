// Core application types for Zentric

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";
export type StudyStatus = "not_started" | "in_progress" | "completed";
export type StudyCategory = "DSA" | "System Design" | "LeetCode" | "Frontend" | "Backend" | "DevOps" | "Other";
export type StudyDifficulty = "easy" | "medium" | "hard";
export type MessageRole = "user" | "assistant" | "system";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  deadline?: Date | string | null;
  completed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
}

export interface StudyTopic {
  id: string;
  name: string;
  category: string;
  status: StudyStatus;
  notes?: string | null;
  difficulty: StudyDifficulty;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date | string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  openaiApiKey?: string | null;
  displayName?: string | null;
  bio?: string | null;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalNotes: number;
  totalStudyTopics: number;
  completedStudyTopics: number;
  totalGoals: number;
  productivityScore: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean;
}

// NextAuth Session Types
export interface Session {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
  expires: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  status: number;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string;
  category?: string;
}

export type UpdateNoteInput = Partial<CreateNoteInput>;

export interface CreateStudyTopicInput {
  name: string;
  category: string;
  difficulty: StudyDifficulty;
  notes?: string;
}

export interface UpdateStudyTopicInput extends Partial<CreateStudyTopicInput> {
  status?: StudyStatus;
}

export interface CreateGoalInput {
  title: string;
  target?: number;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  progress?: number;
}
