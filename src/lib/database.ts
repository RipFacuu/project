import { supabase } from './supabase';
import { QRCode, CreateQRCodeData, LoginData, RegisterData } from '../types';

type DatabaseError = {
  message: string;
  code?: string;
  details?: string;
};

// Auth functions
export const authService = {
  async login({ email, password }: LoginData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async register({ email, password }: RegisterData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// QR Code functions
export const qrCodeService = {
  async checkDNIExists(dni: string): Promise<{ exists: boolean; error: DatabaseError | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { exists: false, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('dni', dni)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  },

  async createQRCode(qrData: CreateQRCodeData): Promise<{ data: QRCode | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Check if DNI already exists for this user
    const { exists, error: checkError } = await this.checkDNIExists(qrData.dni);
    if (checkError) {
      return { data: null, error: checkError };
    }
    if (exists) {
      return { data: null, error: { message: 'Ya existe un código QR con este DNI' } };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: user.id,
        ...qrData,
      })
      .select()
      .single();

    return { data, error };
  },

  async getUserQRCodes(category?: string): Promise<{ data: QRCode[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data, error };
  },

  async getUserCategories(): Promise<{ data: string[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .select('category')
      .eq('user_id', user.id)
      .not('category', 'is', null);

    if (error) {
      return { data: null, error };
    }

    // Obtener categorías únicas
    const categories = Array.from(new Set(data?.map(item => item.category).filter(Boolean) || [])) as string[];
    
    return { data: categories.sort(), error: null };
  },

  async getQRCodeById(id: string): Promise<{ data: QRCode | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async deleteQRCode(id: string): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return { error };
  },

  async updateQRCode(id: string, updates: Partial<CreateQRCodeData>): Promise<{ data: QRCode | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    return { data, error };
  },

  // Función de depuración para verificar si un QR existe
  async debugQRCode(id: string): Promise<{ exists: boolean; data: QRCode | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, data: null, error: null };
      }
      return { exists: false, data: null, error };
    }

    return { exists: true, data, error: null };
  },

  // Función para obtener todos los QRs (solo para administración)
  async getAllQRCodes(): Promise<{ data: QRCode[] | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Función para verificar la estructura de la base de datos
  async checkDatabaseStructure(): Promise<{ valid: boolean; info: any; error: any }> {
    try {
      console.log('🔍 === CHECKING DATABASE STRUCTURE ===');
      
      // Verificar si la tabla existe
      const { data: tableInfo, error: tableError } = await supabase
        .from('qr_codes')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Error accediendo a la tabla qr_codes:', tableError);
        return { valid: false, info: null, error: tableError };
      }
      
      console.log('✅ Tabla qr_codes accesible');
      
      // Obtener información sobre los IDs
      const { data: allQRs, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (qrError) {
        console.error('❌ Error obteniendo QRs:', qrError);
        return { valid: false, info: null, error: qrError };
      }
      
      const idPatterns = allQRs?.map(qr => ({
        id: qr.id,
        pattern: qr.id.includes('::') ? 'supabase_uuid' : 'simple_uuid',
        length: qr.id.length
      })) || [];
      
      console.log('📊 Patrones de ID encontrados:', idPatterns);
      
      return { 
        valid: true, 
        info: { 
          totalQRs: allQRs?.length || 0,
          idPatterns,
          sampleIds: allQRs?.map(qr => qr.id) || []
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('❌ Error en checkDatabaseStructure:', error);
      return { valid: false, info: null, error };
    }
  }
}; 