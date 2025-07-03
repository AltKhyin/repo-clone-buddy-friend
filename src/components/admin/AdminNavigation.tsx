// ABOUTME: Navigation component for admin dashboard with module links and role-based visibility

import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, Users, Tags, Layout, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    exact: true,
  },
  {
    label: 'Gestão de Conteúdo',
    href: '/admin/content',
    icon: FileText,
  },
  {
    label: 'Gestão de Usuários',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Gestão de Tags',
    href: '/admin/tags',
    icon: Tags,
  },
  {
    label: 'Gestão de Layout',
    href: '/admin/layout',
    icon: Layout,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    label: 'Controle de Acesso',
    href: '/admin/access-control',
    icon: Shield,
  },
];

export const AdminNavigation = () => {
  return (
    <nav className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground mb-6 tracking-wide uppercase">
        Módulos Administrativos
      </h2>

      {navigationItems.map(item => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-surface-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
