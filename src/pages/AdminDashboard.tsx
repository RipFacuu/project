import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { qrCodeService } from '../lib/database';
import { QRCode, CreateQRCodeData } from '../types';
import Header from '../components/Header';
import QRList from '../components/QRList';
import QRForm from '../components/QRForm';

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedQR, setSavedQR] = useState<QRCode | null>(null);

  useEffect(() => {
    if (user) {
      fetchQRCodes();
    }
  }, [user]);

  useEffect(() => {
    // Filtrar códigos QR basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredQrCodes(qrCodes);
    } else {
      const filtered = qrCodes.filter(qr => 
        qr.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.dni.includes(searchTerm) ||
        `${qr.first_name} ${qr.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQrCodes(filtered);
    }
  }, [searchTerm, qrCodes]);

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await qrCodeService.getUserQRCodes();

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: CreateQRCodeData) => {
    setSaving(true);
    try {
      if (editingQR) {
        const { error } = await qrCodeService.updateQRCode(editingQR.id, formData);
        if (error) throw error;
        setSavedQR(null);
        
        await fetchQRCodes();
        setShowForm(false);
        setEditingQR(null);
      } else {
        const { data, error } = await qrCodeService.createQRCode(formData);
        if (error) throw error;
        
        setSavedQR(data);
        await fetchQRCodes();
      }
    } catch (error: unknown) {
      console.error('Error saving QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el código QR';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (qrCode: QRCode) => {
    setEditingQR(qrCode);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este código QR?')) return;

    try {
      const { error } = await qrCodeService.deleteQRCode(id);
      if (error) throw error;
      await fetchQRCodes();
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Error al eliminar el código QR');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingQR(null);
    setSavedQR(null);
  };

  const checkDNIExists = async (dni: string): Promise<boolean> => {
    const { exists } = await qrCodeService.checkDNIExists(dni);
    return exists;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Códigos QR" showLogout />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <QRForm
            qrCode={editingQR}
            onSave={handleSave}
            onCancel={handleCancel}
            loading={saving}
            onCheckDNI={checkDNIExists}
            savedQR={savedQR}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Códigos QR</h1>
                <p className="text-gray-600">Gestiona todos tus códigos QR desde aquí</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={fetchQRCodes}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
                
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear QR</span>
                </button>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Buscar por nombre o DNI..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="mt-2 text-sm text-gray-600">
                  {filteredQrCodes.length} resultado{filteredQrCodes.length !== 1 ? 's' : ''} encontrado{filteredQrCodes.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <QRList
              qrCodes={filteredQrCodes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;