"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Evento, eventosIniciales } from "../../data/eventos";

const STORAGE_KEY_EVENTOS = "uni-parking-eventos";
const STORAGE_KEY_COBRANZAS = "uni-parking-cobranzas";

type Cobranza = {
  cobrador: string;
  evento: string;
  tipoRegistro: string;
  medioPago: string;
  ticket: string;
  patente: string;
  comprobante: string;
  beneficiarioPaseLibre: string;
  monto: number;
  fechaHora: string;
};

type CobranzasPorEvento = Record<string, Cobranza[]>;

function formatearFecha(fechaISO: string) {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cobranzasPorEvento, setCobranzasPorEvento] = useState<CobranzasPorEvento>(
    {}
  );
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [mensajeCopiado, setMensajeCopiado] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => {
    const guardadosEventos = localStorage.getItem(STORAGE_KEY_EVENTOS);
    const guardadasCobranzas = localStorage.getItem(STORAGE_KEY_COBRANZAS);

    if (guardadosEventos) {
      const eventosParseados = JSON.parse(guardadosEventos);

      const eventosNormalizados = eventosParseados.map((evento: any) => ({
        ...evento,
        estado: evento.estado ?? "abierto",
      }));

      setEventos(eventosNormalizados);
    } else {
      setEventos(eventosIniciales);
      localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(eventosIniciales));
    }

    if (guardadasCobranzas) {
      setCobranzasPorEvento(JSON.parse(guardadasCobranzas));
    } else {
      setCobranzasPorEvento({});
    }
  }, []);

  const eventoActual = eventos.find(
    (evento) => evento.nombre === eventoSeleccionado
  );

  const cobranzas = eventoSeleccionado
    ? cobranzasPorEvento[eventoSeleccionado] ?? []
    : [];

  const resumen = useMemo(() => {
    const totalRegistros = cobranzas.length;

    const totalEfectivo = cobranzas.filter(
      (cobranza) => cobranza.medioPago === "Efectivo"
    ).length;

    const totalTransferencia = cobranzas.filter(
      (cobranza) => cobranza.medioPago === "Transferencia"
    ).length;

    const totalPaseLibre = cobranzas.filter(
      (cobranza) => cobranza.tipoRegistro === "Pase libre"
    ).length;

    const recaudado = cobranzas.reduce(
      (acc, cobranza) => acc + (Number(cobranza.monto) || 0),
      0
    );

    return {
      totalRegistros,
      totalEfectivo,
      totalTransferencia,
      totalPaseLibre,
      recaudado,
    };
  }, [cobranzas]);

  async function copiarCierre() {
    if (!eventoSeleccionado) return;

    const texto = `ACTA DE CIERRE

Evento: ${eventoSeleccionado}
Estado: ${eventoActual?.estado ?? "-"}

Total de registros: ${resumen.totalRegistros}
Cobranzas en efectivo: ${resumen.totalEfectivo}
Cobranzas por transferencia: ${resumen.totalTransferencia}
Pases libres: ${resumen.totalPaseLibre}

TOTAL RECAUDADO: $${resumen.recaudado}`;

    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado("Cierre copiado al portapapeles.");
      setTimeout(() => setMensajeCopiado(""), 2500);
    } catch {
      setMensajeCopiado("No se pudo copiar el cierre.");
      setTimeout(() => setMensajeCopiado(""), 2500);
    }
  }

  function cerrarEventoDesdeAuditoria() {
    if (!eventoSeleccionado) return;

    const confirmacion = window.confirm(
      `¿Seguro que querés cerrar el evento "${eventoSeleccionado}"?`
    );

    if (!confirmacion) return;

    const actualizados = eventos.map((evento) =>
      evento.nombre === eventoSeleccionado
        ? { ...evento, estado: "cerrado" as const }
        : evento
    );

    setEventos(actualizados);
    localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(actualizados));
    setMensajeAccion(`El evento "${eventoSeleccionado}" fue cerrado.`);
    setTimeout(() => setMensajeAccion(""), 2500);
  }

  function descargarHistorial() {
    const encabezados = [
      "Fecha",
      "Rival",
      "Evento",
      "Estado",
      "Recaudado Efectivo",
      "Recaudado Transferencia",
      "Pases Libres",
      "Total Recaudado",
    ];

    const filas = eventos.map((evento) => {
      const cobranzasEvento = cobranzasPorEvento[evento.nombre] ?? [];

      const recaudadoEfectivo = cobranzasEvento
        .filter((cobranza) => cobranza.medioPago === "Efectivo")
        .reduce((acc, cobranza) => acc + (Number(cobranza.monto) || 0), 0);

      const recaudadoTransferencia = cobranzasEvento
        .filter((cobranza) => cobranza.medioPago === "Transferencia")
        .reduce((acc, cobranza) => acc + (Number(cobranza.monto) || 0), 0);

      const pasesLibres = cobranzasEvento.filter(
        (cobranza) => cobranza.tipoRegistro === "Pase libre"
      ).length;

      const totalRecaudado = cobranzasEvento.reduce(
        (acc, cobranza) => acc + (Number(cobranza.monto) || 0),
        0
      );

      return [
        formatearFecha(evento.fecha),
        evento.rival,
        evento.nombre,
        evento.estado,
        recaudadoEfectivo,
        recaudadoTransferencia,
        pasesLibres,
        totalRecaudado,
      ];
    });

    const contenido = [
      encabezados.join(","),
      ...filas.map((fila) => fila.map((valor) => `"${valor}"`).join(",")),
    ].join("\n");

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "historial_eventos_uni_parking.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-5 text-neutral-900">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700">
            Club Universitario de Córdoba
          </div>
          <h1 className="text-3xl font-bold text-red-700">Auditoría</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Revisá la recaudación y el detalle de cada evento.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={descargarHistorial}
            className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
          >
            Descargar historial de todos los eventos
          </button>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Evento</label>
          <select
            value={eventoSeleccionado}
            onChange={(e) => {
              setEventoSeleccionado(e.target.value);
              setMensajeCopiado("");
              setMensajeAccion("");
            }}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          >
            <option value="">Seleccionar evento</option>
            {eventos.map((evento) => (
              <option key={evento.nombre} value={evento.nombre}>
                {evento.nombre}
              </option>
            ))}
          </select>
        </div>

        {eventoSeleccionado && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Estado
                </div>
                <div className="mt-1 text-base font-bold text-red-700">
                  {eventoActual?.estado ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Recaudado
                </div>
                <div className="mt-1 text-base font-bold text-red-700">
                  ${resumen.recaudado}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Registros
                </div>
                <div className="mt-1 text-base font-bold text-neutral-800">
                  {resumen.totalRegistros}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Pase libre
                </div>
                <div className="mt-1 text-base font-bold text-neutral-800">
                  {resumen.totalPaseLibre}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Efectivo
                </div>
                <div className="mt-1 text-base font-bold text-neutral-800">
                  {resumen.totalEfectivo}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Transferencia
                </div>
                <div className="mt-1 text-base font-bold text-neutral-800">
                  {resumen.totalTransferencia}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-red-700">
                  Cierre de caja del evento
                </h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copiarCierre}
                    className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Copiar cierre
                  </button>

                  <button
                    type="button"
                    onClick={cerrarEventoDesdeAuditoria}
                    disabled={eventoActual?.estado === "cerrado"}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      eventoActual?.estado === "cerrado"
                        ? "cursor-not-allowed border border-neutral-300 bg-white text-neutral-400"
                        : "border border-red-200 bg-white text-red-700"
                    }`}
                  >
                    Cerrar evento
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <strong>Evento:</strong> {eventoSeleccionado}
                </div>
                <div>
                  <strong>Estado:</strong> {eventoActual?.estado ?? "-"}
                </div>
                <div>
                  <strong>Total de registros:</strong> {resumen.totalRegistros}
                </div>
                <div>
                  <strong>Cobranzas en efectivo:</strong> {resumen.totalEfectivo}
                </div>
                <div>
                  <strong>Cobranzas por transferencia:</strong> {resumen.totalTransferencia}
                </div>
                <div>
                  <strong>Pases libres:</strong> {resumen.totalPaseLibre}
                </div>
                <div className="pt-2 text-base font-bold text-red-700">
                  <strong>Total recaudado:</strong> ${resumen.recaudado}
                </div>
              </div>

              {mensajeCopiado && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {mensajeCopiado}
                </div>
              )}

              {mensajeAccion && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {mensajeAccion}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-red-700">
                Registros del evento
              </h2>

              {cobranzas.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No hay registros para este evento.
                </p>
              ) : (
                <div className="space-y-3">
                  {cobranzas.map((cobranza, index) => (
                    <div
                      key={`${cobranza.ticket}-${index}-${cobranza.tipoRegistro}`}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <div className="text-sm">
                        <strong>Tipo:</strong> {cobranza.tipoRegistro}
                      </div>

                      <div className="text-sm">
                        <strong>Cobrador:</strong> {cobranza.cobrador}
                      </div>

                      <div className="text-sm">
                        <strong>Fecha y hora:</strong> {cobranza.fechaHora}
                      </div>

                      <div className="text-sm">
                        <strong>Medio de pago:</strong> {cobranza.medioPago}
                      </div>

                      <div className="text-sm">
                        <strong>Ticket:</strong> {cobranza.ticket}
                      </div>

                      {cobranza.tipoRegistro === "Pase libre" && (
                        <div className="text-sm">
                          <strong>Autorizado:</strong>{" "}
                          {cobranza.beneficiarioPaseLibre}
                        </div>
                      )}

                      <div className="text-sm">
                        <strong>Patente:</strong> {cobranza.patente}
                      </div>

                      <div className="text-sm">
                        <strong>Comprobante:</strong> {cobranza.comprobante}
                      </div>

                      <div className="text-sm">
                        <strong>Monto:</strong> ${cobranza.monto}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="text-sm font-medium text-red-700 underline"
            >
              Volver a admin
            </Link>

            <Link
              href="/"
              className="text-sm font-medium text-red-700 underline"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
