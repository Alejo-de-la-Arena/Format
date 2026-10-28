/**
 * Guardar una foto de la galería de una fecha pasada.
 *
 * Orden: 1) share sheet nativo con el archivo (iOS/Android → "Guardar imagen"),
 * 2) descarga vía `?download=` de Supabase Storage (fuerza attachment),
 * 3) abrir la imagen en una pestaña nueva.
 */

const SUPABASE_PUBLIC = "/storage/v1/object/public/";

export function galleryFileName(season: string, fecha: string, n: number): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return `format-${clean(season)}-${clean(fecha)}-${n}.webp`;
}

/**
 * true en dispositivos táctiles que pueden compartir archivos. Chrome en
 * Windows y Safari en macOS también exponen share(), pero en desktop
 * preferimos la descarga directa.
 */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

export async function fetchPhotoFile(src: string, name: string, signal?: AbortSignal): Promise<File> {
  const res = await fetch(src, { mode: "cors", signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/webp" });
}

function downloadUrl(src: string, name: string): string | null {
  try {
    const url = new URL(src, window.location.href);
    if (!url.pathname.includes(SUPABASE_PUBLIC)) return null;
    url.searchParams.set("download", name);
    return url.toString();
  } catch {
    return null;
  }
}

/** Resultado: "shared" | "cancelled" | "downloaded" | "opened". */
export type SaveResult = "shared" | "cancelled" | "downloaded" | "opened";

/**
 * `file` es opcional: si ya está precargado se comparte sin esperar la red,
 * así el gesto del usuario sigue vigente (Safari lo exige para share()).
 */
export async function savePhoto(src: string, name: string, file?: File | null): Promise<SaveResult> {
  if (canShareFiles()) {
    try {
      const shareFile = file ?? (await fetchPhotoFile(src, name));
      if (navigator.canShare({ files: [shareFile] })) {
        await navigator.share({ files: [shareFile] });
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Otro error (fetch, NotAllowedError por gesto vencido): seguimos al fallback.
    }
  }

  const href = downloadUrl(src, name);
  if (href) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return "downloaded";
  }

  window.open(src, "_blank", "noopener");
  return "opened";
}
