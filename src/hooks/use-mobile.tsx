
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with proper mobile detection, avoiding undefined state
  const getInitialState = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  };

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialState);

  React.useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Set initial state immediately to prevent race conditions
    updateMobileState();
    
    // Listen for changes with both media query and resize events for better compatibility
    mql.addEventListener("change", updateMobileState);
    window.addEventListener("resize", updateMobileState);
    
    return () => {
      mql.removeEventListener("change", updateMobileState);
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  return isMobile;
}
