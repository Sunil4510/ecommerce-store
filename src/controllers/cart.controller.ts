import { Request, Response } from 'express';
import { CartService } from '../services/cart.service.js';

export class CartController {
  private service = new CartService();

  /**
   * Adds product and quantity to cart. Creates a new cart if cartId isn't provided.
   */
  public addToCart = (req: Request, res: Response): void => {
    try {
      const { cartId, productId, quantity } = req.body;

      // Ensure fields exist
      if (!productId) {
        res.status(400).json({ error: 'Bad Request', message: 'productId is a required field.' });
        return;
      }

      if (quantity === undefined) {
        res.status(400).json({ error: 'Bad Request', message: 'quantity is a required field.' });
        return;
      }

      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity)) {
        res.status(400).json({ error: 'Bad Request', message: 'quantity must be a valid number.' });
        return;
      }

      const cart = this.service.addToCart(cartId, productId, parsedQuantity);
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
