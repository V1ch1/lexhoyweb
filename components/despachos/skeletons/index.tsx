import { Skeleton } from "@/components/ui/skeleton";

export function DespachosListSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Despachos Disponibles
          </h2>
          <p className="text-sm text-gray-600 mt-1">Cargando despachos...</p>
        </div>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
        <Skeleton className="h-10 w-full sm:w-96" />
        <div className="flex gap-2 items-center">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {[
                "Nombre",
                "Localidad",
                "Provincia",
                "Teléfono",
                "Email",
                "Nº Sedes",
                "Propietario",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
                  <td key={cell} className="px-4 py-3 whitespace-nowrap">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const despachoSkeletons = {
  DespachosListSkeleton,
};

export default despachoSkeletons;
