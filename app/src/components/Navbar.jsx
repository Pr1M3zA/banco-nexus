import {
  Search,
  Bell,
  Mail,
  Settings,
} from "lucide-react";

export default function Navbar({ usuario }) {
  return (
    <div className="flex items-center justify-between mb-10">

      <div>
        <h1 className="text-4xl font-bold">
          Bienvenido, {usuario.nombre}
        </h1>

        <p className="text-gray-500 mt-2">
          Aquí tienes el resumen de tu cuenta
        </p>
      </div>

      <div className="flex items-center gap-4">

        <button className="bg-white p-3 rounded-xl shadow-sm">
          <Search size={20} />
        </button>

        <button className="bg-white p-3 rounded-xl shadow-sm">
          <Bell size={20} />
        </button>

        <button className="bg-white p-3 rounded-xl shadow-sm">
          <Mail size={20} />
        </button>

        <button className="bg-white p-3 rounded-xl shadow-sm">
          <Settings size={20} />
        </button>

        <button className="bg-blue-700 text-white px-5 py-3 rounded-xl font-medium">
          + Nueva Transferencia
        </button>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm">

          <img
            src="https://i.pravatar.cc/40"
            alt="perfil"
            className="w-10 h-10 rounded-full"
          />

          <div>
            <h3 className="font-semibold">
              {usuario.nombre}
            </h3>

            <p className="text-sm text-gray-500">
              {usuario.tipoCuenta}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}