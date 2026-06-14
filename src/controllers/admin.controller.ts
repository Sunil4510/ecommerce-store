import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';

export class AdminController {
  private service = new AdminService();

  /**
   * Generates a new milestone coupon code if the N-th order rule condition is satisfied.
   */
  public generateCoupon = (req: Request, res: Response): void => {
    try {
      const coupon = this.service.generateCoupon();
      res.status(201).json(coupon);
    } catch (error: any) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    }
  };

  /**
   * Retrieves e-commerce statistics and coupon eligibility indicators.
   */
  public getStats = (req: Request, res: Response): void => {
    try {
      const stats = this.service.getStats();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  };
}
