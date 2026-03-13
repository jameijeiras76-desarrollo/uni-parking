"use client";

import { useEffect, useState } from "react";
import { Evento, Estamento, eventosIniciales } from "../data/eventos";

const STORAGE = "uni-parking-eventos";

function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function AdminPage() {
  const [fecha, setFecha] = useState("");
  const [rival, setRival] = useState("");
  const [lugar, setLugar] = useState("");
  const [estamento, setEstamento] = useState<Estamento>("PS Masculino");
  const [precio, setPrecio] = useState("");

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const data = localStorage.getItem(STORAGE);

    if (data) {
      const eventosParseados = JSON.parse(data);

      const eventosNormalizados = eventosParseados.map((evento: any) => ({
        ...evento,
        estado: evento.estado ?? "abierto",
      }));

      setEventos(eventosNormalizados);
      localStorage.setItem(STORAGE, JSON.stringify(eventosNormalizados));
    } else {
      setEventos(eventosIniciales);
      localStorage.setItem(STORAGE, JSON.stringify(eventosIniciales));
    }
  }, []);

  function guardarEventos(lista: Evento[]) {
    setEventos(lista);
    localStorage.setItem(STORAGE, JSON.stringify(lista));
  }

  function crearEvento() {
    setMensaje("");

    if (!fecha.trim()) {
      setMensaje("Tenés que ingresar la fecha.");
      return;
    }

    if (!rival.trim()) {
      setMensaje("Tenés que ingresar el rival.");
      return;
    }

    if (!lugar.trim()) {
      setMensaje("Tenés que ingresar el lugar.");
      return;
    }

    if (!precio.trim()) {
      setMensaje("Tenés que ingresar el precio.");
      return;
    }

    const precioNumero = Number(precio);

    if (isNaN(precioNumero) || precioNumero <= 0) {
      setMensaje("El precio tiene que ser un número mayor a 0.");
      return;
    }

    const nombre = `CUC vs ${rival.trim()} - ${formatearFecha(
      fecha
    )} - ${estamento} - ${lugar.trim()}`;

    const yaExiste = eventos.some(
      (evento) => evento.nombre.trim().toLowerCase() === nombre.toLowerCase()
    );

    if (yaExiste) {
      setMensaje("Ya existe un evento con ese nombre.");
      return;
    }

    const nuevoEvento: Evento = {
      nombre,
      precio: precioNumero,
      estado: "abierto",
      fecha,
      rival: rival.trim(),
      lugar: lugar.trim(),
      estamento,
    };

    const nuevosEventos = [nuevoEvento, ...eventos];
    guardarEventos(nuevosEventos);

    setFecha("");
    setRival("");
    setLugar("");
    setEstamento("PS Masculino");
    setPrecio("");
    setMensaje("Evento creado correctamente.");
  }

  function cerrarEvento(nombreEvento: string) {
    const actualizados = eventos.map((evento) =>
      evento.nombre === nombreEvento
        ? { ...evento, estado: "cerrado" as const }
        : evento
    );

    guardarEventos(actualizados);
    setMensaje(`El evento "${nombreEvento}" fue cerrado.`);
  }

  function eliminarEvento(nombreEvento: string) {
    const confirmacion = window.confirm(
      `¿Seguro que querés eliminar el evento "${nombreEvento}"?`
    );

    if (!confirmacion) return;

    const actualizados = eventos.filter((evento) => evento.nombre !== nombreEvento);
    guardarEventos(actualizados);
    setMensaje(`El evento "${nombreEvento}" fue eliminado.`);
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">Administración</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Configurá los eventos y el valor del estacionamiento.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setMensaje("");
            }}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Lugar</label>
          <input
            type="text"
            value={lugar}
            onChange={(e) => {
              setLugar(e.target.value);
              setMensaje("");
            }}
            placeholder="Ej: La Lomita"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Rival</label>
          <input
            type="text"
            value={rival}
            onChange={(e) => {
              setRival(e.target.value);
              setMensaje("");
            }}
            placeholder="Ej: Tala"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Estamento</label>
          <select
            value={estamento}
            onChange={(e) => {
              setEstamento(e.target.value as Estamento);
              setMensaje("");
            }}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          >
            <option value="Infantiles">Infantiles</option>
            <option value="Juveniles">Juveniles</option>
            <option value="PS Masculino">PS Masculino</option>
            <option value="PS Femenino">PS Femenino</option>
          </select>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Precio del estacionamiento
          </label>
          <input
            type="number"
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              setMensaje("");
            }}
            placeholder="Ej: 3000"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={crearEvento}
          className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
        >
          Crear evento
        </button>

        {mensaje && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
            {mensaje}
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Eventos cargados
          </h2>

          {eventos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no hay eventos cargados.
            </p>
          ) : (
            <div className="space-y-3">
              {eventos.map((evento, index) => (
                <div
                  key={`${evento.nombre}-${index}`}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="text-sm">
                    <strong>Evento:</strong> {evento.nombre}
                  </div>
                  <div className="text-sm">
                    <strong>Precio:</strong> ${evento.precio}
                  </div>
                  <div className="text-sm">
                    <strong>Estado:</strong> {evento.estado}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => cerrarEvento(evento.nombre)}
                      disabled={evento.estado === "cerrado"}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                        evento.estado === "cerrado"
                          ? "cursor-not-allowed border border-neutral-200 text-neutral-400"
                          : "border border-red-200 text-red-700"
                      }`}
                    >
                      Cerrar
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarEvento(evento.nombre)}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}