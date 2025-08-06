import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { QRCode, CreateQRCodeData } from '../types';
import QRGenerator from './QRGenerator';

interface QRFormProps {
  qrCode?: QRCode | null;
  onSave: (data: CreateQRCodeData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const QRForm: React.FC<QRFormProps> = ({ qrCode, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    first_name: qrCode?.first_name || '',
    last_name: qrCode?.last_name || '',
    dni: qrCode?.dni || '',
    description: qrCode?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'El nombre es requerido';
    if (!formData.last_name.trim()) newErrors.last_name = 'El apellido es requerido';
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateQRValue = () => {
    if (!qrCode?.id && (!formData.first_name || !formData.last_name)) return '';
    const id = qrCode?.id || 'preview';
    return `${window.location.origin}/scan/${id}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {qrCode ? 'Editar Código QR' : 'Crear Nuevo Código QR'}
        </h2>
        
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
              onChange={(e) => handleChange('dni', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.dni ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingresa el DNI"
            />
            {errors.dni && <p className="text-red-500 text-sm mt-1">{errors.dni}</p>}
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

          {(qrCode || (formData.first_name && formData.last_name)) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista previa del QR</h3>
              <div className="flex justify-center">
                <QRGenerator value={generateQRValue()} />
              </div>
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
            
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QRForm;