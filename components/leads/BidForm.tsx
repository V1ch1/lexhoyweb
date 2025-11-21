"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface BidFormProps {
  leadId: string;
  currentPrice: number;
  minBid: number;
  endDate: string;
}

export default function BidForm({
  leadId,
  currentPrice,
  minBid,
  endDate,
}: BidFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(minBid);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/leads/${leadId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Error placing bid");
      }

      setSuccess("Puja realizada con éxito!");
      router.refresh(); // Refresh to show new price
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isEnded = new Date() > new Date(endDate);

  if (isEnded) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-500 font-medium">La subasta ha finalizado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Participar en la Subasta
      </h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Precio Actual</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(currentPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Puja Mínima</span>
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(minBid)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Tu Puja (€)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">€</span>
            </div>
            <input
              type="number"
              name="amount"
              id="amount"
              min={minBid}
              step="5"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Pujar Ahora"}
        </button>
      </form>
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        Al pujar, te comprometes a comprar el lead si ganas la subasta.
      </p>
    </div>
  );
}
