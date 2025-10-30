import { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
  requireConfirmationText?: {
    textToMatch: string;
    placeholder: string;
  };
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isProcessing = false,
  requireConfirmationText,
}: ConfirmDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmDisabled = requireConfirmationText 
    ? confirmationText !== requireConfirmationText.textToMatch 
    : false;
  // Bloquear el scroll del body cuando el diálogo está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Contenedor del diálogo */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div 
          className="inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {title}
          </h3>
          <div className="mt-4 space-y-6">
            <div className="text-sm text-gray-600 leading-relaxed">
              {message}
            </div>
            
            {requireConfirmationText && (
              <div className="mt-6 space-y-2">
                <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
                  Escribe <span className="font-bold">{requireConfirmationText.textToMatch}</span> para confirmar:
                </label>
                <input
                  type="text"
                  id="confirmation"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                  placeholder={requireConfirmationText.placeholder}
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  autoComplete="off"
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={isProcessing}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`inline-flex justify-center items-center rounded-md border border-transparent px-6 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isConfirmDisabled || isProcessing
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
              onClick={onConfirm}
              disabled={isConfirmDisabled || isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {confirmText}...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
