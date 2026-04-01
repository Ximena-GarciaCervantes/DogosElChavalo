import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@dogoselchavalo.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin1234!";
  const name = process.env.ADMIN_NAME || "Administrador";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  console.log(`Admin listo: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
