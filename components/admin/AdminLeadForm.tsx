"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@/lib/services/leadService";
import { formatCurrency } from "@/lib/utils";

interface AdminLeadFormProps {
  lead: Lead;
}

export default function AdminLeadForm({ lead }: AdminLeadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    estado: lead.estado,
    precio_base: lead.precio_base || 0,
    fecha_fin_subasta: lead.fecha_fin_subasta ? new Date(lead.fecha_fin_subasta).toISOString().slice(0, 16) : "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: formData.estado,
          precio_base: Number(formData.precio_base),
          fecha_fin_subasta: formData.fecha_fin_subasta || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error actualizando lead");
      }

      router.refresh();
      router.push("/admin/leads");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Read-only info */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900">Información del Lead</h3>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">ID:</span> {lead.id}
            </div>
            <div>
              <span className="font-medium">Fecha:</span> {new Date(lead.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Nombre:</span> {lead.nombre}
            </div>
            <div>
              <span className="font-medium">Email:</span> {lead.correo}
            </div>
             <div>
              <span className="font-medium">Teléfono:</span> {lead.telefono || "-"}
            </div>
             <div>
              <span className="font-medium">Especialidad:</span> {lead.especialidad}
            </div>
          </div>
          <div className="mt-4">
             <span className="font-medium text-sm text-gray-900">Mensaje Original:</span>
             <p className="mt-1 text-sm text-gray-500 bg-gray-50 p-3 rounded border">{lead.cuerpo_mensaje}</p>
          </div>
           <div className="mt-4">
             <span className="font-medium text-sm text-gray-900">Resumen IA:</span>
             <p className="mt-1 text-sm text-gray-500 bg-blue-50 p-3 rounded border border-blue-100">{lead.resumen_ia}</p>
          </div>
        </div>

        <div className="border-t col-span-2 my-2"></div>

        {/* Editable fields */}
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="pendiente">Pendiente</option>
            <option value="procesado">Procesado (Disponible)</option>
            <option value="en_subasta">En Subasta</option>
            <option value="vendido">Vendido</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>

        <div>
          <label htmlFor="precio_base" className="block text-sm font-medium text-gray-700">
            Precio Base (€)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">€</span>
            </div>
            <input
              type="number"
              name="precio_base"
              id="precio_base"
              min="0"
              step="0.01"
              value={formData.precio_base}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Precio estimado IA: {lead.precio_estimado ? formatCurrency(lead.precio_estimado) : "-"}
          </p>
        </div>

        {formData.estado === "en_subasta" && (
          <div className="col-span-2">
            <label htmlFor="fecha_fin_subasta" className="block text-sm font-medium text-gray-700">
              Fecha Fin Subasta
            </label>
            <input
              type="datetime-local"
              name="fecha_fin_subasta"
              id="fecha_fin_subasta"
              value={formData.fecha_fin_subasta}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required={formData.estado === "en_subasta"}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
