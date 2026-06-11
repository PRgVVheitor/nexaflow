import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Columns3,
  List,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "../components/DatePicker";
import { EmptyState } from "../components/EmptyState";
import { FieldError } from "../components/FieldError";
import { KanbanBoard } from "../components/KanbanBoard";
import { PageHeading } from "../components/PageHeading";
import { TaskDeadlineBadge } from "../components/TaskDeadlineBadge";
import { TaskStatCard } from "../components/TaskStatCard";
import { TaskListSkeleton, TaskStatSkeleton } from "../components/skeletons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "../components/ui";
import { api } from "../lib/api";
import { taskMatchesDeadline } from "../lib/dates";
import { displayPriority, priorityVariant } from "../lib/format";
import { queryKeys } from "../lib/query";
import { taskFormSchema, type TaskFormValues } from "../lib/schemas";
import type { Task, TaskPriority } from "../lib/types";
import { cn } from "../lib/utils";

interface EditingTask {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
}

export function TasksApp() {
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const queryClient = useQueryClient();
  const {
    control: taskControl,
    formState: { errors: taskErrors, isSubmitting: taskSubmitting },
    handleSubmit: handleTaskSubmit,
    register: registerTask,
    reset: resetTask,
  } = useForm<TaskFormValues>({
    defaultValues: { dueDate: "", priority: "media", title: "" },
    resolver: zodResolver(taskFormSchema),
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => api<Task[]>("/api/tasks"),
  });
  const tasks = tasksQuery.data ?? [];
  const loading = tasksQuery.isPending;

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues) =>
      api<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ ...data, dueDate: data.dueDate || null }),
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (current = []) => [created, ...current]);
    },
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (current = []) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
    },
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (current = []) =>
        current.filter((task) => task.id !== id),
      );
    },
  });

  const deadlineTasks = tasks.filter((task) => taskMatchesDeadline(task, deadlineFilter));
  const visibleTasks = deadlineTasks.filter((task) => {
    const matchesStatus =
      filter === "pending" ? !task.done : filter === "done" ? task.done : true;
    return matchesStatus;
  });

  const counters = {
    total: tasks.length,
    pending: tasks.filter((task) => !task.done).length,
    done: tasks.filter((task) => task.done).length,
  };

  async function createTask(data: TaskFormValues) {
    try {
      await createTaskMutation.mutateAsync(data);
      resetTask({ dueDate: "", priority: "media", title: "" });
      toast.success("Tarefa adicionada.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Erro na API.");
    }
  }

  async function toggleTask(task: Task) {
    try {
      const updated = await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { done: !task.done },
      });
      toast.success(updated.done ? "Tarefa concluída." : "Tarefa reaberta.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Erro na API.");
    }
  }

  function startEditingTask(task: Task) {
    setEditingTask({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
  }

  async function saveTask(event: React.FormEvent) {
    event.preventDefault();
    if (!editingTask) return;
    const result = taskFormSchema.safeParse(editingTask);
    if (!result.success) {
      toast.error(result.error.issues[0]!.message);
      return;
    }
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data: {
          title: result.data.title,
          priority: result.data.priority,
          dueDate: result.data.dueDate || null,
        },
      });
      setEditingTask(null);
      toast.success("Tarefa atualizada.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Erro na API.");
    }
  }

  async function deleteTask(id: string) {
    try {
      await deleteTaskMutation.mutateAsync(id);
      if (editingTask?.id === id) setEditingTask(null);
      toast.success("Tarefa removida.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Erro na API.");
    }
  }

  function editFromBoard(task: Task) {
    startEditingTask(task);
    setViewMode("list");
  }

  return (
    <div className="space-y-5">
      <PageHeading
        description="Capture tarefas, defina prazos e acompanhe o que precisa de atenção."
        eyebrow="Organizador de tarefas"
        title="Taskly"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => <TaskStatSkeleton key={index} />)
        ) : (
          <>
            <TaskStatCard
              detail="Progresso geral"
              index={0}
              progress={counters.total ? (counters.done / counters.total) * 100 : 0}
              title="Total"
              tone="sky"
              value={counters.total}
            />
            <TaskStatCard
              detail="Aguardando ação"
              index={1}
              progress={counters.total ? (counters.pending / counters.total) * 100 : 0}
              title="Pendentes"
              tone="amber"
              value={counters.pending}
            />
            <TaskStatCard
              detail="Progresso registrado"
              index={2}
              progress={counters.total ? (counters.done / counters.total) * 100 : 0}
              title="Concluídas"
              tone="emerald"
              value={counters.done}
            />
          </>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Nova tarefa</CardTitle>
            <CardDescription>Adicione o próximo item da sua rotina.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" noValidate onSubmit={handleTaskSubmit(createTask)}>
              <Input
                aria-label="Título da tarefa"
                aria-invalid={Boolean(taskErrors.title)}
                className={cn(taskErrors.title && "border-red-400 focus:border-red-400")}
                placeholder="Título da tarefa"
                {...registerTask("title")}
              />
              <FieldError error={taskErrors.title} />
              <Select aria-label="Prioridade da tarefa" {...registerTask("priority")}>
                <option value="alta">Prioridade alta</option>
                <option value="media">Prioridade média</option>
                <option value="baixa">Prioridade baixa</option>
              </Select>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-400">
                Prazo opcional
                <Controller
                  control={taskControl}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePicker
                      label="Prazo da tarefa"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </label>
              <Button disabled={taskSubmitting} type="submit">
                {taskSubmitting ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
                Adicionar tarefa
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 border-b border-zinc-800 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Minhas tarefas</CardTitle>
              <CardDescription>
                {viewMode === "board" ? deadlineTasks.length : visibleTasks.length} itens neste filtro
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewMode === "list" && (
                <div className="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-1">
                {(
                  [
                    ["all", "Todas"],
                    ["pending", "Pendentes"],
                    ["done", "Concluídas"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    className={cn(filter === id && "bg-zinc-700 text-zinc-50")}
                    key={id}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </Button>
                ))}
                </div>
              )}
              <Select
                aria-label="Filtrar por prazo"
                className="w-full sm:w-44"
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value)}
              >
                <option value="all">Todos os prazos</option>
                <option value="overdue">Atrasadas</option>
                <option value="today">Vencem hoje</option>
                <option value="upcoming">Próximas</option>
                <option value="none">Sem prazo</option>
              </Select>
              <div
                aria-label="Visualização das tarefas"
                className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-1"
                role="group"
              >
                <Button
                  aria-label="Ver tarefas em lista"
                  aria-pressed={viewMode === "list"}
                  className={cn(viewMode === "list" && "bg-zinc-700 text-zinc-50")}
                  size="icon"
                  title="Lista"
                  type="button"
                  variant="ghost"
                  onClick={() => setViewMode("list")}
                >
                  <List size={17} />
                </Button>
                <Button
                  aria-label="Ver tarefas em quadro Kanban"
                  aria-pressed={viewMode === "board"}
                  className={cn(viewMode === "board" && "bg-zinc-700 text-zinc-50")}
                  size="icon"
                  title="Kanban"
                  type="button"
                  variant="ghost"
                  onClick={() => setViewMode("board")}
                >
                  <Columns3 size={17} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading && <TaskListSkeleton />}
            {!loading && viewMode === "list" && !visibleTasks.length && (
              <EmptyState text="Nenhuma tarefa encontrada neste filtro." />
            )}
            {viewMode === "list" ? (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleTasks.map((task) => (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                      task.done && "opacity-60",
                    )}
                    exit={{ opacity: 0, x: 20 }}
                    initial={{ opacity: 0, y: 8 }}
                    key={task.id}
                    layout
                  >
                    <Button
                      aria-label="Alternar tarefa"
                      className={cn(task.done && "bg-emerald-400 text-zinc-950")}
                      size="icon"
                      type="button"
                      variant="secondary"
                      onClick={() => toggleTask(task)}
                    >
                      <CheckCircle2 size={17} />
                    </Button>
                    {editingTask?.id === task.id ? (
                      <form
                        className="grid min-w-0 gap-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_135px_150px_auto]"
                        onSubmit={saveTask}
                      >
                        <Input
                          aria-label="Editar título da tarefa"
                          required
                          value={editingTask.title}
                          onChange={(event) =>
                            setEditingTask((current) =>
                              current ? { ...current, title: event.target.value } : current,
                            )
                          }
                        />
                        <Select
                          aria-label="Editar prioridade da tarefa"
                          value={editingTask.priority}
                          onChange={(event) =>
                            setEditingTask((current) =>
                              current
                                ? { ...current, priority: event.target.value as TaskPriority }
                                : current,
                            )
                          }
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Média</option>
                          <option value="baixa">Baixa</option>
                        </Select>
                        <DatePicker
                          label="Editar prazo da tarefa"
                          value={editingTask.dueDate}
                          onChange={(value) =>
                            setEditingTask((current) =>
                              current ? { ...current, dueDate: value } : current,
                            )
                          }
                        />
                        <div className="flex justify-end gap-1">
                          <Button aria-label="Salvar tarefa" size="icon" type="submit">
                            <Save size={16} />
                          </Button>
                          <Button
                            aria-label="Cancelar edição"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingTask(null)}
                          >
                            <X size={17} />
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold text-zinc-100",
                            task.done && "text-zinc-500 line-through",
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant={priorityVariant(task.priority)}>
                            {displayPriority(task.priority)}
                          </Badge>
                          <TaskDeadlineBadge task={task} />
                        </div>
                      </div>
                    )}
                    {editingTask?.id !== task.id && (
                      <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
                          <Button
                            aria-label="Editar tarefa"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => startEditingTask(task)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            aria-label="Remover tarefa"
                            size="icon"
                            type="button"
                            variant="destructive"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                      </div>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
            ) : (
              <KanbanBoard
                tasks={deadlineTasks}
                onDelete={deleteTask}
                onEdit={editFromBoard}
                onToggle={toggleTask}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
