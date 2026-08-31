import { getShapePath } from "@/components/shapePaths";
import type { Forma } from "@/lib/types";
import styles from "./agenda.module.css";

export default function AgendaMasthead({ title, emphasis, note, forma }: {
  title: string; emphasis?: string; note: string; forma?: Forma;
}) {
  return <header className={styles.masthead}>
    <div className={styles.mastheadBody}>
      <h1>{title}{emphasis && <> <span>{emphasis}</span></>}</h1>
      <div className={styles.mastheadAside}>
        {forma && <svg aria-hidden viewBox="0 0 72 72">
          <path d={getShapePath(forma)} fill="none" stroke="currentColor" strokeWidth=".5" />
          <path d={getShapePath(forma)} fill="none" stroke="currentColor" strokeWidth=".5" transform="translate(9 7) scale(.72)" />
        </svg>}
        <p>{note}</p>
      </div>
    </div>
    <div className={styles.mastheadFoot}><span>JET / Buenos Aires</span><span>Todos los viernes</span><span aria-hidden>+ + +</span></div>
  </header>;
}
