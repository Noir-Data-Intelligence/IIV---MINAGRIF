import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, logout as logoutApi } from "@/services/api/auth";
import type { UserDto } from "@/types/dto/user";

interface AuthContext {
  user: UserDto | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Recarrega a sessão a partir do token em localStorage — chamar após login/registo. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const current = await getCurrentUser();
    setUser(current);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
