import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Search, User, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { cuentaDemo } from "../data/mockData";

export default function ConsultaCuenta() {
  const usuario = {
    nombre: cuentaDemo.cliente.nombre,
    tipoCuenta: cuentaDemo.cuenta.tipo,
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-10">
        <Navbar usuario={usuario} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Consulta de Cuenta
          </h1>
          <p className="text-gray-500 mt-2">
            Ingresa el número de cuenta para consultar la información bancaria.
          </p>
        </div>

        <section className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <label className="font-semibold text-gray-700">
            Número de Cuenta
          </label>

          <div className="flex gap-4 mt-3">
            <input
              type="text"
              placeholder="Ej: NX01001"
              className="flex-1 border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-800 transition flex items-center gap-2">
              <Search size={20} />
              Consultar
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-100 text-blue-700 p-4 rounded-2xl">
              <CheckCircle size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Cuenta Encontrada</h2>
              <p className="text-gray-500">
                Información asociada a la cuenta consultada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <User className="text-blue-700" />
                <h3 className="font-bold">Cliente</h3>
              </div>

              <p className="text-gray-500 text-sm">Nombre</p>
              <p className="font-bold text-lg">{cuentaDemo.cliente.nombre}</p>

              <p className="text-gray-500 text-sm mt-4">Correo</p>
              <p className="font-semibold">{cuentaDemo.cliente.correo}</p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="text-blue-700" />
                <h3 className="font-bold">Cuenta</h3>
              </div>

              <p className="text-gray-500 text-sm">Número de cuenta</p>
              <p className="font-bold text-lg">{cuentaDemo.cuenta.numeroCuenta}</p>

              <p className="text-gray-500 text-sm mt-4">Tipo</p>
              <p className="font-semibold">{cuentaDemo.cuenta.tipo}</p>
            </div>

            <div className="bg-blue-700 text-white rounded-2xl p-5">
              <p className="text-blue-100">Saldo Disponible</p>
              <h3 className="text-4xl font-bold mt-2">
                ${cuentaDemo.cuenta.saldo.toLocaleString("es-MX")}
              </h3>

              <p className="mt-5 text-blue-100">Estado</p>
              <p className="font-bold capitalize">{cuentaDemo.cuenta.status}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-5">
            Movimientos de la cuenta
          </h2>

          <div className="space-y-4">
            {cuentaDemo.transacciones.map((tx, index) => (
              <div
                key={index}
                className="flex items-center justify-between border border-gray-100 rounded-2xl p-4"
              >
                <div>
                  <h3 className="font-bold">{tx.concepto}</h3>
                  <p className="text-gray-500 text-sm">
                    {tx.fecha} · {tx.tipo}
                  </p>
                </div>

                <p
                  className={`font-bold ${
                    tx.monto > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.monto > 0 ? "+" : "-"}$
                  {Math.abs(tx.monto).toLocaleString("es-MX")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}