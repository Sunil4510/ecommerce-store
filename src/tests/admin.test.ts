import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { StoreRepository } from '../repository.js';
import { config } from '../config.js';

const repo = StoreRepository.getInstance();

beforeEach(() => {
  repo.reset();
});

describe('Admin and Discount System APIs', () => {
  const adminHeaders = { 'x-admin-token': config.ADMIN_TOKEN };

  describe('Discount Coupon System', () => {
    it('should not allow coupon generation if the N-th order milestone is not reached', async () => {
      for (let i = 0; i < 3; i++) {
        const cartRes = await request(app)
          .post('/api/cart/add')
          .send({ productId: 'prod_3', quantity: 1 });
        await request(app)
          .post('/api/checkout')
          .send({ cartId: cartRes.body.id });
      }

      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes.body.totalOrdersCount).toBe(3);
      expect(statsRes.body.isCouponGenerationEligible).toBe(false);
      expect(statsRes.body.ordersNeededForNextCoupon).toBe(2);

      const genRes = await request(app)
        .post('/api/admin/discount/generate')
        .set(adminHeaders);
      expect(genRes.status).toBe(400);
      expect(genRes.body.message).toContain('Coupon generation not eligible');
    });

    it('should unlock and generate a coupon when N-th order is reached', async () => {
      const n = config.DISCOUNT_N;

      for (let i = 0; i < n; i++) {
        const cartRes = await request(app)
          .post('/api/cart/add')
          .send({ productId: 'prod_5', quantity: 1 });
        await request(app)
          .post('/api/checkout')
          .send({ cartId: cartRes.body.id });
      }

      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes.body.totalOrdersCount).toBe(n);
      expect(statsRes.body.isCouponGenerationEligible).toBe(true);
      expect(statsRes.body.eligibleCouponsCount).toBe(1);

      const genRes = await request(app)
        .post('/api/admin/discount/generate')
        .set(adminHeaders);

      expect(genRes.status).toBe(201);
      expect(genRes.body).toHaveProperty('code');
      expect(genRes.body.code).toContain(`DISCOUNT-ORD${n}-`);
      expect(genRes.body.discountPercent).toBe(config.DISCOUNT_PERCENT);
      expect(new Date(genRes.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

      const couponCode = genRes.body.code;

      const statsRes2 = await request(app)
        .get('/api/admin/stats')
        .set(adminHeaders);
      expect(statsRes2.body.isCouponGenerationEligible).toBe(false);
      expect(statsRes2.body.eligibleCouponsCount).toBe(0);
      expect(statsRes2.body.discountCodes).toContain(couponCode);

      const cartRes = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'prod_1', quantity: 1 }); // $150 item
      const checkoutRes = await request(app)
        .post('/api/checkout')
        .send({ cartId: cartRes.body.id, couponCode });

      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body.discountApplied).toBe(15);
      expect(checkoutRes.body.finalTotal).toBe(135);

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
      const expiredCoupon = {
        code: 'EXPIRED-COUPON',
        discountPercent: 10,
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
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
