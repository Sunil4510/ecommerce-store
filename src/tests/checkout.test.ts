import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { StoreRepository } from '../repository.js';

const repo = StoreRepository.getInstance();

beforeEach(() => {
  repo.reset();
});

describe('Checkout API', () => {
  it('should successfully place an order and empty the cart', async () => {
    const cartRes = await request(app)
      .post('/api/cart/add')
      .send({ productId: 'prod_2', quantity: 3 });
    const cartId = cartRes.body.id;

    const checkoutRes = await request(app)
      .post('/api/checkout')
      .send({ cartId });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body).toHaveProperty('id');
    expect(checkoutRes.body.subtotal).toBe(300); // 100 * 3
    expect(checkoutRes.body.discountApplied).toBe(0);
    expect(checkoutRes.body.finalTotal).toBe(300);

    const checkCart = await request(app)
      .post('/api/cart/add')
      .send({ cartId, productId: 'prod_1', quantity: 1 });
    expect(checkCart.status).toBe(404);
  });

  it('should prevent checkout of empty or invalid carts', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({ cartId: 'invalid_cart_id' });
    expect(res.status).toBe(404);
  });
});
