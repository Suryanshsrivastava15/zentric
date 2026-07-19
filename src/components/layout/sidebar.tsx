"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
  Settings,
  Braces,
  BriefcaseBusiness,
  GraduationCap,
  LogOut,
  Zap,
  Menu,
  X,
  Code2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planner", href: "/planner", icon: CheckSquare },
  { name: "Learning Mode", href: "/learning-mode", icon: GraduationCap },
  { name: "Study Tracker", href: "/study", icon: BookOpen },
  { name: "LeetCode", href: "/leetcode", icon: Code2 },
  { name: "Coding Hub", href: "/coding-hub", icon: Braces },
  { name: "Second Brain", href: "/notes", icon: FileText },
  { name: "Career Hub", href: "/career", icon: BriefcaseBusiness },
  { name: "AI Coach", href: "/ai-coach", icon: Sparkles },
  { name: "Ask Zentric", href: "/chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

type SidebarContentProps = {
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  closeMobile: () => void;
};

function SidebarContent({
  pathname,
  userName,
  userEmail,
  closeMobile,
}: SidebarContentProps) {
  const navGroups = [
    { label: "Workspace", items: navigation.slice(0, 7) },
    { label: "Growth", items: navigation.slice(7, 10) },
    { label: "Account", items: navigation.slice(10) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden border-b border-[#D9E3EE] px-6 py-5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#DCEBFA]" />
        <div className="relative flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#20364F]/10 bg-gradient-to-b from-[#315F8F] to-[#20364F] shadow-[0_12px_24px_rgba(39,76,119,0.18)]">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="block text-xl font-bold tracking-tight text-[#172033]">Zentric</span>
          <span className="block text-[11px] font-medium text-[#667085]">Growth workspace</span>
        </div>
        <span className="ml-auto rounded-full border border-[#D9E3EE] bg-[#FFFDF9]/80 px-2 py-0.5 text-xs font-medium text-[#667085] shadow-sm">
          beta
        </span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A98A8]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobile}
                      className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "zentric-soft-active"
                        : "text-[#667085] hover:bg-[#F7FAFD] hover:text-[#172033]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                        isActive ? "bg-gradient-to-b from-[#315F8F] to-[#20364F] text-white shadow-sm" : "bg-[#EEF3F8] text-[#8AA0B8] group-hover:bg-[#E5EEF8] group-hover:text-[#274C77]"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </span>
                    {item.name}
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#274C77]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#D9E3EE] bg-gradient-to-b from-transparent to-[#F7FAFD] p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#D9E3EE] bg-[#FFFDF9]/85 p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9E3EE] bg-[#EDF3FB] text-sm font-bold text-[#172033]">
            {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#172033] truncate">{userName || "User"}</p>
            <p className="text-xs text-[#667085] truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[#667085] hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-[#D9E3EE] bg-[#FFFDF9] p-2 text-[#172033] shadow-sm md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 transform border-r border-[#D9E3EE] bg-[#FFFDF9]/95 backdrop-blur-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          pathname={pathname}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          closeMobile={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-[#D9E3EE] bg-[#FFFDF9]/92 shadow-[18px_0_55px_rgba(33,62,92,0.07)] backdrop-blur-xl md:flex">
        <SidebarContent
          pathname={pathname}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          closeMobile={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
