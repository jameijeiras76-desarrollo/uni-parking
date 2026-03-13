"use client";

import { useEffect, useMemo, useState } from "react";
import { Evento, eventosIniciales } from "../data/eventos";

const STORAGE_KEY_EVENTOS = "uni-parking-eventos";
const STORAGE_KEY_COBRANZAS = "uni-parking-cobranzas";
const ALIAS_CLUB = "RUGBY.UNIDEMIVIDA";

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

export default function CobrarPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cobranzasPorEvento, setCobranzasPorEvento] = useState<CobranzasPorEvento>(
    {}
  );

  const [nombreCobrador, setNombreCobrador] = useState("");
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [medioPago, setMedioPago] = useState("efectivo");
  const [numeroTicket, setNumeroTicket] = useState("");
  const [patente, setPatente] = useState("");
  const [comprobanteVisto, setComprobanteVisto] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [esPaseLibre, setEsPaseLibre] = useState(false);
  const [beneficiarioPaseLibre, setBeneficiarioPaseLibre] = useState("");

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
    if (!eventoSeleccionado) return;

    const sigueAbierto = eventos.some(
      (evento) =>
        evento.nombre === eventoSeleccionado && evento.estado === "abierto"
    );

    if (!sigueAbierto) {
      setEventoSeleccionado("");
      setMensajeError("El evento seleccionado fue cerrado o ya no está disponible.");
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

  const cobranzas = eventoSeleccionado
    ? cobranzasPorEvento[eventoSeleccionado] ?? []
    : [];

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

  const recaudacionTotal = cobranzas.reduce(
    (acumulado, cobranza) => acumulado + (Number(cobranza.monto) || 0),
    0
  );

  const recaudacionEfectivo = cobranzas
    .filter((cobranza) => cobranza.medioPago === "Efectivo")
    .reduce(
      (acumulado, cobranza) => acumulado + (Number(cobranza.monto) || 0),
      0
    );

  const recaudacionTransferencia = cobranzas
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
    if (!nombreCobrador.trim()) {
      setMensajeError("Tenés que indicar el nombre del cobrador.");
      setRegistroExitoso(false);
      return;
    }

    if (!eventoSeleccionado || !eventoHabilitado) {
      setMensajeError("Tenés que seleccionar un evento abierto.");
      setRegistroExitoso(false);
      return;
    }

    if (esPaseLibre) {
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
        cobrador: nombreCobrador,
        evento: eventoSeleccionado,
        tipoRegistro: "Pase libre",
        medioPago: "No cobra",
        ticket: "-",
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

    if (numeroTicket.trim()) {
      const ticketDuplicado = cobranzas.some(
        (cobranza) =>
          cobranza.ticket.trim().toLowerCase() ===
          numeroTicket.trim().toLowerCase()
      );

      if (ticketDuplicado) {
        setMensajeError("Ese número de ticket ya fue registrado en este evento.");
        setRegistroExitoso(false);
        return;
      }
    }

    if (medioPago === "transferencia" && !comprobanteVisto) {
      setMensajeError(
        "Si el pago es por transferencia, tenés que marcar el comprobante como visto."
      );
      setRegistroExitoso(false);
      return;
    }

    const nuevaCobranza: Cobranza = {
      cobrador: nombreCobrador,
      evento: eventoSeleccionado,
      tipoRegistro: "Cobranza",
      medioPago: medioPago === "efectivo" ? "Efectivo" : "Transferencia",
      ticket: numeroTicket || "-",
      patente: patente || "No informada",
      comprobante:
        medioPago === "transferencia"
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

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Registros
            </div>
            <div className="mt-1 text-lg font-bold text-red-700">{totalRegistros}</div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Recaudado
            </div>
            <div className="mt-1 text-lg font-bold text-red-700">${recaudacionTotal}</div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Efectivo
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">{totalEfectivo}</div>
            <div className="text-xs text-neutral-500">${recaudacionEfectivo}</div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Transferencia
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">
              {totalTransferencia}
            </div>
            <div className="text-xs text-neutral-500">${recaudacionTransferencia}</div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Pase libre
            </div>
            <div className="mt-1 text-base font-bold text-neutral-800">{totalPaseLibre}</div>
            <div className="text-xs text-neutral-500">$0</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Nombre del cobrador</label>
          <input
            type="text"
            value={nombreCobrador}
            onChange={(e) => {
              setNombreCobrador(e.target.value);
              setRegistroExitoso(false);
              setMensajeError("");
            }}
            placeholder="Ej: Julián"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
          />
        </div>

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

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-3 block text-sm font-medium">Tipo de ingreso</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setEsPaseLibre(false);
                setRegistroExitoso(false);
                setMensajeError("");
              }}
              className={`rounded-2xl px-4 py-3 font-semibold ${
                !esPaseLibre ? "bg-red-700 text-white" : "border border-red-200 text-red-700"
              }`}
            >
              Pago de Estacionamiento
            </button>

            <button
              type="button"
              onClick={() => {
                setEsPaseLibre(true);
                setRegistroExitoso(false);
                setMensajeError("");
                setComprobanteVisto(false);
              }}
              className={`rounded-2xl px-4 py-3 font-semibold ${
                esPaseLibre ? "bg-red-700 text-white" : "border border-red-200 text-red-700"
              }`}
            >
              Pase libre
            </button>
          </div>
        </div>

        {esPaseLibre && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium">
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
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            />
          </div>
        )}

        {!esPaseLibre && (
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="mb-3 block text-sm font-medium">Medio de pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMedioPago("efectivo");
                  setComprobanteVisto(false);
                  setRegistroExitoso(false);
                  setMensajeError("");
                }}
                className={`rounded-2xl px-4 py-3 font-semibold ${
                  medioPago === "efectivo"
                    ? "bg-red-700 text-white"
                    : "border border-red-200 text-red-700"
                }`}
              >
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => {
                  setMedioPago("transferencia");
                  setRegistroExitoso(false);
                  setMensajeError("");
                }}
                className={`rounded-2xl px-4 py-3 font-semibold ${
                  medioPago === "transferencia"
                    ? "bg-red-700 text-white"
                    : "border border-red-200 text-red-700"
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>
        )}

        {!esPaseLibre && medioPago === "transferencia" && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <label className="mb-3 block text-sm font-medium text-red-700">
              Pago por transferencia
            </label>

            <div className="mb-4 rounded-2xl border border-dashed border-red-300 bg-white p-5 text-center">
              <div className="text-sm text-neutral-500">Alias para cobrar</div>
              <div className="mt-2 text-2xl font-bold tracking-wide text-red-700">
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
              className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                comprobanteVisto
                  ? "bg-red-700 text-white"
                  : "border border-red-200 bg-white text-red-700"
              }`}
            >
              {comprobanteVisto ? "Comprobante verificado" : "Marcar comprobante visto"}
            </button>
          </div>
        )}

        {!esPaseLibre && (
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium">
              Número de ticket (opcional)
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
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            />
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Patente {esPaseLibre ? "(obligatoria)" : "(opcional)"}
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
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 uppercase outline-none"
          />
        </div>

        <button
          type="button"
          onClick={registrarCobranza}
          className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!eventoHabilitado}
        >
          {esPaseLibre ? "Registrar pase libre" : "Registrar Pago de Estacionamiento"}
        </button>

        {mensajeError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            {mensajeError}
          </div>
        )}

        {registroExitoso && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            {esPaseLibre
              ? "Pase libre registrado correctamente."
              : "Cobranza registrada correctamente."}
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Últimos registros del evento
          </h2>

          {!eventoSeleccionado ? (
            <p className="text-sm text-neutral-500">
              Seleccioná un evento para ver sus registros.
            </p>
          ) : cobranzas.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no hay registros para este evento.
            </p>
          ) : (
            <div className="space-y-3">
              {cobranzas.map((cobranza, index) => (
                <div
                  key={`${cobranza.ticket}-${index}-${cobranza.tipoRegistro}`}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="text-sm"><strong>Tipo:</strong> {cobranza.tipoRegistro}</div>
                  <div className="text-sm"><strong>Cobrador:</strong> {cobranza.cobrador}</div>
                  <div className="text-sm"><strong>Evento:</strong> {cobranza.evento}</div>
                  <div className="text-sm"><strong>Fecha y hora:</strong> {cobranza.fechaHora}</div>
                  <div className="text-sm"><strong>Medio de pago:</strong> {cobranza.medioPago}</div>
                  <div className="text-sm"><strong>Ticket:</strong> {cobranza.ticket}</div>
                  {cobranza.tipoRegistro === "Pase libre" && (
                    <div className="text-sm">
                      <strong>Autorizado / beneficiario:</strong> {cobranza.beneficiarioPaseLibre}
                    </div>
                  )}
                  <div className="text-sm"><strong>Patente:</strong> {cobranza.patente}</div>
                  <div className="text-sm"><strong>Comprobante:</strong> {cobranza.comprobante}</div>
                  <div className="text-sm"><strong>Monto:</strong> ${cobranza.monto}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
