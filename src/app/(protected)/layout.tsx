import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <div className="hero-bg min-h-screen">
      <header className="border-b border-[var(--line)] bg-black/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <Image src="/brand/mascota.png" alt="Mascota" width={48} height={48} className="h-12 w-12" />
            <div>
              <p className="headline text-3xl leading-none text-[var(--primary-strong)]">DogosElChavalo</p>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{session?.name ?? "Usuario"}</p>
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                  vercel ready
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {session?.role === "ADMIN" && (
              <>
                <Link className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-semibold text-stone-200" href="/admin">
                  Dashboard
                </Link>
                <Link className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-semibold text-stone-200" href="/pos">
                  POS
                </Link>
              </>
            )}
            {session?.role === "CASHIER" && (
              <Link className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-semibold text-stone-200" href="/pos">
                Punto de Venta
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
