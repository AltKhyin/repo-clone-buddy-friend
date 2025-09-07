// ABOUTME: Automated subscription access control system for feature gating and user experience
import { useSubscriptionStatus } from './mutations/useSubscriptionMutations'
import { toast } from 'sonner'

// =================================================================
// Access Level Definitions
// =================================================================

export type AccessLevel = 'public' | 'free' | 'premium' | 'enterprise'

export interface SubscriptionGate {
  level: AccessLevel
  feature: string
  redirectTo?: string
  showUpgradePrompt?: boolean
}

// =================================================================
// Feature Access Definitions
// =================================================================

export const FEATURE_ACCESS: Record<string, AccessLevel> = {
  // Public features (no login required)
  'homepage': 'public',
  'login': 'public',
  'register': 'public',
  
  // Free tier features (login required)
  'acervo': 'free',
  'community': 'free',
  'profile': 'free',
  'basic-reviews': 'free',
  
  // Premium features
  'premium-content': 'premium',
  'advanced-search': 'premium',
  'export-reviews': 'premium',
  'priority-support': 'premium',
  'custom-themes': 'premium',
  
  // Enterprise features
  'admin-dashboard': 'enterprise',
  'analytics': 'enterprise',
  'user-management': 'enterprise',
  'api-access': 'enterprise'
}

// =================================================================
// Main Access Control Hook
// =================================================================

export const useSubscriptionAccess = () => {
  const { data: subscriptionStatus, isLoading } = useSubscriptionStatus()

  // Determine user's current access level
  const getUserAccessLevel = (): AccessLevel => {
    if (!subscriptionStatus) return 'public'
    
    if (!subscriptionStatus.isSubscribed) return 'free'
    
    if (subscriptionStatus.subscriptionTier === 'enterprise') return 'enterprise'
    if (subscriptionStatus.subscriptionTier === 'premium' || subscriptionStatus.isPremium) return 'premium'
    
    return 'free'
  }

  const currentAccessLevel = getUserAccessLevel()

  // Check if user has access to a specific feature
  const hasFeatureAccess = (feature: string): boolean => {
    const requiredLevel = FEATURE_ACCESS[feature] || 'premium' // Default to premium if not defined
    return hasAccessLevel(requiredLevel)
  }

  // Check if user has specific access level
  const hasAccessLevel = (requiredLevel: AccessLevel): boolean => {
    const levels: AccessLevel[] = ['public', 'free', 'premium', 'enterprise']
    const currentIndex = levels.indexOf(currentAccessLevel)
    const requiredIndex = levels.indexOf(requiredLevel)
    return currentIndex >= requiredIndex
  }

  // Get upgrade requirements for a feature
  const getUpgradeRequired = (feature: string) => {
    const requiredLevel = FEATURE_ACCESS[feature] || 'premium'
    const hasAccess = hasFeatureAccess(feature)
    
    if (hasAccess) return null
    
    return {
      current: currentAccessLevel,
      required: requiredLevel,
      feature,
      canUpgrade: currentAccessLevel !== 'enterprise'
    }
  }

  // Show upgrade prompt with contextual messaging
  const showUpgradePrompt = (feature: string, customMessage?: string) => {
    const upgrade = getUpgradeRequired(feature)
    
    if (!upgrade) return
    
    const messages = {
      premium: 'Upgrade to Premium to access this feature',
      enterprise: 'Enterprise subscription required for this feature'
    }
    
    const message = customMessage || messages[upgrade.required as keyof typeof messages] || 'Subscription upgrade required'
    
    toast.error(message, {
      description: `Current plan: ${upgrade.current} • Required: ${upgrade.required}`,
      action: {
        label: 'Upgrade',
        onClick: () => {
          // TODO: Navigate to subscription page
          console.log('Navigate to subscription upgrade')
        }
      }
    })
  }

  return {
    // Access status
    currentAccessLevel,
    isLoading,
    subscriptionStatus,
    
    // Access checking
    hasFeatureAccess,
    hasAccessLevel,
    getUpgradeRequired,
    
    // User experience
    showUpgradePrompt,
    
    // Quick access checks
    isPublic: currentAccessLevel === 'public',
    isFree: currentAccessLevel === 'free',
    isPremium: currentAccessLevel === 'premium',
    isEnterprise: currentAccessLevel === 'enterprise',
    
    // Subscription state helpers
    isActive: subscriptionStatus?.isActive || false,
    isTrialing: subscriptionStatus?.isTrialing || false,
    isPastDue: subscriptionStatus?.isPastDue || false,
    needsPayment: subscriptionStatus?.isPastDue || subscriptionStatus?.isSuspended || false,
    
    // Feature-specific helpers
    canAccessPremiumContent: hasFeatureAccess('premium-content'),
    canAccessAnalytics: hasFeatureAccess('analytics'),
    canManageUsers: hasFeatureAccess('user-management'),
    canExportData: hasFeatureAccess('export-reviews')
  }
}

// =================================================================
// Route Protection Component
// =================================================================

interface SubscriptionGateProps {
  feature: string
  level?: AccessLevel
  fallbackComponent?: React.ComponentType
  redirectTo?: string
  showUpgradePrompt?: boolean
  children: React.ReactNode
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  feature,
  level,
  fallbackComponent: FallbackComponent,
  redirectTo,
  showUpgradePrompt = true,
  children
}) => {
  const { hasFeatureAccess, showUpgradePrompt: showPrompt, isLoading } = useSubscriptionAccess()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-black rounded-full"></div>
      </div>
    )
  }

  // Check access
  const hasAccess = level ? useSubscriptionAccess().hasAccessLevel(level) : hasFeatureAccess(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  // Show upgrade prompt if enabled
  if (showUpgradePrompt) {
    showPrompt(feature)
  }

  // Show fallback component
  if (FallbackComponent) {
    return <FallbackComponent />
  }

  // Default access denied component
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Subscription Required
      </h3>
      <p className="text-gray-600 mb-4">
        This feature requires a premium subscription to access.
      </p>
      <button 
        onClick={() => showPrompt(feature)}
        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
      >
        Upgrade Now
      </button>
    </div>
  )
}

// =================================================================
// Utility Functions
// =================================================================

export const requiresSubscription = (feature: string): boolean => {
  const requiredLevel = FEATURE_ACCESS[feature]
  return requiredLevel === 'premium' || requiredLevel === 'enterprise'
}

export const getFeatureRequirement = (feature: string): AccessLevel => {
  return FEATURE_ACCESS[feature] || 'premium'
}

// =================================================================
// HOC for Route Protection
// =================================================================

export const withSubscriptionAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  level?: AccessLevel
) => {
  return function ProtectedComponent(props: P) {
    return (
      <SubscriptionGate feature={feature} level={level}>
        <WrappedComponent {...props} />
      </SubscriptionGate>
    )
  }
}