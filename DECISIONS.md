# Design Decisions

This document details 9 key design decisions made during the development of the E-Commerce Store APIs.

---

## Decision: Repository Pattern

**Context:** Decoupling storage logic from business logic.

**Options Considered:**
- **Option A:** Manipulate in-memory Maps and Arrays directly inside services.
- **Option B:** Wrap storage access inside a dedicated repository class.

**Choice:** Option B.

**Why:** Keeps business logic database-agnostic. Swapping from in-memory to a real database (like PostgreSQL) only requires modifying the repository file.

---

## Decision: Layered Architecture

**Context:** Organizing code structure for maintainability and readability.

**Options Considered:**
- **Option A:** Monolithic controller routes handling validation, logic, and database operations.
- **Option B:** Separated layers: Routes $\rightarrow$ Validation $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Repository.

**Choice:** Option B.

**Why:** Enforces strict separation of concerns. Each layer has a single responsibility, which increases testability.

---

## Decision: Coupon Expiration

**Context:** Restricting the validity window of generated milestone discount codes.

**Options Considered:**
- **Option A:** Coupons remain valid indefinitely until they are used.
- **Option B:** Coupons expire exactly 7 days after they are generated.

**Choice:** Option B.

**Why:** Prevents the store from accumulating long-term unused discount liabilities, while encouraging immediate customer checkouts.

---

## Decision: Coupon Suffix Randomization

**Context:** Preventing brute-force guessing of active coupon codes.

**Options Considered:**
- **Option A:** Predictable sequential codes (e.g. `DISCOUNT-ORD5`, `DISCOUNT-ORD10`).
- **Option B:** Appending a cryptographically secure random suffix (e.g. `DISCOUNT-ORD5-8F3Z9K`).

**Choice:** Option B.

**Why:** Predictable codes enable enumeration attacks. Random suffixes make brute-forcing mathematically impossible.

---

## Decision: Thread Safety & Concurrency

**Context:** Preventing double-spending of single-use coupons during concurrent checkout requests.

**Options Considered:**
- **Option A:** Rely on synchronous operations in Node.js's single-threaded event loop (for in-memory).
- **Option B:** Implement database-level row locks or unique index constraints.

**Choice:** Option A (for our in-memory store), with Option B planned for a real database.

**Why:** Single-threaded synchronous updates are naturally atomic in-memory. Switching to a real database will require Row Locks (`FOR UPDATE` in SQL) to prevent race conditions.

---

## Decision: Sales Volume Items Count Logic

**Context:** Defining how "count of items purchased" is calculated in stats.

**Options Considered:**
- **Option A:** Count unique product types (e.g., Laptop and Mouse = 2 items).
- **Option B:** Count total units sold (e.g., 2 Laptops and 1 Mouse = 3 items).

**Choice:** Option B.

**Why:** Summing line item quantities represents true sales volume and matches industry standards.

---

## Decision: Admin Authentication Middleware

**Context:** Securing administrative statistical data and coupon endpoints.

**Options Considered:**
- **Option A:** Leave administrative API endpoints public.
- **Option B:** Implement lightweight header token validation middleware (`x-admin-token`).

**Choice:** Option B.

**Why:** Exposing revenue figures and coupon creation poses a security risk. A simple configuration header secures routes without full auth complexity.

---

## Decision: Pricing and Input Integrity

**Context:** Preventing clients from injecting custom prices or negative quantities.

**Options Considered:**
- **Option A:** Trust price and quantity details sent in the client request payload.
- **Option B:** Reject negative quantities in validation and query product prices strictly from the server catalog.

**Choice:** Option B.

**Why:** Restricts price-manipulation exploits. The server remains the absolute source of truth for pricing.

---

## Decision: Proactive Dashboard Indicators in Admin Stats API

**Context:** Exposing coupon eligibility feedback to the administrator dashboard.

**Options Considered:**
- **Option A:** Expose only raw checkout count, requiring manual client calculation.
- **Option B:** Expose helper fields (`isCouponGenerationEligible`, `eligibleCouponsCount`, `ordersNeededForNextCoupon`).

**Choice:** Option B.

**Why:** Allows dashboards to easily toggle generate buttons and render milestone progress bars dynamically.
