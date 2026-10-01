**# PROTEINX — Complete Protein & Fitness Supplement E-Commerce Platform**

A production-grade, dynamic, modern protein & fitness supplement e-commerce platform built with a clean, decoupled architecture: **\*\*Vanilla HTML5/CSS3/JavaScript Frontend\*\*** and **\*\*Node.js + Express.js Backend\*\*** with **\*\*MongoDB/Mongoose\*\*** and **\*\*JWT Authentication\*\***.

**---**

**## 🌟 Key Features**

**### 🛒 Customer Storefront**

\- **\*\*19-Section Comprehensive Homepage\*\***:

  1. Top Promotional Announcement Bar (Free shipping alert)

  2. Sticky Header with Logo, Category dropdowns, Search, Wishlist, Cart Drawer, and Theme Toggle

  3. Interactive Hero Advertisement Banner Slider with CTA buttons

  4. Trust & Security Strip (100% Genuine, Free Delivery, 7-Day Returns)

  5. Category Cards (Whey, Plant, Mass Gainers, Creatine, Pre-Workout, BCAA, Vitamins, Shakers)

  6. Top Best Sellers & New Arrivals Grid with quick Add to Cart & Quick View

  7. **\*\*AI Product Recommendation\*\*** Engine (interactive goal, experience & dietary matching)

  8. **\*\*Recently Viewed\*\*** dynamic tracking (persisted locally & synced)

  9. **\*\*Build Your Stack\*\*** (custom supplement bundle builder with automatic 15% discount)

  10. Why Choose Us (6 core pillars of quality)

  11. **\*\*Live Product Comparison\*\*** (compare up to 3 products side-by-side)

  12. Third-Party Trust & Security Strip

  13. Verified Athlete Reviews & Ratings Breakdown

  14. **\*\*Interactive Daily Protein Intake Calculator\*\*** (weight & activity level formulas)

  15. Limited-Time Offer Promotional Banner

  16. Newsletter Subscription Box

  17. Collapsible FAQ Accordion (5+ common queries)

  18. Contact & Advisor CTA

  19. Complete Corporate & Legal Footer

\- **\*\*Live Search Modal\*\***: Real-time query search with thumbnails and live pricing

\- **\*\*Slide-out Cart Drawer\*\***: Quantity adjustment (+/-), free shipping threshold progress, subtotal & checkout

\- **\*\*Pincode Delivery Checker\*\***: Estimated arrival date and Cash on Delivery (COD) verification

\- **\*\*Dark / Light Mode\*\***: Instant toggle persisted in \`localStorage\`

\- **\*\*Wishlist System\*\***: Add/remove favorites with live header badge sync

\- **\*\*Order Tracking\*\***: Real-time 5-stage shipment timeline (\`PLACED\` → \`CONFIRMED\` → \`PROCESSING\` → \`SHIPPED\` → \`DELIVERED\`)

\- **\*\*Printable Tax Invoice (PDF)\*\***: Detailed billing breakdown with company GSTIN and itemized charges

**### 🔐 Authentication & Security**

\- **\*\*JWT (JSON Web Token)\*\*** Authentication with secure Bearer header authorization

\- **\*\*Bcrypt.js\*\*** password hashing (12 salt rounds)

\- Rate limiting (\`express-rate-limit\`) & security headers (\`helmet\`)

\- Role-based authorization (\`user\` vs \`admin\`)

**### ⚡ Admin Console (\`/frontend/admin/\`)**

\- **\*\*Dashboard Overview\*\***: Revenue KPIs, Total Orders, Registered Customers, Active Catalog

\- **\*\*Order Management\*\***: Search orders, change fulfillment status (\`CONFIRMED\`, \`PROCESSING\`, \`SHIPPED\`, \`DELIVERED\`)

\- **\*\*Product Inventory\*\***: Catalog view with live ratings, price, and category tracking

\- **\*\*Coupon System\*\***: Create and manage percentage (\`PERCENT\`) and flat (\`FIXED\`) discount vouchers with minimum cart value and usage caps

\- **\*\*Promotional Banners CMS\*\***: Manage homepage hero slides, badge text, and action buttons

**---**

**## 📁 Project Structure**

\`\`\`text

protein-web/

├── backend/

│   ├── config/

│   │   └── db.js                 # MongoDB connection handler

│   ├── models/

│   │   ├── Banner.js             # Hero advertisement banners

│   │   ├── Category.js           # Supplement categories

│   │   ├── Coupon.js             # Discount voucher codes

│   │   ├── Order.js              # Orders and shipment timeline

│   │   ├── Product.js            # Products, nutrition facts & variants

│   │   ├── Review\.js             # Verified customer ratings

│   │   └── User.js               # Users, addresses & wishlist

│   ├── middleware/

│   │   ├── auth.js               # JWT verification

│   │   └── admin.js              # Admin privilege guard

│   ├── routes/

│   │   ├── auth.js               # Register, login, profile, addresses

│   │   ├── products.js           # CRUD, search, filter, slug details

│   │   ├── categories.js         # Category listings

│   │   ├── cart.js               # Cart server synchronization

│   │   ├── wishlist.js           # User wishlist toggle

│   │   ├── orders.js             # Order creation & status update

│   │   ├── reviews.js            # Review submissions & moderation

│   │   ├── coupons.js            # Coupon validation & management

│   │   ├── banners.js            # Banner slides API

│   │   ├── analytics.js          # Admin sales & conversion metrics

│   │   ├── pincode.js            # Pincode delivery & COD checker

│   │   ├── recommendations.js    # AI rule-based recommendation engine

│   │   └── contact.js            # Customer inquiry submissions

│   ├── utils/

│   │   └── seed.js               # Seeds 24+ products, categories & demo accounts

│   ├── .env                      # Environment configurations

│   ├── .env.example              # Environment template

│   ├── package.json

│   └── server.js                 # Express API server entrypoint (Port 5000)

│

└── frontend/

    ├── index.html                # 19-section homepage

    ├── shop.html                 # Catalog with filters & pagination

    ├── product.html              # Product details, nutrition & reviews

    ├── cart.html                 # Dedicated shopping cart page

    ├── checkout.html             # Checkout, address form & coupon entry

    ├── login.html                # Authentication sign-in

    ├── register.html             # Customer registration

    ├── account.html              # Customer dashboard & invoice modal

    ├── wishlist.html             # Saved items

    ├── compare.html              # Live product comparison matrix

    ├── tracking.html             # Order shipment status timeline

    ├── calculator.html           # Daily protein requirement calculator

    ├── build-stack.html          # Interactive bundle builder (15% off)

    ├── contact.html              # Contact form & support hours

    ├── about.html                # Brand mission & lab testing standards

    ├── admin/

    │   ├── index.html            # Admin dashboard

    │   ├── products.html         # Inventory management

    │   ├── orders.html           # Order fulfillment

    │   ├── coupons.html          # Discount vouchers

    │   └── banners.html          # Promotional banners

    ├── css/

    │   ├── style.css             # Core design system & theme variables

    │   ├── responsive.css        # Mobile-first breakpoints (375px to 1440px)

    │   └── admin.css             # Admin dashboard UI

    └── js/

        ├── app.js                # Global state, theme, cart drawer, toasts

        ├── products.js           # Shop catalog, quick view, product cards

        ├── product-detail.js     # Single product page, tabs, pincode checker

        ├── checkout.js           # Order placement & coupon validation

        ├── interactive.js        # Stack builder, compare, AI recommendations, calculator, tracking

        └── admin.js              # Admin metrics & order fulfillment actions

\`\`\`

**---**

**## 🚀 Getting Started**

**### 1. Prerequisites**

\- **\*\*Node.js\*\***: v18 or higher

\- **\*\*MongoDB\*\***: Either a local MongoDB instance (\`mongodb://localhost:27017/proteinx\`) or a free [MongoDB Atlas]\(https\://www\.mongodb.com/cloud/atlas) connection string.

**### 2. Configure Environment Variables**

In \`backend/.env\`:

\`\`\`env

PORT=5000

MONGO_URI=mongodb://localhost:27017/proteinx

JWT_SECRET=your_secure_random_secret_here

JWT_EXPIRES_IN=7d

NODE_ENV=development

FRONTEND_URL=http\://127.0.0.1:5500

ADMIN_EMAIL=your_admin_email@example.com

ADMIN_PASSWORD=your_strong_admin_password

\`\`\`

*\*(If using MongoDB Atlas, replace \`MONGO_URI\` with your \`mongodb+srv://...\` URI)\**.

**### 3. Seed the Database**

Populate 24+ realistic fitness products, 8 categories, demo coupons, and test accounts:

\`\`\`bash

cd backend

npm run seed

\`\`\`

**### 4. Start the Express API Backend**

\`\`\`bash

cd backend

npm start

\# Running at http\://localhost:5000

\`\`\`

**### 5. Launch the Frontend**

You can serve the \`frontend/\` directory with any static file server:

\`\`\`bash

\# Using npx serve:

npx serve frontend -p 5500

\# Or with Python:

python -m http.server 5500 --directory frontend

\# Or with VS Code Live Server extension on port 5500

\`\`\`

Open your browser at **\*\*\`http\://localhost:5500\`\*\***.

**---**

**## 🔑 Demo Credentials**

\| Role | Email | Password | Access Area |

\|---|---|---|---|

\| **\*\*Admin\*\*** | \`admin\@proteinx.in\` | \`Admin\@123\` | Full Admin Console (\`/frontend/admin/\`) |

\| **\*\*Customer\*\*** | \`john\@example.com\` | \`User\@123\` | Storefront & User Account (\`/frontend/account.html\`) |

**### Active Discount Coupons**

- Demo coupon codes are configured by the seed script; create your own production coupons before deployment.
**---**

**## 🛡️ API Endpoints Summary**

\| Method | Endpoint | Description | Auth Required |

\|---|---|---|---|

\| \`POST\` | \`/api/auth/register\` | Register new customer account | No |

\| \`POST\` | \`/api/auth/login\` | Sign in & receive JWT | No |

\| \`GET\` | \`/api/auth/me\` | Current user profile | Yes (Bearer) |

\| \`GET\` | \`/api/products\` | Paginated product list with filters | No |

\| \`GET\` | \`/api/products/\:slug\` | Full product details + reviews | No |

\| \`GET\` | \`/api/products/search\` | Fast autocomplete search | No |

\| \`POST\` | \`/api/orders\` | Place verified order (calculates totals server-side) | Yes (Bearer) |

\| \`GET\` | \`/api/orders/my\` | User's order history | Yes (Bearer) |

\| \`GET\` | \`/api/orders/track\` | Track order by ID + contact | No |

\| \`PUT\` | \`/api/orders/\:id/status\` | Update order status | Yes (Admin) |

\| \`POST\` | \`/api/coupons/validate\` | Verify coupon validity & calculate discount | No |

\| \`POST\` | \`/api/recommendations\` | AI / Rule-based personalized matching | No |

\| \`GET\` | \`/api/pincode/check\` | Delivery & COD availability | No |

\| \`GET\` | \`/api/analytics/dashboard\`| Revenue, orders & customer metrics | Yes (Admin) |

\| \`POST\` | \`/api/contact\` | Customer support inquiry submission | No |

**---**

**## 📱 Mobile Responsiveness**

The frontend is built with a responsive grid system tested across:

\- **\*\*Desktop (1440px / 1280px)\*\***: 4-column product grids, side-by-side checkout and comparison views

\- **\*\*Tablet (768px - 1024px)\*\***: 2-column grids with collapsible navigation

\- **\*\*Mobile (375px - 480px)\*\***: 1-to-2 column grids, touch-friendly slide-out mobile drawer, horizontal scrollable comparison matrix, and full-screen cart drawer
#   N u t r a - T e i n - W e b s i t e  
 