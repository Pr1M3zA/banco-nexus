import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { fetchConAlerta } from "../utils/fetchConAlerta";
import AlertMessage from "../components/AlertMessage";
import { Send, ArrowRight, Loader2, Info, Users, Plus, X } from "lucide-react";

export default function Transferencia() {
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [loadingDatos, setLoadingDatos] = useState(true);
  
  // Formulario
  const [cuentaDestino, setCuentaDestino] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  
  // Estado y alertas de la operación
  const [loadingTransferencia, setLoadingTransferencia] = useState(false);
  const [alerta, setAlerta] = useState({ type: "", message: "" });
  
  // Beneficiarios
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [modalBeneficiarioOpen, setModalBeneficiarioOpen] = useState(false);
  const [formCuentaNuevo, setFormCuentaNuevo] = useState("");
  const [formAliasNuevo, setFormAliasNuevo] = useState("");
  const [guardandoBeneficiario, setGuardandoBeneficiario] = useState(false);
  const [alertaModal, setAlertaModal] = useState({ type: "", message: "" });
  
  // Previsualización (modal)
  const [nombreNuevoValidado, setNombreNuevoValidado] = useState("");
  const [validandoNuevo, setValidandoNuevo] = useState(false);

  const handleBlurCuentaNuevo = async () => {
    if (!formCuentaNuevo || formCuentaNuevo.length < 5) {
      setNombreNuevoValidado("");
      return;
    }
    setValidandoNuevo(true);
    setNombreNuevoValidado("");
    try {
      const { res } = await fetchConAlerta(`http://localhost:3001/api/cuenta/validar/${formCuentaNuevo}`);
      if (res && res.ok) {
        const data = await res.json();
        setNombreNuevoValidado(data.nombre);
      } else {
        setNombreNuevoValidado("Cuenta no encontrada");
      }
    } catch (error) {
      setNombreNuevoValidado("Error al validar");
    } finally {
      setValidandoNuevo(false);
    }
  };
  
  // Previsualización
  const [nombreDestinoValidado, setNombreDestinoValidado] = useState("");
  const [validandoCuenta, setValidandoCuenta] = useState(false);

  const handleBlurCuentaDestino = async () => {
    if (!cuentaDestino || cuentaDestino.length < 5) {
      setNombreDestinoValidado("");
      return;
    }
    const bene = beneficiarios.find(b => b.numeroCuentaDestino === cuentaDestino);
    if (bene) {
      setNombreDestinoValidado(bene.alias);
      return;
    }
    
    setValidandoCuenta(true);
    setNombreDestinoValidado("");
    try {
      const { res } = await fetchConAlerta(`http://localhost:3001/api/cuenta/validar/${cuentaDestino}`);
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
  
  const montoInputRef = useRef(null);

  const cargarDatos = async () => {
    setLoadingDatos(true);
    try {
      const { res } = await fetchConAlerta(`http://localhost:3001/api/cuenta/perfil`);
      if (!res) throw new Error("Sin conexión al servidor");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "No se pudo cargar tu perfil");
      }

      setDatosCuenta({
        cliente: data.usuario,
        cuenta: data.cuenta
      });

      const { res: resBen } = await fetchConAlerta(`http://localhost:3001/api/beneficiarios`);
      if (resBen && resBen.ok) {
        const dataBen = await resBen.json();
        setBeneficiarios(dataBen.beneficiarios || []);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setAlerta({ type: "error", message: "Error al cargar la información de tu cuenta. Intenta recargar la página." });
    } finally {
      setLoadingDatos(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => "Débito";
  const obtenerNumeroCuenta = () => datosCuenta?.cuenta?.numeroCuenta || "";
  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo || 0;

  const handleGuardarBeneficiario = async (e) => {
    e.preventDefault();
    setAlertaModal({ type: "", message: "" });
    if (!formCuentaNuevo || !formAliasNuevo) return;
    setGuardandoBeneficiario(true);
    
    try {
      const { res } = await fetchConAlerta("http://localhost:3001/api/beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroCuentaDestino: formCuentaNuevo.toUpperCase(), alias: formAliasNuevo })
      });
      
      if (!res) throw new Error("Sin conexión al servidor");
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      
      setAlerta({ type: "success", message: "Beneficiario guardado con éxito." });
      setCuentaDestino(formCuentaNuevo.toUpperCase());
      setNombreDestinoValidado(formAliasNuevo);
      
      setFormAliasNuevo("");
      setFormCuentaNuevo("");
      setNombreNuevoValidado("");
      setModalBeneficiarioOpen(false);
      cargarDatos();
    } catch (err) {
      setAlertaModal({ type: "error", message: err.message || "Error al guardar beneficiario." });
    } finally {
      setGuardandoBeneficiario(false);
    }
  };

  const handleTransferir = async (e) => {
    e.preventDefault();
    setAlerta({ type: "", message: "" });

    if (!cuentaDestino.trim()) {
      return setAlerta({ type: "warning", message: "Por favor ingresa la cuenta destino." });
    }

    const valorMonto = parseFloat(monto);
    if (isNaN(valorMonto) || valorMonto < 1) {
      return setAlerta({ type: "warning", message: "El monto mínimo de transferencia es de $1.00." });
    }

    if (valorMonto > obtenerSaldo()) {
      return setAlerta({ type: "warning", message: "No tienes saldo suficiente para esta operación." });
    }

    setLoadingTransferencia(true);

    try {
      const { res } = await fetchConAlerta("http://localhost:3001/api/transferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cuentaOrigen: obtenerNumeroCuenta(),
          cuentaDestino,
          monto: valorMonto,
          concepto: concepto || "Transferencia"
        })
      });

      if (!res) throw new Error("Sin conexión al servidor");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "Error al procesar la transferencia");
      }

      setAlerta({ type: "success", message: "¡Transferencia enviada con éxito!" });
      setCuentaDestino("");
      setNombreDestinoValidado("");
      setMonto("");
      setConcepto("");
      
      // Recargar saldo después de la transferencia exitosa
      cargarDatos();

    } catch (error) {
      setAlerta({ type: "error", message: error.message || "Error de conexión con el servidor." });
    } finally {
      setLoadingTransferencia(false);
    }
  };

  if (loadingDatos) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-500 font-medium">Cargando módulo de transferencias...</p>
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
            nombre: obtenerNombreCliente(),
            tipoCuenta: obtenerTipoCuenta(),
          }}
          cuentas={datosCuenta?.cuenta ? [{ cuenta: datosCuenta.cuenta.numeroCuenta }] : []}
          cuentaActual={obtenerNumeroCuenta()}
          onCambiarCuenta={() => {}}
        />

        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Send size={12} />
            Operaciones Rápidas
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Transferir Dinero</h1>
          <p className="text-slate-500 text-sm mt-1">
            Envía dinero al instante a cualquier cuenta de Banco Nexus o bancos aliados.
          </p>
        </section>

        {alerta.message && (
          <div className="mb-6">
            <AlertMessage
              type={alerta.type}
              message={alerta.message}
              onClose={() => setAlerta({ type: "", message: "" })}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario de Transferencia */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleTransferir} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>Cuenta Destino</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. NX01002"
                    value={cuentaDestino}
                    onChange={(e) => setCuentaDestino(e.target.value.toUpperCase())}
                    onBlur={handleBlurCuentaDestino}
                    className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-bold"
                  />
                  {validandoCuenta && <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Buscando cuenta...</p>}
                  {nombreDestinoValidado && !validandoCuenta && (
                    <p className={`text-xs mt-1.5 font-bold ${nombreDestinoValidado === 'Cuenta no encontrada' || nombreDestinoValidado === 'Error al validar' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {nombreDestinoValidado === 'Cuenta no encontrada' || nombreDestinoValidado === 'Error al validar' ? nombreDestinoValidado : `Destinatario: ${nombreDestinoValidado}`}
                    </p>
                  )}

                  {/* Beneficiarios UI */}
                  <div className="mt-4 bg-slate-50 border border-slate-150 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} /> Mis Beneficiarios
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormCuentaNuevo(cuentaDestino);
                          setFormAliasNuevo("");
                          setNombreNuevoValidado("");
                          setAlertaModal({ type: "", message: "" });
                          setModalBeneficiarioOpen(true);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                      >
                        <Plus size={14}/>
                        Añadir nuevo beneficiario
                      </button>
                    </div>
                    


                    {beneficiarios.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {beneficiarios.map(b => (
                          <button
                            key={b._id}
                            type="button"
                            onClick={() => {
                              setCuentaDestino(b.numeroCuentaDestino);
                              setNombreDestinoValidado(b.alias);
                              setMostrandoFormBeneficiario(false);
                              setAliasBeneficiario("");
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${cuentaDestino === b.numeroCuentaDestino ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          >
                            {b.alias}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No tienes beneficiarios guardados.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>Importe a Transferir</span>
                    <span className="text-blue-600 cursor-pointer" onClick={() => {
                      setMonto(obtenerSaldo().toString());
                      montoInputRef.current?.focus();
                    }}>Monto Máximo</span>
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                      $
                    </span>
                    <input
                      ref={montoInputRef}
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-bold text-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Concepto de Pago (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Pago de renta, Cena del viernes..."
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-slate-700 font-medium"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loadingTransferencia || !cuentaDestino || !monto}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingTransferencia ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando transferencia...
                      </>
                    ) : (
                      <>
                        Confirmar y Enviar
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Columna Derecha: Tarjeta de Origen e Info */}
          <div className="lg:col-span-1 space-y-6">
            

            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl p-6 text-white shadow-xl relative overflow-hidden min-h-[200px] flex flex-col justify-between border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full filter blur-xl -mr-10 -mt-10" />
              
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-2xl font-black tracking-widest text-slate-100">NEXUS</p>
                  <div className="w-10 h-7 bg-amber-400/80 rounded-md mt-4 flex items-center justify-center opacity-85 shadow-inner">
                    <div className="w-6 h-4 border border-amber-600/30 rounded" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Saldo Disponible</p>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                    ${obtenerSaldo().toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>

              <div className="z-10 relative mt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cuenta Origen</p>
                    <p className="font-mono font-bold text-slate-200 tracking-widest text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {obtenerNumeroCuenta()}
                    </p>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-200 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700/50">
                    DÉBITO
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Transferencias Seguras</h4>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    Las transferencias entre cuentas Nexus se reflejan instantáneamente. No se cobran comisiones adicionales por este servicio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Nuevo Beneficiario */}
      {modalBeneficiarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setModalBeneficiarioOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="font-black text-slate-800 text-2xl">Añadir Beneficiario</h3>
              <p className="text-slate-500 text-sm mt-1">
                Ingresa los datos de la cuenta destino para guardarla en tu libreta.
              </p>
            </div>

            {alertaModal.message && (
              <div className="mb-4">
                <AlertMessage type={alertaModal.type} message={alertaModal.message} onClose={() => setAlertaModal({ type: "", message: "" })} />
              </div>
            )}

            <form onSubmit={handleGuardarBeneficiario} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  placeholder="Ej. NX01002"
                  value={formCuentaNuevo}
                  onChange={(e) => setFormCuentaNuevo(e.target.value.toUpperCase())}
                  onBlur={handleBlurCuentaNuevo}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-slate-700"
                />
                {validandoNuevo && <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Buscando cuenta...</p>}
                {nombreNuevoValidado && !validandoNuevo && (
                  <p className={`text-xs mt-1.5 font-bold ${nombreNuevoValidado === 'Cuenta no encontrada' || nombreNuevoValidado === 'Error al validar' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {nombreNuevoValidado === 'Cuenta no encontrada' || nombreNuevoValidado === 'Error al validar' ? nombreNuevoValidado : `Propietario: ${nombreNuevoValidado}`}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Nombre o Alias
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mi mamá, Pago Renta..."
                  value={formAliasNuevo}
                  onChange={(e) => setFormAliasNuevo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalBeneficiarioOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoBeneficiario || !formAliasNuevo || !formCuentaNuevo}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {guardandoBeneficiario ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
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
