import { cn } from "@/lib/utils";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-3 font-body text-[0.9rem] font-semibold rounded-lg cursor-pointer transition-[background-color,border-color,color,transform] duration-200 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed",
          {
            "bg-gold text-paper hover:bg-gold-bright": variant === "gold",
            "bg-transparent text-ink border border-rule hover:border-graphite hover:bg-sheet": variant === "ghost",
            "bg-transparent text-gold-bright border border-gold/50 hover:border-gold": variant === "outline",
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
