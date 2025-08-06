import React, { useRef, useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import html2canvas from 'html2canvas';
import { Download, Share2, MessageCircle, Send, Instagram } from 'lucide-react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  onDownload?: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 200, onDownload }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      
      // Generate data URL for sharing
      QRCodeLib.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      }).then(url => setQrDataUrl(url));
    }
  }, [value, size]);

  const downloadQR = async () => {
    if (containerRef.current) {
      try {
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        });
        
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        onDownload?.();
      } catch (error) {
        console.error('Error downloading QR:', error);
      }
    }
  };

  const shareToWhatsApp = () => {
    const text = `¡Escanea este código QR!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + value)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const text = `¡Escanea este código QR!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(value)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareGeneric = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Código QR',
          text: '¡Escanea este código QR!',
          url: value
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(value);
      alert('URL copiada al portapapeles');
    }
  };

  if (!value) return null;

  // Si el valor es un mensaje de vista previa, mostrar un placeholder
  if (value.includes('Vista previa')) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-gray-100 p-8 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-500 text-xs text-center">QR Preview</span>
            </div>
            <p className="text-gray-600 text-sm">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div ref={containerRef} className="bg-white p-4 rounded-lg shadow-sm">
        <canvas ref={canvasRef} className="border border-gray-200 rounded" />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={downloadQR}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Descargar</span>
        </button>
        
        <button
          onClick={shareToWhatsApp}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
        
        <button
          onClick={shareToTelegram}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <Send className="w-4 h-4" />
          <span>Telegram</span>
        </button>
        
        <button
          onClick={shareGeneric}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
};

export default QRGenerator;