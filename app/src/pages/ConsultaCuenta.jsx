import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  Search,
  User,
  Wallet,
  CheckCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AlertMessage from "../components/AlertMessage";

export default function ConsultaCuenta() {
  const [numeroCuentaInput, setNumeroCuentaInput] = useState("");
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operacionLoading, setOperacionLoading] = useState(false);
  const [monto, setMonto] = useState("");
  const [filtro, setFiltro] = useState("todo");
  const [sucursal, setSucursal] = useState("Sucursal Digital");

  const [alerta, setAlerta] = useState({
    type: "",
    message: "",
  });

  const obtenerNumeroCuenta = () => {
    return datosCuenta?.cuenta?.numeroCuenta || datosCuenta?.cuenta;
  };

  const obtenerSaldo = () => {
    return datosCuenta?.cuenta?.saldo ?? datosCuenta?.saldo ?? 0;
  };

  const obtenerTipoCuenta = () => {
    return datosCuenta?.cuenta?.tipo || datosCuenta?.tipo || "";
  };

  const obtenerNombreCliente = () => {
    return datosCuenta?.cliente?.nombre || datosCuenta?.cliente || "Usuario";
  };

  const obtenerCorreoCliente = () => {
    return datosCuenta?.cliente?.correo || datosCuenta?.correo || "";
  };

  const fetchDatos = async (cuenta, mostrarMensaje = true) => {
    setAlerta({ type: "", message: "" });

    if (!cuenta || cuenta.trim() === "") {
      setAlerta({
        type: "warning",
        message: "Ingresa un número de cuenta.",
      });
      return;
    }

    setLoading(true);

    try {
      const resCuenta = await fetch(
        `http://localhost:3001/api/cuenta/${cuenta}`
      );
      const dataCuenta = await resCuenta.json();

      if (!resCuenta.ok) {
        throw new Error(
          dataCuenta.error || dataCuenta.mensaje || "No se pudo encontrar la cuenta."
        );
      }

      setDatosCuenta(dataCuenta);

      const resHistorial = await fetch(
        `http://localhost:3001/api/historial/${cuenta}`
      );
      const dataHistorial = await resHistorial.json();

      if (!resHistorial.ok) {
        throw new Error(
          dataHistorial.error ||
            dataHistorial.mensaje ||
            "No se pudo cargar el historial."
        );
      }

      const listaMovimientos = Array.isArray(dataHistorial)
        ? dataHistorial
        : dataHistorial.movimientos || [];

      setMovimientos(
        listaMovimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      );

      if (mostrarMensaje) {
        setAlerta({
          type: "success",
          message: "Cuenta encontrada correctamente.",
        });
      }
    } catch (err) {
      setDatosCuenta(null);
      setMovimientos([]);

      setAlerta({
        type: "error",
        message: err.message || "Error de conexión con la API.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovimientos = useMemo(() => {
    if (filtro === "todo") return movimientos;

    const now = new Date();
    let limitDate = new Date();

    if (filtro === "semana") limitDate.setDate(now.getDate() - 7);
    else if (filtro === "mes") limitDate.setMonth(now.getMonth() - 1);
    else if (filtro === "anual") limitDate.setFullYear(now.getFullYear() - 1);

    return movimientos.filter((tx) => new Date(tx.fecha) >= limitDate);
  }, [movimientos, filtro]);

  const chartData = useMemo(() => {
    if (!datosCuenta || movimientos.length === 0) return [];

    const saldoActual = obtenerSaldo();

    const sortedMovs = [...movimientos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    const totalDepositos = movimientos.reduce(
      (acc, curr) => (curr.tipo === "deposito" ? acc + Number(curr.monto) : acc),
      0
    );

    const totalRetiros = movimientos.reduce(
      (acc, curr) =>
        curr.tipo !== "deposito" ? acc + Math.abs(Number(curr.monto)) : acc,
      0
    );

    let runningBalance = saldoActual - totalDepositos + totalRetiros;

    const points = [];

    sortedMovs.forEach((tx) => {
      if (tx.tipo === "deposito") runningBalance += Number(tx.monto);
      else runningBalance -= Math.abs(Number(tx.monto));

      const date = new Date(tx.fecha);

      points.push({
        label: date.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        }),
        saldo: runningBalance,
        timestamp: date.getTime(),
      });
    });

    const now = new Date();
    let limitDate = new Date(0);

    if (filtro === "semana") limitDate.setDate(now.getDate() - 7);
    else if (filtro === "mes") limitDate.setMonth(now.getMonth() - 1);
    else if (filtro === "anual") limitDate.setFullYear(now.getFullYear() - 1);

    return points.filter((p) => p.timestamp >= limitDate.getTime());
  }, [movimientos, datosCuenta, filtro]);

  const handleOperacion = async (tipo) => {
    setAlerta({ type: "", message: "" });

    if (!datosCuenta) {
      setAlerta({
        type: "warning",
        message: "Primero consulta una cuenta antes de realizar operaciones.",
      });
      return;
    }

    if (!monto || monto.trim() === "") {
      setAlerta({
        type: "warning",
        message: "Ingresa un monto para la operación.",
      });
      return;
    }

    const valorMonto = parseFloat(monto);

    if (isNaN(valorMonto) || valorMonto <= 0) {
      setAlerta({
        type: "warning",
        message: "El monto debe ser un número mayor a 0.",
      });
      return;
    }

    setOperacionLoading(true);

    try {
      const endpoint = tipo === "deposito" ? "deposito" : "retiro";
      const numeroCuenta = obtenerNumeroCuenta();

      const res = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuenta: numeroCuenta,
          monto: valorMonto,
          sucursal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.mensaje || "No se pudo realizar la operación."
        );
      }

      setMonto("");

      await fetchDatos(numeroCuenta, false);

      setAlerta({
        type: "success",
        message:
          data.mensaje ||
          (tipo === "deposito"
            ? "Depósito realizado correctamente."
            : "Retiro realizado correctamente."),
      });
    } catch (err) {
      setAlerta({
        type: "error",
        message: err.message || "Error de conexión con la API.",
      });
    } finally {
      setOperacionLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 p-8">
        <Navbar
          usuario={{
            nombre: obtenerNombreCliente(),
            tipoCuenta: obtenerTipoCuenta(),
          }}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Consulta de Cuenta
          </h1>
          <p className="text-slate-500 text-sm">
            Ingresa el número de cuenta para consultar la información bancaria.
          </p>
        </div>

        <AlertMessage
          type={alerta.type}
          message={alerta.message}
          onClose={() => setAlerta({ type: "", message: "" })}
        />

        <section className="bg-white rounded-2xl p-6 shadow-sm mb-8 border border-slate-100">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Número de Cuenta
            </label>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="NX01001"
                value={numeroCuentaInput}
                onChange={(e) => setNumeroCuentaInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700"
              />

              <button
                onClick={() => fetchDatos(numeroCuentaInput)}
                disabled={loading}
                className="bg-blue-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Search size={18} />
                )}
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </div>
          </div>
        </section>

        {datosCuenta && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <CheckCircle className="text-blue-600" size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">
                  Cuenta Encontrada
                </h2>
                <p className="text-xs text-slate-400">
                  Información asociada a la cuenta consultada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <User className="text-blue-600" size={18} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Cliente
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Nombre</p>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    {obtenerNombreCliente()}
                  </p>

                  <p className="text-xs text-slate-400 mb-1">Correo</p>
                  <p className="text-sm font-bold text-slate-800">
                    {obtenerCorreoCliente() || "Correo no registrado"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="text-blue-600" size={18} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Cuenta
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Número de cuenta
                  </p>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    {obtenerNumeroCuenta()}
                  </p>

                  <p className="text-xs text-slate-400 mb-1">Tipo</p>
                  <p className="text-sm font-bold text-slate-800 capitalize">
                    {obtenerTipoCuenta()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-blue-100/80 mb-1 uppercase tracking-widest font-medium">
                    Saldo Disponible
                  </p>

                  <h3 className="text-3xl font-black mb-1">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] text-blue-100/60 uppercase tracking-widest font-bold mb-1">
                    Estado
                  </p>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">
                    Activo
                  </span>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Monto de la Operación
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-bold text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Sucursal de origen
                  </label>

                  <select
                    value={sucursal}
                    onChange={(e) => setSucursal(e.target.value)}
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-bold"
                  >
                    <option value="Sucursal Digital">Sucursal Digital</option>
                    <option value="CDMX">CDMX</option>
                    <option value="GDL">GDL</option>
                    <option value="MTY">MTY</option>
                    <option value="CUN">CUN</option>
                    <option value="QRO">QRO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={() => handleOperacion("deposito")}
                  disabled={operacionLoading}
                  className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  <ArrowUpCircle size={18} />
                  {operacionLoading ? "Procesando..." : "Depositar"}
                </button>

                <button
                  onClick={() => handleOperacion("retiro")}
                  disabled={operacionLoading}
                  className="flex-1 md:flex-none bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  <ArrowDownCircle size={18} />
                  {operacionLoading ? "Procesando..." : "Retirar"}
                </button>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    Evolución de Saldo
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    Análisis temporal del comportamiento de tu cuenta
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                    Saldo Actual
                  </p>
                  <h3 className="text-3xl font-black text-blue-600">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </div>
              </div>

              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorSaldo"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                      dy={10}
                    />

                    <YAxis hide domain={["auto", "auto"]} />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow:
                          "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                        padding: "12px",
                      }}
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Saldo",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="#2563eb"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorSaldo)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center mt-6 gap-2">
                {["semana", "mes", "anual", "todo"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFiltro(p)}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      filtro === p
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                        : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {p === "semana"
                      ? "Semanal"
                      : p === "mes"
                      ? "Mensual"
                      : p === "anual"
                      ? "Anual"
                      : "Todo"}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  Movimientos de la cuenta
                </h2>

                <div className="flex gap-2">
                  {["semana", "mes", "todo"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFiltro(p)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                        filtro === p
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {p === "semana"
                        ? "Semana"
                        : p === "mes"
                        ? "Mes"
                        : "Todo"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {filteredMovimientos.length > 0 ? (
                  filteredMovimientos.map((mov, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            mov.tipo === "deposito"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {mov.tipo === "deposito" ? (
                            <ArrowUpRight size={20} />
                          ) : (
                            <ArrowDownRight size={20} />
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {mov.concepto}
                          </h3>

                          <p className="text-[11px] text-slate-400 font-medium">
                            {new Date(mov.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            · <span className="capitalize">{mov.tipo}</span>
                          </p>

                          <span className="inline-block mt-2 bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {mov.sucursal || "Sin sucursal"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${
                            mov.tipo === "deposito"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {mov.tipo === "deposito" ? "+" : "-"}$
                          {Math.abs(mov.monto).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm italic">
                      No se encontraron movimientos para esta cuenta.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}