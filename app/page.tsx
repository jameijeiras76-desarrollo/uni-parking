import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src="/logo.png"
                alt="Club Universitario de Córdoba"
                className="h-24 w-24 object-contain"
              />
            </div>

            <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
              Club Universitario de Córdoba
            </div>

            <h1 className="text-4xl font-bold text-red-700">Uni Parking</h1>

            <p className="mt-3 text-sm text-neutral-600">
              Sistema de cobro de estacionamiento
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/cobrar"
              className="block w-full rounded-2xl bg-red-700 px-4 py-4 text-center text-base font-semibold text-white"
            >
              Ingresar a Cobrar
            </Link>

            <Link
              href="/login"
              className="block w-full rounded-2xl border border-red-200 px-4 py-4 text-center text-base font-semibold text-red-700"
            >
              Ingresar Administrador
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
