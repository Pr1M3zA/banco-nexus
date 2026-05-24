// ── Umbrales ──────────────────────────────────────────────────────────────────
const UMBRAL_LATENCIA_MS = 1000; // ⚠️ alerta amarilla: respuesta lenta
const UMBRAL_CAIDA_MS   = 5000; // 🔴 alerta roja:    posible nodo caído
const MAX_REINTENTOS    = 2;    // intentos adicionales antes de declarar caída
const RETRASO_MS        = 700;  // pausa entre reintentos

// Historial de alertas en memoria (vive mientras la pestaña esté abierta)
const _historial = [];

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wrapper de fetch con medición de latencia, reintentos y alertas.
 *
 * @param {string}      url
 * @param {RequestInit} opciones
 * @param {number}      reintentos  — cuántos reintentos extra tras el primero
 * @returns {{ res: Response|null, ms: number, alerta: object|null }}
 */
export async function fetchConAlerta(url, opciones = {}, reintentos = MAX_REINTENTOS) {
  let intentos = 0;

  while (intentos <= reintentos) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, opciones);
      const ms  = Date.now() - t0;

      let alerta = null;

      if (ms > UMBRAL_CAIDA_MS) {
        alerta = _mkAlerta('error',
          `Posible caída del nodo primario — respuesta en ${ms} ms (umbral ${UMBRAL_CAIDA_MS} ms)`,
          ms, url);
      } else if (ms > UMBRAL_LATENCIA_MS) {
        alerta = _mkAlerta('warn',
          `Alta latencia detectada — el servidor respondió en ${ms} ms (umbral ${UMBRAL_LATENCIA_MS} ms)`,
          ms, url);
      }

      if (alerta) _historial.unshift(alerta);
      return { res, ms, alerta };

    } catch (_err) {
      intentos++;
      if (intentos <= reintentos) {
        await _sleep(RETRASO_MS);
      }
    }
  }

  // Todos los intentos fallaron → caída total
  const alerta = _mkAlerta('error',
    `Sin conexión con el servidor tras ${reintentos + 1} intento(s) — verifica el nodo primario`,
    0, url);
  _historial.unshift(alerta);
  return { res: null, ms: 0, alerta };
}

function _mkAlerta(tipo, mensaje, ms, url) {
  return { tipo, mensaje, ms, url, timestamp: new Date().toISOString() };
}

/** Devuelve copia del historial de alertas de esta sesión */
export function obtenerHistorialAlertas() {
  return [..._historial];
}

/** Vacía el historial */
export function limpiarHistorialAlertas() {
  _historial.length = 0;
}
