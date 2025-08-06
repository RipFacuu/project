export interface QRCode {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  dni: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
}

export interface CreateQRCodeData {
  first_name: string;
  last_name: string;
  dni: string;
  description?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}