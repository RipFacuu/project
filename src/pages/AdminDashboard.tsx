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
    console.log('🔄 Iniciando guardado de QR code...');
    console.log('📝 Datos del formulario:', formData);
    console.log('✏️ Editando QR existente:', !!editingQR);
    
    setSaving(true);
    try {
      if (editingQR) {
        console.log('📝 Actualizando QR existente con ID:', editingQR.id);
        // Update existing QR
        const { error } = await qrCodeService.updateQRCode(editingQR.id, formData);
        if (error) throw error;
        console.log('✅ QR actualizado exitosamente');
        setSavedQR(null); // Clear saved QR for updates
        
        // Close form immediately for updates
        await fetchQRCodes();
        setShowForm(false);
        setEditingQR(null);
      } else {
        console.log('🆕 Creando nuevo QR code...');
        // Create new QR
        const { data, error } = await qrCodeService.createQRCode(formData);
        if (error) throw error;
        
        console.log('✅ QR creado exitosamente:', data);
        console.log('🆔 ID del QR creado:', data?.id);
        console.log('🔗 URL del QR:', `${window.location.origin}/scan/${data?.id}`);
        
        setSavedQR(data); // Store the newly created QR
        
        // Don't close form immediately - let user see the generated QR
        await fetchQRCodes();
        // setShowForm(false); // Comentado para que el usuario vea el QR
        // setEditingQR(null); // Comentado para que el usuario vea el QR
      }
    } catch (error: unknown) {
      console.error('❌ Error saving QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el código QR';
      alert(errorMessage);
    } finally {
      setSaving(false);
      console.log('🏁 Guardado completado');
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
    console.log('🔍 === DEBUG QR CODES ===');
    console.log('📊 Total de QR codes en la lista:', qrCodes.length);
    
    if (qrCodes.length === 0) {
      console.log('⚠️ No hay QR codes en la lista');
      return;
    }
    
    qrCodes.forEach((qr, index) => {
      console.log(`\n${index + 1}. QR Code:`);
      console.log(`   🆔 ID: ${qr.id}`);
      console.log(`   👤 Nombre: ${qr.first_name} ${qr.last_name}`);
      console.log(`   🆔 DNI: ${qr.dni}`);
      console.log(`   📅 Creado: ${qr.created_at}`);
      console.log(`   🔗 URL: ${window.location.origin}/scan/${qr.id}`);
      console.log(`   👤 User ID: ${qr.user_id}`);
    });
    
    console.log('\n🔍 === FIN DEBUG ===');
  };

  // Verificar todos los QRs en la base de datos (no solo del usuario actual)
  const debugAllQRCodes = async () => {
    console.log('🔍 === DEBUG ALL QR CODES IN DATABASE ===');
    
    try {
      const { data, error } = await qrCodeService.getAllQRCodes();
      
      if (error) {
        console.error('❌ Error obteniendo todos los QRs:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️ No hay QR codes en la base de datos');
        return;
      }
      
      console.log(`📊 Total de QR codes en la base de datos: ${data.length}`);
      
      data.forEach((qr, index) => {
        console.log(`\n${index + 1}. QR Code en DB:`);
        console.log(`   🆔 ID: ${qr.id}`);
        console.log(`   👤 Nombre: ${qr.first_name} ${qr.last_name}`);
        console.log(`   🆔 DNI: ${qr.dni}`);
        console.log(`   📅 Creado: ${qr.created_at}`);
        console.log(`   🔗 URL: ${window.location.origin}/scan/${qr.id}`);
        console.log(`   👤 User ID: ${qr.user_id}`);
      });
      
      console.log('\n🔍 === FIN DEBUG ALL ===');
    } catch (error) {
      console.error('❌ Error en debugAllQRCodes:', error);
    }
  };

  // Probar un QR específico
  const testSpecificQR = async () => {
    if (qrCodes.length === 0) {
      alert('No hay QR codes para probar');
      return;
    }
    
    const firstQR = qrCodes[0];
    const testUrl = `${window.location.origin}/scan/${firstQR.id}`;
    
    console.log('🧪 === TESTING SPECIFIC QR ===');
    console.log('🆔 QR a probar:', firstQR);
    console.log('🔗 URL de prueba:', testUrl);
    
    // Verificar si el QR existe en la base de datos
    const { exists, data } = await qrCodeService.debugQRCode(firstQR.id);
    
    if (exists && data) {
      console.log('✅ QR encontrado en la base de datos:', data);
      alert(`QR válido encontrado: ${data.first_name} ${data.last_name}\nURL: ${testUrl}`);
      
      // Abrir la URL en una nueva pestaña
      window.open(testUrl, '_blank');
    } else {
      console.log('❌ QR no encontrado en la base de datos');
      alert('QR no encontrado en la base de datos');
    }
    
    console.log('🧪 === FIN TEST ===');
  };

  // Limpiar QRs corruptos y regenerar
  const cleanAndRegenerateQRs = async () => {
    console.log('🧹 === CLEANING AND REGENERATING QRS ===');
    
    try {
      // Obtener todos los QRs
      const { data: allQRs, error } = await qrCodeService.getAllQRCodes();
      
      if (error) {
        console.error('❌ Error obteniendo QRs:', error);
        return;
      }
      
      if (!allQRs || allQRs.length === 0) {
        console.log('⚠️ No hay QRs para limpiar');
        return;
      }
      
      console.log(`📊 Total de QRs encontrados: ${allQRs.length}`);
      
      // Verificar cada QR
      const validQRs = [];
      const invalidQRs = [];
      
      for (const qr of allQRs) {
        const { exists } = await qrCodeService.debugQRCode(qr.id);
        if (exists) {
          validQRs.push(qr);
        } else {
          invalidQRs.push(qr);
        }
      }
      
      console.log(`✅ QRs válidos: ${validQRs.length}`);
      console.log(`❌ QRs inválidos: ${invalidQRs.length}`);
      
      if (invalidQRs.length > 0) {
        console.log('🗑️ QRs inválidos encontrados:');
        invalidQRs.forEach(qr => {
          console.log(`   - ${qr.first_name} ${qr.last_name} (ID: ${qr.id})`);
        });
        
        const shouldDelete = confirm(`Se encontraron ${invalidQRs.length} QRs inválidos. ¿Deseas eliminarlos?`);
        if (shouldDelete) {
          for (const qr of invalidQRs) {
            await qrCodeService.deleteQRCode(qr.id);
            console.log(`🗑️ Eliminado QR inválido: ${qr.id}`);
          }
          await fetchQRCodes();
          alert('QRs inválidos eliminados. Por favor, crea nuevos QRs válidos.');
        }
      } else {
        alert('Todos los QRs son válidos. No hay necesidad de limpiar.');
      }
      
    } catch (error) {
      console.error('❌ Error en cleanAndRegenerateQRs:', error);
    }
    
    console.log('🧹 === FIN CLEANING ===');
  };

  // Verificar el QR problemático específico
  const checkProblematicQR = async () => {
    const problematicId = 'gru1::gnjlc-1754504776684-745c34a470a5';
    console.log('🔍 === CHECKING PROBLEMATIC QR ===');
    console.log('🆔 ID problemático:', problematicId);
    
    const { exists, data } = await qrCodeService.debugQRCode(problematicId);
    
    if (exists && data) {
      console.log('✅ QR problemático encontrado:', data);
      alert(`QR encontrado: ${data.first_name} ${data.last_name} (DNI: ${data.dni})`);
    } else {
      console.log('❌ QR problemático NO encontrado en la base de datos');
      alert('QR problemático NO encontrado en la base de datos. Este QR debe ser regenerado.');
    }
    
    console.log('🔍 === FIN CHECKING ===');
  };

  // Verificar el QR problemático de producción
  const checkProductionProblematicQR = async () => {
    const problematicId = '5a87d56-e0fe-4b9d-b10f-e8d4c984b1bd';
    console.log('🔍 === CHECKING PRODUCTION PROBLEMATIC QR ===');
    console.log('🆔 ID problemático de producción:', problematicId);
    
    const { exists, data } = await qrCodeService.debugQRCode(problematicId);
    
    if (exists && data) {
      console.log('✅ QR problemático de producción encontrado:', data);
      alert(`QR encontrado: ${data.first_name} ${data.last_name} (DNI: ${data.dni})`);
    } else {
      console.log('❌ QR problemático de producción NO encontrado en la base de datos');
      alert('QR problemático de producción NO encontrado en la base de datos. Este QR debe ser regenerado.');
    }
    
    console.log('🔍 === FIN CHECKING PRODUCTION ===');
  };

  // Verificar estructura de la base de datos
  const checkDatabaseStructure = async () => {
    console.log('🔍 === CHECKING DATABASE STRUCTURE ===');
    
    try {
      const { valid, info, error } = await qrCodeService.checkDatabaseStructure();
      
      if (error) {
        console.error('❌ Error verificando estructura de BD:', error);
        alert('Error verificando estructura de base de datos');
        return;
      }
      
      if (!valid) {
        console.error('❌ Estructura de BD inválida');
        alert('Estructura de base de datos inválida');
        return;
      }
      
      console.log('✅ Estructura de BD válida');
      console.log('📊 Información de BD:', info);
      
      // Mostrar información en alert
      const message = `
Estructura de BD válida
Total QRs: ${info.totalQRs}
Patrones de ID: ${info.idPatterns.length}
Muestra de IDs: ${info.sampleIds.slice(0, 3).join(', ')}
      `.trim();
      
      alert(message);
      
    } catch (error) {
      console.error('❌ Error en checkDatabaseStructure:', error);
    }
    
    console.log('🔍 === FIN CHECKING DATABASE STRUCTURE ===');
  };

  // Limpiar completamente la base de datos (CUIDADO: elimina todos los QRs)
  const clearAllQRCodes = async () => {
    console.log('🗑️ === CLEARING ALL QR CODES ===');
    
    const confirmClear = confirm(
      '⚠️ ADVERTENCIA: Esto eliminará TODOS los códigos QR de la base de datos.\n\n' +
      '¿Estás seguro de que quieres continuar? Esta acción no se puede deshacer.'
    );
    
    if (!confirmClear) {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }
    
    try {
      // Obtener todos los QRs del usuario actual
      const { data: userQRs, error } = await qrCodeService.getUserQRCodes();
      
      if (error) {
        console.error('❌ Error obteniendo QRs del usuario:', error);
        alert('Error obteniendo QRs del usuario');
        return;
      }
      
      if (!userQRs || userQRs.length === 0) {
        console.log('⚠️ No hay QRs para eliminar');
        alert('No hay QRs para eliminar');
        return;
      }
      
      console.log(`🗑️ Eliminando ${userQRs.length} QRs...`);
      
      let deletedCount = 0;
      for (const qr of userQRs) {
        try {
          await qrCodeService.deleteQRCode(qr.id);
          console.log(`🗑️ Eliminado QR: ${qr.first_name} ${qr.last_name} (${qr.id})`);
          deletedCount++;
        } catch (deleteError) {
          console.error(`❌ Error eliminando QR ${qr.id}:`, deleteError);
        }
      }
      
      await fetchQRCodes();
      alert(`✅ Eliminados ${deletedCount} QRs. La base de datos está limpia.`);
      
    } catch (error) {
      console.error('❌ Error en clearAllQRCodes:', error);
      alert('Error eliminando QRs');
    }
    
    console.log('🗑️ === FIN CLEARING ===');
  };

  // Probar URLs generadas
  const testGeneratedUrls = () => {
    console.log('🧪 === TESTING GENERATED URLS ===');
    
    const currentUrl = window.location.href;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    console.log('🌐 URL actual:', currentUrl);
    console.log('🌐 Origin:', origin);
    console.log('📁 Pathname:', pathname);
    
    // Probar diferentes URLs
    const testUrls = [
      `${origin}/scan/test-123`,
      `${origin}/admin`,
      `${origin}/login`,
      `${origin}/`
    ];
    
    console.log('🧪 URLs de prueba:');
    testUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    // Verificar si estamos en producción
    const isProduction = !origin.includes('localhost') && !origin.includes('127.0.0.1');
    console.log('🏭 Entorno:', isProduction ? 'Producción' : 'Desarrollo');
    
    alert(`
Información de URLs:
🌐 Origin: ${origin}
📁 Pathname: ${pathname}
🏭 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}

URLs de prueba generadas. Revisa la consola para más detalles.
    `.trim());
    
    console.log('🧪 === FIN TESTING URLS ===');
  };

  // Regenerar QRs para producción
  const regenerateQRsForProduction = async () => {
    console.log('🔄 === REGENERATING QRS FOR PRODUCTION ===');
    
    try {
      // Obtener todos los QRs del usuario actual
      const { data: userQRs, error } = await qrCodeService.getUserQRCodes();
      
      if (error) {
        console.error('❌ Error obteniendo QRs del usuario:', error);
        return;
      }
      
      if (!userQRs || userQRs.length === 0) {
        console.log('⚠️ No hay QRs para regenerar');
        alert('No hay QRs para regenerar');
        return;
      }
      
      console.log(`📊 Total de QRs del usuario: ${userQRs.length}`);
      
      const shouldRegenerate = confirm(
        `Se encontraron ${userQRs.length} QRs. ` +
        `¿Deseas regenerarlos para que funcionen correctamente en producción? ` +
        `Esto creará nuevos QRs con las URLs correctas.`
      );
      
      if (shouldRegenerate) {
        for (const qr of userQRs) {
          console.log(`🔄 Regenerando QR: ${qr.first_name} ${qr.last_name}`);
          
          // Crear nuevo QR con los mismos datos
          const newQRData = {
            first_name: qr.first_name,
            last_name: qr.last_name,
            dni: qr.dni,
            description: qr.description
          };
          
          const { data: newQR, error: createError } = await qrCodeService.createQRCode(newQRData);
          
          if (createError) {
            console.error(`❌ Error creando nuevo QR para ${qr.first_name}:`, createError);
          } else {
            console.log(`✅ Nuevo QR creado: ${newQR?.id}`);
            
            // Eliminar el QR antiguo
            await qrCodeService.deleteQRCode(qr.id);
            console.log(`🗑️ QR antiguo eliminado: ${qr.id}`);
          }
        }
        
        await fetchQRCodes();
        alert('QRs regenerados exitosamente. Los nuevos QRs funcionarán correctamente en producción.');
      }
      
    } catch (error) {
      console.error('❌ Error en regenerateQRsForProduction:', error);
    }
    
    console.log('🔄 === FIN REGENERATING ===');
  };

  // Ejecutar depuración cuando se cargan los QR codes
  useEffect(() => {
    if (qrCodes.length > 0) {
      debugQRCodes();
    }
  }, [qrCodes]);

  // Mostrar información del entorno
  const getEnvironmentInfo = () => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = window.location.origin;
    
    return {
      environment: isDevelopment ? 'Desarrollo' : 'Producción',
      baseUrl,
      isDevelopment
    };
  };

  const envInfo = getEnvironmentInfo();

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
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    envInfo.isDevelopment 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {envInfo.environment}
                  </span>
                  <span className="text-xs text-gray-500">
                    Base URL: {envInfo.baseUrl}
                  </span>
                </div>
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
                  onClick={debugAllQRCodes}
                  className="flex items-center space-x-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Debug All QR</span>
                </button>
                
                <button
                  onClick={testSpecificQR}
                  className="flex items-center space-x-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Probar QR</span>
                </button>
                
                <button
                  onClick={cleanAndRegenerateQRs}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Limpiar QRs</span>
                </button>
                
                <button
                  onClick={checkProblematicQR}
                  className="flex items-center space-x-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Probar QR Problemático</span>
                </button>
                
                <button
                  onClick={checkProductionProblematicQR}
                  className="flex items-center space-x-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Probar QR Problemático de Producción</span>
                </button>
                
                <button
                  onClick={checkDatabaseStructure}
                  className="flex items-center space-x-2 px-4 py-2 border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Verificar Estructura BD</span>
                </button>
                
                <button
                  onClick={clearAllQRCodes}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Limpiar Base de Datos</span>
                </button>
                
                <button
                  onClick={testGeneratedUrls}
                  className="flex items-center space-x-2 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Probar URLs Generadas</span>
                </button>
                
                <button
                  onClick={regenerateQRsForProduction}
                  className="flex items-center space-x-2 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <span>Regenerar QRs para Producción</span>
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