import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { useEffect } from 'react';
import client from '../../api/client';

const ProtectedRoute = () => {
    const { isAuthenticated, isAuthChecked, setAuth, clearAuth, setAuthChecked } = useAuth();

    useEffect(() => {
        if (isAuthChecked) return;

        let active = true;
        client.get('/auth/me')
            .then((response) => {
                if (!active) return;
                setAuth(response.data);
            })
            .catch(() => {
                if (!active) return;
                clearAuth();
            })
            .finally(() => {
                if (!active) return;
                setAuthChecked(true);
            });

        return () => {
            active = false;
        };
    }, [clearAuth, isAuthChecked, setAuth, setAuthChecked]);

    if (!isAuthChecked) {
        return <div className="min-h-screen bg-slate-950" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
