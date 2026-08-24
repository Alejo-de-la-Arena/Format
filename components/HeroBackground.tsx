"use client";

import { useEffect, useRef } from "react";
import type { Forma } from "@/lib/types";

/** Fijo — mismo valor que --color-paper en app/globals.css. */
const PAPER = "#c8d0d2";

/** ~65% más rápido que tiempo real, aplicado al reloj del shader. */
const TIME_SCALE = 1.65;

/** season.forma → índice de forma para el uniform uShape del shader. */
const SHAPE_INDEX: Record<Forma, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  hexagon: 3,
  "hexagon-organic": 3,
  infinity: 4,
  cross: 5,
};

function hexToVec3(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform float uShape;
  uniform vec2 uPointer;
  uniform float uScroll;

  // Ashima simplex noise (2D), dominio público.
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187,0.366025403784439,
                        -0.577350269189626,0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5 * snoise(p);
    p *= 2.02;
    f += 0.25 * snoise(p);
    p *= 2.03;
    f += 0.125 * snoise(p);
    return f;
  }

  float sdCircle(vec2 p, float r) { return length(p) - r; }

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float sdTriangle(vec2 p, float r) {
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }

  float sdHexagon(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }

  float sdInfinity(vec2 p, float r) {
    float d1 = length(p - vec2(r * 0.55, 0.0)) - r * 0.62;
    float d2 = length(p + vec2(r * 0.55, 0.0)) - r * 0.62;
    float k = 0.35;
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
  }

  float sdCross(vec2 p, float r) {
    const float c = 0.70710678;
    vec2 p1 = mat2(c, -c, c, c) * p;
    vec2 p2 = mat2(c, c, -c, c) * p;
    return min(sdBox(p1, vec2(r, r * 0.3)), sdBox(p2, vec2(r, r * 0.3)));
  }

  float sdShape(vec2 p, float shapeId, float r) {
    if (shapeId < 0.5) return sdBox(p, vec2(r * 0.82));
    if (shapeId < 1.5) return sdCircle(p, r);
    if (shapeId < 2.5) return sdTriangle(p, r * 0.95);
    if (shapeId < 3.5) return sdHexagon(p, r * 0.9);
    if (shapeId < 4.5) return sdInfinity(p, r * 1.05);
    return sdCross(p, r * 0.8);
  }

  // Variantes de la forma de Season activa (uShape), no formas nuevas:
  // mismo sdShape con rotación, redondeo, contorno, anidado o proporción
  // distintos. 0=base 1=rombo 2=redondeada 3=contorno 4=anidada 5=estirada.
  float sdVariant(vec2 p, float shapeId, float variantId, float r) {
    if (variantId < 0.5) {
      return sdShape(p, shapeId, r);
    }
    if (variantId < 1.5) {
      float c = 0.70710678, s = 0.70710678;
      vec2 pr = mat2(c, -s, s, c) * p;
      return sdShape(pr, shapeId, r);
    }
    if (variantId < 2.5) {
      return sdShape(p, shapeId, r * 0.88) - r * 0.12;
    }
    if (variantId < 3.5) {
      float d = sdShape(p, shapeId, r);
      return abs(d) - r * 0.08;
    }
    if (variantId < 4.5) {
      float outer = abs(sdShape(p, shapeId, r)) - r * 0.06;
      float innerShape = sdShape(p, shapeId, r * 0.4);
      return min(outer, innerShape);
    }
    vec2 pp = vec2(p.x * 1.3, p.y * 0.78);
    return sdShape(pp, shapeId, r);
  }

  // Máscara de forma [0,1] en un punto uv dado, con warp + envolvente ya aplicados.
  float shapeMaskAt(vec2 uv, float envelope, float warpAmp, float variantId, vec2 drift) {
    vec2 aspect = uResolution.x > uResolution.y
      ? vec2(uResolution.x / uResolution.y, 1.0)
      : vec2(1.0, uResolution.y / uResolution.x);
    vec2 p = (uv - 0.5) * 2.0 * aspect;
    p -= drift;

    vec2 warp = vec2(
      fbm(p * 0.9 + vec2(0.0, 0.0) + uTime * 0.05),
      fbm(p * 0.9 + vec2(5.2, 1.3) + uTime * 0.05)
    );
    p += warp * warpAmp;
    p += uPointer * 0.06;
    p.y += uScroll * 0.1;

    float d = sdVariant(p, uShape, variantId, 1.0);
    float edge = 0.05;
    float mask = smoothstep(edge, -edge, d);
    return mask * envelope;
  }

  void main() {
    vec2 uv = vUv;

    float cycleSpeed = 0.08;
    float cyc = fract(uTime * cycleSpeed);
    // Coseno elevado: envolvente 0→1→0 con derivada continua en todo el
    // loop, incluido el punto de wrap — la onda triangular anterior tenía
    // un quiebre ahí que se sentía como un salto.
    float envelope = 0.5 - 0.5 * cos(cyc * 6.28318530718);
    // Perturbación chica relativa al radio de la forma (~0.5) — deforma el
    // borde sin destruir la silueta, un poco más cuando está disolviéndose.
    float warpAmp = mix(0.2, 0.08, envelope);

    // Una variante distinta de la forma por ciclo. El cambio cae siempre en
    // el wrap de cyc, donde envelope ya es 0 (forma invisible), así nunca
    // se ve el corte entre variantes.
    float variantId = mod(floor(uTime * cycleSpeed), 6.0);

    // Centro de la forma a la deriva: recorre distintas zonas del canvas de
    // forma continua y orgánica en vez de quedar fijo en el medio. Rango
    // acotado para que la forma ocupe más área visible en todo momento.
    vec2 drift = vec2(
      fbm(vec2(uTime * 0.025, 12.4)),
      fbm(vec2(uTime * 0.021, 58.1))
    ) * 0.35;

    // Grilla corregida por aspect ratio para que las celdas (y los puntos)
    // sean cuadradas/circulares en píxeles reales, no en UV normalizado.
    // La densidad oscila lento entre trama fina y gruesa — variación extra
    // de la familia "cuadrada" sin tocar la silueta (ver sdVariant).
    float densityWobble = 0.86 + 0.32 * sin(uTime * 0.11);
    float aspectRatio = uResolution.x / uResolution.y;
    vec2 density = vec2(44.0 * aspectRatio, 44.0) * densityWobble;
    vec2 cellUv = (floor(uv * density) + 0.5) / density;
    float mask = shapeMaskAt(cellUv, envelope, warpAmp, variantId, drift);

    float grain = fbm(cellUv * 18.0 + 40.0) * 0.5 + 0.5;
    float base = 0.05 + grain * 0.05;
    float amt = clamp(base + mask * 0.85, 0.0, 1.0);

    vec2 grid = fract(uv * density) - 0.5;
    float cellDist = length(grid);

    float minR = 0.05;
    float maxR = 0.46;
    float dotR = mix(minR, maxR, amt);
    float aa = 0.035;
    float dot = 1.0 - smoothstep(dotR - aa, dotR + aa, cellDist);

    vec3 color = mix(uPaper, uAccent, dot);
    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Fondo animado del hero: trama halftone a pantalla completa donde la
 * forma de la Season se arma y disuelve en loop, deformada por un flow
 * field de ruido (domain warping) evaluado sobre un SDF. Un único plano +
 * shader custom, sin partículas ni geometría instanciada.
 *
 * Vive sólo en el hero. Decorativo: si WebGL o three fallan, el <header>
 * ya tiene bg-paper propio y se ve igual. Respeta prefers-reduced-motion
 * (un frame estático). Pausa fuera de viewport / pestaña oculta.
 */
export default function HeroBackground({
  forma,
  accent,
}: {
  forma: Forma;
  accent: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        uTime: { value: reduce ? 4.0 : 0.0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uAccent: { value: new THREE.Vector3(...hexToVec3(accent)) },
        uPaper: { value: new THREE.Vector3(...hexToVec3(PAPER)) },
        uShape: { value: SHAPE_INDEX[forma] },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      function resize() {
        const r = parent!.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
        uniforms.uResolution.value.set(
          r.width * renderer.getPixelRatio(),
          r.height * renderer.getPixelRatio(),
        );
      }
      resize();
      window.addEventListener("resize", resize);

      // Puntero: posición relativa al centro del hero, suavizada.
      const pointerTarget = { x: 0, y: 0 };
      const pointerCurrent = { x: 0, y: 0 };
      function onPointerMove(e: PointerEvent) {
        const r = parent!.getBoundingClientRect();
        pointerTarget.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointerTarget.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
      }
      window.addEventListener("pointermove", onPointerMove);

      // Scroll: progreso 0-1 de cuánto pasó el hero por el viewport.
      const scrollTarget = { v: 0 };
      const scrollCurrent = { v: 0 };
      function onScroll() {
        const r = parent!.getBoundingClientRect();
        scrollTarget.v = Math.min(1, Math.max(0, 1 - r.top / Math.max(r.height, 1)));
      }
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      let raf = 0;
      let inView = true;
      let running = !reduce;

      function updateRunning() {
        const next = inView && !document.hidden && !reduce;
        if (next === running) return;
        running = next;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(frame);
      }

      function frame(t: number) {
        if (!running) return;
        uniforms.uTime.value = t * 0.001 * TIME_SCALE;
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;
        uniforms.uPointer.value.set(pointerCurrent.x, pointerCurrent.y);
        scrollCurrent.v += (scrollTarget.v - scrollCurrent.v) * 0.06;
        uniforms.uScroll.value = scrollCurrent.v;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }

      const io = new IntersectionObserver((entries) => {
        for (const e of entries) inView = e.isIntersecting;
        updateRunning();
      });
      io.observe(parent);

      const onVisibility = () => updateRunning();
      document.addEventListener("visibilitychange", onVisibility);

      if (reduce) renderer.render(scene, camera);
      else raf = requestAnimationFrame(frame);

      cleanup = () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [forma, accent]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full opacity-60"
    />
  );
}
