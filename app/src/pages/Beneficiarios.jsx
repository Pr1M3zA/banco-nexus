import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { fetchConAlerta } from "../utils/fetchConAlerta";
import AlertMessage from "../components/AlertMessage";
import { Users, Plus, Edit2, Trash2, X, Loader2, Save } from "lucide-react";

export default function Beneficiarios() {
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ type: "", message: "" });

  // Estado del modal y formularios
  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState("agregar"); // "agregar" | "editar"
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState(null);
  const [formCuenta, setFormCuenta] = useState("");
  const [formAlias, setFormAlias] = useState("");
  const [operacionLoading, setOperacionLoading] = useState(false);
  const [alertaModal, setAlertaModal] = useState({ type: "", message: "" });
  
  // Previsualización
  const [nombreDestinoValidado, setNombreDestinoValidado] = useState("");
  const [validandoCuenta, setValidandoCuenta] = useState(false);

  const handleBlurCuenta = async () => {
    if (!formCuenta || formCuenta.length < 5) {
      setNombreDestinoValidado("");
      return;
    }
    setValidandoCuenta(true);
    setNombreDestinoValidado("");
    try {
      const API_URL = sessionStorage.getItem("api_url");
      const { res } = await fetchConAlerta(`${API_URL}/api/cuenta/validar/${formCuenta}`);
      if (res && res.ok) {
        const data = await res.json();
        setNombreDestinoValidado(data.nombre);
      } else {
        setNombreDestinoValidado("Cuenta no encontrada");
      }
    } catch (error) {
      setNombreDestinoValidado("Error al validar");
    } finally {
      setValidandoCuenta(false);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const API_URL = sessionStorage.getItem("api_url");
      const { res: resPerfil } = await fetchConAlerta(`${API_URL}/api/cuenta/perfil`);
      if (resPerfil && resPerfil.ok) {
        const dataPerfil = await resPerfil.json();
        setDatosCuenta({ cliente: dataPerfil.usuario, cuenta: dataPerfil.cuenta });
      }

      await cargarBeneficiarios();
    } catch (error) {
      console.error(error);
      setAlerta({ type: "error", message: "Error al cargar los datos. Intenta recargar la página." });
    } finally {
      setLoading(false);
    }
  };

  const cargarBeneficiarios = async () => {
    const API_URL = sessionStorage.getItem("api_url");
    const { res } = await fetchConAlerta(`${API_URL}/api/beneficiarios`);
    if (res && res.ok) {
      const data = await res.json();
      setBeneficiarios(data.beneficiarios || []);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalAgregar = () => {
    setModoModal("agregar");
    setBeneficiarioSeleccionado(null);
    setFormCuenta("");
    setFormAlias("");
    setNombreDestinoValidado("");
    setAlertaModal({ type: "", message: "" });
    setModalOpen(true);
  };

  const abrirModalEditar = (beneficiario) => {
    setModoModal("editar");
    setBeneficiarioSeleccionado(beneficiario);
    setFormCuenta(beneficiario.numeroCuentaDestino);
    setFormAlias(beneficiario.alias);
    setAlertaModal({ type: "", message: "" });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setFormCuenta("");
    setFormAlias("");
    setNombreDestinoValidado("");
    setAlertaModal({ type: "", message: "" });
    setBeneficiarioSeleccionado(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setAlertaModal({ type: "", message: "" });

    if (!formAlias.trim()) {
      return setAlertaModal({ type: "warning", message: "El alias es requerido." });
    }

    if (modoModal === "agregar" && !formCuenta.trim()) {
      return setAlertaModal({ type: "warning", message: "El número de cuenta es requerido." });
    }

    setOperacionLoading(true);
    try {
      const token = localStorage.getItem("nexus_token") || sessionStorage.getItem("nexus_token");
      
      let result;
      const API_URL = sessionStorage.getItem("api_url");
      if (modoModal === "agregar") {
        result = await fetchConAlerta(`${API_URL}/api/beneficiarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numeroCuentaDestino: formCuenta.toUpperCase(), alias: formAlias })
        });
      } else {
        result = await fetchConAlerta(`${API_URL}/api/beneficiarios/${beneficiarioSeleccionado._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: formAlias })
        });
      }

      const res = result.res;
      if (!res) throw new Error("Sin conexión al servidor");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "Error al procesar la solicitud");
      }

      setAlerta({ type: "success", message: modoModal === "agregar" ? "Beneficiario agregado." : "Beneficiario actualizado." });
      cerrarModal();
      cargarBeneficiarios();

    } catch (error) {
      setAlertaModal({ type: "error", message: error.message });
    } finally {
      setOperacionLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar a este beneficiario?")) return;
    
    try {
      const API_URL = sessionStorage.getItem("api_url");
      const { res } = await fetchConAlerta(`${API_URL}/api/beneficiarios/${id}`, {
        method: "DELETE"
      });
      if (!res) throw new Error("Sin conexión al servidor");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.mensaje);
      
      setAlerta({ type: "success", message: "Beneficiario eliminado correctamente." });
      cargarBeneficiarios();
    } catch (error) {
      setAlerta({ type: "error", message: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-500 font-medium">Cargando libreta de contactos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Navbar
          usuario={{
            nombre: datosCuenta?.cliente?.nombre || "Usuario",
            tipoCuenta: datosCuenta?.cuenta?.tipo || "",
          }}
          cuentas={datosCuenta?.cuenta ? [{ cuenta: datosCuenta.cuenta.numeroCuenta }] : []}
          cuentaActual={datosCuenta?.cuenta?.numeroCuenta || ""}
          onCambiarCuenta={() => {}}
        />

        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Users size={12} />
              Libreta de Contactos
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mis Beneficiarios</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestiona las cuentas frecuentes a las que realizas transferencias.
            </p>
          </div>

          <button
            onClick={abrirModalAgregar}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Añadir Beneficiario
          </button>
        </section>

        {alerta.message && (
          <div className="mb-6">
            <AlertMessage type={alerta.type} message={alerta.message} onClose={() => setAlerta({ type: "", message: "" })} />
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          {beneficiarios.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No hay beneficiarios</h3>
              <p className="text-slate-400 text-sm mt-1 mb-6 max-w-sm mx-auto">
                No tienes ninguna cuenta guardada en tu libreta de contactos. Añade una para facilitar tus próximas transferencias.
              </p>
              <button
                onClick={abrirModalAgregar}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition text-sm"
              >
                + Añadir mi primer beneficiario
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beneficiarios.map((b) => (
                <div key={b._id} className="border border-slate-150 rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50 group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg">
                      {b.alias.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => abrirModalEditar(b)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar nombre"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminar(b._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{b.alias}</h3>
                  <p className="text-slate-500 font-mono text-sm mt-1">{b.numeroCuentaDestino}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={cerrarModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="font-black text-slate-800 text-2xl">
                {modoModal === "agregar" ? "Añadir Beneficiario" : "Editar Beneficiario"}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {modoModal === "agregar" ? "Ingresa los datos de la cuenta destino." : "Modifica el nombre con el que identificas esta cuenta."}
              </p>
            </div>

            {alertaModal.message && (
              <div className="mb-4">
                <AlertMessage type={alertaModal.type} message={alertaModal.message} onClose={() => setAlertaModal({ type: "", message: "" })} />
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-5">
              {modoModal === "agregar" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1234567890"
                    value={formCuenta}
                    onChange={(e) => setFormCuenta(e.target.value.toUpperCase())}
                    onBlur={handleBlurCuenta}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-slate-700"
                  />
                  {validandoCuenta && <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Buscando cuenta...</p>}
                  {nombreDestinoValidado && !validandoCuenta && (
                    <p className={`text-xs mt-1.5 font-bold ${nombreDestinoValidado === 'Cuenta no encontrada' || nombreDestinoValidado === 'Error al validar' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {nombreDestinoValidado === 'Cuenta no encontrada' || nombreDestinoValidado === 'Error al validar' ? nombreDestinoValidado : `Propietario: ${nombreDestinoValidado}`}
                    </p>
                  )}
                </div>
              )}
              
              {modoModal === "editar" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Cuenta Destino
                  </label>
                  <input
                    type="text"
                    value={formCuenta}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Nombre o Alias
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mi mamá, Pago Renta..."
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={operacionLoading || !formAlias || (modoModal === "agregar" && !formCuenta)}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {operacionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
