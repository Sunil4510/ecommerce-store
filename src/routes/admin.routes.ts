import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new AdminController();

/**
 * Routes managing administrative statistics and coupon minting
 */
router.post('/discount/generate', adminAuthMiddleware, controller.generateCoupon);
router.get('/stats', adminAuthMiddleware, controller.getStats);

export default router;
