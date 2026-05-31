import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ConsultaCuenta from "./pages/ConsultaCuenta";

import Movimientos from "./pages/Movimientos";
import DatosCliente from "./pages/DatosCliente";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/consulta" element={<ConsultaCuenta />} />

        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/cliente" element={<DatosCliente />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;