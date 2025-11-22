import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { CreateQRCodeData } from '../types';
import { qrCodeService } from '../lib/database';

interface BulkUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CreateQRCodeData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [results, setResults] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const parseCSV = (csvText: string): CreateQRCodeData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Obtener encabezados (primera línea)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Buscar índices de columnas (flexible)
    const nameIndex = headers.findIndex(h => h.includes('nombre') || h.includes('name') || h === 'n');
    const lastNameIndex = headers.findIndex(h => h.includes('apellido') || h.includes('lastname') || h.includes('last') || h === 'a');
    const dniIndex = headers.findIndex(h => h === 'dni' || h.includes('dni') || h.includes('documento'));
    const descIndex = headers.findIndex(h => h.includes('descripcion') || h.includes('description') || h.includes('desc'));
    const categoryIndex = headers.findIndex(h => h.includes('categoria') || h.includes('category') || h.includes('carpeta') || h.includes('folder'));

    // Si no hay encabezados, asumir formato: nombre,apellido,dni,descripcion
    const startIndex = nameIndex >= 0 ? 1 : 0;

    const data: CreateQRCodeData[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const firstName = nameIndex >= 0 ? values[nameIndex] : values[0];
      const lastName = lastNameIndex >= 0 ? values[lastNameIndex] : values[1];
      const dni = dniIndex >= 0 ? values[dniIndex] : values[2];
      const description = descIndex >= 0 ? values[descIndex] : (values[3] || '');
      const itemCategory = categoryIndex >= 0 ? values[categoryIndex] : '';

      if (firstName && lastName && dni) {
        data.push({
          first_name: firstName,
          last_name: lastName,
          dni: dni,
          description: description || undefined,
          category: itemCategory || undefined
        });
      }
    }

    return data;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Por favor, selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleUpload = async () => {
    if (preview.length === 0) {
      alert('No hay datos válidos para subir');
      return;
    }

    setUploading(true);
    setResults(null);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of preview) {
      // Aplicar categoría global si está definida y el item no tiene categoría
      const itemWithCategory = category && !item.category 
        ? { ...item, category: category.trim() || undefined }
        : item;
      try {
        // Verificar si el DNI ya existe
        const { exists, error: checkError } = await qrCodeService.checkDNIExists(itemWithCategory.dni);
        
        // Si hay error al verificar, continuar con la creación (la función createQRCode también verifica)
        if (checkError && checkError.message !== 'User not authenticated') {
          console.warn(`Error verificando DNI ${itemWithCategory.dni}:`, checkError);
          // Continuar con la creación, createQRCode también verificará
        }
        
        if (exists) {
          skipped++;
          console.log(`DNI ${itemWithCategory.dni} ya existe, omitiendo...`);
          continue;
        }

        const { data, error } = await qrCodeService.createQRCode(itemWithCategory);
        if (error) {
          const errorMessage = error.message || 'Error desconocido';
          
          // Si el error es que el DNI ya existe, debería contarse como omitido, no como error
          if (errorMessage.includes('Ya existe') || errorMessage.includes('DNI')) {
            skipped++;
            console.log(`DNI ${itemWithCategory.dni} ya existe (verificado en createQRCode), omitiendo...`);
          } else {
            errors.push(`${item.first_name} ${item.last_name} (DNI: ${item.dni}): ${errorMessage}`);
            console.error(`Error creando QR para ${item.first_name} ${item.last_name}:`, error);
          }
        } else if (data) {
          created++;
          console.log(`✓ Creado QR para ${item.first_name} ${item.last_name} (DNI: ${item.dni})`);
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Error inesperado al crear';
        errors.push(`${item.first_name} ${item.last_name} (DNI: ${item.dni}): ${errorMessage}`);
        console.error(`Error inesperado creando QR para ${item.first_name} ${item.last_name}:`, error);
      }
    }

    setResults({ created, skipped, errors });
    setUploading(false);

    if (errors.length === 0 && skipped === 0) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Carga Masiva desde CSV</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="bg-orange-100 p-4 rounded-full">
                <Upload className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">Haz clic para seleccionar un archivo CSV</p>
                <p className="text-sm text-gray-500 mt-1">o arrastra el archivo aquí</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md w-full">
                <p className="text-xs font-medium text-gray-700 mb-2">Formato del CSV:</p>
                <code className="text-xs text-gray-600 block">
                  nombre,apellido,dni,descripcion,categoria<br/>
                  Juan,Pérez,12345678,Club las Palmas - Listado Profes y Staff,Club las Palmas<br/>
                  María,González,87654321,Club las Palmas - Listado Profes y Staff,Club las Palmas<br/>
                  <br/>
                  Nota: La columna "categoria" es opcional. También puedes asignar una categoría global al subir.
                </code>
              </div>
            </label>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{preview.length} registros encontrados</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setResults(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {preview.length > 0 && !results && (
              <>
                <div>
                  <label htmlFor="bulk-category" className="block text-sm font-medium text-gray-700 mb-2">
                    Carpeta/Categoría (opcional - se aplicará a todos los registros si el CSV no tiene columna de categoría)
                  </label>
                  <input
                    type="text"
                    id="bulk-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: Club las Palmas, Escuela de Fútbol, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si el CSV tiene una columna "categoria" o "category", se usará esa. Si no, se aplicará esta categoría a todos.
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700">Nombre</th>
                        <th className="px-4 py-2 text-left text-gray-700">Apellido</th>
                        <th className="px-4 py-2 text-left text-gray-700">DNI</th>
                        <th className="px-4 py-2 text-left text-gray-700">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-2">{item.first_name}</td>
                          <td className="px-4 py-2">{item.last_name}</td>
                          <td className="px-4 py-2">{item.dni}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{item.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 10 && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      ... y {preview.length - 10} más
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors duration-200"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Subir {preview.length} registros</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {results && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  results.created > 0 && results.errors.length === 0
                    ? 'bg-green-50 border border-green-200' 
                    : results.skipped > 0 && results.created === 0 && results.errors.length === 0
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {results.created > 0 && results.errors.length === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : results.skipped > 0 && results.created === 0 && results.errors.length === 0 ? (
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Creados: {results.created}, Omitidos: {results.skipped}
                      </p>
                      {results.skipped > 0 && results.created === 0 && results.errors.length === 0 && (
                        <p className="text-sm text-blue-700 mt-2">
                          ⚠️ Todos los registros fueron omitidos porque ya existen en la base de datos. Los DNIs ingresados ya tienen códigos QR asociados.
                        </p>
                      )}
                      {results.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 mb-1">Errores ({results.errors.length}):</p>
                          <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                            {results.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {results.errors.length > 5 && (
                              <li>... y {results.errors.length - 5} más</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onComplete}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;

