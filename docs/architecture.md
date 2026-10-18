# TrueHarbor — Architecture

| | |
|---|---|
| **Version** | 1.0 (Draft) |
| **Companion docs** | [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [api.md](./api.md) |

> **Purpose of this document:** a visual and conceptual map of how the pieces fit together and how data flows through them. For schema, rules, and rationale in detail, see the TRD.

---

## 1. System Context

```mermaid
flowchart LR
    Guest([Guest / Customer]) -->|HTTPS| SPA[React SPA<br/>Vercel]
    Admin([Admin]) -->|HTTPS| SPA
    SPA -->|JSON over HTTPS<br/>Bearer token| API[Laravel API<br/>Railway / Render]
    SPA -->|Card details<br/>Stripe.js| Stripe[(Stripe)]
    API -->|PostgreSQL<br/>SSL| DB[(Supabase Postgres)]
    API -->|Images| Storage[(Supabase Storage)]
    API -->|Create PaymentIntent| Stripe
    Stripe -->|Signed webhook| API
```

**Key idea:** card details go from the browser **directly to Stripe**. Our servers only ever see a PaymentIntent id and the webhook result, so we never handle raw card data.

## 2. Containers (Deployable Units)

| Container | Tech | Responsibility | Hosted on |
|---|---|---|---|
| **Frontend** | React + Vite | UI, routing, calls the API, hosts Stripe Elements | Vercel |
| **Backend** | Laravel 11 | Business rules, auth, orders, webhooks, scheduler | Railway / Render |
| **Database** | Supabase Postgres | Persistent relational data | Supabase |
| **Object storage** | Supabase Storage | Product images | Supabase |
| **Payments** | Stripe (test mode) | Card processing | Stripe |

## 3. Backend Layered Architecture

```mermaid
flowchart TD
    R[routes/api.php] --> M[Middleware<br/>auth:sanctum, admin, throttle]
    M --> C[Controllers<br/>thin]
    C --> FR[FormRequests<br/>validation]
    C --> S[Services<br/>CartService, OrderService, PaymentService]
    S --> MO[Models / Eloquent]
    S --> P[Policies<br/>authorization]
    MO --> DB[(PostgreSQL)]
    C --> RES[API Resources<br/>response shaping]
```

**Rule of thumb:** a request flows *down* the layers and a response flows back *up*. Business rules live only in Services, so they are testable without HTTP and reusable (for example by the scheduler).

| Layer | Example |
|---|---|
| Controller | `OrderController@store` — validates, calls `OrderService`, returns `OrderResource` |
| Service | `OrderService::createFromCart()` — transaction, locking, snapshots |
| Model | `Order`, `Product` — relationships and scopes |
| Policy | `OrderPolicy@view` — owner or admin only |

## 4. Frontend Architecture

```mermaid
flowchart TD
    Router[React Router] --> Pages[pages/]
    Pages --> Features[features/<br/>auth · catalog · cart · checkout · orders · admin]
    Features --> Hooks[hooks/ + TanStack Query]
    Hooks --> Api[api/ — Axios client]
    Api -->|Bearer token| Backend[(Laravel API)]
    Features --> UI[components/<br/>generic UI]
    Ctx[context/<br/>AuthContext · CartContext] --> Features
```

- **Server state** (products, orders) → TanStack Query: caching, loading and error states handled for you.
- **Client state** (current user, cart badge count) → React Context.
- **One Axios instance** attaches the token and handles `401` globally.

## 5. Key Flows

### 5.1 Authentication

```mermaid
sequenceDiagram
    participant U as User (React)
    participant A as Laravel API
    participant D as Postgres
    U->>A: POST /api/auth/login {email, password}
    A->>D: find user, verify password hash
    D-->>A: user
    A-->>U: 200 {token, user}
    U->>U: store token, set AuthContext
    U->>A: GET /api/cart (Authorization: Bearer token)
    A-->>U: 200 cart
```

### 5.2 Checkout and Payment (the most important flow)

```mermaid
sequenceDiagram
    participant U as Customer (React)
    participant A as Laravel API
    participant D as Postgres
    participant S as Stripe

    U->>A: POST /api/checkout {shipping_address}
    A->>D: BEGIN
    A->>D: SELECT products ... FOR UPDATE (locks rows)
    A->>D: verify stock, decrement stock
    A->>D: INSERT order (pending) + order_items (snapshots)
    A->>D: clear cart
    A->>D: COMMIT
    A->>S: create PaymentIntent (amount = order total)
    S-->>A: client_secret
    A-->>U: 201 {order, client_secret}
    U->>S: confirm card payment (Stripe.js)
    S-->>U: result (UX only — NOT trusted)
    S->>A: POST /api/webhooks/stripe (signed)
    A->>A: verify signature + idempotency check
    A->>D: order.status = paid, paid_at = now
    U->>A: GET /api/orders/{id}
    A-->>U: order (status: paid)
```

**Why this shape?**
- Stock is locked and reserved *inside one transaction* → no overselling.
- The Stripe call happens *after* commit → we never hold database locks while waiting on a network call.
- The order becomes `paid` *only* from the signed webhook → the browser can't lie.

### 5.3 Concurrent Purchase of the Last Unit

```mermaid
sequenceDiagram
    participant A as Buyer A
    participant B as Buyer B
    participant API as Laravel
    participant D as Postgres
    A->>API: checkout (last unit)
    B->>API: checkout (last unit)
    API->>D: A: SELECT ... FOR UPDATE (lock acquired)
    API->>D: B: SELECT ... FOR UPDATE (waits)
    API->>D: A: stock 1 → 0, insert order, COMMIT
    D-->>API: B's lock released, reads stock = 0
    API-->>B: 422 "Out of stock"
    API-->>A: 201 order created
```

### 5.4 Expiry of Unpaid Orders

```mermaid
flowchart LR
    Cron[Scheduler<br/>every minute] --> Cmd[orders:expire-pending]
    Cmd --> Q[find pending orders<br/>expires_at < now]
    Q --> Tx[transaction:<br/>status = expired<br/>restore stock]
    Tx --> Cancel[cancel Stripe PaymentIntent]
```

## 6. Order State Machine

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> paid: webhook succeeded
    pending --> expired: not paid in time
    pending --> cancelled: customer cancels
    paid --> shipped: admin
    paid --> cancelled: customer/admin (stock restored)
    shipped --> delivered: admin
    delivered --> [*]
    expired --> [*]
    cancelled --> [*]
```

## 7. Data Architecture

```mermaid
erDiagram
    USERS ||--o| CARTS : has
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : "referenced by"
    CATEGORIES ||--o{ PRODUCTS : groups
    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "snapshotted into"
```

Column-level detail is in the TRD (§3).

## 8. Security Boundaries

```mermaid
flowchart LR
    subgraph Untrusted
        Browser[Browser / React]
    end
    subgraph Trusted
        API[Laravel API]
        DB[(Postgres)]
    end
    Browser -- "never trusted for prices,<br/>totals, roles, payment status" --> API
    API --> DB
    Stripe[(Stripe)] -- "signed webhook = trusted" --> API
```

| Boundary rule | Enforced by |
|---|---|
| Client cannot set prices or totals | Server recomputes from DB |
| Client cannot claim admin | `role` checked server-side via middleware |
| Client cannot see others' orders | `OrderPolicy` |
| Client cannot mark an order paid | Only signed Stripe webhook can |
| Frontend route guards | UX convenience only, not security |

## 9. Deployment Topology

```
                  ┌──────────────┐
   Browser ─────► │   Vercel     │  static React build
                  └──────┬───────┘
                         │ HTTPS (CORS: Vercel origin only)
                  ┌──────▼───────┐        ┌────────────────┐
                  │ Railway /    │ ─────► │ Supabase       │
                  │ Render       │  SSL   │ Postgres +     │
                  │ Laravel API  │        │ Storage        │
                  │ + scheduler  │        └────────────────┘
                  └──────▲───────┘
                         │ signed webhook
                  ┌──────┴───────┐
                  │   Stripe     │
                  └──────────────┘
```

| Environment | Frontend | Backend | DB |
|---|---|---|---|
| Local | `npm run dev` (Vite) | `php artisan serve` | Docker Postgres (`Database/docker-compose.yml`) |
| Production | Vercel | Railway / Render | Supabase |

## 10. Cross-Cutting Concerns

| Concern | Approach |
|---|---|
| Validation | FormRequests (backend) + light client-side checks (UX only) |
| Error handling | Consistent JSON error envelope; Axios interceptor maps errors to UI messages |
| Logging | Structured logs for order creation, payment events, expiry runs |
| Configuration | Environment variables; `.env.example` documents all keys |
| Testing | Unit (services), feature (API), concurrency, webhook, and frontend component tests |
| CI | GitHub Actions: lint + tests + build |

## 11. Scalability Notes (for discussion, not v1 scope)

- The API is **stateless** (token auth), so it can scale horizontally behind a load balancer.
- The database is the bottleneck for stock updates; row-level locking is scoped to the rows being purchased, so unrelated products don't contend.
- If checkout volume grew, the next steps would be: queue workers for emails and Stripe calls, Redis for caching and rate limiting, and a search service for catalog queries.
