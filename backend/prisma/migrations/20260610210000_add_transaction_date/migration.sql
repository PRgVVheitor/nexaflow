-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Registros existentes assumem a data em que foram criados
UPDATE "Transaction" SET "date" = "createdAt"::date;

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
