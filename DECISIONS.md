# Design Decisions

This document details the architectural and implementation design decisions made while developing the E-Commerce Store APIs.

---

## Decision: Layered Architecture Pattern

**Context:** Organizing the codebase structure to promote readability, testability, and future scalability.

**Options Considered:**
- **Option A (Monolithic Controllers):** Controllers handle HTTP routing, request parsing, request body validation, business logic calculations, and database calls in a single monolithic controller handler.
- **Option B (Layered Architecture):** Decouple the codebase into modular layers: Routes $\rightarrow$ Request Validation $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Data Repository.

**Choice:** Option B (Layered Architecture).

**Why:** Decoupling separation of concerns is a standard enterprise engineering practice:
* **Routes** only deal with URL endpoints mounting and middleware execution order.
* **Request Validation** filters out bad inputs immediately before executing code.
* **Controllers** deal strictly with HTTP status codes, request parsing, and error formatting.
* **Services** contain pure business logic (independent of Express, HTTP headers, etc.), making them incredibly easy to unit test.
* **Repositories** focus strictly on data storage, queries, and mutations.

---

## Decision: Generic Schema Validation Middleware using Zod

**Context:** Preventing malformed JSON payloads, negative bounds (e.g. quantity -5), and type injection attacks before it reaches core business layers.

**Options Considered:**
- **Option A (Inline Handler Validation):** Validate requests manually in each controller using standard `if/else` checks.
- **Option B (Generic Zod Validation Middleware):** Create a single reusable validation middleware `validate(schema)` that parses the request body against a schema and sanitizes the inputs.

**Choice:** Option B (Generic Zod Validation Middleware).

**Why:** Using a reusable middleware decouples validation from controllers. Since Zod v4 automatically strips out untracked properties (`safeParse`), it prevents parameters injection (e.g., users attempting to inject pricing values). It isolates validation failures, keeping controllers and services completely clean.

---

## Decision: Suffix Randomization on Milestone Coupons

**Context:** Protecting the store from brute-forcing or guessing valid generated coupons.

**Options Considered:**
- **Option A (Sequential Codes):** Generate predictable codes like `DISCOUNT-ORD5`, `DISCOUNT-ORD10`.
- **Option B (Cryptographically Randomized Suffixes):** Append a high-entropy random hex suffix to the coupon (e.g., `DISCOUNT-ORD5-A4F8K9`).

**Choice:** Option B (Cryptographically Randomized Suffixes).

**Why:** Predictable codes enable enumeration attacks. An attacker could query the server iteratively to find valid discount codes and apply them before the intended recipients do. Appending a random 6-character hex suffix makes brute-forcing computationally infeasible.

---

## Decision: Milestone-Based Coupon Expiration Rule (7 Days)

**Context:** Defining coupon validity limits to prevent long-term liabilities and emulate real-world business environments.

**Options Considered:**
- **Option A (Indefinite Expiration):** Milestone coupons remain valid forever until consumed.
- **Option B (Time-Bound Expiration):** Coupons automatically expire exactly 7 days after generation.

**Choice:** Option B (Time-Bound Expiration).

**Why:** Setting a 7-day expiration (Jersey number 7, aka Thala for a reason!) mirrors professional loyalty reward designs, preventing the accumulation of unused discount liabilities on the store. It requires checking timestamps (`expiresAt.getTime() < Date.now()`) during checkout to assert validity.

---

## Decision: Statistics Counter Definitions for "Items Purchased"

**Context:** Designing the e-commerce analytics aggregates for tracking sales volume.

**Options Considered:**
- **Option A (Unique Products Count):** Count unique product categories sold (e.g., buying 3 Laptops counts as 1 item purchased).
- **Option B (Total Product Units Count):** Count total physical product units sold (e.g., buying 3 Laptops counts as 3 items purchased).

**Choice:** Option B (Total Product Units Count).

**Why:** In inventory management and standard retail analytics (like Shopify or Flipkart), sales volume is calculated by summing the total number of physical items sold (`quantity`). We aggregate statistics by summing up the quantities of all line items inside completed orders.

---

## Decision: Singleton Repository Pattern

**Context:** Ensuring database state consistency across the multi-layered architecture within a single process.

**Options Considered:**
- **Option A (New Class Instantiations):** Create new repository instances in each service file as needed.
- **Option B (Singleton Pattern):** Implement a static `getInstance()` constructor that guarantees a single repository instance is shared globally.

**Choice:** Option B (Singleton Pattern).

**Why:** Since we are using an in-memory database, instantiating new repository objects would create isolated maps, causing data conflicts where the Cart Service edits a cart that the Checkout Service cannot see. The Singleton pattern ensures there is a single, unified database state in memory.
