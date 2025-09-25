/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `Todo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Todo" DROP CONSTRAINT "Todo_assigneeId_fkey";

-- AlterTable
ALTER TABLE "public"."Todo" DROP COLUMN "assigneeId",
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."TodoAssignee" (
    "id" SERIAL NOT NULL,
    "todoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "TodoAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "todoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TodoAssignee_todoId_userId_key" ON "public"."TodoAssignee"("todoId", "userId");

-- AddForeignKey
ALTER TABLE "public"."TodoAssignee" ADD CONSTRAINT "TodoAssignee_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "public"."Todo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TodoAssignee" ADD CONSTRAINT "TodoAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "public"."Todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
