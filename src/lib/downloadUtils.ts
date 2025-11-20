import JSZip from 'jszip';
import { QRCode } from '../types';
import { generateQRCardImage } from './qrCardGenerator';

/**
 * Genera y descarga todos los códigos QR como un archivo ZIP con tarjetas completas
 */
export const downloadAllQRsAsZip = async (qrCodes: QRCode[], category?: string) => {
  if (qrCodes.length === 0) {
    alert('No hay códigos QR para descargar');
    return;
  }

  try {
    const zip = new JSZip();
    const baseUrl = window.location.origin;

    // Agrupar por categoría si está definida
    const groupedByCategory: { [key: string]: QRCode[] } = {};
    
    if (category) {
      // Solo descargar de la categoría especificada
      const filtered = qrCodes.filter(qr => qr.category === category);
      if (filtered.length === 0) {
        alert(`No hay códigos QR en la categoría "${category}"`);
        return;
      }
      groupedByCategory[category || 'Sin categoría'] = filtered;
    } else {
      // Agrupar por categoría o usar "Sin categoría"
      qrCodes.forEach(qr => {
        const cat = qr.category || 'Sin categoría';
        if (!groupedByCategory[cat]) {
          groupedByCategory[cat] = [];
        }
        groupedByCategory[cat].push(qr);
      });
    }

    let totalProcessed = 0;
    let totalFailed = 0;

    // Procesar cada categoría
    for (const [catName, qrList] of Object.entries(groupedByCategory)) {
      // Crear carpeta para la categoría
      const categoryFolder = zip.folder(catName) || zip;

      // Generar tarjetas completas para cada QR
      for (const qrCode of qrList) {
        const url = `${baseUrl}/scan/${qrCode.id}`;
        
        try {
          // Generar tarjeta completa
          const blob = await generateQRCardImage(
            qrCode.first_name,
            qrCode.last_name,
            url
          );

          // Nombre del archivo: nombre-apellido-dni.png
          const fileName = `${qrCode.first_name}-${qrCode.last_name}-${qrCode.dni}.png`
            .replace(/\s+/g, '-')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

          // Agregar al ZIP en la carpeta de categoría
          categoryFolder.file(fileName, blob);
          totalProcessed++;
        } catch (error) {
          console.error(`Error generando tarjeta para ${qrCode.first_name} ${qrCode.last_name}:`, error);
          totalFailed++;
        }
      }
    }

    if (totalProcessed === 0) {
      alert('No se pudo generar ninguna tarjeta. Por favor, intenta de nuevo.');
      return;
    }

    // Generar el ZIP y descargarlo
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    
    // Nombre del archivo con fecha y categoría si es única
    const fileName = category 
      ? `qr_codes_${category}_${new Date().toISOString().split('T')[0]}.zip`
      : `qr_codes_${new Date().toISOString().split('T')[0]}.zip`;
    
    link.download = fileName.replace(/\s+/g, '_').toLowerCase();
    link.click();
    URL.revokeObjectURL(link.href);

    const message = totalFailed > 0
      ? `Se descargaron ${totalProcessed} tarjetas. ${totalFailed} fallaron.`
      : `Se descargaron ${totalProcessed} tarjetas exitosamente`;
    
    alert(message);
  } catch (error) {
    console.error('Error descargando QRs:', error);
    alert('Error al generar el archivo ZIP. Por favor, intenta de nuevo.');
  }
};

/**
 * Obtiene todas las categorías únicas de una lista de QRs
 */
export const getCategories = (qrCodes: QRCode[]): string[] => {
  const categories = new Set<string>();
  qrCodes.forEach(qr => {
    if (qr.category) {
      categories.add(qr.category);
    }
  });
  return Array.from(categories).sort();
};

