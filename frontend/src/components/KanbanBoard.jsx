import { motion } from "framer-motion";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { displayPriority, priorityVariant } from "../lib/format";
import { cn } from "../lib/utils";
import { EmptyState } from "./EmptyState";
import { TaskDeadlineBadge } from "./TaskDeadlineBadge";
import { Badge, Button } from "./ui";

export function KanbanBoard({ onDelete, onEdit, onToggle, tasks }) {
  const columns = [
    {
      id: "pending",
      title: "Pendentes",
      description: "Itens que ainda precisam de ação",
      tasks: tasks.filter((task) => !task.done),
      tone: "text-amber-300",
    },
    {
      id: "done",
      title: "Concluídas",
      description: "Itens finalizados no seu fluxo",
      tasks: tasks.filter((task) => task.done),
      tone: "text-emerald-300",
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {columns.map((column) => (
        <section
          className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/30 p-3"
          key={column.id}
        >
          <div className="mb-3 flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className={cn("text-sm font-semibold", column.tone)}>{column.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{column.description}</p>
            </div>
            <Badge variant="neutral">{column.tasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {!column.tasks.length && <EmptyState text={`Nenhuma tarefa em ${column.title.toLowerCase()}.`} />}
            {column.tasks.map((task) => (
              <motion.article
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3"
                key={task.id}
                layout
              >
                <p className={cn("text-sm font-semibold text-zinc-100", task.done && "line-through text-zinc-500")}>
                  {task.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={priorityVariant(task.priority)}>
                    {displayPriority(task.priority)}
                  </Badge>
                  <TaskDeadlineBadge task={task} />
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-zinc-800 pt-3">
                  <Button
                    aria-label={task.done ? "Reabrir tarefa" : "Concluir tarefa"}
                    size="icon"
                    title={task.done ? "Reabrir" : "Concluir"}
                    type="button"
                    variant="secondary"
                    onClick={() => onToggle(task)}
                  >
                    <CheckCircle2 size={16} />
                  </Button>
                  <Button
                    aria-label="Editar tarefa no Kanban"
                    size="icon"
                    title="Editar"
                    type="button"
                    variant="ghost"
                    onClick={() => onEdit(task)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    aria-label="Remover tarefa do Kanban"
                    size="icon"
                    title="Remover"
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
