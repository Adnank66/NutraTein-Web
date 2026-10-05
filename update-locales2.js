const fs = require('fs');

const locales = ['en', 'hi', 'mr', 'ta'];
const translations = {
  en: {
    home: {
      personalisedNutrition: "Personalised nutrition",
      recommended: "Recommended",
      forYou: "for you.",
      recommendedDesc: "Choose a product category to find the nutrition that best supports your training, recovery, and next workout.",
      exploreAllProducts: "Explore all products",
      hoverGuidance: "Hover over a product to inspect it · Select a type to bring it into view",
      exploreCatalog: "Explore Catalog",
      shopByCategory: "Shop by Category",
      shopByCategoryDesc: "Find the targeted nutrition formulas designed for your fitness goals.",
      viewAllCategories: "View All Categories"
    },
    footer: {
      description: "India's clean fitness nutrition brand. Engineered with pure ingredients, certified purity, and 100% label transparency to fuel your athletic potential.",
      followUs: "Follow NUTRA TEIN",
      shopFormulas: "Shop Formulas",
      customerSupport: "Customer Support",
      company: "Company",
      secureCheckout: "100% Secure Checkout:"
    }
  }
};

['hi', 'mr', 'ta'].forEach(loc => {
  translations[loc] = translations.en;
});

locales.forEach(loc => {
  const path = `src/locales/${loc}.json`;
  if (fs.existsSync(path)) {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    const merge = (target, source) => {
      for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && target[key]) {
          Object.assign(source[key], merge(target[key], source[key]))
        }
      }
      Object.assign(target || {}, source)
      return target
    }

    merge(data, translations[loc]);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }
});
