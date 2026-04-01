import { registerSale } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatMoney(value: number) {
  return currency.format(value);
}

const loadCatalog = () =>
  prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 20 });

const loadCashierSales = (userId: string) =>
  prisma.sale.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
      },
    },
    take: 6,
  });

export default async function PosPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  let products: Awaited<ReturnType<typeof loadCatalog>> = [];
  let recentSales: Awaited<ReturnType<typeof loadCashierSales>> = [];

  try {
    const [catalog, rows] = await Promise.all([
      loadCatalog(),
      loadCashierSales(session.userId),
    ]);

    products = catalog;
    recentSales = rows;
  } catch {
    // Render fallback when DB is temporarily unavailable.
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Punto de Venta</p>
        <h1 className="headline text-5xl text-[var(--primary-strong)]">Caja Rapida</h1>
        <p className="mt-2 text-sm text-stone-300">Usuario: {session.name}</p>

        <form action={registerSale} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-stone-300">
            Producto
            <select
              name="productId"
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
              required
            >
              <option value="">Selecciona un producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.description ? ` (${product.description})` : ""} - {formatMoney(Number(product.price))} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-stone-300">
              Cantidad
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-stone-300">
              Metodo de pago
              <select
                name="paymentMethod"
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                defaultValue="CASH"
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-stone-300">
            Nota opcional
            <input
              name="note"
              type="text"
              maxLength={180}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
              placeholder="Ej: sin tomate"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            Cobrar venta
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="headline text-3xl text-[var(--primary)]">Mis Ventas Recientes</h2>
        <div className="mt-4 grid gap-3">
          {recentSales.map((sale) => (
            <article key={sale.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <p className="font-bold text-stone-100">Venta #{sale.id.slice(-6)}</p>
                <p className="font-semibold text-green-700">{formatMoney(Number(sale.total))}</p>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">
                {sale.paymentMethod} | {new Date(sale.createdAt).toLocaleString("es-MX")}
              </p>
              <ul className="mt-1 text-sm text-stone-300">
                {sale.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product.name} - {formatMoney(Number(item.subtotal))}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {recentSales.length === 0 && <p className="text-sm text-stone-400">Sin ventas registradas hoy.</p>}
        </div>
      </section>
    </div>
  );
}
