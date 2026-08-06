import { supabase } from './supabase';
import { QRCode, CreateQRCodeData } from '../types';

type DatabaseError = {
  message: string;
  code?: string;
  details?: string;
};

export const authService = {
  async login() {
    return { data: null, error: null };
  },
  async register() {
    return { data: null, error: null };
  },
  async logout() {
    return { error: null };
  },
  async getCurrentUser() {
    return { user: { id: 'public-admin' } as any, error: null };
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

export const qrCodeService = {
  async checkDNIExists(dni: string): Promise<{ exists: boolean; error: DatabaseError | null }> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('dni', dni)
        .limit(1);

      if (error) {
        console.warn('[checkDNIExists] No se pudo verificar DNI (se asume que no existe):', error);
        return { exists: false, error: null };
      }

      return { exists: !!(data && data.length > 0), error: null };
    } catch (err) {
      console.warn('[checkDNIExists] Excepción al verificar DNI:', err);
      return { exists: false, error: null };
    }
  },

  async createQRCode(qrData: CreateQRCodeData): Promise<{ data: QRCode | null; error: any }> {
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
        user_id: '00000000-0000-0000-0000-000000000000',
        ...qrData,
      })
      .select()
      .single();

    return { data, error };
  },

  async getUserQRCodes(category?: string): Promise<{ data: QRCode[] | null; error: any }> {
    let query = supabase
      .from('qr_codes')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data, error };
  },

  async getUserCategories(): Promise<{ data: string[] | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      return { data: null, error };
    }

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
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);

    return { error };
  },

  async updateQRCode(id: string, updates: Partial<CreateQRCodeData>): Promise<{ data: QRCode | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

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

  async getAllQRCodes(): Promise<{ data: QRCode[] | null; error: any }> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async checkDatabaseStructure(): Promise<{ valid: boolean; info: any; error: any }> {
    try {
      console.log('🔍 === CHECKING DATABASE STRUCTURE ===');
      
      const { data: tableInfo, error: tableError } = await supabase
        .from('qr_codes')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Error accediendo a la tabla qr_codes:', tableError);
        return { valid: false, info: null, error: tableError };
      }
      
      console.log('✅ Tabla qr_codes accesible');
      
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