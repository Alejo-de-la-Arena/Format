import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { EDGES } from "@/components/TapeBlock";
import { getShapePath } from "@/components/shapePaths";
import HomeReveal from "@/components/home/HomeReveal";
import type { Forma } from "@/lib/types";

/** The one authorized preview lives here, server-rendered; no future catalogue. */
export default function WhatIsFormat({ activa, className, wrapClassName }: {
  activa: { numero: string; nombre: string; forma: Forma; color: string } | null;
  className?: string; wrapClassName?: string;
}) {
  return (
    <section className={`relative isolate overflow-hidden bg-paper-2 ${className ?? ""}`}>
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{ backgroundImage: "radial-gradient(var(--color-ink) 1px, transparent 1.15px)", backgroundSize: "8px 8px" }} />
      <div className={wrapClassName}>
        <HomeReveal className="mx-auto grid max-w-[1080px] items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]" staggered>
          <div>
            <SectionTitle title="Qué es FORMAT" />
            <p className="m-0 max-w-[22ch] text-[clamp(23px,3vw,38px)] font-black leading-[1.12] tracking-tight">
              Cada mes la terraza cambia por completo.
            </p>
            <p className="mt-3 max-w-[44ch] text-[15px] text-muted">
              Música electrónica, escenografía completa y un cocktail para el opening de cada Season.
            </p>
            <Link href="/about" className="label-mono mt-5 inline-flex w-fit items-center gap-2 bg-ink px-4 py-3 text-paper transition-transform hover:-translate-y-1 hover:rotate-[-1deg] hover:bg-accent-1 hover:text-ink">
              Conocé FORMAT <span aria-hidden>→</span>
            </Link>
          </div>
          {activa && <div className="flex items-center gap-5 justify-self-center py-6 sm:gap-8">
            <div className="relative flex flex-col items-center">
            <div className="relative h-32 w-32" aria-hidden>
              {[0, 1, 2].map((i) => <svg key={i} viewBox="0 0 72 72" className="absolute inset-0 h-full w-full"
                style={{ transform: `translate(${i * 13}px,${i * -7}px) rotate(${-7 + i * 8}deg)` }}>
                <path d={getShapePath(activa.forma, activa.numero)} fill={i === 0 ? activa.color : "none"}
                  stroke={activa.color} strokeWidth={i === 0 ? 0 : .6} opacity={i === 0 ? 1 : .45} />
              </svg>)}
              {activa.nombre.toLowerCase() === "origin" && <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full">
                <path d="M23 36H48M39 27L48 36L39 45" fill="none" stroke="var(--color-paper)" strokeWidth="2" />
              </svg>}
            </div>
            <span className="relative mt-3 bg-ink px-3 py-2 text-xl font-black uppercase text-paper"
              style={{ transform: "rotate(-2deg)", clipPath: EDGES[2] }}>{activa.numero} {activa.nombre}</span>
            </div>
            {activa.nombre.toLowerCase() === "origin" && <div className="flex flex-col items-center gap-2 pt-2" aria-label="Próximamente: Ascent">
              <span className="text-[9px] font-bold uppercase tracking-[.16em]">Próximamente</span>
              <svg aria-hidden viewBox="0 0 72 72" className="h-24 w-24 -rotate-3" style={{ color: "#7B3FE4" }}>
                <path d="M8 12L64 12L36 64Z" fill="currentColor" />
                <path d="M12 8L68 8L40 60Z" fill="none" stroke="currentColor" strokeWidth=".55" />
              </svg>
              <span className="text-base font-extrabold uppercase tracking-tight">Ascent</span>
            </div>}
          </div>}
        </HomeReveal>
      </div>
    </section>
  );
}
