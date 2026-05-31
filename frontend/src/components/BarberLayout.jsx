import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Users, BarChart3, LogOut, Scissors } from 'lucide-react';
import { useBarberAuth } from '../context/BarberAuthContext';

const BarberLayout = () => {
  const { barber, logout } = useBarberAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/barber/login', { replace: true });
  };

  const navItems = [
    { name: 'Agenda', icon: <Calendar size={22} />, path: '/barber' },
    { name: 'Clientes', icon: <Users size={22} />, path: '/barber/clients' },
    { name: 'Desempenho', icon: <BarChart3 size={22} />, path: '/barber/dashboard' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-dark-950 text-white font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-2">
          <Scissors size={20} className="text-primary-500" />
          <span className="font-bold text-sm tracking-wider">BARBER<span className="text-primary-550 text-primary-500 font-extrabold">APP</span></span>
        </div>
        
        <div className="flex items-center gap-3.5">
          {barber && (
            <div className="text-right">
              <p className="text-xs font-semibold text-white leading-tight">{barber.name}</p>
              <p className="text-[10px] text-dark-400">Barbeiro</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-xl transition-all active:scale-90"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content scrollable panel */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        <div className="max-w-md mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav Bar (sticky on bottom for mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-lg border-t border-dark-800/80 py-2.5 px-6 flex justify-around items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/barber'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 transition-all duration-200 ${
                isActive
                  ? 'text-primary-400 scale-105 font-semibold'
                  : 'text-dark-450 text-dark-500 hover:text-dark-200'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] tracking-wide">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BarberLayout;
