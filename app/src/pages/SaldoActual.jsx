import { useEffect, useState } from "react";
import { Wallet, CreditCard, User, CheckCircle } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function SaldoActual() {
  const cuentaInicial = "NX01001";

  const [datosCuenta, setDatosCuenta] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(cuentaInicial);
  const [loading, setLoading] = useState(true);

  const obtenerSaldo = () => datosCuenta?.cuenta?.saldo ?? 0;
  const obtenerNombreCliente = () => datosCuenta?.cliente?.nombre || "Usuario";
  const obtenerTipoCuenta = () => datosCuenta?.cuenta?.tipo || "";
  const obtenerNumeroCuenta = () =>
    datosCuenta?.cuenta?.numeroCuenta || cuentaActual;
  const obtenerStatus = () => datosCuenta?.cuenta?.status || "activa";

  const cargarCuentas = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cuentas");
      const data = await res.json();

      const lista = Array.isArray(data) ? data : [];
      setCuentas(lista);

      if (lista.length > 0) {
        setCuentaActual(lista[0].cuenta);
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
      cargarDatos(cuentaActual);
    }
  }, [cuentaActual]);

  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-10">Cargando saldo...</main>
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
          <h1 className="text-3xl font-bold text-slate-900">Saldo Actual</h1>
          <p className="text-slate-500 mt-2">
            Consulta el saldo disponible de la cuenta seleccionada.
          </p>
        </section>

        {!datosCuenta ? (
          <section className="bg-white rounded-3xl p-8 shadow-sm">
            <p className="text-slate-500">
              No se pudo cargar la información de la cuenta.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-blue-700 rounded-3xl p-10 text-white shadow-sm">
              <div className="flex items-center gap-5 mb-10">
                <div className="bg-white/20 p-5 rounded-2xl">
                  <Wallet size={34} />
                </div>

                <div>
                  <p className="text-blue-100 uppercase text-sm font-bold tracking-widest">
                    Saldo Disponible
                  </p>

                  <h2 className="text-5xl font-black mt-2">
                    ${obtenerSaldo().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>

                  <p className="text-blue-100 mt-3">
                    Cuenta {obtenerNumeroCuenta()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white/15 rounded-2xl p-5">
                  <p className="text-blue-100 text-sm">Tipo de cuenta</p>
                  <p className="font-bold capitalize text-xl">
                    {obtenerTipoCuenta()}
                  </p>
                </div>

                <div className="bg-white/15 rounded-2xl p-5">
                  <p className="text-blue-100 text-sm">Estado</p>
                  <p className="font-bold capitalize text-xl">
                    {obtenerStatus()}
                  </p>
                </div>

                <div className="bg-white/15 rounded-2xl p-5">
                  <p className="text-blue-100 text-sm">Cliente</p>
                  <p className="font-bold text-xl">
                    {obtenerNombreCliente()}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-blue-700" />
                <h2 className="font-bold text-xl">Información de cuenta</h2>
              </div>

              <div className="space-y-5">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Titular
                    </p>
                  </div>
                  <p className="font-bold">{obtenerNombreCliente()}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard size={18} className="text-blue-700" />
                    <p className="text-xs uppercase font-bold text-slate-400">
                      Número de cuenta
                    </p>
                  </div>
                  <p className="font-bold">{obtenerNumeroCuenta()}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-2">
                    Tipo
                  </p>
                  <p className="font-bold capitalize">{obtenerTipoCuenta()}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}