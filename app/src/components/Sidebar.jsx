import {
  LayoutDashboard,
  Search,
  ArrowRightLeft,
  User,
  Users,
  LogOut,
  Send,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-xl transition ${
      isActive
        ? "bg-blue-100 text-blue-700 font-bold"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    sessionStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_correo");
    window.location.href = "/";
  };

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

          <NavLink to="/transferencia" className={linkClass}>
            <Send size={20} />
            Transferencias
          </NavLink>



          <NavLink to="/movimientos" className={linkClass}>
            <ArrowRightLeft size={20} />
            Movimientos
          </NavLink>

          <NavLink to="/cliente" className={linkClass}>
            <User size={20} />
            Datos Cliente
          </NavLink>

          <NavLink to="/beneficiarios" className={linkClass}>
            <Users size={20} />
            Beneficiarios
          </NavLink>

        </nav>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition font-semibold text-sm w-full"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>

    </div>
  );
}