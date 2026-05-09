import {
  LayoutDashboard,
  Search,
  Wallet,
  ArrowRightLeft,
  ChartColumn,
  User,
  Settings,
  CircleHelp,
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-5">

      <div>
        <h1 className="text-2xl font-bold text-blue-700 mb-10">
          NEXUS
        </h1>

        <nav className="flex flex-col gap-3">

          <button className="flex items-center gap-3 bg-blue-100 text-blue-700 p-3 rounded-xl font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 p-3 rounded-xl">
            <Search size={20} />
            Consulta de Cuenta
          </button>

          <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 p-3 rounded-xl">
            <Wallet size={20} />
            Saldo Actual
          </button>

          <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 p-3 rounded-xl">
            <ArrowRightLeft size={20} />
            Movimientos
          </button>

          <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 p-3 rounded-xl">
            <ChartColumn size={20} />
            Evolución
          </button>

          <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 p-3 rounded-xl">
            <User size={20} />
            Datos Cliente
          </button>

        </nav>
      </div>

    </div>
  );
}