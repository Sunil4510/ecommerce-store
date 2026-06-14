import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { StoreRepository } from '../repository.js';

const repo = StoreRepository.getInstance();

beforeEach(() => {
  repo.reset();
});

describe('Product Catalog API', () => {
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
