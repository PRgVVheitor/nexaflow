import { currency, capitalize } from "../lib/format";
import { cn } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";

export function ChartCard({ actions, children, contentClassName, description, title }) {
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

export function MonthDot({ cx, cy, onSelect, payload, selected }) {
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

export function WaveTooltip({ active, metricLabel, payload }) {
  if (!active || !payload?.length) return null;
  const month = payload[0].payload;

  return (
    <div className="min-w-52 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">{metricLabel}</p>
      <div className="mt-2 grid gap-2 text-xs">
        <TooltipRow
          color="#34d399"
          label={capitalize(month.fullLabel)}
          value={month.current}
        />
        <TooltipRow
          color="#71717a"
          label={capitalize(month.previousFullLabel)}
          value={month.previous}
        />
      </div>
    </div>
  );
}

export function ComparisonTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold capitalize text-zinc-100">{label}</p>
      <div className="mt-2 grid gap-1.5 text-xs">
        {payload.map((item) => (
          <TooltipRow
            color={item.color}
            key={item.dataKey}
            label={item.dataKey}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const category = payload[0].payload;

  return (
    <div className="min-w-44 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">{category.name}</p>
      <p className="mt-1 text-sm font-bold text-emerald-300">{currency.format(category.value)}</p>
    </div>
  );
}

export function TooltipRow({ color, label, value }) {
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
