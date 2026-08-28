"use client";

import { useEffect, type ReactNode } from "react";
import { useAnimate, useInView, useReducedMotion } from "motion/react";
import styles from "./about.module.css";

/** Progressive enhancement: SSR and offscreen text stay visible. No layout animation. */
export default function AboutReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true, margin: "0px 0px -32px 0px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      // Also settle an entrance if the preference changes mid-animation.
      animate(scope.current, { opacity: 1, transform: "none" }, { duration: 0 });
      return;
    }
    if (!inView) return;
    const animation = animate(
      scope.current,
      {
        opacity: [0.65, 1],
        transform: ["translateY(12px) rotate(-0.35deg)", "translateY(0px) rotate(0deg)"],
      },
      { duration: 0.35, delay, ease: [0.22, 0.8, 0.3, 1] },
    );
    return () => animation.stop();
  }, [animate, delay, inView, reduced, scope]);

  return <div ref={scope} className={`${styles.reveal} ${className}`}>{children}</div>;
}
