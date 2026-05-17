import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Evolucion() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState("");
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => datosCuenta?.cuenta?.tipo || "";
  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo ?? 0;

  const cargarCuentas = async () => {
    const res = await fetch("http://localhost:3001/api/cuentas");
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];
    setCuentas(lista);

    if (lista.length > 0) {
      setCuentaActual(lista[0].cuenta);
    }
  };

  const cargarDatos = async (cuenta) => {
    setLoading(true);

    try {
      const resCuenta = await fetch(`http://localhost:3001/api/cuenta/${cuenta}`);
      const dataCuenta = await resCuenta.json();

      const resHistorial = await fetch(`http://localhost:3001/api/historial/${cuenta}`);
      const dataHistorial = await resHistorial.json();

      const listaMovimientos = Array.isArray(dataHistorial)
        ? dataHistorial
        : dataHistorial.movimientos || [];

      setDatosCuenta(dataCuenta);
      setMovimientos(listaMovimientos);
    } catch (error) {
      console.error("Error cargando evolución:", error);
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
    if (cuentaActual) cargarDatos(cuentaActual);
  }, [cuentaActual]);

  const chartData = useMemo(() => {
    if (!datosCuenta || movimientos.length === 0) return [];

    const ordenados = [...movimientos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    const totalDepositos = movimientos.reduce(
      (sum, m) => m.tipo === "deposito" ? sum + Number(m.monto || 0) : sum,
      0
    );

    const totalEgresos = movimientos.reduce(
      (sum, m) => m.tipo !== "deposito" ? sum + Math.abs(Number(m.monto || 0)) : sum,
      0
    );

    let saldo = obtenerSaldo() - totalDepositos + totalEgresos;

    return ordenados.map((m) => {
      if (m.tipo === "deposito") saldo += Number(m.monto || 0);
      else saldo -= Math.abs(Number(m.monto || 0));

      return {
        fecha: new Date(m.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        }),
        saldo,
        tipo: m.tipo,
        monto: m.monto,
        sucursal: m.sucursal || "Sin sucursal",
      };
    });
  }, [datosCuenta, movimientos]);

  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando evolución...</main>
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

        <section className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Evolución de Saldo
          </h1>
          <p className="text-slate-500 mt-2">
            Visualiza el comportamiento del saldo de la cuenta seleccionada.
          </p>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Gráfica de evolución
              </h2>
              <p className="text-sm text-slate-500">
                Datos generados a partir del historial de movimientos.
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Saldo actual
              </p>
              <h3 className="text-3xl font-black text-blue-700">
                ${obtenerSaldo().toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>

          <div className="h-[420px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSaldoEvolucion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}`,
                      "Saldo",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#2563eb"
                    strokeWidth={4}
                    fill="url(#colorSaldoEvolucion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No hay movimientos suficientes para generar la gráfica.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}