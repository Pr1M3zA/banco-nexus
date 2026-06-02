// ── Umbrales ──────────────────────────────────────────────────────────────────
const UMBRAL_LATENCIA_MS = 1000; // ⚠️ warning: respuesta lenta
const UMBRAL_CAIDA_MS   = 5000; // 🔴 error:   posible nodo caído
const MAX_REINTENTOS    = 2;    // reintentos extra antes de declarar caída
const RETRASO_MS        = 700;  // ms entre reintentos

// Historial en memoria (persiste mientras la pestaña esté abierta)
const _historial = [];

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wrapper de fetch con medición de latencia, reintentos automáticos y alertas.
 *
 * @param {string}      url
 * @param {RequestInit} opciones
 * @param {number}      reintentos  — intentos extra tras el primero
 * @returns {{ res: Response|null, ms: number, alerta: {tipo:'warn'|'error', mensaje:string}|null }}
 */
export async function fetchConAlerta(url, opciones = {}, reintentos = MAX_REINTENTOS) {
  let intentos = 0;

  // Extraer token para inyectarlo en cada petición automáticamente
  const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
  const customOptions = {
    ...opciones,
    headers: {
      ...opciones.headers,
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  };

  while (intentos <= reintentos) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, customOptions);
      const ms  = Date.now() - t0;

      let alerta = null;

      if (ms > UMBRAL_CAIDA_MS) {
        alerta = _mk('error',
          `Posible caída del nodo primario — respuesta en ${ms} ms`, ms, url);
      } else if (ms > UMBRAL_LATENCIA_MS) {
        alerta = _mk('warn',
          `Alta latencia detectada — el servidor respondió en ${ms} ms`, ms, url);
      }

      if (alerta) _historial.unshift(alerta);
      return { res, ms, alerta };

    } catch (_err) {
      intentos++;
      if (intentos <= reintentos) await _sleep(RETRASO_MS);
    }
  }

  // Todos los intentos fallaron
  const alerta = _mk('error',
    `Sin conexión con el servidor tras ${reintentos + 1} intento(s) — verifica el nodo primario`,
    0, url);
  _historial.unshift(alerta);
  return { res: null, ms: 0, alerta };
}

function _mk(tipo, mensaje, ms, url) {
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
