"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Evento, eventosIniciales } from "../../data/eventos";

const STORAGE_KEY_EVENTOS = "uni-parking-eventos";
const STORAGE_KEY_COBRANZAS = "uni-parking-cobranzas";

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

function formatearFecha(fechaISO: string) {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function nombreHojaSeguro(nombre: string) {
  return nombre.replace(/[\\/*?:[\]]/g, "").slice(0, 31);
}

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cobranzasPorEvento, setCobranzasPorEvento] =
    useState<CobranzasPorEvento>({});

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estamentoFiltro, setEstamentoFiltro] = useState("Todos");
  const [eventosSeleccionados, setEventosSeleccionados] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

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

    if (guardadasCobranzas) {
      setCobranzasPorEvento(JSON.parse(guardadasCobranzas));
    } else {
      setCobranzasPorEvento({});
    }
  }, []);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const cumpleDesde = fechaDesde ? evento.fecha >= fechaDesde : true;
      const cumpleHasta = fechaHasta ? evento.fecha <= fechaHasta : true;
      const cumpleEstamento =
        estamentoFiltro === "Todos"
          ? true
          : evento.estamento === estamentoFiltro;

      return cumpleDesde && cumpleHasta && cumpleEstamento;
    });
  }, [eventos, fechaDesde, fechaHasta, estamentoFiltro]);

  function toggleEvento(nombreEvento: string) {
    setEventosSeleccionados((prev) =>
      prev.includes(nombreEvento)
        ? prev.filter((nombre) => nombre !== nombreEvento)
        : [...prev, nombreEvento]
    );
  }

  function seleccionarTodosFiltrados() {
    setEventosSeleccionados(eventosFiltrados.map((evento) => evento.nombre));
  }

  function limpiarSeleccion() {
    setEventosSeleccionados([]);
  }

  function obtenerResumenEvento(evento: Evento) {
    const cobranzasEvento = cobranzasPorEvento[evento.nombre] ?? [];

    const totalOperaciones = cobranzasEvento.length;

    const cantidadEfectivo = cobranzasEvento.filter(
      (cobranza) => cobranza.medioPago === "Efectivo"
    ).length;

    const cantidadTransferencia = cobranzasEvento.filter(
      (cobranza) => cobranza.medioPago === "Transferencia"
    ).length;

    const cantidadPaseLibre = cobranzasEvento.filter(
      (cobranza) => cobranza.tipoRegistro === "Pase libre"
    ).length;

    const recaudadoEfectivo = cobranzasEvento
      .filter((cobranza) => cobranza.medioPago === "Efectivo")
      .reduce((acc, cobranza) => acc + (Number(cobranza.monto) || 0), 0);

    const recaudadoTransferencia = cobranzasEvento
      .filter((cobranza) => cobranza.medioPago === "Transferencia")
      .reduce((acc, cobranza) => acc + (Number(cobranza.monto) || 0), 0);

    const totalRecaudado = cobranzasEvento.reduce(
      (acc, cobranza) => acc + (Number(cobranza.monto) || 0),
      0
    );

    return {
      totalOperaciones,
      cantidadEfectivo,
      cantidadTransferencia,
      cantidadPaseLibre,
      recaudadoEfectivo,
      recaudadoTransferencia,
      totalRecaudado,
      cobranzasEvento,
    };
  }

  function generarReporteExcel() {
    setMensaje("");

    const eventosElegidos = eventos.filter((evento) =>
      eventosSeleccionados.includes(evento.nombre)
    );

    if (eventosElegidos.length === 0) {
      setMensaje("Seleccioná al menos un evento para generar el reporte.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const hojaResumen = eventosElegidos.map((evento) => {
      const resumen = obtenerResumenEvento(evento);

      return {
        Fecha: formatearFecha(evento.fecha),
        Rival: evento.rival,
        Evento: evento.nombre,
        Estamento: evento.estamento,
        Lugar: evento.lugar,
        Estado: evento.estado,
        Operaciones: resumen.totalOperaciones,
        Efectivo_Cantidad: resumen.cantidadEfectivo,
        Efectivo_Monto: resumen.recaudadoEfectivo,
        Transferencia_Cantidad: resumen.cantidadTransferencia,
        Transferencia_Monto: resumen.recaudadoTransferencia,
        Pases_Libres: resumen.cantidadPaseLibre,
        Total_Recaudado: resumen.totalRecaudado,
      };
    });

    const wsResumen = XLSX.utils.json_to_sheet(hojaResumen);
    XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");

    eventosElegidos.forEach((evento) => {
      const resumen = obtenerResumenEvento(evento);

      const detalle =
        resumen.cobranzasEvento.length > 0
          ? resumen.cobranzasEvento.map((cobranza, index) => ({
              Nro: index + 1,
              Fecha_Hora: cobranza.fechaHora,
              Cobrador: cobranza.cobrador,
              DNI_Cobrador: cobranza.dniCobrador,
              Tipo_Registro: cobranza.tipoRegistro,
              Medio_Pago: cobranza.medioPago,
              Ticket: cobranza.ticket,
              Patente: cobranza.patente,
              Beneficiario_Pase_Libre: cobranza.beneficiarioPaseLibre,
              Comprobante: cobranza.comprobante,
              Monto: cobranza.monto,
            }))
          : [
              {
                Nro: "",
                Fecha_Hora: "",
                Cobrador: "",
                DNI_Cobrador: "",
                Tipo_Registro: "",
                Medio_Pago: "",
                Ticket: "",
                Patente: "",
                Beneficiario_Pase_Libre: "",
                Comprobante: "",
                Monto: 0,
              },
            ];

      const wsDetalle = XLSX.utils.json_to_sheet(detalle);
      XLSX.utils.book_append_sheet(
        workbook,
        wsDetalle,
        nombreHojaSeguro(evento.rival || evento.nombre)
      );
    });

    XLSX.writeFile(workbook, "reporte_auditoria_uni_parking.xlsx");
    setMensaje("Reporte generado correctamente.");
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">Auditoría</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Seleccioná eventos por filtros y generá un reporte completo.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Estamento
              </label>
              <select
                value={estamentoFiltro}
                onChange={(e) => setEstamentoFiltro(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              >
                <option value="Todos">Todos</option>
                <option value="Infantiles">Infantiles</option>
                <option value="Juveniles">Juveniles</option>
                <option value="PS Masculino">PS Masculino</option>
                <option value="PS Femenino">PS Femenino</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={seleccionarTodosFiltrados}
              className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
            >
              Seleccionar todos
            </button>

            <button
              type="button"
              onClick={limpiarSeleccion}
              className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Limpiar selección
            </button>
          </div>

          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Eventos
          </h2>

          {eventosFiltrados.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay eventos con esos filtros.
            </p>
          ) : (
            <div className="space-y-3">
              {eventosFiltrados.map((evento) => {
                const resumen = obtenerResumenEvento(evento);
                const marcado = eventosSeleccionados.includes(evento.nombre);

                return (
                  <label
                    key={evento.nombre}
                    className="block rounded-2xl border border-neutral-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggleEvento(evento.nombre)}
                        className="mt-1 h-4 w-4"
                      />

                      <div className="flex-1">
                        <div className="text-sm font-semibold text-neutral-900">
                          {evento.nombre}
                        </div>

                        <div className="mt-2 text-sm text-neutral-600">
                          <strong>Fecha:</strong> {formatearFecha(evento.fecha)}
                        </div>

                        <div className="text-sm text-neutral-600">
                          <strong>Estamento:</strong> {evento.estamento}
                        </div>

                        <div className="text-sm text-neutral-600">
                          <strong>Total recaudado:</strong>{" "}
                          <span className="font-semibold text-red-700">
                            ${resumen.totalRecaudado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {mensaje && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            {mensaje}
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={generarReporteExcel}
            className="w-full rounded-2xl bg-red-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
          >
            Generar reporte
          </button>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm flex justify-between">
          <Link href="/admin" className="text-red-700 underline">
            Volver a admin
          </Link>

          <Link href="/" className="text-red-700 underline">
            Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}