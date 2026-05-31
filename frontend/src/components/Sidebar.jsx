import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  Settings,
  LogOut,
  Scissors,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard',     icon: <LayoutDashboard size={20} />, path: '/' },
  { name: 'Clientes',      icon: <Users size={20} />,           path: '/clients' },
  { name: 'Agendamentos',  icon: <Calendar size={20} />,        path: '/appointments' },
  { name: 'Equipe',        icon: <Scissors size={20} />,        path: '/barbers' },
  { name: 'WhatsApp',      icon: <MessageCircle size={20} />,   path: '/whatsapp' },
  { name: 'Configurações', icon: <Settings size={20} />,        path: '/settings' },
];

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen
        bg-white dark:bg-dark-900
        border-r border-dark-200 dark:border-dark-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:z-auto
      `}
      aria-label="Menu de navegação"
    >
      {/* Logo + botão fechar (mobile) */}
      <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-dark-200 dark:border-dark-800 shrink-0">
        <div className="flex items-center gap-3 text-primary-600 dark:text-primary-500">
          <Scissors size={24} />
          <h1 className="text-lg md:text-xl font-bold text-dark-900 dark:text-white tracking-wider">
            BARBER<span className="text-primary-500">CRM</span>
          </h1>
        </div>
        {/* Botão fechar — só no mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-xl text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Itens de navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 hover:text-dark-900 dark:hover:text-dark-100'
              }`
            }
          >
            {item.icon}
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Rodapé — Sair */}
      <div className="p-3 border-t border-dark-200 dark:border-dark-800 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full min-h-[48px] rounded-xl text-dark-500 dark:text-dark-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut size={20} />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

