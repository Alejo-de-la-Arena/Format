import TapeBlock from "@/components/TapeBlock";

/**
 * Badge del viernes de apertura de una Season (especial=true). TapeBlock
 * chico: no depende del color de la Season, así funciona igual en listas
 * que mezclan varias Seasons a la vez (/fechas).
 */
export default function ExperienceBadge({ className = "" }: { className?: string }) {
  return (
    <TapeBlock
      as="span"
      edge={3}
      rotate={-1}
      className={`text-[10px] font-bold uppercase tracking-[0.1em] ${className}`}
    >
      Experience
    </TapeBlock>
  );
}
