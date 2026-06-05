import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BarberAuthProvider } from './context/BarberAuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BarberProtectedRoute from './components/BarberProtectedRoute';
import BarberLayout from './components/BarberLayout';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import BarberLogin from './pages/BarberLogin';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Appointments from './pages/Appointments';
import Barbers from './pages/Barbers';
import WhatsApp from './pages/WhatsApp';
import BarberAgenda from './pages/BarberAgenda';
import BarberClients from './pages/BarberClients';
import BarberDashboard from './pages/BarberDashboard';
import BarberProfile from './pages/BarberProfile';
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BarberAuthProvider>
          <Router>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/barber/login" element={<BarberLogin />} />

              {/* Rotas protegidas do Administrador */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="barbers" element={<Barbers />} />
                  <Route path="whatsapp" element={<WhatsApp />} />
                  <Route path="settings" element={<div className="p-8"><h1 className="text-2xl text-dark-900 dark:text-white">Configurações em breve...</h1></div>} />
                </Route>
              </Route>

              {/* Rotas protegidas do Barbeiro */}
              <Route element={<BarberProtectedRoute />}>
                <Route path="/barber" element={<BarberLayout />}>
                  <Route index element={<BarberAgenda />} />
                  <Route path="clients" element={<BarberClients />} />
                  <Route path="dashboard" element={<BarberDashboard />} />
                  <Route path="profile" element={<BarberProfile />} />
                </Route>
              </Route>
            </Routes>
          </Router>

          {/* Toast global — disponível em toda a aplicação */}
          <ToastContainer />
        </BarberAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
