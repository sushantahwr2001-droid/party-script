import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition placeholder:text-textMuted focus:border-accent",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-textMuted focus:border-accent",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">{children}</label>;
}
