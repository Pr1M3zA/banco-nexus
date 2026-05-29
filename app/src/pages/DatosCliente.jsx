import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DatosCliente() {
  const cuentaInicial = "NX01001";

  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || cuentaInicial;
  });
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [loading, setLoading] = useState(true);



  const obtenerCliente = () => datosCuenta?.cliente || {};
  const obtenerCuenta = () => datosCuenta?.cuenta || {};

  const obtenerNombreCliente = () => obtenerCliente().nombre || "Usuario";
  const obtenerTipoCuenta = () => {
    const raw = obtenerCuenta().tipo || "";
    const t = raw.toLowerCase();
    if (t === "ahorro") return "Ahorro";
    if (t === "nomina") return "Nómina";
    if (t === "corriente") return "Crédito";
    return raw;
  };
  const obtenerNumeroCuenta = () => obtenerCuenta().numeroCuenta || cuentaActual;
  const obtenerStatus = () => obtenerCuenta().status || "activa";

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
        throw new Error(data.mensaje || "No se pudo cargar el cliente");
      }

      setDatosCuenta(data);
    } catch (error) {
      console.error("Error cargando datos del cliente:", error);
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



  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando datos del cliente...</main>
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
          cuentas={cuentas}
          cuentaActual={cuentaActual}
          onCambiarCuenta={setCuentaActual}
        />

        <section className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
          <p className="text-slate-500 text-sm">
            Visualiza tu información personal y los detalles de tu cuenta de Banco Nexus.
          </p>
        </section>

        {!datosCuenta ? (
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <p className="text-slate-500">No se pudo cargar la información del cliente.</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* COLUMNA 1: AVATAR Y DATOS DE ACCESO */}
            <div className="xl:col-span-1 space-y-6">
              <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden flex flex-col items-center">
                {/* Decoración translúcida */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full filter blur-lg -ml-6 -mt-6" />

                <div className="w-24 h-24 rounded-full bg-blue-700/80 flex items-center justify-center mb-5 text-4xl font-black text-white shadow-lg shadow-blue-500/30 border border-blue-500/20">
                  {obtenerNombreCliente().split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>

                <h2 className="text-xl font-bold">{obtenerNombreCliente()}</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold uppercase tracking-wider">
                  Miembro de Banco Nexus
                </p>

                <div className="mt-6 flex flex-col gap-2 w-full pt-6 border-t border-white/5">
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Número de Cuenta</span>
                    <span className="font-bold text-white">{obtenerNumeroCuenta()}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Tipo</span>
                    <span className="font-bold text-white capitalize">{obtenerTipoCuenta()}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Estado Cuenta</span>
                    <span className="font-bold text-emerald-400 uppercase tracking-widest text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {obtenerStatus()}
                    </span>
                  </div>
                </div>
              </section>


            </div>

            {/* COLUMNA 2 Y 3: INFORMACIÓN PERSONAL */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Información Personal Estática */}
              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Información de Perfil</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Nombre Completo</p>
                    <p className="font-bold text-slate-800 text-sm">{obtenerNombreCliente()}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">CURP Oficial</p>
                    <p className="font-bold text-slate-800 text-sm uppercase">
                      {obtenerCliente().curp || "MERC850312HDFNRS09"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Correo Electrónico</p>
                    <p className="font-bold text-slate-850 text-sm">{obtenerCliente().correo || "No registrado"}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Teléfono Móvil</p>
                    <p className="font-bold text-slate-850 text-sm">{obtenerCliente().telefono || "No registrado"}</p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}