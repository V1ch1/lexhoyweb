import { useState } from "react";

interface Props {
  onSuccess?: () => void;
}

export default function ImportarDespachoForm({ onSuccess }: Props) {
  const [objectId, setObjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync-despacho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object_id: objectId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult("✅ Despacho importado correctamente");
        setObjectId("");
        if (onSuccess) onSuccess();
      } else {
        setResult(data.error || "❌ Error al importar el despacho");
      }
    } catch {
      setResult("❌ Error de red o del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleImport}
      className="mb-6 flex flex-col sm:flex-row gap-4 items-center"
    >
      <input
        type="text"
        className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80"
        placeholder="Introduce el Object ID del despacho"
        value={objectId}
        onChange={(e) => setObjectId(e.target.value)}
        required
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        disabled={loading || !objectId}
      >
        {loading ? "Importando..." : "Importar"}
      </button>
      {result && <div className="text-sm mt-2 w-full">{result}</div>}
    </form>
  );
}
