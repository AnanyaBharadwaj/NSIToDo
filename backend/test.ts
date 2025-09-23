import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: { name: "Alice", email: "alice@example.com", password: "hashedpassword" }
  });
  console.log("Created user:", user);
  const users = await prisma.user.findMany();
  console.log("All users:", users);
}
main().finally(()=>prisma.$disconnect());
