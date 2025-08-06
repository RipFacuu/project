import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, QrCode, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoginData, RegisterData } from '../types';

const Login: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const credentials: LoginData | RegisterData = { email, password };
    
    if (isLogin) {
      const { error } = await signIn(credentials as LoginData);
      if (error) {
        setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
      }
    } else {
      const { error } = await signUp(credentials as RegisterData);
      if (error) {
        setError('Error al crear la cuenta. Verifica que el email no esté en uso.');
      } else {
        setError('Cuenta creada exitosamente. Revisa tu email para confirmar.');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-orange-500 p-4 rounded-2xl">
            <QrCode className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Panel de Administración
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? 'Inicia sesión para gestionar códigos QR' : 'Crea una cuenta para comenzar'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg border border-gray-200 sm:px-10">
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isLogin
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200 ${
                !isLogin
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                error.includes('exitosamente') 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-orange-500 py-2 px-4 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {isLogin ? (
                    <LogIn className="h-5 w-5 text-orange-200 group-hover:text-orange-100" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-orange-200 group-hover:text-orange-100" />
                  )}
                </span>
                {isLoading 
                  ? (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...') 
                  : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                }
              </button>
            </div>
          </form>

          {/* Link to public scanner */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                ¿Solo quieres escanear un código QR?
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Ir al Escáner Público →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;