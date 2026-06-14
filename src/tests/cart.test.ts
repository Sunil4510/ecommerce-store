import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { StoreRepository } from '../repository.js';

const repo = StoreRepository.getInstance();

beforeEach(() => {
  repo.reset();
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
    const cartRes1 = await request(app)
      .post('/api/cart/add')
      .send({ productId: 'prod_1', quantity: 1 });
    
    const cartId = cartRes1.body.id;

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
