import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./ui";

interface TaskStatCardProps {
  detail: string;
  index: number;
  progress: number;
  title: string;
  tone: "amber" | "emerald" | "sky";
  value: number;
}

export function TaskStatCard({ detail, index, progress, title, tone, value }: TaskStatCardProps) {
  const tones = {
    amber: { color: "#fbbf24", text: "text-amber-300" },
    emerald: { color: "#34d399", text: "text-emerald-300" },
    sky: { color: "#60a5fa", text: "text-sky-300" },
  };
  const selectedTone = tones[tone];
  const roundedProgress = Math.round(progress);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className={cn("mt-1 text-4xl font-bold", selectedTone.text)}>{value}</p>
            <p className="mt-1 text-xs text-zinc-400">{detail}</p>
          </div>
          <div
            aria-label={`${roundedProgress}% ${title.toLowerCase()}`}
            className="relative grid size-16 shrink-0 place-items-center rounded-full"
            role="img"
            style={{
              background: `conic-gradient(${selectedTone.color} ${roundedProgress}%, #27272a 0)`,
            }}
          >
            <div className="absolute inset-[6px] rounded-full bg-zinc-900" />
            <span className="relative text-xs font-bold text-zinc-200">{roundedProgress}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
