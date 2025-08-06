import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { qrCodeService } from '../lib/database';
import { QRCode, CreateQRCodeData } from '../types';
import Header from '../components/Header';
import QRList from '../components/QRList';
import QRForm from '../components/QRForm';

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
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
        // Update existing QR
        const { error } = await qrCodeService.updateQRCode(editingQR.id, formData);
        if (error) throw error;
        setSavedQR(null); // Clear saved QR for updates
      } else {
        // Create new QR
        const { data, error } = await qrCodeService.createQRCode(formData);
        if (error) throw error;
        setSavedQR(data); // Store the newly created QR
      }

      await fetchQRCodes();
      setShowForm(false);
      setEditingQR(null);
      setSavedQR(null);
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

  // Función de depuración para mostrar información de los QR codes
  const debugQRCodes = () => {
    console.log('QR Codes en la base de datos:');
    qrCodes.forEach((qr, index) => {
      console.log(`${index + 1}. ID: ${qr.id}`);
      console.log(`   Nombre: ${qr.first_name} ${qr.last_name}`);
      console.log(`   DNI: ${qr.dni}`);
      console.log(`   URL: ${window.location.origin}/scan/${qr.id}`);
      console.log('---');
    });
  };

  // Verificar el QR problemático específico
  const checkProblematicQR = async () => {
    const problematicId = 'gru1::ndmlz-1754504096000-39cac0f4e72a';
    console.log(`Verificando QR problemático: ${problematicId}`);
    
    const { exists, data } = await qrCodeService.debugQRCode(problematicId);
    
    if (exists && data) {
      console.log('✅ QR encontrado:', data);
      alert(`QR encontrado: ${data.first_name} ${data.last_name} (DNI: ${data.dni})`);
    } else {
      console.log('❌ QR no encontrado');
      alert('QR no encontrado en la base de datos. Este QR puede haber sido eliminado o nunca existió.');
    }
  };

  // Ejecutar depuración cuando se cargan los QR codes
  useEffect(() => {
    if (qrCodes.length > 0) {
      debugQRCodes();
    }
  }, [qrCodes]);

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
                  onClick={debugQRCodes}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Debug QR</span>
                </button>
                
                <button
                  onClick={checkProblematicQR}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Check 404 QR</span>
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
            
            <QRList
              qrCodes={qrCodes}
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