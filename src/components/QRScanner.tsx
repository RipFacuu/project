import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Detener el escáner cuando se detecta un código
          if (scannerRef.current) {
            scannerRef.current.clear();
            setIsScanning(false);
          }
          onScan(decodedText);
        },
        (errorMessage) => {
          // Solo mostrar errores importantes
          if (errorMessage.includes('NotFound')) {
            // Este error es normal cuando no hay QR visible
            return;
          }
          setError(errorMessage);
        }
      );

      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Escanear Código QR
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Container */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Posiciona el código QR dentro del marco
            </p>
          </div>

          <div id="qr-reader" className="w-full"></div>

          {isScanning && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Escaneando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 