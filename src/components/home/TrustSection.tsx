import { ShieldCheck, Award, Truck, RefreshCw, Lock, Sparkles } from "lucide-react"

const reasons = [
  { icon: ShieldCheck, title: "100% Authentic & Tested", desc: "Batch tested for heavy metals and label accuracy by independent accredited laboratories." },
  { icon: Award, title: "GMP & FSSAI Compliant", desc: "Manufactured in certified world-class cleanroom facilities adhering to international standards." },
  { icon: Truck, title: "Lightning Fast Dispatch", desc: "All orders packed with tamper-proof seal and dispatched within 24 hours across India." },
  { icon: Lock, title: "256-Bit Safe Checkout", desc: "End-to-end encrypted transactions via UPI, Credit/Debit Cards, Net Banking, and COD." },
  { icon: RefreshCw, title: "7-Day Easy Replacement", desc: "Damaged or wrong shipment? Quick hassle-free return and exchange process." },
  { icon: Sparkles, title: "Zero Banned Substances", desc: "Complies with strict anti-doping regulations suitable for drug-tested competitive athletes." },
]

export default function TrustSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Quality Assurance</span>
          <h2 className="section-title mt-1">Why Athletes Trust PROTEINX</h2>
          <p className="section-subtitle">Transparency, pure ingredients, and zero proprietary blends.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card p-6 border border-dark-100 hover:border-brand-500/40 hover:shadow-md transition-all flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Icon size={24} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900 text-base mb-1.5">{title}</h3>
                <p className="text-xs text-dark-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
