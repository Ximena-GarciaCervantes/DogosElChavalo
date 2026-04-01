import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const menuItems = [
  {
    name: "El Chavalo",
    description: "Salchicha de res acompanado de frijoles, queso amarillo y cebolla caramelizada",
    price: 95,
    stock: 60,
  },
  {
    name: "El Chavalito",
    description: "Salchicha de pavo con trozos de tocino, frijoles, queso amarillo y cebolla caramelizada",
    price: 80,
    stock: 60,
  },
  {
    name: "Refresco",
    description: "Refresco individual",
    price: 28,
    stock: 120,
  },
];

async function main() {
  for (const item of menuItems) {
    await prisma.product.upsert({
      where: { name: item.name },
      update: {
        description: item.description,
        price: new Prisma.Decimal(item.price.toFixed(2)),
        active: true,
      },
      create: {
        name: item.name,
        description: item.description,
        price: new Prisma.Decimal(item.price.toFixed(2)),
        stock: item.stock,
        active: true,
      },
    });
  }

  console.log("Menu inicial cargado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
