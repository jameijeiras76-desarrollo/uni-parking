"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  function ingresar() {
    setMensajeError("");

    if (usuario === "admin" && password === "admin123") {
      localStorage.setItem(
        "uni-parking-sesion",
        JSON.stringify({
          rol: "admin",
        })
      );

      router.push("/admin");
      return;
    }

    setMensajeError("Usuario o contraseña incorrectos.");
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-6 text-neutral-900">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-red-700">Ingreso Administrador</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Acceso a administración y auditoría
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => {
              setUsuario(e.target.value);
              setMensajeError("");
            }}
            placeholder="Usuario"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMensajeError("");
            }}
            placeholder="Contraseña"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={ingresar}
          className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
        >
          Ingresar
        </button>

        {mensajeError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            {mensajeError}
          </div>
        )}
      </div>
    </main>
  );
}
