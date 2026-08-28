/** UTC calendar arithmetic: independent of host timezone and DST. */
export function fridaysOf(year: number, month1: number): string[] {
  const dates: string[] = [];
  const d = new Date(Date.UTC(year, month1 - 1, 1));
  while (d.getUTCMonth() === month1 - 1) {
    if (d.getUTCDay() === 5) dates.push(d.toISOString().slice(0,10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

export function pastFridaysOf(year: number, month: number, today: string): string[] {
  return fridaysOf(year, month).filter((iso) => iso < today);
}
