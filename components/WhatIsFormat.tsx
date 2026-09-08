import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { EDGES } from "@/components/TapeBlock";
import { getShapePath } from "@/components/shapePaths";
import HomeReveal from "@/components/home/HomeReveal";
import ActionIcon from "@/components/ActionIcon";
import type { Forma } from "@/lib/types";

/** El adelanto no revela la identidad de la Season siguiente. */
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
              Conocé FORMAT <ActionIcon />
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
              <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full">
                <path d="M23 36H48M39 27L48 36L39 45" fill="none" stroke="var(--color-paper)" strokeWidth="2" />
              </svg>
            </div>
            <span className="relative mt-3 bg-ink px-3 py-2 text-xl font-black uppercase text-paper"
              style={{ transform: "rotate(-2deg)", clipPath: EDGES[2] }}>{activa.numero} {activa.nombre}</span>
            </div>
            <div className="relative h-[186px] w-32 shrink-0 self-center" aria-label="Próximamente">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-[.16em]">Próximamente</span>
              <svg aria-hidden viewBox="0 0 72 72" className="absolute inset-x-0 top-0 h-32 w-32 -rotate-3">
                <text x="39" y="58" textAnchor="middle" fill="none" stroke="var(--accent-1)" strokeWidth=".7" opacity=".75"
                  fontFamily="var(--font-inter), Inter, sans-serif" fontSize="68" fontWeight="900">?</text>
                <text x="36" y="60" textAnchor="middle" fill="var(--color-ink)"
                  fontFamily="var(--font-inter), Inter, sans-serif" fontSize="68" fontWeight="900">?</text>
              </svg>
            </div>
          </div>}
        </HomeReveal>
      </div>
    </section>
  );
}
