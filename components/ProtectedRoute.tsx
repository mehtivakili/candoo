'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthManager } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const authManager = AuthManager.getInstance();
      
      if (!authManager.isTokenValid()) {
        // Redirect to login with current path as redirect parameter
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
        return;
      }

      // Verify token with server
      const user = await authManager.verifyToken();
      
      if (!user) {
        // Token is invalid, redirect to login
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بررسی احراز هویت...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

