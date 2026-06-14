import crypto from 'crypto';
import { Product, Cart, Order, Coupon } from './types.js';

export class StoreRepository {
  private static instance: StoreRepository;

  private products = new Map<string, Product>();
  private carts = new Map<string, Cart>();
  private orders: Order[] = [];
  private coupons = new Map<string, Coupon>();
  private generatedMilestones = new Set<number>();

  private constructor() {
    this.seedProducts();
  }

  public static getInstance(): StoreRepository {
    if (!StoreRepository.instance) {
      StoreRepository.instance = new StoreRepository();
    }
    return StoreRepository.instance;
  }

  public reset() {
    this.products.clear();
    this.carts.clear();
    this.orders = [];
    this.coupons.clear();
    this.generatedMilestones.clear();
    this.seedProducts();
  }

  private seedProducts() {
    const defaultProducts: Product[] = [
      { id: 'prod_1', name: 'Premium Wireless Headphones', price: 150 },
      { id: 'prod_2', name: 'Mechanical Gaming Keyboard', price: 100 },
      { id: 'prod_3', name: 'Ergonomic Wireless Mouse', price: 60 },
      { id: 'prod_4', name: '4K UltraHD Monitor 27"', price: 350 },
      { id: 'prod_5', name: 'USB-C Multiport Adapter Hub', price: 40 },
    ];
    for (const prod of defaultProducts) {
      this.products.set(prod.id, prod);
    }
  }

  // --- Product storage ---
  public getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  // --- Cart storage ---
  public getCart(id: string): Cart | undefined {
    return this.carts.get(id);
  }

  public saveCart(cart: Cart): void {
    this.carts.set(cart.id, cart);
  }

  public deleteCart(id: string): void {
    this.carts.delete(id);
  }

  // --- Order storage ---
  public getOrders(): Order[] {
    return this.orders;
  }

  public saveOrder(order: Order): void {
    this.orders.push(order);
  }

  // --- Coupon storage ---
  public getCoupon(code: string): Coupon | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  public getCoupons(): Coupon[] {
    return Array.from(this.coupons.values());
  }

  public saveCoupon(coupon: Coupon): void {
    this.coupons.set(coupon.code.toUpperCase(), coupon);
  }

  // --- Milestone storage ---
  public getMilestones(): Set<number> {
    return this.generatedMilestones;
  }

  public addMilestone(milestone: number): void {
    this.generatedMilestones.add(milestone);
  }
}
