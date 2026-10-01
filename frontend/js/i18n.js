/**
 * PROTEINX — Centralized Multilingual Translation System
 * Supports: English (en), Hindi (hi), Marathi (mr)
 */

const translations = {
  en: {
    // Top Bar & Header
    "announcement": "🚀 FREE SHIPPING ON ORDERS ABOVE ₹999 | Use code FIRST10 for 10% off",
    "nav_home": "Home",
    "nav_shop": "Shop",
    "nav_categories": "Categories",
    "nav_build_stack": "Build Stack",
    "nav_deals": "Deals",
    "nav_about": "About Us",
    "nav_contact": "Contact",
    "nav_account": "My Account",
    "nav_sign_in": "Sign In",
    "search_placeholder": "Search supplements, brands, whey isolate...",

    // Universal Nav
    "btn_back": "Back",
    "btn_home": "Home",
    "back_to_home": "Back to Home",

    // Common Actions & Badges
    "add_to_cart": "Add to Cart",
    "added_to_cart": "Added to cart",
    "quick_view": "Quick View",
    "bestseller": "BESTSELLER",
    "new": "NEW",
    "in_stock": "In Stock",
    "low_stock": "Only a few left!",
    "out_of_stock": "Out of Stock",
    "notify_me": "Notify Me",
    "notify_modal_title": "Get Notified When Available",
    "notify_modal_sub": "Enter your email address and we'll alert you as soon as this item is back in stock.",
    "notify_email_placeholder": "your.email@example.com",
    "notify_btn_submit": "Notify Me",

    // Sections
    "sec_shop_category": "Shop by Category",
    "sec_shop_category_sub": "Pure, lab-tested supplements formulated for every athletic discipline.",
    "sec_bestsellers": "Best Sellers",
    "sec_bestsellers_sub": "Our highest rated formulations trusted by 50,000+ athletes across India.",
    "sec_best_products": "Best Rated Products",
    "sec_best_products_sub": "Scientifically ranked based on purity, customer reviews, and athletic popularity.",
    "sec_recommended": "Recommended For You",
    "sec_recommended_sub": "Tailored supplement selections aligned with your fitness ambitions.",
    "sec_why_choose": "Why Choose PROTEINX?",
    "sec_why_choose_sub": "Uncompromising standards in transparency, formulation purity, and gut absorption.",
    "sec_build_stack": "Build Your Stack & Save 15%",
    "sec_build_stack_sub": "Combine protein, creatine, and pre-workout for customized synergy and bundle savings.",
    "sec_faq": "Frequently Asked Questions",
    "sec_faq_sub": "Everything you need to know about our products, authenticity, and delivery.",
    "sec_calc": "Daily Protein Intake Calculator",
    "sec_calc_sub": "Calculate your optimal macronutrient requirement based on body mass and training intensity.",
    "sec_newsletter": "Join the Elite Fitness Community",
    "sec_newsletter_sub": "Subscribe for exclusive release drops, training guides, and members-only voucher codes.",

    // Cart & Checkout
    "cart_title": "Shopping Cart",
    "cart_empty": "Your cart is currently empty.",
    "cart_subtotal": "Subtotal",
    "cart_shipping": "Shipping",
    "cart_discount": "Discount",
    "cart_total": "Total Amount",
    "cart_free_shipping_alert": "Add more for FREE shipping!",
    "cart_free_shipping_met": "You unlocked FREE Shipping!",
    "btn_checkout": "Proceed to Checkout",
    "btn_apply_coupon": "Apply",
    "coupon_placeholder": "Coupon code (e.g. FIRST10)",

    // Extended Features
    "flash_sale": "Flash Sale",
    "flash_sale_ends_in": "Ends In",
    "shop_flash_sale": "Shop Flash Sale",
    "verify_product": "Verify Product",
    "verify_product_title": "Product Authenticity Verification",
    "verify_barcode_label": "Enter Product Barcode or SKU",
    "verify_btn": "Verify Authenticity",
    "scan_camera": "Scan Barcode with Camera",
    "cancel_order": "Cancel Order",
    "request_return": "Request Return",
    "order_cancelled": "Order Cancelled",
    "return_requested": "Return Requested",
    "recently_viewed": "Recently Viewed",
    "recently_viewed_sub": "Supplements and products you recently explored",
    "clear_history": "Clear History",
    "delivery_estimator": "Estimated Delivery Date",
    "check_delivery": "Check Delivery Availability",
    "chat_whatsapp": "Chat on WhatsApp",
    "inquire_whatsapp": "Inquire via WhatsApp",

    // Footer
    "footer_tagline": "India's premier sports nutrition brand engineered for pure athletic performance.",
    "footer_col_shop": "Shop Supplements",
    "footer_col_support": "Customer Support",
    "footer_col_company": "Company & Legal",
    "footer_copy": "© 2026 PROTEINX Sports Nutrition Ltd. All rights reserved."
  },

  hi: {
    // Top Bar & Header
    "announcement": "🚀 ₹999 से अधिक के ऑर्डर पर मुफ़्त डिलीवरी | कोड FIRST10 से 10% की छूट पाएं",
    "nav_home": "होम",
    "nav_shop": "दुकान (Shop)",
    "nav_categories": "श्रेणियाँ",
    "nav_build_stack": "स्टैक बनाएं",
    "nav_deals": "ऑफ़र्स",
    "nav_about": "हमारे बारे में",
    "nav_contact": "संपर्क करें",
    "nav_account": "मेरा खाता",
    "nav_sign_in": "लॉग इन",
    "search_placeholder": "सप्लीमेंट्स, ब्रांड्स, व्हे प्रोटीन खोजें...",

    // Universal Nav
    "btn_back": "पीछे जाएं",
    "btn_home": "होम",
    "back_to_home": "होम पर वापस जाएं",

    // Common Actions & Badges
    "add_to_cart": "कार्ट में जोड़ें",
    "added_to_cart": "कार्ट में जोड़ा गया",
    "quick_view": "त्वरित दृश्य",
    "bestseller": "बेस्ट सेलर",
    "new": "नया",
    "in_stock": "उपलब्ध है",
    "low_stock": "केवल कुछ बचे हैं!",
    "out_of_stock": "स्टॉक समाप्त (Out of Stock)",
    "notify_me": "उपलब्ध होने पर बताएं",
    "notify_modal_title": "उपलब्ध होने पर सूचना पाएं",
    "notify_modal_sub": "अपना ईमेल दर्ज करें और जैसे ही यह उत्पाद वापस स्टॉक में आएगा हम आपको सूचित करेंगे।",
    "notify_email_placeholder": "apna.email@example.com",
    "notify_btn_submit": "मुझे सूचित करें",

    // Sections
    "sec_shop_category": "श्रेणी अनुसार खरीदारी करें",
    "sec_shop_category_sub": "हर खेल और फिटनेस लक्ष्य के लिए शुद्ध, प्रयोगशाला द्वारा परीक्षित सप्लीमेंट्स।",
    "sec_bestsellers": "सबसे अधिक बिकने वाले उत्पाद",
    "sec_bestsellers_sub": "पूरे भारत में 50,000+ एथलीटों द्वारा विश्वसनीय हमारे सर्वश्रेष्ठ फॉर्मूलेशन।",
    "sec_best_products": "सर्वोत्तम रेटेड उत्पाद",
    "sec_best_products_sub": "शुद्धता, ग्राहक समीक्षा और प्रभावशीलता के आधार पर वैज्ञानिक रूप से चुने गए।",
    "sec_recommended": "आपके लिए अनुशंसित",
    "sec_recommended_sub": "आपके फिटनेस लक्ष्यों के अनुरूप विशेष रूप से चुने गए सप्लीमेंट्स।",
    "sec_why_choose": "PROTEINX क्यों चुनें?",
    "sec_why_choose_sub": "पारदर्शिता, फॉर्मूलेशन शुद्धता और सुलभ पाचन में अटूट मानक।",
    "sec_build_stack": "अपना स्टैक बनाएं और 15% बचाएं",
    "sec_build_stack_sub": "प्रोटीन, क्रिएटिन और प्री-वर्कआउट को संयोजित करें और 15% की अतिरिक्त छूट पाएं।",
    "sec_faq": "अक्सर पूछे जाने वाले प्रश्न",
    "sec_faq_sub": "हमारे उत्पादों, प्रमाणिकता और डिलीवरी के बारे में सभी जानकारी।",
    "sec_calc": "दैनिक प्रोटीन आवश्यकता कैलकुलेटर",
    "sec_calc_sub": "अपने शरीर के वजन और प्रशिक्षण के अनुसार अपने दैनिक प्रोटीन की गणना करें।",
    "sec_newsletter": "फिटनेस कम्युनिटी से जुड़ें",
    "sec_newsletter_sub": "विशेष ऑफ़र्स, प्रशिक्षण गाइड और कूपन कोड के लिए सदस्यता लें।",

    // Cart & Checkout
    "cart_title": "शॉपिंग कार्ट",
    "cart_empty": "आपकी कार्ट खाली है।",
    "cart_subtotal": "उप-योग (Subtotal)",
    "cart_shipping": "डिलीवरी शुल्क",
    "cart_discount": "छूट (Discount)",
    "cart_total": "कुल राशि",
    "cart_free_shipping_alert": "मुफ़्त डिलीवरी के लिए और उत्पाद जोड़ें!",
    "cart_free_shipping_met": "आपको मुफ़्त डिलीवरी मिली!",
    "btn_checkout": "चेकआउट करें",
    "btn_apply_coupon": "लागू करें",
    "coupon_placeholder": "कूपन कोड (जैसे FIRST10)",

    // Extended Features
    "flash_sale": "फ्लैश सेल",
    "flash_sale_ends_in": "समाप्त होने में",
    "shop_flash_sale": "सेल खरीदें",
    "verify_product": "उत्पाद सत्यापित करें",
    "verify_product_title": "उत्पाद प्रमाणिकता जांच",
    "verify_barcode_label": "बारकोड या SKU दर्ज करें",
    "verify_btn": "प्रमाणिकता जांचें",
    "scan_camera": "कैमरे से बारकोड स्कैन करें",
    "cancel_order": "ऑर्डर रद्द करें",
    "request_return": "रिटर्न का अनुरोध करें",
    "order_cancelled": "ऑर्डर रद्द कर दिया गया",
    "return_requested": "रिटर्न अनुरोध भेजा गया",
    "recently_viewed": "हाल ही में देखे गए",
    "recently_viewed_sub": "आपके द्वारा हाल ही में देखे गए सप्लीमेंट्स",
    "clear_history": "इतिहास साफ़ करें",
    "delivery_estimator": "अनुमानित डिलीवरी तिथि",
    "check_delivery": "डिलीवरी उपलब्धता जांचें",
    "chat_whatsapp": "व्हाट्सएप पर चैट करें",
    "inquire_whatsapp": "व्हाट्सएप पर पूछें",

    // Footer
    "footer_tagline": "शुद्ध एथलेटिक प्रदर्शन के लिए तैयार भारत का प्रमुख स्पोर्ट्स न्यूट्रिशन ब्रांड।",
    "footer_col_shop": "सप्लीमेंट्स",
    "footer_col_support": "ग्राहक सहायता",
    "footer_col_company": "कंपनी और नियम",
    "footer_copy": "© 2026 PROTEINX Sports Nutrition Ltd. सर्वाधिकार सुरक्षित।"
  },

  mr: {
    // Top Bar & Header
    "announcement": "🚀 ₹999 वरील ऑर्डर्सवर मोफत डिलिव्हरी | FIRST10 कोड वापरून मिळवा 10% सूट",
    "nav_home": "मुख्यपृष्ठ",
    "nav_shop": "खरेदी करा (Shop)",
    "nav_categories": "कॅटेगरीज",
    "nav_build_stack": "स्टॅक बनवा",
    "nav_deals": "ऑफर्स",
    "nav_about": "आमच्याबद्दल",
    "nav_contact": "संपर्क",
    "nav_account": "माझे खाते",
    "nav_sign_in": "लॉग इन",
    "search_placeholder": "सप्लीमेंट्स, व्हे प्रोटीन, ब्रँड्स शोधा...",

    // Universal Nav
    "btn_back": "मागे जा",
    "btn_home": "मुख्यपृष्ठ",
    "back_to_home": "मुख्यपृष्ठावर परत जा",

    // Common Actions & Badges
    "add_to_cart": "कार्टमध्ये जोडा",
    "added_to_cart": "कार्टमध्ये जोडले",
    "quick_view": "झटपट पहा",
    "bestseller": "बेस्ट सेलर",
    "new": "नवीन",
    "in_stock": "उपलब्ध आहे",
    "low_stock": "फक्त काहीच शिल्लक!",
    "out_of_stock": "स्टॉक संपला (Out of Stock)",
    "notify_me": "उपलब्ध झाल्यावर कळवा",
    "notify_modal_title": "उत्पादन उपलब्ध झाल्यावर सूचना मिळवा",
    "notify_modal_sub": "तुमचा ईमेल पत्ता नोंदवा, उत्पादन पुन्हा उपलब्ध होताच आम्ही तुम्हाला कळवू.",
    "notify_email_placeholder": "tumcha.email@example.com",
    "notify_btn_submit": "मला कळवा",

    // Sections
    "sec_shop_category": "कॅटेगरीनुसार खरेदी करा",
    "sec_shop_category_sub": "प्रत्येक क्रीडा प्रकारासाठी प्रयोगशाळेत तपासलेली शुद्ध पोषण उत्पादने.",
    "sec_bestsellers": "सर्वाधिक विकले जाणारे उत्पादने",
    "sec_bestsellers_sub": "भारतातील ५०,०००+ खेळाडूंनी विश्वास ठेवलेली आमची सर्वोत्तम उत्पादने.",
    "sec_best_products": "सर्वोत्तम रेटेड उत्पादने",
    "sec_best_products_sub": "शुद्धता आणि ग्राहकांच्या पुनरावलोकनांनुसार निवडलेले उत्कृष्ट सप्लीमेंट्स.",
    "sec_recommended": "तुमच्यासाठी शिफारस केलेले",
    "sec_recommended_sub": "तुमच्या फिटनेस ध्येयानुसार निवडलेले अचूक सप्लीमेंट्स.",
    "sec_why_choose": "PROTEINX का निवडावे?",
    "sec_why_choose_sub": "पारदर्शकता, शुद्धता आणि सुलभ पचनाचे सर्वोच्च प्रमाण.",
    "sec_build_stack": "स्वतःचा स्टॅक बनवा आणि १५% वाचवा",
    "sec_build_stack_sub": "प्रोटीन, क्रिएटिन आणि प्री-वर्कआउट एकत्र निवडा आणि १५% विशेष सूट मिळवा.",
    "sec_faq": "नेहमी विचारले जाणारे प्रश्न",
    "sec_faq_sub": "आमची उत्पादने, खात्रीशीर गुणवत्ता आणि डिलिव्हरीबद्दल सविस्तर माहिती.",
    "sec_calc": "दैनिक प्रोटीन आवश्यकता कॅल्क्युलेटर",
    "sec_calc_sub": "तुमच्या वजनानुसार आणि व्यायामानुसार रोजच्या प्रोटीनचे प्रमाण ठरवा.",
    "sec_newsletter": "फिटनेस समुदायात सामील व्हा",
    "sec_newsletter_sub": "विशेष ऑफर्स, मार्गदर्शक माहिती आणि कूपन कोडसाठी सबस्क्राईब करा.",

    // Cart & Checkout
    "cart_title": "खरेदी कार्ट",
    "cart_empty": "तुमची कार्ट सध्या रिकामी आहे.",
    "cart_subtotal": "एकूण रक्कम (Subtotal)",
    "cart_shipping": "डिलिव्हरी शुल्क",
    "cart_discount": "मिळालेली सूट (Discount)",
    "cart_total": "अंतिम रक्कम",
    "cart_free_shipping_alert": "मोफत डिलिव्हरीसाठी आणखी उत्पादने जोडा!",
    "cart_free_shipping_met": "तुम्हाला मोफत डिलिव्हरी मिळाली आहे!",
    "btn_checkout": "चेकआउट करा",
    "btn_apply_coupon": "सूट लावा",
    "coupon_placeholder": "कूपन कोड (उदा. FIRST10)",

    // Extended Features
    "flash_sale": "फ्लॅश सेल",
    "flash_sale_ends_in": "समाप्त होण्याची वेळ",
    "shop_flash_sale": "सेल खरेदी करा",
    "verify_product": "उत्पादन पडताळणी",
    "verify_product_title": "उत्पादन अस्सलता पडताळणी",
    "verify_barcode_label": "बारकोड किंवा SKU टाका",
    "verify_btn": "अस्सलता तपासा",
    "scan_camera": "कॅमेऱ्याने बारकोड स्कॅन करा",
    "cancel_order": "ऑर्डर रद्द करा",
    "request_return": "रिटर्नची विनंती करा",
    "order_cancelled": "ऑर्डर रद्द केली गेली",
    "return_requested": "रिटर्न विनंती नोंदवली",
    "recently_viewed": "नुकतेच पाहिलेले",
    "recently_viewed_sub": "तुम्ही नुकतेच पाहिलेले सप्लीमेंट्स",
    "clear_history": "इतिहास हटवा",
    "delivery_estimator": "अपेक्षित डिलिव्हरी तारीख",
    "check_delivery": "डिलिव्हरी उपलब्धता तपासा",
    "chat_whatsapp": "व्हॉट्सॲपवर चॅट करा",
    "inquire_whatsapp": "व्हॉट्सॲपवर माहिती विचारा",

    // Footer
    "footer_tagline": "खेळाडूंसाठी खास तयार केलेला भारतातील अग्रगण्य स्पोर्ट्स न्यूट्रिशन ब्रँड.",
    "footer_col_shop": "सप्लीमेंट्स",
    "footer_col_support": "ग्राहक सेवा",
    "footer_col_company": "कंपनी माहिती",
    "footer_copy": "© 2026 PROTEINX Sports Nutrition Ltd. सर्व हक्क राखीव."
  }
};

// Current Active Language
function getCurrentLanguage() {
  return localStorage.getItem('proteinx_lang') || 'en';
}

// Translate a key
function t(key, defaultVal = '') {
  const lang = getCurrentLanguage();
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }
  return defaultVal || key;
}

// Apply translations across all elements with data-i18n
function applyTranslations(lang) {
  const selectedLang = lang || getCurrentLanguage();
  localStorage.setItem('proteinx_lang', selectedLang);

  // Update HTML lang attribute
  document.documentElement.lang = selectedLang;

  // Text content translation
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });

  // Placeholder translation
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation && translation !== key) {
      el.setAttribute('placeholder', translation);
    }
  });

  // Update language select dropdown value if present
  const langSelectors = document.querySelectorAll('.lang-select');
  langSelectors.forEach(select => {
    select.value = selectedLang;
  });

  // Notify AI chat if present
  if (typeof setAIChatLanguage === 'function') {
    setAIChatLanguage(selectedLang);
  }
}

// Switch Language handler
function changeLanguage(newLang) {
  applyTranslations(newLang);
}

// Auto init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
});
