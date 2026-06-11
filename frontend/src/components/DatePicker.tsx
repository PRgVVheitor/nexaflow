import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../lib/utils";
import { Button } from "./ui";

interface DatePickerProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function DatePicker({ label, onChange, value }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <div className="relative">
      <Button
        aria-expanded={open}
        aria-label={label}
        className="w-full justify-start font-normal"
        type="button"
        variant="secondary"
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className="text-emerald-300" size={16} />
        <span className={cn(!selected && "text-zinc-400")}>
          {selected ? format(selected, "dd/MM/yyyy") : "Selecionar data"}
        </span>
      </Button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[280px] rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-2xl shadow-black/50">
          <DayPicker
            classNames={{
              button_next: "grid size-8 place-items-center rounded-md text-zinc-300 hover:bg-zinc-800",
              button_previous: "grid size-8 place-items-center rounded-md text-zinc-300 hover:bg-zinc-800",
              caption_label: "text-sm font-semibold text-zinc-100",
              day: "p-0 text-center text-sm",
              day_button: "size-8 rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
              disabled: "opacity-30",
              month: "space-y-3",
              month_caption: "flex h-8 items-center justify-center",
              month_grid: "w-full border-collapse",
              nav: "absolute inset-x-2 top-2 flex justify-between",
              outside: "opacity-35",
              root: "relative",
              selected: "[&>button]:bg-emerald-400 [&>button]:font-bold [&>button]:text-zinc-950",
              today: "[&>button]:border [&>button]:border-emerald-400/60 [&>button]:text-emerald-300",
              week: "grid grid-cols-7",
              weekday: "py-1 text-center text-[11px] font-medium uppercase text-zinc-400",
              weekdays: "grid grid-cols-7",
            }}
            locale={ptBR}
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
          <div className="mt-2 flex justify-between border-t border-zinc-800 pt-2">
            <Button
              aria-label="Remover prazo"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
