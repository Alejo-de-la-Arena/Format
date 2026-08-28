"use client";

import { useEffect, type ReactNode } from "react";
import { useAnimate, useInView, useReducedMotion, stagger } from "motion/react";
import { useHomeMotion } from "./HomeMotion";

/** SSR stays readable; only animate a short print registration on first view. */
export default function HomeReveal({ children, className = "", staggered = false }: {
  children: ReactNode; className?: string; staggered?: boolean;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const visible = useInView(scope, { once: true, margin: "0px 0px -24px 0px" });
  const reduced = useReducedMotion();
  const { introOpen, ready } = useHomeMotion();
  useEffect(() => {
    if (!visible || reduced || introOpen || !ready) return;
    const targets = staggered ? Array.from(scope.current.children) : scope.current;
    const animation = animate(targets, {
      opacity: [0.55, 1], transform: ["translate3d(0,16px,0)", "translate3d(0,0,0)"],
    }, { duration: 0.4, delay: staggered ? stagger(0.075) : 0, ease: [0.22, 0.8, 0.3, 1] });
    return () => { animation.stop(); };
  }, [animate, introOpen, ready, reduced, scope, staggered, visible]);
  return <div ref={scope} data-home-reveal={staggered ? "stagger" : "single"} className={className}>{children}</div>;
}
