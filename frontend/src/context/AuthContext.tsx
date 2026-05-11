import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../services/firebase";

interface AuthContextType {
  user: import("firebase/auth").User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const [user, setUser] = useState<import("firebase/auth").User | null>(currentUser);

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  const value: AuthContextType = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
