/**
 * Winston logger configuration for backend API
 * Provides structured logging with different levels
 */

import pino from "pino";

/**
 * Create Pino logger instance
 * Pino is a fast JSON logger that works well with Express
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

/**
 * Create HTTP logger middleware for Express
 * Logs all HTTP requests with request ID
 */
export { pinoHttp } from "pino-http";

