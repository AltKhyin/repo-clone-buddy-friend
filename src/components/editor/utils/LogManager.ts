// ABOUTME: Centralized logging system with level management and throttling for EVIDENS table editor

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: number;
  correlationId?: string;
  metadata?: any;
}

interface LogThrottleEntry {
  lastLogged: number;
  count: number;
}

/**
 * Centralized logging manager with throttling and performance monitoring
 */
class LogManager {
  private currentLevel: LogLevel = LogLevel.INFO;
  private throttleMap = new Map<string, LogThrottleEntry>();
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private throttleWindowMs = 1000; // Throttle duplicate messages within 1 second
  
  /**
   * Set the global log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
    console.log(`[LogManager] Log level set to ${LogLevel[level]}`);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Clear throttle history (useful for testing)
   */
  clearThrottleHistory(): void {
    this.throttleMap.clear();
  }

  /**
   * Check if a message should be throttled
   */
  private shouldThrottle(messageKey: string): boolean {
    const now = Date.now();
    const entry = this.throttleMap.get(messageKey);
    
    if (!entry) {
      this.throttleMap.set(messageKey, { lastLogged: now, count: 1 });
      return false;
    }
    
    // If within throttle window, increment count but don't log
    if (now - entry.lastLogged < this.throttleWindowMs) {
      entry.count++;
      return true;
    }
    
    // Outside throttle window, log and reset
    if (entry.count > 1) {
      // Log throttle summary
      console.log(`[LogManager] (Throttled: ${entry.count} messages in ${this.throttleWindowMs}ms)`);
    }
    
    entry.lastLogged = now;
    entry.count = 1;
    return false;
  }

  /**
   * Create a throttled logger for a specific component
   */
  createLogger(component: string) {
    return {
      debug: (message: string, metadata?: any) => 
        this.log(LogLevel.DEBUG, `[${component}] ${message}`, metadata),
      
      info: (message: string, metadata?: any) => 
        this.log(LogLevel.INFO, `[${component}] ${message}`, metadata),
      
      warn: (message: string, metadata?: any) => 
        this.log(LogLevel.WARN, `[${component}] ${message}`, metadata),
      
      error: (message: string, metadata?: any) => 
        this.log(LogLevel.ERROR, `[${component}] ${message}`, metadata),

      // Special throttled variants
      debugThrottled: (key: string, message: string, metadata?: any) =>
        this.logThrottled(LogLevel.DEBUG, key, `[${component}] ${message}`, metadata),
      
      infoThrottled: (key: string, message: string, metadata?: any) =>
        this.logThrottled(LogLevel.INFO, key, `[${component}] ${message}`, metadata),
    };
  }

  /**
   * Log a message with throttling
   */
  private logThrottled(level: LogLevel, throttleKey: string, message: string, metadata?: any): void {
    if (level < this.currentLevel) return;
    
    if (this.shouldThrottle(throttleKey)) {
      return; // Message throttled
    }
    
    this.performLog(level, message, metadata);
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, metadata?: any): void {
    if (level < this.currentLevel) return;
    
    this.performLog(level, message, metadata);
  }

  /**
   * Perform the actual logging
   */
  private performLog(level: LogLevel, message: string, metadata?: any): void {
    const logEntry: LogEntry = {
      message,
      level,
      timestamp: Date.now(),
      metadata
    };

    // Add to history
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message, metadata);
        break;
      case LogLevel.INFO:
        console.log(message, metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, metadata);
        break;
      case LogLevel.ERROR:
        console.error(message, metadata);
        break;
    }
  }

  /**
   * Get recent log history
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Get throttle statistics
   */
  getThrottleStats(): { key: string; count: number; lastLogged: number }[] {
    return Array.from(this.throttleMap.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      lastLogged: entry.lastLogged
    }));
  }

  /**
   * Performance measurement utilities
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.log(LogLevel.DEBUG, `[Performance] ${label}: ${duration.toFixed(2)}ms`);
    };
  }
}

// Global log manager instance
export const logManager = new LogManager();

// Set default log level based on environment
if (process.env.NODE_ENV === 'development') {
  logManager.setLevel(LogLevel.DEBUG);
} else {
  logManager.setLevel(LogLevel.WARN); // Production: only warnings and errors
}

// Convenience exports
export const createLogger = (component: string) => logManager.createLogger(component);
export const setLogLevel = (level: LogLevel) => logManager.setLevel(level);