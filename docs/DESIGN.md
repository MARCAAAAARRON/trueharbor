# TrueHarbor — Design System

| | |
|---|---|
| **Version** | 1.0 (Draft) |
| **Owner** | Cliny |
| **Companion docs** | [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [architecture.md](./architecture.md) · [api.md](./api.md) |

> **Purpose of this document:** the single source of truth for how TrueHarbor looks, reads, and behaves. Every value here is a *decision with a reason*, so it can be defended in a portfolio review and implemented without guessing.
>
> Items marked **(proposal)** are my suggestions where the logo doesn't decide anything (wordmark, fonts, taglines). Change them freely; the rest is derived from the logo itself.

---

## 1. Brand Foundation

### 1.1 What the logo tells us

The logo is a flat, two-color lighthouse: a striped tower, a lit lantern room with a flame-shaped window, and two pairs of beams radiating outward. It comes in two variants: **blue on white** and **white on a blue square**.

| Logo element | Meaning | How the design uses it |
|---|---|---|
| **The lighthouse** | Guidance, safety, a landmark you can find | Trust is the brand's core promise: you can find what you need and it arrives safely |
| **"Harbor"** | Arrival, shelter, a safe place to land | Calm, uncluttered layouts; reassuring checkout and order states |
| **"True"** | Honest, reliable, steady | Plain language, truthful stock and price information, no dark patterns |
| **Horizontal tower stripes** | Structure and rhythm | The *stripe motif*: a repeatable banding device for dividers, progress, and loading |
| **Beams** | Focus and direction | Used once, on the home hero, to draw the eye |
| **The flame window** | The one warm light in a cool scene | The *Lantern accent*: a single warm color reserved for "pay attention here" |

### 1.2 Personality

**Steady, clear, honest, quietly confident.** Think harbor signage, not a boutique. The interface should feel like a well-lit, well-organized dock: everything easy to read from a distance, nothing shouting.

| We are | We are not |
|---|---|
| Plain and direct | Clever or jokey |
| Calm and spacious | Dense and promotional |
| Crisp and structural | Soft, glossy, or gradient-heavy |
| Reassuring around money | Pressuring (no fake urgency, no countdown timers) |

### 1.3 Wordmark (proposal)

The logo is an icon only, so the wordmark is set in type:

- Written as one word, **TrueHarbor**, with a capital H.
- Set in **Barlow Semi Condensed, Bold (700)**, sentence-style capitals as written, never all caps.
- Color: Harbor Blue on light backgrounds, white on blue or Deep Tide backgrounds.
- Lockup: icon on the left, wordmark on the right, vertically centered. The wordmark's cap-height is about 40% of the icon's height; the gap between them equals the lantern-room width (see §2.2).

---

## 2. Logo Usage

### 2.1 Variants

| File | Use on | Notes |
|---|---|---|
| `logo-mark-blue.png` (blue on white/transparent) | White, Mist, and other light surfaces | The default for the header |
| `logo-mark-white.png` (white mark) | Harbor Blue, Deep Tide, and photographic dark areas | The default for the hero and footer |
| `logo-mark-on-blue.png` (white on Harbor Blue square) | App icon, favicon, social avatar | Already has its own background, so it works as a tile |

**Recommendation:** the supplied files are 500×500 PNGs. Because the logo is flat and two-color, trace it to **SVG** (it will stay crisp at every size and weigh under 2 KB) and keep the PNGs as fallbacks. Replace the Vite default `favicon.svg` with the traced logo.

### 2.2 Clear space and size

- **Clear space:** keep an empty margin on all sides equal to **the width of the lantern room** (the lit window block at the top of the tower). Nothing (text, edges, other icons) may enter it.
- **Minimum size:** icon alone, **24 px** tall on screen. Icon with wordmark, **120 px** wide. Below 24 px, use the white-on-blue tile variant, since the thin beams disappear at tiny sizes.
- **Header size:** 32 px icon with wordmark. **Footer:** same, in white.

### 2.3 Don'ts

- Don't recolor the mark outside the palette (no gradients, no amber lighthouse, no outlines).
- Don't place the blue mark on a mid-tone or busy photo. Use the white mark on a Deep Tide overlay instead.
- Don't stretch, rotate, or add shadows or glows.
- Don't crop the beams in the logo itself. (Cropping *in the hero artwork* is allowed; see §8.1, since it's a layout device, not the logo.)
- Don't animate the logo in the header.

---

## 3. Color

### 3.1 Brand blue, measured

The exact brand blue was sampled from the supplied logo files: **`#004AAD`**. Everything else in the palette is built around it.

### 3.2 Core palette

| Token | Name | Hex | Role |
|---|---|---|---|
| `--color-harbor` | **Harbor Blue** | `#004AAD` | Brand color: primary buttons, links, active states, hero band |
| `--color-tide` | **Deep Tide** | `#002459` | Primary text, footer, dark surfaces. A darker shade of the brand blue, used *instead of black* so the whole UI stays in one color family |
| `--color-lantern` | **Lantern** | `#FFC247` | The single warm accent. Taken from the lit window's role in the logo. Reserved for attention (see §3.4) |
| `--color-mist` | **Mist** | `#F3F6FB` | Page background alternate, product image backdrop, subtle panels |
| `--color-white` | **White** | `#FFFFFF` | Main surface, text on blue |
| `--color-slate` | **Slate** | `#4A5B78` | Secondary text, captions, helper text |

### 3.3 Support colors

| Token | Name | Hex | Role |
|---|---|---|---|
| `--color-fog` | **Fog** | `#D5DEEB` | Dividers, card borders (decorative only) |
| `--color-edge` | **Edge** | `#7A8AA5` | Input borders and other required UI boundaries |
| `--color-wash` | **Blue Wash** | `#E6EEFA` | Selected rows, info panels, hover background on light surfaces |
| `--color-sea` | **Sea Green** | `#1B7F5C` | Success, in-stock, delivered |
| `--color-buoy` | **Buoy Red** | `#C23A3A` | Errors, destructive actions, cancelled |

### 3.4 How the colors are spent

- **About 70% light surfaces** (White and Mist), **20% Harbor Blue and Deep Tide**, **under 10% everything else.**
- **Lantern is the "light" in the scene, so it's rare.** It is allowed in exactly these places:
  1. The cart item-count badge.
  2. The **Low stock** chip.
  3. A focus ring on dark or blue backgrounds.
  4. The one highlighted element in the hero (see §8.1).

  If Lantern appears more than once or twice per screen, it has stopped meaning anything. *Spend the boldness in one place.*
- **Blue and Deep Tide do the structural work.** Everything else is neutral.
- No gradients and no decorative color washes. The logo is flat; the UI stays flat.

### 3.5 Verified contrast (WCAG 2.1)

Ratios below were computed from the hex values. AA requires **4.5:1** for normal text and **3:1** for large text and UI component boundaries.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| White | Harbor Blue | **8.13:1** | AAA, safe for button and hero text |
| Harbor Blue | White | **8.13:1** | AAA, safe for links |
| Harbor Blue | Mist | **7.51:1** | AAA |
| Deep Tide | White | **15.04:1** | AAA, body text |
| Deep Tide | Mist | **13.88:1** | AAA |
| Slate | White | **6.87:1** | AA, secondary text |
| Slate | Mist | **6.34:1** | AA |
| Lantern | Harbor Blue | **5.06:1** | AA, readable on the hero |
| Deep Tide | Lantern | **9.35:1** | AAA, text on Lantern chips |
| White | Deep Tide | **15.04:1** | AAA, footer text |
| Sea Green | White | **4.96:1** | AA, success text |
| Buoy Red | White | **5.30:1** | AA, error text |
| White | Buoy Red | **5.30:1** | AA, destructive button text |
| Edge | White | **3.50:1** | Passes the 3:1 UI-boundary rule, used for inputs |
| Fog | White | **1.36:1** | **Fails for UI boundaries**, so Fog is for decorative dividers only, never an input border |

**Rules that follow from this table:**
- Never put **Lantern text on white** (it is too light). Lantern is a *fill* with Deep Tide text, or text on blue.
- Never use **Fog** as an input border. Use **Edge**.
- Tinted status badges use **Deep Tide text** on the tint, not green or red text on a light tint, because the pairs I tested for Sea Green and Buoy Red on their light tints came out below 4.5:1.

---

## 4. Typography

### 4.1 Typeface (proposal)

**One superfamily, two widths: Barlow.**

| Role | Font | Weights |
|---|---|---|
| **Display and headings** | **Barlow Semi Condensed** | 600, 700 |
| **Body and UI** | **Barlow** | 400, 500, 600 |

**Why Barlow:** it was drawn from the lettering on road and transit signs, which is the same practical, durable signage tradition as harbor markings. Its squared-off, sturdy shapes match the logo's blocky tower stripes. Using the semi-condensed width for headings and the regular width for body text gives a clear distinction while keeping a single coherent voice. It is free on Google Fonts and includes tabular numerals, which matter for prices.

Fallback stack:

```css
--font-display: "Barlow Semi Condensed", "Arial Narrow", system-ui, sans-serif;
--font-body: "Barlow", system-ui, -apple-system, "Segoe UI", sans-serif;
```

### 4.2 Type scale

Ratio **1.25 (major third)** from a 16 px base.

| Token | Size | Line height | Weight | Font | Use |
|---|---|---|---|---|---|
| `--text-display` | 49 px (3.0625rem) | 1.1 | 700 | Display | Home hero headline only |
| `--text-h1` | 39 px (2.4375rem) | 1.15 | 700 | Display | Page titles |
| `--text-h2` | 31 px (1.9375rem) | 1.2 | 600 | Display | Section titles |
| `--text-h3` | 25 px (1.5625rem) | 1.25 | 600 | Display | Card group titles |
| `--text-h4` | 20 px (1.25rem) | 1.3 | 600 | Display | Product names in lists, panel titles |
| `--text-body` | 16 px (1rem) | 1.55 | 400 | Body | Default text |
| `--text-small` | 14 px (0.875rem) | 1.5 | 400 | Body | Captions, helper text, table cells |
| `--text-micro` | 12 px (0.75rem) | 1.4 | 500 | Body | Badges and chips only |

On screens narrower than 768 px, scale `display` to 36 px, `h1` to 31 px, `h2` to 25 px. Everything else stays.

### 4.3 Rules

- **Line length:** keep paragraphs under **70 characters** (`max-width: 68ch`).
- **Sentence case everywhere**, including buttons, headings, and nav. No all-caps labels.
- **Prices** use **tabular numerals** (`font-variant-numeric: tabular-nums`) at weight 600, so columns of prices line up in carts and order tables.
- **Headings** carry the personality, so let them be big and plain. No decorative treatment such as coloring a single word.
- **Links** in running text are Harbor Blue and underlined. Navigation links are not underlined until hover or focus.
- Minimum body size is 16 px. Never go below 12 px.

---

## 5. Layout, Spacing, Shape

### 5.1 Spacing

Base unit **4 px**. Use only these steps:

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | 4 px | Icon-to-label gap |
| `--space-2` | 8 px | Tight groups, chip padding |
| `--space-3` | 12 px | Input padding |
| `--space-4` | 16 px | Default gap, card padding on mobile |
| `--space-6` | 24 px | Grid gutter, card padding on desktop |
| `--space-8` | 32 px | Between related blocks |
| `--space-12` | 48 px | Between sections on mobile |
| `--space-16` | 64 px | Between sections on desktop |
| `--space-24` | 96 px | Hero vertical padding |

### 5.2 Grid and breakpoints

- Container: **max-width 1200 px**, centered, with **16 px** side padding on mobile and **24 px** from 768 px up.
- 12 columns, **24 px** gutter (16 px on mobile).
- Product grid: **2 columns** under 768 px, **3** from 768, **4** from 1024.
- Breakpoints: **480 / 768 / 1024 / 1280** (`min-width`, mobile first).
- **Alignment:** body content is **left-aligned**. Center alignment is only for the logo, empty states, and short confirmation messages. Never center paragraphs.

### 5.3 Shape: a deliberate radius scale

The logo is made of crisp rectangles with only the slightest rounding, so the UI is **mostly square-ish**, with a small scale rather than one radius on everything:

| Token | Value | Applied to |
|---|---|---|
| `--radius-sm` | 2 px | Badges, chips, status tags |
| `--radius-md` | 4 px | Buttons, inputs, selects |
| `--radius-lg` | 8 px | Product cards, dialogs, panels, images |
| `--radius-full` | 999 px | Cart count badge, avatars only |

### 5.4 Elevation

Flat by default. Hierarchy comes from **borders and background tint**, not shadows.

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | 1 px Fog border, White on Mist or Mist on White | Cards, panels, table rows |
| 1 (floating) | `0 8px 24px rgb(0 36 89 / 0.16)` | Dropdowns, popovers, toasts |
| 2 (modal) | `0 16px 48px rgb(0 36 89 / 0.24)` plus a Deep Tide scrim at 60% | Dialogs |

The shadow color is Deep Tide, not black, so shadows stay in the blue family.

### 5.5 The stripe motif

The tower's alternating bands become the system's one decorative device. It is **structural**, not ornamental:

- **Section divider:** a 4 px band of Harbor Blue followed by an 8 px gap and a second 4 px band (two stripes). Used above the footer and under the home hero.
- **Progress:** order progress (`pending → paid → shipped → delivered`) is drawn as a horizontal row of stripes, each filled Harbor Blue as the order advances.
- **Loading skeletons:** product card placeholders pulse between Mist and Fog.

Use the motif in these places only.

---

## 6. Imagery and Iconography

### 6.1 Product photography

- **Square (1:1) crops** everywhere, so the grid stays even.
- A consistent, plain backdrop: **Mist** or white. No busy scenes in thumbnails.
- Display with `object-fit: cover`, `--radius-lg` corners, and a Fog border.
- Every `<img>` has **alt text equal to the product name** (the product page may describe more).
- Always set `width`/`height` or an aspect ratio so the page doesn't jump while images load.
- **Placeholder (dev only):** the seeded data uses picsum.photos random images. Replace them with real or consistent images before the portfolio goes public, because random photos undermine the "honest and clear" brand.

### 6.2 Icons

- **Lucide**, which is already React-friendly. Stroke width **1.75 px**, size **20 px** in UI and **24 px** in navigation.
- Color inherits the text color (`currentColor`). Never use Lantern for icons except the cart badge context.
- An icon alone must have an `aria-label`. Icons beside text are decorative (`aria-hidden`).
- Don't mix icon sets.

### 6.3 Logo-derived artwork

- A **large white lighthouse mark** (and its beam lines) is used once, on the home hero (§8.1).
- Don't scatter lighthouse clip-art through the interface.

---

## 7. Components

### 7.1 Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| **Primary** | Harbor Blue | White | none | One per view: "Add to cart", "Place order" |
| **Secondary** | White | Harbor Blue | 1 px Harbor Blue | "Continue shopping", "View order" |
| **On blue** | White | Harbor Blue | none | Primary action over the hero or footer |
| **Ghost** | transparent | Harbor Blue | none | Tertiary: "Clear cart" |
| **Destructive** | Buoy Red | White | none | "Cancel order", "Delete product" |

- Height **44 px** (touch target), horizontal padding 20 px, `--radius-md`, weight 600.
- **Hover:** Primary darkens to `#003A8A` (10.65:1 with white). Secondary and Ghost gain the Blue Wash background.
- **Disabled:** 45% opacity, `cursor: not-allowed`, and the reason is explained nearby in text (e.g. "Out of stock"), because color alone doesn't communicate disabled.
- **Loading:** keep the label, add a spinner, disable the button. Change the label to the in-progress form ("Placing order...").

### 7.2 Form fields

- Label **above** the input, 14 px weight 500. Never use placeholder text as the label.
- Input: 44 px tall, White background, **1 px Edge border**, `--radius-md`, 12 px padding.
- **Focus:** 2 px Harbor Blue ring with a 2 px offset (on dark backgrounds, Lantern).
- **Error:** border becomes Buoy Red, and a message appears **under the field** in Buoy Red 14 px with an error icon. This matches the per-field errors the Laravel API returns.
- Helper text under the field in Slate.
- Required fields are marked in the label text, not just with a red asterisk.

### 7.3 Product card

```
┌──────────────────────┐
│ ┌──────────────────┐ │   image: 1:1, Mist backdrop, radius-lg
│ │                  │ │
│ │      image       │ │
│ └──────────────────┘ │
│ Harbor Crew Tee      │   h4, Deep Tide, 2 lines max then clamp
│ ₱799.00              │   body 16/600, tabular numerals
│ ● In stock           │   14px, Sea Green dot + text
└──────────────────────┘
```

- The **whole card is one link** to the product page (a single tab stop, not separate image, title, and "View" links).
- 1 px Fog border, `--radius-lg`, 16 px padding (24 px on desktop). On hover, the border becomes Harbor Blue. No lift, no shadow, no zoom.
- **Out of stock:** image at 60% opacity, the label reads "Out of stock" (Slate), and the card remains clickable so people can still read about the product.

### 7.4 Stock and status chips

Chips are small (`--text-micro`, `--radius-sm`, 8 px horizontal padding) and **never rely on color alone**: each pairs a color dot or icon with text.

**Stock**

| State | Treatment |
|---|---|
| In stock | Sea Green dot + "In stock" (text in Sea Green, 4.96:1) |
| Low stock (5 or fewer) | **Lantern** fill, Deep Tide text: "Only 3 left" |
| Out of stock | Slate text: "Out of stock" |

**Order status** (Deep Tide text on a light tint, with a colored dot)

| Status | Tint | Dot | Label |
|---|---|---|---|
| `pending` | Fog | Slate | Awaiting payment |
| `paid` | Blue Wash | Harbor Blue | Paid |
| `shipped` | Blue Wash | Harbor Blue | Shipped |
| `delivered` | `#E3F3EC` | Sea Green | Delivered |
| `cancelled` | `#FBE9E9` | Buoy Red | Cancelled |
| `expired` | Fog | Slate | Expired |

Use customer-friendly labels, not raw enum values. The UI says "Awaiting payment", not "pending".

### 7.5 Cart badge

A `--radius-full` pill in **Lantern** with Deep Tide text (9.35:1), 20 px minimum size, sitting at the top right of the cart icon. It's the one place the warm light is always present: "your cart has something in it."

### 7.6 Header and footer

**Header:** White, 64 px tall, 1 px Fog bottom border, sticky. Left: logo lockup. Center or left: nav (Shop, categories). Right: search, account, cart with badge. On mobile: logo, search, cart, menu button.

**Footer:** Deep Tide background, white text, preceded by the two-stripe divider (§5.5). White mark and wordmark, a few plain links. Nothing else.

### 7.7 Toasts and feedback

- Appear bottom-center on mobile, bottom-right on desktop, with elevation level 1.
- **An action keeps the same name from button to toast:** the button "Add to cart" → toast "Added to cart".
- Errors don't auto-dismiss. Success toasts dismiss after 4 s.
- Announce with `role="status"` (success) or `role="alert"` (error).

### 7.8 Tables (orders, admin)

Header row Mist background with 14 px weight 600 text, rows divided by Fog lines, numeric columns right-aligned with tabular numerals. On mobile, tables collapse into stacked cards, one per row. Wide tables scroll inside their own container, never the page body.

---

## 8. Page Layout Concepts

### 8.1 Home hero: where the boldness goes

The home page opens with the **most characteristic thing in this brand's world**: the lighthouse, shown large.

```
┌────────────────────────────────────────────────────────────┐
│ [logo] TrueHarbor    Shop  Apparel  Home      🔍  👤  🛒 2 │  white header
├────────────────────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  full-bleed
│▓                                              ╲   │ ╱      ▓│  Harbor Blue
│▓  Everyday things,                             ╲ ┌┴┐ ╱     ▓│
│▓  found easily.                          ──────  │▒│  ──── ▓│  oversized white
│▓                                          ╱     ┌┴─┴┐  ╲   ▓│  lighthouse,
│▓  [ Shop all products ]                  ╱      │▒▒▒│   ╲  ▓│  cropped at
│▓                                                │▒▒▒│      ▓│  the right edge
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ═══════  (two-stripe divider)  ═══════                     │
│  Shop by category      [4 category tiles, left-aligned]    │
│  New arrivals          [product grid, 4 columns]           │
└────────────────────────────────────────────────────────────┘
```

- Headline left-aligned in white Display type, one short sentence, one button ("On blue" variant).
- The **white lighthouse** sits at the right, large enough that the tower is cropped by the edge of the band. Its beam lines extend leftward toward the headline, pointing at the text. (This is the only permitted crop of the artwork.)
- **Lantern** appears once here: the lantern-room window of the hero artwork glows in `#FFC247`. It is the single warm point in a cool field and the memorable moment of the whole site.
- Placeholder headline (proposal), replace with your real copy: "Everyday things, found easily."

### 8.2 Catalog

```
┌────────────────────────────────────────────────────────────┐
│ Products (20)                              Sort: [Newest ▾]│
├──────────────┬─────────────────────────────────────────────┤
│ Search [____]│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│              │  │card │ │card │ │card │ │card │            │
│ Category     │  └─────┘ └─────┘ └─────┘ └─────┘            │
│ ◉ All        │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ ○ Apparel    │  │card │ │card │ │card │ │card │            │
│ ○ Home       │  └─────┘ └─────┘ └─────┘ └─────┘            │
│              │                                             │
│ Price        │            ‹ 1  2 ›  pagination             │
│ [min]-[max]  │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

Filters sit in a left rail on desktop (collapsing into a "Filters" button and sheet on mobile). Active filters show as removable chips above the grid. The result count updates with every change.

### 8.3 Product detail

```
┌─────────────────────────┬──────────────────────────────────┐
│                         │ Apparel                          │  breadcrumb, Slate
│                         │ Harbor Crew Tee         (h1)     │
│       image (1:1)       │ ₱799.00                          │
│                         │ ● In stock                       │
│                         │ [ − 1 + ]  [ Add to cart ]       │
│                         │ ───────────────────────────────  │
│                         │ Description (max 68ch)           │
└─────────────────────────┴──────────────────────────────────┘
```

On mobile, the image stacks above the details, and **Add to cart** becomes a sticky bar at the bottom of the screen. The quantity selector can never exceed the real `stock` number.

### 8.4 Cart and checkout

- **Cart:** a list of rows (image, name, quantity stepper, line total) on the left; an order summary panel on the right (subtotal, shipping, total) with the single Primary button "Checkout".
- **Checkout:** a single column, shipping address first, then payment (Stripe Elements styled with Harbor Blue focus and Edge borders). Order total stays visible throughout. Show clearly that totals are final.
- **Trust cues near the payment button, plain and factual only:** "Payments are processed by Stripe. We never see your card number." No fake badges.
- **After payment:** a confirmation page with the order number, the stripe-progress row (§5.5), and a "View order" button.

### 8.5 Account and orders

Order list as a table (stacked cards on mobile) with status chips (§7.4). Order detail shows the progress stripes, items with their *snapshot* prices, and the shipping address.

### 8.6 Admin

Denser than the storefront: Mist page background, white panels, a left sidebar in Deep Tide. Use the same components with 14 px body text. Admin pages use the same palette but never the hero treatment.

---

## 9. Motion

Motion is **functional by default**, with exactly **one** decorative moment.

| Kind | Rule |
|---|---|
| **State changes** (hover, focus, expand, toggle) | 150 ms, `ease-out`, animating color, border-color, and opacity only |
| **Overlays** (menu, sheet, dialog) | 200 ms fade plus an 8 px slide, `ease-out`; exit 150 ms |
| **Toasts** | 200 ms fade in, 150 ms fade out |
| **The one decorative moment** | On first load of the home page, the hero's beam lines **draw outward from the lantern**, once, over about 800 ms. The lantern window is already lit. It never repeats and never loops |
| **Everything else** | No entrance animations on sections or cards, no scroll effects, no hover lifts, no parallax |

Always respect `prefers-reduced-motion: reduce`: remove the beam animation (beams just appear) and cut other transitions to instant.

---

## 10. Voice and Copy

**Plain verbs, sentence case, no filler.** Describe what something is or does. Be specific rather than clever. Active voice. The vocabulary stays the same through the whole flow.

### 10.1 Action vocabulary

| Action | Button | Confirmation | Never say |
|---|---|---|---|
| Add to cart | "Add to cart" | "Added to cart" | "Grab it!", "Add to bag" |
| Check out | "Check out" | | "Proceed", "Continue" |
| Pay | "Pay ₱1,298.00" (shows the amount) | "Payment received" | "Submit" |
| Cancel an order | "Cancel order" | "Order cancelled" | "Remove" |

### 10.2 Errors and empty states

Errors say **what happened and how to fix it**, in the interface's voice, with no apologies and no vagueness.

| Situation | Copy |
|---|---|
| Not enough stock | "Only 2 left of Harbor Crew Tee. Lower the quantity to continue." |
| Payment declined | "Your card was declined. Try another card or check the details." |
| Login failed | "That email and password don't match. Check them and try again." |
| Network failure | "We couldn't load products. Check your connection and refresh." |
| Order expired | "This order expired because it wasn't paid in time. Your items are back in stock, so you can order again." |
| Empty cart | "Your cart is empty." + button "Browse products" |
| No search results | "No products match "lamp". Try a different word or clear the filters." |

### 10.3 Tone

Reassuring around money, matter-of-fact everywhere else. No exclamation marks except where a person would naturally use one (almost never). No countdown timers, no "X people are viewing this", no scarcity claims that aren't literally true. Low-stock messaging uses the **real** stock number from the database.

### 10.4 Taglines (proposal, pick one or write your own)

- "Everyday things, found easily."
- "Good things, safely delivered."
- "Find it. Order it. It arrives."

---

## 11. Accessibility

| Area | Requirement |
|---|---|
| **Contrast** | Text 4.5:1 minimum, large text and UI boundaries 3:1, using the verified pairs in §3.5 |
| **Focus** | Always visible: 2 px ring with 2 px offset. Never `outline: none` without a replacement |
| **Keyboard** | Every interactive element reachable in a logical order. Product card is a single tab stop. Dialogs trap focus and return it on close |
| **Touch targets** | At least 44 × 44 px |
| **Color alone** | Never the only signal: stock, status, errors, and disabled states always include text or an icon |
| **Forms** | Visible labels, per-field errors linked with `aria-describedby`, error summary focus on submit failure |
| **Images** | Meaningful `alt` on products. The logo's alt is "TrueHarbor". Decorative artwork has `alt=""` |
| **Motion** | `prefers-reduced-motion` respected (§9) |
| **Language** | Plain wording at roughly an 8th-grade reading level |
| **Zoom and reflow** | Usable at 200% zoom and at 320 px width without horizontal page scroll |
| **Live updates** | Cart and toast changes announced via `aria-live` regions |

---

## 12. Implementation Notes

### 12.1 Design tokens

Create `Frontend/src/styles/tokens.css` and import it once in `main.tsx` (before `index.css`):

```css
:root {
  /* Color */
  --color-harbor: #004aad;
  --color-harbor-hover: #003a8a;
  --color-tide: #002459;
  --color-lantern: #ffc247;
  --color-mist: #f3f6fb;
  --color-white: #ffffff;
  --color-slate: #4a5b78;
  --color-fog: #d5deeb;
  --color-edge: #7a8aa5;
  --color-wash: #e6eefa;
  --color-sea: #1b7f5c;
  --color-sea-tint: #e3f3ec;
  --color-buoy: #c23a3a;
  --color-buoy-tint: #fbe9e9;

  /* Type */
  --font-display: "Barlow Semi Condensed", "Arial Narrow", system-ui, sans-serif;
  --font-body: "Barlow", system-ui, -apple-system, "Segoe UI", sans-serif;
  --text-display: 3.0625rem;
  --text-h1: 2.4375rem;
  --text-h2: 1.9375rem;
  --text-h3: 1.5625rem;
  --text-h4: 1.25rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-micro: 0.75rem;

  /* Space */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* Shape and elevation */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 999px;
  --shadow-float: 0 8px 24px rgb(0 36 89 / 0.16);
  --shadow-modal: 0 16px 48px rgb(0 36 89 / 0.24);

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}

@media (max-width: 767px) {
  :root {
    --text-display: 2.25rem;
    --text-h1: 1.9375rem;
    --text-h2: 1.5625rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  margin: 0;
  background: var(--color-white);
  color: var(--color-tide);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.55;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  line-height: 1.2;
  margin: 0 0 var(--space-4);
}

:focus-visible {
  outline: 2px solid var(--color-harbor);
  outline-offset: 2px;
}
```

The Vite template's default `index.css` sets a dark color scheme and centers `#root`. Remove or replace those rules so they don't fight these tokens.

### 12.2 Loading the fonts

In `Frontend/index.html`, inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Semi+Condensed:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

`display=swap` shows the fallback font immediately and swaps when Barlow arrives, so text never blocks. Loading only the weights listed keeps the download small. For production, consider self-hosting the font files for privacy and speed.

### 12.3 File placement

```
Frontend/
├── public/
│   ├── favicon.svg              ← traced from the logo (replace Vite's default)
│   ├── logo-mark-blue.png
│   ├── logo-mark-white.png
│   └── logo-mark-on-blue.png    ← also usable as apple-touch-icon
└── src/
    ├── styles/
    │   └── tokens.css
    └── components/
        ├── Logo.tsx             ← lockup (icon + wordmark), `variant="blue" | "white"`
        ├── Button.tsx           ← variants from §7.1
        ├── StatusChip.tsx       ← order status mapping from §7.4
        └── StockChip.tsx        ← stock states from §7.4
```

Build the **tokens, Logo, Button, and chips first**, then pages. Pages then consume the system instead of reinventing it, and a change to a token updates the whole app.

### 12.4 Mapping to the data model

| Design element | Data source |
|---|---|
| Stock chip | `in_stock` (list) and `stock` (detail): low stock when `stock <= 5` |
| Status chip | `order.status` enum mapped through the label table in §7.4, kept in one `statusLabels` object |
| Price | `price_cents` formatted only by `formatPrice()`, never inline |
| Progress stripes | Position of `order.status` in the lifecycle `pending → paid → shipped → delivered` |

---

## 13. Quick Reference

**Do**
- Use Harbor Blue for action and structure, Deep Tide for text.
- Keep Lantern rare: cart badge, low-stock chip, and the hero's one lit window.
- Keep surfaces flat with borders, not shadows.
- Write sentence-case, plain, specific copy.
- Pair every color signal with text or an icon.
- Show real stock and real prices only.

**Don't**
- Don't use black (`#000`) for text or add gradients.
- Don't use Lantern text on white or Fog as an input border.
- Don't add entrance animations, hover lifts, or decorative lighthouse clip-art.
- Don't use all-caps labels or mix icon sets.
- Don't invent urgency (timers, fake viewer counts).

---

## 14. Open Decisions

| # | Question | Default if undecided |
|---|---|---|
| 1 | Keep **Barlow** or choose another family? | Barlow (this doc) |
| 2 | Final wordmark treatment and a traced **SVG** logo | Use PNGs for now; set the wordmark in type as in §1.3 |
| 3 | Hero headline and tagline | "Everyday things, found easily." |
| 4 | What does the demo store sell? | Affects product photography style only |
| 5 | Dark mode in v1? | No. The tokens are structured so it can be added later by redefining the color variables |
