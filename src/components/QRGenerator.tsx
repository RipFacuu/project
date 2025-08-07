import React, { useRef, useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import html2canvas from 'html2canvas';
import { Download, Share2, MessageCircle, Send } from 'lucide-react';
import logoImage from '../img/Logo.jpeg';

interface QRGeneratorProps {
  value: string;
  firstName?: string;
  lastName?: string;
  size?: number;
  onDownload?: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ 
  value, 
  firstName = '', 
  lastName = '', 
  size = 200, 
  onDownload 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (value) {
      // Generate data URL for sharing
      QRCodeLib.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      });
    }
  }, [value, size]);

  const downloadQR = async () => {
    if (containerRef.current) {
      try {
        // Crear un contenedor temporal para la captura
        const tempContainer = containerRef.current.cloneNode(true) as HTMLElement;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.zIndex = '-1';
        tempContainer.style.background = '#000000';
        document.body.appendChild(tempContainer);
        
        // Esperar un momento para que se renderice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Configuración optimizada para evitar imagen negra
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#000000',
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
          // Configuraciones básicas
          foreignObjectRendering: false,
          imageTimeout: 15000,
          // Dimensiones exactas
          width: 320,
          height: 580
        });
        
        // Limpiar el contenedor temporal
        document.body.removeChild(tempContainer);
        
        const link = document.createElement('a');
        link.download = `${firstName}-${lastName}-mundialito-qr.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        onDownload?.();
      } catch (error) {
        console.error('Error downloading QR:', error);
        // Fallback: intentar descarga simple
        try {
          const simpleCanvas = await html2canvas(containerRef.current, {
            backgroundColor: '#000000',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          const link = document.createElement('a');
          link.download = `${firstName}-${lastName}-mundialito-qr.png`;
          link.href = simpleCanvas.toDataURL('image/png', 1.0);
          link.click();
          
          onDownload?.();
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError);
          alert('Error al descargar la imagen. Intenta de nuevo.');
        }
      }
    }
  };

  const shareToWhatsApp = () => {
    const text = `¡Escanea este código QR del Mundialito!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + value)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const text = `¡Escanea este código QR del Mundialito!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(value)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareGeneric = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Código QR Mundialito',
          text: '¡Escanea este código QR del Mundialito!',
          url: value
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(value);
      alert('URL copiada al portapapeles');
    }
  };

  if (!value) return null;

  if (value.includes('Vista previa')) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-black p-8 rounded-3xl shadow-2xl w-80 h-96 flex flex-col items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-gray-800 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xs text-center">QR Preview</span>
            </div>
            <p className="text-gray-300 text-sm">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay nombre y apellido, mostrar QR simple
  if (!firstName || !lastName) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <img 
            src={qrDataUrl} 
            alt="QR Code" 
            className="w-48 h-48"
          />
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
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Contenedor principal optimizado */}
      <div 
        ref={containerRef} 
        data-qr-container
        className="bg-black p-6 rounded-3xl shadow-2xl w-80 h-[580px] flex flex-col items-center justify-between relative overflow-hidden"
        style={{ 
          minHeight: '580px',
          maxHeight: '580px',
          background: 'linear-gradient(145deg, #000000 0%, #1a1a1a 30%, #000000 100%)'
        }}
      >
        {/* Efectos de gradiente sutiles */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-blue-500/5 pointer-events-none"></div>
        
        {/* Header con título */}
        <div className="text-center mb-6 relative z-10 pt-6">
          <h1 className="text-white text-xl font-bold mb-4 tracking-wide">
            Mundialito invierno 2025
          </h1>
          
          {/* Logo circular */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-orange-500/40 overflow-hidden">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Logo Mundialito" 
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: '50%'
                  }}
                />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-black text-xs font-bold text-center leading-tight">
                
              </div>
            </div>
          </div>
        </div>

        {/* QR Code centrado */}
        <div className="flex-1 flex items-center justify-center relative z-10 px-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <img 
              src={qrDataUrl} 
              alt="QR Code" 
              className="w-44 h-44"
            />
          </div>
        </div>

        {/* Footer con nombre y apellido */}
        <div className="text-center mt-6 relative z-10 pb-6">
          <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/25">
            <p className="text-white text-lg font-bold mb-1">
              {firstName} {lastName}
            </p>
          </div>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={downloadQR}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span className="font-medium text-sm">Descargar</span>
        </button>
        
        <button
          onClick={shareToWhatsApp}
          className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium text-sm">WhatsApp</span>
        </button>
        
        <button
          onClick={shareToTelegram}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Send className="w-4 h-4" />
          <span className="font-medium text-sm">Telegram</span>
        </button>
        
        <button
          onClick={shareGeneric}
          className="flex items-center space-x-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Share2 className="w-4 h-4" />
          <span className="font-medium text-sm">Compartir</span>
        </button>
      </div>
    </div>
  );
};

export default QRGenerator;