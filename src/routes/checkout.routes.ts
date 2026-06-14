import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { checkoutSchema } from '../validation/checkout.validation.js';

const router = Router();
const controller = new CheckoutController();

/**
 * Route handling checkout order placement
 */
router.post('/', validate(checkoutSchema), controller.checkout);

export default router;
