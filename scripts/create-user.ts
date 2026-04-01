import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.USER_EMAIL?.toLowerCase().trim();
  const password = process.env.USER_PASSWORD;
  const name = process.env.USER_NAME || "Cajero";
  const roleInput = process.env.USER_ROLE || "CASHIER";

  if (!email || !password) {
    throw new Error("Define USER_EMAIL y USER_PASSWORD en variables de entorno");
  }

  if (password.length < 8) {
    throw new Error("USER_PASSWORD debe tener al menos 8 caracteres");
  }

  const role = roleInput === "ADMIN" ? UserRole.ADMIN : UserRole.CASHIER;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      passwordHash,
      role,
      active: true,
    },
    update: {
      name,
      passwordHash,
      role,
      active: true,
    },
  });

  console.log(`Usuario listo: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
