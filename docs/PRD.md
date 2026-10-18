# TrueHarbor — Product Requirements Document (PRD)

| | |
|---|---|
| **Version** | 1.0 (Draft) |
| **Owner** | Cliny |
| **Status** | Ready for technical design |
| **Companion docs** | [TRD.md](./TRD.md) · [architecture.md](./architecture.md) · [api.md](./api.md) |

> **Purpose of this document:** the PRD defines *what* we are building and *why*. It deliberately avoids implementation detail — that lives in the TRD.

---

## 1. Overview

TrueHarbor is a full-stack ecommerce web application where customers browse a product catalog, manage a shopping cart, pay online, and track their orders. Administrators manage products and fulfil orders.

The product is built as a **portfolio project**. That changes what "success" means: the app must work end to end, but it must also *demonstrate engineering judgment* — correct handling of money, inventory, payments, and access control — in a way a reviewer can verify from the repository and the live demo.

## 2. Goals and Non-Goals

### Goals
1. Deliver a complete purchase flow: browse → cart → checkout → payment → order tracking.
2. Handle **money and inventory correctly** (no float prices, no overselling, no double-charging).
3. Provide a role-based admin area to manage products and orders.
4. Ship a deployed, publicly viewable demo with test-mode payments.
5. Produce clear documentation and tests that show *how* and *why* decisions were made.

### Non-Goals (v1)
- Real money movement (Stripe **test mode** only).
- Multi-vendor marketplace, subscriptions, or digital goods.
- Native mobile apps.
- Advanced recommendation engines or personalization.
- Multi-currency and tax engines (single currency: PHP).

## 3. Users and Roles

| Role | Description | Key needs |
|---|---|---|
| **Guest** | Unauthenticated visitor | Browse and search products, view product details |
| **Customer** | Registered user | Cart, checkout, pay, view order history |
| **Admin** | Store operator | Manage catalog, view and update orders |

## 4. User Stories

### Guest
- As a guest, I can browse products by category so I can find what I want.
- As a guest, I can search and sort products so I can narrow results quickly.
- As a guest, I can view a product page with images, price, and stock status.

### Customer
- As a customer, I can register and log in so my cart and orders are saved.
- As a customer, I can add, update, and remove items in my cart.
- As a customer, I can check out with a shipping address and pay by card.
- As a customer, I can see my past orders and their current status.
- As a customer, I can cancel an order that has not shipped yet.

### Admin
- As an admin, I can create, edit, hide, and delete products and categories.
- As an admin, I can see all orders and filter them by status.
- As an admin, I can move an order through its fulfilment statuses.
- As an admin, I can see low-stock products at a glance.

## 5. Functional Requirements

Priority: **P0** = must have for v1 · **P1** = should have · **P2** = nice to have.

### 5.1 Authentication and Accounts
| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-1 | Users can register with name, email, and password | P0 |
| FR-AUTH-2 | Users can log in and log out | P0 |
| FR-AUTH-3 | The system distinguishes `customer` and `admin` roles | P0 |
| FR-AUTH-4 | Admin-only features are inaccessible to customers and guests | P0 |
| FR-AUTH-5 | Password reset via email | P2 |

### 5.2 Catalog
| ID | Requirement | Priority |
|---|---|---|
| FR-CAT-1 | List products with pagination | P0 |
| FR-CAT-2 | Filter by category and price range | P0 |
| FR-CAT-3 | Search by product name | P0 |
| FR-CAT-4 | Sort by price and newest | P1 |
| FR-CAT-5 | Product detail page shows price, description, images, and stock state | P0 |
| FR-CAT-6 | Inactive products are hidden from customers | P0 |

### 5.3 Cart
| ID | Requirement | Priority |
|---|---|---|
| FR-CART-1 | Logged-in users have a persistent server-side cart | P0 |
| FR-CART-2 | Add, change quantity, remove, and clear cart items | P0 |
| FR-CART-3 | Quantity cannot exceed available stock | P0 |
| FR-CART-4 | Cart totals are computed by the server, never trusted from the client | P0 |
| FR-CART-5 | Guest cart in local storage merged on login | P2 |

### 5.4 Checkout, Orders, and Payments
| ID | Requirement | Priority |
|---|---|---|
| FR-ORD-1 | Checkout collects a shipping address and creates an order | P0 |
| FR-ORD-2 | Stock is reserved when the order is created | P0 |
| FR-ORD-3 | Two buyers can never purchase the same last unit | P0 |
| FR-ORD-4 | Payment is taken via Stripe (test mode) | P0 |
| FR-ORD-5 | An order becomes `paid` only after server-confirmed payment | P0 |
| FR-ORD-6 | Unpaid orders expire and release their reserved stock | P0 |
| FR-ORD-7 | Order items store a snapshot of name and price at purchase time | P0 |
| FR-ORD-8 | Customers can view their order history and details | P0 |
| FR-ORD-9 | Customers can cancel orders that are not yet shipped | P1 |
| FR-ORD-10 | Order confirmation email | P2 |

**Order lifecycle:** `pending → paid → shipped → delivered`, with `cancelled` and `expired` as terminal side-states.

### 5.5 Admin
| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-1 | CRUD for products (name, description, price, stock, image, active flag) | P0 |
| FR-ADM-2 | CRUD for categories | P0 |
| FR-ADM-3 | View and filter all orders | P0 |
| FR-ADM-4 | Update order status following the allowed transitions | P0 |
| FR-ADM-5 | Low-stock indicator | P1 |
| FR-ADM-6 | Sales summary dashboard | P2 |

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Correctness** | Prices stored as integer cents. Order creation is atomic. No overselling under concurrent requests. |
| **Security** | Passwords hashed. All mutating endpoints authenticated. Role checks enforced on the server. Payment webhooks verified by signature. No card data ever touches our servers. |
| **Performance** | Catalog list responds in under 500 ms on the demo dataset. Pages are paginated. |
| **Reliability** | Webhook handling is idempotent (safe to receive the same event twice). |
| **Usability** | Responsive layout (mobile and desktop). Clear loading, empty, and error states. |
| **Maintainability** | Layered backend, feature-based frontend, automated tests on critical flows. |
| **Observability** | Structured logs for orders and payment events. |

## 7. Success Criteria

The project is "done" when:
1. A new visitor can register, buy a product with a Stripe test card, and see the order as `paid`.
2. An admin can fulfil that order through to `delivered`.
3. A concurrency test proves two simultaneous purchases of the last unit result in exactly one success.
4. CI passes (tests + lint) on every push.
5. The app is deployed and the README explains setup, architecture, and key decisions.

## 8. Milestones

| # | Milestone | Outcome |
|---|---|---|
| M1 | Foundation | API + SPA skeleton, DB connected, auth working |
| M2 | Catalog | Browse, search, filter, product detail |
| M3 | Cart | Persistent server-side cart |
| M4 | Checkout and orders | Atomic order creation, stock reservation, status flow |
| M5 | Payments | Stripe test payments confirmed by webhook |
| M6 | Admin | Product and order management with role protection |
| M7 | Polish and deploy | Tests, CI, deployment, README |

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Overselling stock under concurrency | Incorrect orders | Row-level locking inside a DB transaction; concurrency test |
| Marking orders paid from the browser | Fraudulent "paid" orders | Mark paid only from the verified Stripe webhook |
| Abandoned checkouts hold stock forever | Lost sales | Scheduled job expires pending orders and restores stock |
| Scope creep | Never finishing | Strict P0 first; P1/P2 only after M7 |
| Supabase pooling quirks with Laravel | Mysterious DB errors | Use the session pooler / direct connection; documented in TRD |

## 10. Assumptions and Open Questions

- **Assumption:** the database is Supabase (managed PostgreSQL). *Confirm before M1; Firebase is not recommended for this relational domain — see the ADR in the TRD.*
- **Assumption:** single currency (PHP), single warehouse, flat shipping fee.
- **Open:** what product category will the demo store sell? (Affects seed data and imagery only.)
- **Open:** is email sending (order confirmation, password reset) in scope for v1? Currently P2.

## 11. Future Enhancements (post-v1)
Wishlist, product reviews, discount codes, guest checkout, order emails, inventory history, sales analytics, and localized payment methods (e.g. GCash/Maya via a PH payment provider).
