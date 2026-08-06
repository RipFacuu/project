import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, Users, Upload, Download, Folder, X, AlertTriangle } from 'lucide-react';
import { qrCodeService } from '../lib/database';
import { downloadAllQRsAsZip, getCategories } from '../lib/downloadUtils';
import { QRCode, CreateQRCodeData } from '../types';
import Header from '../components/Header';
import QRList from '../components/QRList';
import QRForm from '../components/QRForm';
import BulkUpload from '../components/BulkUpload';
import { isSupabaseMisconfigured } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedQR, setSavedQR] = useState<QRCode | null>(null);
  const [creatingProfes, setCreatingProfes] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    fetchQRCodes();
    fetchCategories();
  }, []);

  // Cerrar el filtro de categorías cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCategoryFilter && !target.closest('.category-filter')) {
        setShowCategoryFilter(false);
      }
    };

    if (showCategoryFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCategoryFilter]);

  useEffect(() => {
    // Filtrar códigos QR basado en el término de búsqueda y categoría
    let filtered = qrCodes;
    
    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(qr => qr.category === selectedCategory);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(qr => 
        qr.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.dni.includes(searchTerm) ||
        `${qr.first_name} ${qr.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredQrCodes(filtered);
  }, [searchTerm, qrCodes, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await qrCodeService.getUserCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await qrCodeService.getUserQRCodes(selectedCategory || undefined);

      if (error) throw error;
      setQrCodes(data || []);
      
      // Actualizar categorías después de cargar QRs
      await fetchCategories();
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
      let errorMessage = error instanceof Error ? error.message : 'Error al guardar el código QR';

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as any).code;
        const status = (error as any).status;
        const details = (error as any).details || (error as any).message || '';

        if (status === 401 || code === '401' || String(details + errorMessage).toLowerCase().includes('401') || String(details + errorMessage).toLowerCase().includes('unauthorized')) {
          errorMessage = '❌ ERROR 401: Supabase no permite guardar sin autenticación.\n\nSOLUCIÓN: Tenés que ir al panel de Supabase → SQL Editor y ejecutar el archivo:\nsupabase/disable_auth.sql\n\n(Lo agregué al proyecto. Copiá su contenido y ejecutalo en SQL Editor.)';
        } else if (status === 403 || code === 'PGRST' || String(details + errorMessage).toLowerCase().includes('row level') || String(details + errorMessage).toLowerCase().includes('policy')) {
          errorMessage = '❌ ERROR de permisos (RLS). Tenés que ejecutar el SQL en Supabase:\n\n1. Entrá a: https://supabase.com/dashboard/project/bfoqnoemdbjoruqvhpwz\n2. Menú SQL Editor → New query\n3. Pegá el contenido de: supabase/disable_auth.sql\n4. Apretá RUN (▶️)\n\nDespués recargá la app.';
        } else {
          errorMessage = `Error al guardar el código QR.\n\nCódigo: ${code || status || 'N/A'}\nDetalle: ${details || errorMessage}`;
        }
      }

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

  const handleCreateProfes = async () => {
    if (!confirm('¿Deseas crear los códigos QR para todos los profes y staff del Club las Palmas? Esto creará 18 nuevos registros.')) {
      return;
    }

    setCreatingProfes(true);
    
    try {
      const profes: CreateQRCodeData[] = [
        { first_name: 'Luana', last_name: 'Sardot', dni: '43372211', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Lucia', last_name: 'Pesce', dni: '46587402', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Juan', last_name: 'Vannucci', dni: '44896331', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Ezequiel', last_name: 'Aliendo', dni: '39621814', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Santiago', last_name: 'Paniagua', dni: '46309824', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Brenda', last_name: 'Argañaraz', dni: '39936843', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Ignacio', last_name: 'Monasterolo', dni: '44219095', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Diego', last_name: 'Díaz', dni: '41962688', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Gonzalo', last_name: 'Candela', dni: '44341707', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Jenifer', last_name: 'Ugarte', dni: '42315920', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Juan Cruz', last_name: 'Cabrera', dni: '44774745', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Constanza', last_name: 'Acevedo', dni: '43284783', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Federica', last_name: 'Bustos', dni: '39690730', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Pablo', last_name: 'Mansilla', dni: '29204709', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Manuel', last_name: 'Flamini', dni: '44972158', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Ángel Ariel', last_name: 'Flores Ponce', dni: '43561256', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Jeremías Ezequiel', last_name: 'Cadelago', dni: '42799505', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
        { first_name: 'Ivana V', last_name: 'Sponers', dni: '30971550', description: 'Club las Palmas - Listado Profes y Staff', category: 'Club las Palmas' },
      ];

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const profe of profes) {
        try {
          // Verificar si el DNI ya existe
          const { exists } = await qrCodeService.checkDNIExists(profe.dni);
          
          if (exists) {
            skipped++;
            continue;
          }

          const { error } = await qrCodeService.createQRCode(profe);
          if (error) {
            errors.push(`${profe.first_name} ${profe.last_name}: ${error.message || 'Error desconocido'}`);
          } else {
            created++;
          }
        } catch (error) {
          errors.push(`${profe.first_name} ${profe.last_name}: Error al crear`);
        }
      }

      // Mostrar resultado
      let message = `Creados: ${created}, Omitidos (ya existían): ${skipped}`;
      if (errors.length > 0) {
        message += `\n\nErrores: ${errors.length}\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... y ${errors.length - 5} más`;
        }
      }
      alert(message);

      // Refrescar la lista
      await fetchQRCodes();
    } catch (error) {
      console.error('Error creando profes:', error);
      alert('Error inesperado al crear los registros');
    } finally {
      setCreatingProfes(false);
    }
  };

  const handleBulkUploadComplete = async () => {
    setShowBulkUpload(false);
    await fetchQRCodes();
  };

  const handleDownloadAll = async () => {
    const qrsToDownload = selectedCategory 
      ? qrCodes.filter(qr => qr.category === selectedCategory)
      : qrCodes;

    if (qrsToDownload.length === 0) {
      alert('No hay códigos QR para descargar');
      return;
    }

    setDownloadingZip(true);
    try {
      await downloadAllQRsAsZip(qrsToDownload, selectedCategory || undefined);
    } catch (error) {
      console.error('Error descargando ZIP:', error);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryFilter(false);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Códigos QR" />

      {isSupabaseMisconfigured && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-1">
                  ⚠️ Falta configurar variables de entorno en Vercel
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  La app no se puede conectar a Supabase porque no están las variables
                  configuradas en Vercel. Hacelo así:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-red-700 text-sm">
                  <li>
                    Entrá al panel de Vercel → tu proyecto →{' '}
                    <strong>Settings → Environment Variables</strong>
                  </li>
                  <li>
                    Agregá estas DOS variables (marcá "Production" + "Preview" + "Development"):
                  </li>
                </ol>
                <div className="mt-3 space-y-2">
                  <div className="bg-white border border-red-200 rounded p-3 font-mono text-xs">
                    <div className="mb-1">
                      <span className="font-bold text-red-700">VITE_SUPABASE_URL</span>
                      <br />
                      <span className="text-gray-700">
                        https://bfoqnoemdbjoruqvhpwz.supabase.co
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-red-700">VITE_SUPABASE_ANON_KEY</span>
                      <br />
                      <span className="text-gray-700 break-all">
                        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmb3Fub2VtZGJqb3J1cXZocHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjU1ODksImV4cCI6MjEwMTYwMTU4OX0.1BbiY0Nrohb1JsAl4R9qdsmzyW7KxagoyJHGerWWi9A
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-red-700 text-sm mt-3">
                  3. Después de guardar, andá a <strong>Deployments</strong> → click en los 3
                  puntos del último deploy → <strong>Redeploy</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showBulkUpload ? (
          <BulkUpload
            onComplete={handleBulkUploadComplete}
            onCancel={() => setShowBulkUpload(false)}
          />
        ) : showForm ? (
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
              
              <div className="flex flex-wrap gap-3">
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

                <button
                  onClick={handleCreateProfes}
                  disabled={creatingProfes}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                >
                  <Users className={`w-4 h-4 ${creatingProfes ? 'animate-pulse' : ''}`} />
                  <span>{creatingProfes ? 'Creando...' : 'Crear Profes'}</span>
                </button>

                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir CSV</span>
                </button>

                <button
                  onClick={handleDownloadAll}
                  disabled={downloadingZip || filteredQrCodes.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                >
                  <Download className={`w-4 h-4 ${downloadingZip ? 'animate-bounce' : ''}`} />
                  <span>
                    {downloadingZip 
                      ? 'Generando...' 
                      : `Descargar ${selectedCategory ? `"${selectedCategory}"` : 'Todo'} (${filteredQrCodes.length})`
                    }
                  </span>
                </button>
              </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Búsqueda */}
                <div className="relative flex-1 max-w-md">
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

                {/* Filtro de categorías */}
                <div className="relative category-filter">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors duration-200 ${
                      selectedCategory
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    <span>{selectedCategory || 'Todas las carpetas'}</span>
                    {selectedCategory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCategoryFilter();
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </button>

                  {showCategoryFilter && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <button
                          onClick={() => handleCategoryChange('')}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                            !selectedCategory ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                          }`}
                        >
                          Todas las carpetas
                        </button>
                        {categories.length > 0 && (
                          <div className="border-t border-gray-200 mt-1 pt-1">
                            {categories.map((category) => (
                              <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                  selectedCategory === category ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        )}
                        {categories.length === 0 && (
                          <p className="px-3 py-2 text-sm text-gray-500">
                            No hay carpetas creadas aún
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(searchTerm || selectedCategory) && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <p>
                    {filteredQrCodes.length} resultado{filteredQrCodes.length !== 1 ? 's' : ''} encontrado{filteredQrCodes.length !== 1 ? 's' : ''}
                  </p>
                  {selectedCategory && (
                    <p className="text-orange-600">
                      Carpeta: <span className="font-medium">{selectedCategory}</span>
                    </p>
                  )}
                </div>
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