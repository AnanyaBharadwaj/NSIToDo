import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Avoid creating new instances during hot-reload in dev
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"], 
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
