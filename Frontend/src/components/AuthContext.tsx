// src/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

type User = {
  id: string;
  name?: string;
  email?: string;
  picture?: string | null;
  // extend with other safe public fields if needed
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => undefined,
  logout: async () => undefined,
  refreshUser: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMe = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setUser(null);
        return null;
      }

      const data = await res.json();
      const u = data?.user ?? null;
      setUser(u);
      return u;
    } catch (err) {
      console.error("fetchMe error", err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Login failed");
      }

      // cookie set by backend — refresh
      await fetchMe();
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout error", err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const u = await fetchMe();
      return u;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
