import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[72px] w-full rounded-2xl border border-[#CFDBE7] bg-[#FFFDF9]/95 px-3.5 py-3 text-sm text-[#172033] shadow-sm shadow-blue-100/40 transition-all placeholder:text-slate-400 focus-visible:border-[#8BA9C6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#274C77]/10 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
