# TrueHarbor — Technical Requirements Document (TRD)

| | |
|---|---|
| **Version** | 1.0 (Draft) |
| **Owner** | Cliny |
| **Companion docs** | [PRD.md](./PRD.md) · [architecture.md](./architecture.md) · [api.md](./api.md) |

> **Purpose of this document:** the PRD says *what*; the TRD says *how* and, just as importantly, *why this way*. Every significant choice includes its rationale.

---

## 1. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | **Laravel 11** (PHP 8.3) | Mature framework: routing, validation, Eloquent ORM, queues, scheduler, testing built in |
| API auth | **Laravel Sanctum** (token-based) | First-party, simple, fits an SPA + API split |
| Frontend | **React 18 + Vite** | Fast dev server, widely recognised stack |
| Routing / data | React Router, TanStack Query | Router for pages; Query handles caching, loading and error states for server data |
| HTTP client | Axios | Interceptors for attaching the auth token and handling 401s |
| Database | **Supabase (managed PostgreSQL 15+)** | Relational data + transactions + row locking (see ADR-001) |
| Payments | **Stripe** (test mode) PaymentIntents + webhooks | Card data never touches our servers |
| File storage | Supabase Storage (product images) | Already part of the Supabase project; public bucket for product images |
| Testing | PHPUnit/Pest (backend), Vitest + Testing Library (frontend) | Cover the critical flows |
| CI | GitHub Actions | Run tests + lint on each push |
| Hosting | Vercel (frontend), Railway or Render (backend) | Free/cheap tiers suitable for a demo |

## 2. Repository Structure

```
TrueHarbor/
├── Frontend/     React SPA (Vite)
├── Backend/      Laravel API
├── Database/     ERD, seeds, local Postgres docker-compose, connection notes
└── docs/         PRD, TRD, architecture, API reference, ADRs
```

Laravel migrations live in `Backend/database/migrations` because Laravel executes them from there. They are the **single source of truth** for the schema. The `Database/` folder holds everything *around* the schema (ERD, seed data, local setup) so nothing is duplicated.

## 3. Data Model

All money columns are **integer cents** (`price_cents`). Floats cannot represent decimal currency exactly (e.g. `0.1 + 0.2 ≠ 0.3`), which causes rounding bugs in totals.

### 3.1 Tables

**users**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| email | string, unique | |
| password | string | bcrypt/argon hash |
| role | string | `customer` (default) or `admin` — backed by a PHP enum |
| timestamps | | |

**categories**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| slug | string, unique | used in URLs |

**products**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| category_id | FK → categories | |
| name | string | |
| slug | string, unique | |
| description | text | |
| price_cents | unsigned int | |
| stock | unsigned int | current available units |
| image_path | string, nullable | |
| is_active | boolean | hidden when false |
| timestamps | | |

Indexes: `slug` (unique), `category_id`, `is_active`; a trigram or `ILIKE`-friendly index on `name` for search.

**carts** — one per user
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users, unique | |

**cart_items**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| cart_id | FK → carts | |
| product_id | FK → products | |
| quantity | unsigned int | |

Unique constraint on `(cart_id, product_id)` so the same product is one row with a quantity.

**orders**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users | |
| status | string | enum: `pending, paid, shipped, delivered, cancelled, expired` |
| subtotal_cents | unsigned int | |
| shipping_cents | unsigned int | flat fee in v1 |
| total_cents | unsigned int | |
| shipping_address | jsonb | name, line1, line2, city, province, postal_code, phone |
| payment_intent_id | string, nullable, unique | Stripe reference |
| expires_at | timestamp | when an unpaid order is released |
| paid_at | timestamp, nullable | |
| timestamps | | |

**order_items**
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders | |
| product_id | FK → products, nullable | nullable so deleting a product keeps history |
| product_name | string | **snapshot** at purchase |
| unit_price_cents | unsigned int | **snapshot** at purchase |
| quantity | unsigned int | |

**processed_webhook_events** — idempotency log
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| stripe_event_id | string, unique | |
| processed_at | timestamp | |

### 3.2 Relationships

```
users 1──1 carts 1──* cart_items *──1 products *──1 categories
users 1──* orders 1──* order_items *──1 products
```

**Why snapshot name and price on `order_items`?** A product's price will change later. An old order must still show what the customer actually paid. Never compute historical totals from the live product row.

## 4. Core Business Logic

### 4.1 Order creation (the critical path)

Implemented in `OrderService::createFromCart()`, inside **one database transaction**:

1. Load the user's cart items.
2. Lock the affected product rows: `Product::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()`.
3. For each item, verify `stock >= quantity` and `is_active`. If not, abort and return a clear error.
4. Decrement `stock` for each product.
5. Compute subtotal, shipping, and total **on the server** from locked product rows.
6. Create the `orders` row (`pending`, `expires_at = now + 30 min`) and `order_items` with snapshots.
7. Clear the cart.
8. Commit, then create the Stripe PaymentIntent and store `payment_intent_id`.

**Why lock rows?** Without `lockForUpdate`, two simultaneous requests can both read `stock = 1`, both pass the check, and both decrement — overselling. The lock makes the second request wait until the first commits, then it sees `stock = 0` and fails cleanly.

**Why order by `id` when locking?** If two transactions lock the same rows in different orders, they can deadlock. A consistent ordering prevents that.

### 4.2 Payment confirmation

- The browser confirms the card with Stripe.js using the PaymentIntent `client_secret`.
- Stripe then calls `POST /api/webhooks/stripe` (`payment_intent.succeeded`).
- The webhook handler verifies the **signature**, checks `processed_webhook_events` for the event id (idempotency), and then marks the order `paid` and sets `paid_at`.

**Why webhook, not the frontend redirect?** The browser can be closed, blocked, or tampered with. A client-side "success" signal must never be trusted. The webhook is server-to-server and signed.

### 4.3 Expiry of unpaid orders

A scheduled command (`orders:expire-pending`, runs every minute) finds `pending` orders with `expires_at < now()`, sets them to `expired`, and **restores stock** inside a transaction. It also cancels the Stripe PaymentIntent.

### 4.4 Order status transitions

```
pending ──► paid ──► shipped ──► delivered
   │          │
   ├──► expired
   └──► cancelled ◄──┘  (cancel allowed from pending or paid, not after shipped)
```

Transitions are validated in the `OrderStatus` enum (`canTransitionTo()`). Invalid transitions return `422`. Cancelling a paid order restores stock (and in a real system would trigger a refund — in v1 this is a documented manual step).

## 5. Authentication and Authorization

- **Sanctum personal access tokens.** Login returns a token; the SPA sends `Authorization: Bearer <token>`.
- **Roles:** `role` column + `EnsureUserIsAdmin` middleware on all `/api/admin/*` routes.
- **Policies:** `OrderPolicy` ensures a customer can only view or cancel **their own** orders (prevents IDOR — accessing another user's order by changing the ID).
- **Rate limiting:** stricter throttle on `/auth/login` and `/auth/register`.
- Passwords hashed by Laravel's default hasher.

> **Token storage trade-off:** localStorage is simple but exposed to XSS; httpOnly cookies (Sanctum SPA mode) are safer but need same-site domain setup. v1 uses bearer tokens for simplicity across separately hosted domains; this trade-off is recorded in ADR-003.

## 6. API Conventions

Full endpoint reference: [api.md](./api.md).

- REST, JSON only, prefix `/api`.
- Validation via Laravel **FormRequest** classes; failures return `422` with field errors.
- Responses shaped by **API Resources** so the DB schema is not leaked directly.
- Consistent error envelope:
  ```json
  { "message": "Insufficient stock for 'Product X'.", "errors": { "items.0.quantity": ["Only 2 left."] } }
  ```
- Pagination via `?page=` and `?per_page=` with a `meta` block.

## 7. Backend Layering

| Layer | Responsibility | Must not |
|---|---|---|
| Routes (`routes/api.php`) | Map URLs to controllers, apply middleware | Contain logic |
| Controllers | Receive request, call a service, return a Resource | Contain business rules |
| FormRequests | Validate and authorize input | |
| Services | Business logic (cart, order, payment) | Know about HTTP |
| Models | Persistence, relationships, scopes | Hold workflow logic |
| Policies / Middleware | Access control | |

**Why this separation?** Services can be unit-tested without HTTP, and controllers stay small and readable.

## 8. Frontend Technical Design

- **Feature-based folders** (`features/catalog`, `cart`, `checkout`, `orders`, `auth`) so each business area is self-contained; `components/` holds only generic UI.
- **All HTTP in `src/api/`** — a single Axios client attaches the token and redirects to login on `401`.
- **Server state** with TanStack Query (caching, refetch, loading/error states). **Client state** (auth user, cart badge) with React Context.
- **Protected routes** wrapper for customer pages and an `AdminRoute` wrapper for admin pages. *These are a UX convenience only — the backend is the real enforcement.*
- Prices received in cents and formatted at the edge via `formatPrice()`.
- Stripe Elements for the card form.

## 9. Security Requirements

| Concern | Measure |
|---|---|
| SQL injection | Eloquent / query builder bindings only |
| Mass assignment | Explicit `$fillable` on models |
| Price tampering | Server recomputes all totals; client price is ignored |
| IDOR | Policies on order and cart access |
| Webhook forgery | Stripe signature verification |
| Replay / duplicates | Idempotency table for webhook events |
| CORS | Allow only the deployed frontend origin |
| Secrets | Environment variables only; `.env` git-ignored; `.env.example` committed |
| Brute force | Throttling on auth routes |
| File uploads | Validate type and size; store in Supabase Storage |

## 10. Supabase + Laravel Connection Notes

- Use the **pgsql** driver (`DB_CONNECTION=pgsql`).
- Use the **direct connection** or the **session pooler** for Laravel. The **transaction pooler** (port 6543) does not support prepared statements the way PDO expects, which can cause intermittent errors.
- Require SSL (`DB_SSLMODE=require`).
- Laravel owns the schema via migrations. Do **not** also manage the same tables through the Supabase dashboard.
- Supabase Auth is **not used**; Sanctum is the only auth system. Running two avoids no problems and creates several.

## 11. Testing Strategy

| Type | Scope | Examples |
|---|---|---|
| Unit | Services and enums | Order total calculation; status transition rules |
| Feature (API) | Endpoints end to end against a test DB | Register/login; add to cart; checkout; admin-only access |
| **Concurrency** | Race on last unit | Two checkouts of the same last item → exactly one succeeds |
| Webhook | Signature + idempotency | Same event twice → order paid once |
| Frontend | Components and key flows | Cart quantity update, protected route redirect |

Target: the checkout, payment webhook, and authorization paths are fully covered.

## 12. CI/CD and Environments

- **GitHub Actions:** on push/PR → install deps, run Pest + Pint (PHP lint), run Vitest + ESLint, build the frontend.
- **Environments:** `local` (Docker Postgres from `Database/`), `production` (Supabase + hosted apps).
- **Config:** `.env.example` in both `Frontend/` and `Backend/` documents every variable (DB credentials, Stripe keys, webhook secret, CORS origin, API base URL).
- **Scheduler:** `php artisan schedule:run` every minute (Railway/Render cron) to expire pending orders.

## 13. Architectural Decision Records (summary)

| ADR | Decision | Rationale |
|---|---|---|
| 001 | **Supabase (Postgres) over Firebase** | Ecommerce data is relational and needs multi-row transactions and locking. Laravel supports Postgres natively and has no first-class Firestore support. |
| 002 | **Sanctum, not Supabase Auth** | One auth system, native to Laravel, integrates with policies and middleware. |
| 003 | **Bearer tokens for the SPA** | Frontend and API are hosted on different domains; simpler than cookie/CSRF setup. Trade-off: XSS exposure. |
| 004 | **Prices as integer cents** | Avoids floating-point rounding errors. |
| 005 | **Mark paid only via webhook** | Client signals are untrusted. |
| 006 | **Reserve stock at order creation + expiry job** | Prevents overselling while avoiding permanently held stock. |
| 007 | **Separate SPA + API** | Clear contract between layers; demonstrates API design. |

## 14. Out of Scope (v1) — Technical
Refund automation, email delivery, search engine (Meilisearch/Elastic), CDN image transforms, queue workers for heavy jobs, multi-warehouse inventory.
