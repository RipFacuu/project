import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import QRCodeLib from 'qrcode';
import logoImage from '../img/Logo.jpeg';

interface QRCardProps {
  firstName: string;
  lastName: string;
  qrDataUrl: string;
}

const QRCard: React.FC<QRCardProps> = ({ firstName, lastName, qrDataUrl }) => {
  return (
    <div
      className="bg-black p-6 rounded-3xl shadow-2xl w-80 h-[580px] flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        minHeight: '580px',
        maxHeight: '580px',
        background: 'linear-gradient(145deg, #000000 0%, #1a1a1a 30%, #000000 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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
  );
};

/**
 * Genera la tarjeta completa del QR como imagen
 */
export const generateQRCardImage = async (
  firstName: string,
  lastName: string,
  qrUrl: string
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Generar el QR code como data URL
      const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Crear un contenedor temporal
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '320px';
      container.style.height = '580px';
      document.body.appendChild(container);

      // Crear root y renderizar el componente
      const root = createRoot(container);
      root.render(
        <QRCard firstName={firstName} lastName={lastName} qrDataUrl={qrDataUrl} />
      );

      // Esperar a que se renderice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar con html2canvas
      const canvas = await html2canvas(container, {
        width: 320,
        height: 580,
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000'
      });

      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        // Limpiar
        root.unmount();
        document.body.removeChild(container);

        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Error al generar el blob'));
        }
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
};

