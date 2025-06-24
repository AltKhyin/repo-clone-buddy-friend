
// ABOUTME: A reusable navigation item for sidebars and tab bars.
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type NavItemProps = {
  href: string;
  icon: React.ElementType;
  label: string;
  isCollapsed?: boolean;
  isMobile?: boolean;
};

const NavItem = ({ href, icon: Icon, label, isCollapsed = false, isMobile = false }: NavItemProps) => {
  const linkContent = (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted',
          isActive
            ? isMobile
              ? 'text-primary'
              : 'bg-muted text-foreground'
            : 'text-foreground hover:text-foreground',
          { 'justify-center': isCollapsed }
        )
      }
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </NavLink>
  );

  // Don't use tooltips when collapsed - just return the link directly
  if (isCollapsed) {
    return linkContent;
  }

  // Only show tooltips when expanded (which is redundant, so we'll skip it entirely)
  return linkContent;
};

export default NavItem;
