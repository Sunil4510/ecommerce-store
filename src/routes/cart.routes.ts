import { Router } from 'express';
import { CartController } from '../controllers/cart.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { addToCartSchema } from '../validation/cart.validation.js';

const router = Router();
const controller = new CartController();

/**
 * Route handling shopping cart updates
 */
router.post('/add', validate(addToCartSchema), controller.addToCart);

export default router;
