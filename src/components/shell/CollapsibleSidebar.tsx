
// ABOUTME: The main sidebar navigation for desktop views with unified navigation structure.
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import NavItem from './NavItem';
import { ProfileMenu } from './ProfileMenu';
import { getNavigationItems } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapsibleSidebar = ({ isCollapsed, onToggle }: CollapsibleSidebarProps) => {
  const { user } = useAuthStore();
  
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
    adminItems: adminItems.length 
  });

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen bg-background border-r border-border transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'} hidden md:flex flex-col`}>
      {/* Header with logo - fixed height to match main header */}
      <div className={`flex items-center border-b border-border h-16 ${isCollapsed ? 'justify-center px-2' : 'justify-center px-4'}`}>
        {!isCollapsed ? (
          <h1 className="font-serif font-medium tracking-tight text-3xl text-foreground">
            Reviews.
          </h1>
        ) : (
          <h1 className="font-serif font-medium tracking-tight text-3xl text-foreground">
            R.
          </h1>
        )}
      </div>

      {/* Navigation items */}
      <nav className={`flex-1 space-y-2 ${isCollapsed ? 'px-2 py-4' : 'px-4 py-4'}`}>
        {/* Core navigation */}
        {coreItems.map((item) => (
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
            {adminItems.map((item) => (
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

      {/* Profile menu at bottom */}
      <div className={`border-t border-border ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <ProfileMenu isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default CollapsibleSidebar;
