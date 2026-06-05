import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';

// Mapa de rotas para títulos legíveis
const PAGE_TITLES = {
  '/admin':             'Dashboard',
  '/admin/clients':      'Clientes',
  '/admin/appointments': 'Agendamentos',
  '/admin/whatsapp':     'WhatsApp',
  '/admin/settings':     'Configurações',
  '/admin/barbers':      'Equipe',
};

/**
 * @param {{ onMenuClick: () => void }} props
 */
const Topbar = ({ onMenuClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'BarberCRM';

  return (
    <header className="h-14 md:h-20 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-dark-200 dark:border-dark-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors duration-200 shrink-0">

      {/* ---- MOBILE: botão hamburger + título ---- */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-base font-bold text-dark-900 dark:text-white">{pageTitle}</span>
      </div>

      {/* ---- DESKTOP: campo de busca ---- */}
      <div className="hidden md:block relative w-96">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar clientes, agendamentos..."
          className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 transition-all"
        />
      </div>

      {/* ---- Ações (ambos) ---- */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-800 transition-colors"
          aria-label="Alternar tema"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notificações — REAL */}
        <NotificationsDropdown />

        {/* Separador — só desktop */}
        <div className="hidden md:block h-8 w-px bg-dark-200 dark:bg-dark-700" />

        {/* Avatar / Perfil — REAL */}
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default Topbar;

