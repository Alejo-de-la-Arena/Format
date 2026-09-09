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
  startFromGesture: () => Promise<boolean>;
  toggle: () => void;
  setVolume: (volume: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const TRACK = "/music/Silent%20Drums%20VII%20(Original%20Mix).mp3";
const VOLUME_KEY = "format:music-volume:v1";

/** Un solo reproductor persistente. `play()` sólo se invoca desde un gesto. */
export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef(0.42);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.42);

  const startFromGesture = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    audio.volume = volumeRef.current;
    try {
      // Esta llamada ocurre síncronamente dentro del handler que la invoca.
      await audio.play();
      setIsPlaying(true);
      return true;
    } catch {
      setIsPlaying(false);
      return false;
    }
  }, []);

  useEffect(() => {
    try {
      const stored = Number.parseFloat(localStorage.getItem(VOLUME_KEY) ?? "");
      if (Number.isFinite(stored) && stored >= 0 && stored <= 1) {
        volumeRef.current = stored;
        setVolumeState(stored);
        if (audioRef.current) audioRef.current.volume = stored;
      }
    } catch { /* La preferencia es opcional. */ }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const resumeOnIntent = () => {
      void startFromGesture().then((started) => {
        if (started) controller.abort();
      });
    };
    const options = { signal: controller.signal, passive: true };
    window.addEventListener("pointerdown", resumeOnIntent, options);
    window.addEventListener("keydown", resumeOnIntent, options);
    window.addEventListener("wheel", resumeOnIntent, options);
    window.addEventListener("touchstart", resumeOnIntent, options);
    window.addEventListener("touchmove", resumeOnIntent, options);
    return () => controller.abort();
  }, [startFromGesture]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void startFromGesture();
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [startFromGesture]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.min(1, Math.max(0, nextVolume));
    volumeRef.current = normalized;
    if (audioRef.current) audioRef.current.volume = normalized;
    setVolumeState(normalized);
    try { localStorage.setItem(VOLUME_KEY, String(normalized)); } catch { /* Preferencia opcional. */ }
  }, []);

  const value = useMemo(
    () => ({ isPlaying, volume, startFromGesture, toggle, setVolume }),
    [isPlaying, volume, startFromGesture, toggle, setVolume],
  );

  return (
    <MusicContext.Provider value={value}>
      <audio ref={audioRef} src={TRACK} loop preload="auto"
        onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} aria-hidden="true" />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic debe usarse dentro de MusicProvider");
  return context;
}
