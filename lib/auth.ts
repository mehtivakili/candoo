'use client';

export interface AuthUser {
  username: string;
  loginTime: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

export class AuthManager {
  private static instance: AuthManager;
  private token: string | null = null;
  private expiry: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadFromStorage(): void {
    try {
      this.token = localStorage.getItem('authToken');
      const expiryStr = localStorage.getItem('tokenExpiry');
      this.expiry = expiryStr ? parseInt(expiryStr) : null;
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      this.clearAuth();
    }
  }

  private saveToStorage(): void {
    try {
      if (this.token && this.expiry) {
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('tokenExpiry', this.expiry.toString());
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  }

  public setAuth(token: string, expiry: number): void {
    this.token = token;
    this.expiry = expiry;
    this.saveToStorage();
  }

  public clearAuth(): void {
    this.token = null;
    this.expiry = null;
    this.clearStorage();
  }

  public isTokenValid(): boolean {
    if (!this.token || !this.expiry) {
      return false;
    }

    // Check if token is expired
    if (Date.now() >= this.expiry) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  public getToken(): string | null {
    return this.isTokenValid() ? this.token : null;
  }

  public async verifyToken(): Promise<AuthUser | null> {
    if (!this.isTokenValid()) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.user;
      } else {
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  public getAuthState(): AuthState {
    return {
      isAuthenticated: this.isTokenValid(),
      user: null, // Will be populated by verifyToken if needed
      token: this.getToken(),
    };
  }
}

// Hook for React components
export function useAuth() {
  const authManager = AuthManager.getInstance();
  
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        authManager.setAuth(data.token, data.expiry);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'خطا در اتصال به سرور' };
    }
  };

  const logout = async (): Promise<void> => {
    await authManager.logout();
  };

  const isAuthenticated = (): boolean => {
    return authManager.isTokenValid();
  };

  const getToken = (): string | null => {
    return authManager.getToken();
  };

  return {
    login,
    logout,
    isAuthenticated,
    getToken,
  };
}
