import React, { useState } from 'react';
import QRCodeLib from 'qrcode';
import { Copy, Download } from 'lucide-react';

const TestQRGenerator: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrId, setQrId] = useState('test-123');

  const generateQR = async () => {
    try {
      const url = `${window.location.origin}/scan/${qrId}`;
      console.log('🧪 Generando QR de prueba con URL:', url);
      
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/scan/${qrId}`;
    console.log('📋 Copiando URL de prueba:', url);
    navigator.clipboard.writeText(url);
    alert('URL copiada al portapapeles');
  };

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `${qrId}-mundialito-qr.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Generador de QR de Prueba
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID del QR de prueba:
          </label>
          <input
            type="text"
            value={qrId}
            onChange={(e) => setQrId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="test-123"
          />
        </div>

        <button
          onClick={generateQR}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
        >
          Generar QR de Prueba
        </button>

        {qrDataUrl && (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
            </div>
            
            <div className="flex space-x-2 justify-center">
              <button
                onClick={downloadQR}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </button>
              
              <button
                onClick={copyUrl}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar URL</span>
              </button>
            </div>

            <p className="text-sm text-gray-600">
              URL: {window.location.origin}/scan/{qrId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestQRGenerator;