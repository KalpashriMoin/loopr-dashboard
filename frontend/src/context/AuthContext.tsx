import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, getErrorMessage } from "../api/axios";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("loopr_token"));
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("loopr_token");
    setToken(null);
    setUser(null);
  };

  // Rehydrate session on refresh by validating the stored token against /auth/me
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to global 401 events fired by the axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("loopr:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("loopr:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user: loggedInUser, token: newToken } = res.data.data;
      localStorage.setItem("loopr_token", newToken);
      setToken(newToken);
      setUser(loggedInUser);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
