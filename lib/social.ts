/**
 * Cuentas oficiales de FORMAT. Único lugar donde viven estas URLs — Nav,
 * Footer, /fechas y /eventos/[slug] las toman de acá para que no se
 * desincronicen.
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/format.lab_/",
  youtube: "https://www.youtube.com/@Format-lab",
  /** TODO: pendiente de URL real. Apunta a la home de SoundCloud hasta que
   *  exista la cuenta — definir con el cliente si va o se saca. */
  soundcloud: "https://soundcloud.com",
} as const;

/**
 * Atributos para abrir un link externo en pestaña nueva sin exponer el
 * `window.opener` de la página. Se spreadea en el `<a>`.
 */
export const EXTERNAL_LINK = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
