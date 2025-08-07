/**
 * Formatea una fecha para la zona horaria de Argentina
 * @param dateString - String de fecha ISO
 * @param includeTime - Si incluir hora (por defecto false)
 * @returns String formateado de la fecha
 */
export const formatArgentinaDate = (dateString: string, includeTime: boolean = false): string => {
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    
    // Opciones de formateo
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: includeTime ? 'long' : 'short',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    };
    
    // Agregar hora si se solicita
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-AR', options);
  } catch (error) {
    console.error('Error formateando fecha de Argentina:', error);
    return 'Fecha no disponible';
  }
};

/**
 * Obtiene la fecha actual en la zona horaria de Argentina
 * @returns Date object en zona horaria de Argentina
 */
export const getArgentinaDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};
