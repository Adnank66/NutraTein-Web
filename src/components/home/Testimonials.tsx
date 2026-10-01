import { Star, Quote } from "lucide-react"

const reviews = [
  {
    name: "Vikram Malhotra",
    role: "National Powerlifter",
    rating: 5,
    product: "100% Gold Whey Isolate",
    text: "PROTEINX Gold Whey Isolate is without question the cleanest protein in the Indian market. Instant mixing with zero froth or gut discomfort. Hit my personal deadlift PR of 240kg on this nutrition!",
  },
  {
    name: "Ananya Iyer",
    role: "Marathon Runner & Fitness Coach",
    rating: 5,
    product: "HydroFuel BCAA + EAA",
    text: "Intra-workout hydration with the Himalayan electrolytes makes an immense difference in long distance training. No cramping and my next-day DOMS is virtually gone.",
  },
  {
    name: "Rohit Deshmukh",
    role: "CrossFit Athlete",
    rating: 5,
    product: "HyperDrive Pre-Workout",
    text: "Insane pump and laser focus without any heart palpitations or caffeine crash. Taste is crisp and natural. Highly recommend to anyone doing intense conditioning.",
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 bg-dark-50">
      <div className="container-custom">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Community Feedback</span>
          <h2 className="section-title mt-1">Real Reviews from Real Athletes</h2>
          <p className="section-subtitle">Verified customer stories and training experiences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="card p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={15} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <Quote size={20} className="text-brand-300" />
                </div>
                <p className="text-sm text-dark-700 leading-relaxed italic mb-6">"{r.text}"</p>
              </div>

              <div className="pt-4 border-t border-dark-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-dark-900 text-sm">{r.name}</p>
                  <p className="text-xs text-dark-400">{r.role}</p>
                </div>
                <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {r.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
