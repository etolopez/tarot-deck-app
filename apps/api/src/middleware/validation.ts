/**
 * Validation middleware using Zod
 * Validates request bodies against schemas
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

/**
 * Create validation middleware for request body
 * Validates against a Zod schema and returns 400 if invalid
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and transform request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn("validation.error", {
          path: req.path,
          errors: error.errors,
        });

        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      } else {
        logger.error("validation.unexpected", {
          path: req.path,
          error: error instanceof Error ? error.message : String(error),
        });

        res.status(500).json({
          error: "Internal validation error",
        });
      }
    }
  };
}

