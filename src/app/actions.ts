"use server";

import { PaymentMethod, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearSession, createSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createProductSchema = z.object({
  name: z.string().trim().min(2, "Nombre demasiado corto"),
  description: z.string().trim().max(240).optional(),
  price: z.coerce.number().positive("Precio invalido"),
  stock: z.coerce.number().int().min(0, "Stock invalido"),
});

const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Nombre demasiado corto"),
  description: z.string().trim().max(240).optional(),
  price: z.coerce.number().positive("Precio invalido"),
  stock: z.coerce.number().int().min(0, "Stock invalido"),
  active: z.enum(["true", "false"]),
});

const registerSaleSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
  note: z.string().trim().max(180).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Correo invalido"),
  password: z.string().min(6, "Contrasena invalida"),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user || !user.active) {
    redirect("/login?error=invalid");
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    redirect("/login?error=invalid");
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
  });

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/pos");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function createProduct(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "No se pudo crear producto");
  }

  const { name, description, price, stock } = parsed.data;

  await prisma.product.create({
    data: {
      name,
      description,
      price: new Prisma.Decimal(price.toFixed(2)),
      stock,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/pos");
}

export async function updateProduct(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "No se pudo actualizar producto");
  }

  const { id, name, description, price, stock, active } = parsed.data;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price: new Prisma.Decimal(price.toFixed(2)),
      stock,
      active: active === "true",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/pos");
}

export async function registerSale(formData: FormData) {
  const session = await getSession();

  if (!session) {
    throw new Error("No autorizado");
  }

  const parsed = registerSaleSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    paymentMethod: formData.get("paymentMethod"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "No se pudo registrar venta");
  }

  const { productId, quantity, paymentMethod, note } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product || !product.active) {
      throw new Error("Producto no disponible");
    }

    if (product.stock < quantity) {
      throw new Error("No hay stock suficiente");
    }

    const unitPrice = product.price;
    const subtotal = unitPrice.mul(quantity);

    const sale = await tx.sale.create({
      data: {
        total: subtotal,
        paymentMethod: paymentMethod as PaymentMethod,
        note,
        userId: session.userId,
      },
    });

    await tx.saleItem.create({
      data: {
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice,
        subtotal,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    await tx.cashMovement.create({
      data: {
        type: "SALE",
        amount: subtotal,
        note: `Venta ${sale.id.slice(-6)} - ${product.name}`,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/pos");
}
