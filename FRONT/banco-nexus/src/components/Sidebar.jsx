import {
  LayoutDashboard,
  Search,
  Wallet,
  ArrowRightLeft,
  ChartColumn,
  User,
} from "lucide-react";
import { NavContext } from "../App";

const ITEMS = [
  { id: "dashboard", label: "Dashboard",         icon: LayoutDashboard },
  { id: "consulta",  label: "Consulta de Cuenta", icon: Search          },
];

/**
 * Sidebar con navegación funcional.
 * paginaActiva – id de la página actual (para resaltar el ítem activo)
 */
export default function Sidebar({ paginaActiva = "dashboard" }) {
  const navegar = (id) => NavContext.onNavegar?.(id);

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-5 sticky top-0">
      <div>
        <h1 className="text-2xl font-bold text-blue-700 mb-10">NEXUS</h1>

        <nav className="flex flex-col gap-2">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navegar(id)}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium text-left transition ${
                paginaActiva === id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}

          {/* Ítems decorativos (sin ruta aún) */}
          {[
            { label: "Saldo Actual",  Icon: Wallet          },
            { label: "Movimientos",   Icon: ArrowRightLeft   },
            { label: "Evolución",     Icon: ChartColumn      },
            { label: "Datos Cliente", Icon: User             },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              className="flex items-center gap-3 text-gray-400 p-3 rounded-xl cursor-not-allowed"
              disabled
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}