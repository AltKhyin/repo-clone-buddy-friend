
// ABOUTME: Navigation component for admin dashboard with module links and role-based visibility

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3,
  FileText,
  Users,
  Tags,
  Layout,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    exact: true
  },
  {
    label: 'Gestão de Conteúdo',
    href: '/admin/content',
    icon: FileText
  },
  {
    label: 'Gestão de Usuários',
    href: '/admin/users',
    icon: Users
  },
  {
    label: 'Gestão de Tags',
    href: '/admin/tags',
    icon: Tags
  },
  {
    label: 'Gestão de Layout',
    href: '/admin/layout',
    icon: Layout
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp
  },
];

export const AdminNavigation = () => {
  return (
    <nav className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">
        Módulos Administrativos
      </h2>
      
      {navigationItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};
