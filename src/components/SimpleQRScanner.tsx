import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Shield } from 'lucide-react';

interface SimpleQRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    const startScanner = async () => {
      try {
        setPermissionStatus('requesting');
        setError('');

        // Crear instancia del escáner
        scannerRef.current = new Html5Qrcode("qr-reader");

        // Obtener lista de cámaras
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          // Usar la primera cámara disponible (preferiblemente la trasera)
          const cameraId = devices[0].id;
          
          await scannerRef.current.start(
            cameraId,
            {
              fps: 30,
              qrbox: { width: 300, height: 300 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              console.log('QR detectado:', decodedText);
              stopScanner();
              onScan(decodedText);
            },
            (errorMessage) => {
              // Solo mostrar errores importantes
              if (errorMessage.includes('NotFound') || 
                  errorMessage.includes('No QR code found')) {
                return;
              }
              console.log('Error de escaneo:', errorMessage);
            }
          );

          setPermissionStatus('granted');
          setIsScanning(true);
        } else {
          setError('No se encontró ninguna cámara');
          setPermissionStatus('denied');
        }
      } catch (err: any) {
        console.error('Error al iniciar escáner:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
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

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error al detener escáner:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const retryPermission = () => {
    setError('');
    setPermissionStatus('unknown');
    setIsScanning(false);
    
    // Reiniciar el escáner
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    
    // Recargar la página para reiniciar completamente
    window.location.reload();
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
                Iniciando cámara...
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
              <div className="space-y-2">
                <button
                  onClick={retryPermission}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  Reintentar
                </button>
                <p className="text-xs text-gray-500">
                  Si el problema persiste, verifica los permisos de cámara en tu navegador
                </p>
              </div>
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

export default SimpleQRScanner; 