export type Estamento =
  | "Infantiles"
  | "Juveniles"
  | "PS Masculino"
  | "PS Femenino";

export type Evento = {
  nombre: string;
  precio: number;
  estado: "abierto" | "cerrado";
  fecha: string; // YYYY-MM-DD
  lugar: string;
  rival: string;
  estamento: Estamento;
};

export const eventosIniciales: Evento[] = [
  {
    nombre: "CUC vs Tala - 15/03/2026 - PS Masculino - La Lomita",
    precio: 3000,
    estado: "abierto",
    fecha: "2026-03-15",
    lugar: "La Lomita",
    rival: "Tala",
    estamento: "PS Masculino",
  },
  {
    nombre: "CUC vs Jockey - 22/03/2026 - Juveniles - Club Universitario",
    precio: 3500,
    estado: "abierto",
    fecha: "2026-03-22",
    lugar: "Club Universitario",
    rival: "Jockey",
    estamento: "Juveniles",
  },
];
