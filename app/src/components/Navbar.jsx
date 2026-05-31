import { useMemo, useState } from "react";
import { ChevronDown, Check, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Navbar({
  usuario,
  cuentas = [],
  cuentaActual,
  onCambiarCuenta,
  estadoNodo = "ok",
}) {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  const cuentaSeleccionada = useMemo(() => {
    return cuentas.find((c) => c.cuenta === cuentaActual);
  }, [cuentas, cuentaActual]);

  const formatoTipoCuenta = (tipo) => {
    const t = (tipo || "").toLowerCase();
    if (t === "ahorro") return "Ahorro";
    if (t === "nomina") return "Nómina";
    if (t === "corriente") return "Crédito";
    return tipo;
  };

  const nombre = cuentaSeleccionada?.cliente || usuario?.nombre || "Usuario";
  const tipoCuenta = formatoTipoCuenta(cuentaSeleccionada?.tipo || usuario?.tipoCuenta || "");
  const numeroCuenta = cuentaSeleccionada?.cuenta || cuentaActual || "";

  const cambiarCuenta = (cuenta) => {
    onCambiarCuenta(cuenta);
    setAbierto(false);
  };

  return (
    <div className="flex items-center justify-between mb-10">
      <div>
        <h1 className="text-4xl font-bold">
          Bienvenido, {nombre}
        </h1>

        <p className="text-gray-500 mt-2">
          Aquí tienes el resumen de tu cuenta
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Status del Nodo Activo (Compacto y Elegante, sin estorbar) */}
        {estadoNodo && (
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 select-none mr-2">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                estadoNodo === "ok" ? "bg-emerald-400" : estadoNodo === "lento" ? "bg-amber-400" : "bg-red-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                estadoNodo === "ok" ? "bg-emerald-500" : estadoNodo === "lento" ? "bg-amber-500" : "bg-red-500"
              }`}></span>
            </span>
            <span className="tracking-wider uppercase pt-0.5">
              {estadoNodo === "ok" ? "Nodo Principal Activo" : estadoNodo === "lento" ? "Latencia Elevada" : "Servidor Desconectado"}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate("/consulta", { state: { origin: "transferencia" } })}
          className="bg-blue-700 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-800 transition"
        >
          + Nueva Transferencia
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAbierto(!abierto)}
            className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm min-w-72 hover:bg-gray-50 transition"
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
              <User size={24} className="stroke-[1.5]" />
            </div>

            <div className="flex-1 text-left">
              <p className="font-bold text-gray-900 leading-tight">
                {nombre}
              </p>

              <p className="text-sm text-gray-500 capitalize">
                {tipoCuenta} {numeroCuenta && `· ${numeroCuenta}`}
              </p>
            </div>

            <ChevronDown
              size={18}
              className={`text-gray-500 transition ${
                abierto ? "rotate-180" : ""
              }`}
            />
          </button>

          {abierto && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  Seleccionar cuenta
                </p>
                <p className="text-xs text-gray-500">
                  Cambia la cuenta mostrada en el dashboard
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {cuentas.length > 0 ? (
                  cuentas.map((c) => (
                    <button
                      key={c.cuenta}
                      type="button"
                      onClick={() => cambiarCuenta(c.cuenta)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition text-left"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {c.cliente}
                        </p>

                        <p className="text-sm text-gray-500">
                          {formatoTipoCuenta(c.tipo)} · {c.cuenta}
                        </p>
                      </div>

                      {c.cuenta === cuentaActual && (
                        <Check size={18} className="text-blue-700" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-5 text-sm text-gray-500">
                    No hay cuentas disponibles.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}