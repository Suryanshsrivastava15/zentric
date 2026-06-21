"use client";

import { Bot, Zap, BookOpen, Code2, Search, Briefcase, Cpu, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const agents = [
  {
    type: "orchestrator",
    name: "Orchestrator Agent",
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-500/20",
    description: "Coordinates all specialized agents to handle complex multi-step tasks",
    capabilities: ["Task routing", "Multi-agent coordination", "Workflow automation"],
    status: "architecture",
  },
  {
    type: "planner",
    name: "Planner Agent",
    icon: Bot,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-500/20",
    description: "Breaks down goals into tasks, manages priorities, optimizes schedules",
    capabilities: ["Goal decomposition", "Task prioritization", "Schedule optimization"],
    status: "architecture",
  },
  {
    type: "study",
    name: "Study Agent",
    icon: BookOpen,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-500/20",
    description: "Creates learning paths, tracks DSA progress, suggests study resources",
    capabilities: ["Learning paths", "DSA guidance", "Progress analysis"],
    status: "architecture",
  },
  {
    type: "coding",
    name: "Coding Agent",
    icon: Code2,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-500/20",
    description: "Reviews code, debugs issues, explains algorithms, solves problems",
    capabilities: ["Code review", "Algorithm explanation", "Problem solving"],
    status: "architecture",
  },
  {
    type: "research",
    name: "Research Agent",
    icon: Search,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/20",
    description: "Researches topics, summarizes documentation, discovers resources",
    capabilities: ["Topic research", "Resource discovery", "Tech comparison"],
    status: "architecture",
  },
  {
    type: "career",
    name: "Career Agent",
    icon: Briefcase,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-500/20",
    description: "Resume review, interview prep, job matching, career growth",
    capabilities: ["Resume review", "Interview prep", "Salary guidance"],
    status: "architecture",
  },
  {
    type: "automation",
    name: "Automation Agent",
    icon: Cpu,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-500/20",
    description: "Automates repetitive tasks, generates reports, triggers workflows",
    capabilities: ["Daily summaries", "Scheduled reviews", "Smart reminders"],
    status: "architecture",
  },
];

export default function AgentsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Specialized AI agents that coordinate to supercharge your productivity
        </p>
      </div>

      {/* Architecture Banner */}
      <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-semibold mb-1">Agent Architecture Ready</h2>
            <p className="text-gray-400 text-sm mb-3">
              The complete agent infrastructure is built and ready for activation. Each agent has
              defined capabilities, interfaces, and can be connected to OpenAI function calling
              to enable real autonomous task execution.
            </p>
            <div className="flex items-center gap-3">
              <Badge variant="default">7 Agents Defined</Badge>
              <Badge variant="secondary">Orchestrator Pattern</Badge>
              <Badge variant="secondary">TypeScript Interfaces</Badge>
            </div>
          </div>
          <Link href="/chat">
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 flex-shrink-0">
              Try AI Chat
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.type} className={`border ${agent.border} hover:scale-[1.01] transition-transform`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${agent.bg}`}>
                  <agent.icon className={`w-5 h-5 ${agent.color}`} />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-white/20 text-gray-500"
                >
                  {agent.type === "orchestrator" ? "Core" : "Specialist"}
                </Badge>
              </div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {agent.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className={`text-xs px-2 py-1 rounded-md ${agent.bg} ${agent.color} border ${agent.border}`}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-400">Architecture Ready</span>
                </div>
                <span className="text-xs text-gray-600">Coming Soon</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">How the Agent System Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "You give a task",
              desc: "Describe what you want to accomplish in natural language",
              color: "purple",
            },
            {
              step: "2",
              title: "Orchestrator routes",
              desc: "The Orchestrator analyzes and delegates to the right specialized agents",
              color: "blue",
            },
            {
              step: "3",
              title: "Agents execute",
              desc: "Specialized agents work autonomously and return structured results",
              color: "green",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-xl bg-white/3 border border-white/8"
            >
              <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center font-bold text-sm mb-3`}>
                {item.step}
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
