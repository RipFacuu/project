import React from 'react';
import { Edit, Trash2, QrCode as QrCodeIcon, Calendar } from 'lucide-react';
import { QRCode } from '../types';
import { formatArgentinaDate } from '../lib/utils';

interface QRListProps {
  qrCodes: QRCode[];
  onEdit: (qrCode: QRCode) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const QRList: React.FC<QRListProps> = ({ qrCodes, onEdit, onDelete, loading }) => {
  const formatDate = (dateString: string) => {
    return formatArgentinaDate(dateString, false);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay códigos QR</h3>
        <p className="text-gray-500 mb-6">Crea tu primer código QR para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {qrCodes.map((qrCode) => (
        <div key={qrCode.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <QrCodeIcon className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{qrCode.first_name} {qrCode.last_name}</h3>
                <p className="text-sm text-gray-500">DNI: {qrCode.dni}</p>
              </div>
            </div>
          </div>
          
          {qrCode.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{qrCode.description}</p>
          )}
          
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
            <Calendar className="w-3 h-3" />
            <span>Creado {formatDate(qrCode.created_at)}</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(qrCode)}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex-1 justify-center"
            >
              <Edit className="w-3 h-3" />
              <span>Editar</span>
            </button>
            
            <button
              onClick={() => onDelete(qrCode.id)}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QRList;