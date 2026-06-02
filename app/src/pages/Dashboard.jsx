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

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const { res: resPerfil, alerta: a1 } = await fetchConAlerta(
        `http://localhost:3001/api/cuenta/perfil`
      );
      registrarAlerta(a1);
      if (!resPerfil) throw new Error("Sin conexión al servidor");
      const dataPerfil = await resPerfil.json();

      if (resPerfil?.status === 401) {
        localStorage.removeItem('nexus_token');
        sessionStorage.removeItem('nexus_token');
        window.location.href = '/'; 
        return;
      }
      
      if (!resPerfil.ok) {
        throw new Error(dataPerfil.mensaje || "No se pudo cargar el perfil");
      }

      const { res: resHistorial, alerta: a2 } = await fetchConAlerta(
        `http://localhost:3001/api/cuenta/movimientos`
      );
      registrarAlerta(a2);
      const dataHistorial = resHistorial && resHistorial.ok ? await resHistorial.json() : { movimientos: [] };

      const datosAdaptados = {
        cliente: dataPerfil.usuario,
        cuenta: dataPerfil.cuenta
      };

      setDatosCuenta(datosAdaptados);
      setMovimientos(dataHistorial.movimientos || []);
      
      if (dataPerfil.cuenta) {
        setCuentas([{ cuenta: dataPerfil.cuenta.numeroCuenta }]);
        setCuentaActual(dataPerfil.cuenta.numeroCuenta);
        localStorage.setItem("cuentaActual", dataPerfil.cuenta.numeroCuenta);
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setDatosCuenta(null);
      setMovimientos([]);
      setCuentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);



  const ingresos = movimientos
    .filter((m) => m.tipo === "deposito")
    .reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const egresos = movimientos
    .filter((m) => m.tipo !== "deposito")
    .reduce((sum, m) => sum + Math.abs(Number(m.monto || 0)), 0);

  const chartData = useMemo(() => {
    if (!datosCuenta) return [];

    const ordenados = [...movimientos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    let saldo = obtenerSaldo() - ingresos + egresos;
    const points = [];

    // Agregar punto inicial de Apertura con la fecha de apertura real de la cuenta
    const fechaAperturaRaw = datosCuenta?.cuenta?.fechaApertura || datosCuenta?.fechaApertura;
    const fechaApertura = new Date(fechaAperturaRaw);
    if (fechaAperturaRaw && !isNaN(fechaApertura.getTime())) {
      points.push({
        fecha: fechaApertura.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        saldo: saldo,
      });
    } else {
      points.push({
        fecha: "Apertura",
        saldo: saldo,
      });
    }

    ordenados.forEach((m) => {
      if (m.tipo === "deposito") saldo += Number(m.monto || 0);
      else saldo -= Math.abs(Number(m.monto || 0));

      const movDate = new Date(m.fecha);
      points.push({
        fecha: !isNaN(movDate.getTime()) 
          ? movDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
          : "Fecha Desconocida",
        saldo,
      });
    });

    // Si no hay movimientos, agregamos el día de hoy para que se vea una línea plana
    if (ordenados.length === 0) {
      points.push({
        fecha: new Date().toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        saldo,
      });
    }

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
            <section className="bg-white rounded-[2rem] p-8 shadow-sm">
              <h2 className="font-black text-2xl text-slate-800 tracking-tight">Evolución del Saldo</h2>
              <p className="text-sm text-slate-500 mb-8 mt-1">
                Datos obtenidos desde la API
              </p>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="fecha" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                      tickFormatter={(value) => `$${value}`}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      formatter={(value) => [`$${value.toLocaleString("es-MX")}`, "Saldo"]}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#879cee"
                      strokeWidth={4}
                      dot={{ r: 4, fill: "#879cee", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#4f46e5", stroke: "#fff", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>


        </div>
      </main>
    </div>
  );
}