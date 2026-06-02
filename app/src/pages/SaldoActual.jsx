import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  User,
  Sliders,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  ShieldCheck,
  Percent,
  Coins,
  Briefcase,
  Layers,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function SaldoActual() {
  const cuentaInicial = "NX01001";

  const [datosCuenta, setDatosCuenta] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || cuentaInicial;
  });
  const [loading, setLoading] = useState(true);

  // ── Estados de seguridad de la Tarjeta ──
  const [bloqueada, setBloqueada] = useState(false);
  const [comprasExtranjero, setComprasExtranjero] = useState(true);
  const [limiteAtm, setLimiteAtm] = useState(5000);
  const [limiteWeb, setLimiteWeb] = useState(12000);
  const [alertaTarjeta, setAlertaTarjeta] = useState("");

  // ── Estados del Simulador de Ahorro (ahorro) ──
  const [ahorroMensual, setAhorroMensual] = useState(1500);
  const [plazoMeses, setPlazoMeses] = useState(12);
  const tasaAnualAhorro = 0.075; // 7.5% de rendimiento anual

  // ── Estados del Simulador de Adelanto de Nómina (nomina) ──
  const [montoAdelanto, setMontoAdelanto] = useState(2000);
  const [plazoQuincenas, setPlazoQuincenas] = useState(2); // 1, 2, 3 o 4 quincenas

  // ── Estados del Simulador de Financiamiento / MSI (corriente) ──
  const [montoFinanciar, setMontoFinanciar] = useState(5000);
  const [plazoFinanciar, setPlazoFinanciar] = useState(6); // 3, 6, 9 o 12 meses
  const [aplicarMsi, setAplicarMsi] = useState(true);
  const tasaAnualFinanciar = 0.22; // 22% interés anual para corriente si no es MSI

  // ── Estados Dinámicos de Simulación en Frontend (Sin alterar API) ──
  const [apartadoAhorro, setApartadoAhorro] = useState(0);
  const [montoMover, setMontoMover] = useState("");
  const [errorApartado, setErrorApartado] = useState("");
  const [adelantoActivo, setAdelantoActivo] = useState(0);
  const [pagoRealizado, setPagoRealizado] = useState(0);
  const [comprasDiferidas, setComprasDiferidas] = useState([]);
  const [formMontoPago, setFormMontoPago] = useState("");

  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo ?? 0;
  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => (datosCuenta?.cuenta?.tipo || "").toLowerCase();
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;
  const obtenerTarjeta = () => datosCuenta?.cuenta?.tarjeta || "4321 9876 0000 1234";

  // Calcular saldo disponible basado en simulaciones
  const obtenerSaldoCalculado = () => {
    const saldoBase = obtenerSaldo();
    const tipoCta = obtenerTipoCuenta();
    if (tipoCta === "ahorro") {
      return Math.max(0, saldoBase - apartadoAhorro);
    } else if (tipoCta === "nomina") {
      return saldoBase + adelantoActivo;
    } else if (tipoCta === "corriente") {
      // En corriente (tarjeta crédito), el saldo base actúa como la línea disponible
      const comprasMonto = comprasDiferidas.reduce((acc, c) => acc + c.monto, 0);
      return Math.min(60000, Math.max(0, saldoBase - comprasMonto + pagoRealizado));
    }
    return saldoBase;
  };

  const cargarCuentas = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cuentas");
      const data = await res.json();

      const lista = data.cuentas && Array.isArray(data.cuentas) ? data.cuentas : [];
      setCuentas(lista);

      const cuentaGuardada = localStorage.getItem("cuentaActual");
      if (!cuentaGuardada && lista.length > 0) {
        const primera = lista[0].cuenta;
        setCuentaActual(primera);
        localStorage.setItem("cuentaActual", primera);
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      setCuentas([]);
    }
  };

  const cargarDatos = async (cuenta) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/cuenta/${cuenta}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "No se pudo cargar la cuenta");
      }

      setDatosCuenta(data);
    } catch (error) {
      console.error("Error cargando saldo:", error);
      setDatosCuenta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  useEffect(() => {
    if (cuentaActual) {
      localStorage.setItem("cuentaActual", cuentaActual);
      cargarDatos(cuentaActual);
    }
  }, [cuentaActual]);

  useEffect(() => {
    if (datosCuenta && datosCuenta.cuenta) {
      const saldoTotal = datosCuenta.cuenta.saldo || 0;
      const tipoCta = (datosCuenta.cuenta.tipo || "").toLowerCase();
      // Inicializar el apartado de ahorro en 20% del saldo de la base de datos para ahorro
      if (tipoCta === "ahorro") {
        setApartadoAhorro(Math.round((saldoTotal * 0.2) / 500) * 500 || 1000);
      } else {
        setApartadoAhorro(0);
      }
      setAdelantoActivo(0);
      setPagoRealizado(0);
      setComprasDiferidas([]);
      setMontoMover("");
      setErrorApartado("");
      setFormMontoPago("");
    }
  }, [datosCuenta]);

  // ── 1. Cálculos de Ahorro ──
  const calculoAhorro = () => {
    const tasaMensual = tasaAnualAhorro / 12;
    let acumulado = apartadoAhorro; // Empieza con el dinero actual guardado en el apartado
    let aportadoTotal = apartadoAhorro;

    for (let i = 0; i < plazoMeses; i++) {
      acumulado = (acumulado + ahorroMensual) * (1 + tasaMensual);
      aportadoTotal += ahorroMensual;
    }

    const intereses = acumulado - aportadoTotal;
    return {
      aportado: aportadoTotal,
      intereses: Math.max(0, intereses),
      total: acumulado,
    };
  };

  // ── 2. Cálculos de Adelanto de Nómina ──
  const calculoNomina = () => {
    const comisionApertura = montoAdelanto * 0.035; // 3.5% comisión fija
    const interesQuincenal = 0.012; // 1.2% interés por quincena
    const interesTotal = montoAdelanto * interesQuincenal * plazoQuincenas;
    const iva = (comisionApertura + interesTotal) * 0.16;
    const costoTotal = comisionApertura + interesTotal + iva;
    const totalALiquidar = montoAdelanto + costoTotal;

    return {
      comision: comisionApertura,
      interes: interesTotal,
      iva,
      costo: costoTotal,
      total: totalALiquidar,
      cuotaQuincenal: totalALiquidar / plazoQuincenas,
    };
  };

  // ── 3. Cálculos de Corriente (MSI / Financiamiento) ──
  const calculoCorriente = () => {
    if (aplicarMsi) {
      return {
        interes: 0,
        total: montoFinanciar,
        cuotaMensual: montoFinanciar / plazoFinanciar,
        tasa: 0,
      };
    }

    // Financiamiento con interés (22% anualizado amortizado simple)
    const interesTotal = montoFinanciar * (tasaAnualFinanciar / 12) * plazoFinanciar;
    const totalFinanciado = montoFinanciar + interesTotal;

    return {
      interes: interesTotal,
      total: totalFinanciado,
      cuotaMensual: totalFinanciado / plazoFinanciar,
      tasa: tasaAnualFinanciar * 100,
    };
  };

  const resAhorro = calculoAhorro();
  const resNomina = calculoNomina();
  const resCorriente = calculoCorriente();

  const handleGuardarLimites = () => {
    setAlertaTarjeta("🔒 Parámetros de seguridad actualizados con éxito.");
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  // ── Handlers de interacción por cuenta (Frontend) ──
  const handleMoverApartado = () => {
    setErrorApartado("");
    const monto = Number(montoMover);
    if (isNaN(monto) || monto <= 0) {
      setErrorApartado("Ingrese un monto válido mayor a 0.");
      return;
    }
    const saldoMax = obtenerSaldo();
    if (saldoMax - apartadoAhorro < monto) {
      setErrorApartado("Saldo disponible insuficiente.");
      return;
    }
    setApartadoAhorro((prev) => prev + monto);
    setMontoMover("");
    setAlertaTarjeta("💰 Fondos movidos al apartado de ahorro.");
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  const handleRegresarDisponible = () => {
    setErrorApartado("");
    const monto = Number(montoMover);
    if (isNaN(monto) || monto <= 0) {
      setErrorApartado("Ingrese un monto válido mayor a 0.");
      return;
    }
    if (apartadoAhorro < monto) {
      setErrorApartado("No tienes suficientes fondos en tu apartado.");
      return;
    }
    setApartadoAhorro((prev) => prev - monto);
    setMontoMover("");
    setAlertaTarjeta("🔓 Fondos liberados al saldo disponible.");
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  const handlePagarTarjeta = (monto) => {
    const disponible = obtenerSaldoCalculado();
    const deudaMax = 60000 - disponible;
    if (monto <= 0 || isNaN(monto)) return;
    const pagoAbonado = Math.min(monto, deudaMax);
    setPagoRealizado((prev) => prev + pagoAbonado);
    setAlertaTarjeta(`🎉 Pago de $${pagoAbonado.toLocaleString("es-MX")} aplicado con éxito.`);
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  const handleCancelarDiferido = (id, monto) => {
    setComprasDiferidas((prev) => prev.filter((c) => c.id !== id));
    setAlertaTarjeta(`🗑️ Diferimiento de $${monto.toLocaleString("es-MX")} cancelado.`);
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  const handleConfirmarAdelanto = () => {
    setAdelantoActivo(montoAdelanto);
    setAlertaTarjeta(`✅ Adelanto de $${montoAdelanto} transferido a tu saldo.`);
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  const handleConfirmarDiferimiento = () => {
    const comprasMonto = comprasDiferidas.reduce((acc, c) => acc + c.monto, 0);
    const creditoDisponible = obtenerSaldo() - comprasMonto + pagoRealizado;
    
    if (montoFinanciar > creditoDisponible) {
      alert("Error: Tu línea de crédito disponible es insuficiente para diferir esta compra.");
      return;
    }

    const nuevaCompra = {
      id: Date.now(),
      concepto: aplicarMsi ? "Compra MSI" : "Financiamiento Fijo",
      monto: montoFinanciar,
      plazo: plazoFinanciar,
      cuota: resCorriente.cuotaMensual,
    };

    setComprasDiferidas((prev) => [...prev, nuevaCompra]);
    setAlertaTarjeta(`🛍️ Compra de $${montoFinanciar.toLocaleString("es-MX")} diferida a ${plazoFinanciar} meses.`);
    setTimeout(() => setAlertaTarjeta(""), 4000);
  };

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando saldo...</main>
      </div>
    );
  }

  const tipo = obtenerTipoCuenta();
  const deudaTotal = tipo === "corriente" ? Math.max(0, 60000 - obtenerSaldoCalculado()) : 0;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Navbar
          usuario={{
            nombre: obtenerNombreCliente(),
            tipoCuenta: obtenerTipoCuenta(),
          }}
          cuentas={cuentas}
          cuentaActual={cuentaActual}
          onCambiarCuenta={setCuentaActual}
        />

        <section className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Saldo y Centro Financiero</h1>
          <p className="text-slate-500 text-sm">
            Controla tus límites de tarjeta y simula tus opciones financieras según el perfil de tu cuenta.
          </p>
        </section>

        {!datosCuenta ? (
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <p className="text-slate-500">No se pudo cargar la información de la cuenta.</p>
          </section>
        ) : (
          <div className="space-y-8">
            
            {/* 1. SECCIÓN PRINCIPAL: SALDO DISPONIBLE Y TARJETA DIGITAL */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Tarjeta de Saldo Disponible / Crédito Disponible */}
              <div className={`xl:col-span-1 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between min-h-[280px] transition-all duration-300 ${
                tipo === "ahorro" 
                  ? "bg-gradient-to-br from-emerald-700 to-indigo-900 shadow-emerald-100/30" 
                  : tipo === "nomina"
                  ? "bg-gradient-to-br from-blue-700 to-indigo-950 shadow-blue-100/30"
                  : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 shadow-slate-100/10"
              }`}>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      {tipo === "ahorro" 
                        ? "Cuenta Ahorro" 
                        : tipo === "nomina" 
                        ? "Cuenta Nómina" 
                        : "Tarjeta de Crédito Black"}
                    </span>
                    <Wallet size={24} className={tipo === "ahorro" ? "text-emerald-200" : "text-blue-200"} />
                  </div>
                  
                  <p className="text-blue-100/70 text-[9px] uppercase tracking-widest font-bold">
                    {tipo === "corriente" ? "Línea de Crédito Disponible" : "Fondos Disponibles"}
                  </p>
                  
                  <h2 className="text-4xl font-black mt-2 tracking-tight">
                    ${obtenerSaldoCalculado().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>

                  {/* Detalles secundarios en el balance */}
                  {tipo === "ahorro" && (
                    <div className="mt-4 bg-white/10 p-2.5 rounded-xl text-[10px] flex justify-between items-center">
                      <span className="text-emerald-200 font-semibold flex items-center gap-1">
                        <TrendingUp size={12} />
                        Bolsillo Reservado:
                      </span>
                      <span className="font-bold text-white">
                        ${apartadoAhorro.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {tipo === "nomina" && (
                    <div className="mt-4 bg-white/10 p-2.5 rounded-xl text-[10px] flex justify-between items-center">
                      <span className="text-blue-200 font-semibold">Siguiente Quincena:</span>
                      <span className="font-bold text-emerald-400">+$12,500.00 (En 3d)</span>
                    </div>
                  )}

                  {tipo === "corriente" && (
                    <div className="mt-4 bg-white/5 border border-white/10 p-3 rounded-xl text-[10px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Límite Total:</span>
                        <span className="font-bold text-white">$60,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Deuda al Corte:</span>
                        <span className="font-bold text-red-400">
                          ${deudaTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-white/10">
                        <span className="text-slate-400 font-semibold">Pago Mínimo:</span>
                        <span className="font-bold text-amber-300">
                          ${Math.max(0, Math.round(deudaTotal * 0.05)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-[11px] text-blue-100/80 font-semibold uppercase tracking-wider">
                    <span>Cuenta {obtenerNumeroCuenta()}</span>
                    <span>{tipo === "corriente" ? "Crédito" : "Débito"}</span>
                  </div>
                </div>
              </div>


              <div className="xl:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
                
                {/* Visual Card Component */}
                <div className={`flex-shrink-0 w-full md:w-80 h-48 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between select-none transition-all duration-300 ${
                  tipo === "ahorro"
                    ? "bg-gradient-to-br from-stone-700 via-amber-800 to-stone-900 border border-amber-500/20 shadow-stone-950/45"
                    : tipo === "nomina"
                    ? "bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 shadow-indigo-700/20"
                    : "bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-800 border border-slate-700 shadow-slate-900/50"
                }`}>
                  {/* Overlay de Bloqueo */}
                  {bloqueada && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-300">
                      <Lock size={28} className="text-red-400 animate-pulse" />
                      <p className="text-xs uppercase font-bold text-red-400 mt-2 tracking-wider">
                        Tarjeta Inactiva
                      </p>
                    </div>
                  )}


                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full filter blur-xl -mr-10 -mt-10" />

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-slate-100/90 font-bold uppercase tracking-widest">
                        {tipo === "ahorro" ? "Ahorro Gold" : tipo === "nomina" ? "Nómina Activa" : "VIP Black Card"}
                      </p>
                      <div className="w-10 h-7 bg-amber-400/80 rounded-md mt-2 flex items-center justify-center opacity-85">
                        <div className="w-6 h-4 border border-amber-600/30 rounded" />
                      </div>
                    </div>
                    <CreditCard size={22} className="text-slate-300" />
                  </div>

                  <div>
                    <p className="text-md font-bold tracking-widest text-slate-100">
                      {obtenerTarjeta()}
                    </p>
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-[7px] text-slate-400 uppercase font-bold">
                          Titular
                        </p>
                        <p className="text-xs font-semibold tracking-wider text-slate-200 truncate w-40">
                          {obtenerNombreCliente()}
                        </p>
                      </div>
                      <div className={`h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-white ${
                        tipo === "corriente" ? "px-3 text-[9px]" : "w-8 text-[10px]"
                      }`}>
                        {tipo === "corriente" ? "NX-CR" : "NX"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles Interactivos de Tarjeta */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                      {tipo === "corriente" ? "Gestión de Crédito" : "Seguridad de Tarjeta"}
                    </h3>
                    {alertaTarjeta && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                        {alertaTarjeta}
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Botón de Bloqueo Temporal */}
                    <button
                      onClick={() => setBloqueada(!bloqueada)}
                      className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition ${
                        bloqueada
                          ? "bg-red-50 border-red-100 text-red-600"
                          : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {bloqueada ? <Unlock size={12} /> : <Lock size={12} />}
                      {bloqueada ? "Activar Tarjeta" : "Bloqueo Temporal"}
                    </button>
                  </div>

                  {/* CONTROLES ESPECÍFICOS SEGÚN TIPO DE CUENTA */}
                  {tipo === "ahorro" && (
                    <div className="space-y-3 pt-2 border-t border-slate-150">
                      {/* Sliders de Límites */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-0.5">
                            <span>LÍMITE ATM (CAJEROS)</span>
                            <span className="text-emerald-600">${limiteAtm.toLocaleString("es-MX")} / día</span>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="10000"
                            step="500"
                            value={limiteAtm}
                            disabled={bloqueada}
                            onChange={(e) => setLimiteAtm(Number(e.target.value))}
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Widget Apartado */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                            <Coins size={12} className="text-emerald-500" />
                            Bolsillo de Ahorro
                          </span>
                          <span className="text-xs font-black text-emerald-600">
                            ${apartadoAhorro.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Monto"
                            value={montoMover}
                            onChange={(e) => setMontoMover(e.target.value)}
                            disabled={bloqueada}
                            className="w-1/2 p-1 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                          />
                          <button
                            onClick={handleMoverApartado}
                            disabled={bloqueada}
                            className="w-1/4 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase rounded-lg transition disabled:opacity-50"
                          >
                            Apartar
                          </button>
                          <button
                            onClick={handleRegresarDisponible}
                            disabled={bloqueada}
                            className="w-1/4 bg-slate-150 hover:bg-slate-200 text-slate-700 text-[9px] font-bold uppercase rounded-lg transition disabled:opacity-50"
                          >
                            Liberar
                          </button>
                        </div>
                        {errorApartado && (
                          <p className="text-[9px] text-red-500 font-semibold">{errorApartado}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {tipo === "nomina" && (
                    <div className="space-y-3 pt-2 border-t border-slate-150">
                      {/* Sliders de Límites */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-0.5">
                            <span>LÍMITE ATM (CAJEROS)</span>
                            <span className="text-blue-700">${limiteAtm.toLocaleString("es-MX")} / día</span>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="10000"
                            step="500"
                            value={limiteAtm}
                            disabled={bloqueada}
                            onChange={(e) => setLimiteAtm(Number(e.target.value))}
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Nómina Tracker */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Briefcase size={12} className="text-indigo-500" />
                          Detalle de Nómina
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[9px]">
                          <div>
                            <span className="text-slate-450 block font-bold uppercase">Empresa:</span>
                            <span className="font-semibold text-slate-700 truncate block">Nexus Tech S.A.</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block font-bold uppercase">Frecuencia:</span>
                            <span className="font-semibold text-slate-700 block">Quincenal</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block font-bold uppercase">Sueldo Est:</span>
                            <span className="font-semibold text-slate-700 block">$12,500.00</span>
                          </div>
                          <div>
                            <span className="text-slate-455 block font-bold uppercase">Sig. Pago:</span>
                            <span className="font-bold text-emerald-600 block">En 3 días</span>
                          </div>
                        </div>
                        {adelantoActivo > 0 && (
                          <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl text-[9px] text-amber-800 font-bold flex justify-between items-center">
                            <span>⚠️ Adelanto activo: ${adelantoActivo.toLocaleString("es-MX")}</span>
                            <button
                              onClick={() => {
                                setAdelantoActivo(0);
                                setAlertaTarjeta("Adelanto cancelado con éxito.");
                                setTimeout(() => setAlertaTarjeta(""), 3000);
                              }}
                              className="underline text-[9px] hover:text-amber-900 font-bold"
                            >
                              Devolver
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {tipo === "corriente" && (
                    <div className="space-y-3 pt-2 border-t border-slate-150">
                      {/* Pagar Tarjeta */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Wallet size={12} className="text-blue-500" />
                          Abonar a Tarjeta (Pago)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePagarTarjeta(500)}
                            disabled={bloqueada || deudaTotal <= 0}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 p-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition"
                          >
                            Mínimo ($500)
                          </button>
                          <button
                            onClick={() => handlePagarTarjeta(deudaTotal)}
                            disabled={bloqueada || deudaTotal <= 0}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 p-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition"
                          >
                            Liquidar (${Math.round(deudaTotal).toLocaleString("es-MX")})
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Monto"
                            value={formMontoPago}
                            onChange={(e) => setFormMontoPago(e.target.value)}
                            disabled={bloqueada || deudaTotal <= 0}
                            className="w-2/3 p-1 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <button
                            onClick={() => {
                              const val = Number(formMontoPago);
                              if (val > 0) {
                                handlePagarTarjeta(val);
                                setFormMontoPago("");
                              }
                            }}
                            disabled={bloqueada || deudaTotal <= 0 || !formMontoPago}
                            className="w-1/3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[9px] font-bold uppercase rounded-lg transition"
                          >
                            Abonar
                          </button>
                        </div>
                      </div>

                      {/* Lista de Compras Diferidas */}
                      {comprasDiferidas.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                            Compras Diferidas a MSI Activas
                          </span>
                          <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1">
                            {comprasDiferidas.map((compra) => (
                              <div key={compra.id} className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[9px]">
                                <div className="truncate w-1/2">
                                  <p className="font-bold text-slate-700 uppercase truncate">{compra.concepto}</p>
                                  <p className="text-[8px] text-slate-400 font-semibold">
                                    ${compra.monto.toLocaleString("es-MX")} / {compra.plazo}m
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-blue-700">${compra.cuota.toFixed(2)}/m</span>
                                  <button
                                    onClick={() => handleCancelarDiferido(compra.id, compra.monto)}
                                    className="text-red-500 hover:text-red-700 font-bold"
                                    title="Cancelar diferimiento"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleGuardarLimites}
                    disabled={bloqueada}
                    className="w-full mt-2 bg-slate-900 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
                  >
                    Guardar Parámetros de Seguridad
                  </button>
                </div>

              </div>
            </div>

            {/* 2. CENTRO FINANCIERO DINÁMICO SEGÚN TIPO DE CUENTA (ahorro | corriente | nomina) */}
            
            {/* A) SI LA CUENTA ES DE AHORRO: SIMULADOR DE INVERSIONES */}
            {tipo === "ahorro" && (
              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Simulador de Ahorro e Inversión Nexus</h2>
                    <p className="text-xs text-slate-400">Planifica tu futuro y mira crecer tus fondos con nuestra tasa preferente anual de 7.5%.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>MONTO AHORRADO MENSUALMENTE</span>
                        <span className="text-emerald-600 text-sm">${ahorroMensual.toLocaleString("es-MX")} / mes</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="10000"
                        step="100"
                        value={ahorroMensual}
                        onChange={(e) => setAhorroMensual(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>$200</span>
                        <span>$5,000</span>
                        <span>$10,000</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>PLAZO DEL AHORRO</span>
                        <span className="text-emerald-600 text-sm">{plazoMeses} meses</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="36"
                        step="3"
                        value={plazoMeses}
                        onChange={(e) => setPlazoMeses(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>3 meses</span>
                        <span>12 meses</span>
                        <span>24 meses</span>
                        <span>36 meses</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 flex items-center gap-4">
                      <Percent size={24} className="text-emerald-600" />
                      <div>
                        <h4 className="font-bold text-sm text-emerald-800">Tasa Fija de Rendimiento</h4>
                        <p className="text-xs text-emerald-700 font-medium">
                          Por ser miembro de Banco Nexus, tu cuenta genera un **7.5% de tasa fija anualizada** calculada al final del periodo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">
                      Proyección de Resultados (Ahorro)
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">CAPITAL APORTADO</p>
                        <p className="text-lg font-bold text-slate-700">
                          ${resAhorro.aportado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                        {apartadoAhorro > 0 && (
                          <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                            (${apartadoAhorro.toLocaleString("es-MX")} inicial + ${(ahorroMensual * plazoMeses).toLocaleString("es-MX")} mensual)
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">INTERESES ESTIMADOS GANADOS</p>
                        <p className="text-lg font-black text-emerald-600">
                          +${resAhorro.intereses.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">SALDO FINAL PROYECTADO</p>
                        <p className="text-2xl font-black text-blue-700">
                          ${resAhorro.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${(resAhorro.aportado / resAhorro.total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${(resAhorro.intereses / resAhorro.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase mt-2">
                        <span>🔵 Capital ({Math.round((resAhorro.aportado / resAhorro.total) * 100)}%)</span>
                        <span>🟢 Intereses ({Math.round((resAhorro.intereses / resAhorro.total) * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* B) SI LA CUENTA ES DE NÓMINA: SIMULADOR DE ADELANTO DE NÓMINA */}
            {tipo === "nomina" && (
              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Simulador de Adelanto de Nómina Nexus</h2>
                    <p className="text-xs text-slate-400">¿Necesitas liquidez antes de tu día de pago? Solicita un adelanto de nómina exprés.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>MONTO DEL ADELANTO SOLICITADO</span>
                        <span className="text-indigo-600 text-sm">${montoAdelanto.toLocaleString("es-MX")}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="8000"
                        step="500"
                        value={montoAdelanto}
                        onChange={(e) => setMontoAdelanto(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>$500</span>
                        <span>$4,000</span>
                        <span>$8,000 (Mínimo requerido de sueldo)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>PLAZO PARA LIQUIDAR EL ADELANTO</span>
                        <span className="text-indigo-600 text-sm">{plazoQuincenas} {plazoQuincenas === 1 ? "Quincena" : "Quincenas"}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={plazoQuincenas}
                        onChange={(e) => setPlazoQuincenas(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>1 Quincena (15 días)</span>
                        <span>2 Quincenas (30 días)</span>
                        <span>3 Quincenas (45 días)</span>
                        <span>4 Quincenas (60 días)</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 flex items-center gap-4">
                      <Briefcase size={24} className="text-indigo-600" />
                      <div>
                        <h4 className="font-bold text-sm text-indigo-800">Descuento Automático</h4>
                        <p className="text-xs text-indigo-700 font-medium">
                          El pago correspondiente se descontará automáticamente de tu cuenta el día de tu siguiente dispersión de nómina.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">
                      Desglose de Adelanto
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">MONTO SOLICITADO</span>
                        <span className="font-bold text-slate-700">${montoAdelanto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">COMISIÓN APERTURA (3.5%)</span>
                        <span className="font-bold text-slate-750">${resNomina.comision.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">INTERESES QUINCENALES</span>
                        <span className="font-bold text-slate-750">${resNomina.interes.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">IVA APLICADO (16%)</span>
                        <span className="font-bold text-slate-750">${resNomina.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex justify-between">
                        <span className="text-slate-400 font-bold">TOTAL A LIQUIDAR</span>
                        <span className="font-black text-indigo-600 text-lg">${resNomina.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="pt-4 border-t border-indigo-200/50 flex justify-between items-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase">PAGO QUINCENAL EST.</span>
                        <span className="font-black text-blue-700 text-xl">${resNomina.cuotaQuincenal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmarAdelanto}
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition shadow-md shadow-indigo-100"
                    >
                      Confirmar Adelanto
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* C) SI LA CUENTA ES CORRIENTE: CALCULADORA DE FINANCIAMIENTO / MSI */}
            {tipo === "corriente" && (
              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Centro de Diferimiento y Financiamiento Nexus</h2>
                    <p className="text-xs text-slate-400">Difiere compras importantes a plazos mensuales fijos con o sin intereses.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Toggle de MSI */}
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Promoción de Meses Sin Intereses (MSI)</h4>
                        <p className="text-xs text-slate-500">Activa esta casilla para aplicar promociones preferentes con costo del 0% de interés.</p>
                      </div>
                      <button
                        onClick={() => setAplicarMsi(!aplicarMsi)}
                        className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                          aplicarMsi ? "bg-blue-700" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                            aplicarMsi ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>MONTO DE COMPRA A DIFERIR</span>
                        <span className="text-blue-700 text-sm">${montoFinanciar.toLocaleString("es-MX")}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="30000"
                        step="1000"
                        value={montoFinanciar}
                        onChange={(e) => setMontoFinanciar(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>$1,000</span>
                        <span>$15,000</span>
                        <span>$30,000</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>PLAZO DE FINANCIAMIENTO</span>
                        <span className="text-blue-700 text-sm">{plazoFinanciar} meses</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="12"
                        step="3"
                        value={plazoFinanciar}
                        onChange={(e) => setPlazoFinanciar(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>3 meses</span>
                        <span>6 meses</span>
                        <span>9 meses</span>
                        <span>12 meses</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">
                      Proyección de Diferimiento
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">MONTO ORIGINAL DE COMPRA</span>
                        <span className="font-bold text-slate-700">${montoFinanciar.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">INTERESES APLICADOS</span>
                        <span className={`font-bold ${resCorriente.interes === 0 ? "text-emerald-600 font-bold" : "text-slate-700"}`}>
                          {resCorriente.interes === 0 ? "SIN INTERESES (0%)" : `$${resCorriente.interes.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">TASA ANUALIZADA APLICADA</span>
                        <span className="font-bold text-slate-700">{resCorriente.tasa}%</span>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex justify-between">
                        <span className="text-slate-400 font-bold">TOTAL ACUMULADO</span>
                        <span className="font-black text-slate-800 text-lg">${resCorriente.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="pt-4 border-t border-blue-200/50 flex justify-between items-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase">MENSUALIDAD FIJA</span>
                        <span className="font-black text-blue-700 text-xl">${resCorriente.cuotaMensual.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmarDiferimiento}
                      className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition shadow-md shadow-blue-100"
                    >
                      Diferir Compra
                    </button>
                  </div>
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}