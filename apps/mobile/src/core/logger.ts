/**
 * Logging service for mobile app
 * Provides structured logging with levels and context
 * 
 * Note: For MVP, we use console.* with structured format.
 * In production, this could be replaced with a proper logging service.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Logger class for structured logging
 * Formats logs consistently and includes context
 */
class Logger {
  /**
   * Log a debug message
   * Used for detailed diagnostic information
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   * Used for general informational messages about app flow
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   * Used for potentially problematic situations
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   * Used for error conditions that need attention
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Internal log method that formats and outputs the log entry
   * Simplified format for cleaner console output
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Only log errors by default to reduce noise
    // Set LOG_LEVEL=warn, info, or debug to see more
    const logLevel = (process.env.LOG_LEVEL || "error").toLowerCase();
    const shouldLog = 
      level === "error" || 
      (logLevel === "warn" && level === "warn") ||
      (logLevel === "info" && (level === "info" || level === "warn")) ||
      (logLevel === "debug");

    if (!shouldLog) {
      return;
    }

    // Simplified format: just message and key context
    const contextStr = context 
      ? Object.entries(context)
          .filter(([_, v]) => v !== null && v !== undefined)
          .map(([k, v]) => {
            // Truncate long values
            const val = typeof v === "string" && v.length > 50 
              ? v.substring(0, 50) + "..." 
              : v;
            return `${k}=${val}`;
          })
          .join(" ")
      : "";

    const formatted = contextStr 
      ? `${message} | ${contextStr}`
      : message;

    // Route to appropriate console method
    // Use console.log for errors to avoid stack traces in React Native
    switch (level) {
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
        // Use console.log with ERROR prefix to avoid automatic stack traces
        // React Native's console.error automatically includes stack traces which are noisy
        console.log(`❌ ERROR: ${formatted}`);
        break;
    }
  }
}

/**
 * Singleton logger instance
 * Use this throughout the app for consistent logging
 */
export const logger = new Logger();

