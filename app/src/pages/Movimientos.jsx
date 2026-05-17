import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Movimientos() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState("");
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState("todo");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => datosCuenta?.cuenta?.tipo || "";
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;

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
      console.error("Error cargando movimientos:", error);
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

  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];

    if (filtro !== "todo") {
      lista = lista.filter((m) => m.tipo === filtro);
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

  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando movimientos...</main>
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
            Movimientos
          </h1>
          <p className="text-slate-500 mt-2">
            Consulta el historial de operaciones de la cuenta {obtenerNumeroCuenta()}.
          </p>
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Buscar por concepto, tipo o sucursal..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex gap-2">
              {["todo", "deposito", "retiro", "cargo"].map((opcion) => (
                <button
                  key={opcion}
                  onClick={() => setFiltro(opcion)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition ${
                    filtro === opcion
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {opcion === "todo" ? "Todos" : opcion}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Historial de movimientos
              </h2>
              <p className="text-sm text-slate-500">
                Total encontrados: {movimientosFiltrados.length}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map((mov, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-5 px-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-xl transition"
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
                        <ArrowUpRight size={22} />
                      ) : (
                        <ArrowDownRight size={22} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {mov.concepto}
                      </h3>

                      <p className="text-sm text-slate-500">
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
                      className={`text-lg font-black ${
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
                <p className="text-slate-400">
                  No hay movimientos para mostrar.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}