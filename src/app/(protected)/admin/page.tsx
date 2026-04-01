import { createProduct, updateProduct } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatMoney(value: number) {
  return currency.format(value);
}

const loadInventory = () => prisma.product.findMany({ orderBy: { createdAt: "desc" } });

const loadAdminSales = () =>
  prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: true },
  });

const loadDailyTotal = (startOfDay: Date) =>
  prisma.sale.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfDay } } });

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  if (!session || session.role !== "ADMIN") {
    return null;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let products: Awaited<ReturnType<typeof loadInventory>> = [];
  let sales: Awaited<ReturnType<typeof loadAdminSales>> = [];
  let todayTotal = 0;

  try {
    const [inventory, salesRows, dailyTotal] = await Promise.all([
      loadInventory(),
      loadAdminSales(),
      loadDailyTotal(startOfDay),
    ]);

    products = inventory;
    sales = salesRows;
    todayTotal = Number(dailyTotal._sum?.total ?? 0);
  } catch {
    // Render fallback when DB is temporarily unavailable.
  }

  const totalStock = products.reduce((acc, item) => acc + item.stock, 0);
  const lowStock = products.filter((item) => item.stock <= 5 && item.active).length;
  const editingProduct = params.edit ? products.find((item) => item.id === params.edit) : undefined;

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Perfil Admin</p>
        <h1 className="headline text-5xl text-[var(--primary-strong)]">Dashboard de Ventas</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
            <p className="text-xs uppercase tracking-wider text-stone-400">Ingresos hoy</p>
            <p className="mt-1 text-2xl font-bold text-[var(--primary-strong)]">{formatMoney(todayTotal)}</p>
          </article>
          <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
            <p className="text-xs uppercase tracking-wider text-stone-400">Unidades en inventario</p>
            <p className="mt-1 text-2xl font-bold text-[var(--primary-strong)]">{totalStock}</p>
          </article>
          <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
            <p className="text-xs uppercase tracking-wider text-stone-400">Productos con stock bajo</p>
            <p className="mt-1 text-2xl font-bold text-[var(--primary-strong)]">{lowStock}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="panel p-5">
          <h2 className="headline text-3xl text-[var(--primary)]">Inventario</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[44%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-stone-400">
                  <th className="px-2 pb-2">Producto</th>
                  <th className="px-2 pb-2">Descripcion</th>
                  <th className="px-2 pb-2">Precio</th>
                  <th className="px-2 pb-2">Stock</th>
                  <th className="px-2 pb-2">Estado</th>
                  <th className="px-2 pb-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-[var(--line)]/60">
                    <td className="px-2 py-2 align-top font-semibold text-stone-100">{product.name}</td>
                    <td className="px-2 py-2 align-top text-stone-300">{product.description ?? "-"}</td>
                    <td className="px-2 py-2 align-top">{formatMoney(Number(product.price))}</td>
                    <td className="px-2 py-2 align-top">{product.stock}</td>
                    <td className="px-2 py-2 align-top">
                      {product.active ? (
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-300">Activo</span>
                      ) : (
                        <span className="rounded-full bg-stone-700/40 px-2 py-1 text-xs font-semibold text-stone-200">Inactivo</span>
                      )}
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <Link
                        href={`/admin?edit=${product.id}`}
                        className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-[var(--primary)] hover:text-[var(--primary-strong)]"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-stone-400">
                      Aun no hay productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="grid gap-6">
          <div className="panel p-5">
            <h2 className="headline text-3xl text-[var(--primary)]">
              {editingProduct ? "Editar Producto" : "Agregar Producto"}
            </h2>

            {editingProduct ? (
              <form action={updateProduct} className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={editingProduct.id} />

                <label className="grid gap-1 text-sm font-semibold text-stone-300">
                  Nombre
                  <input
                    name="name"
                    type="text"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                    defaultValue={editingProduct.name}
                    required
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold text-stone-300">
                  Descripcion
                  <textarea
                    name="description"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                    defaultValue={editingProduct.description ?? ""}
                    rows={3}
                    maxLength={240}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold text-stone-300">
                    Precio
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                      defaultValue={Number(editingProduct.price)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-300">
                    Stock
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                      defaultValue={editingProduct.stock}
                      required
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm font-semibold text-stone-300">
                  Estado
                  <select
                    name="active"
                    defaultValue={editingProduct.active ? "true" : "false"}
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
                  >
                    Guardar cambios
                  </button>
                  <Link
                    href="/admin"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 font-semibold text-stone-200"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            ) : (
              <form action={createProduct} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-semibold text-stone-300">
                Nombre
                <input
                  name="name"
                  type="text"
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                  placeholder="Dogo especial"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-stone-300">
                Descripcion
                <textarea
                  name="description"
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                  placeholder="Salchicha de res con frijol y queso"
                  rows={3}
                  maxLength={240}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-stone-300">
                  Precio
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-300">
                  Stock inicial
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-stone-900 transition hover:brightness-95"
              >
                Guardar en menu
              </button>
              </form>
            )}
          </div>

          <div className="panel p-5">
            <h2 className="headline text-3xl text-[var(--primary)]">Ultimas Ventas</h2>
            <div className="mt-3 grid gap-2">
              {sales.map((sale) => (
                <article key={sale.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <p className="font-bold text-stone-100">Venta #{sale.id.slice(-6)}</p>
                    <p className="font-semibold text-green-700">{formatMoney(Number(sale.total))}</p>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {sale.user.name} | {new Date(sale.createdAt).toLocaleString("es-MX")}
                  </p>
                </article>
              ))}
              {sales.length === 0 && <p className="text-sm text-stone-400">Sin ventas registradas.</p>}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
