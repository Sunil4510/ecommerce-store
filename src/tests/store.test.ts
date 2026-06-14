import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { StoreRepository } from '../repository.js';
import { config } from '../config.js';

const repo = StoreRepository.getInstance();

beforeEach(() => {
  // Reset repository state to ensure absolute test isolation
  repo.reset();
});

describe('E-Commerce Store APIs', () => {
  
  describe('Product Catalog Endpoint', () => {
    it('should return the list of pre-seeded catalog products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });
  });

  describe('Cart API - Add to Cart', () => {
    it('should successfully create a new cart and add an item', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].product.id).toBe('prod_1');
      expect(res.body.items[0].quantity).toBe(2);
      expect(res.body.subtotal).toBe(300); // 150 * 2
    });

    it('should add items to an existing cart when cartId is provided', async () => {
      // Step 1: Create cart
      const cartRes1 = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 1 });
      
      const cartId = cartRes1.body.id;

      // Step 2: Add another product to same cart
      const cartRes2 = await request(app)
        .post('/api/cart/add')
        .send({ cartId, productId: 'prod_2', quantity: 2 });

      expect(cartRes2.status).toBe(200);
      expect(cartRes2.body.id).toBe(cartId);
      expect(cartRes2.body.items.length).toBe(2);
      expect(cartRes2.body.subtotal).toBe(350); // (150 * 1) + (100 * 2)
    });

    it('should reject requests with invalid product IDs', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'invalid_id', quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('should reject negative or non-integer quantities in validation layer', async () => {
      const res1 = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: -3 });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toBe('Validation Error');

      const res2 = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 1.5 });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Validation Error');
    });

    it('should reject requests missing required fields', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .send({ quantity: 2 }); // Missing productId
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('Checkout API', () => {
    it('should successfully place an order and empty the cart', async () => {
      // Step 1: Add to cart
      const cartRes = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_2', quantity: 3 });
      const cartId = cartRes.body.id;

      // Step 2: Checkout
      const checkoutRes = await request(app)
        .post('/api/checkout')
        .send({ cartId });

      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body).toHaveProperty('id');
      expect(checkoutRes.body.subtotal).toBe(300); // 100 * 3
      expect(checkoutRes.body.discountApplied).toBe(0);
      expect(checkoutRes.body.finalTotal).toBe(300);

      // Step 3: Verify cart was deleted
      const checkCart = await request(app)
        .post('/api/cart/add')
        .send({ cartId, productId: 'prod_1', quantity: 1 });
      expect(checkCart.status).toBe(404); // Cart deleted, so using cartId should fail
    });

    it('should prevent checkout of empty or invalid carts', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({ cartId: 'invalid_cart_id' });
      expect(res.status).toBe(404);
    });
  });

  describe('Discount Coupon System', () => {
    const adminHeaders = { 'x-admin-token': config.ADMIN_TOKEN };

    it('should not allow coupon generation if the N-th order milestone is not reached', async () => {
      // Placing 3 orders (milestone n = 5)
      for (let i = 0; i < 3; i++) {
        const cartRes = await request(app)
          .post('/api/cart/add')
          .send({ productId: 'prod_3', quantity: 1 });
        await request(app)
          .post('/api/checkout')
          .send({ cartId: cartRes.body.id });
      }

      // Check stats: 3 orders completed
      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes.body.totalOrdersCount).toBe(3);
      expect(statsRes.body.isCouponGenerationEligible).toBe(false);
      expect(statsRes.body.ordersNeededForNextCoupon).toBe(2);

      // Attempt generation
      const genRes = await request(app)
        .post('/api/admin/discount/generate')
        .set(adminHeaders);
      expect(genRes.status).toBe(400);
      expect(genRes.body.message).toContain('Coupon generation not eligible');
    });

    it('should unlock and generate a coupon when N-th order is reached', async () => {
      const n = config.DISCOUNT_N;

      // Place exactly n completed checkouts
      for (let i = 0; i < n; i++) {
        const cartRes = await request(app)
          .post('/api/cart/add')
          .send({ productId: 'prod_5', quantity: 1 });
        await request(app)
          .post('/api/checkout')
          .send({ cartId: cartRes.body.id });
      }

      // Verify stats eligibility
      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes.body.totalOrdersCount).toBe(n);
      expect(statsRes.body.isCouponGenerationEligible).toBe(true);
      expect(statsRes.body.eligibleCouponsCount).toBe(1);

      // Generate the coupon
      const genRes = await request(app)
        .post('/api/admin/discount/generate')
        .set(adminHeaders);

      expect(genRes.status).toBe(201);
      expect(genRes.body).toHaveProperty('code');
      expect(genRes.body.code).toContain(`DISCOUNT-ORD${n}-`);
      expect(genRes.body.discountPercent).toBe(config.DISCOUNT_PERCENT);
      expect(new Date(genRes.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

      const couponCode = genRes.body.code;

      // Verify stats after generation (should not be eligible anymore)
      const statsRes2 = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes2.body.isCouponGenerationEligible).toBe(false);
      expect(statsRes2.body.eligibleCouponsCount).toBe(0);
      expect(statsRes2.body.discountCodes).toContain(couponCode);

      // Use the coupon on order n + 1 (should apply 10% discount)
      const cartRes = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 1 }); // $150 item
      const checkoutRes = await request(app)
        .post('/api/checkout')
        .send({ cartId: cartRes.body.id, couponCode });

      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body.discountApplied).toBe(15); // 10% of $150
      expect(checkoutRes.body.finalTotal).toBe(135); // 150 - 15

      // Attempt to reuse same coupon (should fail: single-use restriction)
      const cartRes2 = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 1 });
      const checkoutRes2 = await request(app)
        .post('/api/checkout')
        .send({ cartId: cartRes2.body.id, couponCode });
      
      expect(checkoutRes2.status).toBe(400);
      expect(checkoutRes2.body.message).toContain('already been used');
    });

    it('should reject expired coupons', async () => {
      // Mock an expired coupon in the repo directly
      const expiredCoupon = {
        code: 'EXPIRED-COUPON',
        discountPercent: 10,
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        orderIndexTriggered: 5
      };
      repo.saveCoupon(expiredCoupon);

      const cartRes = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_2', quantity: 1 });
      
      const checkoutRes = await request(app)
        .post('/api/checkout')
        .send({ cartId: cartRes.body.id, couponCode: 'EXPIRED-COUPON' });

      expect(checkoutRes.status).toBe(400);
      expect(checkoutRes.body.message).toContain('has expired');
    });
  });

  describe('Admin Authorization Security', () => {
    it('should return 401 Unauthorized when hitting stats without token', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized when hitting stats with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-token', 'wrong-token');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });
});
