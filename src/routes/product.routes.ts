import { Router } from 'express';
import { StoreRepository } from '../repository.js';

const router = Router();
const repo = StoreRepository.getInstance();

/**
 * Route exposing read-only product catalog
 */
router.get('/', (req, res) => {
  try {
    res.status(200).json(repo.getProducts());
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;
