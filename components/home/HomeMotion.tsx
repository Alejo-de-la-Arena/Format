"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import SeasonIntro, { type IntroIdentity } from "./SeasonIntro";
import styles from "./home-motion.module.css";
import { usePathname } from "next/navigation";

const HomeMotionContext = createContext({ introOpen: false, ready: true });
export const useHomeMotion = () => useContext(HomeMotionContext);

export default function HomeMotion({ current, previous, children }: {
  current: IntroIdentity | null; previous: IntroIdentity | null; children: ReactNode;
}) {
  const [state, setState] = useState({ introOpen: false, ready: !current });
  const pathname = usePathname();
  const publicPage = !pathname.startsWith("/admin");
  return (
    <HomeMotionContext.Provider value={state}>
      <div className={styles.home} data-intro-open={state.introOpen || undefined}>
        {children}
        {current && publicPage && <SeasonIntro current={current} previous={previous} onState={setState} pathname={pathname} />}
      </div>
    </HomeMotionContext.Provider>
  );
}
