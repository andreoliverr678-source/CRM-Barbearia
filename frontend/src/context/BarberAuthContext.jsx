import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const BarberAuthContext = createContext(null);

export const BarberAuthProvider = ({ children }) => {
  const [barber, setBarber] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('barber_app_token'));
  const [loading, setLoading] = useState(true);

  // Valida token ao carregar o app do barbeiro
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          // Define token nos headers provisoriamente se não tiver interceptor global ativo para barber
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const res = await api.get('/auth/barber/me');
          setBarber(res.data);
        } catch (err) {
          console.error('[BARBER AUTH] Token inválido ou expirado:', err.message);
          localStorage.removeItem('barber_app_token');
          setToken(null);
          setBarber(null);
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/barber/login', { email, password });
    const { token: newToken, user: newBarber } = res.data;
    localStorage.setItem('barber_app_token', newToken);
    setToken(newToken);
    setBarber(newBarber);
    // Atualiza headers
    api.defaults.headers.Authorization = `Bearer ${newToken}`;
    return newBarber;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('barber_app_token');
    setToken(null);
    setBarber(null);
    delete api.defaults.headers.Authorization;
  }, []);

  const updateBarberState = useCallback((updatedBarber) => {
    setBarber((prev) => ({ ...prev, ...updatedBarber }));
  }, []);

  return (
    <BarberAuthContext.Provider value={{ barber, token, login, logout, updateBarberState, loading }}>
      {children}
    </BarberAuthContext.Provider>
  );
};

export const useBarberAuth = () => {
  const ctx = useContext(BarberAuthContext);
  if (!ctx) throw new Error('useBarberAuth deve ser usado dentro de BarberAuthProvider');
  return ctx;
};
