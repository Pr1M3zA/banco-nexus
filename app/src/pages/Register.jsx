import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_URL = sessionStorage.getItem("api_url");

export default function Register() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [curp, setCurp] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleValidation = (name, value) => {
    let err = "";
    if (name === "correo" && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) err = "Ingresa un correo electrónico válido";
    }
    if (name === "curp" && value) {
      if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(value.trim().toUpperCase())) err = "El formato de CURP no es válido";
    }
    if (name === "telefono" && value) {
      if (!/^\d{10}$/.test(value.trim())) err = "Debe contener exactamente 10 dígitos numéricos";
    }
    if (name === "contraseña" && value) {
      if (value.length < 6) err = "La contraseña debe tener al menos 6 caracteres";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!nombre.trim() || !correo.trim() || !contraseña.trim() || !curp.trim() || !telefono.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    // Validación de Correo electrónico
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo.trim())) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    // Validación de CURP (Formato oficial mexicano)
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(curp.trim().toUpperCase())) {
      setError("El CURP ingresado no tiene un formato válido.");
      return;
    }

    // Validación de Teléfono (Exactamente 10 dígitos numéricos)
    const telRegex = /^\d{10}$/;
    if (!telRegex.test(telefono.trim())) {
      setError("El teléfono debe contener exactamente 10 dígitos numéricos.");
      return;
    }

    if (contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          contraseña,
          curp: curp.trim().toUpperCase(),
          telefono: telefono.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "Error al crear la cuenta.");
      }

      setSuccessMsg("¡Cuenta creada con éxito! Redirigiendo al login...");
      
      // Wait a moment so the user sees the success message
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* ── PANEL IZQUIERDO */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col justify-between p-12">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Círculos difusos */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-blue-300/10 blur-3xl" />

          {/* Elementos creativos - Formas abstractas y ondas */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] -left-40 w-[200%] h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent -rotate-12" />
            <div className="absolute top-[60%] -left-40 w-[200%] h-px bg-gradient-to-r from-transparent via-indigo-300/20 to-transparent -rotate-6" />
            <div className="absolute -right-10 bottom-20 w-80 h-80 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] rotate-12 skew-x-12" />
            <div className="absolute -left-20 top-40 w-64 h-64 bg-white/5 backdrop-blur-xl border border-white/5 rounded-full" />
            <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_15px_3px_rgba(147,197,253,0.6)]" />
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-indigo-300 rounded-full shadow-[0_0_15px_3px_rgba(165,180,252,0.5)]" />
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="NEXUS Logo" className="w-20 h-auto drop-shadow-lg" />
            <span className="text-5xl font-black text-white tracking-tight">
              NEXUS
            </span>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Únete a la<br />
            <span className="text-cyan-300 drop-shadow-md">banca del futuro</span>
          </h1>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed max-w-md drop-shadow-sm">
            Crea tu cuenta en minutos y descubre una nueva forma de manejar tu dinero.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-1 gap-3 max-w-sm">
            {[
              {
                icon: <ShieldCheck size={18} />,
                title: "Seguridad bancaria",
                desc: "Cifrado SSL de 256 bits en cada operación",
              },
              {
                icon: <TrendingUp size={18} />,
                title: "Disponible 24/7",
                desc: "Accede a tu cuenta cuando lo necesites",
              },
              {
                icon: <Smartphone size={18} />,
                title: "Multiplataforma",
                desc: "Desde cualquier dispositivo con navegador",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/12 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shadow-inner">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight drop-shadow-sm">{f.title}</p>
                  <p className="text-cyan-100/80 text-xs mt-0.5 drop-shadow-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer izquierdo */}
        <div className="relative z-10">
          <p className="text-sky-200/70 text-xs">
            © 2026 Banco NEXUS. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO — FORMULARIO */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white lg:bg-slate-50">
        {/* Logo móvil */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="NEXUS Logo" className="w-14 h-auto drop-shadow-sm" />
          <span className="text-3xl font-black text-blue-900 tracking-tight">NEXUS</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Encabezado */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Crear Cuenta
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Completa tus datos para registrarte
            </p>
          </div>

          {/* Success banner */}
          {successMsg && (
            <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3.5">
              <ShieldCheck size={17} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-snug">{successMsg}</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3.5">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Correo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-correo"
                  type="email"
                  placeholder="usuario@correo.com"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    setError("");
                    handleValidation("correo", e.target.value);
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-50 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-sm ${fieldErrors.correo ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600 focus:border-transparent'}`}
                />
              </div>
              {fieldErrors.correo && <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{fieldErrors.correo}</p>}
            </div>

            {/* CURP */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                CURP
              </label>
              <div className="relative">
                <ShieldCheck
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-curp"
                  type="text"
                  placeholder="Ej. MERC850312HDFNRS09"
                  value={curp}
                  onChange={(e) => {
                    setCurp(e.target.value);
                    setError("");
                    handleValidation("curp", e.target.value);
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-50 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-sm uppercase ${fieldErrors.curp ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600 focus:border-transparent'}`}
                  maxLength={18}
                />
              </div>
              {fieldErrors.curp && <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{fieldErrors.curp}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Teléfono Celular
              </label>
              <div className="relative">
                <Smartphone
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-telefono"
                  type="tel"
                  placeholder="10 dígitos"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setError("");
                    handleValidation("telefono", e.target.value);
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-50 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-sm ${fieldErrors.telefono ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600 focus:border-transparent'}`}
                  maxLength={10}
                />
              </div>
              {fieldErrors.telefono && <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{fieldErrors.telefono}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-password"
                  type={mostrar ? "text" : "password"}
                  placeholder="Crea una contraseña"
                  value={contraseña}
                  onChange={(e) => {
                    setContraseña(e.target.value);
                    setError("");
                    handleValidation("contraseña", e.target.value);
                  }}
                  className={`w-full pl-11 pr-12 py-3.5 rounded-xl border bg-slate-50 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-sm ${fieldErrors.contraseña ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600 focus:border-transparent'}`}
                />
                <button
                  type="button"
                  onClick={() => setMostrar(!mostrar)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  tabIndex={-1}
                >
                  {mostrar ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.contraseña && <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{fieldErrors.contraseña}</p>}
            </div>

            {/* CTA */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 text-sm uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-500 mt-8">
            ¿Ya tienes una cuenta?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-blue-700 font-bold hover:text-blue-900 transition"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
