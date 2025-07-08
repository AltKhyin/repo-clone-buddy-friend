// ABOUTME: The main sidebar navigation for desktop views with unified navigation structure.
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import NavItem from './NavItem';
import { UserProfileBlock } from './UserProfileBlock';
import { getNavigationItems } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapsibleSidebar = ({ isCollapsed, onToggle }: CollapsibleSidebarProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  // Get unified navigation items for desktop context
  const userRole = user?.app_metadata?.role || 'practitioner';
  const allDesktopItems = getNavigationItems('desktop', userRole);

  // Separate core items from admin items for visual grouping
  const coreItems = allDesktopItems.filter(item => !item.requiredRoles?.length);
  const adminItems = allDesktopItems.filter(item => item.requiredRoles?.length);

  console.log('CollapsibleSidebar state:', {
    userRole,
    totalItems: allDesktopItems.length,
    coreItems: coreItems.length,
    adminItems: adminItems.length,
  });

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-background border-r border-border transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'} hidden md:flex flex-col`}
    >
      {/* Navigation items - logo moved to header */}
      <nav className={`flex-1 space-y-2 ${isCollapsed ? 'px-2 py-4' : 'px-4 py-4'}`}>
        {/* Core navigation */}
        {coreItems.map(item => (
          <NavItem
            key={item.path}
            href={item.path}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
          />
        ))}

        {/* Admin navigation - show separator if items exist */}
        {adminItems.length > 0 && (
          <>
            <div className="border-t border-border my-4" />
            {adminItems.map(item => (
              <NavItem
                key={item.path}
                href={item.path}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* Collapse button */}
      <div className={`pb-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-end'}`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Profile block at bottom - clickable to navigate to /perfil */}
      <div
        className={`border-t border-border cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${isCollapsed ? 'p-2' : 'p-4'}`}
        onClick={handleProfileClick}
      >
        <UserProfileBlock isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default CollapsibleSidebar;
