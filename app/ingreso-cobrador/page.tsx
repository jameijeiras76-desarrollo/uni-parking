"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_COBRADOR = "uni-parking-cobrador";

export default function IngresoCobradorPage() {
  const router = useRouter();

  const [dni, setDni] = useState("");
  const [nombreApellido, setNombreApellido] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  function continuar() {
    setMensajeError("");

    if (!dni.trim()) {
      setMensajeError("Tenés que ingresar el DNI.");
      return;
    }

    if (!nombreApellido.trim()) {
      setMensajeError("Tenés que ingresar nombre y apellido.");
      return;
    }

    localStorage.setItem(
      STORAGE_COBRADOR,
      JSON.stringify({
        dni: dni.trim(),
        nombreApellido: nombreApellido.trim(),
      })
    );

    router.push("/cobrar");
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-6 text-neutral-900">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-red-700">Ingreso del cobrador</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Completá tus datos antes de comenzar a cobrar
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">DNI</label>
          <input
            type="text"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value);
              setMensajeError("");
            }}
            placeholder="Ej: 27123456"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Nombre y apellido
          </label>
          <input
            type="text"
            value={nombreApellido}
            onChange={(e) => {
              setNombreApellido(e.target.value);
              setMensajeError("");
            }}
            placeholder="Ej: Juan Gomez"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={continuar}
          className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
        >
          Continuar a Cobrar
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