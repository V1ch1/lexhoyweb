'use client';

import Link from "next/link";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Página de Test</h1>
        
        <div className="space-y-4">
          <div>
            <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded inline-block">
              Ir a Home (Link)
            </Link>
          </div>
          
          <div>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Ir a Home (window.location)
            </button>
          </div>
          
          <div>
            <button 
              onClick={() => {
                console.log('Navegando a home...');
                window.location.href = '/';
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Ir a Home (console + window.location)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}