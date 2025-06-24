
// ABOUTME: Mobile bottom navigation with unified navigation structure.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavigationItems } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';

const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  
  // Get unified navigation items for mobile context
  const userRole = session?.user?.app_metadata?.role || 'practitioner';
  const visibleItems = getNavigationItems('mobile', userRole);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex">
        {visibleItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors min-h-[44px] ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{tab.mobileLabel ?? tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;
