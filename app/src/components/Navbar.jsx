import { useMemo, useState } from "react";
import { ChevronDown, User, LogOut, Settings, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Navbar({
  usuario,
  cuentas = [],
  cuentaActual,
  onCambiarCuenta,
  estadoNodo = "ok",
}) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
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

  const handleCopiarCuenta = (e) => {
    e.stopPropagation();
    if (numeroCuenta) {
      navigator.clipboard.writeText(numeroCuenta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
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
          onClick={() => navigate("/transferencia")}
          className="bg-blue-700 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-800 transition shadow-md shadow-blue-200"
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

              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-gray-500 capitalize">
                  {tipoCuenta} {numeroCuenta && `· ${numeroCuenta}`}
                </p>
                {numeroCuenta && (
                  <div
                    onClick={handleCopiarCuenta}
                    className="p-1.5 rounded-md hover:bg-gray-200 transition text-gray-400 hover:text-gray-600 cursor-pointer"
                    title="Copiar número de cuenta"
                  >
                    {copiado ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </div>
                )}
              </div>
            </div>

            <ChevronDown
              size={18}
              className={`text-gray-500 transition ${
                abierto ? "rotate-180" : ""
              }`}
            />
          </button>

          {abierto && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900">
                  Opciones de cuenta
                </p>
                <p className="text-xs text-gray-500">
                  Gestiona tu perfil y sesión
                </p>
              </div>

              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    setAbierto(false);
                    navigate("/cliente");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left text-sm font-semibold text-gray-700 hover:text-blue-700"
                >
                  <Settings size={18} className="text-blue-500" />
                  Configurar cuenta
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("nexus_token");
                    sessionStorage.removeItem("nexus_token");
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-left text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  <LogOut size={18} className="text-red-500" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}