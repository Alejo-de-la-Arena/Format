"use client";

import { useId, type CSSProperties } from "react";
import { useMusic } from "@/components/MusicProvider";
import styles from "./navigation.module.css";

export default function MusicControls() {
  const { isPlaying, volume, toggle, setVolume } = useMusic();
  const volumeId = useId();
  const label = isPlaying ? "Pausar música" : "Reanudar música";

  return (
    <div className={styles.musicControls}>
      <button type="button" onClick={toggle} className={styles.musicToggle} aria-label={label} title={label}>
        <span className={styles.soundIcon} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square">
            <path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor" stroke="none" />
            {isPlaying ? <path d="M16 9.2c1.1 1.5 1.1 4.1 0 5.6M19 6.7c2.45 2.9 2.45 7.7 0 10.6" /> : <path d="M17 9l4 6M21 9l-4 6" />}
          </svg>
        </span>
        <span className={styles.musicLabel}>{label}</span>
      </button>
      <label className={styles.volumeControl} htmlFor={volumeId}>
        <span className="sr-only">Volumen</span>
        <input
          id={volumeId}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volumen de la música"
          style={{ "--music-volume": `${volume * 100}%` } as CSSProperties}
        />
      </label>
    </div>
  );
}
