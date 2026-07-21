import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Monitor, BookOpen, BarChart3,
  Settings, Users, ChevronLeft, ChevronRight, Shield,
  Sun, Moon, Monitor as System
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Chamados' },
  { to: '/assets', icon: Monitor, label: 'Ativos' },
  { to: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento' },
  { to: '/reports', icon: BarChart3, label: 'Relatorios' },
  { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin', 'analyst'] as const },
  { to: '/settings', icon: Settings, label: 'Configuracoes', roles: ['admin'] as const },
  { to: '/audit', icon: Shield, label: 'Auditoria', roles: ['admin'] as const },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!profile) return false;
    return item.roles.includes(profile.role as any);
  });

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-netvision-600 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient">ChamadosTiRaitz</h1>
              <p className="text-xs text-gray-500">HelpDesk</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-netvision-600/20 text-netvision-400 border border-netvision-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {!collapsed && profile && (
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-sm font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {profile.role === 'admin' ? 'Administrador' : profile.role === 'analyst' ? 'Analista de TI' : 'Usuario'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-gray-800">
        {!collapsed && (
          <div className="flex items-center justify-center gap-1 mb-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-netvision-600/20 text-netvision-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
              title="Modo claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'system'
                  ? 'bg-netvision-600/20 text-netvision-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
              title="Sistema"
            >
              <System className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-netvision-600/20 text-netvision-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
              title="Modo escuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 py-2 rounded-lg hover:bg-gray-800/50 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
