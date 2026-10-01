const bcrypt = require('bcryptjs');

const categories = [
  { _id: 'cat_whey', name: 'Whey Protein', slug: 'whey-protein', icon: 'W', sortOrder: 1, image: '/assets/categories/whey-protein.jpg', isActive: true },
  { _id: 'cat_plant', name: 'Plant Protein', slug: 'plant-protein', icon: 'P', sortOrder: 2, image: '/assets/categories/plant-protein.jpg', isActive: true },
  { _id: 'cat_mass', name: 'Mass Gainers', slug: 'mass-gainers', icon: 'M', sortOrder: 3, image: '/assets/categories/mass-gainers.jpg', isActive: true },
  { _id: 'cat_creatine', name: 'Creatine', slug: 'creatine', icon: 'C', sortOrder: 4, image: '/assets/categories/creatine.jpg', isActive: true },
  { _id: 'cat_pre', name: 'Pre-Workout', slug: 'pre-workout', icon: 'E', sortOrder: 5, image: '/assets/categories/pre-workout.jpg', isActive: true },
  { _id: 'cat_bcaa', name: 'BCAA / EAA', slug: 'bcaa-eaa', icon: 'B', sortOrder: 6, image: '/assets/categories/bcaa-eaa.jpg', isActive: true },
  { _id: 'cat_vitamins', name: 'Vitamins', slug: 'vitamins', icon: 'V', sortOrder: 7, image: '/assets/categories/vitamins.jpg', isActive: true },
  { _id: 'cat_accessories', name: 'Accessories', slug: 'accessories', icon: 'A', sortOrder: 8, image: '/assets/categories/accessories.jpg', isActive: true }
];

const img = (mainUrl, backUrl, nutritionUrl, lifestyleUrl) => {
  const list = [{ url: mainUrl, alt: 'Front Product Image', isPrimary: true, sortOrder: 0 }];
  if (backUrl) list.push({ url: backUrl, alt: 'Back Packaging & Nutrition', isPrimary: false, sortOrder: 1 });
  if (nutritionUrl) list.push({ url: nutritionUrl, alt: 'Supplement Facts Label', isPrimary: false, sortOrder: 2 });
  if (lifestyleUrl) list.push({ url: lifestyleUrl, alt: 'Lifestyle & Workout Usage', isPrimary: false, sortOrder: 3 });
  return list;
};

const products = [
  {
    "_id": "p_creatine_mono",
    "name": "CreaCore Creatine Monohydrate",
    "slug": "creatine-monohydrate",
    "brand": "NUTRATEIN",
    "sku": "NUT-CRM-01",
    "barcode": "NUT8901234567895",
    "category": {
      "_id": "cat_creatine",
      "name": "Creatine",
      "slug": "creatine"
    },
    "description": "100% pure Creapure® micronized creatine monohydrate. THE ULTIMATE FUEL FOR MUSCLE GROWTH. Ultra-fine 200 mesh powder designed for rapid ATP regeneration, explosive strength, increased muscle volume and muscular endurance.",
    "shortDescription": "THE ULTIMATE FUEL FOR MUSCLE GROWTH. 100% pure micronized creatine.",
    "image": "/assets/products/creatine.jpg",
    "images": [
      {
        "url": "/assets/products/creatine.jpg",
        "alt": "Creatine Monohydrate Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/Createin Monohydrate.jpeg",
        "alt": "Creatine Monohydrate Pack",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_cm_100g",
        "weight": "100g",
        "size": "100g",
        "flavor": "Unflavoured",
        "servings": 32,
        "price": 549,
        "originalPrice": 699,
        "mrp": 699,
        "discount": 21,
        "stock": 65,
        "sku": "NUT-CRM-100G",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/creatine.jpg"
      },
      {
        "_id": "v_cm_250g",
        "weight": "250g",
        "size": "250g",
        "flavor": "Unflavoured",
        "servings": 80,
        "price": 1199,
        "originalPrice": 1499,
        "mrp": 1499,
        "discount": 20,
        "stock": 45,
        "sku": "NUT-CRM-250G",
        "status": "in_stock",
        "isActive": true,
        "isDefault": false,
        "image": "/assets/products/creatine.jpg"
      }
    ],
    "basePrice": 549,
    "mrp": 699,
    "minPrice": 549,
    "maxPrice": 1199,
    "discountPercent": 21,
    "costPrice": 380,
    "rating": 4.9,
    "reviewCount": 312,
    "badge": "BEST SELLER",
    "isBestSeller": true,
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 110,
    "lowStockThreshold": 15,
    "unitsSold": 210,
    "totalRevenue": 248690,
    "nutrition": {
      "servingSize": "3g",
      "calories": 0,
      "protein": 0,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 1890
  },
  {
    "_id": "p_gold_whey",
    "name": "Nitrotein Performance Whey Protein",
    "slug": "nitro-tein-whey-isolate",
    "brand": "NUTRATEIN",
    "sku": "NUT-NTW-01",
    "barcode": "NUT8901234567891",
    "category": {
      "_id": "cat_whey",
      "name": "Whey Protein",
      "slug": "whey-protein"
    },
    "description": "THE ULTIMATE FUEL FOR MUSCLE GROWTH. Elite ultra-filtered whey isolate delivering 27g of pure protein per serving. Enhanced with DigeZyme® multi-enzyme complex for instant absorption and maximum lean muscle hypertrophy.",
    "shortDescription": "THE ULTIMATE FUEL FOR MUSCLE GROWTH. 27g ultra-pure whey protein isolate.",
    "image": "/assets/products/whey.jpg",
    "images": [
      {
        "url": "/assets/products/whey.jpg",
        "alt": "Nitro-Tein Whey Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/NITRO-TEIN WHEY.jpeg",
        "alt": "Nitro-Tein Whey Container",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_ntw_1kg",
        "weight": "1 KG",
        "size": "1 KG",
        "flavor": "Swiss Chocolate",
        "servings": 22,
        "price": 3199,
        "originalPrice": 4499,
        "mrp": 4499,
        "discount": 29,
        "stock": 50,
        "sku": "NUT-NTW-1KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/whey.jpg"
      },
      {
        "_id": "v_ntw_2kg",
        "weight": "2 KG",
        "size": "2 KG",
        "flavor": "Swiss Chocolate",
        "servings": 45,
        "price": 5999,
        "originalPrice": 8499,
        "mrp": 8499,
        "discount": 29,
        "stock": 35,
        "sku": "NUT-NTW-2KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": false,
        "image": "/assets/products/whey.jpg"
      }
    ],
    "basePrice": 3199,
    "mrp": 4499,
    "minPrice": 3199,
    "maxPrice": 5999,
    "discountPercent": 29,
    "costPrice": 1750,
    "rating": 4.9,
    "reviewCount": 248,
    "badge": "BEST SELLER",
    "isBestSeller": true,
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 85,
    "lowStockThreshold": 15,
    "unitsSold": 142,
    "totalRevenue": 425858,
    "nutrition": {
      "servingSize": "30g",
      "calories": 115,
      "protein": 27,
      "carbohydrates": 1,
      "fat": 0.5,
      "bcaa": "6.2g"
    },
    "viewCount": 2340
  },
  {
    "_id": "p_shred_whey",
    "name": "Shredtein Advanced Lean Protein Matrix",
    "slug": "shred-tein-whey",
    "brand": "NUTRATEIN",
    "sku": "NUT-STW-01",
    "barcode": "NUT8901234567892",
    "category": {
      "_id": "cat_whey",
      "name": "Whey Protein",
      "slug": "whey-protein"
    },
    "description": "THE ULTIMATE FUEL FOR LEAN MUSCLES. High-performance lean cutting whey protein matrix engineered with CLA, L-Carnitine, and Green Tea Extract to accelerate thermogenesis while preserving hard-earned lean muscle mass.",
    "shortDescription": "THE ULTIMATE FUEL FOR LEAN MUSCLES. Advanced lean whey matrix with CLA and L-Carnitine.",
    "image": "/assets/products/shred-whey.jpg",
    "images": [
      {
        "url": "/assets/products/shred-whey.jpg",
        "alt": "Shred-Tein Whey Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/SHRED -TEIN whey.jpeg",
        "alt": "Shred-Tein Whey Pack",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_stw_1kg",
        "weight": "1 KG",
        "size": "1 KG",
        "flavor": "Swiss Chocolate",
        "servings": 20,
        "price": 3299,
        "originalPrice": 4499,
        "mrp": 4499,
        "discount": 27,
        "stock": 40,
        "sku": "NUT-STW-1KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/shred-whey.jpg"
      },
      {
        "_id": "v_stw_2kg",
        "weight": "2 KG",
        "size": "2 KG",
        "flavor": "Swiss Chocolate",
        "servings": 40,
        "price": 6199,
        "originalPrice": 8499,
        "mrp": 8499,
        "discount": 27,
        "stock": 20,
        "sku": "NUT-STW-2KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": false,
        "image": "/assets/products/shred-whey.jpg"
      }
    ],
    "basePrice": 3299,
    "mrp": 4499,
    "minPrice": 3299,
    "maxPrice": 6199,
    "discountPercent": 27,
    "costPrice": 1900,
    "rating": 4.8,
    "reviewCount": 112,
    "badge": "LEAN CUT",
    "isNew": true,
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 60,
    "lowStockThreshold": 10,
    "unitsSold": 78,
    "totalRevenue": 249522,
    "nutrition": {
      "servingSize": "32g",
      "calories": 120,
      "protein": 26,
      "carbohydrates": 2,
      "fat": 1
    },
    "viewCount": 1450
  },
  {
    "_id": "p_extreme_mass",
    "name": "Masstein Anabolic Mass Gainer",
    "slug": "mass-tein-gainer",
    "brand": "NUTRATEIN",
    "sku": "NUT-MTG-01",
    "barcode": "NUT8901234567897",
    "category": {
      "_id": "cat_mass",
      "name": "Mass Gainers",
      "slug": "mass-gainers"
    },
    "description": "THE ULTIMATE FUEL FOR MUSCLE MASS GROWTH. Anabolic high-calorie mass gainer delivering 52g protein and 1,050 calories per daily yield with clean complex carbohydrate matrix. Optimized for hardgainers and serious bulking phases.",
    "shortDescription": "THE ULTIMATE FUEL FOR MUSCLE MASS GROWTH. 52g high-grade protein with 1,050 anabolic calories.",
    "image": "/assets/products/mass-gainer.jpg",
    "images": [
      {
        "url": "/assets/products/mass-gainer.jpg",
        "alt": "Mass-Tein Gainer Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/MASS Tein gainer.jpeg",
        "alt": "Mass-Tein Gainer Tub",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_mtg_3kg",
        "weight": "3 KG",
        "size": "3 KG",
        "flavor": "Swiss Chocolate",
        "servings": 30,
        "price": 2799,
        "originalPrice": 3999,
        "mrp": 3999,
        "discount": 30,
        "stock": 35,
        "sku": "NUT-MTG-3KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/mass-gainer.jpg"
      },
      {
        "_id": "v_mtg_5kg",
        "weight": "5 KG",
        "size": "5 KG",
        "flavor": "Swiss Chocolate",
        "servings": 50,
        "price": 4299,
        "originalPrice": 5999,
        "mrp": 5999,
        "discount": 28,
        "stock": 22,
        "sku": "NUT-MTG-5KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": false,
        "image": "/assets/products/mass-gainer.jpg"
      }
    ],
    "basePrice": 2799,
    "mrp": 3999,
    "minPrice": 2799,
    "maxPrice": 4299,
    "discountPercent": 30,
    "costPrice": 1400,
    "rating": 4.7,
    "reviewCount": 98,
    "badge": "ANABOLIC BULK",
    "isBestSeller": true,
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 57,
    "lowStockThreshold": 10,
    "unitsSold": 88,
    "totalRevenue": 219912,
    "nutrition": {
      "servingSize": "150g",
      "calories": 525,
      "protein": 52,
      "carbohydrates": 72,
      "fat": 4
    },
    "viewCount": 1620
  },
  {
    "_id": "p_ignition_pre",
    "name": "Titan Loaded Pre-Workout (Pump & Focus)",
    "slug": "ignition-pre-workout",
    "brand": "NUTRATEIN",
    "sku": "NUT-IPW-01",
    "barcode": "NUT8901234567896",
    "category": {
      "_id": "cat_pre",
      "name": "Pre-Workout",
      "slug": "pre-workout"
    },
    "description": "THE ULTIMATE FUEL FOR EVERY REP. High-stimulant pre-workout formula with 350mg anhydrous caffeine, 6g fermented L-Citrulline, 3.2g Beta-Alanine, and Nitrosigine® for skin-tearing vascularity and unyielding intensity.",
    "shortDescription": "THE ULTIMATE FUEL FOR EVERY REP. Clinical dose 6000mg L-Citrulline and 350mg caffeine.",
    "image": "/assets/products/pre-workout.jpg",
    "images": [
      {
        "url": "/assets/products/pre-workout.jpg",
        "alt": "Ignition Pre-Workout Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/PreWorkout.jpeg",
        "alt": "Ignition Pre-Workout Tub",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_ipw_300g",
        "weight": "450g",
        "size": "450g",
        "flavor": "Tangy Orange",
        "servings": 30,
        "price": 1999,
        "originalPrice": 2999,
        "mrp": 2999,
        "discount": 33,
        "stock": 45,
        "sku": "NUT-TPW-450G",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/pre-workout.jpg"
      }
    ],
    "basePrice": 1999,
    "mrp": 2999,
    "minPrice": 1999,
    "maxPrice": 1999,
    "discountPercent": 33,
    "costPrice": 950,
    "rating": 4.9,
    "reviewCount": 156,
    "badge": "HIGH STIM",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 45,
    "lowStockThreshold": 10,
    "unitsSold": 115,
    "totalRevenue": 218385,
    "nutrition": {
      "servingSize": "10g",
      "calories": 10,
      "protein": 0,
      "carbohydrates": 2,
      "fat": 0
    },
    "viewCount": 1740
  },
  {
    "_id": "p_lcarnitine",
    "name": "Pure L-Carnitine 3300mg Triple Strength",
    "slug": "l-carnitine-3000-liquid",
    "brand": "NUTRATEIN",
    "sku": "NUT-LCN-01",
    "barcode": "NUT8901234567905",
    "category": {
      "_id": "cat_bcaa",
      "name": "BCAA / EAA",
      "slug": "bcaa-eaa"
    },
    "description": "HELP INCREASE ENERGY & SUPPORT FAT LOSS. Fast-acting triple-strength liquid 3300mg L-Carnitine with Vitamin B5 for enhanced cellular fatty acid oxidation during workouts.",
    "shortDescription": "HELP INCREASE ENERGY & SUPPORT FAT LOSS. 3300mg liquid L-Carnitine.",
    "image": "/assets/products/l-carnitine.jpg",
    "images": [
      {
        "url": "/assets/products/l-carnitine.jpg",
        "alt": "L-Carnitine 3000 Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/L-Carnitine.jpeg",
        "alt": "L-Carnitine Bottle",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_lcn_450ml",
        "weight": "475 ml",
        "size": "475 ml",
        "flavor": "Tangy Orange",
        "servings": 31,
        "price": 1499,
        "originalPrice": 2499,
        "mrp": 2499,
        "discount": 40,
        "stock": 55,
        "sku": "NUT-LCN-475ML",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/l-carnitine.jpg"
      }
    ],
    "basePrice": 1499,
    "mrp": 2499,
    "minPrice": 1499,
    "maxPrice": 1499,
    "discountPercent": 40,
    "costPrice": 620,
    "rating": 4.7,
    "reviewCount": 94,
    "badge": "TRIPLE STRENGTH",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 55,
    "lowStockThreshold": 10,
    "unitsSold": 84,
    "totalRevenue": 109116,
    "nutrition": {
      "servingSize": "15ml",
      "calories": 0,
      "protein": 0,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 1120
  },
  {
    "_id": "p_dinabol",
    "name": "Dianabol 10mg Tablets (Deligas Pharma)",
    "slug": "dinabol-strength-formula",
    "brand": "Deligas Pharma",
    "sku": "NUT-DNB-01",
    "barcode": "NUT8901234567908",
    "category": {
      "_id": "cat_bcaa",
      "name": "Sports Supplements",
      "slug": "supplements"
    },
    "description": "METHANDIENONE U.S.P. 10mg. Pharmaceutical Grade Coated Tablets. Each uncoated tablet contains Methandienone U.S.P. 10mg. 100 Tablets Box (10x10 blister packaging).",
    "shortDescription": "METHANDIENONE U.S.P. 10mg. 100 Coated Tablets Box.",
    "image": "/assets/products/dinabol.jpg",
    "images": [
      {
        "url": "/assets/products/dinabol.jpg",
        "alt": "Dinabol Tablet Front",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "url": "/assets/products/Dinabol tablet.jpeg",
        "alt": "Dinabol Tablet Bottle",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "_id": "v_dnb_60t",
        "weight": "100 Tablets Box",
        "size": "100 Tablets Box",
        "flavor": "Coated Tablets",
        "servings": 100,
        "price": 1199,
        "originalPrice": 1599,
        "mrp": 1599,
        "discount": 25,
        "stock": 60,
        "sku": "NUT-DNB-100T",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/dinabol.jpg"
      }
    ],
    "basePrice": 1199,
    "mrp": 1599,
    "minPrice": 1199,
    "maxPrice": 1199,
    "discountPercent": 25,
    "costPrice": 550,
    "rating": 4.8,
    "reviewCount": 76,
    "badge": "PHARMA GRADE",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 60,
    "lowStockThreshold": 10,
    "unitsSold": 62,
    "totalRevenue": 74338,
    "nutrition": {
      "servingSize": "1 Tablet",
      "calories": 0,
      "protein": 0,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 980
  },
  {
    "_id": "p_clean_plant",
    "name": "Clean Plant Protein",
    "slug": "clean-plant-protein",
    "brand": "NUTRATEIN",
    "sku": "NUT-CPP-01",
    "barcode": "NUT8901234567894",
    "category": {
      "_id": "cat_plant",
      "name": "Plant Protein",
      "slug": "plant-protein"
    },
    "description": "Smooth cold-pressed pea and organic brown rice protein blend. Complete 9 essential amino acid profile, hypoallergenic, dairy-free, non-GMO with natural digestive enzymes.",
    "shortDescription": "25g organic pea and brown rice protein with zero artificial sweeteners.",
    "image": "/assets/products/plant-protein.jpg",
    "images": [
      {
        "url": "/assets/products/plant-protein.jpg",
        "alt": "Clean Plant Protein",
        "isPrimary": true,
        "sortOrder": 0
      }
    ],
    "variants": [
      {
        "_id": "v_cpp_1kg",
        "weight": "1 KG",
        "size": "1 KG",
        "flavor": "Smooth Cocoa",
        "servings": 30,
        "price": 2499,
        "originalPrice": 3299,
        "mrp": 3299,
        "discount": 24,
        "stock": 40,
        "sku": "NUT-CPP-1KG",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/plant-protein.jpg"
      }
    ],
    "basePrice": 2499,
    "mrp": 3299,
    "minPrice": 2499,
    "maxPrice": 2499,
    "discountPercent": 24,
    "costPrice": 1250,
    "rating": 4.6,
    "reviewCount": 134,
    "badge": "VEGAN",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 40,
    "lowStockThreshold": 10,
    "unitsSold": 64,
    "totalRevenue": 159936,
    "nutrition": {
      "servingSize": "33g",
      "calories": 125,
      "protein": 25,
      "carbohydrates": 2,
      "fat": 1.5
    },
    "viewCount": 880
  },
  {
    "_id": "p_bcaa_fuel",
    "name": "Ultra BCAA 2:1:1 Intra-Fuel",
    "slug": "ultra-bcaa-211-intra-fuel",
    "brand": "NUTRATEIN",
    "sku": "NUT-BCA-01",
    "barcode": "NUT8901234567898",
    "category": {
      "_id": "cat_bcaa",
      "name": "BCAA / EAA",
      "slug": "bcaa-eaa"
    },
    "description": "Clinical 2:1:1 ratio of instantized L-Leucine, L-Isoleucine, and L-Valine with Himalayan Pink Salt electrolytes for intra-workout cellular hydration and muscle protection.",
    "shortDescription": "7g vegan BCAAs with raw coconut water powder and electrolytes.",
    "image": "/assets/products/bcaa.jpg",
    "images": [
      {
        "url": "/assets/products/bcaa.jpg",
        "alt": "Ultra BCAA Intra-Fuel",
        "isPrimary": true,
        "sortOrder": 0
      }
    ],
    "variants": [
      {
        "_id": "v_bca_300g",
        "weight": "300g",
        "size": "300g",
        "flavor": "Watermelon Burst",
        "servings": 40,
        "price": 1199,
        "originalPrice": 1699,
        "mrp": 1699,
        "discount": 29,
        "stock": 50,
        "sku": "NUT-BCA-300G",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/bcaa.jpg"
      }
    ],
    "basePrice": 1199,
    "mrp": 1699,
    "minPrice": 1199,
    "maxPrice": 1199,
    "discountPercent": 29,
    "costPrice": 650,
    "rating": 4.7,
    "reviewCount": 128,
    "badge": "RECOVERY",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 50,
    "lowStockThreshold": 10,
    "unitsSold": 76,
    "totalRevenue": 91124,
    "nutrition": {
      "servingSize": "7.5g",
      "calories": 0,
      "protein": 7,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 910
  },
  {
    "_id": "p_multivitamin",
    "name": "Multi-Vitamin Pro Active",
    "slug": "multivitamin-pro-active",
    "brand": "NUTRATEIN",
    "sku": "NUT-MVP-01",
    "barcode": "NUT8901234567899",
    "category": {
      "_id": "cat_vitamins",
      "name": "Vitamins",
      "slug": "vitamins"
    },
    "description": "High-potency daily micronutrient formula with 24 vitamins, chelated minerals, antioxidants, and immune defense complex. Specifically balanced for athletic demands.",
    "shortDescription": "24 essential vitamins and chelated minerals for complete daily defense.",
    "image": "/assets/products/vitamins.jpg",
    "images": [
      {
        "url": "/assets/products/vitamins.jpg",
        "alt": "Multi-Vitamin Pro Active",
        "isPrimary": true,
        "sortOrder": 0
      }
    ],
    "variants": [
      {
        "_id": "v_mvp_60t",
        "weight": "60 Tablets",
        "size": "60 Tablets",
        "servings": 60,
        "price": 699,
        "originalPrice": 999,
        "mrp": 999,
        "discount": 30,
        "stock": 80,
        "sku": "NUT-MVP-60T",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/vitamins.jpg"
      }
    ],
    "basePrice": 699,
    "mrp": 999,
    "minPrice": 699,
    "maxPrice": 699,
    "discountPercent": 30,
    "costPrice": 320,
    "rating": 4.6,
    "reviewCount": 89,
    "badge": "ESSENTIAL",
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 80,
    "lowStockThreshold": 15,
    "unitsSold": 130,
    "totalRevenue": 90870,
    "nutrition": {
      "servingSize": "1 Tablet",
      "calories": 0,
      "protein": 0,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 750
  },
  {
    "_id": "p_pro_shaker",
    "name": "Pro Shaker 700ml — Matte Black",
    "slug": "pro-shaker-700ml",
    "brand": "NUTRATEIN",
    "sku": "NUT-SHK-01",
    "barcode": "NUT8901234567900",
    "category": {
      "_id": "cat_accessories",
      "name": "Accessories",
      "slug": "accessories"
    },
    "description": "BPA-free ergonomic protein shaker with surgical stainless steel blender coil. Guaranteed leak-proof flip lock and embossed measurement markings.",
    "shortDescription": "BPA-free leak-proof matte black protein shaker.",
    "image": "/assets/products/shaker.jpg",
    "images": [
      {
        "url": "/assets/products/shaker.jpg",
        "alt": "Pro Shaker Matte Black",
        "isPrimary": true,
        "sortOrder": 0
      }
    ],
    "variants": [
      {
        "_id": "v_shk_700",
        "weight": "700ml",
        "size": "700ml",
        "servings": 1,
        "price": 499,
        "originalPrice": 799,
        "mrp": 799,
        "discount": 38,
        "stock": 120,
        "sku": "NUT-SHK-700",
        "status": "in_stock",
        "isActive": true,
        "isDefault": true,
        "image": "/assets/products/shaker.jpg"
      }
    ],
    "basePrice": 499,
    "mrp": 799,
    "minPrice": 499,
    "maxPrice": 499,
    "discountPercent": 38,
    "costPrice": 180,
    "rating": 4.5,
    "reviewCount": 167,
    "badge": "ACCESSORY",
    "isBestSeller": true,
    "isFeatured": true,
    "isActive": true,
    "status": "active",
    "stock": 120,
    "lowStockThreshold": 20,
    "unitsSold": 195,
    "totalRevenue": 97305,
    "nutrition": {
      "servingSize": "1 Unit",
      "calories": 0,
      "protein": 0,
      "carbohydrates": 0,
      "fat": 0
    },
    "viewCount": 1100
  }
];

const now = Date.now();
const day = 86400000;

const coupons = [
  {
    _id: 'cpn_1',
    code: 'FIRST10',
    description: '10% off for first-time customers',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscount: 300,
    usageLimit: 1000,
    perCustomerLimit: 1,
    usedCount: 42,
    totalDiscountGenerated: 12450,
    isActive: true,
    startDate: new Date(now - 30 * day),
    expiresAt: new Date(now + 60 * day),
    usedBy: []
  },
  {
    _id: 'cpn_2',
    code: 'SAVE20',
    description: '20% off on orders above ₹2000',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderValue: 2000,
    maxDiscount: 600,
    usageLimit: 500,
    perCustomerLimit: 2,
    usedCount: 85,
    totalDiscountGenerated: 42800,
    isActive: true,
    startDate: new Date(now - 20 * day),
    expiresAt: new Date(now + 45 * day),
    usedBy: []
  },
  {
    _id: 'cpn_3',
    code: 'FLAT300',
    description: 'Flat ₹300 off on orders above ₹1500',
    discountType: 'FIXED',
    discountValue: 300,
    minOrderValue: 1500,
    maxDiscount: 300,
    usageLimit: 300,
    perCustomerLimit: 1,
    usedCount: 64,
    totalDiscountGenerated: 19200,
    isActive: true,
    startDate: new Date(now - 15 * day),
    expiresAt: new Date(now + 30 * day),
    usedBy: []
  },
  {
    _id: 'cpn_4',
    code: 'STACK15',
    description: '15% off on combo/stack orders',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderValue: 1000,
    maxDiscount: 450,
    usageLimit: 200,
    perCustomerLimit: 3,
    usedCount: 38,
    totalDiscountGenerated: 14650,
    isActive: true,
    startDate: new Date(now - 10 * day),
    expiresAt: new Date(now + 20 * day),
    usedBy: []
  },
  {
    _id: 'cpn_5',
    code: 'FLASH500',
    description: 'Flash weekend sale - ₹500 off',
    discountType: 'FIXED',
    discountValue: 500,
    minOrderValue: 2500,
    maxDiscount: 500,
    usageLimit: 100,
    perCustomerLimit: 1,
    usedCount: 12,
    totalDiscountGenerated: 6000,
    isActive: false, // Inactive coupon demo
    startDate: new Date(now - 40 * day),
    expiresAt: new Date(now + 10 * day),
    usedBy: []
  },
  {
    _id: 'cpn_6',
    code: 'EXPIRED50',
    description: 'Summer clearance sale discount',
    discountType: 'PERCENT',
    discountValue: 50,
    minOrderValue: 1000,
    maxDiscount: 1000,
    usageLimit: 50,
    perCustomerLimit: 1,
    usedCount: 50,
    totalDiscountGenerated: 34500,
    isActive: true,
    startDate: new Date(now - 90 * day),
    expiresAt: new Date(now - 5 * day), // Expired coupon demo
    usedBy: []
  }
];

const banners = [
  { _id: 'ban_creatine', title: 'CREATINE POWER & EXPLOSIVE STRENGTH', subtitle: '100% Pure Micronized Creatine Monohydrate for Maximum Muscle Power & ATP Regeneration', description: 'Science-backed creatine monohydrate formulated for pure strength and explosive muscle output.', buttonText: 'Shop Creatine', buttonLink: 'shop.html?category=creatine', link: 'shop.html?category=creatine', cta: 'Shop Creatine', badge: 'EXPLOSIVE POWER', placement: 'Homepage Hero', position: 0, isActive: true, theme: 'dark', image: '/assets/banners/createin banner.png', imageUrl: '/assets/banners/createin banner.png', mobileImageUrl: '/assets/banners/createin banner.png' },
  { _id: 'ban_whey', title: 'NITRO-TEIN PURE WHEY', subtitle: 'Ultra-Filtered Whey Protein for Maximum Lean Muscle Growth & Rapid Recovery', description: 'Ultra-clean whey formula packed with 27g protein and 6.2g BCAAs per scoop.', buttonText: 'Shop Whey Protein', buttonLink: 'shop.html?category=whey-protein', link: 'shop.html?category=whey-protein', cta: 'Shop Whey Protein', badge: 'MAXIMUM RECOVERY', placement: 'Homepage Hero', position: 1, isActive: true, theme: 'dark', image: '/assets/banners/whet red baner.png', imageUrl: '/assets/banners/whet red baner.png', mobileImageUrl: '/assets/banners/whet red baner.png' },
  { _id: 'ban_1', title: 'FUEL YOUR FITNESS', subtitle: 'Premium Protein Supplements', description: 'Premium nutrition designed for your goals. Science-backed formulas trusted by 50,000+ athletes.', buttonText: 'Shop Now', buttonLink: 'shop.html', link: 'shop.html', cta: 'Shop Now', badge: 'UP TO 30% OFF', placement: 'Homepage Hero', position: 2, isActive: true, theme: 'dark', image: '/assets/products/pre-workout.jpg', imageUrl: '/assets/products/pre-workout.jpg', mobileImageUrl: '/assets/products/pre-workout.jpg' },
  { _id: 'ban_2', title: 'UP TO 30% OFF', subtitle: 'Limited Time Offer', description: 'Huge discounts on selected whey, creatine and pre-workout products. Don\'t miss out.', buttonText: 'Explore Deals', buttonLink: 'shop.html?sale=true', link: 'shop.html?sale=true', cta: 'Explore Deals', badge: 'LIMITED TIME', placement: 'Offers Section', position: 3, isActive: true, theme: 'dark', image: '/assets/products/bcaa.jpg', imageUrl: '/assets/products/bcaa.jpg', mobileImageUrl: '/assets/products/bcaa.jpg' },
  { _id: 'ban_3', title: 'BUILD YOUR STACK', subtitle: 'Custom Supplement Bundles', description: 'Mix and match your perfect supplement stack and save 15% on every bundle you create.', buttonText: 'Build Your Stack', buttonLink: 'build-stack.html', link: 'build-stack.html', cta: 'Build Your Stack', badge: '15% BUNDLE SAVINGS', placement: 'Homepage Promotional Section', position: 4, isActive: true, theme: 'dark', image: '/assets/products/shred-whey.jpg', imageUrl: '/assets/products/shred-whey.jpg', mobileImageUrl: '/assets/products/shred-whey.jpg' }
];

const users = [
  {
    _id: 'usr_admin',
    name: 'Adnan Kazi (Super Admin)',
    email: 'kaziadnan275@gmail.com',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    role: 'admin',
    adminRole: 'super_admin',
    phone: '+91 93215 98094',
    isActive: true
  },
  {
    _id: 'usr_demo',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: bcrypt.hashSync('User@123', 10),
    role: 'user',
    phone: '+91 87654 32100',
    addresses: [{
      name: 'John Doe',
      phone: '+91 87654 32100',
      houseFlat: '204, Sunshine Apartments',
      street: 'MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      isDefault: true
    }],
    isActive: true
  },
  {
    _id: 'usr_rahul',
    name: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    passwordHash: bcrypt.hashSync('User@123', 10),
    role: 'user',
    phone: '+91 98220 11223',
    addresses: [{
      name: 'Rahul Sharma',
      phone: '+91 98220 11223',
      houseFlat: 'Flat 5B, Skyline Tower',
      street: 'Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      isDefault: true
    }],
    isActive: true
  },
  {
    _id: 'usr_manager',
    name: 'Vikram Mehta (Manager)',
    email: 'manager@proteinx.in',
    passwordHash: bcrypt.hashSync('Manager@123', 10),
    role: 'admin',
    adminRole: 'admin',
    phone: '+91 98111 22334',
    isActive: true
  },
  {
    _id: 'usr_staff',
    name: 'Pooja Verma (Staff)',
    email: 'staff@proteinx.in',
    passwordHash: bcrypt.hashSync('Staff@123', 10),
    role: 'admin',
    adminRole: 'staff',
    phone: '+91 98222 33445',
    isActive: true
  },
  {
    _id: 'usr_admin_legacy',
    name: 'Admin User',
    email: 'admin@proteinx.in',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    role: 'admin',
    adminRole: 'super_admin',
    phone: '+91 98765 43210',
    isActive: true
  }
];

const orders = [
  {
    _id: 'ord_1',
    orderNumber: 'PX000001',
    invoiceNumber: 'PX-INV-2026-00001',
    user: users[1],
    items: [{
      productId: 'p_gold_whey',
      productName: '100% Gold Standard Whey Isolate',
      productImage: '/assets/products/whey.jpg',
      quantity: 1,
      price: 2999
    }],
    shippingAddress: users[1].addresses[0],
    subtotal: 2999,
    discountAmount: 300,
    shippingAmount: 0,
    taxAmount: 140,
    costAmount: 1750,
    totalAmount: 2699,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'DELIVERED',
    couponCode: 'FIRST10',
    shippingProvider: 'BlueDart Express',
    trackingNumber: 'BD9876543210IN',
    deliveryTimeWindow: 'Morning (9 AM - 1 PM)',
    expectedShippingDate: new Date(now - 7 * day),
    actualShippingDate: new Date(now - 7 * day),
    expectedDeliveryDate: new Date(now - 4 * day),
    actualDeliveryDate: new Date(now - 4 * day),
    deliveryNotes: 'Delivered at security reception as requested.',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 8 * day), note: 'Order placed via UPI', updatedBy: 'Customer' },
      { status: 'PACKED', timestamp: new Date(now - 7 * day), note: 'Quality check passed & securely packed', updatedBy: 'Admin' },
      { status: 'SHIPPED', timestamp: new Date(now - 7 * day), note: 'Handed over to BlueDart (AWB: BD9876543210IN)', updatedBy: 'Admin' },
      { status: 'OUT_FOR_DELIVERY', timestamp: new Date(now - 4 * day), note: 'Courier out for delivery in Mumbai hub', updatedBy: 'BlueDart' },
      { status: 'DELIVERED', timestamp: new Date(now - 4 * day), note: 'Package delivered to recipient', updatedBy: 'BlueDart' }
    ],
    createdAt: new Date(now - 8 * day)
  },
  {
    _id: 'ord_2',
    orderNumber: 'PX000002',
    invoiceNumber: 'PX-INV-2026-00002',
    user: users[2],
    items: [
      {
        productId: 'p_creatine_mono',
        productName: 'Micronized Creatine Monohydrate',
        productImage: '/assets/products/creatine.jpg',
        quantity: 1,
        price: 999
      },
      {
        productId: 'p_pro_shaker',
        productName: 'Pro Shaker 700ml — Matte Black',
        productImage: '/assets/products/shaker.jpg',
        quantity: 1,
        price: 499
      }
    ],
    shippingAddress: users[2].addresses[0],
    subtotal: 1498,
    discountAmount: 0,
    shippingAmount: 0,
    taxAmount: 85,
    costAmount: 700,
    totalAmount: 1498,
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    status: 'SHIPPED',
    couponCode: '',
    shippingProvider: 'Delhivery',
    trackingNumber: 'DEL123456789IN',
    deliveryTimeWindow: 'Afternoon (1 PM - 5 PM)',
    expectedShippingDate: new Date(now - 2 * day),
    actualShippingDate: new Date(now - 1 * day),
    expectedDeliveryDate: new Date(now + 2 * day),
    deliveryNotes: 'Please ring the doorbell before calling.',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 3 * day), note: 'Card payment verified', updatedBy: 'System' },
      { status: 'PROCESSING', timestamp: new Date(now - 2 * day), note: 'Assigned to warehouse packing bin #14', updatedBy: 'Admin' },
      { status: 'PACKED', timestamp: new Date(now - 2 * day), note: 'Sealed with tamper-evident tape', updatedBy: 'Admin' },
      { status: 'SHIPPED', timestamp: new Date(now - 1 * day), note: 'Dispatched via Delhivery Surface', updatedBy: 'Admin' }
    ],
    createdAt: new Date(now - 3 * day)
  },
  {
    _id: 'ord_3',
    orderNumber: 'PX000003',
    invoiceNumber: 'PX-INV-2026-00003',
    user: users[1],
    items: [{
      productId: 'p_ignition_pre',
      productName: 'Ignition Pre-Workout Max',
      productImage: '/assets/products/pre-workout.jpg',
      quantity: 1,
      price: 1799
    }],
    shippingAddress: users[1].addresses[0],
    subtotal: 1799,
    discountAmount: 300,
    shippingAmount: 0,
    taxAmount: 95,
    costAmount: 950,
    totalAmount: 1499,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'OUT_FOR_DELIVERY',
    couponCode: 'FLAT300',
    shippingProvider: 'DTDC Express',
    trackingNumber: 'DTDC888777IN',
    deliveryTimeWindow: 'Morning (9 AM - 1 PM)',
    expectedShippingDate: new Date(now - 3 * day),
    actualShippingDate: new Date(now - 2 * day),
    expectedDeliveryDate: new Date(now), // Today!
    deliveryNotes: 'Call customer upon arrival at gate.',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 3 * day), note: 'Instant UPI clearance', updatedBy: 'System' },
      { status: 'PACKED', timestamp: new Date(now - 2 * day), note: 'Picked and packed', updatedBy: 'Admin' },
      { status: 'SHIPPED', timestamp: new Date(now - 2 * day), note: 'In transit from central warehouse', updatedBy: 'Admin' },
      { status: 'OUT_FOR_DELIVERY', timestamp: new Date(now), note: 'Agent out for delivery', updatedBy: 'DTDC' }
    ],
    createdAt: new Date(now - 3 * day)
  },
  {
    _id: 'ord_4',
    orderNumber: 'PX000004',
    invoiceNumber: 'PX-INV-2026-00004',
    user: users[2],
    items: [{
      productId: 'p_hydro_whey',
      productName: 'Hydro Whey Pro — Hydrolyzed',
      productImage: '/assets/products/whey.jpg',
      quantity: 1,
      price: 3799
    }],
    shippingAddress: users[2].addresses[0],
    subtotal: 3799,
    discountAmount: 600,
    shippingAmount: 0,
    taxAmount: 180,
    costAmount: 2400,
    totalAmount: 3199,
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    status: 'PROCESSING',
    couponCode: 'SAVE20',
    shippingProvider: 'BlueDart Express',
    trackingNumber: '',
    deliveryTimeWindow: 'Standard (10 AM - 6 PM)',
    expectedShippingDate: new Date(now + 1 * day),
    expectedDeliveryDate: new Date(now + 4 * day),
    deliveryNotes: '',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 1 * day), note: 'Order placed', updatedBy: 'Customer' },
      { status: 'PROCESSING', timestamp: new Date(now), note: 'Awaiting dispatch batch allocation', updatedBy: 'Admin' }
    ],
    createdAt: new Date(now - 1 * day)
  },
  {
    _id: 'ord_5',
    orderNumber: 'PX000005',
    invoiceNumber: 'PX-INV-2026-00005',
    user: users[1],
    items: [
      {
        productId: 'p_extreme_mass',
        productName: 'Extreme Mass Gainer 3kg',
        productImage: '/assets/products/mass-gainer.jpg',
        quantity: 1,
        price: 2999
      },
      {
        productId: 'p_bcaa_fuel',
        productName: 'BCAA 2:1:1 Intra-Fuel',
        productImage: '/assets/products/bcaa.jpg',
        quantity: 1,
        price: 1199
      }
    ],
    shippingAddress: users[1].addresses[0],
    subtotal: 4198,
    discountAmount: 0,
    shippingAmount: 0,
    taxAmount: 210,
    costAmount: 2050,
    totalAmount: 4198,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    status: 'CONFIRMED', // DELAYED SHIPMENT DEMO: Expected delivery was 2 days ago!
    couponCode: '',
    shippingProvider: 'India Post',
    trackingNumber: 'IP998877665IN',
    deliveryTimeWindow: 'Evening (5 PM - 9 PM)',
    expectedShippingDate: new Date(now - 5 * day),
    actualShippingDate: new Date(now - 4 * day),
    expectedDeliveryDate: new Date(now - 2 * day), // PAST DATE! Triggers Delivery Delayed Alert
    deliveryNotes: 'Hub delay reported due to regional rain.',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 6 * day), note: 'COD verification phone call completed', updatedBy: 'System' }
    ],
    createdAt: new Date(now - 6 * day)
  },
  {
    _id: 'ord_6',
    orderNumber: 'PX000006',
    invoiceNumber: 'PX-INV-2026-00006',
    user: users[2],
    items: [{
      productId: 'p_clean_plant',
      productName: 'Clean Plant Protein Blend',
      productImage: '/assets/products/plant-protein.jpg',
      quantity: 1,
      price: 2499
    }],
    shippingAddress: users[2].addresses[0],
    subtotal: 2499,
    discountAmount: 0,
    shippingAmount: 0,
    taxAmount: 120,
    costAmount: 1250,
    totalAmount: 2499,
    paymentMethod: 'UPI',
    paymentStatus: 'REFUNDED',
    status: 'REFUNDED',
    couponCode: '',
    shippingProvider: '',
    trackingNumber: '',
    deliveryTimeWindow: 'Standard (10 AM - 6 PM)',
    deliveryNotes: 'Customer requested cancellation prior to packing; refund processed to original UPI account.',
    history: [
      { status: 'CONFIRMED', timestamp: new Date(now - 12 * day), note: 'Order placed', updatedBy: 'Customer' },
      { status: 'CANCELLED', timestamp: new Date(now - 11 * day), note: 'Cancellation requested by customer', updatedBy: 'Admin' },
      { status: 'REFUNDED', timestamp: new Date(now - 11 * day), note: 'Refund of ₹2499 issued via UPI gateway ref #RFND99128', updatedBy: 'Admin' }
    ],
    createdAt: new Date(now - 12 * day)
  }
];

const recommendationStats = [
  {
    productId: 'p_gold_whey',
    productName: '100% Gold Standard Whey Isolate',
    category: 'Whey Protein',
    impressions: 2450,
    clicks: 680,
    cartAdds: 310,
    purchases: 142,
    revenue: 425858,
    conversionRate: 20.88,
    recommendedWith: [
      { productId: 'p_creatine_mono', productName: 'Micronized Creatine Monohydrate', coPurchaseCount: 68 },
      { productId: 'p_pro_shaker', productName: 'Pro Shaker 700ml — Matte Black', coPurchaseCount: 54 },
      { productId: 'p_multivitamin', productName: 'Daily Multivitamin Active Formula', coPurchaseCount: 32 }
    ]
  },
  {
    productId: 'p_creatine_mono',
    productName: 'Micronized Creatine Monohydrate',
    category: 'Creatine',
    impressions: 3100,
    clicks: 890,
    cartAdds: 440,
    purchases: 210,
    revenue: 209790,
    conversionRate: 23.59,
    recommendedWith: [
      { productId: 'p_gold_whey', productName: '100% Gold Standard Whey Isolate', coPurchaseCount: 68 },
      { productId: 'p_ignition_pre', productName: 'Ignition Pre-Workout Max', coPurchaseCount: 42 }
    ]
  },
  {
    productId: 'p_ignition_pre',
    productName: 'Ignition Pre-Workout Max',
    category: 'Pre-Workout',
    impressions: 1650,
    clicks: 410,
    cartAdds: 195,
    purchases: 115,
    revenue: 206885,
    conversionRate: 28.05,
    recommendedWith: [
      { productId: 'p_bcaa_fuel', productName: 'BCAA 2:1:1 Intra-Fuel', coPurchaseCount: 36 },
      { productId: 'p_creatine_mono', productName: 'Micronized Creatine Monohydrate', coPurchaseCount: 29 }
    ]
  },
  {
    productId: 'p_extreme_mass',
    productName: 'Extreme Mass Gainer 3kg',
    category: 'Mass Gainers',
    impressions: 1280,
    clicks: 315,
    cartAdds: 140,
    purchases: 88,
    revenue: 263912,
    conversionRate: 27.94,
    recommendedWith: [
      { productId: 'p_creatine_mono', productName: 'Micronized Creatine Monohydrate', coPurchaseCount: 45 },
      { productId: 'p_pro_shaker', productName: 'Pro Shaker 700ml — Matte Black', coPurchaseCount: 38 }
    ]
  },
  {
    productId: 'p_clean_plant',
    productName: 'Clean Plant Protein Blend',
    category: 'Plant Protein',
    impressions: 980,
    clicks: 220,
    cartAdds: 110,
    purchases: 64,
    revenue: 159936,
    conversionRate: 29.09,
    recommendedWith: [
      { productId: 'p_multivitamin', productName: 'Daily Multivitamin Active Formula', coPurchaseCount: 26 }
    ]
  }
];

const adminLogs = [
  {
    _id: 'log_1',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'COUPON_CREATED',
    module: 'COUPONS',
    description: 'Created new discount coupon SAVE20 (20% off above ₹2000)',
    details: { code: 'SAVE20', discountType: 'PERCENT', discountValue: 20 },
    ip: '127.0.0.1',
    createdAt: new Date(now - 20 * day)
  },
  {
    _id: 'log_2',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'STOCK_UPDATED',
    module: 'PRODUCTS',
    description: 'Updated stock level for Hydro Whey Pro from 4 to 35 units',
    details: { productId: 'p_hydro_whey', oldStock: 4, newStock: 35 },
    ip: '127.0.0.1',
    createdAt: new Date(now - 14 * day)
  },
  {
    _id: 'log_3',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'ORDER_STATUS_CHANGED',
    module: 'ORDERS',
    description: 'Changed order #PX000001 status from SHIPPED to DELIVERED',
    details: { orderId: 'ord_1', status: 'DELIVERED' },
    ip: '127.0.0.1',
    createdAt: new Date(now - 4 * day)
  },
  {
    _id: 'log_4',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'DELIVERY_DATE_UPDATED',
    module: 'SHIPPING',
    description: 'Set expected delivery date for order #PX000003 to today with morning delivery window',
    details: { orderId: 'ord_3', window: 'Morning (9 AM - 1 PM)' },
    ip: '127.0.0.1',
    createdAt: new Date(now - 2 * day)
  },
  {
    _id: 'log_5',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'REFUND_PROCESSED',
    module: 'ORDERS',
    description: 'Processed full refund of ₹2499 for order #PX000006',
    details: { orderId: 'ord_6', refundAmount: 2499, reason: 'Customer cancellation' },
    ip: '127.0.0.1',
    createdAt: new Date(now - 11 * day)
  },
  {
    _id: 'log_6',
    adminId: 'usr_admin',
    adminName: 'Admin User',
    action: 'COUPON_DEACTIVATED',
    module: 'COUPONS',
    description: 'Deactivated promotional coupon FLASH500',
    details: { code: 'FLASH500', previousState: 'Active' },
    ip: '127.0.0.1',
    createdAt: new Date(now - 1 * day)
  }
];

function logAdminAction(adminUserOrObj, action, moduleName, description, details = {}, ip = '127.0.0.1') {
  let logEntry;
  if (adminUserOrObj && typeof adminUserOrObj === 'object' && adminUserOrObj.action) {
    logEntry = {
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      adminId: adminUserOrObj.adminId || 'usr_admin',
      adminName: adminUserOrObj.adminName || 'Admin User',
      action: adminUserOrObj.action,
      module: adminUserOrObj.module || 'GENERAL',
      description: adminUserOrObj.description || '',
      details: adminUserOrObj.details || {},
      ip: adminUserOrObj.ip || '127.0.0.1',
      createdAt: adminUserOrObj.createdAt || new Date()
    };
  } else {
    logEntry = {
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      adminId: adminUserOrObj ? (adminUserOrObj._id || adminUserOrObj.id || 'usr_admin') : 'usr_admin',
      adminName: adminUserOrObj ? (adminUserOrObj.name || 'Admin User') : 'Admin User',
      action,
      module: moduleName,
      description,
      details,
      ip,
      createdAt: new Date()
    };
  }
  adminLogs.unshift(logEntry);
  return logEntry;
}

const stockAlertSubscribers = [
  { productId: 'p_clean_plant', email: 'athlete@proteinx.in', createdAt: new Date(now - 2 * day) }
];

// ── Store Settings ──────────────────────────────────────────────────
const storeSettings = {
  whatsappNumber: '919321598094',
  whatsappPreMessage: 'Hello, I need help with my order/product.',
  processingDays: 1,
  minDeliveryDays: 3,
  maxDeliveryDays: 7,
  returnWindowDays: 7,
  cancellationPolicy: 'Orders can be cancelled before they are shipped.',
  returnPolicy: 'Returns accepted within 7 days of delivery for unopened products.',
  storeName: 'NUTRATEIN Sports Nutrition',
  storeEmail: 'kaziadnan275@gmail.com',
  storePhone: '+91 93215 98094',
  storeAddress: 'NUTRATEIN Sports Nutrition Ltd., MG Road, Mumbai, Maharashtra - 400001',
  storeGSTIN: '27AABCP1234F1Z5',
  lowStockGlobalThreshold: 10,
  barcodeEnabled: true,
  flashSaleEnabled: true,
  pwaEnabled: true,
  emailSettings: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    senderName: 'NUTRATEIN',
    senderEmail: 'kaziadnan275@gmail.com',
    enabled: true
  },
  themeSettings: {
    primaryColor: '#006948',
    secondaryColor: '#006a61',
    accentColor: '#0d9488',
    headerColor: '#FFFFFF',
    footerColor: '#141b2b',
    defaultTheme: 'system',
    borderRadius: '8px',
    cardStyle: 'elevated',
    buttonStyle: 'rounded'
  }
};

// ── Flash Sales ──────────────────────────────────────────────────────
const flashSales = [
  {
    _id: 'fs_1',
    name: '⚡ Weekend Flash Sale',
    description: 'Massive discounts on whey protein for this weekend only!',
    discountType: 'PERCENT',
    discountValue: 20,
    products: ['p_gold_whey', 'p_whey_conc'],
    startAt: new Date(now - 1 * day),
    endAt: new Date(now + 2 * day),
    isActive: true,
    maxQuantityPerUser: 2,
    createdAt: new Date(now - 3 * day)
  },
  {
    _id: 'fs_2',
    name: '🔥 Creatine Mega Deal',
    description: '30% OFF on Creatine Monohydrate — limited stock!',
    discountType: 'PERCENT',
    discountValue: 30,
    products: ['p_creatine_mono'],
    startAt: new Date(now + 3 * day),
    endAt: new Date(now + 5 * day),
    isActive: false,
    maxQuantityPerUser: 3,
    createdAt: new Date(now - 1 * day)
  }
];

// ── Returns & Cancellations ──────────────────────────────────────────
const returns = [
  {
    _id: 'ret_1',
    orderId: 'ord_1',
    orderNumber: 'PX000001',
    userId: 'usr_demo',
    userName: 'John Doe',
    type: 'RETURN',
    reason: 'WRONG_PRODUCT',
    description: 'Received wrong flavor — ordered Double Chocolate but got Vanilla',
    status: 'APPROVED',
    adminNote: 'Pickup scheduled for tomorrow. Refund will be processed in 3-5 days.',
    history: [
      { status: 'REQUESTED', timestamp: new Date(now - 3 * day), by: 'Customer' },
      { status: 'APPROVED', timestamp: new Date(now - 2 * day), by: 'Admin' }
    ],
    createdAt: new Date(now - 3 * day)
  }
];

// ── Barcode verification log ─────────────────────────────────────────
const barcodeVerifications = [];

// ── Videos System (Hero Video & Fitness Video Showcase) ──────────────
const storeVideos = {
  heroVideo: {
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-dumbbells-in-a-gym-44143-large.mp4',
    posterUrl: '/assets/products/pre-workout.jpg',
    title: 'PURE POWER. ZERO COMPROMISE.',
    subtitle: 'Ultra-filtered Whey Isolate packing 27g pure protein, 6.2g BCAAs, and zero added sugar. Scientifically refined for unmatched muscle recovery.',
    badge: '🔥 PREMIUM WHEY COLLECTION',
    ctaPrimaryText: 'SHOP WHEY ISOLATE',
    ctaPrimaryLink: 'shop.html?category=whey-protein',
    ctaSecondaryText: 'EXPLORE ALL PRODUCTS',
    ctaSecondaryLink: 'shop.html',
    active: false,
    autoplay: true,
    loop: true,
    muted: true
  },
  productShowcaseVideo: {
    videoUrl: '/assets/videos/Protein_tub_spinning_video.mp4',
    posterUrl: '/assets/videos/protein_tub_poster.jpg',
    title: 'NUTRATEIN 100% Whey Isolate (2.2kg / 5lbs)',
    badgeText: '360° 3D PRODUCT VIEW',
    tagline: 'ULTRA-LEAN MUSCLE FORMULA',
    proteinGrams: '27g',
    bcaaGrams: '6.2g',
    sugarGrams: '0g',
    purityPercent: '99.4%',
    active: true,
    autoplay: true,
    loop: true,
    muted: true
  },
  fitnessVideos: [
    {
      id: 'vid_strength',
      title: 'EXPLOSIVE STRENGTH & RAW POWER',
      tag: 'PRE-WORKOUT & CREATINE',
      category: 'creatine',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-weights-at-the-gym-44161-large.mp4',
      posterUrl: '/assets/products/shaker.jpg',
      description: 'Ultra-micronized creatine and vasodilating citrulline malate driving muscular glycogen replenishment and explosive bar speed.',
      duration: '0:35',
      ctaText: 'SHOP STRENGTH →',
      ctaLink: 'shop.html?category=creatine',
      sortOrder: 1,
      active: true
    },
    {
      id: 'vid_purity',
      title: 'INSTANT MIXABILITY & ABSORPTION',
      tag: '100% WHEY ISOLATE',
      category: 'whey-protein',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-dumbbells-in-a-gym-44143-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&auto=format&fit=crop&q=80',
      description: 'Cold cross-flow microfiltration delivers 90% pure whey with zero clumping, rapid gastric emptying, and added DigeZyme enzymes.',
      duration: '0:42',
      ctaText: 'SHOP ISOLATE →',
      ctaLink: 'shop.html?category=whey-protein',
      sortOrder: 2,
      active: true
    },
    {
      id: 'vid_recovery',
      title: 'CELLULAR REPAIR & REHYDRATION',
      tag: 'BCAA + ELECTROLYTES',
      category: 'bcaa-eaa',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-exercising-in-a-gym-44158-large.mp4',
      posterUrl: '/assets/products/pre-workout.jpg',
      description: 'Fermented plant-based BCAAs in an optimal 2:1:1 ratio infused with Himalayan pink salt to curb DOMS and rehydrate muscle cells.',
      duration: '0:30',
      ctaText: 'SHOP RECOVERY →',
      ctaLink: 'shop.html?category=bcaa-eaa',
      sortOrder: 3,
      active: true
    }
  ]
};

module.exports = {
  categories,
  products,
  coupons,
  banners,
  users,
  orders,
  stockAlertSubscribers,
  recommendationStats,
  adminLogs,
  logAdminAction,
  storeSettings,
  flashSales,
  returns,
  barcodeVerifications,
  storeVideos
};
