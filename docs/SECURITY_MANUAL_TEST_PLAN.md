# Security Acceptance Test Plan

Run these checks against a non-production environment with two ordinary accounts
(`User A` and `User B`) and a separate administrator account. Record only test
data in requests and clean it up through the application afterward.

## 1. Two-account access control

1. Sign in as User A and create an order, subscription, profile update, and review.
2. Copy User A's resource identifiers from the browser network panel.
3. Sign in as User B. Replay User A's identifiers against:
   - `GET /api/orders/track?q=<User-A-order-number-or-id>`
   - `POST /api/orders/cancel`
   - `POST /api/orders/verify-payment`
   - `PATCH /api/subscriptions/<User-A-subscription-id>`
4. Repeat with User A's e-mail in the order-tracking query and User A's ID or
e-mail in any editable request body.
5. Expected result: every cross-account request returns `403` or `404`, and
User A's data is unchanged.

## 2. Logged-out protected routes

In a fresh private-browser session, call each protected API route without
cookies or an `Authorization` header. Confirm `401` (or `403` for an authenticated
but non-admin request) and no data mutation:

- `/api/checkout`, `/api/orders/cancel`, `/api/orders/track`, and
  `/api/orders/verify-payment`
- `/api/user/profile`, `/api/user/upload`, `/api/user/has-orders`
- `/api/subscriptions`, `/api/subscriptions/<id>`, `/api/loyalty`, and
  `/api/loyalty/redeem`
- Every route below `/api/admin/`
- Express deployment only: every legacy route using `protect` or `admin`

## 3. Normal-user admin checks

1. Sign in as a normal user.
2. Directly request each `/api/admin/*` endpoint, including destructive-looking
   `clear-data`, upload, product, order, export, and backup endpoints.
3. If the legacy Express service is deployed, request `/api/auth/users`,
   `/api/auth/admins`, `/api/backup/export`, and each `/admin` API endpoint.
4. Expected result: `403`; no response includes customer data, backups, or
   administrative settings.

## 4. Checkout tampering

As a signed-in normal user, intercept the request to `/api/checkout` and change:

- item `price`, `total`, `discount`, `shipping`, `userId`, and customer `email`;
- product or variant ID to an inactive or unrelated item;
- quantity to `0`, negative, fractional, and more than available stock;
- coupon to expired, inactive, or below-minimum-order codes.

Expected result: the order derives user identity, prices, stock, coupon, and
shipping from the server database. Invalid data returns `400`/`403`; no order is
created with an attacker-provided total or identity.

## 5. Login, reset, throttling, and uploads

1. Send 11 bad credentials callbacks within 15 minutes from one IP. Expect
   `429` on the eleventh request.
2. Request email and phone codes repeatedly; verify rate limiting, 10-minute
   expiry, one-time redemption, and no account-existence disclosure.
3. Try the admin upload endpoint with an HTML file renamed as `.png`, a SVG,
   an oversized image, and an oversized video. Expect `400` or `413` and no
   uploaded file. Upload a valid PNG/JPEG/WebP and verify the returned filename
   uses a server-generated extension.

## 6. Payment confirmation

1. Submit a fabricated UPI transaction identifier for an order you own.
2. Confirm the order and payment remain `PENDING`.
3. Verify that only an administrator can mark payment paid, and that this is
   done after matching the provider/bank transaction in its dashboard.
