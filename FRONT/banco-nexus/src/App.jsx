import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ConsultaCuenta from "./pages/ConsultaCuenta";

/**
 * Router mínimo por estado — sin dependencias externas.
 * La Sidebar recibe onNavegar para cambiar de página.
 */
export const NavContext = { onNavegar: null };

function App() {
  const [pagina, setPagina] = useState("dashboard");

  // Exponemos el setter en un contexto liviano para que Sidebar lo use
  NavContext.onNavegar = setPagina;

  return pagina === "consulta"
    ? <ConsultaCuenta />
    : <Dashboard />;
}

export default App;