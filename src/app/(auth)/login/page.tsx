import Image from "next/image";
import { login } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <main className="auth-shell min-h-screen p-4 md:p-8">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl md:grid-cols-[1.3fr_1fr]">
        <article className="relative hidden min-h-[620px] overflow-hidden md:block">
          <Image
            src="/brand/mascota-bg.jpg"
            alt="Mascota DogosElChavalo"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-black/70" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
            <p className="text-sm uppercase tracking-[0.2em]">DogosElChavalo</p>
            <h1 className="headline mt-2 text-6xl leading-none">Punto de Venta</h1>
            <p className="mt-3 max-w-sm text-sm text-white/90">
              Controla ventas, inventario y tu menu en una sola plataforma para tu puesto.
            </p>
          </div>
        </article>

        <article className="flex min-h-[620px] flex-col justify-center bg-[var(--surface)] p-6 md:p-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/brand/mascota.png"
                alt="Logo DogosElChavalo"
                width={72}
                height={72}
                className="h-16 w-16 object-contain"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Acceso Seguro</p>
                <h2 className="headline text-4xl text-[var(--primary-strong)]">Bienvenido</h2>
              </div>
            </div>

            {hasError && (
                <p className="mb-4 rounded-lg border border-red-500/50 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                Credenciales invalidas. Revisa correo y contrasena.
              </p>
            )}

            <form action={login} className="grid gap-3">
              <label className="grid gap-1 text-sm font-semibold text-stone-300">
                Correo
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                  placeholder="admin@dogoselchavalo.com"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-stone-300">
                Contrasena
                <input
                  name="password"
                  type="password"
                  required
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2"
                  placeholder="********"
                />
              </label>

              <button
                type="submit"
                className="mt-1 rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
              >
                Entrar al sistema
              </button>
            </form>

            <p className="mt-4 text-xs text-stone-400">
              Si aun no tienes usuario, crea primero el admin con el comando de bootstrap.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
