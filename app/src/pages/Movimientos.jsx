import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Printer,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  X,
  FileText,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { fetchConAlerta } from "../utils/fetchConAlerta";

export default function Movimientos() {
  const cuentaInicial = "NX01001";

  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || cuentaInicial;
  });
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState("todo");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Estados de Exportación de Estados de Cuenta ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("todo");

  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => {
    const raw = datosCuenta?.cuenta?.tipo || "";
    const t = raw.toLowerCase();
    if (t === "ahorro") return "Ahorro";
    if (t === "nomina") return "Nómina";
    if (t === "corriente") return "Crédito";
    return raw;
  };
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { res: resPerfil } = await fetchConAlerta(`http://localhost:3001/api/cuenta/perfil`);
      if (!resPerfil) throw new Error("Sin conexión al servidor");
      const dataPerfil = await resPerfil.json();

      if (!resPerfil.ok) {
        throw new Error(dataPerfil.mensaje || "No se pudo cargar la cuenta");
      }

      const { res: resHistorial } = await fetchConAlerta(`http://localhost:3001/api/cuenta/movimientos`);
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
      console.error("Error cargando movimientos:", error);
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

  // Filtrado de movimientos en tiempo real
  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];

    if (filtro === "ingresos") {
      lista = lista.filter((m) => m.tipo === "deposito");
    } else if (filtro === "egresos") {
      lista = lista.filter((m) => m.tipo === "retiro" || m.tipo === "cargo");
    }

    if (busqueda.trim() !== "") {
      const texto = busqueda.toLowerCase();
      lista = lista.filter((m) =>
        `${m.concepto} ${m.tipo} ${m.sucursal || ""}`
          .toLowerCase()
          .includes(texto)
      );
    }

    return lista;
  }, [movimientos, filtro, busqueda]);

  // Cálculos de flujo de caja basados en los movimientos filtrados
  const cashflow = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter((m) => m.tipo === "deposito")
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const egresos = movimientosFiltrados
      .filter((m) => m.tipo !== "deposito")
      .reduce((sum, m) => sum + Math.abs(Number(m.monto || 0)), 0);

    return {
      ingresos,
      egresos,
      neto: ingresos - egresos,
    };
  }, [movimientosFiltrados]);

  const handleExportarPDF = () => {
    setIsExportModalOpen(true);
  };

  const obtenerNombreMes = (monthIndex) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[monthIndex];
  };

  const dateActual = new Date();
  const mesActualNum = dateActual.getMonth();
  const anioActualNum = dateActual.getFullYear();

  const mesAnteriorNum = mesActualNum === 0 ? 11 : mesActualNum - 1;
  const anioAnteriorNum = mesActualNum === 0 ? anioActualNum - 1 : anioActualNum;

  // Filtrado de movimientos para el período de exportación seleccionado
  const movimientosPeriodo = useMemo(() => {
    if (periodoSeleccionado === "mesActual") {
      return movimientos.filter((m) => {
        const d = new Date(m.fecha);
        return d.getMonth() === mesActualNum && d.getFullYear() === anioActualNum;
      });
    }
    if (periodoSeleccionado === "mesAnterior") {
      return movimientos.filter((m) => {
        const d = new Date(m.fecha);
        return d.getMonth() === mesAnteriorNum && d.getFullYear() === anioAnteriorNum;
      });
    }
    return movimientos; // 'todo'
  }, [movimientos, periodoSeleccionado, mesActualNum, anioActualNum, mesAnteriorNum, anioAnteriorNum]);

  // Flujo de caja específico para el período seleccionado
  const cashflowPeriodo = useMemo(() => {
    const ingresos = movimientosPeriodo
      .filter((m) => m.tipo === "deposito")
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const egresos = movimientosPeriodo
      .filter((m) => m.tipo !== "deposito")
      .reduce((sum, m) => sum + Math.abs(Number(m.monto || 0)), 0);

    return {
      ingresos,
      egresos,
      neto: ingresos - egresos,
    };
  }, [movimientosPeriodo]);

  const ejecutarExportacion = () => {
    setIsExportModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando movimientos...</main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-statement, #print-statement * {
            visibility: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #print-statement {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Sidebar />
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="no-print">
          <Navbar
            usuario={{
              nombre: obtenerNombreCliente(),
              tipoCuenta: obtenerTipoCuenta(),
            }}
            cuentas={cuentas}
            cuentaActual={cuentaActual}
            onCambiarCuenta={setCuentaActual}
          />
        </div>

        <section className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Historial de Transacciones</h1>
            <p className="text-slate-500 text-sm">
              Visualiza las operaciones financieras asociadas a la cuenta {obtenerNumeroCuenta()}.
            </p>
          </div>

          <button
            onClick={handleExportarPDF}
            className="no-print bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Printer size={14} />
            Exportar Estado de Cuenta
          </button>
        </section>

        {/* 1. SECCIÓN DE MÉTRICAS / FLUJO DE CAJA (Diferenciación de UX/UI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
          
          {/* Card Ingresos */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ingresos</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                +${cashflow.ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Card Egresos */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="bg-rose-50 p-4 rounded-2xl text-rose-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Egresos</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                -${cashflow.egresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Card Flujo Neto */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${cashflow.neto >= 0 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flujo de Caja</p>
              <h3 className={`text-2xl font-black mt-1 ${cashflow.neto >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                {cashflow.neto >= 0 ? "+" : ""}${cashflow.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

        </div>

        {/* 2. BARRA DE BÚSQUEDA Y FILTRADO AVANZADO */}
        <section className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-slate-100 no-print">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por concepto o sucursal de origen..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-650 transition"
              />
            </div>

            <div className="flex gap-2">
              {[
                { val: "todo", lbl: "Todos" },
                { val: "ingresos", lbl: "Ingresos" },
                { val: "egresos", lbl: "Egresos" }
              ].map((opc) => (
                <button
                  key={opc.val}
                  onClick={() => setFiltro(opc.val)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    filtro === opc.val
                      ? "bg-blue-800 text-white shadow-lg shadow-blue-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  {opc.lbl}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. VISTA LEDGER DE TRANSACCIONES (PRINT FRIENDLY AREA) */}
        <section id="print-area" className="print-container bg-white rounded-3xl p-8 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between mb-8 no-print">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Historial de Transacciones
              </h2>
              <p className="text-xs text-slate-400">
                Se encontraron {movimientosFiltrados.length} operaciones que coinciden con tus filtros.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map((mov, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 px-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-xl transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl no-print ${
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
                      <h3 className="font-bold text-slate-850 text-sm">
                        {mov.concepto}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <p className="text-xs text-slate-400 font-medium">
                          {new Date(mov.fecha).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400 font-semibold">{mov.tipo === "deposito" ? "Ingreso" : "Egreso"}</span>
                      </div>

                      <span className="inline-block mt-2 bg-blue-50 text-blue-700 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {mov.sucursal || "Sin sucursal"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-md font-black ${
                        mov.tipo === "deposito"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {mov.tipo === "deposito" ? "+" : "-"}$
                      {Math.abs(Number(mov.monto || 0)).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-400 text-sm italic">
                  No se encontraron operaciones registradas para esta cuenta.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN OCULTA EN PANTALLA, VISIBLE SOLO AL IMPRIMIR (ESTADO DE CUENTA PROFESIONAL) ── */}
        <div id="print-statement" className="hidden">
          <div className="border-b-2 border-blue-800 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-blue-800 tracking-tight">BANCO NEXUS</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Estado de Cuenta Oficial
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-semibold">
                <p>Fecha de Emisión: {new Date().toLocaleDateString("es-MX")}</p>
                <p>Período: {
                  periodoSeleccionado === "mesActual" ? `${obtenerNombreMes(mesActualNum)} ${anioActualNum}` :
                  periodoSeleccionado === "mesAnterior" ? `${obtenerNombreMes(mesAnteriorNum)} ${anioAnteriorNum}` :
                  "Historial Completo"
                }</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8 text-xs bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Información del Cliente</h4>
                <p className="font-bold text-slate-800 mt-1 text-sm">{obtenerNombreCliente()}</p>
                <p className="text-slate-500 mt-0.5">CURP: {datosCuenta?.cliente?.curp || "MERC850312HDFNRS09"}</p>
              </div>
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detalles de la Cuenta</h4>
                <p className="font-bold text-slate-850 mt-1 text-sm">Número: {obtenerNumeroCuenta()}</p>
                <p className="text-slate-500 mt-0.5 capitalize">Tipo: {obtenerTipoCuenta()}</p>
              </div>
            </div>
          </div>

          {/* Resumen del período */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Resumen del Período</h3>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <div className="border-r border-slate-200">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Ingresos</p>
                <p className="font-black text-emerald-600 text-md mt-1">
                  +${cashflowPeriodo.ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="border-r border-slate-200">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Egresos</p>
                <p className="font-black text-rose-600 text-md mt-1">
                  -${cashflowPeriodo.egresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Neto</p>
                <p className={`font-black text-md mt-1 ${cashflowPeriodo.neto >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                  {cashflowPeriodo.neto >= 0 ? "+" : ""}${cashflowPeriodo.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Detalle de Movimientos en Tabla Oficial */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Detalle de Transacciones</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5">Fecha</th>
                  <th className="py-2.5">Concepto</th>
                  <th className="py-2.5">Sucursal</th>
                  <th className="py-2.5">Categoría</th>
                  <th className="py-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientosPeriodo.length > 0 ? (
                  movimientosPeriodo.map((mov, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-500">
                        {new Date(mov.fecha).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-3 font-bold text-slate-800">{mov.concepto}</td>
                      <td className="py-3 text-slate-500">{mov.sucursal || "Sin sucursal"}</td>
                      <td className="py-3 font-semibold text-slate-500">
                        {mov.tipo === "deposito" ? "Ingreso" : "Egreso"}
                      </td>
                      <td className={`py-3 text-right font-bold text-sm ${mov.tipo === "deposito" ? "text-emerald-600" : "text-rose-600"}`}>
                        {mov.tipo === "deposito" ? "+" : "-"}${Math.abs(Number(mov.monto || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No se registraron movimientos en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de página oficial del banco */}
          <div className="mt-16 border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400 font-medium">
            <p>Este documento es un comprobante oficial de transacciones emitido de forma digital por Banco Nexus.</p>
            <p className="mt-1">Banco Nexus S.A., Institución de Banca Múltiple. www.nexus.mx</p>
          </div>
        </div>

        {/* ── MODAL DE EXPORTACIÓN DE ESTADO DE CUENTA ── */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm no-print">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Exportar Estado de Cuenta</h3>
                  <p className="text-xs text-slate-400">Selecciona el período para generar tu reporte bancario.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Selector de Período */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Período del Reporte
                  </label>
                  <select
                    value={periodoSeleccionado}
                    onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-700 transition"
                  >
                    <option value="todo">Historial Completo ({movimientos.length} movs)</option>
                    <option value="mesActual">
                      Mes Actual ({obtenerNombreMes(mesActualNum)} {anioActualNum})
                    </option>
                    <option value="mesAnterior">
                      Mes Anterior ({obtenerNombreMes(mesAnteriorNum)} {anioAnteriorNum})
                    </option>
                  </select>
                </div>

                {/* Live Preview / Resumen Dinámico */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Vista Previa del Período
                  </p>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500">Transacciones Incluidas</span>
                    <span className="font-bold text-slate-800">{movimientosPeriodo.length} movs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500">Total Ingresos</span>
                    <span className="font-bold text-emerald-600">
                      +${cashflowPeriodo.ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500">Total Egresos</span>
                    <span className="font-bold text-rose-600">
                      -${cashflowPeriodo.egresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-bold">Flujo Neto</span>
                    <span className={`font-black ${cashflowPeriodo.neto >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                      {cashflowPeriodo.neto >= 0 ? "+" : ""}${cashflowPeriodo.neto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-150 text-slate-650 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={ejecutarExportacion}
                    className="flex-1 bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition cursor-pointer"
                  >
                    <Printer size={14} />
                    Generar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}