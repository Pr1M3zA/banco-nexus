import { useState, useEffect } from "react";
import { AlertTriangle, XCircle, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { obtenerHistorialAlertas } from "../utils/fetchConAlerta";

/**
 * Banner de alerta reutilizable.
 *
 * Props:
 *   alerta  – { tipo:'warn'|'error', mensaje:string, ms?:number } | null
 *   onClose – función para cerrar el banner
 */
export default function AlertaBanner({ alerta, onClose }) {
  const [expandido, setExpandido] = useState(false);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (alerta) {
      setHistorial(obtenerHistorialAlertas());
      setExpandido(false); // colapsa al aparecer una nueva alerta
    }
  }, [alerta]);

  if (!alerta) return null;

  const esError = alerta.tipo === "error";

  const colorBase  = esError ? "bg-red-50 border-red-200 text-red-700"       : "bg-amber-50 border-amber-200 text-amber-700";
  const colorPanel = esError ? "bg-red-100/50 border-red-200"                 : "bg-amber-100/50 border-amber-200";
  const badgeColor = esError ? "bg-red-200 text-red-800"                      : "bg-amber-200 text-amber-800";

  return (
    <div
      className={`rounded-2xl mb-6 shadow-sm border overflow-hidden ${colorBase}`}
      role="alert"
      aria-live="assertive"
    >
      {/* ── Fila principal ──────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-4">

        {/* Icono */}
        <span className="flex-shrink-0 text-xl">
          {esError ? <XCircle size={22} /> : <AlertTriangle size={22} />}
        </span>

        {/* Mensaje */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">
            {esError ? "🔴 Error de conectividad — nodo primario" : "⚠️ Latencia elevada detectada"}
          </p>
          <p className="text-sm mt-0.5 opacity-80 truncate">{alerta.mensaje}</p>
          {alerta.ms > 0 && (
            <p className="text-xs mt-1 font-mono opacity-50">{alerta.ms} ms</p>
          )}
        </div>

        {/* Botón historial (solo si hay más de 1 evento) */}
        {historial.length > 1 && (
          <button
            onClick={() => setExpandido((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold opacity-60 hover:opacity-100 transition whitespace-nowrap shrink-0"
            title="Ver historial de eventos"
          >
            {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {historial.length} eventos
          </button>
        )}

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="shrink-0 ml-1 opacity-40 hover:opacity-100 transition"
          aria-label="Cerrar alerta"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Panel historial expandible ──────────────────────────── */}
      {expandido && historial.length > 0 && (
        <div className={`border-t px-6 py-4 space-y-3 ${colorPanel}`}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">
            Historial de eventos · sesión actual
          </p>
          {historial.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <Clock size={12} className="mt-0.5 shrink-0 opacity-40" />
              <div className="min-w-0">
                <span className={`inline-block text-[10px] font-bold rounded px-1.5 py-0.5 mr-2 ${
                  item.tipo === "error" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                }`}>
                  {item.tipo === "error" ? "ERROR" : "WARN"}
                </span>
                {item.timestamp && (
                  <span className="opacity-50">
                    {new Date(item.timestamp).toLocaleTimeString("es-MX")}
                  </span>
                )}
                {item.ms > 0 && (
                  <span className="ml-2 font-mono opacity-40">{item.ms} ms</span>
                )}
                <p className="mt-0.5 opacity-75 break-words">{item.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
