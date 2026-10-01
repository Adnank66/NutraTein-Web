const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const Product = require('../models/Product');

// Helper to detect language
function detectLanguage(text, requestedLang) {
  if (requestedLang && ['en', 'hi', 'mr'].includes(requestedLang)) return requestedLang;
  if (!text) return 'en';

  // Devanagari script detection
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) {
    // Basic Marathi distinguishing markers
    if (/आहे|नाही|कसे|माझे|सांगा|दाखवा|कोणते|पाहिजे|घ्यायचे/.test(text)) return 'mr';
    return 'hi';
  }
  return 'en';
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message = '', language: reqLang, history = [] } = req.body;
    const lang = detectLanguage(message, reqLang);
    const q = message.toLowerCase().trim();

    // Fetch live products
    let products = [];
    if (!global.USE_MONGODB) {
      products = [...mockDb.products];
    } else {
      products = await Product.find({ isActive: true }).populate('category', 'name slug');
    }

    let matchedProducts = [];
    let replyText = '';
    let suggestions = [];

    // --- Intent Matching ---
    const isBudget = q.includes('affordable') || q.includes('cheap') || q.includes('सस्ता') || q.includes('कमी') || q.includes('budget') || q.includes('under') || q.includes('अंदर') || q.includes('खाली');
    const isCreatine = q.includes('creatine') || q.includes('क्रिएटिन');
    const isPreWorkout = q.includes('pre-workout') || q.includes('energy') || q.includes('ऊर्जा');
    const isPlant = q.includes('plant') || q.includes('vegan') || q.includes('शाकाहारी') || q.includes('वनस्पती');
    const isMass = q.includes('mass') || q.includes('gainer') || q.includes('वजन') || q.includes('bulk');
    const isBest = q.includes('best') || q.includes('top') || q.includes('अच्छा') || q.includes('उत्तम') || q.includes('रेटेड') || q.includes('rated');
    const isStack = q.includes('stack') || q.includes('combo') || q.includes('बंडल') || q.includes('स्टॅक');
    const isFlavors = q.includes('flavor') || q.includes('flavours') || q.includes('फ्लेवर') || q.includes('स्वाद');

    // Parse max price if specified (e.g. "under 2000", "3000 के अंदर")
    const priceMatch = q.match(/(\d{3,5})/);
    const maxBudget = priceMatch ? parseInt(priceMatch[1], 10) : null;

    if (isCreatine) {
      matchedProducts = products.filter(p => p.category?.slug === 'creatine' || p.slug.includes('creatine'));
      if (lang === 'hi') {
        replyText = 'क्रिएटिन शक्ति और मांसपेशियों की ताकत बढ़ाने के लिए सबसे प्रभावी और प्रमाणित सप्लीमेंट है। हमारे पास उपलब्ध यह विकल्प देखें:';
        suggestions = ['क्रिएटिन कैसे लें?', 'व्हे प्रोटीन भी दिखाएं', 'सप्लीमेंट स्टैक बनाएं'];
      } else if (lang === 'mr') {
        replyText = 'ताकद आणि स्नायूंच्या विकासासाठी क्रिएटिन अत्यंत परिणामकारक सप्लीमेंट आहे. आमचे सर्वोत्तम पर्याय खालीलप्रमाणे आहेत:';
        suggestions = ['क्रिएटिन कसे घ्यावे?', 'व्हे प्रोटीन दाखवा', 'बजेट सप्लीमेंट्स'];
      } else {
        replyText = 'Creatine Monohydrate is clinically proven to enhance explosive power, ATP resynthesis, and lean muscle mass. Here are our top-rated creatine supplements:';
        suggestions = ['How to take creatine?', 'Show Whey Protein too', 'Build a custom stack'];
      }
    } else if (isPlant) {
      matchedProducts = products.filter(p => p.category?.slug === 'plant-protein');
      if (lang === 'hi') {
        replyText = 'यदि आप 100% शाकाहारी (Vegan) और डेयरी-मुक्त प्रोटीन खोज रहे हैं, तो हमारा क्लीन प्लांट प्रोटीन मिश्रण उत्तम है:';
        suggestions = ['व्हे और प्लांट में अंतर?', 'फ्लेवर कौन से हैं?', 'रेटिंग दिखाओ'];
      } else if (lang === 'mr') {
        replyText = 'जर तुम्ही १००% शाकाहारी (Vegan) आणि पचनास हलके प्रोटीन शोधत असाल, तर आमचे प्लांट प्रोटीन सर्वोत्तम आहे:';
        suggestions = ['व्हे आणि प्लांट फरक काय?', 'फ्लेवर्स कोणते आहेत?', 'सप्लीमेंट स्टॅक'];
      } else {
        replyText = 'Looking for clean, hypoallergenic, dairy-free nutrition? Our Clean Plant Protein Blend provides 25g of complete amino acids from pea and brown rice:';
        suggestions = ['Plant vs Whey protein', 'What flavors are available?', 'Show best sellers'];
      }
    } else if (isMass) {
      matchedProducts = products.filter(p => p.category?.slug === 'mass-gainers');
      if (lang === 'hi') {
        replyText = 'वजन और मांसपेशियां तेजी से बढ़ाने के लिए हमारे हाई-कैलोरी मास गेनर सबसे प्रभावी हैं:';
        suggestions = ['मास गेनर के फायदे', 'व्हे प्रोटीन दिखाओ', 'सस्ता विकल्प'];
      } else if (lang === 'mr') {
        replyText = 'वजन आणि स्नायू वाढवण्यासाठी आमचे हाय-कॅलरी मास गेनर सर्वोत्तम पर्याय आहेत:';
        suggestions = ['मास गेनरचे फायदे', 'व्हे प्रोटीन दाखवा', 'बजेट मास गेनर'];
      } else {
        replyText = 'For serious muscular bulking and clean caloric surplus, our Mass Gainers provide 50g protein and complex carbs per serving:';
        suggestions = ['Best gainer for skinny guys', 'Show whey isolate', 'Build my stack'];
      }
    } else if (isBudget || maxBudget) {
      const budgetCap = maxBudget || 2500;
      matchedProducts = products
        .filter(p => p.basePrice <= budgetCap)
        .sort((a, b) => a.basePrice - b.basePrice);

      if (lang === 'hi') {
        replyText = `₹${budgetCap} के बजट में सबसे लोकप्रिय और मूल्यवान सप्लीमेंट्स यहाँ हैं:`;
        suggestions = ['व्हे प्रोटीन दिखाओ', 'क्रिएटिन दिखाओ', 'बेस्ट सेलर'];
      } else if (lang === 'mr') {
        replyText = `₹${budgetCap} च्या बजेटमध्ये सर्वोत्तम आणि लोकप्रिय सप्लीमेंट्स खालीलप्रमाणे आहेत:`;
        suggestions = ['व्हे प्रोटीन दाखवा', 'क्रिएटिन दाखवा', 'बेस्ट सेलर'];
      } else {
        replyText = `Here are the highest-rated supplements under ₹${budgetCap.toLocaleString('en-IN')}:`;
        suggestions = ['Show whey isolate', 'Show creatine', 'Show best sellers'];
      }
    } else if (isBest) {
      matchedProducts = [...products].sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount));
      if (lang === 'hi') {
        replyText = 'हमारे एथलीटों और ग्राहकों द्वारा सबसे अधिक पसंद किए गए बेस्ट-रेटेड उत्पाद ये हैं:';
        suggestions = ['व्हे आइसोलेट दिखाओ', 'बिल्ड योर स्टैक', 'क्रिएटिन दिखाओ'];
      } else if (lang === 'mr') {
        replyText = 'आमच्या ग्राहकांकडून सर्वाधिक पसंती मिळालेले टॉप रेटेड प्रॉडक्ट्स हे आहेत:';
        suggestions = ['व्हे आयसोलेट दाखवा', 'स्टॅक बनवा', 'क्रिएटिन दाखवा'];
      } else {
        replyText = 'Based on customer reviews and verified athlete ratings, here are our highest performing products:';
        suggestions = ['Show whey isolate', 'Build Your Stack', 'Show Pre-Workout'];
      }
    } else if (isStack) {
      matchedProducts = products.filter(p => p.isBestSeller || p.category?.slug === 'whey-protein' || p.category?.slug === 'creatine').slice(0, 3);
      if (lang === 'hi') {
        replyText = 'आप हमारे "Build Your Stack" टूल का उपयोग करके व्हे, क्रिएटिन और प्री-वर्कआउट जोड़ सकते हैं और 15% की अतिरिक्त छूट पा सकते हैं!';
        suggestions = ['बिल्ड स्टैक पेज खोलें', 'व्हे प्रोटीन दिखाओ', 'क्रिएटिन दिखाओ'];
      } else if (lang === 'mr') {
        replyText = 'तुम्ही आमच्या "Build Your Stack" टूलचा वापर करून व्हे, क्रिएटिन आणि प्री-वर्कआउट एकत्र निवडू शकता आणि १५% विशेष सूट मिळवू शकता!';
        suggestions = ['बिल्ड स्टॅक उघडा', 'व्हे प्रोटीन दाखवा', 'क्रिएटिन दाखवा'];
      } else {
        replyText = 'You can use our interactive "Build Your Stack" feature to bundle your favorite protein, creatine, and pre-workout for an automatic 15% bundle discount!';
        suggestions = ['Open Stack Builder', 'Show best sellers', 'Under ₹2000'];
      }
    } else {
      // General inquiry or protein recommendation
      matchedProducts = products.filter(p => p.category?.slug === 'whey-protein' || p.isBestSeller);
      if (lang === 'hi') {
        replyText = 'नमस्ते! मैं ProteinX का AI असिस्टेंट हूँ। अगर आप मांसपेशियों का निर्माण और रिकवरी चाहते हैं, तो 100% व्हे प्रोटीन आइसोलेट सबसे बेहतरीन शुरुआत है:';
        suggestions = ['सस्ता प्रोटीन दिखाओ', 'क्रिएटिन दिखाओ', 'शाकाहारी प्रोटीन', 'स्टैक बनाएं'];
      } else if (lang === 'mr') {
        replyText = 'नमस्कार! मी ProteinX चा AI सहाय्यक आहे. जर तुम्हाला स्नायू वाढवायचे असतील आणि वेगवान रिकव्हरी हवी असेल, तर १००% व्हे प्रोटीन आयसोलेट हा सर्वोत्तम पर्याय आहे:';
        suggestions = ['कमी बजेटमध्ये प्रोटीन', 'क्रिएटिन दाखवा', 'शाकाहारी प्रोटीन', 'स्टॅक बनवा'];
      } else {
        replyText = 'Hello! I am your ProteinX AI Assistant. For lean muscle growth and optimal recovery, our 100% Gold Whey Isolate with 27g protein and digestive enzymes is our top recommendation:';
        suggestions = ['Affordable protein options', 'Show Creatine', 'Vegan / Plant Protein', 'Build Your Stack'];
      }
    }

    // Format top 3 products with localized reasons
    const topProducts = (matchedProducts.slice(0, 3)).map(p => {
      let reason = 'High bioavailability and 3rd party verified purity.';
      if (lang === 'hi') {
        reason = p.category?.slug === 'creatine'
          ? '5 ग्राम शुद्ध माइक्रनाइज़्ड क्रिएटिन जो मांसपेशियों में शक्ति बढ़ाता है।'
          : '27 ग्राम शुद्ध व्हे प्रोटीन और DigeZyme® एन्जाइम पाचन के लिए।';
      } else if (lang === 'mr') {
        reason = p.category?.slug === 'creatine'
          ? '५ ग्रॅम शुद्ध क्रिएटिन जे ताकद आणि स्नायू वाढवते.'
          : '२७ ग्रॅम शुद्ध व्हे प्रोटीन आणि सुलभ पचनासाठी DigeZyme®.';
      }

      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice,
        mrp: p.mrp,
        rating: p.rating || 4.8,
        image: p.images && p.images[0] ? p.images[0].url : 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400',
        stock: p.variants && p.variants[0] ? p.variants[0].stock : (p.stock || 25),
        reason
      };
    });

    res.json({
      success: true,
      language: lang,
      reply: replyText,
      products: topProducts,
      suggestions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
