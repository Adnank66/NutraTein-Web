# NUTRATEIN — Testing & Deployment Manual

> **Platform**: NUTRATEIN E-Commerce Web Platform  
> **Deployment Target**: Hostinger (Node.js Application / VPS, Production Domain: `nutratein.in`)  
> **Node Engine**: Node.js 18.x / 20.x / 22.x LTS  
> **Document Version**: 2.1.0

---

## 1. Local Development Setup & Prerequisites

### Prerequisites
- **Node.js**: `v18.18.0` or higher (verified working on Node `v20.x` and `v24.x`).
- **Package Manager**: `npm` (v9+ or v10+).
- **Database**: Access to MongoDB Atlas Cluster with IP whitelist configured.
- **Git**: Branch discipline (`multilingual-ai` or designated feature branches).

### Installation & Client Generation
```bash
# 1. Clone repository and navigate to root
cd "d:\Git Upload\NutraTein-Web"

# 2. Install dependencies
npm install

# 3. Generate Prisma Client bindings for MongoDB
npx prisma generate
```

### Development Execution
```bash
# Standard local development (http://localhost:3000)
npm run dev

# Mobile network development (binds to 0.0.0.0 for LAN testing)
npm run dev:mobile
```

---

## 2. Verification & Quality Assurance Commands

### A. Mandatory TypeScript Compilation Check
Before committing or submitting changes, always execute:
```bash
npx tsc --noEmit
```
- **Exit Code 0**: Success. Zero type errors.
- **Exit Code 1**: Disallowed. Fix all type issues before proceeding.

### B. Lint Check
```bash
npm run lint
```

### C. Production Build Verification
Simulate production compilation locally before uploading to Hostinger:
```bash
npm run build
```
- Executes `prisma generate` followed by `next build`.
- Generates optimized static and dynamic route manifests in `.next/`.

---

## 3. Environment Variables Specification

> **SECURITY NOTICE**: Only variable names and purposes are documented. Actual credentials must remain strictly inside server `.env` files or Hostinger's secure Environment Settings.

| Variable Name | Required | Target Environments | Purpose / Value Constraint |
|:---|:---:|:---|:---|
| `DATABASE_URL` | Yes | Local & Production | Primary MongoDB connection URI via Prisma ORM. |
| `MONGODB_URI` | Yes | Local & Production | Replica connection URI for legacy route synchronization. |
| `AUTH_SECRET` | Yes | Local & Production | 32+ character cryptographic secret for NextAuth JWT hashing. |
| `NEXTAUTH_SECRET` | Yes | Local & Production | Synchronized fallback for NextAuth session validation. |
| `NEXTAUTH_URL` | Yes | Local & Production | Canonical site base (`https://nutratein.in` in production). |
| `AUTH_URL` | Yes | Local & Production | Primary Auth.js runtime URL (`https://nutratein.in`). |
| `NEXT_PUBLIC_APP_URL` | Yes | Local & Production | Client-visible canonical domain (`https://nutratein.in`). |
| `FRONTEND_URL` | Yes | Local & Production | Fallback redirect domain. |
| `NODE_ENV` | Yes | Local & Production | Set to `"production"` on live host. |
| `PORT` | Yes | Local & Production | Node server listening port (default `3000`). |
| `ADMIN_EMAIL` | Yes | Local & Production | Primary admin identity (`nutratein@gmail.com`). |
| `ADMIN_PASSWORD` | Yes | Local & Production | Primary admin authentication password. |
| `CRON_SECRET` | Yes | Local & Production | Authorization token for scheduled cron routes. |
| `GEMINI_API_KEY` | Yes | Local & Production | Google Gemini 3.1 Flash-Lite AI key (server-only). |
| `SMTP_HOST` | Yes | Local & Production | SMTP server hostname (`smtp.gmail.com`). |
| `SMTP_PORT` | Yes | Local & Production | SMTP server port (`587` with STARTTLS). |
| `SMTP_SECURE` | Yes | Local & Production | Boolean TLS flag (`false` for port 587). |
| `SMTP_USER` | Yes | Local & Production | Gmail SMTP sender address (`nutratein@gmail.com`). |
| `SMTP_PASS` | Yes | Local & Production | 16-character Google App Password (spaces preserved or omitted). |
| `SMTP_EMAIL` | Yes | Local & Production | Sender email display address (`nutratein@gmail.com`). |
| `SMTP_PASSWORD` | Yes | Local & Production | Synchronized alias for `SMTP_PASS`. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Local & Production | Cloudinary account name for media assets. |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Optional | Local & Production | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional | Local & Production | Cloudinary server secret. |

---

## 4. Hostinger Production Deployment Guide

### Option A: Hostinger Cloud / VPS Hosting (Recommended for Next.js 15)

1. **Server Setup**:
   - OS: Ubuntu 22.04 LTS or 24.04 LTS
   - Install Node.js 20.x LTS via NodeSource:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
   - Install PM2 process manager globally:
     ```bash
     sudo npm install -g pm2
     ```

2. **Project Upload & Configuration**:
   - Clone or copy the project files to `/var/www/nutratein`:
     ```bash
     git clone <repo-url> /var/www/nutratein
     cd /var/www/nutratein
     ```
   - Create production `.env` file with real credentials:
     ```bash
     nano .env
     ```
     *(Note: Ensure `DATABASE_URL` is set without `tlsAllowInvalidCertificates` on Linux, as Linux environments possess complete CA certificates).*
   - Install dependencies and compile:
     ```bash
     npm ci
     npx prisma generate
     npm run build
     ```

3. **Process Execution via PM2**:
   - Start the Next.js server with PM2:
     ```bash
     pm2 start npm --name "nutratein-web" -- start -- -p 3000
     pm2 save
     pm2 startup
     ```

4. **Nginx Reverse Proxy & SSL**:
   - Install Nginx and configure proxy to port 3000:
     ```nginx
     server {
         server_name nutratein.in www.nutratein.in;

         location / {
             proxy_pass http://127.0.0.1:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header X-Forwarded-Proto $scheme;
         }
     }
     ```
   - Install SSL certificate using Certbot:
     ```bash
     sudo apt install -y certbot python3-certbot-nginx
     sudo certbot --nginx -d nutratein.in -d www.nutratein.in
     ```

### Option B: Hostinger hPanel Node.js Application Manager

1. In Hostinger hPanel, navigate to **Websites** $\to$ **Node.js**:
   - **Node.js Version**: Select `20.x`
   - **Application Root**: `domains/nutratein.in/public_html`
   - **Application Startup File**: `node_modules/next/dist/bin/next` with argument `start`
2. In the **Environment Variables** tab, enter all variables from the table above.
3. In SSH terminal or hPanel console:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```
4. Click **Restart Application** in hPanel.

### Domain & DNS Records
Point DNS records for `nutratein.in`:
- `A` Record: `@` $\to$ `<Your Hostinger Server IP>`
- `CNAME` Record: `www` $\to$ `nutratein.in`

---

## 5. Common Errors & Troubleshooting

### 1. Gmail SMTP `535-5.7.8 BadCredentials`
- **Cause**: Using a normal Gmail account password or an App Password generated on a different email account.
- **Fix**: Log into the primary Google Account (`nutratein@gmail.com`) $\to$ Manage Google Account $\to$ Security $\to$ 2-Step Verification $\to$ App Passwords $\to$ Generate new App Password for "Mail / Other". Paste the 16 letters into `SMTP_PASS` and `SMTP_PASSWORD`.

### 2. Next.js "Multiple Lockfiles" Warning
- **Cause**: An old `package-lock.json` in the legacy `backend/` folder caused Next.js to display a workspace root warning.
- **Fix**: Already resolved in `next.config.js` via:
  ```javascript
  outputFileTracingRoot: path.join(__dirname)
  ```

### 3. Remote Image Domain Blocked
- **Cause**: Adding an image URL from an unlisted host.
- **Fix**: Next.js requires remote hostnames to be declared in `next.config.js` under `images.remotePatterns`. Allowed domains include `images.unsplash.com`, `res.cloudinary.com`, `placehold.co`, and `*.shutterstock.com`.

### 4. Rollback Plan
- In case of a production defect, pull the prior stable commit and rebuild:
  ```bash
  git checkout <previous-commit-hash>
  npm run build
  pm2 restart nutratein-web
  ```
