import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

// The structure of the user object we'll use in our app
export interface AppUser {
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: AppUser | null;
  login: () => void;
  logout: () => void;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Function to transform Netlify user to our AppUser
    const mapToAppUser = (netlifyUser: netlifyIdentity.User | null): AppUser | null => {
      if (!netlifyUser) return null;
      return {
        email: netlifyUser.email || '',
        roles: netlifyUser.app_metadata?.roles || [],
      };
    };

    // Initialize Netlify Identity
    netlifyIdentity.init();

    // Event listener for login
    const handleLogin = (user: netlifyIdentity.User) => {
      setUser(mapToAppUser(user));
      netlifyIdentity.close();
    };
    netlifyIdentity.on('login', handleLogin);

    // Event listener for logout
    const handleLogout = () => {
      setUser(null);
    };
    netlifyIdentity.on('logout', handleLogout);

    // Check for logged-in user on initial load
    const handleInit = (user: netlifyIdentity.User | null) => {
      setUser(mapToAppUser(user));
      setAuthReady(true);
    };
    netlifyIdentity.on('init', handleInit);

    // Cleanup listeners on unmount
    return () => {
      netlifyIdentity.off('login', handleLogin);
      netlifyIdentity.off('logout', handleLogout);
      netlifyIdentity.off('init', handleInit);
    };
  }, []);

  const login = () => {
    netlifyIdentity.open('login');
  };

  const logout = () => {
    netlifyIdentity.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
