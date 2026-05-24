import { useState } from "react";
import { fetchConAlerta } from "../utils/fetchConAlerta";
import { useAlertaLatencia } from "../utils/useAlertaLatencia";
import AlertaBanner from "../components/AlertaBanner";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Search, User, Wallet, CheckCircle, AlertCircle } from "lucide-react";

export default function ConsultaCuenta() {
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [datosCuenta, setDatosCuenta]   = useState(null);
  const [movimientos, setMovimientos]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const { alerta, registrarAlerta, limpiarAlerta } = useAlertaLatencia();

  const usuario = {
    nombre:     datosCuenta?.cliente?.nombre || "Ernesto Gracia",
    tipoCuenta: datosCuenta?.cuenta?.tipo    || "Administrador",
  };

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (!numeroCuenta.trim()) return;

    setLoading(true);
    setError("");
    setDatosCuenta(null);
    setMovimientos([]);
    limpiarAlerta();

    try {
      const [
        { res: resCuenta,    alerta: alertaCuenta    },
        { res: resHistorial, alerta: alertaHistorial },
      ] = await Promise.all([
        fetchConAlerta(`http://localhost:3001/api/cuenta/${numeroCuenta.trim()}`),
        fetchConAlerta(`http://localhost:3001/api/historial/${numeroCuenta.trim()}`),
      ]);

      // Registrar ambas alertas (la de mayor severidad permanece)
      [alertaCuenta, alertaHistorial].forEach(registrarAlerta);

      if (!resCuenta) {
        throw new Error("No se pudo conectar al servidor — verifica el estado del nodo primario");
      }

      const dataCuenta = await resCuenta.json();
      if (!resCuenta.ok) {
        throw new Error(dataCuenta.mensaje || "Cuenta no encontrada");
      }

      setDatosCuenta(dataCuenta);

      if (resHistorial && resHistorial.ok) {
        const dataHistorial = await resHistorial.json();
        if (dataHistorial.ok) {
          setMovimientos(dataHistorial.movimientos || []);
        }
      }
    } catch (err) {
      setError(err.message || "Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar paginaActiva="consulta" />

      <main className="flex-1 p-10">
        <Navbar usuario={usuario} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consulta de Cuenta</h1>
          <p className="text-gray-500 mt-2">
            Ingresa el número de cuenta para consultar la información bancaria.
          </p>
        </div>

        {/* ── Formulario ────────────────────────────────────── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <label className="font-semibold text-gray-700">Número de Cuenta</label>
          <form onSubmit={handleConsultar} className="flex gap-4 mt-3">
            <input
              id="input-numero-cuenta"
              type="text"
              placeholder="Ej: NX01001"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              className="flex-1 border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
            <button
              id="btn-consultar"
              type="submit"
              className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-800 transition flex items-center gap-2"
              disabled={loading}
            >
              <Search size={20} />
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </form>
        </section>

        {/* ── Alerta latencia / nodo ────────────────────────── */}
        <AlertaBanner alerta={alerta} onClose={limpiarAlerta} />

        {/* ── Error de consulta ─────────────────────────────── */}
        {error && (
          <div
            id="error-consulta"
            className="bg-red-50 text-red-700 p-6 rounded-3xl flex items-center gap-4 mb-6 shadow-sm border border-red-100"
          >
            <AlertCircle size={28} />
            <div>
              <p className="font-bold">Error de consulta</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ── Resultados ───────────────────────────────────── */}
        {datosCuenta && (
          <>
            <section id="resultado-cuenta" className="bg-white rounded-3xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-100 text-blue-700 p-4 rounded-2xl">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cuenta Encontrada</h2>
                  <p className="text-gray-500">Información asociada a la cuenta consultada.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="text-blue-700" />
                    <h3 className="font-bold">Cliente</h3>
                  </div>
                  <p className="text-gray-500 text-sm">Nombre</p>
                  <p className="font-bold text-lg">{datosCuenta.cliente?.nombre || "Sin Nombre"}</p>
                  <p className="text-gray-500 text-sm mt-4">Correo</p>
                  <p className="font-semibold">{datosCuenta.cliente?.correo || "Sin Correo"}</p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="text-blue-700" />
                    <h3 className="font-bold">Cuenta</h3>
                  </div>
                  <p className="text-gray-500 text-sm">Número de cuenta</p>
                  <p className="font-bold text-lg">{datosCuenta.cuenta?.numeroCuenta}</p>
                  <p className="text-gray-500 text-sm mt-4">Tipo</p>
                  <p className="font-semibold capitalize">{datosCuenta.cuenta?.tipo}</p>
                </div>

                <div className="bg-blue-700 text-white rounded-2xl p-5">
                  <p className="text-blue-100">Saldo Disponible</p>
                  <h3 className="text-4xl font-bold mt-2">
                    ${datosCuenta.cuenta?.saldo?.toLocaleString("es-MX")}
                  </h3>
                  <p className="mt-5 text-blue-100">Estado</p>
                  <p className="font-bold capitalize">{datosCuenta.cuenta?.status}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-5">Movimientos de la cuenta</h2>
              {movimientos.length === 0 ? (
                <p className="text-gray-500 italic">No se registraron movimientos en esta cuenta.</p>
              ) : (
                <div className="space-y-4">
                  {movimientos.map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-gray-100 rounded-2xl p-4"
                    >
                      <div>
                        <h3 className="font-bold">{tx.concepto}</h3>
                        <p className="text-gray-500 text-sm">
                          {new Date(tx.fecha).toLocaleDateString("es-MX", {
                            day: "numeric", month: "short", year: "numeric",
                          })} · {tx.tipo}
                        </p>
                      </div>
                      <p className={`font-bold ${tx.tipo === "deposito" ? "text-green-600" : "text-red-600"}`}>
                        {tx.tipo === "deposito" ? "+" : "-"}$
                        {Math.abs(tx.monto).toLocaleString("es-MX")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}