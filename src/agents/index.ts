// Agent Architecture for Zentric AI Growth Operating System
// This file defines the interfaces and base classes for all AI agents

export type AgentType =
  | "planner"
  | "study"
  | "coding"
  | "research"
  | "career"
  | "automation"
  | "orchestrator";

export type AgentStatus = "idle" | "running" | "completed" | "failed" | "paused";

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface AgentContext {
  userId: string;
  sessionId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentInput {
  task: string;
  context?: AgentContext;
  parameters?: Record<string, unknown>;
}

export interface AgentOutput {
  success: boolean;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  input?: unknown;
  output?: unknown;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentRun {
  id: string;
  agentType: AgentType;
  status: AgentStatus;
  input: AgentInput;
  output?: AgentOutput;
  steps: AgentStep[];
  startedAt: Date;
  completedAt?: Date;
}

// Base Agent Interface
export interface IAgent {
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  run(input: AgentInput): Promise<AgentOutput>;
  stop(): Promise<void>;
  getStatus(): AgentStatus;
}

// Abstract Base Agent
export abstract class BaseAgent implements IAgent {
  abstract type: AgentType;
  abstract name: string;
  abstract description: string;
  abstract capabilities: AgentCapability[];

  protected status: AgentStatus = "idle";

  getStatus(): AgentStatus {
    return this.status;
  }

  async stop(): Promise<void> {
    this.status = "paused";
  }

  abstract run(input: AgentInput): Promise<AgentOutput>;

  protected log(message: string): void {
    console.log(`[${this.type.toUpperCase()} AGENT] ${message}`);
  }
}

// ============================================================
// Planner Agent
// Helps break down goals into tasks and manage schedules
// ============================================================
export class PlannerAgent extends BaseAgent {
  type: AgentType = "planner";
  name = "Planner Agent";
  description =
    "Breaks down complex goals into actionable tasks, manages priorities, and optimizes schedules.";
  capabilities: AgentCapability[] = [
    {
      name: "task_breakdown",
      description: "Break a large goal into smaller, actionable tasks",
      parameters: { goal: "string", timeline: "string", priority: "string" },
    },
    {
      name: "schedule_optimization",
      description: "Optimize task schedule based on priorities and deadlines",
      parameters: { tasks: "Task[]", constraints: "string[]" },
    },
    {
      name: "deadline_management",
      description: "Track and manage upcoming deadlines",
      parameters: { userId: "string" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Starting task: ${input.task}`);

    // TODO: Implement with LangChain or custom logic
    // This would integrate with OpenAI to analyze the task,
    // create subtasks, and store them via the task API

    this.status = "completed";
    return {
      success: true,
      result: {
        message: "PlannerAgent: Task breakdown ready",
        // Future: return structured task list
      },
    };
  }
}

// ============================================================
// Study Agent
// Guides learning paths, tracks progress, and suggests resources
// ============================================================
export class StudyAgent extends BaseAgent {
  type: AgentType = "study";
  name = "Study Agent";
  description =
    "Creates personalized study plans, tracks DSA progress, and suggests learning resources.";
  capabilities: AgentCapability[] = [
    {
      name: "learning_path",
      description: "Generate a personalized learning path for a topic",
      parameters: { topic: "string", level: "beginner|intermediate|advanced", goal: "string" },
    },
    {
      name: "dsa_guidance",
      description: "Provide guidance on DSA topics and LeetCode problems",
      parameters: { topic: "string", difficulty: "easy|medium|hard" },
    },
    {
      name: "progress_analysis",
      description: "Analyze study progress and suggest next steps",
      parameters: { userId: "string" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Starting study task: ${input.task}`);

    // TODO: Implement with OpenAI + study topic API
    this.status = "completed";
    return {
      success: true,
      result: {
        message: "StudyAgent: Learning path generated",
      },
    };
  }
}

// ============================================================
// Coding Agent
// Helps with code review, debugging, and problem solving
// ============================================================
export class CodingAgent extends BaseAgent {
  type: AgentType = "coding";
  name = "Coding Agent";
  description =
    "Reviews code, debugs issues, explains algorithms, and helps solve programming problems.";
  capabilities: AgentCapability[] = [
    {
      name: "code_review",
      description: "Review code for bugs, efficiency, and best practices",
      parameters: { code: "string", language: "string" },
    },
    {
      name: "algorithm_explanation",
      description: "Explain algorithms and data structures with examples",
      parameters: { topic: "string", complexity: "string" },
    },
    {
      name: "problem_solving",
      description: "Help solve coding problems step by step",
      parameters: { problem: "string", approach: "string" },
    },
    {
      name: "code_generation",
      description: "Generate code snippets for specific tasks",
      parameters: { task: "string", language: "string", framework: "string" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Coding task: ${input.task}`);

    // TODO: Implement with OpenAI code analysis
    this.status = "completed";
    return {
      success: true,
      result: {
        message: "CodingAgent: Analysis complete",
      },
    };
  }
}

// ============================================================
// Research Agent
// Researches topics and summarizes information
// ============================================================
export class ResearchAgent extends BaseAgent {
  type: AgentType = "research";
  name = "Research Agent";
  description =
    "Researches technical topics, summarizes documentation, and finds relevant resources.";
  capabilities: AgentCapability[] = [
    {
      name: "topic_research",
      description: "Research a topic and provide a comprehensive summary",
      parameters: { topic: "string", depth: "surface|detailed|comprehensive" },
    },
    {
      name: "resource_discovery",
      description: "Find relevant learning resources for a topic",
      parameters: { topic: "string", type: "article|video|course|book" },
    },
    {
      name: "comparison",
      description: "Compare technologies, frameworks, or approaches",
      parameters: { items: "string[]", criteria: "string[]" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Research task: ${input.task}`);

    // TODO: Implement with web search + OpenAI summarization
    this.status = "completed";
    return {
      success: true,
      result: {
        message: "ResearchAgent: Research complete",
      },
    };
  }
}

// ============================================================
// Career Agent
// Helps with job search, resume building, and interview prep
// ============================================================
export class CareerAgent extends BaseAgent {
  type: AgentType = "career";
  name = "Career Agent";
  description =
    "Assists with job applications, resume optimization, interview preparation, and career growth strategies.";
  capabilities: AgentCapability[] = [
    {
      name: "resume_review",
      description: "Review and optimize resume for ATS and recruiter appeal",
      parameters: { resume: "string", targetRole: "string" },
    },
    {
      name: "interview_prep",
      description: "Generate mock interview questions and evaluate answers",
      parameters: { role: "string", company: "string", type: "technical|behavioral|system-design" },
    },
    {
      name: "job_matching",
      description: "Match user skills to job requirements",
      parameters: { skills: "string[]", targetRoles: "string[]" },
    },
    {
      name: "salary_guidance",
      description: "Provide salary negotiation strategies",
      parameters: { role: "string", experience: "string", location: "string" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Career task: ${input.task}`);

    // TODO: Implement with OpenAI career coaching prompts
    this.status = "completed";
    return {
      success: true,
      result: {
        message: "CareerAgent: Career guidance ready",
      },
    };
  }
}

// ============================================================
// Automation Agent
// Automates repetitive tasks and workflows
// ============================================================
export class AutomationAgent extends BaseAgent {
  type: AgentType = "automation";
  name = "Automation Agent";
  description =
    "Automates repetitive tasks like generating reports, scheduling reviews, and triggering workflows.";
  capabilities: AgentCapability[] = [
    {
      name: "daily_summary",
      description: "Generate daily productivity summary",
      parameters: { userId: "string", date: "string" },
    },
    {
      name: "schedule_review",
      description: "Schedule periodic goal and task reviews",
      parameters: { frequency: "daily|weekly|monthly", userId: "string" },
    },
    {
      name: "reminder",
      description: "Set intelligent reminders based on deadlines",
      parameters: { userId: "string" },
    },
  ];

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Automation task: ${input.task}`);

    // TODO: Implement with scheduled jobs (cron/Vercel Cron)
    this.status = "completed";
    return {
      success: true,
      result: {
        message: "AutomationAgent: Task automated",
      },
    };
  }
}

// ============================================================
// Orchestrator Agent
// Coordinates all other agents to handle complex multi-step tasks
// ============================================================
export class OrchestratorAgent extends BaseAgent {
  type: AgentType = "orchestrator";
  name = "Orchestrator Agent";
  description =
    "Coordinates multiple specialized agents to handle complex, multi-step tasks that require various capabilities.";
  capabilities: AgentCapability[] = [
    {
      name: "multi_agent_task",
      description: "Delegate complex tasks to appropriate specialized agents",
      parameters: { task: "string", context: "AgentContext" },
    },
    {
      name: "pipeline",
      description: "Run agents in sequence to complete a workflow",
      parameters: { agents: "AgentType[]", task: "string" },
    },
  ];

  private agents: Map<AgentType, IAgent> = new Map();

  constructor() {
    super();
    // Register all specialized agents
    this.registerAgent(new PlannerAgent());
    this.registerAgent(new StudyAgent());
    this.registerAgent(new CodingAgent());
    this.registerAgent(new ResearchAgent());
    this.registerAgent(new CareerAgent());
    this.registerAgent(new AutomationAgent());
  }

  registerAgent(agent: IAgent): void {
    this.agents.set(agent.type, agent);
    this.log(`Registered ${agent.name}`);
  }

  getAgent(type: AgentType): IAgent | undefined {
    return this.agents.get(type);
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    this.status = "running";
    this.log(`Orchestrating task: ${input.task}`);

    // TODO: Implement intelligent routing with OpenAI function calling
    // 1. Analyze the task with GPT
    // 2. Determine which agents to involve
    // 3. Run agents in appropriate order
    // 4. Aggregate and return results

    const results: AgentOutput[] = [];

    // Example: simple delegation (future: use AI to route)
    for (const agent of this.agents.values()) {
      this.log(`Delegating to ${agent.name}`);
      // In production, only run agents relevant to the task
    }

    this.status = "completed";
    return {
      success: true,
      result: {
        message: "Orchestrator: Task completed",
        agentResults: results,
      },
    };
  }
}

// Singleton orchestrator instance
export const orchestrator = new OrchestratorAgent();
