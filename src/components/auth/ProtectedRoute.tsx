import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  const getLocalUser = () => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return (parsed?.id || parsed?.email) ? parsed : null;
    } catch {
      return null;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const user = getLocalUser();
    return user ? true : false;
  });

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const localUser = getLocalUser();
      if (!localUser) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          // Token is revoked or invalid: clear local state and mark unauthenticated
          localStorage.removeItem('user');
          localStorage.removeItem('email_accounts');
          localStorage.removeItem('campaigns');
          if (isMounted) setIsAuthenticated(false);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || (!data.id && !data.email)) {
          localStorage.removeItem('user');
          if (isMounted) setIsAuthenticated(false);
          return;
        }
        if (isMounted) setIsAuthenticated(true);
      } catch {
        // If offline / network error, retain local state if present
        if (isMounted) {
          setIsAuthenticated(!!getLocalUser());
        }
      }
    };

    checkSession();

    // BFCache defense: when user navigates back to protected page via browser Back button
    const handlePageShow = () => {
      const localUser = getLocalUser();
      if (!localUser) {
        if (isMounted) setIsAuthenticated(false);
      } else {
        checkSession();
      }
    };

    // Popstate defense: handle history traversal
    const handlePopState = () => {
      const localUser = getLocalUser();
      if (!localUser) {
        if (isMounted) setIsAuthenticated(false);
      } else {
        checkSession();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  if (isAuthenticated === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06110c] text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono tracking-wider">Verifying session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
