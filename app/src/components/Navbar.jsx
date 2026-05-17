import { useMemo, useState } from "react";
import { ChevronDown, Check, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Navbar({
  usuario,
  cuentas = [],
  cuentaActual,
  onCambiarCuenta,
}) {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  const cuentaSeleccionada = useMemo(() => {
    return cuentas.find((c) => c.cuenta === cuentaActual);
  }, [cuentas, cuentaActual]);

  const nombre = cuentaSeleccionada?.cliente || usuario?.nombre || "Usuario";
  const tipoCuenta = cuentaSeleccionada?.tipo || usuario?.tipoCuenta || "";
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

                        <p className="text-sm text-gray-500 capitalize">
                          {c.tipo} · {c.cuenta}
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