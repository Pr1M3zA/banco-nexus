import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Search, User, Wallet, CheckCircle, AlertCircle, Loader2, ArrowUpCircle, ArrowDownCircle, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ConsultaCuenta() {
  const [numeroCuentaInput, setNumeroCuentaInput] = useState("");
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operacionLoading, setOperacionLoading] = useState(false);
  const [error, setError] = useState("");
  const [monto, setMonto] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [filtro, setFiltro] = useState("mes"); // semana, mes, anual

  const fetchDatos = async (cuenta) => {
    try {
      const resCuenta = await fetch(`http://localhost:3001/api/cuenta/${cuenta}`);
      const dataCuenta = await resCuenta.json();

      if (!resCuenta.ok) {
        throw new Error(dataCuenta.error || "No se pudo encontrar la cuenta.");
      }

      setDatosCuenta(dataCuenta);

      const resHistorial = await fetch(`http://localhost:3001/api/historial/${cuenta}`);
      const dataHistorial = await resHistorial.json();

      if (resHistorial.ok) {
        // Ordenar movimientos por fecha ascendente para el cálculo de evolución
        setMovimientos(dataHistorial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      }
    } catch (err) {
      setError(err.message);
      setDatosCuenta(null);
    }
  };

  const filteredMovimientos = useMemo(() => {
    if (filtro === "todo") return movimientos;
    const now = new Date();
    let limitDate = new Date();
    if (filtro === "semana") limitDate.setDate(now.getDate() - 7);
    else if (filtro === "mes") limitDate.setMonth(now.getMonth() - 1);
    else if (filtro === "anual") limitDate.setFullYear(now.getFullYear() - 1);
    return movimientos.filter(tx => new Date(tx.fecha) >= limitDate);
  }, [movimientos, filtro]);

  // Cálculo de evolución de saldo para la gráfica
  const chartData = useMemo(() => {
    if (!datosCuenta || movimientos.length === 0) return [];

    const sortedMovs = [...movimientos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // El saldo actual es el resultado de TODOS los movimientos registrados en el historial.
    // Vamos a calcular el saldo inicial y luego iterar para tener los puntos.
    const totalDepositos = movimientos.reduce((acc, curr) => curr.tipo === 'deposito' ? acc + curr.monto : acc, 0);
    const totalRetiros = movimientos.reduce((acc, curr) => curr.tipo !== 'deposito' ? acc + Math.abs(curr.monto) : acc, 0);
    let runningBalance = datosCuenta.saldo - totalDepositos + totalRetiros;

    const points = [];
    sortedMovs.forEach(tx => {
      if (tx.tipo === 'deposito') runningBalance += tx.monto;
      else runningBalance -= Math.abs(tx.monto);
      
      const date = new Date(tx.fecha);
      points.push({
        label: date.toLocaleDateString("es-MX", { day: '2-digit', month: 'short' }),
        saldo: runningBalance,
        timestamp: date.getTime()
      });
    });

    // Filtrar puntos por el periodo seleccionado
    const now = new Date();
    let limitDate = new Date();
    if (filtro === "semana") limitDate.setDate(now.getDate() - 7);
    else if (filtro === "mes") limitDate.setMonth(now.getMonth() - 1);
    else if (filtro === "anual") limitDate.setFullYear(now.getFullYear() - 1);
    else limitDate = new Date(0);

    return points.filter(p => p.timestamp >= limitDate.getTime());
  }, [movimientos, datosCuenta, filtro]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, high: 0, low: 0, variation: 0 };
    const values = chartData.map(d => d.saldo);
    const high = Math.max(...values);
    const low = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variation = values[values.length - 1] - values[0];
    return { avg, high, low, variation };
  }, [chartData]);

  const handleOperacion = async (tipo) => {
    const valorMonto = parseFloat(monto);
    if (isNaN(valorMonto) || valorMonto <= 0) return;
    setOperacionLoading(true);
    try {
      const endpoint = tipo === "deposito" ? "deposito" : "retiro";
      const res = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuenta: datosCuenta.cuenta, monto: valorMonto }),
      });

      if (res.ok) {
        setMonto("");
        await fetchDatos(datosCuenta.cuenta);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOperacionLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <Navbar usuario={{ nombre: datosCuenta?.cliente || "Usuario", tipoCuenta: datosCuenta?.tipo || "" }} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Hola, {datosCuenta?.cliente.split(' ')[0] || "Invitado"}!</h1>
          <p className="text-slate-400 text-sm">Resumen de tu cuenta NEXUS</p>
        </div>

        {!datosCuenta && (
          <section className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-slate-100">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Ingresa tu número de cuenta (ej: NX01001)"
                value={numeroCuentaInput}
                onChange={(e) => setNumeroCuentaInput(e.target.value)}
                className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <button
                onClick={() => fetchDatos(numeroCuentaInput)}
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                Consultar
              </button>
            </div>
          </section>
        )}

        {datosCuenta && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Columna Izquierda: Tarjeta y Botones */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#1e293b] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <span className="font-bold tracking-widest text-lg opacity-80 uppercase">Nexus</span>
                      <div className="w-12 h-10 bg-slate-400/20 rounded-lg backdrop-blur-sm"></div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-xl font-mono tracking-[0.2em] mb-4">**** **** **** {datosCuenta.cuenta.slice(-4)}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Titular</p>
                        <p className="text-sm font-bold uppercase">{datosCuenta.cliente}</p>
                      </div>
                      <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/80"></div>
                        <div className="w-10 h-10 rounded-full bg-slate-500/40"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-center text-xl"
                    />
                  </div>
                  <button
                    onClick={() => handleOperacion("deposito")}
                    disabled={operacionLoading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <ArrowUpCircle size={20} /> Depositar
                  </button>
                  <button
                    onClick={() => handleOperacion("retiro")}
                    disabled={operacionLoading}
                    className="w-full bg-white text-blue-600 border border-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <ArrowDownCircle size={20} /> Retirar
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Gráfica de Evolución */}
              <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative min-h-[450px] flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Evolución de Saldo</h2>
                    <p className="text-slate-400 text-sm">Análisis temporal del comportamiento de tu cuenta</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo Actual</p>
                    <h3 className="text-4xl font-black text-blue-600">
                      ${datosCuenta.saldo.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Saldo']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#2563eb" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorSaldo)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  {['semana', 'mes', 'anual'].map(p => (
                    <button
                      key={p}
                      onClick={() => setFiltro(p)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                        filtro === p ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {p === 'semana' ? 'Semanal' : p === 'mes' ? 'Mensual' : 'Anual'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fila Inferior: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Saldo Promedio" 
                value={stats.avg} 
                icon={<Wallet size={20} className="text-blue-600" />} 
                trend="+3.5%" 
                trendUp={true}
              />
              <StatCard 
                label="Punto más Alto" 
                value={stats.high} 
                icon={<TrendingUp size={20} className="text-emerald-600" />} 
                trendUp={true}
              />
              <StatCard 
                label="Punto más Bajo" 
                value={stats.low} 
                icon={<ArrowDownCircle size={20} className="text-rose-600" />} 
                trendUp={false}
              />
              <StatCard 
                label="Variación Acumulada" 
                value={stats.variation} 
                icon={<TrendingUp size={20} className="text-violet-600" />} 
                trend={stats.variation >= 0 ? "Positivo" : "Negativo"}
                trendUp={stats.variation >= 0}
                isVariation={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, trend, trendUp, isVariation }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800">
        {isVariation && value > 0 ? "+" : ""}${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </h4>
      <p className="text-[10px] text-slate-400 mt-1">Últimos del periodo</p>
    </div>
  );
}
>
  );
}


