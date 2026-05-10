import {
  Wallet,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Search,
  ArrowRightLeft,
  User,
  ChartColumn,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useState, useMemo } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  usuario,
  resumenCuenta,
  movimientos,
  evolucionSaldo,
} from "../data/mockData";

export default function Dashboard() {
  const [filtro, setFiltro] = useState("mes");

  const filteredEvolucion = useMemo(() => {
    const now = new Date();
    let limitDate = new Date(0);
    if (filtro === "semana") limitDate.setDate(now.getDate() - 7);
    else if (filtro === "mes") limitDate.setMonth(now.getMonth() - 1);
    else if (filtro === "anual") limitDate.setFullYear(now.getFullYear() - 1);

    // Asumiendo que evolucionSaldo tiene fechas en formato string que JS puede parsear
    return evolucionSaldo.filter(d => new Date(d.fecha) >= limitDate);
  }, [filtro]);
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-10">
        <Navbar usuario={usuario} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

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
                <p className="text-green-300 font-bold">
                  ↑ +${resumenCuenta.ingresos.toLocaleString("es-MX")}
                </p>
                <p className="text-sm text-blue-100">Ingresos este mes</p>
              </div>

              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-red-300 font-bold">
                  ↓ -${resumenCuenta.egresos.toLocaleString("es-MX")}
                </p>
                <p className="text-sm text-blue-100">Egresos este mes</p>
              </div>

              <div className="bg-white/15 rounded-2xl p-5">
                <p className="text-yellow-300 font-bold">
                  ↗ +{resumenCuenta.variacion}%
                </p>
                <p className="text-sm text-blue-100">Variación mensual</p>
              </div>
            </div>
          </section>


          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl">Últimos Movimientos</h2>
              <button className="text-blue-700 font-semibold">Ver todos</button>
            </div>

            <div className="space-y-5">
              {movimientos.map((movimiento, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        movimiento.monto > 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {movimiento.monto > 0 ? (
                        <ArrowUp size={20} />
                      ) : (
                        <ArrowDown size={20} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold">{movimiento.concepto}</h3>
                      <p className="text-sm text-gray-500">
                        {movimiento.fecha} · {movimiento.tipo}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`font-bold ${
                      movimiento.monto > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {movimiento.monto > 0 ? "+" : "-"}$
                    {Math.abs(movimiento.monto).toLocaleString("es-MX")}
                  </p>
                </div>
              ))}
            </div>
          </section>

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
                <AreaChart data={filteredEvolucion}>
                  <defs>
                    <linearGradient id="colorSaldoDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="fecha" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#1d4ed8"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSaldoDash)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center mt-4 gap-2">
              {['semana', 'mes', 'anual'].map(p => (
                <button
                  key={p}
                  onClick={() => setFiltro(p)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                    filtro === p ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {p === 'semana' ? 'Semanal' : p === 'mes' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}