import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./ui";

interface MetricCardProps {
  detail: string;
  icon: LucideIcon;
  index: number;
  title: string;
  tone: "emerald" | "sky" | "rose" | "amber";
  value: string;
}

export function MetricCard({ detail, icon: Icon, index, title, tone, value }: MetricCardProps) {
  const tones = {
    emerald: "bg-emerald-400/10 text-emerald-300",
    sky: "bg-sky-400/10 text-sky-300",
    rose: "bg-rose-400/10 text-rose-300",
    amber: "bg-amber-400/10 text-amber-300",
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className="mt-2 truncate text-2xl font-bold text-zinc-50">{value}</p>
            <p className="mt-1 text-xs text-zinc-400">{detail}</p>
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon size={19} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
