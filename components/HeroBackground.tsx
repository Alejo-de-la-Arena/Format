"use client";

import { useEffect, useRef } from "react";
import type { Forma } from "@/lib/types";

/** Fijo — mismo valor que --color-paper en app/globals.css. */
const PAPER = "#c8d0d2";

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

  vec2 rotatePoint(vec2 p, float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, -s, s, c) * p;
  }

  // Eight print treatments of ONE identity. No future Season shapes.
  float sdVariant(vec2 p, float shapeId, float variantId, float r) {
    float d = 1.0;
    if (variantId < 0.5) d = sdShape(rotatePoint(p, sin(uTime * .4) * .12), shapeId, r);
    else if (variantId < 1.5) d = abs(sdShape(p, shapeId, r)) - .07;
    else if (variantId < 2.5) d = min(min(
      abs(sdShape(p, shapeId, r)) - .035,
      abs(sdShape(rotatePoint(p, .16), shapeId, r * .66)) - .03),
      sdShape(p, shapeId, r * .28));
    else if (variantId < 3.5) {
      vec2 q = abs(p) - vec2(.36 + .07 * sin(uTime * 1.5));
      d = sdShape(rotatePoint(q, sin(uTime) * .16), shapeId, r * .36);
    }
    else if (variantId < 4.5) d = abs(sdShape(rotatePoint(p, .7854), shapeId, r * .92)) - .09;
    else if (variantId < 5.5) d = min(
      abs(sdShape(p - vec2(.13, .10), shapeId, r)) - .035,
      abs(sdShape(p + vec2(.13, .10), shapeId, r)) - .035);
    else if (variantId < 6.5) d = min(
      abs(sdShape(rotatePoint(p, -.25), shapeId, r)) - .04,
      abs(sdShape(rotatePoint(p, .35), shapeId, r * .68)) - .04);
    else {
      vec2 tiled = mod(p + .27, .54) - .27;
      d = max(sdShape(tiled, shapeId, .23), sdShape(p, shapeId, r * 1.05));
    }
    return d;
  }

  // Máscara de forma [0,1] en un punto uv dado, con warp + envolvente ya aplicados.
  float shapeMaskAt(vec2 uv, float phase) {
    vec2 aspect = uResolution.x > uResolution.y
      ? vec2(uResolution.x / uResolution.y, 1.0)
      : vec2(1.0, uResolution.y / uResolution.x);
    vec2 center = vec2(.5, .52);
    vec2 p = (uv - center) * 2.0 * aspect;
    p -= vec2(sin(uTime * .25), cos(uTime * .31)) * .09;
    p += vec2(snoise(p + uTime * .12), snoise(p + vec2(5.2,1.3) + uTime * .12)) * .075;
    p += uPointer * .045;
    float id = mod(floor(phase), 8.0);
    float nextId = mod(id + 1.0, 8.0);
    float morph = smoothstep(.56, 1.0, fract(phase));
    float d = mix(sdVariant(p, uShape, id, 1.18), sdVariant(p, uShape, nextId, 1.18), morph);
    return 1.0 - smoothstep(-.028, .028, d);
  }

  void main() {
    vec2 uv = vUv;

    // Fixed registration grid: no breathing density / crawling while scrolling.
    float phase = uTime / 2.8;
    float aspectRatio = uResolution.x / uResolution.y;
    vec2 density = vec2(48.0 * aspectRatio, 48.0);
    vec2 cellUv = (floor(uv * density) + 0.5) / density;
    float mask = shapeMaskAt(cellUv, phase);
    float grain = fract(sin(dot(floor(uv * density), vec2(12.9898,78.233))) * 43758.5453);
    float amt = clamp(.045 + grain * .055 + mask * .89, 0.0, 1.0);

    vec2 grid = fract(uv * density) - 0.5;
    float cellDist = mix(length(grid), max(abs(grid.x),abs(grid.y)), .5 + .5 * sin(uTime * .7));

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
  paused = false,
}: {
  forma: Forma;
  accent: string;
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const updateRef = useRef<() => void>(() => {});
  useEffect(() => { pausedRef.current = paused; updateRef.current(); }, [paused]);

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
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
      } catch {
        return;
      }
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        uTime: { value: 0.7 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uAccent: { value: new THREE.Vector3(...hexToVec3(accent)) },
        uPaper: { value: new THREE.Vector3(...hexToVec3(PAPER)) },
        uShape: { value: SHAPE_INDEX[forma] },
        uPointer: { value: new THREE.Vector2(0, 0) },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      let lastW = 0;
      let lastH = 0;
      function resize(width: number, height: number) {
        if (!width || !height || (lastW === width && lastH === height)) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 ? 1 : 1.5));
        renderer.setSize(width, height, false);
        uniforms.uResolution.value.set(
          width * renderer.getPixelRatio(),
          height * renderer.getPixelRatio(),
        );
        lastW = width;
        lastH = height;
        renderer.render(scene, camera);
      }
      resize(parent.clientWidth, parent.clientHeight);
      // Observe the stable svh host, not browser chrome resize events.
      const ro = new ResizeObserver(([entry]) => resize(entry.contentRect.width, entry.contentRect.height));
      ro.observe(parent);

      // Puntero: posición relativa al centro del hero, suavizada.
      const pointerTarget = { x: 0, y: 0 };
      const pointerCurrent = { x: 0, y: 0 };
      function onPointerMove(e: PointerEvent) {
        if (e.pointerType !== "mouse" || !running) return;
        const r = parent!.getBoundingClientRect();
        pointerTarget.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointerTarget.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
      }
      const resetPointer = () => { pointerTarget.x = 0; pointerTarget.y = 0; };
      parent.addEventListener("pointermove", onPointerMove, { passive: true });
      parent.addEventListener("pointerleave", resetPointer);

      let raf = 0;
      let inView = true;
      let running = false;
      let previousTime = 0;

      function updateRunning() {
        const next = inView && !document.hidden && !motion.matches && !pausedRef.current;
        canvas!.dataset.motion = next ? "running" : "paused";
        if (next === running) return;
        running = next;
        previousTime = 0;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(frame);
      }

      function frame(t: number) {
        if (!running) return;
        // Elapsed visible time, so resuming never jumps to another shape.
        const dt = previousTime ? Math.min((t - previousTime) / 1000, .05) : 0;
        previousTime = t;
        uniforms.uTime.value += dt;
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;
        uniforms.uPointer.value.set(pointerCurrent.x, pointerCurrent.y);
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
      motion.addEventListener("change", updateRunning);
      updateRef.current = updateRunning;
      updateRunning();

      cleanup = () => {
        io.disconnect();
        ro.disconnect();
        updateRef.current = () => {};
        document.removeEventListener("visibilitychange", onVisibility);
        motion.removeEventListener("change", updateRunning);
        parent.removeEventListener("pointermove", onPointerMove);
        parent.removeEventListener("pointerleave", resetPointer);
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
