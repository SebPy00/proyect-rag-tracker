import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Definimos las estructuras de datos ---
interface AuthToken {
  access: string;
  refresh: string;
}

interface User {
  user_id: number;
  username: string; 
  // Puedes añadir más campos que decidas incluir en el payload de tu token JWT
}

// --- Definimos lo que nuestro contexto va a proveer ---
interface AuthContextType {
  user: User | null;
  authTokens: AuthToken | null;
  loginUser: (e: React.FormEvent) => Promise<void>;
  logoutUser: () => void;
}

// --- Creamos el Contexto ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;

// --- Creamos el "Proveedor" del Contexto ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Estado para los tokens, inicializado desde localStorage para persistir la sesión
  const [authTokens, setAuthTokens] = useState<AuthToken | null>(() => 
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!) : null
  );
  
  // Estado para el usuario, decodificado desde el token en localStorage
  const [user, setUser] = useState<User | null>(() => 
    localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')!).access) : null
  );
  
  const navigate = useNavigate();

  // Función para iniciar sesión
  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
        username: { value: string };
        password: { value: string };
    };
    const username = target.username.value;
    const password = target.password.value;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/jwt/create/`, {
        username,
        password,
      });

      const data: AuthToken = response.data;
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
      localStorage.setItem('authTokens', JSON.stringify(data));
      navigate('/'); // Redirige a la página principal después del login
    } catch (error) {
      console.error('Error al iniciar sesión!', error);
      alert('Usuario o contraseña incorrectos.');
    }
  };

  // Función para cerrar sesión
  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    window.location.href = '/login'; 
};

  // Datos que serán accesibles para todos los componentes hijos
  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
  };

  // Aquí se podría añadir lógica para refrescar el token si expira
  
  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};