import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle, Shield } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    // Verificar permisos de cámara primero
    const checkCameraPermission = async () => {
      try {
        setPermissionStatus('requesting');
        
        // Verificar si el navegador soporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Tu navegador no soporta acceso a la cámara');
          setPermissionStatus('denied');
          return;
        }

        // Solicitar permisos de cámara
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Preferir cámara trasera en móviles
          } 
        });
        
        // Detener el stream inmediatamente después de verificar permisos
        stream.getTracks().forEach(track => track.stop());
        
        setPermissionStatus('granted');
        initScanner();
      } catch (err: any) {
        console.error('Error al solicitar permisos de cámara:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.');
          setPermissionStatus('denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No se encontró ninguna cámara. Verifica que tu dispositivo tenga cámara.');
          setPermissionStatus('denied');
        } else {
          setError(`Error al acceder a la cámara: ${err.message}`);
          setPermissionStatus('denied');
        }
      }
    };

    const initScanner = () => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 30,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            supportedScanTypes: [0, 1],
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            console.log('QR detectado:', decodedText);
            if (scannerRef.current) {
              scannerRef.current.clear();
              setIsScanning(false);
            }
            onScan(decodedText);
          },
          (errorMessage) => {
            if (errorMessage.includes('NotFound') || 
                errorMessage.includes('No QR code found') ||
                errorMessage.includes('QR code not found')) {
              return;
            }
            if (errorMessage.includes('Permission denied')) {
              setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
            } else if (errorMessage.includes('No cameras found')) {
              setError('No se encontró ninguna cámara. Verifica que tu dispositivo tenga cámara.');
            } else {
              setError(`Error: ${errorMessage}`);
            }
          }
        );

        setIsScanning(true);
      }
    };

    // Iniciar el proceso de verificación de permisos
    checkCameraPermission();

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

  const retryPermission = async () => {
    setError('');
    setPermissionStatus('unknown');
    
    // Forzar la recarga del componente
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    
    // Esperar un momento y reintentar
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Escáner QR
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
          {permissionStatus === 'requesting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Solicitando acceso a la cámara...
              </h4>
              <p className="text-sm text-gray-600">
                Por favor, permite el acceso a la cámara cuando tu navegador lo solicite
              </p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Acceso a cámara denegado
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {error}
              </p>
              <button
                onClick={retryPermission}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                Reintentar
              </button>
            </div>
          )}

          {error && permissionStatus !== 'denied' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {permissionStatus === 'granted' && (
            <>
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
            </>
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