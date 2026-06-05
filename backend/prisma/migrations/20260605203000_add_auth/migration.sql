CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

INSERT INTO "User" ("id", "name", "email", "passwordHash")
VALUES (
    'demo-user',
    'Usuario Demo',
    'demo@nexaflow.app',
    '$2b$12$e50j2K20bBhoqV.HEggqjOSloG71R1YNVhEwnQl8cgoTjshfTLrPa'
);

ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;
ALTER TABLE "Task" ADD COLUMN "userId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "userId" TEXT;

UPDATE "Transaction" SET "userId" = 'demo-user';
UPDATE "Task" SET "userId" = 'demo-user';
UPDATE "Lead" SET "userId" = 'demo-user';

ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");
CREATE INDEX "Task_userId_createdAt_idx" ON "Task"("userId", "createdAt");
CREATE INDEX "Lead_userId_createdAt_idx" ON "Lead"("userId", "createdAt");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
