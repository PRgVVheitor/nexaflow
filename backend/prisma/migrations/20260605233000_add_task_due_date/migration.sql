ALTER TABLE "Task" ADD COLUMN "dueDate" DATE;

CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
