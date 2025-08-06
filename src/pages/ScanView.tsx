import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, FileText, CreditCard, Calendar, AlertCircle, ArrowLeft, QrCode, Loader } from 'lucide-react';
import { qrCodeService } from '../lib/database';
import { QRCode } from '../types';

const ScanView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchQRCode();
    }
  }, [id]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const { data, error } = await qrCodeService.getQRCodeById(id!);

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Código QR no encontrado');
        } else {
          throw error;
        }
      } else {
        setQrCode(data);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Loader className="w-8 h-8 text-orange-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Cargando información...
              </h2>
              <p className="text-gray-600">
                Buscando datos del código QR
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Código QR no encontrado'}
            </h2>
            <p className="text-gray-600 mb-6">
              El código QR que estás buscando no existe o ha sido eliminado.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                Escanear Otro QR
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-900">Información del QR</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Escanear Otro</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {qrCode.first_name} {qrCode.last_name}
                </h1>
                <p className="text-orange-100 text-sm">
                  Información personal
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Nombre Completo</p>
                  <p className="font-semibold text-gray-900">{qrCode.first_name} {qrCode.last_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">DNI</p>
                  <p className="font-semibold text-gray-900">{qrCode.dni}</p>
                </div>
              </div>
            </div>

            {qrCode.description && (
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-lg mt-1">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-gray-900 leading-relaxed">{qrCode.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Fecha de Creación</p>
                <p className="font-semibold text-gray-900">{formatDate(qrCode.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Este código QR fue generado automáticamente
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Escanear Otro QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanView;