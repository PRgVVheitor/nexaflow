import type { ReactNode } from "react";
import { currency, capitalize } from "../lib/format";
import { cn } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";

interface ChartCardProps {
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  description: string;
  title: string;
}

export function ChartCard({ actions, children, contentClassName, description, title }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className={cn(actions && "gap-4 lg:flex-row lg:items-end lg:justify-between")}>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent className={cn("h-72", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

interface MonthPoint {
  key: string;
  fullLabel: string;
  previousFullLabel?: string;
  current?: number;
  previous?: number;
}

interface MonthDotProps {
  cx?: number;
  cy?: number;
  onSelect: (key: string) => void;
  payload?: MonthPoint;
  selected: boolean;
}

export function MonthDot({ cx, cy, onSelect, payload, selected }: MonthDotProps) {
  if (!payload) return null;
  return (
    <circle
      aria-label={`Selecionar ${payload.fullLabel}`}
      className="cursor-pointer"
      cx={cx}
      cy={cy}
      fill={selected ? "#a7f3d0" : "#34d399"}
      r={selected ? 6 : 4}
      role="button"
      stroke="#09090b"
      strokeWidth={selected ? 3 : 2}
      tabIndex={0}
      onClick={() => onSelect(payload.key)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(payload.key);
      }}
    />
  );
}

interface TooltipEntry<T> {
  color?: string;
  dataKey?: string | number;
  value?: number;
  payload: T;
}

interface WaveTooltipProps {
  active?: boolean;
  metricLabel: string;
  payload?: TooltipEntry<MonthPoint>[];
}

export function WaveTooltip({ active, metricLabel, payload }: WaveTooltipProps) {
  if (!active || !payload?.length) return null;
  const month = payload[0]!.payload;

  return (
    <div className="min-w-52 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">{metricLabel}</p>
      <div className="mt-2 grid gap-2 text-xs">
        <TooltipRow
          color="#34d399"
          label={capitalize(month.fullLabel)}
          value={month.current ?? 0}
        />
        <TooltipRow
          color="#71717a"
          label={capitalize(month.previousFullLabel ?? "")}
          value={month.previous ?? 0}
        />
      </div>
    </div>
  );
}

export interface MonthComparisonPoint {
  day: number;
  current?: number;
  previous?: number;
}

interface MonthComparisonTooltipProps {
  active?: boolean;
  currentLabel: string;
  payload?: TooltipEntry<MonthComparisonPoint>[];
  previousLabel: string;
}

export function MonthComparisonTooltip({
  active,
  currentLabel,
  payload,
  previousLabel,
}: MonthComparisonTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;

  return (
    <div className="min-w-52 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">Dia {point.day}</p>
      <div className="mt-2 grid gap-2 text-xs">
        {point.current !== undefined && (
          <TooltipRow color="#34d399" label={currentLabel} value={point.current} />
        )}
        {point.previous !== undefined && (
          <TooltipRow color="#71717a" label={previousLabel} value={point.previous} />
        )}
      </div>
      <p className="mt-2 border-t border-zinc-800 pt-2 text-[11px] text-zinc-400">
        Saldo acumulado do mês até o dia
      </p>
    </div>
  );
}

interface CategoryBarTooltipProps {
  active?: boolean;
  payload?: TooltipEntry<{ name: string; value: number }>[];
}

export function CategoryBarTooltip({ active, payload }: CategoryBarTooltipProps) {
  if (!active || !payload?.length) return null;
  const category = payload[0]!.payload;

  return (
    <div className="min-w-44 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">{category.name}</p>
      <p className="mt-1 text-sm font-bold text-emerald-300">{currency.format(category.value)}</p>
    </div>
  );
}

interface TooltipRowProps {
  color: string;
  label: string;
  value: number;
}

export function TooltipRow({ color, label, value }: TooltipRowProps) {
  return (
    <div className="flex items-center justify-between gap-5 text-zinc-400">
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <strong className="font-semibold text-zinc-200">{currency.format(value)}</strong>
    </div>
  );
}
