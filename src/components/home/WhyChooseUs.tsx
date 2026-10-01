import { ShieldCheck, FileText, Lock, Truck, Headphones, RefreshCw } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"

const whyChooseCards = [
  {
    icon: ShieldCheck,
    title: "Quality Products",
    desc: "Carefully selected raw nutrition batches imported from premier ISO-certified facilities.",
  },
  {
    icon: FileText,
    title: "Transparent Information",
    desc: "Clear active dosages, zero hidden fillers, and complete nutrition panel disclosures on every tub.",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    desc: "Protected payments with 256-bit SSL encryption across UPI, Net Banking, and Credit/Debit cards.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Reliable priority dispatch across India with automated real-time SMS tracking updates.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    desc: "Dedicated support team available Monday through Saturday to answer stack & order inquiries.",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    desc: "Simple 7-day replacement guarantee on any damaged or incorrectly dispatched orders.",
  },
]

export default function WhyChooseUs() {
  return (
    <section
      className="w-full py-16 sm:py-20 bg-zinc-950 border-b border-zinc-800 text-white"
      aria-label="Why Choose Nutra Tein"
    >
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-red-400 drop-shadow-sm">
              The PROTEINX Difference
            </span>
            <RevealText
              text="Why Choose Us?"
              as="h2"
              size="custom"
              duration={0.35}
              stagger={0.02}
              className="section-title !justify-center !text-center !text-white drop-shadow-md"
            />
            <p className="section-subtitle mx-auto text-zinc-300">
              Built on transparency, scientific formulation, and uncompromised purity for genuine performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseCards.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card p-6 bg-black/55 backdrop-blur-md border border-white/10 hover:border-red-500/40 hover:bg-black/70 transition-all group shadow-xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-center text-brand-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
  )
}