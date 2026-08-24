/** "2026-08-14" → "Viernes 14 de agosto" (es-AR, sentence case). */
export function fechaLarga(iso: string): string {
  // T00:00:00 evita el corrimiento de día por zona horaria
  const d = new Date(`${iso}T00:00:00`);
  const s = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(d)
    .replace(",", ""); // "viernes, 14 de agosto" → "viernes 14 de agosto"
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** true si `iso` (yyyy-mm-dd) ya pasó respecto de hoy. */
export function esPasado(iso: string): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(`${iso}T00:00:00`) < hoy;
}

/** "23:30:00" → "23:30". Postgres `time` llega con segundos; en pantalla van sólo HH:MM. */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/**
 * Rango horario listo para pantalla: "23:30 — 07:00", o sólo el inicio si no
 * hay hora de fin. `undefined` cuando no hay inicio cargado. Único lugar donde
 * se arma el string — lo usan el detalle de Season y /fechas.
 */
export function rangoHorario(inicio?: string, fin?: string): string | undefined {
  if (!inicio) return undefined;
  return fin ? `${horaCorta(inicio)} — ${horaCorta(fin)}` : horaCorta(inicio);
}

/** "2026-08-14" → "Vie 14 Ago" (para las cards del slider). */
export function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const wd = new Intl.DateTimeFormat("es-AR", { weekday: "short" })
    .format(d)
    .replace(".", "");
  const mes = new Intl.DateTimeFormat("es-AR", { month: "short" })
    .format(d)
    .replace(".", "");
  return `${cap(wd)} ${d.getDate()} ${cap(mes)}`;
}
