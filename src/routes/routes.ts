import { Router } from 'express';
import { CartController } from '../controllers/cart.controller.js';
import { CheckoutController } from '../controllers/checkout.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { addToCartSchema } from '../validation/cart.validation.js';
import { checkoutSchema } from '../validation/checkout.validation.js';
import { adminAuthMiddleware } from '../middleware/auth.middleware.js';
import { StoreRepository } from '../repository.js';

const router = Router();

const cartController = new CartController();
const checkoutController = new CheckoutController();
const adminController = new AdminController();
const repo = StoreRepository.getInstance();

// --- Product Routes (Read-Only Catalog) ---
router.get('/products', (req, res) => {
  try {
    res.status(200).json(repo.getProducts());
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// --- Cart Routes ---
router.post('/cart/add', validate(addToCartSchema), cartController.addToCart);

// --- Checkout Routes ---
router.post('/checkout', validate(checkoutSchema), checkoutController.checkout);

// --- Admin Routes (Secured with Token Middleware) ---
router.post('/admin/discount/generate', adminAuthMiddleware, adminController.generateCoupon);
router.get('/admin/stats', adminAuthMiddleware, adminController.getStats);

export default router;
