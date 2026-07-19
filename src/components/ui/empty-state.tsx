import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#D6E4F5] bg-[#F8FBFF] p-8 text-center shadow-sm shadow-blue-100/60",
        className,
      )}
    >
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D6E4F5] bg-[#EEF4FF]">
        <Icon className="h-7 w-7 text-blue-600" />
      </div>
      <h3 className="relative text-lg font-semibold text-[#172033]">{title}</h3>
      <p className="relative mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">{description}</p>
      {(action || secondary) && (
        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}
