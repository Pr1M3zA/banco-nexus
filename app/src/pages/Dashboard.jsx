import { useEffect, useMemo, useState } from "react";
import { Wallet, ArrowUp, ArrowDown } from "lucide-react";
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
  const cuentaInicial = "NX01001";

  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || cuentaInicial;
  });
  const [loading, setLoading] = useState(true);

  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo ?? 0;
  const obtenerNombreCliente = () =>
    datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () =>
    datosCuenta?.cuenta?.tipo || "";
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;

  const cargarCuentas = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cuentas");
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
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
      const resCuenta = await fetch(`http://localhost:3001/api/cuenta/${cuenta}`);
      const dataCuenta = await resCuenta.json();

      if (!resCuenta.ok) {
        throw new Error(dataCuenta.mensaje || "No se pudo cargar la cuenta");
      }

      const resHistorial = await fetch(`http://localhost:3001/api/historial/${cuenta}`);
      const dataHistorial = await resHistorial.json();

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

    return ordenados.map((m) => {
      if (m.tipo === "deposito") saldo += Number(m.monto || 0);
      else saldo -= Math.abs(Number(m.monto || 0));

      return {
        fecha: new Date(m.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        }),
        saldo,
      };
    });
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
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-blue-700 rounded-3xl p-8 text-white shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/20 p-4 rounded-2xl">
                <Wallet size={28} />
              </div>

              <div>
                <p className="text-blue-100">Saldo Disponible</p>
                <h2 className="text-4xl font-bold">
                  ${obtenerSaldo().toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Cuenta {obtenerNumeroCuenta()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 mt-8">
              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-green-300 font-bold">
                  ↑ +${ingresos.toLocaleString("es-MX")}
                </p>
                <p className="text-sm text-blue-100">Ingresos registrados</p>
              </div>

              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-red-300 font-bold">
                  ↓ -${egresos.toLocaleString("es-MX")}
                </p>
                <p className="text-sm text-blue-100">Egresos registrados</p>
              </div>

              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-yellow-300 font-bold">
                  {movimientos.length}
                </p>
                <p className="text-sm text-blue-100">Movimientos</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-6">Últimos Movimientos</h2>

            <div className="space-y-5">
              {movimientos.length > 0 ? (
                movimientos.slice(0, 4).map((movimiento, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${
                          movimiento.tipo === "deposito"
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
                        <h3 className="font-bold">{movimiento.concepto}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(movimiento.fecha).toLocaleDateString("es-MX")} ·{" "}
                          {movimiento.tipo}
                        </p>
                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                          {movimiento.sucursal || "Sin sucursal"}
                        </span>
                      </div>
                    </div>

                    <p
                      className={`font-bold ${
                        movimiento.tipo === "deposito"
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

          <section className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-xl">Evolución del Saldo</h2>
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
      </main>
    </div>
  );
}