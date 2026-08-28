"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

/**
 * Envuelve contenido con animaciones CSS y las pausa cuando el bloque sale
 * del viewport, para no repintar de fondo algo que no se ve. Marca
 * `data-inview="false"` en el wrapper; el CSS que quiera pausar sus
 * animaciones cuelga de ese atributo (ver `[data-inview="false"]` en
 * globals.css). Si no hay IntersectionObserver, queda siempre activo.
 */
export default function InViewportPause({
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-inview={inView ? "true" : "false"} {...props}>
      {children}
    </div>
  );
}
