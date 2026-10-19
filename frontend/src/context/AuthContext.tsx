import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import api, { baseURL } from "../api/axiosInstance";
import { readTokens, writeTokens, sessionEvent, Tokens } from "../api/session";

export interface User {
  id: number;
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
}
interface AuthContextType {
  user: User | null;
  authTokens: Tokens | null;
  loading: boolean;
  error: string;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => void;
  retrySession: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export default AuthContext;
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authTokens, setAuthTokens] = useState(readTokens);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const sync = () => {
      const tokens = readTokens();
      setAuthTokens(tokens);
      if (!tokens) setUser(null);
    };
    const storage = () => {
      sync();
      setRetry((value) => value + 1);
    };
    window.addEventListener(sessionEvent, sync);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(sessionEvent, sync);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!readTokens()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api
      .get<User>("/api/me/")
      .then(({ data }) => {
        if (active && readTokens()) setUser(data);
      })
      .catch(() => {
        if (active && readTokens())
          setError("No pudimos verificar tu sesión. Comprueba la conexión.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function loginUser(username: string, password: string) {
    const { data } = await axios.post(
      `${baseURL}/auth/jwt/create/`,
      { username, password },
      { timeout: 15000 },
    );
    writeTokens(data);
    try {
      const response = await api.get<User>("/api/me/");
      setUser(response.data);
      setError("");
    } catch (error) {
      writeTokens(null);
      throw error;
    }
  }
  function logoutUser() {
    writeTokens(null);
    setUser(null);
    setError("");
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        authTokens,
        loading,
        error,
        loginUser,
        logoutUser,
        retrySession: () => setRetry((value) => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
