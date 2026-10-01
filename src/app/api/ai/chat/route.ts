import { NextResponse } from "next/server"
import { getAllCatalogProducts, getProductBySlug } from "@/data/products-catalog"

export async function POST(req: Request) {
  try {
    const { message = "", language = "en" } = await req.json()
    const q = message.toLowerCase().trim()
    const catalog = getAllCatalogProducts()

    let reply = ""
    let matchedSlugs: string[] = []
    let suggestions: string[] = []

    // 1. Creatine queries
    if (q.includes("creatine") || q.includes("क्रिएटिन") || q.includes("கிரியேட்டின்") || q.includes("strength") || q.includes("power")) {
      reply = language === "ta"
        ? "கிரியேட்டின் மோனோஹைட்ரேட் வெடிக்கும் வலிமை, சக்தி மற்றும் தசை மீட்புக்கான சிறந்த சப்ளிமெண்ட் ஆகும். எங்கள் **CreaCore Creatine Monohydrate** 100% மைக்ரோனைஸ் செய்யப்பட்டு உடனடி உறிஞ்சுதலுக்கு உகந்தது."
        : language === "hi"
        ? "क्रिएटिन मोनोहाइड्रेट ताकत और मांसपेशियों की रिकवरी के लिए सबसे बेहतरीन सप्लीमेंट है। हमारा **CreaCore Creatine Monohydrate** 100% माइक्रोनाइज़्ड है जो 32 से 80 सर्विंग्स में उपलब्ध है।"
        : language === "mr"
        ? "क्रेआकोर क्रिएटिन मोनोहायड्रेट स्नायूंची ताकद आणि एटीपी वाढवण्यासाठी सर्वोत्तम आहे. हे १००% शुद्ध मायक्रोनाइज्ड आहे."
        : "Creatine Monohydrate is the gold standard for explosive strength, power output, and muscle cell hydration. Our **CreaCore Creatine Monohydrate** is 100% micronized for instant absorption without bloating."
      matchedSlugs = ["creatine-monohydrate"]
      suggestions = language === "ta"
        ? ["கிரியேட்டின் உட்கொள்ளும் முறை?", "சிறந்த புரோட்டீன் எது?", "₹2000-க்குள் சப்ளிமெண்ட்ஸ்"]
        : ["How to take Creatine?", "Best Whey to pair with Creatine", "Supplements under ₹2000"]
    }
    // 2. Whey / Muscle Building
    else if (q.includes("whey") || q.includes("protein") || q.includes("புரோட்டீன்") || q.includes("प्रोटीन") || q.includes("muscle") || q.includes("தசை")) {
      reply = language === "ta"
        ? "தசை வளர்ச்சி மற்றும் உடற்பயிற்சிக்கு பிறகான விரைவான மீட்புக்கு, **Nitrotein Performance Whey Protein** (24g பயோ-அவைலபிள் புரோட்டீன்) அல்லது கொழுப்பை எரிக்கும் **ShredTein** பரிந்துரைக்கிறோம்."
        : language === "hi"
        ? "मांसपेशियों के निर्माण के लिए हमारा **Nitrotein Performance Whey Protein** सबसे लोकप्रिय विकल्प है, जिसमें 24g शुद्ध प्रोटीन और पाचक एंजाइम हैं।"
        : language === "mr"
        ? "स्नायू वाढवण्यासाठी आमचे **Nitrotein Performance Whey Protein** सर्वोत्तम आहे, ज्यामध्ये पाचक एन्झाईम्स आणि उच्च प्रतीचे प्रोटीन आहे."
        : "For muscle growth and rapid post-workout recovery, we recommend **Nitrotein Performance Whey Protein** (24g bioavailable protein per serving) or **ShredTein** if your goal is cutting lean muscle."
      matchedSlugs = ["nitro-tein-whey-isolate", "shred-tein-whey"]
      suggestions = language === "ta"
        ? ["Nitrotein விலை என்ன?", "கிரியேட்டின் பற்றி சொல்லுங்கள்", "மாஸ் கெயினர் பார்க்கவும்"]
        : ["What is the price of Nitrotein?", "Tell me about Creatine", "View Mass Gainer"]
    }
    // 3. Weight Loss / Fat Loss / L-Carnitine
    else if (q.includes("fat") || q.includes("loss") || q.includes("carnitine") || q.includes("கொழுப்பு") || q.includes("वजन") || q.includes("कटिंग") || q.includes("shred")) {
      reply = language === "ta"
        ? "கொழுப்பு குறைப்பு மற்றும் தீவிர உடற்பயிற்சிக்கு **Pure L-Carnitine 3300mg** மற்றும் **ShredTein Advanced Lean Protein** மிகவும் பயனுள்ள காம்போ ஆகும்."
        : language === "hi"
        ? "फैट लॉस और एनर्जेटिक वर्कआउट के लिए **Pure L-Carnitine 3300mg** और **ShredTein Advanced Lean Protein** सबसे असरदार कॉम्बो हैं।"
        : language === "mr"
        ? "चरबी कमी करण्यासाठी आणि ऊर्जा वाढवण्यासाठी **Pure L-Carnitine 3300mg** सर्वोत्तम परिणाम देते."
        : "For fat loss and metabolic conditioning, **Pure L-Carnitine 3300mg** converts stored fatty acids into clean energy, while **ShredTein** helps maintain lean muscle during a caloric deficit."
      matchedSlugs = ["l-carnitine-3000-liquid", "shred-tein-whey"]
      suggestions = language === "ta"
        ? ["L-Carnitine பயன்பாடு?", "ஆற்றலுக்கான Pre-workout", "WhatsApp ஆதரவு"]
        : ["How to use L-Carnitine?", "Pre-workout for energy", "Chat on WhatsApp"]
    }
    // 4. Bulking / Mass Gainer
    else if (q.includes("mass") || q.includes("gain") || q.includes("bulk") || q.includes("எடை") || q.includes("वजन बढ़ाएं") || q.includes("पतला")) {
      reply = language === "ta"
        ? "எடை மற்றும் தசை அளவை அதிகரிக்க விரும்பினால், **MassTein Anabolic Mass Gainer** உயர்தர காம்ப்ளக்ஸ் கார்ப்ஸ் மற்றும் புரோட்டீன் சமநிலையை வழங்குகிறது."
        : language === "hi"
        ? "अगर आप वजन और साइज बढ़ाना चाहते हैं, तो **MassTein Anabolic Mass Gainer** में उच्च गुणवत्ता वाले कॉम्प्लेक्स कार्ब्स और प्रोटीन का सही संतुलन है।"
        : language === "mr"
        ? "वजन आणि स्नायूंचे प्रमाण वाढवण्यासाठी **MassTein Anabolic Mass Gainer** अत्यंत फायदेशीर आहे."
        : "To pack on size and break through weight plateaus, **MassTein Anabolic Mass Gainer** provides calorie-dense complex carbs and premium protein for sustained mass gains."
      matchedSlugs = ["mass-tein-gainer", "creatine-monohydrate"]
      suggestions = language === "ta"
        ? ["Mass Gainer அளவு", "Whey vs Mass Gainer", "₹3000-க்குள்"]
        : ["Mass Gainer serving size", "Whey vs Mass Gainer", "Under ₹3000"]
    }
    // 5. Pre-Workout / Energy
    else if (q.includes("pre") || q.includes("energy") || q.includes("pump") || q.includes("ஆற்றல்") || q.includes("ऊर्जा") || q.includes("थकान")) {
      reply = language === "ta"
        ? "தீவிர உடற்பயிற்சி மற்றும் அதிக பம்பிற்கு **Titan Loaded Pre-Workout** 300mg காஃபின் மற்றும் பீட்டா-அலனைனுடன் சர்க்கரை இல்லாமல் வடிவமைக்கப்பட்டுள்ளது."
        : language === "hi"
        ? "हाई-इंटेन्सिटी वर्कआउट और विस्फोटक पंप के लिए **Titan Loaded Pre-Workout** 300mg कैफीन और बीटा-एलानिन के साथ तैयार किया गया है।"
        : language === "mr"
        ? "व्यायामादरम्यान ऊर्जा आणि फोकस टिकवण्यासाठी **Titan Loaded Pre-Workout** वापरा."
        : "**Titan Loaded Pre-Workout** delivers skin-splitting muscle pumps, laser focus, and maximum endurance with zero sugar crash."
      matchedSlugs = ["ignition-pre-workout"]
      suggestions = language === "ta"
        ? ["Pre-workout நேரம்?", "கிரியேட்டின் பயன்கள்", "Nitrotein Whey"]
        : ["Pre-workout timing", "Creatine Monohydrate", "Nitrotein Whey"]
    }
    // 6. Budget queries (under 1000 / 2000)
    else if (q.includes("budget") || q.includes("cheap") || q.includes("under") || q.includes("2000") || q.includes("1000") || q.includes("பட்ஜெட்") || q.includes("சலுகை")) {
      reply = language === "ta"
        ? "₹2000-க்குள் சிறந்த சப்ளிமெண்ட்ஸ்: **CreaCore Creatine** (₹549 முதல்), **Pure L-Carnitine** (₹1,499), மற்றும் **Titan Pre-Workout** (₹1,999)!"
        : language === "hi"
        ? "₹2000 के अंदर हमारे सबसे बेहतरीन सप्लीमेंट्स: **CreaCore Creatine** (सिर्फ ₹549 से शुरू), **Pure L-Carnitine** (₹1,499), और **Titan Pre-Workout** (₹1,999)!"
        : language === "mr"
        ? "₹२००० च्या आत उपलब्ध सर्वोत्तम उत्पादने: **CreaCore Creatine** (₹५४९), **Pure L-Carnitine** (₹१,४९९) आणि **Titan Pre-Workout** (₹१,९९९)."
        : "Here are top-rated supplements under ₹2,000: **CreaCore Creatine** (starts at just ₹549), **Pure L-Carnitine 3300mg** (₹1,499), and **Titan Pre-Workout** (₹1,999)."
      matchedSlugs = ["creatine-monohydrate", "l-carnitine-3000-liquid", "ignition-pre-workout"]
      suggestions = language === "ta"
        ? ["Creatine 250g காண்க", "Pre-workout பார்க்கவும்", "WhatsApp-ல் பேசவும்"]
        : ["Show Creatine 250g", "Show Pre-workout", "Chat on WhatsApp"]
    }
    // 7. General inquiry / Fallback
    else {
      reply = language === "ta"
        ? "Nutratein-க்கு வரவேற்கிறோம்! உயர்தர புரோட்டீன், கிரியேட்டின், மாஸ் கெயினர் மற்றும் ப்ரீ-வர்க்அவுட் எங்களிடம் உள்ளன. உங்கள் உடற்பயிற்சி இலக்கைக் கூறுங்கள் (தசை வளர்ச்சி, எடை அதிகரிப்பு, அல்லது கொழுப்பு குறைப்பு), சரியான சப்ளிமெண்ட்டை பரிந்துரைக்கிறேன்."
        : language === "hi"
        ? "Nutratein में आपका स्वागत है! हमारे पास एथलीट-ग्रेड व्हे प्रोटीन, क्रिएटिन, मास गेनर और प्री-वर्कआउट उपलब्ध हैं। आप अपने लक्ष्य (मसल गेन, फैट लॉस, वजन बढ़ाना) के अनुसार पूछ सकते हैं।"
        : language === "mr"
        ? "Nutratein मध्ये आपले स्वागत आहे! आपल्या फिटनेस ध्येयानुसार (वजन वाढवणे, स्नायू तयार करणे) योग्य सल्ला घेण्यासाठी विचारा."
        : "Welcome to Nutratein! Our flagship supplements are formulated for serious athletes. Tell me your primary fitness goal (e.g. lean muscle, weight gain, explosive strength, or fat loss) and I will guide you to the perfect stack."
      matchedSlugs = ["nitro-tein-whey-isolate", "creatine-monohydrate"]
      suggestions = language === "ta"
        ? ["தசை வளர்ச்சிக்கான புரோட்டீன்", "₹2000-க்குள் சப்ளிமெண்ட்ஸ்", "கிரியேட்டின் என்றால் என்ன?", "WhatsApp ஆதரவு"]
        : ["Best protein for muscle", "Supplements under ₹2000", "What is Creatine?", "Connect on WhatsApp"]
    }

    const products = matchedSlugs
      .map((slug) => getProductBySlug(slug))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        slug: p!.slug,
        name: p!.name,
        price: p!.price,
        mrp: p!.mrp,
        discountPercent: p!.discount || 0,
        rating: p!.rating,
        reviewCount: p!.reviewCount,
        image: p!.image,
        category: p!.category,
        brand: p!.brand,
      }))

    return NextResponse.json({
      success: true,
      reply,
      products,
      suggestions,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process chat" },
      { status: 500 }
    )
  }
}
