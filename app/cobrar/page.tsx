"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Evento, eventosIniciales } from "../data/eventos";

const STORAGE_KEY_EVENTOS = "uni-parking-eventos";
const STORAGE_KEY_COBRANZAS = "uni-parking-cobranzas";
const STORAGE_COBRADOR = "uni-parking-cobrador";
const ALIAS_CLUB = "RUGBY.UNIDEMIVIDA";

type Cobranza = {
  cobrador: string;
  dniCobrador: string;
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

type DatosCobrador = {
  dni: string;
  nombreApellido: string;
};

export default function CobrarPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cobranzasPorEvento, setCobranzasPorEvento] =
    useState<CobranzasPorEvento>({});

  const [datosCobrador, setDatosCobrador] = useState<DatosCobrador | null>(
    null
  );

  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [tipoIngreso, setTipoIngreso] = useState<
    "efectivo" | "transferencia" | "pase-libre"
  >("efectivo");

  const [numeroTicket, setNumeroTicket] = useState("");
  const [patente, setPatente] = useState("");
  const [comprobanteVisto, setComprobanteVisto] = useState(false);
  const [beneficiarioPaseLibre, setBeneficiarioPaseLibre] = useState("");

  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [cobranzaFinalizada, setCobranzaFinalizada] = useState(false);
  const [mensajeCopiado, setMensajeCopiado] = useState("");

  useEffect(() => {
    const guardados = localStorage.getItem(STORAGE_KEY_EVENTOS);

    if (guardados) {
      const eventosParseados = JSON.parse(guardados);

      const eventosNormalizados = eventosParseados.map((evento: any) => ({
        ...evento,
        estado: evento.estado ?? "abierto",
      }));

      setEventos(eventosNormalizados);
      localStorage.setItem(
        STORAGE_KEY_EVENTOS,
        JSON.stringify(eventosNormalizados)
      );
    } else {
      setEventos(eventosIniciales);
      localStorage.setItem(
        STORAGE_KEY_EVENTOS,
        JSON.stringify(eventosIniciales)
      );
    }
  }, []);

  useEffect(() => {
    const guardadas = localStorage.getItem(STORAGE_KEY_COBRANZAS);

    if (guardadas) {
      setCobranzasPorEvento(JSON.parse(guardadas));
    } else {
      localStorage.setItem(STORAGE_KEY_COBRANZAS, JSON.stringify({}));
    }
  }, []);

  useEffect(() => {
    const cobradorGuardado = localStorage.getItem(STORAGE_COBRADOR);

    if (cobradorGuardado) {
      setDatosCobrador(JSON.parse(cobradorGuardado));
    } else {
      window.location.href = "/ingreso-cobrador";
    }
  }, []);

  useEffect(() => {
    if (!eventoSeleccionado) return;

    const sigueAbierto = eventos.some(
      (evento) =>
        evento.nombre === eventoSeleccionado && evento.estado === "abierto"
    );

    if (!sigueAbierto) {
      setEventoSeleccionado("");
      setMensajeError(
        "El evento seleccionado fue cerrado o ya no está disponible."
      );
      setRegistroExitoso(false);
    }
  }, [eventos, eventoSeleccionado]);

  function guardarCobranzasActualizadas(actualizadas: CobranzasPorEvento) {
    setCobranzasPorEvento(actualizadas);
    localStorage.setItem(STORAGE_KEY_COBRANZAS, JSON.stringify(actualizadas));
  }

  const eventosAbiertos = eventos.filter((evento) => evento.estado === "abierto");

  const eventoActual = useMemo(
    () => eventosAbiertos.find((evento) => evento.nombre === eventoSeleccionado),
    [eventosAbiertos, eventoSeleccionado]
  );

  const valorEstacionamiento = eventoActual?.precio ?? 0;
  const eventoHabilitado = !!eventoActual;

  const cobranzasEvento = eventoSeleccionado
    ? cobranzasPorEvento[eventoSeleccionado] ?? []
    : [];

  const cobranzasDelCobrador = useMemo(() => {
    if (!datosCobrador || !eventoSeleccionado) return [];

    return cobranzasEvento.filter(
      (cobranza) =>
        cobranza.cobrador === datosCobrador.nombreApellido &&
        cobranza.dniCobrador === datosCobrador.dni
    );
  }, [cobranzasEvento, datosCobrador, eventoSeleccionado]);

  const totalOperacionesPropias = cobranzasDelCobrador.length;

  const totalEfectivoPropio = cobranzasDelCobrador.filter(
    (cobranza) => cobranza.medioPago === "Efectivo"
  ).length;

  const totalTransferenciaPropio = cobranzasDelCobrador.filter(
    (cobranza) => cobranza.medioPago === "Transferencia"
  ).length;

  const totalPaseLibrePropio = cobranzasDelCobrador.filter(
    (cobranza) => cobranza.tipoRegistro === "Pase libre"
  ).length;

  const recaudacionPropia = cobranzasDelCobrador.reduce(
    (acumulado, cobranza) => acumulado + (Number(cobranza.monto) || 0),
    0
  );

  const recaudacionEfectivoPropia = cobranzasDelCobrador
    .filter((cobranza) => cobranza.medioPago === "Efectivo")
    .reduce(
      (acumulado, cobranza) => acumulado + (Number(cobranza.monto) || 0),
      0
    );

  const recaudacionTransferenciaPropia = cobranzasDelCobrador
    .filter((cobranza) => cobranza.medioPago === "Transferencia")
    .reduce(
      (acumulado, cobranza) => acumulado + (Number(cobranza.monto) || 0),
      0
    );

  function limpiarFormularioRegistro() {
    setNumeroTicket("");
    setPatente("");
    setComprobanteVisto(false);
    setBeneficiarioPaseLibre("");
  }

  function registrarCobranza() {
    if (cobranzaFinalizada) {
      setMensajeError("Esta cobranza ya fue finalizada.");
      setRegistroExitoso(false);
      return;
    }

    if (!datosCobrador?.nombreApellido.trim()) {
      setMensajeError("Faltan los datos del cobrador. Volvé al ingreso.");
      setRegistroExitoso(false);
      return;
    }

    if (!eventoSeleccionado || !eventoHabilitado) {
      setMensajeError("Tenés que seleccionar un evento abierto.");
      setRegistroExitoso(false);
      return;
    }

    if (!numeroTicket.trim()) {
      setMensajeError("Tenés que ingresar el número de ticket.");
      setRegistroExitoso(false);
      return;
    }

    const ticketDuplicado = cobranzasEvento.some(
      (cobranza) =>
        cobranza.ticket.trim().toLowerCase() ===
        numeroTicket.trim().toLowerCase()
    );

    if (ticketDuplicado) {
      setMensajeError("Ese número de ticket ya fue registrado en este evento.");
      setRegistroExitoso(false);
      return;
    }

    if (tipoIngreso === "pase-libre") {
      if (!beneficiarioPaseLibre.trim()) {
        setMensajeError("Tenés que indicar quién ingresó con pase libre.");
        setRegistroExitoso(false);
        return;
      }

      if (!patente.trim()) {
        setMensajeError("Para pase libre tenés que ingresar la patente.");
        setRegistroExitoso(false);
        return;
      }

      const nuevoPaseLibre: Cobranza = {
        cobrador: datosCobrador.nombreApellido,
        dniCobrador: datosCobrador.dni,
        evento: eventoSeleccionado,
        tipoRegistro: "Pase libre",
        medioPago: "No cobra",
        ticket: numeroTicket,
        patente,
        comprobante: "No aplica",
        beneficiarioPaseLibre,
        monto: 0,
        fechaHora: new Date().toLocaleString("es-AR"),
      };

      const actuales = cobranzasPorEvento[eventoSeleccionado] ?? [];
      const actualizadas = {
        ...cobranzasPorEvento,
        [eventoSeleccionado]: [nuevoPaseLibre, ...actuales],
      };

      guardarCobranzasActualizadas(actualizadas);
      setMensajeError("");
      setRegistroExitoso(true);
      limpiarFormularioRegistro();
      return;
    }

    if (tipoIngreso === "transferencia" && !comprobanteVisto) {
      setMensajeError(
        "Si el pago es por transferencia, tenés que marcar el comprobante como visto."
      );
      setRegistroExitoso(false);
      return;
    }

    const nuevaCobranza: Cobranza = {
      cobrador: datosCobrador.nombreApellido,
      dniCobrador: datosCobrador.dni,
      evento: eventoSeleccionado,
      tipoRegistro: "Cobranza",
      medioPago: tipoIngreso === "efectivo" ? "Efectivo" : "Transferencia",
      ticket: numeroTicket,
      patente: patente || "No informada",
      comprobante:
        tipoIngreso === "transferencia"
          ? comprobanteVisto
            ? "Verificado"
            : "Pendiente"
          : "No aplica",
      beneficiarioPaseLibre: "-",
      monto: valorEstacionamiento,
      fechaHora: new Date().toLocaleString("es-AR"),
    };

    const actuales = cobranzasPorEvento[eventoSeleccionado] ?? [];
    const actualizadas = {
      ...cobranzasPorEvento,
      [eventoSeleccionado]: [nuevaCobranza, ...actuales],
    };

    guardarCobranzasActualizadas(actualizadas);
    setMensajeError("");
    setRegistroExitoso(true);
    limpiarFormularioRegistro();
  }

  function obtenerHora(fechaHora: string) {
    const partes = fechaHora.split(",");
    return partes.length > 1 ? partes[1].trim() : fechaHora;
  }

  function finalizarCobranza() {
    if (!eventoSeleccionado) {
      setMensajeError("Seleccioná un evento antes de finalizar.");
      return;
    }

    setCobranzaFinalizada(true);
    setMensajeError("");
    setRegistroExitoso(false);
  }

  async function copiarResumenFinal() {
    const texto = `RESUMEN DE MIS COBRANZAS

Cobrador: ${datosCobrador?.nombreApellido ?? "-"}
Evento: ${eventoSeleccionado || "-"}

Mis operaciones: ${totalOperacionesPropias}
Efectivo: ${totalEfectivoPropio} · $${recaudacionEfectivoPropia}
Transferencia: ${totalTransferenciaPropio} · $${recaudacionTransferenciaPropia}
Pases libres: ${totalPaseLibrePropio}

TOTAL DE MIS COBRANZAS: $${recaudacionPropia}`;

    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado("Resumen copiado para WhatsApp.");
      setTimeout(() => setMensajeCopiado(""), 2500);
    } catch {
      setMensajeCopiado("No se pudo copiar el resumen.");
      setTimeout(() => setMensajeCopiado(""), 2500);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-5 text-neutral-900">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700">
            Club Universitario de Córdoba
          </div>
          <h1 className="text-3xl font-bold text-red-700">Cobranza</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Registrá el estacionamiento de forma simple y rápida.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-sm">
            <strong>Cobrador:</strong> {datosCobrador?.nombreApellido || "-"}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_COBRADOR);
                window.location.href = "/ingreso-cobrador";
              }}
              className="flex-1 rounded-2xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
            >
              Cambiar cobrador
            </button>

            <button
              type="button"
              onClick={finalizarCobranza}
              className="flex-1 rounded-2xl bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Finalizar cobranza
            </button>
          </div>
        </div>

        {cobranzaFinalizada && (
          <div className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">
              Cobranza finalizada
            </h2>

            <div className="mt-3 space-y-1 text-sm">
              <div>
                <strong>Cobrador:</strong> {datosCobrador?.nombreApellido || "-"}
              </div>
              <div>
                <strong>Evento:</strong> {eventoSeleccionado || "-"}
              </div>
              <div>
                <strong>Mis operaciones:</strong> {totalOperacionesPropias}
              </div>
              <div>
                <strong>Efectivo:</strong> {totalEfectivoPropio} · $
                {recaudacionEfectivoPropia}
              </div>
              <div>
                <strong>Transferencia:</strong> {totalTransferenciaPropio} · $
                {recaudacionTransferenciaPropia}
              </div>
              <div>
                <strong>Pases libres:</strong> {totalPaseLibrePropio}
              </div>
              <div className="pt-2 font-bold text-red-700">
                TOTAL DE MIS COBRANZAS: ${recaudacionPropia}
              </div>
            </div>

            <button
              type="button"
              onClick={copiarResumenFinal}
              className="mt-4 w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Copiar resumen para WhatsApp
            </button>

            {mensajeCopiado && (
              <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {mensajeCopiado}
              </div>
            )}

            <Link
              href="/"
              className="mt-4 block w-full rounded-2xl border border-red-200 px-4 py-3 text-center text-sm font-semibold text-red-700"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Evento</label>
          <select
            value={eventoSeleccionado}
            onChange={(e) => {
              setEventoSeleccionado(e.target.value);
              setRegistroExitoso(false);
              setMensajeError("");
            }}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            disabled={cobranzaFinalizada}
          >
            <option value="">Seleccionar evento</option>
            {eventosAbiertos.map((evento) => (
              <option key={evento.nombre} value={evento.nombre}>
                {evento.nombre}
              </option>
            ))}
          </select>

          {eventosAbiertos.length === 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              No hay eventos abiertos para cobrar.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-wide text-red-700">
            Valor del estacionamiento
          </div>
          <div className="mt-1 text-2xl font-bold text-red-700">
            {eventoSeleccionado ? `$${valorEstacionamiento}` : "-"}
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            Lo define la administración según el evento.
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-3 block text-sm font-medium">Tipo de ingreso</label>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setTipoIngreso("efectivo");
                setRegistroExitoso(false);
                setMensajeError("");
                setComprobanteVisto(false);
              }}
              disabled={cobranzaFinalizada}
              className={`rounded-2xl px-3 py-4 font-semibold ${
                tipoIngreso === "efectivo"
                  ? "bg-green-600 text-white"
                  : "border border-green-300 text-green-700"
              } ${cobranzaFinalizada ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="text-xl">💵</div>
              <div className="mt-1 text-sm">Efectivo</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoIngreso("transferencia");
                setRegistroExitoso(false);
                setMensajeError("");
              }}
              disabled={cobranzaFinalizada}
              className={`rounded-2xl px-3 py-4 font-semibold ${
                tipoIngreso === "transferencia"
                  ? "bg-blue-600 text-white"
                  : "border border-blue-300 text-blue-700"
              } ${cobranzaFinalizada ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="text-xl">💳</div>
              <div className="mt-1 text-sm">Transferencia</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoIngreso("pase-libre");
                setRegistroExitoso(false);
                setMensajeError("");
                setComprobanteVisto(false);
              }}
              disabled={cobranzaFinalizada}
              className={`rounded-2xl px-3 py-4 font-semibold ${
                tipoIngreso === "pase-libre"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-300 text-orange-700"
              } ${cobranzaFinalizada ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="text-xl">🟧</div>
              <div className="mt-1 text-sm">Pase libre</div>
            </button>
          </div>
        </div>

        {tipoIngreso === "transferencia" && (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <label className="mb-3 block text-sm font-medium text-blue-700">
              Pago por transferencia
            </label>

            <div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-5 text-center">
              <div className="text-sm text-neutral-500">Alias para cobrar</div>
              <div className="mt-2 text-2xl font-bold tracking-wide text-blue-700">
                {ALIAS_CLUB}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Compartilo con quien va a pagar.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setComprobanteVisto(!comprobanteVisto);
                setRegistroExitoso(false);
                setMensajeError("");
              }}
              disabled={cobranzaFinalizada}
              className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                comprobanteVisto
                  ? "bg-blue-600 text-white"
                  : "border border-blue-200 bg-white text-blue-700"
              } ${cobranzaFinalizada ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {comprobanteVisto
                ? "Comprobante verificado"
                : "Marcar comprobante visto"}
            </button>
          </div>
        )}

        {tipoIngreso === "pase-libre" && (
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-orange-700">
              Quién ingresó con pase libre
            </label>
            <input
              type="text"
              value={beneficiarioPaseLibre}
              onChange={(e) => {
                setBeneficiarioPaseLibre(e.target.value);
                setRegistroExitoso(false);
                setMensajeError("");
              }}
              placeholder="Ej: Presidente del club"
              disabled={cobranzaFinalizada}
              className="w-full rounded-2xl border border-orange-200 px-4 py-3 outline-none"
            />
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Número de ticket (obligatorio)
          </label>
          <input
            type="text"
            value={numeroTicket}
            onChange={(e) => {
              setNumeroTicket(e.target.value);
              setRegistroExitoso(false);
              setMensajeError("");
            }}
            placeholder="Ej: 1482"
            disabled={cobranzaFinalizada}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Patente {tipoIngreso === "pase-libre" ? "(obligatoria)" : "(opcional)"}
          </label>
          <input
            type="text"
            value={patente}
            onChange={(e) => {
              setPatente(e.target.value.toUpperCase());
              setRegistroExitoso(false);
              setMensajeError("");
            }}
            placeholder="Ej: AB123CD"
            disabled={cobranzaFinalizada}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 uppercase outline-none"
          />
        </div>

        <button
          type="button"
          onClick={registrarCobranza}
          className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!eventoHabilitado || cobranzaFinalizada}
        >
          {tipoIngreso === "pase-libre"
            ? "Registrar pase libre"
            : tipoIngreso === "transferencia"
            ? "Registrar transferencia"
            : "Registrar efectivo"}
        </button>

        {mensajeError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            {mensajeError}
          </div>
        )}

        {registroExitoso && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            {tipoIngreso === "pase-libre"
              ? "Pase libre registrado correctamente."
              : "Cobranza registrada correctamente."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Mis operaciones
            </div>
            <div className="mt-1 text-lg font-bold text-red-700">
              {totalOperacionesPropias}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Mi total
            </div>
            <div className="mt-1 text-lg font-bold text-red-700">
              ${recaudacionPropia}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Efectivo
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">
              {totalEfectivoPropio}
            </div>
            <div className="text-xs text-neutral-500">
              ${recaudacionEfectivoPropia}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Transferencia
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">
              {totalTransferenciaPropio}
            </div>
            <div className="text-xs text-neutral-500">
              ${recaudacionTransferenciaPropia}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Pase libre
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">
              {totalPaseLibrePropio}
            </div>
            <div className="text-xs text-neutral-500">$0</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Mis últimas cobranzas
          </h2>

          {!eventoSeleccionado ? (
            <p className="text-sm text-neutral-500">
              Seleccioná un evento para ver tus registros.
            </p>
          ) : cobranzasDelCobrador.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no tenés registros en este evento.
            </p>
          ) : (
            <div className="space-y-2">
              {cobranzasDelCobrador.map((cobranza, index) => (
                <div
                  key={`${cobranza.ticket}-${index}-${cobranza.tipoRegistro}`}
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{index + 1}.</span>{" "}
                  {cobranza.medioPago} · ${cobranza.monto} ·{" "}
                  {obtenerHora(cobranza.fechaHora)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}