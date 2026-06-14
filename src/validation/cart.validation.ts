import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z
    .string({
      message: "Field 'productId' is required and must be a string.",
    })
    .min(1, "Field 'productId' cannot be empty."),
  quantity: z
    .number({
      message: "Field 'quantity' is required and must be a number.",
    })
    .int("Field 'quantity' must be an integer.")
    .min(1, "Field 'quantity' must be a positive integer greater than or equal to 1."),
  cartId: z
    .string({
      message: "Field 'cartId' must be a string.",
    })
    .min(1, "Field 'cartId' cannot be empty.")
    .optional(),
});

/**
 * Zod-based request validation middleware for cart addition.
 */
export function validateAddToCart(req: Request, res: Response, next: NextFunction): void {
  const result = addToCartSchema.safeParse(req.body);

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
