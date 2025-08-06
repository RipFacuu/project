import React, { useState } from 'react';
import { QrCode, Camera, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';

const PublicScan: React.FC = () => {
  const [qrId, setQrId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const handleScan = () => {
    if (qrId.trim()) {
      navigate(`/scan/${qrId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleCameraScan = (result: string) => {
    // Extraer el ID del QR de la URL si es necesario
    // Asumiendo que el QR contiene una URL como: http://localhost:5174/scan/123
    const urlParts = result.split('/');
    const qrIdFromUrl = urlParts[urlParts.length - 1];
    
    if (qrIdFromUrl) {
      navigate(`/scan/${qrIdFromUrl}`);
    } else {
      // Si no es una URL, usar el resultado directamente
      navigate(`/scan/${result}`);
    }
  };

  const handleCameraError = (error: string) => {
    console.error('Error al escanear:', error);
    // Puedes mostrar un mensaje de error aquí si lo deseas
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Escáner QR</h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="bg-orange-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Escanea tu Código QR
          </h2>
          <p className="text-lg text-gray-600">
            Ingresa el código QR o escanea directamente con tu cámara
          </p>
        </div>

        {/* Scan Options */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Manual Input */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-orange-500" />
              Ingresar Código Manualmente
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={qrId}
                onChange={(e) => setQrId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ingresa el código QR aquí..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
              <button
                onClick={handleScan}
                disabled={!qrId.trim()}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O</span>
            </div>
          </div>

          {/* Camera Scan */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
              <Camera className="w-5 h-5 mr-2 text-orange-500" />
              Escanear con Cámara
            </h3>
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <Camera className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Escanea códigos QR directamente con tu cámara
              </p>
              <button
                onClick={() => setShowScanner(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
              >
                Activar Cámara
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Cómo usar el escáner?
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold text-sm">1</span>
              </div>
              <p className="text-sm text-gray-600">
                Escanea el código QR con tu cámara o ingresa el código manualmente
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold text-sm">2</span>
              </div>
              <p className="text-sm text-gray-600">
                El sistema buscará la información asociada al código
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold text-sm">3</span>
              </div>
              <p className="text-sm text-gray-600">
                Visualiza toda la información de forma rápida y segura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleCameraScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default PublicScan; 