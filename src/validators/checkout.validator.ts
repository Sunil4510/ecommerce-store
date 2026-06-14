import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for checkout operations.
 */
export function validateCheckout(req: Request, res: Response, next: NextFunction): void {
  const { cartId, couponCode } = req.body;
  const errors: string[] = [];

  if (!cartId || typeof cartId !== 'string' || cartId.trim() === '') {
    errors.push("Field 'cartId' is required and must be a non-empty string.");
  }

  if (couponCode !== undefined && (typeof couponCode !== 'string' || couponCode.trim() === '')) {
    errors.push("Field 'couponCode' must be a non-empty string if provided.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      messages: errors,
    });
    return;
  }

  next();
}
