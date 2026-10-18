# NUTRATEIN — API Reference & Endpoints Manual

> **Base URL (Local)**: `http://localhost:3000`  
> **Base URL (Production)**: `https://nutratein.in`  
> **Architecture**: Next.js 15 App Router Route Handlers (`src/app/api/**/route.ts`)  
> **Document Version**: 2.0.0

---

## 1. Authentication & Security Legend

| Auth Level | Description | Enforcement Helper |
| :--- | :--- | :--- |
| **`PUBLIC`** | Accessible to all visitors without authentication. | None |
| **`USER`** | Requires an authenticated customer session. | `requireUser()` |
| **`ADMIN`** | Requires an authenticated session with `role === "ADMIN"`. | `requireAdmin()` |
| **`CRON`** | Requires `Authorization: Bearer <CRON_SECRET>` header. | `requireCronSecret()` |

---

## 2. Storefront, Catalog & Public APIs

### `GET /api/products`
- **Auth**: `PUBLIC`
- **Purpose**: Retrieve product catalog with filtering, sorting, pagination, and stock status.
- **Query Parameters**:
  - `category` (optional, string): Filter by category slug (e.g., `whey-protein`).
  - `goal` (optional, string): Filter by fitness goal (e.g., `muscle-building`).
  - `sort` (optional, string): Sort order (`price_asc`, `price_desc`, `newest`, `popular`).
  - `search` (optional, string): Keyword filter on product name/description.
  - `page` (optional, number): Page number (default: 1).
  - `limit` (optional, number): Products per page (default: 20).
- **Response**:
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "64f1...",
        "name": "NutraTein 100% Whey Isolate",
        "slug": "nutratein-whey-isolate",
        "basePrice": 3299,
        "isActive": true,
        "variants": [...],
        "images": [...]
      }
    ],
    "pagination": { "page": 1, "totalPages": 3, "totalCount": 48 }
  }
  ```
- **Consumers**: Shop Page (`/shop`), Top Products, Search Modal.

### `GET /api/products/[slug]`
- **Auth**: `PUBLIC`
- **Purpose**: Fetch complete details for a single product by its unique slug.
- **Response**: Complete `Product` object including `variants`, `images`, `reviews`, and nutritional specs.
- **Errors**: `404 Not Found` if the slug does not exist or product is marked inactive.
- **Consumers**: Product Detail Page (`/shop/[slug]`).

### `GET /api/categories`
- **Auth**: `PUBLIC`
- **Purpose**: List all product and goal categories.
- **Response**: Array of `{ id, name, slug, icon, type, description, order }`.
- **Consumers**: Header category dropdowns, Category Grid, Admin Category Manager.

### `GET /api/bundles`
- **Auth**: `PUBLIC`
- **Purpose**: Retrieve curated supplement combo bundles with discount calculations.
- **Response**: Array of `{ id, name, description, discountPercent, products: [...] }`.
- **Consumers**: Combo Builder (`ComboBuilder.tsx`), Deals Page (`/deals`).

### `GET /api/reviews` & `POST /api/reviews`
- **Auth**: `GET`: `PUBLIC` | `POST`: `USER`
- **Purpose**: Fetch approved product reviews; submit a new verified purchase review.
- **POST Body**: `{ productId, rating, title, comment }` (Rating must be an integer between 1 and 5).
- **Consumers**: Product Details Reviews Section, Write Review Page (`/write-review`).

---

## 3. Customer Authentication APIs

### `POST /api/auth/register`
- **Auth**: `PUBLIC` (Rate-limited: 5 requests / 15 min)
- **Purpose**: Register a new customer account.
- **Body**: `{ name, email, password, phone, whatsappOptIn }`
- **Validation**: Email regex, password minimum 6 characters.
- **Errors**: `400 Bad Request` if email is already registered.

### `POST /api/auth/send-otp`
- **Auth**: `PUBLIC` (Rate-limited: 5 requests / 5 min)
- **Purpose**: Generate and dispatch a 6-digit numeric verification code to the customer's email.
- **Body**: `{ email }`
- **Side Effect**: Hashes OTP using SHA-256 and stores in `EmailOTP` collection with 10-minute expiry; dispatches email via `sendMail()`.
- **Errors**: `429 Too Many Requests` if rate limit is exceeded.

### `POST /api/auth/verify-otp`
- **Auth**: `PUBLIC`
- **Purpose**: Validate customer-submitted OTP against stored SHA-256 hash.
- **Body**: `{ email, otp }`
- **Response**: `{ success: true, verified: true }`

### `POST /api/auth/send-phone-otp`
- **Auth**: `PUBLIC` (Rate-limited: 5 requests / 5 min)
- **Purpose**: Generate a 6-digit numeric verification code for phone-based authentication.
- **Body**: `{ phone }`
- **Side Effect**: Stores SHA-256 OTP in `PhoneOTP` collection with 10-minute expiry.

---

## 4. Checkout, Orders & Payment APIs

### `POST /api/checkout`
- **Auth**: `PUBLIC` (Accepts authenticated session or guest checkout with verified email)
- **Purpose**: Execute server-side order calculation, reserve inventory, validate coupons, and create the order.
- **Body**:
  ```json
  {
    "customer": {
      "name": "Vikram Singh",
      "email": "vikram@example.com",
      "phone": "+91 9876543210",
      "address": "Flat 402, Green Heights",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "items": [
      { "productId": "...", "variantId": "...", "quantity": 1 }
    ],
    "paymentMethod": "UPI",
    "upiTransactionId": "UTR1234567890",
    "couponCode": "PROTEIN10"
  }
  ```
- **Server Calculations**:
  1. Validates every item exists in database and has active stock.
  2. Fetches unit price directly from database (ignoring client price).
  3. Validates coupon code in `Coupon` collection (checks validity, min order amount, max discount).
  4. Applies free shipping if subtotal $\ge ₹999$; otherwise adds ₹99 standard shipping.
  5. Atomically decrements variant inventory.
  6. If inventory $\le$ threshold, triggers email to `nutratein@gmail.com`.
  7. Dispatches customer order confirmation email.
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "64f1...",
    "orderNumber": "NT-20261018-4921",
    "total": 3198
  }
  ```

### `GET /api/orders/track`
- **Auth**: `PUBLIC` with verification
- **Purpose**: Retrieve order timeline status for tracking.
- **Query**: `?orderNumber=NT-20261018-4921&email=vikram@example.com`
- **Security**: Must supply matching order number and customer email to prevent IDOR leaks.
- **Response**: `{ success: true, order: { status, trackingSteps, items, total, ... } }`.
- **Consumers**: Track Order Page (`/track`).

### `POST /api/orders/cancel`
- **Auth**: `USER`
- **Purpose**: Request order cancellation before shipment.
- **Security**: Enforces that the order belongs to the authenticated user (`where: { id, userId: session.user.id }`).

---

## 5. AI Assistant & Search APIs

### `POST /api/ai/chat`
- **Auth**: `PUBLIC` (Rate-limited: 20 queries / hour per user ID or IP)
- **Purpose**: Conversational supplement advisor with real-time database tool calling.
- **Body**: `{ messages: [ { role: "user", text: "What is best for muscle gain?" } ], language: "en" }`
- **Tools**:
  - `searchProducts({ query })`
  - `getProductById({ id })`
  - `getOrderStatus({ orderId, email })`
  - `getActiveCoupons()`
- **Response**: `{ success: true, reply: "...", products: [...] }`
- **Consumers**: Floating AI WhatsApp Widget (`AiWhatsAppChatWidget.tsx`).

### `GET /api/search`
- **Auth**: `PUBLIC`
- **Purpose**: Real-time autocomplete search.
- **Query**: `?q=whey`
- **Response**: `{ results: [ { id, name, slug, price, image, category } ] }`
- **Consumers**: Header Smart Search Modal (`SmartSearchModal.tsx`).

---

## 6. Subscriptions & Loyalty Customer APIs

### `GET /api/subscriptions` & `POST /api/subscriptions`
- **Auth**: `USER`
- **Purpose**: List active user subscriptions; create a recurring auto-delivery.
- **Feature Flag Guard**: If `enableSubscriptions === false`, returns `{ success: true, enabled: false, subscriptions: [] }` and rejects creation with HTTP 403.

### `PATCH /api/subscriptions/[id]`
- **Auth**: `USER`
- **Purpose**: Pause, activate, or cancel a subscription.
- **Security**: Verifies `userId === session.user.id`.

### `GET /api/loyalty`
- **Auth**: `USER`
- **Purpose**: Fetch current user points balance, earning rate, and redemption history.
- **Feature Flag Guard**: Returns `enabled: false` if loyalty program is disabled by admin.

### `POST /api/loyalty/redeem`
- **Auth**: `USER`
- **Purpose**: Calculate discount eligibility and generate checkout discount code from loyalty points.

---

## 7. Administrative Management APIs (`/api/admin/*`)

> **All endpoints below strictly enforce `requireAdmin()`. Non-admin sessions receive HTTP 403; logged-out sessions receive HTTP 401.**

### `GET /api/admin/subscriptions-loyalty` & `POST /api/admin/subscriptions-loyalty`
- **Auth**: `ADMIN`
- **Purpose**: Unified control center for subscriptions and loyalty.
- **GET**: Returns `{ flags, loyaltyConfig, loyaltyAccounts, subscriptions }`.
- **POST Actions**:
  - `toggle_flags`: Updates `enableSubscriptions` and/or `enableLoyalty` in `feature-flags.json`.
  - `update_loyalty_config`: Updates earning and redemption rules in `loyalty-config.json`.
  - `adjust_points`: Manually grants or deducts points for a specific customer with required reason.
  - `update_subscription_status`: Pauses, activates, or cancels customer recurring orders.

### `GET /api/admin/email-settings` & `POST /api/admin/email-settings`
- **Auth**: `ADMIN`
- **Purpose**: Configure low-stock inventory depletion threshold (default 25 units) and notification recipient (`nutratein@gmail.com`).
- **Data File**: `data/email-settings.json`.

### `GET /api/admin/social` & `POST /api/admin/social`
- **Auth**: `ADMIN`
- **Purpose**: List and update brand social channels (`YouTube`, `Facebook`, `Videos`, `Instagram`).
- **Data Source**: `SocialLink` collection in MongoDB Atlas.

### `GET /api/admin/products` & `POST /api/admin/products`
- **Auth**: `ADMIN`
- **Purpose**: List all products (including draft and out-of-stock items); create new product with variants and images.

### `PATCH /api/admin/products/[id]` & `DELETE /api/admin/products/[id]`
- **Auth**: `ADMIN`
- **Purpose**: Update product details, inline stock editing, or soft archive.

### `GET /api/admin/orders` & `PATCH /api/admin/orders/[id]`
- **Auth**: `ADMIN`
- **Purpose**: Order management table; update fulfillment stage (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`).

### `GET /api/admin/audit-log`
- **Auth**: `ADMIN`
- **Purpose**: View immutable audit trail of administrative actions (login, stock edits, refunds, configuration changes).
- **Data Source**: `AuditLog` collection in MongoDB Atlas.

### `GET /api/admin/export/orders` & `GET /api/admin/export/customers`
- **Auth**: `ADMIN`
- **Purpose**: Stream CSV export of orders or customer directories for accounting and CRM.

---

## 8. Scheduled & Background Worker APIs

### `POST /api/cron/abandoned-cart`
- **Auth**: `CRON` (Requires `Authorization: Bearer <CRON_SECRET>`)
- **Purpose**: Scans carts updated >24 hours ago with items but no order, and dispatches automated reminder emails.
- **Errors**: `401 Unauthorized` if Bearer token is missing or invalid.
