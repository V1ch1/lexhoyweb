import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheckIcon, TrashIcon } from "@heroicons/react/24/outline";

interface PrivacyTabProps {
  loading: boolean;
}

export default function PrivacyTab({ loading }: PrivacyTabProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleRequestDataDeletion = async () => {
    if (deleteConfirmation === "borrar mi cuenta") {
      try {
        const response = await fetch("/api/user/request-deletion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al solicitar eliminación");
        }

        toast.success(
          "Solicitud de eliminación enviada. Recibirás un correo de confirmación."
        );
        setDeleteConfirmation("");
      } catch (error) {
        console.error("Error:", error);
        toast.error(
          "Error al solicitar eliminación. Por favor, inténtalo de nuevo."
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Eliminar Cuenta */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Eliminar mi cuenta
        </h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-4">
            Al eliminar tu cuenta, todos tus datos personales serán eliminados
            permanentemente. Esta acción no se puede deshacer.
          </p>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="delete-confirm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Escribe &quot;borrar mi cuenta&quot; para confirmar:
              </label>
              <input
                type="text"
                name="delete-confirm"
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="borrar mi cuenta"
              />
            </div>
            <button
              type="button"
              onClick={handleRequestDataDeletion}
              disabled={deleteConfirmation !== "borrar mi cuenta" || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
              Eliminar permanentemente mi cuenta y datos
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de Privacidad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon
              className="h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Nos tomamos muy en serio la privacidad de tus datos. Si tienes
              alguna pregunta sobre cómo manejamos tu información, por favor
              consulta nuestra{" "}
              <a
                href="/politica-privacidad"
                className="font-medium underline text-blue-700 hover:text-blue-600"
              >
                Política de Privacidad
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
