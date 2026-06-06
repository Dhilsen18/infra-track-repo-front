/**
 * Política HTTP para demos donde MockAPI solo expone GET (y opcionalmente POST para altas).
 * El profesor verá en la pestaña Red principalmente GET (+ POST si `allowPost` es true).
 *
 * - `allowPutDelete: false` → la app no llama PUT ni DELETE; los botones / toggles quedan deshabilitados.
 * - `allowPost: true` → se permiten POST de alta (maquinaria, alertas, nodos IoT, mantenimiento).
 *
 * Cambia a `true` cuando tu backend soporte escritura completa.
 */
export const INFRATRACK_HTTP_POLICY = {
  allowPutDelete: false,
  allowPost: true,
} as const;

export function infratrackPutDeleteAllowed(): boolean {
  return INFRATRACK_HTTP_POLICY.allowPutDelete;
}

export function infratrackPostAllowed(): boolean {
  return INFRATRACK_HTTP_POLICY.allowPost;
}
