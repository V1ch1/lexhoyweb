import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface PrivacyTabProps {
  loading: boolean;
}

export default function PrivacyTab({ loading }: PrivacyTabProps) {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/user/export-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format: exportFormat }),
      });

      if (!response.ok) {
        throw new Error("Error al exportar datos");
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-lexhoy.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Datos exportados exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al exportar datos. Por favor, inténtalo de nuevo.");
    }
  };

  const handleRequestDataDeletion = async () => {
    if (deleteConfirmation === "DELETE MY DATA") {
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
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Privacidad de Datos
        </h3>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              <ShieldCheckIcon className="h-6 w-6 inline-block mr-2 -mt-1" />
              Control de Datos Personales
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gestiona tus datos personales y preferencias de privacidad.
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Exportar mis datos
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="mr-3 mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      disabled={loading}
                    >
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                      Exportar Datos
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Descarga una copia de todos tus datos personales en el
                    formato seleccionado.
                  </p>
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Eliminar mi cuenta
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="max-w-lg">
                    <p className="text-sm text-gray-700 mb-3">
                      Al eliminar tu cuenta, todos tus datos personales serán
                      eliminados permanentemente. Esta acción no se puede
                      deshacer.
                    </p>
                    <div className="mt-2">
                      <label
                        htmlFor="delete-confirm"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Escribe &quot;DELETE MY DATA&quot; para confirmar:
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          name="delete-confirm"
                          id="delete-confirm"
                          value={deleteConfirmation}
                          onChange={(e) =>
                            setDeleteConfirmation(e.target.value)
                          }
                          className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="DELETE MY DATA"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleRequestDataDeletion}
                        disabled={
                          deleteConfirmation !== "DELETE MY DATA" || loading
                        }
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
                        Eliminar permanentemente mi cuenta y datos
                      </button>
                    </div>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon
              className="h-5 w-5 text-yellow-400"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Nos tomamos muy en serio la privacidad de tus datos. Si tienes
              alguna pregunta sobre cómo manejamos tu información, por favor
              consulta nuestra{" "}
              <a
                href="/politica-privacidad"
                className="font-medium underline text-yellow-700 hover:text-yellow-600"
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
