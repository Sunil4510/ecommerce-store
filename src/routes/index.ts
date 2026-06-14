import { Router } from 'express';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import checkoutRoutes from './checkout.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Mount entity sub-routers
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/admin', adminRoutes);

export default router;
