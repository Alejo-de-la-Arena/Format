import Image from "next/image";
import { getShapePath } from "@/components/shapePaths";
import type { Fecha, Season } from "@/lib/types";
import styles from "./agenda.module.css";

export default function AgendaFlyer({ fecha, season, priority = false }: { fecha: Fecha; season: Season; priority?: boolean }) {
  if (fecha.flyer) return <Image src={fecha.flyer} alt={`Flyer de ${season.nombre} — ${fecha.fecha}`}
    width={800} height={1200} unoptimized priority={priority} className={styles.flyer} />;
  return <div className={styles.flyerMissing}>
    <svg aria-hidden viewBox="0 0 72 72"><path d={getShapePath(season.forma)} fill="currentColor" /></svg>
    <span>Flyer por anunciar</span>
  </div>;
}
