import {
  LayoutDashboard,
  Search,
  Wallet,
  ArrowRightLeft,
  User,
} from "lucide-react";

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-xl transition ${
      isActive
        ? "bg-blue-100 text-blue-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-5">
      
      <div>
        <h1 className="text-2xl font-bold text-blue-700 mb-10">
          NEXUS
        </h1>

        <nav className="flex flex-col gap-3">

          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink to="/consulta" className={linkClass}>
            <Search size={20} />
            Consulta de Cuenta
          </NavLink>

          <NavLink to="/saldo" className={linkClass}>
            <Wallet size={20} />
            Saldo Actual
          </NavLink>

          <NavLink to="/movimientos" className={linkClass}>
            <ArrowRightLeft size={20} />
            Movimientos
          </NavLink>

          <NavLink to="/cliente" className={linkClass}>
            <User size={20} />
            Datos Cliente
          </NavLink>

        </nav>
      </div>

    </div>
  );
}