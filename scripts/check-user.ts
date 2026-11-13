import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [email, password] = process.argv.slice(2);
const db = new PrismaClient();

(async () => {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return console.log("❌ No user with this email in the database.");
  console.log("✅ User found. status:", user.status, "| role:", user.role, "| has password:", Boolean(user.passwordHash));
  if (user.passwordHash) console.log("Password matches:", await bcrypt.compare(password, user.passwordHash));
})()
  .catch((e) => console.log("❌ Database error:", e.message))
  .finally(() => db.$disconnect());
