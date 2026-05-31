import { useEffect, useMemo, useState, useCallback } from "react";
import { Wallet, ArrowUp, ArrowDown, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AlertMessage from "../components/AlertMessage";
import { fetchConAlerta } from "../utils/fetchConAlerta";

export default function Dashboard() {
  const cuentaInicial = "NX01001";

  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || cuentaInicial;
  });
  const [loading, setLoading] = useState(true);

  // ── Alerta latencia / nodo ─────────────────────────────────────────────────
  const [alertaLatencia, setAlertaLatencia] = useState({ type: "", message: "" });

  // Estado del nodo: 'ok' | 'lento' | 'caido'
  const [estadoNodo, setEstadoNodo] = useState("ok");

  const registrarAlerta = useCallback((alerta) => {
    if (!alerta) return;
    const type  = alerta.tipo === "error" ? "error" : "warning";
    const label = alerta.tipo === "error"
      ? "🔴 Nodo primario — " + alerta.mensaje
      : "⚠️ Latencia — " + alerta.mensaje;
    setAlertaLatencia((prev) => {
      // error no es reemplazado por warning
      if (prev.type === "error" && type === "warning") return prev;
      return { type, message: label };
    });
    setEstadoNodo((prev) =>
      alerta.tipo === "error" ? "caido" : prev === "ok" ? "lento" : prev
    );
  }, []);

  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo ?? 0;
  const obtenerNombreCliente = () =>
    datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () =>
    datosCuenta?.cuenta?.tipo || "";
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;

  const cargarCuentas = async () => {
    try {
      const { res, alerta } = await fetchConAlerta("http://localhost:3001/api/cuentas");
      registrarAlerta(alerta);
      if (!res) throw new Error("Sin conexión");
      const data = await res.json();
      const lista = data.cuentas && Array.isArray(data.cuentas) ? data.cuentas : [];
      setCuentas(lista);
      const cuentaGuardada = localStorage.getItem("cuentaActual");
      if (!cuentaGuardada && lista.length > 0) {
        const primera = lista[0].cuenta;
        setCuentaActual(primera);
        localStorage.setItem("cuentaActual", primera);
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      setCuentas([]);
    }
  };

  const cargarDatos = async (cuenta) => {
    setLoading(true);

    try {
      const { res: resCuenta, alerta: a1 } = await fetchConAlerta(
        `http://localhost:3001/api/cuenta/${cuenta}`
      );
      registrarAlerta(a1);
      if (!resCuenta) throw new Error("Sin conexión al servidor");
      const dataCuenta = await resCuenta.json();

      if (!resCuenta.ok) {
        throw new Error(dataCuenta.mensaje || "No se pudo cargar la cuenta");
      }

      const { res: resHistorial, alerta: a2 } = await fetchConAlerta(
        `http://localhost:3001/api/historial/${cuenta}`
      );
      registrarAlerta(a2);
      const dataHistorial = resHistorial ? await resHistorial.json() : { movimientos: [] };

      const listaMovimientos = Array.isArray(dataHistorial)
        ? dataHistorial
        : dataHistorial.movimientos || [];

      setDatosCuenta(dataCuenta);
      setMovimientos(listaMovimientos);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setDatosCuenta(null);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  useEffect(() => {
    if (cuentaActual) {
      localStorage.setItem("cuentaActual", cuentaActual);
      cargarDatos(cuentaActual);
    }
  }, [cuentaActual]);

  const ingresos = movimientos
    .filter((m) => m.tipo === "deposito")
    .reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const egresos = movimientos
    .filter((m) => m.tipo !== "deposito")
    .reduce((sum, m) => sum + Math.abs(Number(m.monto || 0)), 0);

  const chartData = useMemo(() => {
    if (!datosCuenta || movimientos.length === 0) return [];

    const ordenados = [...movimientos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    let saldo = obtenerSaldo() - ingresos + egresos;
    const points = [];

    // Agregar punto inicial de Apertura con la fecha de apertura real de la cuenta
    const fechaAperturaRaw = datosCuenta?.cuenta?.fechaApertura || datosCuenta?.fechaApertura;
    if (fechaAperturaRaw) {
      const fechaApertura = new Date(fechaAperturaRaw);
      points.push({
        fecha: fechaApertura.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        }),
        saldo: saldo,
      });
    } else if (ordenados.length > 0) {
      points.push({
        fecha: "Apertura",
        saldo: saldo,
      });
    }

    ordenados.forEach((m) => {
      if (m.tipo === "deposito") saldo += Number(m.monto || 0);
      else saldo -= Math.abs(Number(m.monto || 0));

      points.push({
        fecha: new Date(m.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        }),
        saldo,
      });
    });

    return points;
  }, [datosCuenta, movimientos, ingresos, egresos]);

  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando dashboard...</main>
      </div>
    );
  }

  if (!datosCuenta) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">
          No se pudo cargar la información de la cuenta.
        </main>
      </div>
    );
  }

  // Indicador nodo
  const nodoBadge = {
    ok:    { dot: "bg-green-500", label: "Nodo primario OK"  },
    lento: { dot: "bg-amber-400", label: "Latencia elevada"  },
    caido: { dot: "bg-red-500",   label: "Nodo caído"        },
  }[estadoNodo];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-10">
        <Navbar
          usuario={{
            nombre: obtenerNombreCliente(),
            tipoCuenta: obtenerTipoCuenta(),
          }}
          cuentas={cuentas}
          cuentaActual={cuentaActual}
          onCambiarCuenta={setCuentaActual}
          estadoNodo={estadoNodo}
        />

        {/* Banner latencia / nodo */}
        <AlertMessage
          type={alertaLatencia.type}
          message={alertaLatencia.message}
          onClose={() => setAlertaLatencia({ type: "", message: "" })}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Tarjeta de Saldo Disponible Compacta y Premium */}
            <section className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-100/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <Wallet size={24} className="text-blue-200" />
                </div>
                <div>
                  <p className="text-blue-100/80 text-xs font-semibold uppercase tracking-wider">Saldo Disponible</p>
                  <h2 className="text-3xl font-black mt-1 leading-none tracking-tight">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Cuenta Activa</p>
                <p className="font-bold text-sm text-white mt-1">{obtenerNumeroCuenta()}</p>
              </div>
            </section>

            {/* Módulos de Métricas Desacoplados (Limpios, no redundantes) */}
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUp size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ingresos</p>
                  <p className="font-bold text-emerald-600 text-sm mt-0.5">
                    +${ingresos.toLocaleString("es-MX")}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ArrowDown size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Egresos</p>
                  <p className="font-bold text-rose-600 text-sm mt-0.5">
                    -${egresos.toLocaleString("es-MX")}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Operaciones</p>
                  <p className="font-bold text-amber-600 text-sm mt-0.5">
                    {movimientos.length} movs
                  </p>
                </div>
              </div>
            </div>

            {/* Evolución del Saldo agrupado dentro de la columna izquierda (Cero espacios vacíos) */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150">
              <h2 className="font-bold text-xl text-slate-800">Evolución del Saldo</h2>
              <p className="text-sm text-gray-500 mb-6">
                Datos obtenidos desde la API
              </p>

              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke="#1d4ed8"
                        strokeWidth={4}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No hay suficientes movimientos para generar gráfica.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Últimos movimientos a la derecha (Alineado verticalmente de forma limpia) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 self-start">
            <h2 className="font-bold text-xl mb-6 text-slate-800">Últimos Movimientos</h2>

            <div className="space-y-5">
              {movimientos.length > 0 ? (
                movimientos.slice(0, 4).map((movimiento, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${movimiento.tipo === "deposito"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                          }`}
                      >
                        {movimiento.tipo === "deposito" ? (
                          <ArrowUp size={20} />
                        ) : (
                          <ArrowDown size={20} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-850 text-sm">{movimiento.concepto}</h3>
                        <p className="text-xs text-slate-400">
                          {new Date(movimiento.fecha).toLocaleDateString("es-MX")} ·{" "}
                          <span className="capitalize">{movimiento.tipo}</span>
                        </p>
                        <span className="inline-block mt-2 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {movimiento.sucursal || "Sin sucursal"}
                        </span>
                      </div>
                    </div>

                    <p
                      className={`font-bold text-sm ${movimiento.tipo === "deposito"
                          ? "text-green-600"
                          : "text-red-600"
                        }`}
                    >
                      {movimiento.tipo === "deposito" ? "+" : "-"}$
                      {Math.abs(Number(movimiento.monto || 0)).toLocaleString("es-MX")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No hay movimientos registrados.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}