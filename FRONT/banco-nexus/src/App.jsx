import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="flex bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-10">
        <h1 className="text-4xl font-bold">
          Dashboard Banco Nexus
        </h1>
      </main>
    </div>
  );
}

export default App;