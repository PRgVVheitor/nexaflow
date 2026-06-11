import { cn } from "../lib/utils";

export function BrandMark({ className }) {
  return (
    <img
      alt="Logo NexaFlow"
      className={cn("size-10 shrink-0 rounded-lg", className)}
      src="/nexaflow-mark.svg"
    />
  );
}
