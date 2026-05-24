// la medicion dde latencia
const UMBRAL_LATENCIA_MS = 1000; // alerta amarilla es respuesta lenta
const UMBRAL_CAIDA_MS = 5000;   // alerta roja puede ser posible nodo caído

/**
 * Wrapper de fetch que mide latencia
 @param {string} url
 @param {RequestInit} opciones
 @returns {{ res: Response|null, ms: number, alerta: {tipo: 'warn'|'error', mensaje: string}|null }}
 */
export async function fetchConAlerta(url, opciones = {}) {
  const inicio = Date.now();

  try {
    const res = await fetch(url, opciones);
    const ms = Date.now() - inicio;

    let alerta = null;

    if (ms > UMBRAL_CAIDA_MS) {
      alerta = {
        tipo: 'error',
        mensaje: `Posible caída del nodo primario respuesta en ${ms}ms`,
      };
    } else if (ms > UMBRAL_LATENCIA_MS) {
      alerta = {
        tipo: 'warn',
        mensaje: `Alta latencia detectada  el servidor respondio en ${ms}ms`,
      };
    }

    return { res, ms, alerta };
  } catch {
    // fetch falló completamente
    const ms = Date.now() - inicio;
    return {
      res: null,
      ms,
      alerta: {
        tipo: 'error',
        mensaje: 'No se pudo conectar al servidor — verifica el estado del nodo primario',
      },
    };
  }
}
