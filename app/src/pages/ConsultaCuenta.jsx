import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import { fetchConAlerta } from "../utils/fetchConAlerta";
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
import AlertMessage from "../components/AlertMessage";

export default function ConsultaCuenta() {
  const location = useLocation();
  const inputRef = useRef(null);

  const [numeroCuentaInput, setNumeroCuentaInput] = useState("");
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operacionLoading, setOperacionLoading] = useState(false);
  const [monto, setMonto] = useState("");
  const [filtro, setFiltro] = useState("todo");
  const [sucursal, setSucursal] = useState("Sucursal Digital");
  const [listaCuentas, setListaCuentas] = useState([]);

  const [alerta, setAlerta] = useState({
    type: "",
    message: "",
  });

  const [alertaOperacion, setAlertaOperacion] = useState({
    type: "",
    message: "",
  });

  // ── Alerta latencia / nodo (separada de las operaciones) ────────────────────
  const [alertaLatencia, setAlertaLatencia] = useState({ type: "", message: "" });

  const registrarAlerta = useCallback((alerta) => {
    if (!alerta) return;
    const type  = alerta.tipo === "error" ? "error" : "warning";
    const label = alerta.tipo === "error"
      ? "🔴 Nodo primario — " + alerta.mensaje
      : "⚠️ Latencia — " + alerta.mensaje;
    setAlertaLatencia((prev) => {
      if (prev.type === "error" && type === "warning") return prev;
      return { type, message: label };
    });
  }, []);

  useEffect(() => {
    if (location.state?.origin === "transferencia") {
      setAlerta({
        type: "info",
        message: "Por favor, ingresa el número de cuenta destino para realizar una operación.",
      });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const cargarListaCuentas = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/cuentas");
        const data = await res.json();
        const lista = data.cuentas && Array.isArray(data.cuentas) ? data.cuentas : [];
        setListaCuentas(lista);
      } catch (error) {
        console.error("Error cargando cuentas para el dropdown:", error);
      }
    };
    cargarListaCuentas();
  }, []);
  const obtenerNumeroCuenta = () => {
    return datosCuenta?.cuenta?.numeroCuenta || datosCuenta?.cuenta;
  };

  const obtenerSaldo = () => {
    return datosCuenta?.cuenta?.saldo ?? datosCuenta?.saldo ?? 0;
  };

  const obtenerTipoCuenta = () => {
    const raw = datosCuenta?.cuenta?.tipo || datosCuenta?.tipo || "";
    const t = raw.toLowerCase();
    if (t === "ahorro") return "Ahorro";
    if (t === "nomina") return "Nómina";
    if (t === "corriente") return "Crédito";
    return raw;
  };

  const obtenerNombreCliente = () => {
    return datosCuenta?.cliente?.nombre || datosCuenta?.cliente || "Usuario";
  };

  const obtenerCorreoCliente = () => {
    return datosCuenta?.cliente?.correo || datosCuenta?.correo || "";
  };

  const fetchDatos = async (cuenta, mostrarMensaje = true) => {
    setAlerta({ type: "", message: "" });
    setAlertaOperacion({ type: "", message: "" });

    if (!cuenta || cuenta.trim() === "") {
      setAlerta({
        type: "warning",
        message: "Ingresa un número de cuenta.",
      });
      return;
    }

    setLoading(true);

    try {
      const { res: resCuenta, alerta: a1 } = await fetchConAlerta(
        `http://localhost:3001/api/cuenta/${cuenta}`
      );
      registrarAlerta(a1);
      if (!resCuenta) throw new Error("Sin conexión con el servidor.");
      const dataCuenta = await resCuenta.json();

      if (!resCuenta.ok) {
        throw new Error(
          dataCuenta.error || dataCuenta.mensaje || "No se pudo encontrar la cuenta."
        );
      }

      setDatosCuenta(dataCuenta);

      const { res: resHistorial, alerta: a2 } = await fetchConAlerta(
        `http://localhost:3001/api/historial/${cuenta}`
      );
      registrarAlerta(a2);
      if (!resHistorial || !resHistorial.ok) throw new Error("No se pudo cargar el historial.");
      const dataHistorial = await resHistorial.json();

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



  const handleOperacion = async (tipo) => {
    setAlertaOperacion({ type: "", message: "" });
    setAlerta({ type: "", message: "" });

    if (!datosCuenta) {
      setAlertaOperacion({
        type: "warning",
        message: "Primero consulta una cuenta antes de realizar operaciones.",
      });
      return;
    }

    if (!monto || monto.trim() === "") {
      setAlertaOperacion({
        type: "warning",
        message: "Ingresa un monto para la operación.",
      });
      return;
    }

    const valorMonto = parseFloat(monto);

    if (isNaN(valorMonto) || valorMonto <= 0) {
      setAlertaOperacion({
        type: "warning",
        message: "No es posible realizar depósitos o retiros por montos negativos o iguales a cero.",
      });
      return;
    }

    if (valorMonto < 1.00) {
      setAlertaOperacion({
        type: "warning",
        message: `El monto mínimo permitido para realizar un ${tipo === "deposito" ? "depósito" : "retiro"} es de $1.00.`,
      });
      return;
    }

    if (tipo === "retiro" && valorMonto > obtenerSaldo()) {
      setAlertaOperacion({
        type: "warning",
        message: `No puedes retirar más de lo que la cuenta tiene disponible ($${obtenerSaldo().toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}).`,
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

      setAlertaOperacion({
        type: "success",
        message:
          data.mensaje ||
          (tipo === "deposito"
            ? "Depósito realizado correctamente."
            : "Retiro realizado correctamente."),
      });
    } catch (err) {
      setAlertaOperacion({
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

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Encabezado Personalizado y Limpio (Sin Redundancia de Welcome ni Selector) */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
          <div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Terminal de Operaciones
            </span>
            <h1 className="text-3xl font-black text-slate-800 mt-2 tracking-tight">
              Caja & Consulta Bancaria
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-blue-700/10 flex items-center justify-center text-blue-700 font-black text-sm">
              C1
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 leading-tight">Caja Nexus Digital</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Operador Activo</p>
            </div>
          </div>
        </div>

        {/* Banner latencia / nodo — encima del form */}
        <AlertMessage
          type={alertaLatencia.type}
          message={alertaLatencia.message}
          onClose={() => setAlertaLatencia({ type: "", message: "" })}
        />

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

            <div className="flex flex-col md:flex-row gap-4">
              {listaCuentas.length > 0 && (
                <select
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) {
                      setNumeroCuentaInput(selected);
                      fetchDatos(selected);
                    }
                  }}
                  value={numeroCuentaInput}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-bold max-w-xs"
                >
                  <option value="">Seleccionar cuenta rápida...</option>
                  {listaCuentas.map((c) => {
                    const raw = c.cuenta || "";
                    const tipoCta = (c.tipo || "").toLowerCase() === "corriente" ? "Crédito" : (c.tipo || "").toLowerCase() === "ahorro" ? "Ahorro" : "Nómina";
                    return (
                      <option key={raw} value={raw}>
                        {c.cliente} ({tipoCta} · {raw})
                      </option>
                    );
                  })}
                </select>
              )}

              <input
                ref={inputRef}
                type="text"
                placeholder="NX01001"
                value={numeroCuentaInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchDatos(numeroCuentaInput);
                  }
                }}
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

            {/* Ficha de Cuenta Bancaria en Formato Horizontal Único (Cero Redundancia) */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-stretch gap-8">
              {/* Left Column: Client Profile Info */}
              <div className="flex-grow flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 text-xl font-bold border border-blue-100">
                  {obtenerNombreCliente().split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    Titular Autorizado
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1 leading-tight">
                    {obtenerNombreCliente()}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {obtenerCorreoCliente() || "Sin correo registrado"}
                  </p>
                </div>
              </div>

              {/* Center Column: Bank Details Divider */}
              <div className="hidden lg:block w-[1px] bg-slate-100" />

              {/* Middle Column: Account Specifications */}
              <div className="flex-grow flex flex-col justify-center gap-3">
                <div className="flex justify-between items-center text-xs gap-4">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Número Cuenta</span>
                  <span className="font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    {obtenerNumeroCuenta()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-4">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tipo de Producto</span>
                  <span className="font-bold text-slate-800 capitalize bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    {obtenerTipoCuenta()}
                  </span>
                </div>
              </div>

              {/* Right Column: Divided Capital Card (High Visual UI Value!) */}
              <div className="w-full lg:w-72 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col justify-between shadow-md">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Saldo Disponible</p>
                  <h4 className="text-2xl font-black mt-1 text-white tracking-tight">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h4>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 text-[10px]">
                  <span className="text-slate-500 font-bold uppercase tracking-widest">Estado</span>
                  <span className="font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest text-[8px] border border-emerald-500/20">
                    Activo
                  </span>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 w-full space-y-4">
                {alertaOperacion.message && (
                  <AlertMessage
                    type={alertaOperacion.type}
                    message={alertaOperacion.message}
                    onClose={() => setAlertaOperacion({ type: "", message: "" })}
                  />
                )}

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
                      min="1"
                      step="0.01"
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
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${filtro === p
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
                          className={`p-3 rounded-xl ${mov.tipo === "deposito"
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
                          className={`text-sm font-black ${mov.tipo === "deposito"
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