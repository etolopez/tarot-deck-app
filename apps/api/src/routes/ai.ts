/**
 * AI reading routes
 * Handles POST /v1/ai/reading for narrative generation
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { generateTarotNarrative } from "../services/aiService";
import { logger } from "../utils/logger";
import type { AiReadingRequest, AiReadingResponse } from "../types/ai";

const router = Router();

/**
 * Zod schema for AI reading request validation
 */
const AiReadingRequestSchema = z.object({
  readingId: z.string().uuid(),
  question: z.string().nullable(),
  spread: z.object({
    id: z.enum(["one_card", "three_card", "celtic_cross"]),
    positions: z.array(
      z.object({
        index: z.number(),
        label: z.string(),
        prompt: z.string(),
      })
    ),
  }),
  cards: z.array(
    z.object({
      cardId: z.string(),
      name: z.string(),
      positionIndex: z.number(),
      positionLabel: z.string(),
      isReversed: z.boolean(),
      meaning: z.string(),
      description: z.string(),
    })
  ),
  tone: z.literal("heavenly_clean"),
  outputFormat: z.literal("text"),
});

/**
 * POST /v1/ai/reading
 * Generates AI narrative for a tarot reading
 */
router.post(
  "/reading",
  validateBody(AiReadingRequestSchema),
  async (req: Request<{}, AiReadingResponse, AiReadingRequest>, res: Response) => {
    const requestId = req.headers["x-request-id"] as string || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const narrative = await generateTarotNarrative(req.body);

      const response: AiReadingResponse = {
        readingId: req.body.readingId,
        aiNarrative: narrative,
      };

      res.json(response);
    } catch (error) {
      logger.error("ai.route.error", {
        requestId,
        readingId: req.body.readingId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return 500 with request ID for debugging
      res.status(500).json({
        error: "Failed to generate narrative",
        requestId,
      } as any);
    }
  }
);

export default router;

