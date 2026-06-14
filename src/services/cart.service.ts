import crypto from 'crypto';
import { StoreRepository } from '../repository.js';
import { Cart } from '../types.js';

export class CartService {
  private repo = StoreRepository.getInstance();

  /**
   * Adds an item to the shopping cart, creating a new cart if no cartId is provided.
   * Enforces positive integer quantity validation and secure server-side price lookup.
   */
  public addToCart(cartId: string | undefined, productId: string, quantity: number): Cart {
    // 1. Validation: Ensure quantity is a positive integer >= 1
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive integer greater than or equal to 1.');
    }

    // 2. Fetch or initialize the Cart
    let cart: Cart;
    if (cartId) {
      const existingCart = this.repo.getCart(cartId);
      if (!existingCart) {
        throw new Error(`Cart with ID '${cartId}' not found.`);
      }
      cart = existingCart;
    } else {
      cart = {
        id: `cart_${crypto.randomUUID()}`,
        items: [],
        subtotal: 0,
      };
    }

    // 3. Verify Product existence in the catalog
    const product = this.repo.getProduct(productId);
    if (!product) {
      throw new Error(`Product with ID '${productId}' not found in catalog.`);
    }

    // 4. Update items list (increment quantity if already exists)
    const existingItem = cart.items.find(item => item.product.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
    }

    // 5. Recalculate subtotal using live catalog prices (prevents client price tampering)
    this.recalculateSubtotal(cart);

    // 6. Save cart and return state
    this.repo.saveCart(cart);
    return cart;
  }

  /**
   * Retrieve cart by ID. Throws error if not found.
   */
  public getCart(cartId: string): Cart {
    const cart = this.repo.getCart(cartId);
    if (!cart) {
      throw new Error(`Cart with ID '${cartId}' not found.`);
    }
    return cart;
  }

  /**
   * Recalculates cart subtotal using live product catalog data
   */
  private recalculateSubtotal(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => {
      const liveProduct = this.repo.getProduct(item.product.id);
      const price = liveProduct ? liveProduct.price : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }
}
