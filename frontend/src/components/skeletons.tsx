import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui";

export function LoadingLabel() {
  return (
    <p className="flex items-center gap-2 p-5 text-sm text-zinc-400">
      <Loader2 className="animate-spin" size={17} />
      Carregando API...
    </p>
  );
}

export function MetricSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex animate-pulse items-start justify-between gap-4 p-4">
        <div className="w-full">
          <div className="h-4 w-24 rounded bg-zinc-800" />
          <div className="mt-3 h-7 w-36 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-28 rounded bg-zinc-800/70" />
        </div>
        <div className="size-10 shrink-0 rounded-lg bg-zinc-800" />
      </CardContent>
    </Card>
  );
}

export function TaskStatSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex animate-pulse items-center justify-between gap-4 p-4">
        <div className="w-full">
          <div className="h-4 w-20 rounded bg-zinc-800" />
          <div className="mt-2 h-10 w-14 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-28 rounded bg-zinc-800/70" />
        </div>
        <div className="size-16 shrink-0 rounded-full border-[6px] border-zinc-800" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ variant = "chart" }: { variant?: "chart" | "horizontal-bars" }) {
  if (variant === "horizontal-bars") {
    return (
      <div className="flex h-full animate-pulse flex-col justify-center gap-4 px-5">
        {[82, 64, 48, 34].map((width) => (
          <div className="flex items-center gap-3" key={width}>
            <div className="h-3 w-20 rounded bg-zinc-800/70" />
            <div className="h-6 rounded bg-zinc-800" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full animate-pulse items-end gap-3 border-b border-l border-zinc-800 p-5">
      {[45, 72, 38, 88, 60, 76].map((height, index) => (
        <div
          className="flex-1 rounded-t bg-zinc-800"
          key={index}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div aria-label="Carregando transações" className="animate-pulse p-5">
      <div className="mb-4 h-4 w-40 rounded bg-zinc-800" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="grid grid-cols-[1.4fr_1fr_1fr_100px] gap-3" key={index}>
            <div className="h-9 rounded bg-zinc-800/80" />
            <div className="h-9 rounded bg-zinc-800/60" />
            <div className="h-9 rounded bg-zinc-800/60" />
            <div className="h-9 rounded bg-zinc-800/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div aria-label="Carregando tarefas" className="animate-pulse space-y-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 rounded-lg border border-zinc-800 p-3"
          key={index}
        >
          <div className="size-10 rounded-md bg-zinc-800" />
          <div>
            <div className="h-4 w-2/3 rounded bg-zinc-800" />
            <div className="mt-2 h-5 w-20 rounded-full bg-zinc-800/70" />
          </div>
          <div className="size-10 rounded-md bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
