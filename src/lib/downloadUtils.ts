import JSZip from 'jszip';
import QRCodeLib from 'qrcode';
import { QRCode } from '../types';

/**
 * Genera y descarga todos los códigos QR como un archivo ZIP
 */
export const downloadAllQRsAsZip = async (qrCodes: QRCode[]) => {
  if (qrCodes.length === 0) {
    alert('No hay códigos QR para descargar');
    return;
  }

  try {
    const zip = new JSZip();
    const baseUrl = window.location.origin;

    // Crear una carpeta para los QRs
    const qrFolder = zip.folder('qr_codes');

    if (!qrFolder) {
      throw new Error('No se pudo crear la carpeta en el ZIP');
    }

    // Generar QRs y agregarlos al ZIP
    for (const qrCode of qrCodes) {
      const url = `${baseUrl}/scan/${qrCode.id}`;
      
      try {
        // Generar QR como data URL
        const qrDataUrl = await QRCodeLib.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        // Convertir data URL a blob
        const base64Data = qrDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Nombre del archivo: nombre-apellido-dni.png
        const fileName = `${qrCode.first_name}-${qrCode.last_name}-${qrCode.dni}.png`
          .replace(/\s+/g, '-')
          .toLowerCase();

        // Agregar al ZIP
        qrFolder.file(fileName, blob);
      } catch (error) {
        console.error(`Error generando QR para ${qrCode.first_name} ${qrCode.last_name}:`, error);
      }
    }

    // Generar el ZIP y descargarlo
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `qr_codes_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);

    alert(`Se descargaron ${qrCodes.length} códigos QR exitosamente`);
  } catch (error) {
    console.error('Error descargando QRs:', error);
    alert('Error al generar el archivo ZIP. Por favor, intenta de nuevo.');
  }
};

/**
 * Genera un QR individual como imagen PNG
 */
export const generateQRImage = async (qrCode: QRCode): Promise<string> => {
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/scan/${qrCode.id}`;
  
  const qrDataUrl = await QRCodeLib.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return qrDataUrl;
};

