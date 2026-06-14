import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for adding items to a cart.
 * Checks for presence, types, and constraints on productId and quantity.
 */
export function validateAddToCart(req: Request, res: Response, next: NextFunction): void {
  const { productId, quantity, cartId } = req.body;
  const errors: string[] = [];

  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    errors.push("Field 'productId' is required and must be a non-empty string.");
  }

  if (quantity === undefined || quantity === null) {
    errors.push("Field 'quantity' is required.");
  } else {
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      errors.push("Field 'quantity' must be a positive integer greater than or equal to 1.");
    }
  }

  if (cartId !== undefined && (typeof cartId !== 'string' || cartId.trim() === '')) {
    errors.push("Field 'cartId' must be a non-empty string if provided.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      messages: errors,
    });
    return;
  }

  // Sanitize quantity to ensure it's a number down the line
  req.body.quantity = Number(quantity);

  next();
}

/**
 * Validation middleware for checkout requests.
 * Checks for presence of cartId and optional couponCode format.
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
