// ABOUTME: Security configuration and policies for admin interfaces

/**
 * Security configuration for admin interfaces
 */
export const ADMIN_SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    required: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireMfa: false, // Can be enabled in production
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Role-based access control
  roles: {
    admin: {
      permissions: [
        'manage_categories',
        'manage_announcements',
        'manage_users',
        'view_analytics',
        'manage_settings',
      ],
      description: 'Full administrative access',
    },
    super_admin: {
      permissions: [
        'manage_categories',
        'manage_announcements',
        'manage_users',
        'view_analytics',
        'manage_settings',
        'manage_security',
        'view_logs',
      ],
      description: 'Full system access',
    },
  },

  // Rate limiting settings
  rateLimiting: {
    enabled: true,
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    burstLimit: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // Input validation settings
  validation: {
    maxInputLength: 2000,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    sanitizeHtml: true,
    validateUrls: true,
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:'],
      'connect-src': ["'self'", 'https:'],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },

  // Logging and monitoring
  logging: {
    enabled: true,
    logLevel: 'info',
    auditEvents: [
      'admin_login',
      'admin_logout',
      'category_created',
      'category_updated',
      'category_deleted',
      'announcement_created',
      'announcement_updated',
      'announcement_deleted',
      'user_permissions_changed',
      'security_violation',
    ],
    retentionDays: 90,
  },

  // Error handling
  errorHandling: {
    hideInternalErrors: true,
    maxStackTraceLength: 1000,
    logErrors: true,
    notifyOnCriticalErrors: true,
  },
} as const;

/**
 * Security policies for specific admin components
 */
export const COMPONENT_SECURITY_POLICIES = {
  CategoryManagement: {
    requiredPermissions: ['manage_categories'],
    rateLimitKey: 'category_management',
    maxActionsPerMinute: 20,
    auditActions: ['create', 'update', 'delete', 'reorder'],
    inputValidation: {
      name: {
        required: true,
        maxLength: 50,
        pattern: /^[a-z0-9-]+$/,
      },
      label: {
        required: true,
        maxLength: 100,
      },
      description: {
        maxLength: 500,
        sanitize: true,
      },
    },
  },

  AnnouncementManagement: {
    requiredPermissions: ['manage_announcements'],
    rateLimitKey: 'announcement_management',
    maxActionsPerMinute: 10,
    auditActions: ['create', 'update', 'delete', 'publish', 'unpublish'],
    inputValidation: {
      title: {
        required: true,
        maxLength: 200,
      },
      content: {
        required: true,
        maxLength: 2000,
        sanitize: true,
      },
      priority: {
        required: true,
        min: 1,
        max: 10,
      },
    },
  },

  UserManagement: {
    requiredPermissions: ['manage_users'],
    rateLimitKey: 'user_management',
    maxActionsPerMinute: 15,
    auditActions: ['create', 'update', 'delete', 'role_change', 'permissions_change'],
    inputValidation: {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      role: {
        required: true,
        enum: ['admin', 'practitioner'], // Simplified 2-tier role system
      },
    },
  },

  Analytics: {
    requiredPermissions: ['view_analytics'],
    rateLimitKey: 'analytics',
    maxActionsPerMinute: 30,
    auditActions: ['view', 'export'],
    dataRetention: 365, // days
  },
} as const;

/**
 * Security validation rules
 */
export const SECURITY_VALIDATION_RULES = {
  // XSS prevention
  xss: {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    sanitizeOptions: {
      allowedTags: [],
      allowedAttributes: {},
    },
  },

  // SQL injection prevention
  sql: {
    blacklistedKeywords: [
      'DROP',
      'DELETE',
      'UPDATE',
      'INSERT',
      'ALTER',
      'CREATE',
      'EXEC',
      'EXECUTE',
      'UNION',
      'SELECT',
      'SCRIPT',
    ],
    parameterizedQueries: true,
  },

  // File upload security
  fileUpload: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    scanForMalware: true,
    quarantineUntilScanned: true,
  },

  // Session security
  session: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
    regenerateOnLogin: true,
  },
} as const;

/**
 * Security monitoring thresholds
 */
export const SECURITY_MONITORING_THRESHOLDS = {
  // Failed login attempts
  failedLogins: {
    threshold: 5,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    action: 'lockout',
  },

  // Rapid fire requests
  rapidRequests: {
    threshold: 100,
    timeWindow: 60 * 1000, // 1 minute
    action: 'rate_limit',
  },

  // Privilege escalation attempts
  privilegeEscalation: {
    threshold: 3,
    timeWindow: 60 * 1000, // 1 minute
    action: 'security_alert',
  },

  // Suspicious patterns
  suspiciousPatterns: {
    sqlInjectionAttempts: {
      threshold: 1,
      action: 'immediate_block',
    },
    xssAttempts: {
      threshold: 1,
      action: 'immediate_block',
    },
    fileUploadAbuse: {
      threshold: 5,
      timeWindow: 5 * 60 * 1000, // 5 minutes
      action: 'temporary_ban',
    },
  },
} as const;

/**
 * Security incident response procedures
 */
export const SECURITY_INCIDENT_RESPONSE = {
  // Incident severity levels
  severityLevels: {
    low: {
      responseTime: 24 * 60 * 60 * 1000, // 24 hours
      notifications: ['security_team'],
    },
    medium: {
      responseTime: 4 * 60 * 60 * 1000, // 4 hours
      notifications: ['security_team', 'admin_team'],
    },
    high: {
      responseTime: 60 * 60 * 1000, // 1 hour
      notifications: ['security_team', 'admin_team', 'management'],
    },
    critical: {
      responseTime: 15 * 60 * 1000, // 15 minutes
      notifications: ['security_team', 'admin_team', 'management', 'on_call'],
    },
  },

  // Automated response actions
  automatedResponses: {
    rate_limit: {
      enabled: true,
      duration: 10 * 60 * 1000, // 10 minutes
    },
    lockout: {
      enabled: true,
      duration: 15 * 60 * 1000, // 15 minutes
    },
    immediate_block: {
      enabled: true,
      duration: 60 * 60 * 1000, // 1 hour
    },
    temporary_ban: {
      enabled: true,
      duration: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // Security contact information
  contacts: {
    security_team: 'security@evidens.com',
    admin_team: 'admin@evidens.com',
    management: 'management@evidens.com',
    on_call: 'oncall@evidens.com',
  },
} as const;

/**
 * Type definitions for security configuration
 */
export type SecurityRole = keyof typeof ADMIN_SECURITY_CONFIG.roles;
export type SecurityPermission = string;
export type ComponentSecurityPolicy =
  (typeof COMPONENT_SECURITY_POLICIES)[keyof typeof COMPONENT_SECURITY_POLICIES];
export type SecurityIncidentSeverity = keyof typeof SECURITY_INCIDENT_RESPONSE.severityLevels;

/**
 * Helper functions for security configuration
 */
export const getPermissionsForRole = (role: SecurityRole): string[] => {
  return ADMIN_SECURITY_CONFIG.roles[role]?.permissions || [];
};

export const hasPermission = (
  userRole: SecurityRole,
  requiredPermission: SecurityPermission
): boolean => {
  const rolePermissions = getPermissionsForRole(userRole);
  return rolePermissions.includes(requiredPermission);
};

export const getSecurityPolicyForComponent = (
  componentName: keyof typeof COMPONENT_SECURITY_POLICIES
): ComponentSecurityPolicy => {
  return COMPONENT_SECURITY_POLICIES[componentName];
};

export const isRateLimitExceeded = (
  requestCount: number,
  timeWindow: number,
  maxRequests: number
): boolean => {
  return requestCount > maxRequests;
};

export const getSecurityIncidentSeverity = (
  incidentType: string,
  context: Record<string, any>
): SecurityIncidentSeverity => {
  // Determine severity based on incident type and context
  if (incidentType.includes('sql_injection') || incidentType.includes('privilege_escalation')) {
    return 'critical';
  }
  if (incidentType.includes('xss') || incidentType.includes('unauthorized_access')) {
    return 'high';
  }
  if (incidentType.includes('rate_limit') || incidentType.includes('validation_error')) {
    return 'medium';
  }
  return 'low';
};
