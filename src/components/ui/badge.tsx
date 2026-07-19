import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#2F526F] text-white border-[#2F526F]",
    secondary: "bg-[#E8F1FB] text-[#536578] border-[#CFE0F2]",
    destructive: "bg-red-50 text-red-700 border-red-200",
    outline: "border border-[#D6E4F5] text-[#536578] bg-[#FFFDF9]",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[-0.01em] transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
