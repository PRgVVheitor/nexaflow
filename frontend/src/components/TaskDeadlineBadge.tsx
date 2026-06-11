import { CalendarDays } from "lucide-react";
import { taskDeadline, type DeadlineTask } from "../lib/dates";
import { Badge } from "./ui";

export function TaskDeadlineBadge({ task }: { task: DeadlineTask }) {
  const deadline = taskDeadline(task);

  return (
    <Badge className="gap-1 normal-case" variant={deadline.variant}>
      <CalendarDays size={12} />
      {deadline.label}
    </Badge>
  );
}
