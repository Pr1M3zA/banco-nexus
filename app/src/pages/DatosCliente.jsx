import { useEffect, useState } from "react";
import { User, Mail, Phone, BadgeCheck, CreditCard, Calendar } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DatosCliente() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(() => {
    return localStorage.getItem("cuentaActual") || "";
  });
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [loading, setLoading] = useState(true);

  const obtenerCliente = () => datosCuenta?.cliente || {};
  const obtenerCuenta = () => datosCuenta?.cuenta || {};

  const obtenerNombreCliente = () => obtenerCliente().nombre || "Usuario";
  const obtenerTipoCuenta = () => obtenerCuenta().tipo || "";
  const obtenerNumeroCuenta = () => obtenerCuenta().numeroCuenta || cuentaActual;
  const obtenerSaldo = () => obtenerCuenta().saldo ?? 0;
  const obtenerStatus = () => obtenerCuenta().status || "activa";

  const cargarCuentas = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cuentas");
      const data = await res.json();

      const lista = Array.isArray(data) ? data : [];
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
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando datos del cliente...</main>
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
            Datos del Cliente
          </h1>
          <p className="text-slate-500 mt-2">
            Información personal y bancaria asociada a la cuenta seleccionada.
          </p>
        </section>

        {!datosCuenta ? (
          <section className="bg-white rounded-3xl p-8 shadow-sm">
            <p className="text-slate-500">
              No se pudo cargar la información del cliente.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-1 bg-blue-700 rounded-3xl p-8 text-white shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-5">
                  <User size={44} />
                </div>

                <h2 className="text-2xl font-black">
                  {obtenerNombreCliente()}
                </h2>

                <p className="text-blue-100 mt-2 capitalize">
                  Cuenta {obtenerTipoCuenta()}
                </p>

                <span className="mt-5 bg-white/20 px-4 py-2 rounded-full text-sm font-bold capitalize">
                  {obtenerStatus()}
                </span>
              </div>
            </section>

            <section className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Información personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Nombre completo
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerCliente().nombre || "No registrado"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <BadgeCheck size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      CURP
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerCliente().curp || "No registrado"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Correo
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerCliente().correo || "No registrado"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Teléfono
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerCliente().telefono || "No registrado"}
                  </p>
                </div>
              </div>
            </section>

            <section className="xl:col-span-3 bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Información bancaria
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Número de cuenta
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerNumeroCuenta()}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-2">
                    Tipo de cuenta
                  </p>
                  <p className="font-bold text-slate-900 capitalize">
                    {obtenerTipoCuenta()}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-2">
                    Saldo disponible
                  </p>
                  <p className="font-black text-blue-700">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Fecha de apertura
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {obtenerCuenta().fechaApertura
                      ? new Date(obtenerCuenta().fechaApertura).toLocaleDateString("es-MX")
                      : "No registrada"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}