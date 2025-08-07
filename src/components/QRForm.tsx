import React, { useState, useEffect, useRef } from 'react';
import { Save, X, ArrowLeft } from 'lucide-react';
import { QRCode, CreateQRCodeData } from '../types';
import QRGenerator from './QRGenerator';

interface QRFormProps {
  qrCode?: QRCode | null;
  onSave: (data: CreateQRCodeData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onCheckDNI?: (dni: string) => Promise<boolean>;
  savedQR?: QRCode | null;
}

const QRForm: React.FC<QRFormProps> = ({ qrCode, onSave, onCancel, loading, onCheckDNI, savedQR }) => {
  const [formData, setFormData] = useState({
    first_name: qrCode?.first_name || '',
    last_name: qrCode?.last_name || '',
    dni: qrCode?.dni || '',
    description: qrCode?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatingDNI, setValidatingDNI] = useState(false);
  const dniTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dniTimeoutRef.current) {
        clearTimeout(dniTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'El nombre es requerido';
    if (!formData.last_name.trim()) newErrors.last_name = 'El apellido es requerido';
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es requerido';
    
    // Check for DNI duplicates if not editing and onCheckDNI is provided
    if (!qrCode && onCheckDNI && formData.dni.trim()) {
      const exists = await onCheckDNI(formData.dni.trim());
      if (exists) {
        newErrors.dni = 'Ya existe un código QR con este DNI';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) return;
    
    await onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDNIChange = async (value: string) => {
    handleChange('dni', value);
    
    // Clear previous timeout
    if (dniTimeoutRef.current) {
      clearTimeout(dniTimeoutRef.current);
    }
    
    // Clear DNI error when user starts typing
    if (errors.dni) {
      setErrors(prev => ({ ...prev, dni: '' }));
    }
    
    // Check for DNI duplicates in real-time if not editing
    if (!qrCode && onCheckDNI && value.trim() && value.trim().length >= 3) {
      setValidatingDNI(true);
      
      dniTimeoutRef.current = setTimeout(async () => {
        const exists = await onCheckDNI(value.trim());
        if (exists) {
          setErrors(prev => ({ ...prev, dni: 'Ya existe un código QR con este DNI' }));
        }
        setValidatingDNI(false);
      }, 500); // 500ms debounce
    } else {
      setValidatingDNI(false);
    }
  };

  const generateQRValue = () => {
    console.log('🔄 Generando valor del QR...');
    console.log('📝 QR Code existente:', qrCode);
    console.log('💾 Saved QR:', savedQR);
    console.log('📋 Form data:', formData);
    
    if (!qrCode?.id && (!formData.first_name || !formData.last_name)) {
      console.log('❌ No hay datos suficientes para generar QR');
      return '';
    }
    
    // Obtener la URL base correcta (funciona en desarrollo y producción)
    const getBaseUrl = () => {
      // Siempre usar window.location.origin para obtener la URL actual
      const origin = window.location.origin;
      console.log('🌐 URL actual:', window.location.href);
      console.log('🌐 Origin:', origin);
      return origin;
    };
    
    const baseUrl = getBaseUrl();
    console.log('🌐 Base URL para QR:', baseUrl);
    
    // Si es un QR existente, usar el ID real
    if (qrCode?.id) {
      const url = `${baseUrl}/scan/${qrCode.id}`;
      console.log('✅ Usando ID de QR existente:', url);
      return url;
    }
    
    // Si hay un QR guardado recientemente, usar su ID
    if (savedQR?.id) {
      const url = `${baseUrl}/scan/${savedQR.id}`;
      console.log('✅ Usando ID de QR guardado:', url);
      return url;
    }
    
    // Si es un nuevo QR, mostrar un mensaje de vista previa
    console.log('⚠️ Mostrando vista previa - QR se generará después de guardar');
    return 'Vista previa - El QR se generará después de guardar';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {qrCode ? 'Editar Código QR' : 'Crear Nuevo Código QR'}
            </h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingresa el nombre"
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingresa el apellido"
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
          </div>
          
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
              DNI
            </label>
            <input
              type="text"
              id="dni"
              value={formData.dni}
              onChange={(e) => handleDNIChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.dni ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingresa el DNI"
            />
            <div className="flex items-center space-x-2">
              {errors.dni && <p className="text-red-500 text-sm mt-1">{errors.dni}</p>}
              {validatingDNI && <p className="text-blue-500 text-sm mt-1">Verificando DNI...</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ingresa una descripción (opcional)"
            />
          </div>



          {(qrCode || savedQR || (formData.first_name && formData.last_name)) && (
            <div className="mt-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {savedQR ? 'Código QR Generado' : 'Vista previa del QR'}
                </h3>
                <p className="text-gray-600">
                  {savedQR 
                    ? 'Tu código QR está listo para descargar y compartir' 
                    : 'Vista previa del diseño seleccionado'
                  }
                </p>
              </div>
              
              <div className="flex justify-center">
                <QRGenerator 
                  value={generateQRValue()} 
                  firstName={formData.first_name}
                  lastName={formData.last_name}
                />
              </div>
              {savedQR && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-green-800 font-semibold mb-2">
                      ¡Código QR creado exitosamente!
                    </h4>
                    <p className="text-green-700 text-sm mb-3">
                      Ya puedes escanearlo o compartirlo con otros participantes.
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <p className="text-green-600 text-xs font-mono">
                        URL: {window.location.origin}/scan/{savedQR.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
            
            {savedQR ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <span>✅ Cerrar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QRForm;