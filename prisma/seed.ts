import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Cleaning database...")
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.address.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log("Seeding Users...")
  const hashedPassword = await bcrypt.hash("Admin@123", 10)
  const userPassword = await bcrypt.hash("User@123", 10)

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@proteinx.in",
      password: hashedPassword,
      role: "ADMIN",
      phone: "9876543210",
    },
  })

  const demoUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: userPassword,
      role: "USER",
      phone: "9123456780",
    },
  })

  const demoUser2 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@example.com",
      password: userPassword,
      role: "USER",
      phone: "9876123450",
    },
  })

  console.log("Seeding Addresses...")
  await prisma.address.create({
    data: {
      userId: demoUser.id,
      name: "John Doe",
      phone: "9123456780",
      houseFlat: "Flat 402, Sunshine Heights",
      street: "MG Road, Bandra West",
      area: "Near Bandra Station",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      country: "India",
      isDefault: true,
    },
  })

  console.log("Seeding Categories...")
  const categoriesData = [
    { name: "Whey Protein", slug: "whey-protein", description: "Ultra-filtered premium whey protein for maximum muscle recovery and synthesis.", icon: "🥛", sortOrder: 1 },
    { name: "Plant Protein", slug: "plant-protein", description: "100% vegan organic plant protein blends sourced from peas, brown rice, and chia seeds.", icon: "🌿", sortOrder: 2 },
    { name: "Mass Gainers", slug: "mass-gainers", description: "High-calorie complex carb and protein formulas designed for rapid mass and muscle gaining.", icon: "💪", sortOrder: 3 },
    { name: "Creatine", slug: "creatine", description: "Micronized pure creatine monohydrate to enhance explosive strength and power output.", icon: "⚡", sortOrder: 4 },
    { name: "Pre-Workout", slug: "pre-workout", description: "Advanced energy, focus, and pump blends for intense workout sessions.", icon: "🔥", sortOrder: 5 },
    { name: "BCAA / EAA", slug: "bcaa-eaa", description: "Essential and branched-chain amino acids for intra-workout hydration and muscle sparing.", icon: "💧", sortOrder: 6 },
    { name: "Vitamins & Minerals", slug: "vitamins", description: "Comprehensive daily multivitamins and joint support formulated specifically for athletes.", icon: "💊", sortOrder: 7 },
    { name: "Gym Accessories", slug: "accessories", description: "Leak-proof shakers, lifting straps, and gym gear engineered for serious lifters.", icon: "🥤", sortOrder: 8 },
  ]

  const categories: Record<string, any> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categories[cat.slug] = created
  }

  console.log("Seeding Products...")
  const productsData = [
    // Whey Protein
    {
      name: "PROTEINX 100% Gold Whey Isolate",
      slug: "proteinx-100-gold-whey-isolate",
      brand: "PROTEINX",
      categoryId: categories["whey-protein"].id,
      description: "PROTEINX 100% Gold Whey Isolate is the benchmark in sports nutrition. Formulated with 100% ultra-pure cross-flow micro-filtered whey protein isolate, providing 27g of pure protein per scoop with zero added sugars and ultra-low fat. Ideal for athletes seeking lean muscle growth and accelerated recovery without bloating.",
      shortDesc: "27g pure Whey Isolate per serving with 6.2g BCAAs and zero added sugar.",
      basePrice: 3299,
      mrp: 4499,
      discountPercent: 27,
      rating: 4.9,
      reviewCount: 342,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      howToUse: "Mix 1 rounded scoop (33g) with 200-250ml of cold water or skimmed milk. Consume immediately post-workout or first thing in the morning on non-training days.",
      ingredients: "Whey Protein Isolate (92%), Natural and Nature Identical Flavors, Cocoa Powder (in Chocolate variants), Sunflower Lecithin, Digestive Enzyme Blend (DigeZyme®), Sucralose.",
      benefits: "Supports muscle protein synthesis, enhances recovery between heavy sessions, low calorie density suitable for cutting phases, easily digestible with added digestive enzymes.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (33g)" },
        { nutrient: "Calories", amount: "120 kcal" },
        { nutrient: "Protein", amount: "27g" },
        { nutrient: "Total Carbohydrates", amount: "1.2g" },
        { nutrient: "Dietary Fiber", amount: "0.5g" },
        { nutrient: "Total Fat", amount: "0.8g" },
        { nutrient: "BCAAs", amount: "6.2g" },
        { nutrient: "Glutamic Acid", amount: "4.8g" },
      ]),
      tags: "whey,isolate,protein,lean muscle,low carb",
      images: [
        { url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Gold Whey Isolate Front" },
        { url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80", isPrimary: false, alt: "Gold Whey Isolate Lifestyle" },
      ],
      variants: [
        { flavor: "Double Rich Chocolate", size: "1 kg (2.2 lbs)", sku: "PX-GWI-CHOC-1KG", price: 3299, stock: 45 },
        { flavor: "Double Rich Chocolate", size: "2 kg (4.4 lbs)", sku: "PX-GWI-CHOC-2KG", price: 5999, stock: 30 },
        { flavor: "Cafe Mocha", size: "1 kg (2.2 lbs)", sku: "PX-GWI-MOC-1KG", price: 3299, stock: 25 },
        { flavor: "Vanilla Almond", size: "1 kg (2.2 lbs)", sku: "PX-GWI-VAN-1KG", price: 3299, stock: 20 },
      ],
    },
    {
      name: "PROTEINX Performance Whey Concentrate Blend",
      slug: "proteinx-performance-whey-concentrate",
      brand: "PROTEINX",
      categoryId: categories["whey-protein"].id,
      description: "Our Performance Whey combines high-grade Whey Protein Concentrate with Whey Peptides to deliver 24g of rich protein per serving. Perfect for daily fitness enthusiasts and beginners looking for great taste, smooth mixability, and reliable muscle fuel.",
      shortDesc: "24g premium Whey Blend with 5.5g BCAAs and delicious gourmet taste.",
      basePrice: 2199,
      mrp: 2999,
      discountPercent: 27,
      rating: 4.7,
      reviewCount: 215,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      howToUse: "Add 1 scoop to 200ml of cold water or milk and shake well for 20 seconds. Take 1-2 servings daily.",
      ingredients: "Whey Protein Blend (Whey Protein Concentrate, Whey Protein Peptides), Cocoa Powder, Natural Flavors, Gum Blend (Cellulose, Xanthan, Carrageenan), Salt, Stevia Extract.",
      benefits: "Promotes lean muscle repair, supports daily protein target intake, rich creamy milkshake texture.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (35g)" },
        { nutrient: "Calories", amount: "140 kcal" },
        { nutrient: "Protein", amount: "24g" },
        { nutrient: "Carbohydrates", amount: "3.5g" },
        { nutrient: "Total Fat", amount: "2.0g" },
        { nutrient: "BCAAs", amount: "5.5g" },
      ]),
      tags: "whey,concentrate,beginner,muscle",
      images: [
        { url: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Performance Whey Front" },
      ],
      variants: [
        { flavor: "Chocolate Fudge", size: "1 kg (2.2 lbs)", sku: "PX-PWC-CHOC-1KG", price: 2199, stock: 60 },
        { flavor: "Chocolate Fudge", size: "2 kg (4.4 lbs)", sku: "PX-PWC-CHOC-2KG", price: 3999, stock: 40 },
        { flavor: "Cookies & Cream", size: "1 kg (2.2 lbs)", sku: "PX-PWC-CNC-1KG", price: 2199, stock: 35 },
        { flavor: "Strawberry Blast", size: "1 kg (2.2 lbs)", sku: "PX-PWC-STR-1KG", price: 2199, stock: 18 },
      ],
    },
    {
      name: "PROTEINX Hydrolyzed Platinum Whey",
      slug: "proteinx-hydrolyzed-platinum-whey",
      brand: "PROTEINX",
      categoryId: categories["whey-protein"].id,
      description: "Hydrolyzed whey broken down into micro-peptides for instantaneous cellular absorption. The fastest digesting protein on the market, virtually free of lactose and cholesterol.",
      shortDesc: "30g Hydrolyzed Whey with ultra-rapid absorption rate.",
      basePrice: 4499,
      mrp: 5999,
      discountPercent: 25,
      rating: 4.9,
      reviewCount: 88,
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      howToUse: "Take 1 scoop immediately after strenuous athletic training.",
      ingredients: "Hydrolyzed Whey Protein Isolate, Natural Flavors, DigeZyme, Stevia Extract.",
      benefits: "Ultra-fast gastric emptying, zero digestive discomfort, ideal for elite athletes.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (34g)" },
        { nutrient: "Calories", amount: "125 kcal" },
        { nutrient: "Protein", amount: "30g" },
        { nutrient: "Total Fat", amount: "0.5g" },
        { nutrient: "Carbohydrates", amount: "0.8g" },
      ]),
      tags: "hydrolyzed,pro,elite,whey",
      images: [
        { url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Hydro Whey" },
      ],
      variants: [
        { flavor: "Swiss Chocolate", size: "1.5 kg", sku: "PX-HYD-SWISS-1.5KG", price: 4499, stock: 15 },
        { flavor: "Caramel Latte", size: "1.5 kg", sku: "PX-HYD-CAR-1.5KG", price: 4499, stock: 12 },
      ],
    },

    // Plant Protein
    {
      name: "PROTEINX Organic Plant Protein 25g",
      slug: "proteinx-organic-plant-protein",
      brand: "PROTEINX",
      categoryId: categories["plant-protein"].id,
      description: "Complete plant protein engineered from organic yellow pea protein isolate, organic sprouted brown rice protein, and organic chia seed powder. Delivers all 9 essential amino acids in an optimal ratio for vegan and plant-first fitness enthusiasts.",
      shortDesc: "25g complete vegan protein blend with superfoods and digestive enzymes.",
      basePrice: 2499,
      mrp: 3299,
      discountPercent: 24,
      rating: 4.8,
      reviewCount: 142,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      howToUse: "Blend 1 scoop into 300ml of water, almond milk, or your favorite smoothie bowl.",
      ingredients: "Organic Pea Protein Isolate, Organic Brown Rice Protein, Organic Quinoa Powder, Raw Cacao, Organic Stevia, Papain & Bromelain Enzyme Blend.",
      benefits: "100% Dairy-free, Soy-free, Non-GMO, gentle on gut with zero bloating.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (36g)" },
        { nutrient: "Calories", amount: "135 kcal" },
        { nutrient: "Protein", amount: "25g" },
        { nutrient: "Carbohydrates", amount: "3g" },
        { nutrient: "Dietary Fiber", amount: "2.5g" },
        { nutrient: "Fat", amount: "2.2g" },
      ]),
      tags: "vegan,plant,organic,dairy-free",
      images: [
        { url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Organic Plant Protein" },
      ],
      variants: [
        { flavor: "Belgian Chocolate", size: "1 kg", sku: "PX-PLANT-CHOC-1KG", price: 2499, stock: 30 },
        { flavor: "Vanilla Matcha", size: "1 kg", sku: "PX-PLANT-MAT-1KG", price: 2499, stock: 22 },
      ],
    },

    // Mass Gainers
    {
      name: "PROTEINX Monster Mass Gainer XXL",
      slug: "proteinx-monster-mass-gainer-xxl",
      brand: "PROTEINX",
      categoryId: categories["mass-gainers"].id,
      description: "Designed for hardgainers struggling to pack on size. Monster Mass Gainer provides 1200+ clean calories, 52g high-biological-value protein, and 240g multi-stage complex carbohydrates per serving to ensure continuous glycogen replenishment.",
      shortDesc: "1200+ Calories, 52g Multi-Stage Protein & 240g Complex Carbs.",
      basePrice: 2899,
      mrp: 3999,
      discountPercent: 28,
      rating: 4.6,
      reviewCount: 198,
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      howToUse: "Mix 2 scoops (150g) in 400ml milk twice daily between meals and post-workout.",
      ingredients: "Complex Carbohydrate Blend (Maltodextrin, Oat Flour, Sweet Potato Powder), Protein Blend (Whey Concentrate, Calcium Caseinate), MCT Oil Powder, Cocoa, Vitamins & Minerals.",
      benefits: "Accelerates caloric surplus for muscle size, sustained energy release, enriched with MCTs.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "2 Scoops (150g)" },
        { nutrient: "Calories", amount: "620 kcal" },
        { nutrient: "Protein", amount: "26g" },
        { nutrient: "Carbohydrates", amount: "120g" },
        { nutrient: "Fat", amount: "4.5g" },
      ]),
      tags: "mass,gainer,bulking,calories",
      images: [
        { url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Mass Gainer" },
      ],
      variants: [
        { flavor: "Chocolate Truffle", size: "3 kg (6.6 lbs)", sku: "PX-MASS-CHOC-3KG", price: 2899, stock: 35 },
        { flavor: "Chocolate Truffle", size: "5 kg (11 lbs)", sku: "PX-MASS-CHOC-5KG", price: 4499, stock: 20 },
        { flavor: "Banana Cream", size: "3 kg (6.6 lbs)", sku: "PX-MASS-BAN-3KG", price: 2899, stock: 15 },
      ],
    },

    // Creatine
    {
      name: "PROTEINX Micronized Pure Creatine Monohydrate",
      slug: "proteinx-micronized-pure-creatine",
      brand: "PROTEINX",
      categoryId: categories["creatine"].id,
      description: "Pharmaceutical grade 200 mesh micronized creatine monohydrate. Maximizes intramuscular phosphocreatine stores, leading to increased ATP production, explosive power, sprint speed, and cellular hydration.",
      shortDesc: "3g 100% Pure Micronized Creatine per serving, 0 fillers, 100% unflavored.",
      basePrice: 899,
      mrp: 1299,
      discountPercent: 31,
      rating: 4.9,
      reviewCount: 450,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      howToUse: "Mix 1 level scoop (3g) with water, fruit juice, or your protein shake daily. Maintain high hydration.",
      ingredients: "100% Pure Micronized Creatine Monohydrate (200 Mesh).",
      benefits: "Increases muscular power output, improves high-intensity training volume, supports brain health.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (3g)" },
        { nutrient: "Creatine Monohydrate", amount: "3000mg" },
        { nutrient: "Calories", amount: "0 kcal" },
      ]),
      tags: "creatine,monohydrate,strength,power",
      images: [
        { url: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Creatine Monohydrate" },
      ],
      variants: [
        { flavor: "Unflavored", size: "250g (83 servings)", sku: "PX-CRE-UNF-250G", price: 899, stock: 80 },
        { flavor: "Unflavored", size: "500g (166 servings)", sku: "PX-CRE-UNF-500G", price: 1599, stock: 50 },
        { flavor: "Blue Raspberry", size: "250g (83 servings)", sku: "PX-CRE-BLU-250G", price: 949, stock: 35 },
      ],
    },

    // Pre-Workout
    {
      name: "PROTEINX HyperDrive Pre-Workout 3.0",
      slug: "proteinx-hyperdrive-pre-workout",
      brand: "PROTEINX",
      categoryId: categories["pre-workout"].id,
      description: "Clinically dosed pre-workout formula containing 6000mg L-Citrulline for extreme vasodilation & pump, 3200mg Beta-Alanine for lactic acid buffering, and 300mg Caffeine + L-Theanine for razor-sharp tunnel-vision focus without the post-workout crash.",
      shortDesc: "6g L-Citrulline, 3.2g Beta-Alanine & 300mg Clean Caffeine for laser focus.",
      basePrice: 1799,
      mrp: 2499,
      discountPercent: 28,
      rating: 4.8,
      reviewCount: 310,
      isFeatured: true,
      isBestSeller: true,
      isNew: true,
      howToUse: "Mix 1 scoop (12g) with 250-300ml cold water 20-30 minutes before your workout. Do not exceed 1 scoop in 24 hours.",
      ingredients: "L-Citrulline Malate (2:1), Beta-Alanine, L-Tyrosine, Caffeine Anhydrous, Alpha GPC, AstraGin®, Natural Flavors, Citric Acid, Sucralose.",
      benefits: "Skin-splitting muscle pumps, intense mental clarity, prevents premature muscular fatigue.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (12g)" },
        { nutrient: "L-Citrulline", amount: "6000mg" },
        { nutrient: "Beta-Alanine", amount: "3200mg" },
        { nutrient: "L-Tyrosine", amount: "1000mg" },
        { nutrient: "Caffeine Anhydrous", amount: "300mg" },
        { nutrient: "Alpha GPC", amount: "300mg" },
      ]),
      tags: "preworkout,energy,pump,focus",
      images: [
        { url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "HyperDrive Pre-Workout" },
      ],
      variants: [
        { flavor: "Fruit Punch", size: "360g (30 Servings)", sku: "PX-PRE-FP-30S", price: 1799, stock: 40 },
        { flavor: "Electric Blue Razz", size: "360g (30 Servings)", sku: "PX-PRE-BR-30S", price: 1799, stock: 35 },
        { flavor: "Watermelon Surge", size: "360g (30 Servings)", sku: "PX-PRE-WM-30S", price: 1799, stock: 25 },
      ],
    },

    // BCAA / EAA
    {
      name: "PROTEINX HydroFuel Intra-Workout BCAA + EAA",
      slug: "proteinx-hydrofuel-bcaa-eaa",
      brand: "PROTEINX",
      categoryId: categories["bcaa-eaa"].id,
      description: "Complete spectrum of 9 Essential Amino Acids including 7g of 2:1:1 Fermented BCAAs paired with Coconut Water Powder and Himalayan Pink Salt for optimal cellular rehydration and intra-workout anti-catabolic protection.",
      shortDesc: "7g Fermented BCAAs + Full EAA profile + Himalayan Electrolytes.",
      basePrice: 1399,
      mrp: 1899,
      discountPercent: 26,
      rating: 4.7,
      reviewCount: 165,
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      howToUse: "Sip 1 scoop mixed in 500ml ice-cold water throughout your training session.",
      ingredients: "Instantiated Vegan BCAAs (L-Leucine, L-Isoleucine, L-Valine), Essential Amino Acid Complex, Raw Coconut Water Powder, Himalayan Pink Salt, Malic Acid.",
      benefits: "Prevents intra-workout muscle breakdown, accelerates recovery, enhances endurance.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Scoop (11g)" },
        { nutrient: "Total BCAAs (2:1:1)", amount: "7000mg" },
        { nutrient: "Total EAAs", amount: "9500mg" },
        { nutrient: "Coconut Water Powder", amount: "500mg" },
        { nutrient: "Sodium (Himalayan Salt)", amount: "180mg" },
      ]),
      tags: "bcaa,eaa,recovery,intra-workout,hydration",
      images: [
        { url: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "HydroFuel BCAA" },
      ],
      variants: [
        { flavor: "Green Apple", size: "330g (30 Servings)", sku: "PX-BCAA-GAP-30S", price: 1399, stock: 45 },
        { flavor: "Mango Mania", size: "330g (30 Servings)", sku: "PX-BCAA-MAN-30S", price: 1399, stock: 38 },
      ],
    },

    // Vitamins
    {
      name: "PROTEINX Athlete Multi-V Multi-Mineral 60 Caps",
      slug: "proteinx-athlete-multi-v",
      brand: "PROTEINX",
      categoryId: categories["vitamins"].id,
      description: "High-potency daily micronutrient supplement engineered for active individuals. Contains 30+ vital vitamins, chelated minerals, antioxidants, and joint support botanicals.",
      shortDesc: "30+ active vitamins, chelated minerals, and immunity enhancers.",
      basePrice: 699,
      mrp: 999,
      discountPercent: 30,
      rating: 4.9,
      reviewCount: 220,
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      howToUse: "Take 1 tablet daily with breakfast or lunch.",
      ingredients: "Vitamin A, C, D3, E, B-Complex, Zinc Picolinate, Magnesium Glycinate, Ashwagandha Root Extract, BioPerine®.",
      benefits: "Boosts immune defense, enhances daily energy metabolism, supports connective tissue health.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Serving Size", amount: "1 Tablet" },
        { nutrient: "Vitamin C", amount: "100mg (125% RDA)" },
        { nutrient: "Vitamin D3", amount: "2000 IU (250% RDA)" },
        { nutrient: "Zinc", amount: "15mg (100% RDA)" },
        { nutrient: "Magnesium", amount: "100mg" },
      ]),
      tags: "vitamins,multivitamin,immunity,minerals",
      images: [
        { url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Multi-V Front" },
      ],
      variants: [
        { flavor: "Unflavored", size: "60 Tablets", sku: "PX-MV-60T", price: 699, stock: 90 },
        { flavor: "Unflavored", size: "120 Tablets", sku: "PX-MV-120T", price: 1199, stock: 60 },
      ],
    },

    // Accessories
    {
      name: "PROTEINX Pro Matte Black Shaker 700ml",
      slug: "proteinx-pro-shaker-700ml",
      brand: "PROTEINX",
      categoryId: categories["accessories"].id,
      description: "100% leak-proof, BPA-free, premium ergonomic protein shaker bottle with stainless steel whisk ball for clump-free shakes in seconds.",
      shortDesc: "700ml BPA-free leak-proof matte shaker with stainless wire whisk.",
      basePrice: 399,
      mrp: 599,
      discountPercent: 33,
      rating: 4.8,
      reviewCount: 512,
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      howToUse: "Add liquid first, then powder, insert whisk ball and shake vigorously for 15 seconds.",
      ingredients: "BPA & DEHP-free Food Grade Polypropylene (PP), 316 Surgical Stainless Steel Whisk.",
      benefits: "100% leakproof guarantee, easy to clean, odor resistant material.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Capacity", amount: "700ml (24 oz)" },
        { nutrient: "Material", amount: "BPA-Free PP5" },
      ]),
      tags: "shaker,bottle,accessory,gym",
      images: [
        { url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Pro Shaker Bottle" },
      ],
      variants: [
        { flavor: "Stealth Black", size: "700ml", sku: "PX-SHK-BLK-700", price: 399, stock: 120 },
        { flavor: "Frost Clear", size: "700ml", sku: "PX-SHK-CLR-700", price: 399, stock: 80 },
        { flavor: "Neon Orange", size: "700ml", sku: "PX-SHK-ORG-700", price: 399, stock: 65 },
      ],
    },

    // Combo Bundles
    {
      name: "PROTEINX Ultimate Muscle Building Combo",
      slug: "proteinx-ultimate-muscle-building-combo",
      brand: "PROTEINX",
      categoryId: categories["whey-protein"].id,
      description: "The complete trifecta for serious muscle hypertrophy: 1kg Gold Whey Isolate + 250g Micronized Creatine + 700ml Pro Shaker Bottle. Save big when you buy as a stack!",
      shortDesc: "Gold Whey 1kg + Micronized Creatine 250g + Free Pro Shaker.",
      basePrice: 3999,
      mrp: 5797,
      discountPercent: 31,
      rating: 5.0,
      reviewCount: 94,
      isFeatured: true,
      isBestSeller: true,
      isNew: true,
      howToUse: "Use Whey post-workout and Creatine daily with your breakfast.",
      ingredients: "Includes full size 1kg Whey Isolate, 250g Pure Creatine, and Pro Shaker.",
      benefits: "Maximum muscle growth synergy, saves over ₹1,700 compared to individual items.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Combo Contents", amount: "1x Whey 1kg, 1x Creatine 250g, 1x Shaker" },
      ]),
      tags: "combo,stack,bundle,muscle building,whey,creatine",
      images: [
        { url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Muscle Building Combo" },
      ],
      variants: [
        { flavor: "Double Chocolate + Unflavored", size: "Full Stack", sku: "PX-CMB-MUSCLE-01", price: 3999, stock: 30 },
      ],
    },
    {
      name: "PROTEINX Explosive Pre-Workout Stack",
      slug: "proteinx-explosive-pre-workout-stack",
      brand: "PROTEINX",
      categoryId: categories["pre-workout"].id,
      description: "Dominate your workouts from start to finish. Includes HyperDrive Pre-Workout 3.0 + Pure Creatine Monohydrate + Pro Shaker Bottle.",
      shortDesc: "HyperDrive Pre-Workout 360g + Creatine 250g + Free Pro Shaker.",
      basePrice: 2699,
      mrp: 3797,
      discountPercent: 29,
      rating: 4.9,
      reviewCount: 67,
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      howToUse: "Take Pre-Workout 25 mins before training and Creatine daily.",
      ingredients: "Full HyperDrive tub, Creatine tub, and Pro Shaker.",
      benefits: "Extreme energy, vasodilation pumps, and explosive strength.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Combo Contents", amount: "1x Pre-Workout 30 serv, 1x Creatine 250g, 1x Shaker" },
      ]),
      tags: "combo,preworkout,creatine,stack",
      images: [
        { url: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80", isPrimary: true, alt: "Pre-Workout Stack" },
      ],
      variants: [
        { flavor: "Fruit Punch + Unflavored", size: "Full Stack", sku: "PX-CMB-PUMP-01", price: 2699, stock: 25 },
      ],
    },
  ]

  for (const prod of productsData) {
    const { images, variants, ...prodFields } = prod
    const created = await prisma.product.create({
      data: {
        ...prodFields,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: idx,
          })),
        },
        variants: {
          create: variants.map((v) => ({
            flavor: v.flavor,
            size: v.size,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            isActive: true,
          })),
        },
      },
    })

    // Seed realistic reviews
    await prisma.review.createMany({
      data: [
        {
          productId: created.id,
          userId: demoUser.id,
          rating: 5,
          title: "Incredible quality and taste!",
          body: "One of the smoothest proteins I have ever used. Tastes fantastic in water and dissolves completely without lumps.",
          isVerified: true,
        },
        {
          productId: created.id,
          userId: demoUser2.id,
          rating: 5,
          title: "Genuine product with great results",
          body: "Ordered last week, received within 3 days. Digestion is super easy, no bloating at all. Highly satisfied with PROTEINX.",
          isVerified: true,
        },
      ],
    })
  }

  console.log("Seeding Coupons...")
  const couponsData = [
    { code: "FIRST10", description: "10% off for first-time orders", discountType: "PERCENT", discountValue: 10, minOrderValue: 500, maxDiscount: 500, isActive: true },
    { code: "SAVE20", description: "20% off on orders above ₹2499", discountType: "PERCENT", discountValue: 20, minOrderValue: 2499, maxDiscount: 1000, isActive: true },
    { code: "FLAT300", description: "Flat ₹300 off on orders above ₹1999", discountType: "FIXED", discountValue: 300, minOrderValue: 1999, isActive: true },
    { code: "FREESHIP", description: "Free shipping on any order value", discountType: "FIXED", discountValue: 99, minOrderValue: 0, isActive: true },
    { code: "POWER500", description: "Flat ₹500 off on premium combos", discountType: "FIXED", discountValue: 500, minOrderValue: 3499, isActive: true },
  ]

  for (const c of couponsData) {
    await prisma.coupon.create({ data: c })
  }

  console.log("Seeding Demo Orders...")
  const sampleProduct = await prisma.product.findFirst({
    include: { variants: true },
  })

  if (sampleProduct && sampleProduct.variants[0]) {
    const order1 = await prisma.order.create({
      data: {
        orderNumber: "PX-DEMO-001",
        userId: demoUser.id,
        status: "DELIVERED",
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        subtotal: 3299,
        discountAmount: 329.9,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: 2969.1,
        couponCode: "FIRST10",
        items: {
          create: [
            {
              productId: sampleProduct.id,
              variantId: sampleProduct.variants[0].id,
              quantity: 1,
              price: sampleProduct.variants[0].price,
              productName: sampleProduct.name,
              flavor: sampleProduct.variants[0].flavor,
              size: sampleProduct.variants[0].size,
            },
          ],
        },
        payment: {
          create: {
            amount: 2969.1,
            status: "PAID",
            method: "UPI",
            transactionId: "UPI_TXN_987654321",
          },
        },
      },
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: "PX-DEMO-002",
        userId: demoUser.id,
        status: "PROCESSING",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        subtotal: 1799,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: 1799,
        items: {
          create: [
            {
              productId: sampleProduct.id,
              variantId: sampleProduct.variants[0].id,
              quantity: 1,
              price: 1799,
              productName: sampleProduct.name,
              flavor: "Fruit Punch",
              size: "360g",
            },
          ],
        },
      },
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
