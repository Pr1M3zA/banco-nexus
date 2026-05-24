import { useState, useEffect, useCallback } from "react";
import { fetchConAlerta } from "../utils/fetchConAlerta";
import { useAlertaLatencia } from "../utils/useAlertaLatencia";
import AlertaBanner from "../components/AlertaBanner";
import {
  Wallet,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const { alerta, registrarAlerta, limpiarAlerta } = useAlertaLatencia();

  const [usuario, setUsuario]           = useState({ nombre: "", tipoCuenta: "" });
  const [resumenCuenta, setResumenCuenta] = useState({ saldo: 0, ingresos: 0, egresos: 0, variacion: 0 });
  const [movimientos, setMovimientos]   = useState([]);
  const [evolucionSaldo, setEvolucionSaldo] = useState([]);

  // ── Estado visual del nodo: 'ok' | 'lento' | 'caido' ──────────────────────
  const [estadoNodo, setEstadoNodo] = useState("ok");

  const actualizarNodo = (alerta) => {
    if (!alerta) return;
    setEstadoNodo((prev) =>
      alerta.tipo === "error" ? "caido" : prev === "ok" ? "lento" : prev
    );
  };

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { res: resCuentas, alerta: a0 } = await fetchConAlerta(
        "http://localhost:3001/api/cuentas"
      );
      registrarAlerta(a0);
      actualizarNodo(a0);

      if (!resCuentas || !resCuentas.ok)
        throw new Error("Error al obtener lista de cuentas");

      const cuentasData = await resCuentas.json();
      const listaCuentas = cuentasData.cuentas || [];
      if (listaCuentas.length === 0)
        throw new Error("No hay cuentas disponibles");

      const numeroCuenta = listaCuentas[0].cuenta;

      const [
        { res: resCuenta,    alerta: a1 },
        { res: resHistorial, alerta: a2 },
      ] = await Promise.all([
        fetchConAlerta(`http://localhost:3001/api/cuenta/${numeroCuenta}`),
        fetchConAlerta(`http://localhost:3001/api/historial/${numeroCuenta}`),
      ]);

      [a1, a2].forEach((a) => { registrarAlerta(a); actualizarNodo(a); });

      if (!resCuenta || !resCuenta.ok)
        throw new Error("Error al obtener detalles de la cuenta");

      const dataCuenta = await resCuenta.json();
      let dataHistorial = { movimientos: [] };
      if (resHistorial && resHistorial.ok)
        dataHistorial = await resHistorial.json();

      setUsuario({
        nombre:     dataCuenta.cliente?.nombre || "Usuario",
        tipoCuenta: dataCuenta.cuenta?.tipo    || "Cuenta",
      });

      const movs = dataHistorial.movimientos || [];
      const ingresos = movs.filter((m) => m.tipo === "deposito").reduce((a, m) => a + m.monto, 0);
      const egresos  = movs.filter((m) => m.tipo === "retiro"  ).reduce((a, m) => a + m.monto, 0);

      setResumenCuenta({ saldo: dataCuenta.cuenta.saldo, ingresos, egresos, variacion: 2.5 });

      setMovimientos(
        movs.slice(0, 5).map((m) => ({
          concepto: m.concepto,
          fecha: new Date(m.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }),
          tipo:  m.tipo === "deposito" ? "Depósito" : "Retiro",
          monto: m.tipo === "retiro"   ? -m.monto   : m.monto,
        }))
      );

      let saldoCursor = dataCuenta.cuenta.saldo;
      const evolucion = [{ fecha: "Hoy", saldo: saldoCursor }];
      movs.slice(0, 5).forEach((m) => {
        saldoCursor -= m.tipo === "deposito" ? m.monto : -m.monto;
        evolucion.unshift({
          fecha: new Date(m.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
          saldo: saldoCursor,
        });
      });
      setEvolucionSaldo(evolucion);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [registrarAlerta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Indicador nodo ──────────────────────────────────────────────────────────
  const nodoBadge = {
    ok:    { dot: "bg-green-500", label: "Nodo primario OK"  },
    lento: { dot: "bg-amber-400", label: "Latencia elevada"  },
    caido: { dot: "bg-red-500",   label: "Nodo caído"        },
  }[estadoNodo];

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar paginaActiva="dashboard" />
      <main className="flex-1 p-10 flex items-center justify-center">
        <p className="text-2xl text-gray-500 font-semibold animate-pulse">Cargando Dashboard...</p>
      </main>
    </div>
  );

  // ── Error fatal ─────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar paginaActiva="dashboard" />
      <main className="flex-1 p-10 flex flex-col items-center justify-center gap-6">
        <div className="bg-red-50 text-red-700 p-8 rounded-3xl text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Error al cargar</h2>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
        >
          Reintentar
        </button>
      </main>
    </div>
  );

  // ── Vista principal ─────────────────────────────────────────────────────────
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar paginaActiva="dashboard" />

      <main className="flex-1 p-10">
        <Navbar usuario={usuario} />

        {/* Indicador de estado del nodo */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 font-medium">
          <span className={`w-2.5 h-2.5 rounded-full shadow ${nodoBadge.dot}`} />
          {nodoBadge.label}
          {estadoNodo !== "ok" && (
            <button
              onClick={fetchData}
              className="ml-3 text-blue-600 text-xs underline font-normal hover:text-blue-800"
            >
              Reintentar
            </button>
          )}
        </div>

        {/* Banner de alerta */}
        <AlertaBanner alerta={alerta} onClose={limpiarAlerta} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Saldo */}
          <section className="xl:col-span-2 bg-blue-700 rounded-3xl p-8 text-white shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/20 p-4 rounded-2xl">
                <Wallet size={28} />
              </div>
              <div>
                <p className="text-blue-100">Saldo Disponible</p>
                <h2 className="text-4xl font-bold">
                  ${resumenCuenta.saldo.toLocaleString("es-MX")}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5 mt-8">
              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-green-300 font-bold">↑ +${resumenCuenta.ingresos.toLocaleString("es-MX")}</p>
                <p className="text-sm text-blue-100">Ingresos este mes</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-red-300 font-bold">↓ -${resumenCuenta.egresos.toLocaleString("es-MX")}</p>
                <p className="text-sm text-blue-100">Egresos este mes</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-yellow-300 font-bold">↗ +{resumenCuenta.variacion}%</p>
                <p className="text-sm text-blue-100">Variación mensual</p>
              </div>
            </div>
          </section>

          {/* Últimos movimientos */}
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl">Últimos Movimientos</h2>
              <button className="text-blue-700 font-semibold">Ver todos</button>
            </div>
            <div className="space-y-5">
              {movimientos.map((mov, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${mov.monto > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {mov.monto > 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold">{mov.concepto}</h3>
                      <p className="text-sm text-gray-500">{mov.fecha} · {mov.tipo}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${mov.monto > 0 ? "text-green-600" : "text-red-600"}`}>
                    {mov.monto > 0 ? "+" : "-"}${Math.abs(mov.monto).toLocaleString("es-MX")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Evolución saldo */}
          <section className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-xl">Evolución del Saldo</h2>
                <p className="text-sm text-gray-500">Últimos movimientos registrados</p>
              </div>
              <button className="text-blue-700 font-semibold">Ver completo</button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucionSaldo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="saldo" stroke="#1d4ed8" strokeWidth={4} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}