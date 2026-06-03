import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./pages/Dashboard";
import ConsultaCuenta from "./pages/ConsultaCuenta";
import Movimientos  from "./pages/Movimientos";
import DatosCliente from "./pages/DatosCliente";
import Transferencia from "./pages/Transferencia";
import Beneficiarios from "./pages/Beneficiarios";

// ── Guard: redirige al login si no hay token en ningún storage ────────────────
if (!sessionStorage.getItem("api_url")) {
  sessionStorage.setItem("api_url", "http://localhost:3001");
}

function PrivateRoute({ children }) {
  const token =
    localStorage.getItem("nexus_token") ||
    sessionStorage.getItem("nexus_token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta raíz → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/consulta"
          element={<PrivateRoute><ConsultaCuenta /></PrivateRoute>}
        />
        <Route
          path="/movimientos"
          element={<PrivateRoute><Movimientos /></PrivateRoute>}
        />
        <Route
          path="/cliente"
          element={<PrivateRoute><DatosCliente /></PrivateRoute>}
        />
        <Route
          path="/transferencia"
          element={<PrivateRoute><Transferencia /></PrivateRoute>}
        />
        <Route
          path="/beneficiarios"
          element={<PrivateRoute><Beneficiarios /></PrivateRoute>}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;