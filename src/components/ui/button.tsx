import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#274C77]/15 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#20364F]/10 bg-gradient-to-b from-[#315F8F] to-[#20364F] text-white shadow-[0_14px_26px_rgba(39,76,119,0.18)] hover:-translate-y-0.5 hover:from-[#274C77] hover:to-[#172B40] active:translate-y-0",
        destructive:
          "border border-red-200 bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_14px_26px_rgba(185,28,28,0.16)] hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-[#CFDBE7] bg-[#FFFDF9]/90 text-[#314154] shadow-sm shadow-blue-100/50 hover:-translate-y-0.5 hover:border-[#AFC5DB] hover:bg-[#F4F8FC] hover:text-[#172033] active:translate-y-0",
        secondary:
          "border border-[#D9E3EE] bg-gradient-to-b from-[#F7FAFD] to-[#EAF2FA] text-[#314154] shadow-sm shadow-blue-100/50 hover:-translate-y-0.5 hover:from-[#EEF5FC] hover:to-[#E0EBF6] hover:text-[#172033] active:translate-y-0",
        ghost:
          "text-[#536578] hover:bg-[#EEF4FF] hover:text-[#172033]",
        link:
          "text-[#315F8F] underline-offset-4 hover:text-[#243F57] hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
