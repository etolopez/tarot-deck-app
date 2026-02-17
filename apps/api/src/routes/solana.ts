/**
 * Solana verification routes
 * Handles POST /v1/solana/verify-and-grant for transaction verification
 * 
 * Based on SOLANA_INTEGRATION_GUIDE.md verification pattern
 * Includes retry logic for RPC rate limits
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import { verifyPayment } from "../config/solana";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Zod schema for Solana verification request
 */
const SolanaVerifyRequestSchema = z.object({
  userId: z.string(),
  txSignature: z.string(),
  expectedRecipient: z.string(),
  expectedLamportsMin: z.number(),
  creditDelta: z.number(),
});

/**
 * Response type for verification
 */
interface SolanaVerifyResponse {
  ok: boolean;
  grantedCredits: number;
  ledgerRef: string;
}

/**
 * POST /v1/solana/verify-and-grant
 * Verifies Solana transaction and grants credits
 * 
 * Implements retry logic for RPC rate limits (exponential backoff)
 * Based on SOLANA_INTEGRATION_GUIDE.md verification pattern
 */
router.post(
  "/verify-and-grant",
  validateBody(SolanaVerifyRequestSchema),
  async (req: Request<{}, SolanaVerifyResponse, z.infer<typeof SolanaVerifyRequestSchema>>, res: Response) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info("solana.verify.request", {
      requestId,
      userId: req.body.userId,
      txSignature: req.body.txSignature.substring(0, 16) + "...",
    });

    try {
      // Verify payment with retry logic for rate limits
      const maxRetries = 5;
      const baseDelay = 3000;
      let paymentValid = false;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          paymentValid = await verifyPayment(
            req.body.txSignature,
            req.body.expectedRecipient,
            req.body.expectedLamportsMin
          );

          if (paymentValid) {
            break;
          }
        } catch (error: any) {
          // Handle rate limit errors with exponential backoff
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests")) {
            const rateLimitDelay = baseDelay * Math.pow(2, attempt) * 2;
            if (attempt < maxRetries) {
              logger.warn("solana.verify.ratelimit.retry", {
                requestId,
                attempt,
                delay: rateLimitDelay,
              });
              await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
              continue;
            }
          }
          logger.error("solana.verify.attempt.error", {
            requestId,
            attempt,
            error: errorMsg,
          });
        }

        // Retry with exponential backoff if verification failed
        if (!paymentValid && attempt < maxRetries) {
          const retryDelay = baseDelay * Math.pow(2, attempt - 1);
          logger.info("solana.verify.retry", {
            requestId,
            attempt,
            delay: retryDelay,
          });
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      if (!paymentValid) {
        logger.error("solana.verify.failed", {
          requestId,
          txSignature: req.body.txSignature.substring(0, 16) + "...",
        });

        return res.status(400).json({
          ok: false,
          grantedCredits: 0,
          ledgerRef: req.body.txSignature,
          error: "Payment verification failed. Please try again.",
        } as any);
      }

      // Payment verified - return success
      // Note: In a real implementation, you would grant credits in a database here
      logger.info("solana.verify.success", {
        requestId,
        txSignature: req.body.txSignature.substring(0, 16) + "...",
        creditsGranted: req.body.creditDelta,
      });

      const response: SolanaVerifyResponse = {
        ok: true,
        grantedCredits: req.body.creditDelta,
        ledgerRef: req.body.txSignature,
      };

      res.json(response);
    } catch (error) {
      logger.error("solana.verify.error", {
        requestId,
        txSignature: req.body.txSignature.substring(0, 16) + "...",
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        ok: false,
        grantedCredits: 0,
        ledgerRef: req.body.txSignature,
        error: "Internal server error during verification",
      } as any);
    }
  }
);

export default router;

