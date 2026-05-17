import { CheckCircle, AlertCircle, Info, X, TriangleAlert } from "lucide-react";

export default function AlertMessage({ type = "info", message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      box: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: <CheckCircle size={20} />,
    },
    error: {
      box: "bg-red-50 border-red-200 text-red-700",
      icon: <AlertCircle size={20} />,
    },
    warning: {
      box: "bg-yellow-50 border-yellow-200 text-yellow-700",
      icon: <TriangleAlert size={20} />,
    },
    info: {
      box: "bg-blue-50 border-blue-200 text-blue-700",
      icon: <Info size={20} />,
    },
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 border rounded-2xl px-5 py-4 mb-5 ${styles[type].box}`}
    >
      <div className="flex items-center gap-3 font-semibold">
        {styles[type].icon}
        <span>{message}</span>
      </div>

      {onClose && (
        <button onClick={onClose} className="hover:opacity-70">
          <X size={18} />
        </button>
      )}
    </div>
  );
}