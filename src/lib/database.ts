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

  async getUserQRCodes(): Promise<{ data: QRCode[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
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
  }
}; 