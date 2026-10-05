const fs = require('fs');

const locales = ['en', 'hi', 'mr', 'ta'];
const translations = {
  en: {
    chat: {
      needHelp: "Need Help? Chat!",
      dismiss: "Dismiss",
      whatsappSupport: "WhatsApp Support",
      close: "Close",
      aiChat: "AI Chat",
      advisorName: "Nutratein AI Advisor",
      live: "LIVE",
      subtitle: "Supplement & Nutrition Intelligence",
      preferWhatsapp: "Prefer WhatsApp chat?",
      openWhatsapp: "Open WhatsApp",
      recommendedMatches: "Recommended Matches:",
      off: "OFF",
      details: "Details",
      loading: "Nutratein AI is formulating recommendations...",
      placeholderEn: "Ask about proteins, goals, dosage, budget...",
      placeholderHi: "प्रोटीन, क्रिएटिन या बजट के बारे में पूछें...",
      placeholderMr: "सप्लिमेंट्स किंवा आहाराबद्दल विचारा...",
      placeholderTa: "புரதம், இலக்குகள், அளவு பற்றி கேளுங்கள்..."
    }
  }
};

['hi', 'mr', 'ta'].forEach(loc => { translations[loc] = translations.en; });

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
