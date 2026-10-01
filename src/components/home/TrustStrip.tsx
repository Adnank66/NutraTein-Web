import { ShieldCheck, Lock, Truck, RefreshCcw } from "lucide-react"

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Genuine Products",
    desc: "100% authentic sourced directly",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "256-bit SSL encrypted checkout",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Express 2-4 business days dispatch",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    desc: "7-day replacement guarantee",
  },
]

export default function TrustStrip() {
  return (
    <section className="bg-zinc-50 border-b border-zinc-200/60 py-6">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-sm">
                <Icon size={18} className="text-brand-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-900">{title}</h4>
                <p className="text-[11px] text-zinc-500 truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}