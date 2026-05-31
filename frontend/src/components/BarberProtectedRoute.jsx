import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useBarberAuth } from '../context/BarberAuthContext';

const BarberProtectedRoute = () => {
  const { token, loading } = useBarberAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return token ? <Outlet /> : <Navigate to="/barber/login" replace />;
};

export default BarberProtectedRoute;
