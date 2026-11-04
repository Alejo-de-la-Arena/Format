import { PlantSprig } from "@/components/JunglePlants";
import styles from "./hero-plants.module.css";

function Plant({ kind }: { kind: "fern" | "palm" | "monstera" | "vine" | "strelitzia" }) {
  return <svg viewBox="-65 -165 130 175" fill="currentColor" aria-hidden="true" focusable="false">
    {kind === "fern" && <>
      {[-35, 4, 38].map((angle, i) => <g key={angle} transform={`rotate(${angle}) scale(${i === 1 ? 2.7 : 2.1})`}><PlantSprig variant={1} /></g>)}
    </>}
    {kind === "palm" && <>
      <path d="M-3 6 Q9-42 0-77 L4-77 Q15-42 2 6Z" />
      {[-74, -42, -8, 32, 69].map((angle) => <g key={angle} transform={`translate(2 -72) rotate(${angle}) scale(.75 1.5)`}><PlantSprig variant={1} /></g>)}
    </>}
    {kind === "monstera" && <>
      <path d="M-1 6 Q-9-37 8-86 L11-85 Q-5-34 2 6Z" />
      <g transform="translate(7 -76) rotate(19)">
        <path d="M0 0 C-14-1-39-18-43-39 L-18-29-45-47 Q-48-58-41-65 L-16-44-37-73 Q-32-84-21-83 L-5-57-14-87 Q-2-95 6-79 Q16-95 30-85 L15-57 39-77 Q49-69 46-58 L21-41 46-49 Q52-33 38-23 L15-18 30-16 Q15-1 0 0Z" />
        <path d="M0-4 Q6-39 7-75 M5-28-23-54 M7-40 31-62" fill="none" stroke="var(--color-paper)" strokeWidth="1.4" />
        <ellipse cx="-9" cy="-39" rx="3" ry="6" fill="var(--color-paper)" transform="rotate(-25 -9 -39)" />
        <ellipse cx="19" cy="-32" rx="3" ry="5" fill="var(--color-paper)" transform="rotate(30 19 -32)" />
      </g>
      <g transform="translate(-2 -30) rotate(-58) scale(.65)"><PlantSprig variant={2} /></g>
    </>}
    {kind === "vine" && <g transform="scale(1.8 2.9)"><PlantSprig variant={0} /></g>}
    {kind === "strelitzia" && <>
      <path d="M2 7 Q-5-49 9-122 M0 7 Q-15-35-38-78 M3 7 Q19-29 39-63" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7-53 C-13-76-15-127 16-155 C30-121 25-79 7-53Z" />
      <path d="M-17-35 C-45-39-62-67-56-103 C-26-90-8-60-17-35Z" />
      <path d="M18-23 C13-49 32-85 58-93 C61-62 44-32 18-23Z" />
      <path d="M6-56 Q5-104 16-149 M-18-39 Q-32-69-53-98 M20-27 Q37-61 55-87" fill="none" stroke="var(--color-paper)" strokeWidth="1" />
      <path d="M10-102-2-116 M9-88 22-104 M-35-70-45-69 M36-57 49-58" fill="none" stroke="var(--color-paper)" strokeWidth=".6" />
    </>}
  </svg>;
}

/** Fixed paper cutouts frame the hero; the geometric shader moves independently. */
export default function HeroPlants() {
  return <div className={styles.frame} aria-hidden="true" data-hero-plants>
    <div className={styles.topLeft}><Plant kind="palm" /></div>
    <div className={styles.topRight}><Plant kind="vine" /></div>
    <div className={styles.left}><Plant kind="vine" /></div>
    <div className={styles.right}><Plant kind="fern" /></div>
    <div className={styles.bottomLeft}><Plant kind="strelitzia" /></div>
    <div className={styles.bottomRight}><Plant kind="monstera" /></div>
  </div>;
}
