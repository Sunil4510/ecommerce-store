import { Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service.js';

export class CheckoutController {
  private service = new CheckoutService();

  /**
   * Processes a cart checkout, applying an optional coupon code.
   * Assumes input has already been verified by validation middleware.
   */
  public checkout = (req: Request, res: Response): void => {
    try {
      const { cartId, couponCode } = req.body;
      const order = this.service.checkout(cartId, couponCode);
      res.status(200).json(order);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    }
  };
}
