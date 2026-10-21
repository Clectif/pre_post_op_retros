import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const FIELD =
  "w-full rounded-[13px] border border-line bg-field p-3 text-sm text-ink select-text transition-[border-color,box-shadow] duration-150 " +
  "focus:border-accent focus:bg-panel focus:ring-3 focus:ring-accent/15 focus:outline-none";

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, "min-h-[86px] resize-none short:min-h-14", className)} {...props} />;
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={cn(FIELD, className)} {...props} />;
}
