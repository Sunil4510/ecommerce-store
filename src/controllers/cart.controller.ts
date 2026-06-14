import { Request, Response } from 'express';
import { CartService } from '../services/cart.service.js';

export class CartController {
  private service = new CartService();

  /**
   * Adds product and quantity to cart. Assumes validation middleware has checked payload.
   */
  public addToCart = (req: Request, res: Response): void => {
    try {
      const { cartId, productId, quantity } = req.body;
      const cart = this.service.addToCart(cartId, productId, quantity);
      res.status(200).json(cart);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    }
  };
}
