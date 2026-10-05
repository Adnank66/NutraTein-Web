const fs = require('fs');

const locales = ['en', 'hi', 'mr', 'ta'];
const newKeys = {
  hero: {
    shopNow: "Shop Now",
    shopNitroTein: "Shop NitroTein Whey",
    exploreShredTein: "Explore ShredTein",
    shopCreaCore: "Shop CreaCore",
    explorePreWorkouts: "Explore Pre-Workouts",
    shopCarnitine: "Shop L-Carnitine",
    paused: "❚❚ Paused",
    auto: "▶ Auto",
    masterGraphic: "4K Master Graphic",
    prevBanner: "Previous Banner",
    nextBanner: "Next Banner",
    view: "View Product"
  },
  home: {
    topProductsDesc: "Experience the raw power of our flagship formulas in full 4K. Switch videos to inspect each formula with its live interactive cart on the right.",
    selectVideo: "SELECT VIDEO:",
    playing: "PLAYING",
    ultraHd: "ULTRA HD",
    premier: "PREMIER",
    pauseVideo: "Pause video",
    playVideo: "Play video",
    pause: "Pause",
    play: "Play",
    unmuteAudio: "Unmute audio",
    muteAudio: "Mute audio",
    unmute: "Unmute",
    mute: "Mute",
    nextVideo: "Next Video",
    syncedToVideo: "SYNCED TO VIDEO",
    authentic: "100% Authentic",
    athletesChoice: "ATHLETES CHOICE • 4K SHOWCASE",
    eliteAthleteFormulas: "ELITE ATHLETE FORMULAS",
    featuredDesc: "Engineered for peak performance, ultra-fast muscle recovery, and lab-certified purity."
  },
  product: {
    addedToCart: "Added to Cart!"
  }
};

const translations = {
  en: newKeys,
  hi: {
    hero: {
      shopNow: "अभी खरीदें",
      shopNitroTein: "NitroTein Whey खरीदें",
      exploreShredTein: "ShredTein खोजें",
      shopCreaCore: "CreaCore खरीदें",
      explorePreWorkouts: "Pre-Workouts खोजें",
      shopCarnitine: "L-Carnitine खरीदें",
      paused: "❚❚ रुका हुआ",
      auto: "▶ स्वचलित",
      masterGraphic: "4K मास्टर ग्राफ़िक",
      prevBanner: "पिछला बैनर",
      nextBanner: "अगला बैनर",
      view: "उत्पाद देखें"
    },
    home: {
      topProductsDesc: "पूर्ण 4K में हमारे प्रमुख फ़ार्मुलों की कच्ची शक्ति का अनुभव करें। दाईं ओर अपने लाइव इंटरैक्टिव कार्ट के साथ प्रत्येक फ़ॉर्मूले का निरीक्षण करने के लिए वीडियो स्विच करें।",
      selectVideo: "वीडियो चुनें:",
      playing: "चल रहा है",
      ultraHd: "ULTRA HD",
      premier: "PREMIER",
      pauseVideo: "वीडियो रोकें",
      playVideo: "वीडियो चलाएं",
      pause: "रोकें",
      play: "चलाएं",
      unmuteAudio: "अनम्यूट करें",
      muteAudio: "म्यूट करें",
      unmute: "अनम्यूट",
      mute: "म्यूट",
      nextVideo: "अगला वीडियो",
      syncedToVideo: "वीडियो से सिंक किया गया",
      authentic: "100% प्रामाणिक",
      athletesChoice: "एथलीट्स की पसंद • 4K शोकेस",
      eliteAthleteFormulas: "एलीट एथलीट फ़ॉर्मूले",
      featuredDesc: "पीक परफॉरमेंस, अल्ट्रा-फास्ट मसल रिकवरी और लैब-सर्टिफाइड प्यूरिटी के लिए इंजीनियर किया गया।"
    },
    product: {
      addedToCart: "कार्ट में जोड़ा गया!"
    }
  },
  mr: {
    hero: {
      shopNow: "आता खरेदी करा",
      shopNitroTein: "NitroTein Whey खरेदी करा",
      exploreShredTein: "ShredTein एक्सप्लोर करा",
      shopCreaCore: "CreaCore खरेदी करा",
      explorePreWorkouts: "Pre-Workouts एक्सप्लोर करा",
      shopCarnitine: "L-Carnitine खरेदी करा",
      paused: "❚❚ थांबवले",
      auto: "▶ स्वयं",
      masterGraphic: "4K मास्टर ग्राफिक",
      prevBanner: "मागील बॅनर",
      nextBanner: "पुढील बॅनर",
      view: "उत्पादन पहा"
    },
    home: {
      topProductsDesc: "आमच्या प्रमुख सूत्रांची शक्ती पूर्ण 4K मध्ये अनुभवा. उजवीकडे त्याच्या थेट संवादात्मक कार्टसह प्रत्येक सूत्राची तपासणी करण्यासाठी व्हिडिओ स्विच करा.",
      selectVideo: "व्हिडिओ निवडा:",
      playing: "प्ले होत आहे",
      ultraHd: "ULTRA HD",
      premier: "PREMIER",
      pauseVideo: "व्हिडिओ थांबवा",
      playVideo: "व्हिडिओ प्ले करा",
      pause: "थांबवा",
      play: "प्ले करा",
      unmuteAudio: "आवाज चालू करा",
      muteAudio: "आवाज बंद करा",
      unmute: "आवाज चालू करा",
      mute: "आवाज बंद करा",
      nextVideo: "पुढील व्हिडिओ",
      syncedToVideo: "व्हिडिओशी सिंक केले",
      authentic: "100% अस्सल",
      athletesChoice: "खेळाडूंची निवड • 4K शोकेस",
      eliteAthleteFormulas: "एलिट ऍथलीट फॉर्म्युले",
      featuredDesc: "पीक परफॉर्मन्स, अल्ट्रा-फास्ट स्नायू रिकव्हरी आणि लॅब-प्रमाणित शुद्धतेसाठी इंजिनियर केलेले."
    },
    product: {
      addedToCart: "कार्टमध्ये जोडले!"
    }
  },
  ta: {
    hero: {
      shopNow: "இப்போது வாங்குங்கள்",
      shopNitroTein: "NitroTein Whey வாங்குங்கள்",
      exploreShredTein: "ShredTein ஆராயுங்கள்",
      shopCreaCore: "CreaCore வாங்குங்கள்",
      explorePreWorkouts: "Pre-Workouts ஆராயுங்கள்",
      shopCarnitine: "L-Carnitine வாங்குங்கள்",
      paused: "❚❚ இடைநிறுத்தப்பட்டது",
      auto: "▶ ஆட்டோ",
      masterGraphic: "4K மாஸ்டர் கிராஃபிக்",
      prevBanner: "முந்தைய பேனர்",
      nextBanner: "அடுத்த பேனர்",
      view: "தயாரிப்பைக் காண்க"
    },
    home: {
      topProductsDesc: "எங்கள் முதன்மை சூத்திரங்களின் மூல சக்தியை முழு 4K இல் அனுபவிக்கவும். வலதுபுறத்தில் அதன் நேரடி ஊடாடும் வண்டியுடன் ஒவ்வொரு சூத்திரத்தையும் ஆய்வு செய்ய வீடியோக்களை மாற்றவும்.",
      selectVideo: "வீடியோவைத் தேர்ந்தெடுக்கவும்:",
      playing: "விளையாடுகிறது",
      ultraHd: "ULTRA HD",
      premier: "PREMIER",
      pauseVideo: "வீடியோவை இடைநிறுத்து",
      playVideo: "வீடியோவை இயக்கு",
      pause: "இடைநிறுத்து",
      play: "இயக்கு",
      unmuteAudio: "ஆடியோவை இயக்கு",
      muteAudio: "ஆடியோவை முடக்கு",
      unmute: "இயக்கு",
      mute: "முடக்கு",
      nextVideo: "அடுத்த வீடியோ",
      syncedToVideo: "வீடியோவுடன் ஒத்திசைக்கப்பட்டது",
      authentic: "100% உண்மையானது",
      athletesChoice: "விளையாட்டு வீரர்களின் தேர்வு • 4K ஷோகேஸ்",
      eliteAthleteFormulas: "எலைட் தடகள சூத்திரங்கள்",
      featuredDesc: "உச்ச செயல்திறன், அதிவேக தசை மீட்பு மற்றும் ஆய்வக சான்றளிக்கப்பட்ட தூய்மைக்காக வடிவமைக்கப்பட்டுள்ளது."
    },
    product: {
      addedToCart: "வண்டியில் சேர்க்கப்பட்டது!"
    }
  }
};

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
console.log("Updated locales");
