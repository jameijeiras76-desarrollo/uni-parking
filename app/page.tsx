import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow text-center">
          <img
            src="/logo.png"
            alt="Club Universitario"
            className="mx-auto mb-4 h-20"
          />

          <h1 className="text-2xl font-bold text-red-700">
            Uni Parking
          </h1>

          <p className="text-sm text-neutral-600 mt-2">
            Sistema de estacionamiento
          </p>
        </div>

        <Link
          href="/ingreso-cobrador"
          className="block w-full text-center bg-red-700 text-white font-semibold py-4 rounded-2xl"
        >
          Ingresar a Cobrar
        </Link>

        <Link
          href="/login"
          className="block w-full text-center border border-red-700 text-red-700 font-semibold py-4 rounded-2xl"
        >
          Ingresar Administrador
        </Link>
      </div>
    </main>
  );
}