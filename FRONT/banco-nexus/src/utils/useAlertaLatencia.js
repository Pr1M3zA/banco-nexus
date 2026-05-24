import { useState, useCallback } from "react";

/**
 * Hook reutilizable para manejar alertas de latencia con prioridad.
 *
 * - 'error' nunca es sobrescrito por 'warn'
 * - Expone registrarAlerta, limpiarAlerta y el estado alerta
 */
export function useAlertaLatencia() {
  const [alerta, setAlerta] = useState(null);

  const registrarAlerta = useCallback((nueva) => {
    if (!nueva) return;
    setAlerta((actual) => {
      // error tiene mayor prioridad que warn
      if (actual?.tipo === "error" && nueva.tipo === "warn") return actual;
      return nueva;
    });
  }, []);

  const limpiarAlerta = useCallback(() => setAlerta(null), []);

  return { alerta, registrarAlerta, limpiarAlerta };
}
