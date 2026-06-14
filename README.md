# E-Commerce Store API

A modular, layered REST API built with Node.js, Express, TypeScript, and Zod. Features shopping cart management, coupon checkout validation, order placement, milestone discount coupon generation, and statistics tracking.

---

## 🛠 Tech Stack

* **Core**: Node.js, Express, TypeScript (ESM)
* **Validation**: Zod v4 (Strict schema request filters)
* **Database**: In-memory repository (Singleton pattern)
* **Testing**: Vitest & Supertest (Fast HTTP integration tests)

---

## 🚀 Getting Started

### 1. Setup & Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template `.env.example` to `.env` and modify the values as needed (Note: `.env` is git-ignored):
```bash
cp .env.example .env
```

### 3. Run the Development Server
Starts the local API server on `http://localhost:3000`:
```bash
npm run dev
```

### 3. Build & Run Production Bundle
Compiles TypeScript into Javascript in `dist/` and runs the production server:
```bash
npm run build
npm start
```

### 4. Run Automated Test Suite
Runs the Vitest suite validating all 13 unit and integration test cases:
```bash
npm run test
```

---

## 🔒 Security Middleware (Admin Auth)
All `/api/admin/*` endpoints are secured by an authorization middleware:
* You must include the header: `x-admin-token: super-secret-admin-token`
* Token can be configured via environment variables (`ADMIN_TOKEN`).

---

## 📂 API Reference

### 1. Product Catalog
* **Endpoint**: `GET /api/products`
* **Description**: Returns all seeded products available to add to carts.
* **Response `200 OK`**:
```json
[
  { "id": "prod_1", "name": "Premium Wireless Headphones", "price": 150 },
  { "id": "prod_2", "name": "Mechanical Gaming Keyboard", "price": 100 },
  { "id": "prod_3", "name": "Ergonomic Wireless Mouse", "price": 60 },
  { "id": "prod_4", "name": "4K UltraHD Monitor 27\"", "price": 350 },
  { "id": "prod_5", "name": "USB-C Multiport Adapter Hub", "price": 40 }
]
```

---

### 2. Add Item to Cart
* **Endpoint**: `POST /api/cart/add`
* **Description**: Adds a product with a quantity to a cart. If `cartId` is omitted, a new cart will be generated and returned.
* **Request Body**:
```json
{
  "cartId": "cart_optional_id", 
  "productId": "prod_1",
  "quantity": 2
}
```
* **Response `200 OK`**:
```json
{
  "id": "cart_7a4f9b2d-1234-5678-9101-112131415161",
  "items": [
    {
      "product": { "id": "prod_1", "name": "Premium Wireless Headphones", "price": 150 },
      "quantity": 2
    }
  ],
  "subtotal": 300
}
```

---

### 3. Cart Checkout
* **Endpoint**: `POST /api/checkout`
* **Description**: Places an order for all items in the cart, applies the optional coupon code if valid, consumes the coupon, and clears the cart.
* **Request Body**:
```json
{
  "cartId": "cart_7a4f9b2d-1234-5678-9101-112131415161",
  "couponCode": "DISCOUNT-ORD5-A3F8B2" // Optional
}
```
* **Response `200 OK`**:
```json
{
  "id": "ord_887e221b-abcd-ef01-2345-6789abcdef01",
  "items": [
    {
      "product": { "id": "prod_1", "name": "Premium Wireless Headphones", "price": 150 },
      "quantity": 2
    }
  ],
  "subtotal": 300,
  "discountApplied": 30, // 10% discount applied
  "finalTotal": 270,
  "couponUsed": "DISCOUNT-ORD5-A3F8B2",
  "timestamp": "2026-06-14T05:20:22.123Z"
}
```

---

### 4. Generate Coupon (Admin Only)
* **Endpoint**: `POST /api/admin/discount/generate`
* **Headers**: `x-admin-token: super-secret-admin-token`
* **Description**: Mints a unique discount coupon code if the milestone condition is met (every $n$-th order completed, default $n = 5$). Valid for exactly **7 days**.
* **Response `201 Created`**:
```json
{
  "code": "DISCOUNT-ORD5-B3E9FA",
  "discountPercent": 10,
  "isUsed": false,
  "expiresAt": "2026-06-21T05:29:45.000Z",
  "orderIndexTriggered": 5
}
```

---

### 5. Get E-Commerce Statistics (Admin Only)
* **Endpoint**: `GET /api/admin/stats`
* **Headers**: `x-admin-token: super-secret-admin-token`
* **Description**: Aggregates store sales metrics and provides proactive dashboard indicators.
* **Response `200 OK`**:
```json
{
  "itemsPurchased": 12, // Total quantities sold
  "revenue": 1450.50, // Net total after coupon cuts
  "discountCodes": ["DISCOUNT-ORD5-B3E9FA"], // List of all generated codes
  "totalDiscountsGiven": 30.00,
  "totalOrdersCount": 5, // Total completed checkouts
  "isCouponGenerationEligible": true, // Can the admin hit generate coupon right now?
  "eligibleCouponsCount": 1, // Number of coupons pending generation
  "ordersNeededForNextCoupon": 5 // Checkouts needed to reach the next milestone (e.g. 10)
}
```
