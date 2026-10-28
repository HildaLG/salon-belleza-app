export const HORAS = [
  "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00",
];

export const ZONA = "-06:00";

export function esDomingo(fecha: string) {
  return new Date(`${fecha}T12:00:00${ZONA}`).getUTCDay() === 0;
}

export function horaMexico(iso: string) {
  const h = (new Date(iso).getUTCHours() + 18) % 24;
  return String(h).padStart(2, "0") + ":00";
}