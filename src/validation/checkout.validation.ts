import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const checkoutSchema = z.object({
  cartId: z
    .string({
      message: "Field 'cartId' is required and must be a string.",
    })
    .min(1, "Field 'cartId' cannot be empty."),
  couponCode: z
    .string({
      message: "Field 'couponCode' must be a string.",
    })
    .min(1, "Field 'couponCode' cannot be empty.")
    .optional(),
});

/**
 * Zod-based request validation middleware for cart checkout.
 */
export function validateCheckout(req: Request, res: Response, next: NextFunction): void {
  const result = checkoutSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation Error',
      messages: result.error.issues.map(issue => issue.message),
    });
    return;
  }

  // Assign the safely parsed and typed data back to req.body
  req.body = result.data;
  next();
}
