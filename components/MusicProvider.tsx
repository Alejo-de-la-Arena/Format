"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type MusicContextValue = {
  isPlaying: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (volume: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const TRACK = "/music/Silent%20Drums%20VII%20(Original%20Mix).mp3";

/**
 * Único reproductor de la web. Se monta en el layout para que el track no se
 * reinicie al navegar. Los navegadores pueden bloquear audio sin gesto: en
 * ese caso se vuelve a intentar con la primera interacción del visitante.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.42);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // La UI queda en "Reanudar música" hasta que el navegador permita play.
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    void play();

    const resumeOnFirstIntent = () => void play();
    window.addEventListener("pointerdown", resumeOnFirstIntent, { once: true });
    window.addEventListener("keydown", resumeOnFirstIntent, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resumeOnFirstIntent);
      window.removeEventListener("keydown", resumeOnFirstIntent);
    };
  }, [play]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void play();
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [play]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.min(1, Math.max(0, nextVolume));
    const audio = audioRef.current;
    if (audio) audio.volume = normalized;
    setVolumeState(normalized);
  }, []);

  const value = useMemo(
    () => ({ isPlaying, volume, toggle, setVolume }),
    [isPlaying, volume, toggle, setVolume],
  );

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={TRACK}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        aria-hidden="true"
      />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic debe usarse dentro de MusicProvider");
  return context;
}
