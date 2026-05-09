import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Dashboard() {

  const usuario = {
    nombre: "ernesto gracia",
    tipoCuenta: "Cuenta Premium",
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-10">
        <Navbar usuario={usuario} />
      </main>

    </div>
  );
}