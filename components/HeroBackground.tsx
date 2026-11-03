"use client";

import { useEffect, useRef, useState } from "react";
import type { Forma } from "@/lib/types";
import { isDoubleLine, normalizeForma } from "@/lib/season-shape";

/** Fijo — mismo valor que --color-paper en app/globals.css. */
const PAPER = "#c8d0d2";
// CSS pixels and cell units: tunable without changing the shader equations.
const PULSE_RADIUS = .36;
const CELL_DESKTOP = 6;
const CELL_MOBILE = 3;
const RING_STROKE_CELLS = 1.5;
const RING_GAP_CELLS = 2.5;

/** season.forma → índice de forma para el uniform uShape del shader. */
const SHAPE_INDEX: Record<Forma, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  hexagon: 3,
  "hexagon-organic": 3,
  infinity: 4,
  cross: 5,
  "double-circle": 6,
  "double-diamond": 7,
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
  uniform float uCellPx;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform float uShape;
  uniform vec2 uPointer;

  // Modo actual, siguiente y mezcla (x, y, z). Los 8 tratamientos duran 2.8s.
  // Jungle (uShape 7) abre cada ciclo con la enredadera (id 8, 5.6s): el
  // contorno crece desde la esquina superior hasta cerrarse y después siguen
  // los 8 de siempre. Las demás formas conservan exactamente su timeline.
  const float VINE_ID = 8.0;
  const float VINE_SECONDS = 5.6;
  vec3 modeAt() {
    if (uShape > 6.5) {
      float local = mod(uTime, VINE_SECONDS + 8.0 * 2.8);
      if (local < VINE_SECONDS) return vec3(VINE_ID, 0.0, smoothstep(.8, 1.0, local / VINE_SECONDS));
      float phase = (local - VINE_SECONDS) / 2.8;
      float id = floor(phase);
      return vec3(id, id > 6.5 ? VINE_ID : id + 1.0, smoothstep(.56, 1.0, fract(phase)));
    }
    float phase = uTime / 2.8;
    float id = mod(floor(phase), 8.0);
    return vec3(id, mod(id + 1.0, 8.0), smoothstep(.56, 1.0, fract(phase)));
  }

  // Avance de la enredadera [0,1]: 0 mientras no le toca.
  float vineProgress() {
    float local = mod(uTime, VINE_SECONDS + 8.0 * 2.8);
    return local < VINE_SECONDS ? smoothstep(0.0, .78, local / VINE_SECONDS) : 0.0;
  }

  // Projection only: preserve the original mode equations and 2.8s timeline.
  // Conservative support includes drift, warp, pointer, outlines and antialiasing.
  float pulseFrameScale() {
    float radius = min(uResolution.x, uResolution.y) * ${PULSE_RADIUS};
    float units = radius / 1.18;
    float available = min(uResolution.x, uResolution.y) * .5 - uCellPx;
    vec3 mode = modeAt();
    float currentBound = abs(mode.x - 5.0) < .1 ? 1.8 : 1.6;
    float nextBound = abs(mode.y - 5.0) < .1 ? 1.8 : 1.6;
    float bound = mix(currentBound, nextBound, mode.z);
    return min(units, available / bound);
  }

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
  float sdRing(vec2 p, float r, float w) { return abs(length(p) - r) - w; }

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

  // Rombo (cuadrado girado 45°) de media diagonal r, esquinas redondeadas tipo neón.
  float sdRoundDiamond(vec2 p, float r) {
    const float c = 0.70710678;
    vec2 q = mat2(c, -c, c, c) * p;
    float b = r * c;
    float k = b * .18;
    return sdBox(q, vec2(b - k)) - k;
  }

  // Doble línea con el mismo grosor y separación en celdas que los anillos.
  float sdDoubleDiamond(vec2 p, float r, float halfWidth, float gap) {
    float d = sdRoundDiamond(p, r);
    float offset = 2.0 * halfWidth + gap;
    return min(abs(d) - halfWidth, abs(d + offset) - halfWidth);
  }

  // Small botanical silhouettes rooted on the diamond. Kept in the same
  // SDF as the outline so every print treatment carries its vegetation.
  float sdSprig(vec2 p, float kind, float progress) {
    if (abs(p.x) > .18 || p.y < -.02 || p.y > .43) return 1.0;
    float height = .38;
    float stemX = sin(p.y * 15.0) * .013;
    float d = max(abs(p.x - stemX) - .009, max(-p.y, p.y - height * progress));
    for (int i = 0; i < 5; i++) {
      float y = .055 + float(i) * .061;
      float size = (.066 - float(i) * .006) * smoothstep(y - .04, y + .035, progress * height);
      for (int side = 0; side < 2; side++) {
        float s = side == 0 ? -1.0 : 1.0;
        vec2 q = p - vec2(s * size * .77 + sin(y * 15.0) * .013, y + size * .4);
        q = vec2(q.x * .78 + q.y * s * .63, -q.x * s * .63 + q.y * .78);
        vec2 axes = vec2(max(size, .001), max(size * (kind < .5 ? .32 : .56), .001));
        float leaf = (length(q / axes) - 1.0) * min(axes.x, axes.y);
        d = min(d, leaf);
      }
    }
    return d;
  }
  float sdBotany(vec2 p, float r, float progress) {
    vec2 q = p / r;
    vec2 a = q - vec2(.54, .54);
    vec2 b = q - vec2(-.58, -.5);
    vec2 c = q - vec2(-.28, .8);
    float d = sdSprig(vec2((a.x - a.y) * .7071, (a.x + a.y) * .7071), 1.0, progress);
    d = min(d, sdSprig(vec2((b.x - b.y) * -.7071, (b.x + b.y) * -.7071), 0.0, progress));
    d = min(d, sdSprig(vec2(c.x * .94 + c.y * .34, -c.x * .34 + c.y * .94), 0.0, progress));
    return d * r;
  }

  float sdShape(vec2 p, float shapeId, float r) {
    if (shapeId < 0.5) return sdBox(p, vec2(r * 0.82));
    if (shapeId < 1.5) return sdCircle(p, r);
    if (shapeId < 2.5) return sdTriangle(p, r * 0.95);
    if (shapeId < 3.5) return sdHexagon(p, r * 0.9);
    if (shapeId < 4.5) return sdInfinity(p, r * 1.05);
    if (shapeId < 5.5) return sdCross(p, r * 0.8);
    float halfWidth = uCellPx * ${RING_STROKE_CELLS} * .5 / pulseFrameScale();
    float gap = uCellPx * ${RING_GAP_CELLS} / pulseFrameScale();
    if (shapeId > 6.5) return min(sdDoubleDiamond(p, r, halfWidth, gap), sdBotany(p, r, 1.0));
    return min(sdRing(p, r, halfWidth), sdRing(p, max(halfWidth, r - 2.0 * halfWidth - gap), halfWidth));
  }

  // Enredadera: el contorno doble aparece recorriéndolo en sentido horario
  // desde la esquina superior; la línea interior sigue a la exterior con un
  // leve retraso, como dos tallos. La punta se afina hacia adelante.
  float sdVine(vec2 p, float r, float progress) {
    float halfWidth = uCellPx * ${RING_STROKE_CELLS} * .5 / pulseFrameScale();
    float gap = uCellPx * ${RING_GAP_CELLS} / pulseFrameScale();
    float d = sdRoundDiamond(p, r);
    float t = fract(atan(p.x, p.y) / 6.2831853 + 1.0);
    float reach = r * 6.0;
    float outer = max(abs(d) - halfWidth, (t - progress * 1.08) * reach);
    float inner = max(abs(d + 2.0 * halfWidth + gap) - halfWidth, (t - (progress * 1.08 - .08)) * reach);
    return min(min(outer, inner), sdBotany(p, r, smoothstep(.12, .7, progress)));
  }

  vec2 rotatePoint(vec2 p, float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, -s, s, c) * p;
  }

  // Same field, amplitude and time as the original domain warp.
  vec2 flowAt(vec2 p) {
    return vec2(snoise(p + uTime * .12), snoise(p + vec2(5.2,1.3) + uTime * .12)) * .075;
  }

  // Circular SDFs ignore rotation: rotate the field's sampling frame instead.
  // Subtract the original field before replacing it, never adding a second warp.
  vec2 printPoint(vec2 p, vec2 noiseP, float angle, float shapeId) {
    if (shapeId < 5.5 || shapeId > 6.5) return rotatePoint(p, angle);
    return p - flowAt(noiseP) + rotatePoint(flowAt(rotatePoint(noiseP, angle)), -angle);
  }

  // Eight print treatments of ONE identity. No future Season shapes.
  float sdVariant(vec2 p, vec2 noiseP, float shapeId, float variantId, float r) {
    float d = 1.0;
    if (variantId > 7.5) d = sdVine(p, r, vineProgress());
    else if (variantId < 0.5) d = sdShape(printPoint(p, noiseP, sin(uTime * .4) * .12, shapeId), shapeId, r);
    else if (variantId < 1.5) d = abs(sdShape(p, shapeId, r)) - .07;
    else if (variantId < 2.5) d = min(min(
      abs(sdShape(p, shapeId, r)) - .035,
      abs(sdShape(printPoint(p, noiseP, .16, shapeId), shapeId, r * .66)) - .03),
      sdShape(p, shapeId, r * .28));
    else if (variantId < 3.5) {
      // Repeat without reflecting the top row into upside-down triangles.
      vec2 q = p - sign(p) * vec2(.36 + .07 * sin(uTime * 1.5));
      d = sdShape(printPoint(q, noiseP, sin(uTime) * .16, shapeId), shapeId, r * .36);
    }
    else if (variantId < 4.5) d = abs(sdShape(printPoint(p, noiseP, .7854, shapeId), shapeId, r * .92)) - .09;
    else if (variantId < 5.5) d = min(
      abs(sdShape(p - vec2(.13, .10), shapeId, r)) - .035,
      abs(sdShape(p + vec2(.13, .10), shapeId, r)) - .035);
    else if (variantId < 6.5) d = min(
      abs(sdShape(printPoint(p, noiseP, -.25, shapeId), shapeId, r)) - .04,
      abs(sdShape(printPoint(p, noiseP, .35, shapeId), shapeId, r * .68)) - .04);
    else {
      vec2 tiled = mod(p + .27, .54) - .27;
      d = max(sdShape(tiled, shapeId, .23), sdShape(p, shapeId, r * 1.05));
    }
    return d;
  }

  // Static reduced-motion contours retain the exact pixel-based radius and stroke.
  float pulsePair(vec2 p, float radius) {
    float halfWidth = uCellPx * ${RING_STROKE_CELLS} * .5;
    float gap = uCellPx * ${RING_GAP_CELLS};
    float inner = max(halfWidth + uCellPx, radius - 2.0 * halfWidth - gap);
    if (uShape > 6.5) return min(sdDoubleDiamond(p, radius, halfWidth, gap), sdBotany(p, radius, 1.0));
    return min(sdRing(p, radius, halfWidth), sdRing(p, inner, halfWidth));
  }
  // Máscara de forma [0,1] en un punto uv dado, con warp + envolvente ya aplicados.
  float shapeMaskAt(vec2 uv, float phase) {
    vec2 aspect = uResolution.x > uResolution.y
      ? vec2(uResolution.x / uResolution.y, 1.0)
      : vec2(1.0, uResolution.y / uResolution.x);
    vec2 center = vec2(.5, .52);
    vec2 p = uShape > 5.5
      ? (uv - .5) * uResolution / pulseFrameScale()
      : (uv - center) * 2.0 * aspect;
    p -= vec2(sin(uTime * .25), cos(uTime * .31)) * .09;
    vec2 noiseP = p;
    p += flowAt(noiseP);
    p += uPointer * .045;
    vec3 mode = modeAt();
    float d = mix(sdVariant(p, noiseP, uShape, mode.x, 1.18), sdVariant(p, noiseP, uShape, mode.y, 1.18), mode.z);
    return 1.0 - smoothstep(-.028, .028, d);
  }

  void main() {
    vec2 uv = vUv;

    // Fixed registration grid: no breathing density / crawling while scrolling.
    float phase = uTime / 2.8;
    float aspectRatio = uResolution.x / uResolution.y;
    vec2 density = uShape > 5.5 ? uResolution / uCellPx : vec2(48.0 * aspectRatio, 48.0);
    vec2 cellUv = (floor(uv * density) + 0.5) / density;
    float mask = shapeMaskAt(cellUv, phase);
    if (uShape > 5.5 && uTime == 0.0) {
      vec2 p = (cellUv - .5) * uResolution;
      float radius = min(uResolution.x, uResolution.y) * ${PULSE_RADIUS};
      mask = 1.0 - smoothstep(-uCellPx * .15, uCellPx * .15, pulsePair(p, radius));
    }
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
  const [initialized, setInitialized] = useState(false);
  // Wait for both the entrance and an idle period before importing/compiling WebGL.
  useEffect(() => {
    if (paused || initialized) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setInitialized(true));
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setInitialized(true), 100);
    return () => window.clearTimeout(id);
  }, [paused, initialized]);
  const pausedRef = useRef(paused);
  const updateRef = useRef<() => void>(() => {});
  useEffect(() => { pausedRef.current = paused; updateRef.current(); }, [paused]);

  useEffect(() => {
    if (!initialized) return;
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
        // Doble línea: arranca en 0 (cuadro estático con reduced motion; en
        // Jungle, además, el inicio de la enredadera).
        uTime: { value: isDoubleLine(normalizeForma(forma)) ? 0 : .7 },
        uCellPx: { value: CELL_DESKTOP },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uAccent: { value: new THREE.Vector3(...hexToVec3(accent)) },
        uPaper: { value: new THREE.Vector3(...hexToVec3(PAPER)) },
        uShape: { value: SHAPE_INDEX[normalizeForma(forma)] },
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
        uniforms.uCellPx.value = (width < 768 ? CELL_MOBILE : CELL_DESKTOP) * renderer.getPixelRatio();
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
  }, [forma, accent, initialized]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full opacity-60"
    />
  );
}
